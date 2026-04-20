"""
Utility functions for FBO 2 (Selection Neglect and Strategic Non-Disclosure).

Provides:
- Prolific API client (create study, publish, monitor, approve, pay bonuses)
- Dry-run mode
- DuckDB query helpers

Usage:
    from utils import ProlificClient, is_dry_run
"""

import csv
import json
import os
import sys
import logging
from pathlib import Path
from typing import Optional

import requests

# Import project config
sys.path.insert(0, str(Path(__file__).parent))
from config import PATHS, PROLIFIC_CONFIG, load_api_key

logger = logging.getLogger(__name__)


# =============================================================================
# DRY-RUN / TESTING MODE
# =============================================================================

DRY_RUN = os.environ.get("FBO_DRY_RUN", "false").lower() in ("true", "1", "yes")


def is_dry_run() -> bool:
    """Check if dry-run mode is active."""
    return DRY_RUN


def set_dry_run(enabled: bool = True):
    """Toggle dry-run mode."""
    global DRY_RUN
    DRY_RUN = enabled
    if enabled:
        print("[DRY-RUN MODE ENABLED] No API calls or file modifications will be made.")


# =============================================================================
# PROLIFIC API CLIENT
# =============================================================================

class ProlificClient:
    """
    Wrapper around Prolific's REST API.

    Usage:
        client = ProlificClient()
        study = client.create_study(name="FBO Pilot", ...)
        client.publish_study(study['id'])
        status = client.get_study_status(study['id'])
        client.approve_all_submissions(study['id'])
        client.pay_bonus(study['id'], participant_id, amount_pence)
    """

    def __init__(self):
        self.api_key = load_api_key(PROLIFIC_CONFIG['api_key_env'])
        self.base_url = PROLIFIC_CONFIG['base_url']
        self.workspace_id = load_api_key(PROLIFIC_CONFIG['workspace_id_env'])
        self.project_id = load_api_key(PROLIFIC_CONFIG['project_id_env'])

        if not self.api_key:
            logger.warning("Prolific API token not found. Set PROLIFIC_API_TOKEN.")

    def _headers(self) -> dict:
        return {
            'Authorization': f'Token {self.api_key}',
            'Content-Type': 'application/json',
        }

    def _get(self, endpoint: str, params: dict = None) -> dict:
        url = f"{self.base_url}/{endpoint}"
        resp = requests.get(url, headers=self._headers(), params=params)
        resp.raise_for_status()
        return resp.json()

    def _post(self, endpoint: str, data: dict = None) -> dict:
        url = f"{self.base_url}/{endpoint}"
        resp = requests.post(url, headers=self._headers(), json=data)
        if resp.status_code >= 400:
            print(f"\n[Prolific API error {resp.status_code}] POST {endpoint}")
            print(f"  Request body: {data}")
            print(f"  Response: {resp.text[:2000]}\n")
        resp.raise_for_status()
        return resp.json()

    # ── Study Management ──────────────────────────────────────────────

    def list_studies(self) -> list:
        """List all studies in the workspace."""
        result = self._get('studies/')
        return result.get('results', [])

    def create_study(
        self,
        name: str,
        description: str,
        external_study_url: str,
        completion_code: str = None,
        completion_codes: list = None,
        total_available_places: int = 80,
        reward: int = 150,
        estimated_completion_time: int = 10,
        eligibility_requirements: list = None,
        participant_group_id: str = None,
        filters: list = None,
        device_compatibility: list = None,
        study_labels: list = None,
    ) -> dict:
        """Create a new Prolific study. Returns study dict with 'id'.

        Args:
            completion_codes: List of dicts for multi-code studies, e.g.
                [{"code": "PASS1FBO", "code_type": "COMPLETED",
                  "actions": [{"action": "APPROVE"}]}]
            participant_group_id: Restrict to members of this group (allowlist).
            filters: Additional new-style filter dicts merged with the group
                allowlist (country, approval rate, etc.).
            device_compatibility: List of allowed devices. Accepted values:
                "desktop", "tablet", "mobile". Defaults to ["desktop"] so
                participants cannot take the study on phones/tablets.
            study_labels: List of Prolific study-type tags. Defaults to
                ["decision_making_task"] so the study shows up on participants'
                dashboards under the decision-making category. Other valid
                values: survey, writing_task, annotation, interview, other,
                ai_annotation, ai_evaluation, ai_reasoning, ai_fact_checking,
                ai_safety, ai_data_creation_text/audio/video/images, ai_other.
        """
        if device_compatibility is None:
            device_compatibility = ["desktop"]
        if study_labels is None:
            study_labels = ["decision_making_task"]

        if DRY_RUN:
            print(f"[DRY-RUN] Would create Prolific study: {name}")
            print(f"    Devices: {device_compatibility}")
            print(f"    Labels:  {study_labels}")
            if filters:
                print(f"    Filters: {len(filters)} screener(s)")
            return {'id': 'dry-run-study-id', 'name': name, 'status': 'UNPUBLISHED'}

        data = {
            'name': name,
            'description': description,
            'external_study_url': external_study_url,
            'prolific_id_option': 'url_parameters',
            'total_available_places': total_available_places,
            'reward': reward,
            'estimated_completion_time': estimated_completion_time,
            'device_compatibility': device_compatibility,
            'study_labels': study_labels,
        }

        # Only include project if your account uses workspaces/projects
        if self.project_id:
            data['project'] = self.project_id

        # Completion codes: multi-code (two-part) or single code
        if completion_codes:
            data['completion_codes'] = completion_codes
        else:
            data['completion_code'] = completion_code or PROLIFIC_CONFIG.get('completion_code', 'XXXXXX')
            data['completion_option'] = 'code'

        if eligibility_requirements:
            data['eligibility_requirements'] = eligibility_requirements

        # Merge filters: participant group allowlist + any additional screeners
        combined_filters = []
        if participant_group_id:
            combined_filters.append({
                'filter_id': 'participant_group_allowlist',
                'selected_values': [participant_group_id],
            })
        if filters:
            combined_filters.extend(filters)
        if combined_filters:
            # Translate label strings to Prolific's numeric ChoiceIDs
            data['filters'] = self._translate_filters(combined_filters)

        return self._post('studies/', data)

    def publish_study(self, study_id: str) -> dict:
        """Transition study from UNPUBLISHED to ACTIVE."""
        if DRY_RUN:
            print(f"[DRY-RUN] Would publish study {study_id}")
            return {'id': study_id, 'status': 'ACTIVE'}
        return self._post(f'studies/{study_id}/transition/', {'action': 'PUBLISH'})

    def pause_study(self, study_id: str) -> dict:
        """Pause an active study."""
        if DRY_RUN:
            print(f"[DRY-RUN] Would pause study {study_id}")
            return {'id': study_id, 'status': 'PAUSED'}
        return self._post(f'studies/{study_id}/transition/', {'action': 'PAUSE'})

    def delete_study(self, study_id: str) -> bool:
        """Delete an UNPUBLISHED study. Returns True on success."""
        if DRY_RUN:
            print(f"[DRY-RUN] Would delete study {study_id}")
            return True
        url = f"{self.base_url}/studies/{study_id}/"
        resp = requests.delete(url, headers=self._headers())
        if resp.status_code >= 400:
            print(f"\n[Prolific API error {resp.status_code}] DELETE studies/{study_id}/")
            print(f"  Response: {resp.text[:1000]}\n")
        resp.raise_for_status()
        return True

    def get_study_status(self, study_id: str) -> dict:
        """Get study status and submission counts."""
        return self._get(f'studies/{study_id}/')

    # ── Participant Groups ─────────────────────────────────────────────

    def _discover_workspace_id(self) -> str:
        """Auto-discover the default workspace ID via /workspaces/ endpoint.
        Caches the result on the instance."""
        if getattr(self, '_cached_workspace_id', None):
            return self._cached_workspace_id

        try:
            result = self._get('workspaces/')
            workspaces = result.get('results', [])
            if workspaces:
                wid = workspaces[0].get('id')
                self._cached_workspace_id = wid
                print(f"  Auto-discovered workspace_id: {wid}")
                return wid
        except Exception as e:
            print(f"  Could not auto-discover workspace: {e}")
        return None

    def _load_filter_metadata(self) -> dict:
        """Fetch and cache the Prolific filter catalog. Returns a dict
        {filter_id: {"label_to_id": {label: id}, "data_type": str}}."""
        if getattr(self, '_cached_filter_meta', None):
            return self._cached_filter_meta

        meta = {}
        try:
            result = self._get('filters/')
            for f in result.get('results', []):
                fid = f.get('filter_id')
                if not fid:
                    continue
                raw_choices = f.get('choices', {})
                # choices is a dict {id: label}; build reverse lookup
                if isinstance(raw_choices, dict):
                    label_to_id = {label: cid for cid, label in raw_choices.items()}
                else:
                    label_to_id = {}
                meta[fid] = {
                    'data_type': f.get('data_type'),
                    'label_to_id': label_to_id,
                }
            self._cached_filter_meta = meta
        except Exception as e:
            print(f"  Could not load filter metadata: {e}")
            self._cached_filter_meta = {}
        return self._cached_filter_meta

    def _translate_filters(self, filters: list) -> list:
        """Convert human-readable label strings in filter values to the
        numeric ChoiceIDs Prolific expects. Range filters pass through
        unchanged. Unknown labels raise with a helpful message."""
        if not filters:
            return filters

        meta = self._load_filter_metadata()
        translated = []

        for f in filters:
            fid = f.get('filter_id')
            # Range filters -- no translation needed
            if 'selected_range' in f:
                translated.append(f)
                continue

            values = f.get('selected_values', [])
            filter_info = meta.get(fid, {})

            # Only translate if this filter is ChoiceID-based
            if filter_info.get('data_type') == 'ChoiceID' and filter_info.get('label_to_id'):
                label_to_id = filter_info['label_to_id']
                new_values = []
                for v in values:
                    # If already a numeric string, pass through
                    if str(v).isdigit():
                        new_values.append(str(v))
                    elif v in label_to_id:
                        new_values.append(label_to_id[v])
                    else:
                        # Label not found -- show available options
                        available = list(label_to_id.keys())
                        sample = ', '.join(repr(x) for x in available[:10])
                        raise ValueError(
                            f"Filter '{fid}': value {v!r} not in Prolific's choice list. "
                            f"Available (first 10 of {len(available)}): {sample}"
                        )
                translated.append({**f, 'selected_values': new_values})
            else:
                # Not a ChoiceID filter, or metadata missing -- pass through
                translated.append(f)

        return translated

    def create_participant_group(self, name: str) -> dict:
        """Create a participant group. Returns dict with 'id'.

        Prolific requires a project, workspace, or organisation ID
        associated with every participant group. We auto-discover the
        workspace ID if not explicitly set in env vars.
        """
        if DRY_RUN:
            print(f"[DRY-RUN] Would create participant group: {name}")
            return {'id': 'dry-run-group-id', 'name': name}

        data = {'name': name}

        # Prefer explicit project_id if set
        if self.project_id:
            data['project_id'] = self.project_id
        # Else use explicit or auto-discovered workspace_id
        else:
            wid = self.workspace_id or self._discover_workspace_id()
            if wid:
                data['workspace_id'] = wid

        return self._post('participant-groups/', data)

    # ── Submissions ───────────────────────────────────────────────────

    def list_submissions(self, study_id: str) -> list:
        """List all submissions for a study."""
        result = self._get(f'studies/{study_id}/submissions/')
        return result.get('results', [])

    def approve_submission(self, submission_id: str) -> dict:
        """Approve a single submission."""
        if DRY_RUN:
            print(f"[DRY-RUN] Would approve submission {submission_id}")
            return {'id': submission_id, 'status': 'APPROVED'}
        return self._post(f'submissions/{submission_id}/transition/',
                          {'action': 'APPROVE'})

    def approve_all_submissions(self, study_id: str) -> int:
        """Approve all AWAITING_REVIEW submissions. Returns count approved."""
        submissions = self.list_submissions(study_id)
        approved = 0
        for sub in submissions:
            if sub.get('status') == 'AWAITING_REVIEW':
                self.approve_submission(sub['id'])
                approved += 1
        return approved

    # ── Bonus Payments ────────────────────────────────────────────────

    def pay_bonus(self, study_id: str, participant_id: str, amount_pence: int) -> dict:
        """Pay a bonus to a specific participant.

        Args:
            study_id: The Prolific study ID
            participant_id: The participant's Prolific PID
            amount_pence: Bonus amount in pence (e.g., 50 = GBP 0.50)
        """
        if DRY_RUN:
            print(f"[DRY-RUN] Would pay {amount_pence}p bonus to {participant_id}")
            return {'status': 'dry-run'}

        data = {
            'study_id': study_id,
            'csv_bonuses': [
                {
                    'participant_id': participant_id,
                    'amount': amount_pence,
                }
            ]
        }
        return self._post('submissions/bonus-payments/', data)

    def pay_bonuses_from_csv(self, study_id: str, csv_path: str) -> dict:
        """Pay bonuses from a CSV with columns: prolific_pid, bonus_pence."""
        import pandas as pd
        df = pd.read_csv(csv_path)
        required_cols = {'prolific_pid', 'bonus_pence'}
        if not required_cols.issubset(set(df.columns)):
            raise ValueError(f"CSV must have columns: {required_cols}. Found: {set(df.columns)}")

        df = df[df['bonus_pence'] > 0]

        total_paid = 0
        total_amount = 0
        errors = []

        for _, row in df.iterrows():
            pid = row['prolific_pid']
            amount = int(row['bonus_pence'])
            try:
                self.pay_bonus(study_id, pid, amount)
                total_paid += 1
                total_amount += amount
                print(f"  Paid {amount}p to {pid}")
            except Exception as e:
                errors.append({'pid': pid, 'amount': amount, 'error': str(e)})
                print(f"  ERROR paying {pid}: {e}")

        print(f"\nBonus payment summary:")
        print(f"  Paid: {total_paid} participants")
        print(f"  Total: {total_amount}p (GBP {total_amount / 100:.2f})")
        if errors:
            print(f"  Errors: {len(errors)}")

        return {
            'total_paid': total_paid,
            'total_amount_pence': total_amount,
            'errors': errors,
        }

    # ── Demographics ──────────────────────────────────────────────────

    def get_demographics(self, study_id: str) -> list:
        """Get participant demographics for all submissions."""
        submissions = self.list_submissions(study_id)
        demographics = []
        for sub in submissions:
            participant_id = sub.get('participant_id', sub.get('participant', ''))
            demographics.append({
                'participant_id': participant_id,
                'status': sub.get('status'),
                'started_at': sub.get('started_at'),
                'completed_at': sub.get('completed_at'),
                'time_taken': sub.get('time_taken'),
            })
        return demographics


