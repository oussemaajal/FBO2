"""
Create and manage Prolific studies for the FBO 2 (Selection Neglect) experiment.

Single-study design (v4.x): one Prolific study containing the full survey
(instructions + quiz + 5 practice trials + 30 scored trials + debrief).
No more Part 1 / Part 2 split, no participant group, no allowlist filter.

Usage:
    python RUN_PROLIFIC_STUDY.py create --pilot   # Create pilot study (default 20 participants)
    python RUN_PROLIFIC_STUDY.py create            # Create full study (default 250 participants)
    python RUN_PROLIFIC_STUDY.py create --n 50     # Override with custom count
    python RUN_PROLIFIC_STUDY.py publish STUDY_ID  # Publish a created draft
    python RUN_PROLIFIC_STUDY.py status STUDY_ID   # Check status & submissions
    python RUN_PROLIFIC_STUDY.py submissions STUDY_ID  # List all submissions
    python RUN_PROLIFIC_STUDY.py approve STUDY_ID  # Approve all awaiting submissions
    python RUN_PROLIFIC_STUDY.py bonus STUDY_ID    # Pay bonuses (auto from Google Sheets)
    python RUN_PROLIFIC_STUDY.py bonus STUDY_ID --csv FILE  # Pay bonuses from manual CSV
    python RUN_PROLIFIC_STUDY.py pause STUDY_ID    # Pause an active study
    python RUN_PROLIFIC_STUDY.py list              # List all studies

Options:
    --pilot       Use pilot sample size (EXPERIMENT_PARAMS['default_n_pilot'])
    --n N         Override the default with an explicit participant count
    --loose       Drop background screeners (education + subject)
    --no-screeners Disable all pre-screens
    --dry-run     Preview without API calls
"""

import sys
import re
import json
import argparse
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from config import PATHS, EXPERIMENT_PARAMS, PROLIFIC_CONFIG, SURVEY_CONFIG, load_api_key
from utils import ProlificClient, set_dry_run


# (patch_part2_study_url was removed with the single-study refactor.
# There's no Part 2 URL to sync; the participant-facing survey URL is
# static and built from SURVEY_CONFIG['survey_url'].)


def ensure_dirs():
    """Create output directories if they don't exist."""
    for key in ['prolific_data', 'responses']:
        PATHS[key].mkdir(parents=True, exist_ok=True)


# =============================================================================
# PROLIFIC SCREENERS
# =============================================================================
#
# Prolific uses "filter_id" codes for pre-screens. Filter IDs are the stable
# string keys used by Prolific's UI. See:
#   https://docs.prolific.com/docs/api-docs/public/#tag/Studies/operation/CreateStudy
# When a filter_id isn't recognized by Prolific the API throws 400 -- easy
# to diagnose from the response body.

def get_recommended_filters(loose: bool = False) -> list:
    """Return the recommended pre-screen filters for FBO 2.

    Current baseline (as of 2026-04-20 pilot edit by Oussema):
      Quality
      - Approval rate 95%+
      - 100+ prior approved submissions (experience)
      - Age 18+
      Ability
      - English as FIRST language (stricter than fluency)
      - Reasoning Exam Score 70+ (top ~30% of reasoners)

    Dropped from earlier baseline: fluent-languages (replaced by stricter
    first-language), highest-education-level-completed, subject. Country
    filter is also not used -- first-language is a stronger proxy.

    --loose drops the two ability filters (first-language + reasoning),
    keeping only the three quality filters. Use for larger samples where
    generalizability matters more than tight selection.

    For bot / AI mitigation: handled inside the survey (honeypot, AI trap,
    BotDetector). The approval rate + 100-submission threshold already weeds
    out most automated accounts; Prolific does not expose an "is human"
    filter explicitly.
    """
    filters = [
        # ── Quality (always on) ──
        # Approval rate 95-100%
        {"filter_id": "approval_rate", "selected_range": {"lower": 95, "upper": 100}},

        # At least 100 prior approved submissions (experience)
        {"filter_id": "approval_numbers", "selected_range": {"lower": 100, "upper": 100000}},

        # Age 18+ (Prolific's default minimum; explicit here for clarity)
        {"filter_id": "age", "selected_range": {"lower": 18, "upper": 100}},
    ]

    if not loose:
        # ── Ability (default on, dropped by --loose) ──
        # English as first language -- native-level reading comprehension
        # for the instructions and scenario text.
        filters.append({
            "filter_id": "first-language",
            "selected_values": ["English"],
        })

        # Reasoning Exam Score 70+ (top ~30% of reasoners).
        # Range is 0-100; participants take a standardized reasoning test.
        filters.append({
            "filter_id": "reasoning-exam-score",
            "selected_range": {"lower": 70, "upper": 100},
        })

    return filters


