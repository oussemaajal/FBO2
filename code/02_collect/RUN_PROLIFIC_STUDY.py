"""
Create and manage Prolific studies for the FBO 2 (Selection Neglect) experiment.

Usage:
    python RUN_PROLIFIC_STUDY.py create-two-part --pilot  # Create Part 1, group, Part 2 (pilot)
    python RUN_PROLIFIC_STUDY.py create-two-part          # Create two-part study (full)
    python RUN_PROLIFIC_STUDY.py publish STUDY_ID          # Publish a created study
    python RUN_PROLIFIC_STUDY.py status STUDY_ID           # Check status & submissions
    python RUN_PROLIFIC_STUDY.py submissions STUDY_ID      # List all submissions
    python RUN_PROLIFIC_STUDY.py approve STUDY_ID          # Approve all awaiting submissions
    python RUN_PROLIFIC_STUDY.py bonus STUDY_ID            # Pay bonuses (auto from Google Sheets)
    python RUN_PROLIFIC_STUDY.py bonus STUDY_ID --csv FILE # Pay bonuses from manual CSV
    python RUN_PROLIFIC_STUDY.py pause STUDY_ID            # Pause an active study
    python RUN_PROLIFIC_STUDY.py list                      # List all studies

Options:
    --pilot       Use pilot sample sizes (20 per cell = 300 total)
    --dry-run     Preview without API calls
"""

import sys
import json
import argparse
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from config import PATHS, EXPERIMENT_PARAMS, PROLIFIC_CONFIG, SURVEY_CONFIG
from utils import ProlificClient, set_dry_run


def ensure_dirs():
    """Create output directories if they don't exist."""
    for key in ['prolific_data', 'responses']:
        PATHS[key].mkdir(parents=True, exist_ok=True)