# =============================================================================
# DUCKDB UTILITIES
# =============================================================================

def query_csv(sql: str) -> 'pd.DataFrame':
    """Run SQL directly on CSV files via DuckDB. No pandas loading."""
    import duckdb
    return duckdb.query(sql).df()


def query_parquet(sql: str) -> 'pd.DataFrame':
    """Run SQL directly on Parquet files via DuckDB."""
    import duckdb
    return duckdb.query(sql).df()


# =============================================================================
# COMMAND LINE INTERFACE
# =============================================================================

if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="FBO project utilities")
    parser.add_argument("--check-keys", action="store_true",
                        help="Check which API keys are configured")
    parser.add_argument("--test-prolific", action="store_true",
                        help="Test Prolific API connection")

    args = parser.parse_args()

    if args.check_keys:
        print("API Key Status:")
        all_keys = [
            PROLIFIC_CONFIG['api_key_env'],
            PROLIFIC_CONFIG['workspace_id_env'],
            PROLIFIC_CONFIG['project_id_env'],
        ]
        for key_name in all_keys:
            value = load_api_key(key_name)
            status = f"SET ({value[:8]}...)" if value else "NOT SET"
            print(f"  {key_name}: {status}")
    elif args.test_prolific:
        print("Testing Prolific API connection...")
        client = ProlificClient()
        try:
            studies = client.list_studies()
            print(f"  Connection successful. Found {len(studies)} studies.")
            for s in studies[:5]:
                print(f"    [{s.get('status', '?')}] {s.get('name', '?')} (id: {s.get('id', '?')})")
        except Exception as e:
            print(f"  Connection failed: {e}")
    else:
        parser.print_help()