def cmd_create(args):
    """Create the single-study Prolific draft (NOT published)."""
    ensure_dirs()
    if args.dry_run:
        set_dry_run(True)

    mode = "PILOT" if args.pilot else "FULL"

    if args.n is not None:
        total = args.n
    else:
        total = (EXPERIMENT_PARAMS.get('default_n_pilot', 20) if args.pilot
                 else EXPERIMENT_PARAMS.get('default_n_full', 250))

    survey_url = SURVEY_CONFIG.get('survey_url', 'https://oussemaajal.github.io/FBO2/survey/')

    # Build the screener filter set (sampling methodology unchanged).
    if args.no_screeners:
        screeners = []
        print("Screeners: OFF (--no-screeners)")
    else:
        screeners = get_recommended_filters(loose=args.loose)
        label = "LOOSE (quality only)" if args.loose else "baseline (quality + ability)"
        print(f"Screeners: {label} ({len(screeners)} filters)")
        for f in screeners:
            fid = f.get('filter_id', '?')
            if 'selected_range' in f:
                rng = f['selected_range']
                print(f"   - {fid}: {rng.get('lower')}..{rng.get('upper')}")
            else:
                vals = f.get('selected_values', [])
                shown = ', '.join(vals[:3]) + (f', ... ({len(vals)} total)' if len(vals) > 3 else '')
                print(f"   - {fid}: {shown}")

    client = ProlificClient()

    study_url = (survey_url
                 + "?PROLIFIC_PID={{%PROLIFIC_PID%}}"
                 + "&STUDY_ID={{%STUDY_ID%}}"
                 + "&SESSION_ID={{%SESSION_ID%}}")

    reward = EXPERIMENT_PARAMS['reward_minor']              # base pay, minor units
    bonus_max = EXPERIMENT_PARAMS.get('bonus_max_minor', 0)  # bonus cap on top of base
    minutes = EXPERIMENT_PARAMS.get('estimated_time_min', 20)
    code = EXPERIMENT_PARAMS.get('completion_code', 'COMP2SN')
    reward_dollars = reward / 100
    bonus_dollars = bonus_max / 100

    print(f"\nCreating study ({total} participants, mode={mode})...")
    print(f"  Reward:    {reward} minor units  (${reward_dollars:.2f} base pay)")
    print(f"  Bonus cap: {bonus_max} minor units  (${bonus_dollars:.2f} max)")
    print(f"  Est time:  {minutes} min")
    print(f"  Code:      {code}")
    print(f"  URL:       {study_url}")

    study = client.create_study(
        name=f"Decision-Making Study: Auditing [{mode}]",
        description=(
            "A short study on decision-making under uncertainty. You will play the role of "
            "a government auditor reviewing companies' transactions and estimating their "
            "fraud rate. "
            f"Takes about {minutes} minutes. "
            f"Base pay: ${reward_dollars:.2f}. Accuracy bonus: up to ${bonus_dollars:.2f}."
        ),
        external_study_url=study_url,
        total_available_places=total,
        reward=reward,
        estimated_completion_time=minutes,
        completion_codes=[
            {"code": code, "code_type": "COMPLETED",
             "actions": [{"action": "AUTOMATICALLY_APPROVE"}]},
        ],
        filters=screeners,
    )
    study_id = study.get('id', 'unknown')
    print(f"\n  Study created: {study_id}")

    setup = {
        'mode': mode,
        'study_id': study_id,
        'total_participants': total,
        'reward_minor': reward,
        'bonus_max_minor': bonus_max,
        'completion_code': code,
        'survey_url': survey_url,
        'design': 'single_study_30_scored_trials_v4',
    }
    info_path = PATHS['prolific_data'] / f"prolific_setup_{mode.lower()}.json"
    with open(info_path, 'w') as f:
        json.dump(setup, f, indent=2, default=str)

    print(f"\n{'='*60}")
    print(f"Study created (DRAFT, not published).")
    print(f"  Study ID:     {study_id}")
    print(f"  Participants: {total}")
    print(f"  Setup saved:  {info_path}")
    print(f"\nNEXT STEPS:")
    print(f"  1. Preview in Prolific UI: https://app.prolific.com/researcher/studies/{study_id}")
    print(f"  2. When ready to launch, publish:")
    print(f"     python RUN_PROLIFIC_STUDY.py publish {study_id}")


def cmd_list(args):
    """List all studies."""
    client = ProlificClient()
    studies = client.list_studies()
    print(f"Found {len(studies)} studies:\n")
    for s in studies:
        print(f"  [{s.get('status', '?'):12s}] {s.get('name', '?')}")
        print(f"    ID: {s.get('id', '?')}")
        print(f"    Places: {s.get('total_available_places', '?')}")
        print()