def cmd_create_two_part(args):
    """Create the two-part study: participant group, Part 1, Part 2."""
    ensure_dirs()
    if args.dry_run:
        set_dry_run(True)

    mode = "PILOT" if args.pilot else "FULL"

    # Within-subject design: use flat --n count, or fall back to defaults
    if args.n is not None:
        total = args.n
    else:
        total = (EXPERIMENT_PARAMS.get('default_n_pilot', 60) if args.pilot
                 else EXPERIMENT_PARAMS.get('default_n_full', 250))

    survey_url = SURVEY_CONFIG.get('survey_url', 'https://oussemaajal.github.io/FBO2/')

    client = ProlificClient()

    # Step 1: Create participant group
    print("Step 1: Creating participant group for Part 2 eligibility...")
    group = client.create_participant_group(f"FBO2 {mode} - Part 1 Passed")
    group_id = group.get('id', 'unknown')
    print(f"  Group created: {group_id}")

    # Step 2: Create Part 1 study
    part1_url = (survey_url + "?part=1"
                 "&PROLIFIC_PID={{%PROLIFIC_PID%}}"
                 "&STUDY_ID={{%STUDY_ID%}}"
                 "&SESSION_ID={{%SESSION_ID%}}")

    part1_reward = EXPERIMENT_PARAMS['part1_reward_pence']
    part1_minutes = EXPERIMENT_PARAMS['estimated_time_part1_min']

    print(f"\nStep 2: Creating Part 1 study ({total} participants)...")
    print(f"  Reward: {part1_reward}p, Est. time: {part1_minutes} min")
    study1 = client.create_study(
        name=f"FBO2 {mode} Part 1: Learn the Fraud Audit Task",
        description=(
            "You will play the role of a government auditor. Learn how fraud audits "
            "of firms work and take a short comprehension quiz. "
            f"Takes about {part1_minutes} minutes. "
            f"You will be paid GBP {part1_reward/100:.2f} for this part. "
            "If you pass the quiz, you will be invited to Part 2 for base pay plus "
            "an accuracy-based bonus."
        ),
        external_study_url=part1_url,
        total_available_places=total,
        reward=part1_reward,
        estimated_completion_time=part1_minutes,
        completion_codes=[
            {"code": "PASS1SN", "code_type": "COMPLETED",
             "actions": [{"action": "APPROVE"}]},
            {"code": "FAIL1SN", "code_type": "COMPLETED",
             "actions": [{"action": "APPROVE"}]},
        ],
    )
    study1_id = study1.get('id', 'unknown')
    print(f"  Part 1 created: {study1_id}")

    # Step 3: Create Part 2 study (filtered to group members only)
    part2_url = (survey_url + "?part=2"
                 "&PROLIFIC_PID={{%PROLIFIC_PID%}}"
                 "&STUDY_ID={{%STUDY_ID%}}"
                 "&SESSION_ID={{%SESSION_ID%}}")

    part2_reward = EXPERIMENT_PARAMS['part2_reward_pence']
    part2_minutes = EXPERIMENT_PARAMS['estimated_time_part2_min']

    bonus_max_pence = EXPERIMENT_PARAMS.get('bonus_max_pence', 100)
    bonus_max_gbp = bonus_max_pence / 100

    print(f"\nStep 3: Creating Part 2 study (group-filtered)...")
    print(f"  Reward: {part2_reward}p, Est. time: {part2_minutes} min, "
          f"Bonus: up to GBP {bonus_max_gbp:.2f}")
    study2 = client.create_study(
        name=f"FBO2 {mode} Part 2: Fraud Audit Task",
        description=(
            "As a government auditor, review 9 firms and assign each a probability "
            "of fraud based on 4 transactions disclosed by the firm's manager. "
            f"Takes about {part2_minutes} minutes. "
            f"You will receive GBP {part2_reward/100:.2f} base payment "
            f"plus an accuracy bonus of up to GBP {bonus_max_gbp:.2f}."
        ),
        external_study_url=part2_url,
        total_available_places=total,
        reward=part2_reward,
        estimated_completion_time=part2_minutes,
        participant_group_id=group_id,
    )
    study2_id = study2.get('id', 'unknown')
    print(f"  Part 2 created: {study2_id}")

    # Save all IDs
    setup = {
        'mode': mode,
        'group_id': group_id,
        'part1_study_id': study1_id,
        'part2_study_id': study2_id,
        'total_participants': total,
        'design': 'within_subject_9_trials',
    }
    info_path = PATHS['prolific_data'] / f"two_part_setup_{mode.lower()}.json"
    with open(info_path, 'w') as f:
        json.dump(setup, f, indent=2, default=str)

    print(f"\n{'='*60}")
    print(f"Two-part study created successfully!")
    print(f"  Group ID:      {group_id}")
    print(f"  Part 1 Study:  {study1_id}")
    print(f"  Part 2 Study:  {study2_id}")
    print(f"  Setup saved:   {info_path}")
    print(f"\nNEXT STEPS:")
    print(f"  1. Set PROLIFIC_GROUP_ID = {group_id} in Google Apps Script properties")
    print(f"  2. Deploy survey to GitHub Pages")
    print(f"  3. Publish Part 2 first, then Part 1:")
    print(f"     python RUN_PROLIFIC_STUDY.py publish {study2_id}")
    print(f"     python RUN_PROLIFIC_STUDY.py publish {study1_id}")


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

    if args.dry_run:
        set_dry_run(True)

    client = ProlificClient()

    if args.csv:
        print(f"Reading bonuses from CSV: {args.csv}")
        result = client.pay_bonuses_from_csv(args.study_id, args.csv)
        print(f"\nDone. Paid {result['total_paid']} bonuses, "
              f"total GBP {result['total_amount_pence'] / 100:.2f}")
        return

    sheet_id = SURVEY_CONFIG.get('google_sheet_id')
    if not sheet_id:
        print("ERROR: google_sheet_id not set in config.py SURVEY_CONFIG.")
        print("  Either set it or provide --csv with a manual file.")
        return

    print(f"Downloading response data from Google Sheets...")
    export_url = f"https://docs.google.com/spreadsheets/d/{sheet_id}/export?format=csv"
    df = pd.read_csv(export_url)
    print(f"  Downloaded {len(df)} rows")

    bonus_col = 'bonus.amount'
    pid_col = 'prolificPID'

    if bonus_col not in df.columns:
        print(f"ERROR: Column '{bonus_col}' not found.")
        print(f"  Available: {[c for c in df.columns if 'bonus' in c.lower()]}")
        return

    if 'part' in df.columns:
        df = df[df['part'] == 2]
        print(f"  Filtered to Part 2: {len(df)} rows")

    df = df[[pid_col, bonus_col]].dropna()
    df[bonus_col] = pd.to_numeric(df[bonus_col], errors='coerce')
    df = df.dropna()
    df = df[df[bonus_col] > 0]

    if df.empty:
        print("No participants with positive bonus found.")
        return

    df['bonus_pence'] = (df[bonus_col] * 100).round().astype(int)

    print(f"\nBonus summary ({len(df)} participants):")
    print(f"  Mean: GBP {df[bonus_col].mean():.2f}")
    print(f"  Min:  GBP {df[bonus_col].min():.2f}")
    print(f"  Max:  GBP {df[bonus_col].max():.2f}")
    print(f"  Total: GBP {df[bonus_col].sum():.2f}")

    csv_path = PATHS['prolific_data'] / f"bonuses_{args.study_id}.csv"
    df.to_csv(csv_path, index=False)
    print(f"\n  Bonus CSV saved: {csv_path}")

    confirm = input(f"\nPay {len(df)} bonuses totaling GBP {df[bonus_col].sum():.2f}? [y/N] ")
    if confirm.lower() != 'y':
        print("Cancelled.")
        return

    paid = 0
    for _, row in df.iterrows():
        client.pay_bonus(args.study_id, row[pid_col], int(row['bonus_pence']))
        paid += 1
    print(f"\nPaid {paid} bonuses.")


def main():
    parser = argparse.ArgumentParser(description="FBO 2 Prolific Study Manager")
    subparsers = parser.add_subparsers(dest='command')

    # create-two-part
    p = subparsers.add_parser('create-two-part', help='Create two-part study')
    p.add_argument('--pilot', action='store_true',
                   help='Use pilot default count (60) instead of full (250)')
    p.add_argument('--n', type=int, default=None,
                   help='Explicit total participant count (overrides pilot/full default)')
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
        'create-two-part': cmd_create_two_part,
        'list': cmd_list,
        'publish': cmd_publish,
        'pause': cmd_pause,
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
