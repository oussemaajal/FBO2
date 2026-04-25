"""
FBO 2 -- Fetch survey responses from the Google Sheet via the Apps Script web app,
optionally merged with Prolific submission metadata + demographics.

Usage:
    python FETCH_RESPONSES.py                          # print summary
    python FETCH_RESPONSES.py --csv out.csv            # save full CSV
    python FETCH_RESPONSES.py --json out.json          # save full JSON
    python FETCH_RESPONSES.py --limit 20               # most recent 20 rows
    python FETCH_RESPONSES.py --sheet "old answers"    # different sheet/tab

  With Prolific merge:
    python FETCH_RESPONSES.py --csv out.csv --merge-prolific \
           --prolific-study 69ebd97bcfcdcb708a5b1a6c \
           [--prolific-demographics demographics.csv]

The --merge-prolific flag pulls submission metadata (status, time_taken, IP,
bonus_payments, etc.) from Prolific's API and joins it to the sheet rows by
participant_id. Columns are prefixed `prolific_`.

Demographic data (age, sex, country, fluent languages, education, etc.) is
NOT exposed by Prolific's REST API. To merge it, manually download
"Demographic data" CSV from the Prolific dashboard for the study, then pass
it via --prolific-demographics. Columns from that CSV are also prefixed
`prolific_` (e.g., `prolific_age`, `prolific_sex`).

The Apps Script deployment exposes a GET endpoint that requires a shared-secret
token. The token is read from:
  1. env var FBO2_SHEET_READ_TOKEN, or
  2. .env file at the project root (key FBO2_SHEET_READ_TOKEN), or
  3. --token <value> CLI flag.
"""
import argparse
import csv
import io
import json
import sys
import urllib.parse
import urllib.request
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from config import SURVEY_CONFIG, load_api_key  # noqa: E402


# ============================================================================
# Sheet fetch (Apps Script web app)
# ============================================================================

def fetch_sheet(token: str, fmt: str = "json", limit: int | None = None,
                sheet: str | None = None):
    endpoint = SURVEY_CONFIG["data_endpoint"]
    if not endpoint:
        raise SystemExit("SURVEY_CONFIG['data_endpoint'] is empty.")

    params = {"token": token, "format": fmt}
    if limit:
        params["limit"] = str(int(limit))
    if sheet:
        params["sheet"] = sheet

    url = endpoint + "?" + urllib.parse.urlencode(params)
    req = urllib.request.Request(url, headers={"User-Agent": "FBO2-fetch/1.0"})
    with urllib.request.urlopen(req, timeout=60) as resp:
        raw = resp.read().decode("utf-8")

    if fmt == "csv":
        return raw
    return json.loads(raw)


# ============================================================================
# Prolific submission metadata
# ============================================================================

# Fields from each submission record we want to surface in the merged output.
# These come from Prolific's /api/v1/studies/{id}/submissions/ endpoint and
# are common to all study types (QUOTA, BALANCED, etc.). Demographics are
# NOT in this payload — those need the dashboard CSV (see --prolific-demographics).
_PROLIFIC_SUBMISSION_FIELDS = [
    "status",                # APPROVED / AWAITING REVIEW / REJECTED / RETURNED / TIMED-OUT
    "started_at",
    "completed_at",
    "is_complete",
    "time_taken",            # seconds
    "reward",                # cents (matches study reward at the time of submission)
    "bonus_payments",        # list of cents amounts
    "study_code",            # the completion code participant entered (NOCODE if none)
    "ip",
    "has_siblings",
    "return_requested",
    "strata",                # QUOTA studies: which stratum bucket the participant fell into
]


def fetch_prolific_submissions(study_ids: list[str]) -> dict[str, dict]:
    """
    Returns {participant_id: {fields...}} merged across all given study IDs.
    Later studies override earlier ones if a participant_id appears twice
    (shouldn't happen in practice).
    """
    # Lazy-import so the script still works for sheet-only fetches even if
    # PROLIFIC_API_TOKEN isn't set.
    sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
    from utils import ProlificClient

    client = ProlificClient()
    by_pid = {}
    for sid in study_ids:
        try:
            payload = client._get(f"studies/{sid}/submissions/")
        except Exception as e:
            print(f"[warn] Prolific submissions fetch failed for {sid}: {e}",
                  file=sys.stderr)
            continue
        subs = payload.get("results", [])
        for s in subs:
            pid = s.get("participant_id")
            if not pid:
                continue
            row = {"prolific_study_id": sid}
            for f in _PROLIFIC_SUBMISSION_FIELDS:
                v = s.get(f)
                # Lists/dicts get JSON-stringified so the CSV stays flat.
                if isinstance(v, (list, dict)):
                    v = json.dumps(v) if v else ""
                row[f"prolific_{f}"] = v if v is not None else ""
            by_pid[pid] = row
    return by_pid