def cmd_publish(args):
    """Publish an existing study."""
    if args.dry_run:
        set_dry_run(True)
    client = ProlificClient()
    result = client.publish_study(args.study_id)
    print(f"Study {args.study_id} published. Status: {result.get('status')}")


def cmd_pause(args):
    """Pause an active study."""
    if args.dry_run:
        set_dry_run(True)
    client = ProlificClient()
    result = client.pause_study(args.study_id)
    print(f"Study {args.study_id} paused. Status: {result.get('status')}")


def cmd_delete(args):
    """Delete an UNPUBLISHED study."""
    if args.dry_run:
        set_dry_run(True)
    client = ProlificClient()
    client.delete_study(args.study_id)
    print(f"Study {args.study_id} deleted.")


def cmd_status(args):
    """Check study status."""
    client = ProlificClient()
    study = client.get_study_status(args.study_id)
    print(f"Study: {study.get('name')}")
    print(f"Status: {study.get('status')}")
    print(f"Places: {study.get('total_available_places')}")
    print(f"Started: {study.get('started_datetime', 'N/A')}")

    subs = client.list_submissions(args.study_id)
    statuses = {}
    for s in subs:
        st = s.get('status', 'unknown')
        statuses[st] = statuses.get(st, 0) + 1
    print(f"\nSubmissions ({len(subs)} total):")
    for st, count in sorted(statuses.items()):
        print(f"  {st}: {count}")


def cmd_submissions(args):
    """List all submissions."""
    client = ProlificClient()
    subs = client.list_submissions(args.study_id)
    print(f"Submissions for study {args.study_id} ({len(subs)} total):\n")
    for s in subs:
        pid = s.get('participant_id', s.get('participant', '?'))
        status = s.get('status', '?')
        time_taken = s.get('time_taken', '?')
        print(f"  [{status:16s}] PID: {pid}  Time: {time_taken}s")


def cmd_approve(args):
    """Approve all awaiting submissions."""
    if args.dry_run:
        set_dry_run(True)
    client = ProlificClient()
    count = client.approve_all_submissions(args.study_id)
    print(f"Approved {count} submissions for study {args.study_id}")


def cmd_bonus(args):
    """Pay bonuses -- auto-download from Google Sheets or use a CSV file."""
    import pandas as pd
    import io

    if args.dry_run:
        set_dry_run(True)

    client = ProlificClient()

    if args.csv:
        print(f"Reading bonuses from CSV: {args.csv}")
        result = client.pay_bonuses_from_csv(args.study_id, args.csv)
        print(f"\nDone. Paid {result['total_paid']} bonuses, "
              f"total ${result['total_amount_pence'] / 100:.2f}")
        return

    # Pull the sheet data through the Apps Script web app (gated by
    # READ_TOKEN), same as FETCH_RESPONSES.py. The earlier implementation
    # tried `https://docs.google.com/.../export?format=csv` directly, which
    # returns HTTP 401 because the sheet isn't publicly viewable on purpose
    # (responses contain Prolific PIDs).
    sys.path.insert(0, str(Path(__file__).parent))
    from FETCH_RESPONSES import fetch_sheet  # noqa: E402

    token = load_api_key(SURVEY_CONFIG.get('sheet_read_token_env',
                                          'FBO2_SHEET_READ_TOKEN'))
    if not token:
        print("ERROR: FBO2_SHEET_READ_TOKEN not set in .env.")
        print("  Required for reading the Google Sheet via the Apps Script endpoint.")
        print("  Either set it (matching the Apps Script Script Properties value)")
        print("  or provide --csv with a manual file dump.")
        return

    print(f"Downloading response data via Apps Script endpoint...")
    csv_text = fetch_sheet(token, fmt="csv")
    df = pd.read_csv(io.StringIO(csv_text))
    print(f"  Downloaded {len(df)} rows, {len(df.columns)} columns")

    # The Apps Script flattens nested keys with underscores, so survey-side
    # `bonus.amount` becomes column `bonus_amount` in the sheet. The PID is
    # written under both `prolific_pid` (snake) and `prolificPID` (camel)
    # — prefer the snake_case one which is the canonical column. Fall back
    # to camel if the snake column is somehow absent.
    bonus_col = 'bonus_amount'
    pid_col = 'prolific_pid' if 'prolific_pid' in df.columns else 'prolificPID'

    if bonus_col not in df.columns:
        print(f"ERROR: Column '{bonus_col}' not found.")
        print(f"  Available bonus-like cols: {[c for c in df.columns if 'bonus' in c.lower()]}")
        return
    if pid_col not in df.columns:
        print(f"ERROR: Neither 'prolific_pid' nor 'prolificPID' column found.")
        return

    # Filter out bot-detected submissions: those participants forfeited
    # the survey on AI-honeypot trigger and don't get a completion code,
    # so they shouldn't get a bonus either. The column is `bot_detected`
    # (boolean) when the new abort path fires; absent or False otherwise.
    n_before = len(df)
    if 'bot_detected' in df.columns:
        df = df[df['bot_detected'].fillna(False).astype(str).str.lower() != 'true']
        n_filtered = n_before - len(df)
        if n_filtered:
            print(f"  Skipped {n_filtered} bot-detected submission(s) — no bonus paid.")

    # Every row with a positive bonus is a completed submission worth paying.
    df = df[[pid_col, bonus_col]].dropna()
    df[bonus_col] = pd.to_numeric(df[bonus_col], errors='coerce')
    df = df.dropna()
    df = df[df[bonus_col] > 0]

    if df.empty:
        print("No participants with positive bonus found.")
        return

    # bonus_amount is in dollars; Prolific API expects minor units (cents).
    df['bonus_minor'] = (df[bonus_col] * 100).round().astype(int)

    print(f"\nBonus summary ({len(df)} participants):")
    print(f"  Mean: ${df[bonus_col].mean():.2f}")
    print(f"  Min:  ${df[bonus_col].min():.2f}")
    print(f"  Max:  ${df[bonus_col].max():.2f}")
    print(f"  Total: ${df[bonus_col].sum():.2f}")

    csv_path = PATHS['prolific_data'] / f"bonuses_{args.study_id}.csv"
    df.to_csv(csv_path, index=False)
    print(f"\n  Bonus CSV saved: {csv_path}")

    confirm = input(f"\nPay {len(df)} bonuses totaling ${df[bonus_col].sum():.2f}? [y/N] ")
    if confirm.lower() != 'y':
        print("Cancelled.")
        return

    paid = 0
    for _, row in df.iterrows():
        client.pay_bonus(args.study_id, row[pid_col], int(row['bonus_minor']))
        paid += 1
    print(f"\nPaid {paid} bonuses.")


