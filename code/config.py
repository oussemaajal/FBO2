"""
FBO 2 -- Project Configuration
Selection Neglect and Strategic Non-Disclosure

Design v3.1: Within-subject, 9 trials
  N = total signals in pool: {10, 20, 50}
  D = disclosed signals: 4 (fixed)
  d_N = Normal among disclosed: {0, D-1=3, D=4}
"""

import os
from pathlib import Path
from math import lgamma, log, exp

# =============================================================================
# PATHS
# =============================================================================

PROJECT_ROOT = Path(__file__).parent.parent

PATHS = {
    'project': PROJECT_ROOT,
    'code': PROJECT_ROOT / 'code',
    'survey': PROJECT_ROOT / 'survey',
    'data_raw': PROJECT_ROOT / 'data' / 'raw',
    'data_intermediate': PROJECT_ROOT / 'data' / 'intermediate',
    'data_clean': PROJECT_ROOT / 'data' / 'clean',
    'output': PROJECT_ROOT / 'output',
    'docs': PROJECT_ROOT / 'docs',
    'prolific_data': PROJECT_ROOT / 'data' / 'raw' / 'prolific',
    'responses': PROJECT_ROOT / 'data' / 'raw' / 'responses',
}

# =============================================================================
# PROLIFIC CONFIG
# =============================================================================

PROLIFIC_CONFIG = {
    'api_key_env': 'PROLIFIC_API_TOKEN',
    'workspace_id_env': 'PROLIFIC_WORKSPACE_ID',
    'project_id_env': 'PROLIFIC_PROJECT_ID',
    'base_url': 'https://api.prolific.com/api/v1',
}

def load_api_key(env_var):
    """Load API key from environment variable, falling back to project-root .env file."""
    value = os.environ.get(env_var)
    if value:
        return value

    env_path = PROJECT_ROOT / ".env"
    try:
        with open(env_path) as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith("#"):
                    continue
                if line.startswith(env_var) and "=" in line:
                    return line.split("=", 1)[1].strip().strip('"').strip("'")
    except FileNotFoundError:
        pass

    return ''

# =============================================================================
# SURVEY CONFIG
# =============================================================================

SURVEY_CONFIG = {
    # Survey is hosted on GitHub Pages. The `/survey/` subpath is where the
    # engine's index.html lives on the gh-pages branch.
    'survey_url': 'https://oussemaajal.github.io/FBO2/survey/',
    # Google Apps Script web-app URL (same endpoint for POST writes + GET reads).
    # GET requires ?token=<READ_TOKEN> matching the Script Property of that name.
    # v4 sheet created 2026-04-24 after the single-study refactor.
    'data_endpoint': 'https://script.google.com/macros/s/AKfycbwUkl3FnttwsmkiQ0jRD_UOgyYSCwVERR2_2oTre_ib50bltFzTMk3TPuQdzefWy-OX/exec',
    'google_sheet_id': '1xPCwJ4KEm0IOQEDNNmU4oU8iOYTj1pNVtG_8RiHy850',
    'sheet_read_token_env': 'FBO2_SHEET_READ_TOKEN',  # local env var holding the READ_TOKEN shared secret
}

# =============================================================================
# EXPERIMENT PARAMETERS
#
# The live experiment is a WITHIN-subject, 9-trial, binary-design study.
# Stimuli, trial compositions, and any per-trial calculations live in
# survey/js/config.js (SURVEY_CONFIG) -- that is the single source of
# truth for the browser-side experiment. This file only keeps the
# Prolific-side parameters that the Python orchestration code uses.
#
# If you are looking for the old 15-cell / 3-type / 10-trial design
# (SCALE_CONDITIONS, FORMAT_CONDITIONS, TYPE_DISTRIBUTIONS,
#  TRIAL_PROPORTIONS, get_stimuli_for_scale), it was removed 2026-04-20
# in favor of the binary design. See code/scratchpad/_archive_pre_binary/
# for the retired power/stimulus analyses.
# =============================================================================

EXPERIMENT_PARAMS = {
    # Payment (minor currency units; Prolific 'reward' field expects this).
    # Account is USD-denominated: 500 = $5.00.
    # `reward_minor` = base pay, guaranteed. `bonus_max_minor` = accuracy
    # bonus cap on top of base. Matches survey copy: "$5 base + up to $6".
    # Pay history: $3 (initial pilot v3) -> $4 (r4, 2026-04-25)
    #              -> $5 (r14, 2026-04-25, paired with 25-min estimate).
    'reward_minor':     500,   # $5.00 base pay
    'bonus_max_minor':  600,   # $6.00 max accuracy bonus (30 trials * 20 cents max)

    # Estimated completion time shown to participants on Prolific.
    # Empirical minimum-time floor (sum of all time locks) is ~16:25;
    # 25 min gives engaged participants comfortable headroom.
    'estimated_time_min': 25,

    # Default participant counts (within-subject design; no between-subject cells)
    'default_n_pilot': 20,
    'default_n_full':  250,

    # Completion code -- must match survey/js/config.js::SURVEY_CONFIG.prolific
    # and RUN_PROLIFIC_STUDY.py's create_study() completion_codes argument.
    # Single-study design: one code for everyone who finishes the survey.
    'completion_code': 'COMP2SN',
}