# ============================================================================
# Prolific demographics CSV (manual export from dashboard)
# ============================================================================

def parse_prolific_demographics_csv(path: Path) -> dict[str, dict]:
    """
    Parses a Prolific dashboard demographic-export CSV. The dashboard
    typically gives a `Participant id` column; rest are demographic fields.
    Returns {participant_id: {prolific_<field>: value}}.

    Tolerant to column-name variants:
      - "Participant id" / "participant_id" / "Participant ID" -> all work
      - All other columns are kept and prefixed `prolific_` after lowercasing
        and snake-casing.
    """
    if not path.exists():
        raise SystemExit(f"Demographics CSV not found: {path}")

    text = path.read_text(encoding="utf-8-sig")  # handle BOM
    reader = csv.DictReader(io.StringIO(text))

    pid_aliases = ["Participant id", "participant_id", "Participant ID",
                   "PROLIFIC_PID", "prolific_pid", "Prolific PID"]

    by_pid = {}
    for row in reader:
        pid = None
        for alias in pid_aliases:
            if alias in row and row[alias]:
                pid = row[alias].strip()
                break
        if not pid:
            continue

        cleaned = {}
        for k, v in row.items():
            if k in pid_aliases:
                continue
            if v is None:
                v = ""
            key = "prolific_" + (k.strip().lower()
                                .replace(" ", "_")
                                .replace("-", "_")
                                .replace("/", "_")
                                .replace("?", "")
                                .replace("(", "").replace(")", ""))
            cleaned[key] = v
        by_pid[pid] = cleaned

    return by_pid


# ============================================================================
# Merge logic
# ============================================================================

def merge_into_rows(rows: list[dict], headers: list[str],
                    prolific_by_pid: dict[str, dict],
                    demographics_by_pid: dict[str, dict]) -> tuple[list[dict], list[str]]:
    """
    Adds prolific_* columns to each sheet row (joining by `prolific_pid`),
    extends the header list, and returns (new_rows, new_headers).
    """
    if not prolific_by_pid and not demographics_by_pid:
        return rows, headers

    # Build the union of new column names so headers stay stable across rows
    new_cols = set()
    for d in prolific_by_pid.values():
        new_cols.update(d.keys())
    for d in demographics_by_pid.values():
        new_cols.update(d.keys())

    # Place new columns after the existing prolific_pid column (or at the end).
    new_cols_sorted = sorted(new_cols)
    new_headers = list(headers) + [c for c in new_cols_sorted if c not in headers]

    n_matched = 0
    for r in rows:
        pid = (r.get("prolific_pid") or "").strip()
        if not pid:
            continue
        prol = prolific_by_pid.get(pid)
        demo = demographics_by_pid.get(pid)
        if prol or demo:
            n_matched += 1
        if prol:
            r.update(prol)
        if demo:
            r.update(demo)

    print(f"  Matched {n_matched} of {len(rows)} sheet rows to Prolific records",
          file=sys.stderr)
    return rows, new_headers


# ============================================================================
# Output writers
# ============================================================================