def main():
    parser = argparse.ArgumentParser(description="FBO 2 Prolific Study Manager")
    subparsers = parser.add_subparsers(dest='command')

    # create (single study)
    p = subparsers.add_parser('create', help='Create a single-study Prolific draft')
    p.add_argument('--pilot', action='store_true',
                   help='Use pilot default count (20) instead of full (250)')
    p.add_argument('--n', type=int, default=None,
                   help='Explicit total participant count (overrides pilot/full default)')
    p.add_argument('--no-screeners', action='store_true',
                   help='Disable ALL pre-screen filters (open to every Prolific user)')
    p.add_argument('--loose', action='store_true',
                   help='Drop background filters (education + subject); keep only quality + language')
    p.add_argument('--dry-run', action='store_true')

    # list
    subparsers.add_parser('list', help='List all studies')

    # publish
    p = subparsers.add_parser('publish', help='Publish a study')
    p.add_argument('study_id')
    p.add_argument('--dry-run', action='store_true')

    # pause
    p = subparsers.add_parser('pause', help='Pause a study')
    p.add_argument('study_id')
    p.add_argument('--dry-run', action='store_true')

    # delete (UNPUBLISHED only)
    p = subparsers.add_parser('delete', help='Delete an UNPUBLISHED study')
    p.add_argument('study_id')
    p.add_argument('--dry-run', action='store_true')

    # status
    p = subparsers.add_parser('status', help='Check study status')
    p.add_argument('study_id')

    # submissions
    p = subparsers.add_parser('submissions', help='List submissions')
    p.add_argument('study_id')

    # approve
    p = subparsers.add_parser('approve', help='Approve all awaiting')
    p.add_argument('study_id')
    p.add_argument('--dry-run', action='store_true')

    # bonus
    p = subparsers.add_parser('bonus', help='Pay bonuses')
    p.add_argument('study_id')
    p.add_argument('--csv', default=None)
    p.add_argument('--dry-run', action='store_true')

    args = parser.parse_args()

    commands = {
        'create': cmd_create,
        'list': cmd_list,
        'publish': cmd_publish,
        'pause': cmd_pause,
        'delete': cmd_delete,
        'status': cmd_status,
        'submissions': cmd_submissions,
        'approve': cmd_approve,
        'bonus': cmd_bonus,
    }

    if args.command in commands:
        commands[args.command](args)
    else:
        parser.print_help()


if __name__ == '__main__':
    main()
