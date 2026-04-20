"""
FBO 2 -- Project Configuration
Selection Neglect and Strategic Non-Disclosure
"""

import os
from pathlib import Path

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
    'survey_url': 'https://oussemaajal.github.io/FBO2/',
    # Google Apps Script web-app URL (same endpoint for POST writes & GET reads).
    # GET requires ?token=<READ_TOKEN> matching the Script Property of the same name.
    'data_endpoint': 'https://script.google.com/macros/s/AKfycbzRoZbHXjC_M_bvjMVcqMl8jdSdE3_80qV4srsAFB-JPLrAvBUuBN8SXr-9Fn6TBPYSEg/exec',
    'google_sheet_id': '1VjaydQxm48KMjbsPUUA4t_qAY-88a-sieqpv6XqPS5U',
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
    # Payment (minor currency units; Prolific 'reward' field expects this)
    # Account is GBP-denominated -- 100 = GBP 1.00, 200 = GBP 2.00.
    'part1_reward_pence': 100,  # GBP 1.00
    'part2_reward_pence': 200,  # GBP 2.00 base
    'bonus_max_pence': 200,     # GBP 2.00 max accuracy bonus
    'bonus_per_range_penalty_pence': 20,  # GBP 0.20 off per bucket away from Bayesian range

    # Estimated completion times (minutes) -- shown to participants on Prolific
    'estimated_time_part1_min': 6,
    'estimated_time_part2_min': 10,

    # Default participant counts (within-subject design; no between-subject cells)
    'default_n_pilot': 20,
    'default_n_full': 250,

    # Completion codes -- must match survey/js/config.js::SURVEY_CONFIG.prolific
    # and RUN_PROLIFIC_STUDY.py's create_study() completion_codes argument.
    'pass_code_part1': 'PASS1SN',
    'fail_code_part1': 'FAIL1SN',
    'completion_code_part2': 'COMP2SN',
}