def write_csv(rows: list[dict], headers: list[str], path: Path):
    with path.open("w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=headers, extrasaction="ignore")
        writer.writeheader()
        for r in rows:
            writer.writerow(r)


# ============================================================================
# CLI
# ============================================================================

def main():
    p = argparse.ArgumentParser(description="Fetch FBO 2 survey responses.")
    p.add_argument("--token", default=None, help="READ_TOKEN (overrides env/.env).")
    p.add_argument("--csv", metavar="PATH", help="Write full CSV to PATH.")
    p.add_argument("--json", metavar="PATH", help="Write full JSON to PATH.")
    p.add_argument("--limit", type=int, default=None, help="Most recent N rows only.")
    p.add_argument("--sheet", default=None, help="Sheet/tab name (default: active sheet).")
    p.add_argument("--merge-prolific", action="store_true",
                   help="Also fetch Prolific submission metadata and join by participant_id.")
    p.add_argument("--prolific-study", action="append", default=[],
                   metavar="STUDY_ID",
                   help="Prolific study ID to pull submissions from. Repeat for multiple.")
    p.add_argument("--prolific-demographics", default=None, metavar="CSV_PATH",
                   help="Path to a Prolific demographic-export CSV. Columns become prolific_*.")
    args = p.parse_args()

    token = args.token or load_api_key(
        SURVEY_CONFIG.get("sheet_read_token_env", "FBO2_SHEET_READ_TOKEN"))
    if not token:
        raise SystemExit(
            "No READ_TOKEN. Set FBO2_SHEET_READ_TOKEN in .env (or pass --token) "
            "and ensure READ_TOKEN matches in the Apps Script Script Properties."
        )

    # Fast-path: --csv with no merge → stream raw CSV from the server.
    # If merging is requested we always go through JSON to splice in the
    # Prolific columns row-by-row.
    merging = args.merge_prolific or args.prolific_demographics

    if args.csv and not merging:
        csv_text = fetch_sheet(token, fmt="csv", limit=args.limit, sheet=args.sheet)
        Path(args.csv).write_text(csv_text, encoding="utf-8")
        print(f"Wrote CSV -> {args.csv}")
        return

    payload = fetch_sheet(token, fmt="json", limit=args.limit, sheet=args.sheet)
    if payload.get("status") != "ok":
        raise SystemExit(f"Server error: {payload}")

    if "rows" not in payload or "headers" not in payload:
        raise SystemExit(
            "Server returned the generic ping, not sheet data.\n"
            "READ_TOKEN mismatch — check Apps Script Script Properties vs .env."
        )

    rows = payload.get("rows", [])
    headers = payload.get("headers", [])

    if merging:
        prolific_by_pid = {}
        demo_by_pid = {}

        if args.merge_prolific:
            if not args.prolific_study:
                raise SystemExit(
                    "--merge-prolific requires at least one --prolific-study STUDY_ID."
                )
            print(f"  Pulling Prolific submissions for {len(args.prolific_study)} study/studies...",
                  file=sys.stderr)
            prolific_by_pid = fetch_prolific_submissions(args.prolific_study)
            print(f"  Got {len(prolific_by_pid)} Prolific submission records",
                  file=sys.stderr)

        if args.prolific_demographics:
            print(f"  Reading demographics from {args.prolific_demographics}...",
                  file=sys.stderr)
            demo_by_pid = parse_prolific_demographics_csv(Path(args.prolific_demographics))
            print(f"  Got {len(demo_by_pid)} demographic records",
                  file=sys.stderr)

        rows, headers = merge_into_rows(rows, headers, prolific_by_pid, demo_by_pid)

    if args.csv:
        write_csv(rows, headers, Path(args.csv))
        print(f"Wrote CSV -> {args.csv}  ({len(rows)} rows, {len(headers)} cols)")
        return

    if args.json:
        out = {
            "status": payload.get("status"),
            "sheet": payload.get("sheet"),
            "headers": headers,
            "rows": rows,
        }
        Path(args.json).write_text(json.dumps(out, indent=2), encoding="utf-8")
        print(f"Wrote JSON -> {args.json}")
        return

    # Default: small summary
    print(f"Sheet: {payload.get('sheet')}")
    print(f"Rows:  {len(rows)}")
    print(f"Cols:  {len(headers)}")
    if rows:
        latest = rows[-1]
        print("\nLatest row (selected fields):")
        for k in [
            "submission_time_utc", "prolific_pid",
            "consent_agreed", "quiz_num_correct", "quiz_passed",
            "quiz_retake_count", "comprehension_attempts",
            "attn_passed_total", "total_duration_sec",
            "bot_detected",
            # Prolific-merged fields (if --merge-prolific was used)
            "prolific_status", "prolific_time_taken", "prolific_strata",
            "prolific_age", "prolific_sex", "prolific_country_of_residence",
        ]:
            if k in latest:
                print(f"  {k:32s} = {latest[k]}")


if __name__ == "__main__":
    main()
