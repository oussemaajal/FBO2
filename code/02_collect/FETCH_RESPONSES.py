"""
FBO 2 -- Fetch survey responses from the Google Sheet via the Apps Script web app.

Usage:
    python FETCH_RESPONSES.py                   # print summary (counts, latest row)
    python FETCH_RESPONSES.py --csv out.csv     # save full CSV
    python FETCH_RESPONSES.py --json out.json   # save full JSON
    python FETCH_RESPONSES.py --limit 20        # only most recent 20 rows

The Apps Script deployment exposes a GET endpoint that requires a shared-secret
token. The token is read from:
  1. env var FBO2_SHEET_READ_TOKEN, or
  2. .env file at the project root (key FBO2_SHEET_READ_TOKEN), or
  3. --token <value> CLI flag.

Set the same token in the Apps Script project under:
  Project Settings > Script Properties > READ_TOKEN
"""
import argparse
import json
import sys
import urllib.parse
import urllib.request
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from config import SURVEY_CONFIG, load_api_key  # noqa: E402


def fetch(token: str, fmt: str = "json", limit: int | None = None, sheet: str | None = None):
    endpoint = SURVEY_CONFIG["data_endpoint"]
    if not endpoint:
        raise SystemExit("SURVEY_CONFIG['data_endpoint'] is empty. Set it in code/config.py.")

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


def main():
    p = argparse.ArgumentParser(description="Fetch FBO 2 survey responses from Google Sheet.")
    p.add_argument("--token", default=None, help="READ_TOKEN (overrides env/.env).")
    p.add_argument("--csv",   metavar="PATH", help="Write full CSV to PATH.")
    p.add_argument("--json",  metavar="PATH", help="Write full JSON to PATH.")
    p.add_argument("--limit", type=int, default=None, help="Only the most recent N rows.")
    p.add_argument("--sheet", default=None, help="Sheet/tab name (default: active sheet).")
    args = p.parse_args()

    token = args.token or load_api_key(SURVEY_CONFIG.get("sheet_read_token_env", "FBO2_SHEET_READ_TOKEN"))
    if not token:
        raise SystemExit(
            "No READ_TOKEN found. Set FBO2_SHEET_READ_TOKEN in .env "
            "(or pass --token) and also set READ_TOKEN in the Apps Script Script Properties."
        )

    if args.csv:
        csv_text = fetch(token, fmt="csv", limit=args.limit, sheet=args.sheet)
        Path(args.csv).write_text(csv_text, encoding="utf-8")
        print(f"Wrote CSV -> {args.csv}")
        return

    payload = fetch(token, fmt="json", limit=args.limit, sheet=args.sheet)
    if payload.get("status") != "ok":
        raise SystemExit(f"Server error: {payload}")

    if args.json:
        Path(args.json).write_text(json.dumps(payload, indent=2), encoding="utf-8")
        print(f"Wrote JSON -> {args.json}")
        return

    # Default: print a small summary
    rows = payload.get("rows", [])
    headers = payload.get("headers", [])
    print(f"Sheet: {payload.get('sheet')}")
    print(f"Rows:  {len(rows)}")
    print(f"Cols:  {len(headers)}")
    if rows:
        latest = rows[-1]
        print("\nLatest row (selected fields):")
        for k in [
            "submission_time_utc", "prolific_pid", "part",
            "consent_agreed", "quiz_num_correct", "quiz_passed",
            "quiz_retake_count", "comprehension_attempts",
            "attn_passed_total", "total_duration_sec",
        ]:
            if k in latest:
                print(f"  {k:28s} = {latest[k]}")


if __name__ == "__main__":
    main()
