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
    'data_endpoint': '',  # Google Sheets Apps Script URL (set after deployment)
    'google_sheet_id': '',  # Google Sheet ID (set after deployment)
}

# =============================================================================
# EXPERIMENT PARAMETERS
# =============================================================================

# Between-subject conditions: 5 scales x 3 formats = 15 cells
SCALE_CONDITIONS = {
    'small_low':    {'k': 3,   'N': 10,   'label': '(k=3, N=10)'},
    'small_high':   {'k': 3,   'N': 100,  'label': '(k=3, N=100)'},
    'small_vhigh':  {'k': 3,   'N': 1000, 'label': '(k=3, N=1000)'},
    'large_high':   {'k': 30,  'N': 100,  'label': '(k=30, N=100)'},
    'large_vhigh':  {'k': 300, 'N': 1000, 'label': '(k=300, N=1000)'},
}

FORMAT_CONDITIONS = ['list', 'chart_disclosed', 'chart_full']

EXPERIMENT_PARAMS = {
    'n_scale_conditions': 5,
    'n_format_conditions': 3,
    'n_cells': 15,
    'n_trials_per_participant': 10,
    'trial_attention_checks': 3,

    # Sample sizes
    'participants_per_cell_pilot': 20,
    'participants_per_cell_full': 60,
    'total_pilot': 300,   # 15 cells x 20
    'total_full': 900,    # 15 cells x 60

    # Payment (GBP pence) -- matches current survey copy (v3.11)
    'part1_reward_pence': 100,  # 1.00 GBP
    'part2_reward_pence': 150,  # 1.50 GBP base
    'bonus_max_pence': 100,     # 1.00 GBP max accuracy bonus
    'estimated_time_part1_min': 5,
    'estimated_time_part2_min': 10,

    # Default participant counts (within-subject design; no between-subject cells)
    # These are used by RUN_PROLIFIC_STUDY.py when --n is not supplied.
    'default_n_pilot': 60,
    'default_n_full': 250,

    # Completion codes
    'pass_code_part1': 'PASS1SN',
    'fail_code_part1': 'FAIL1SN',
    'completion_code_part2': 'COMP2SN',
}

# =============================================================================
# STIMULI: Transaction type distributions
# =============================================================================

TYPE_DISTRIBUTIONS = {
    'non_fraud': {'Normal': 0.60, 'Unusual': 0.30, 'Highly_Unusual': 0.10},
    'fraud':     {'Normal': 0.40, 'Unusual': 0.30, 'Highly_Unusual': 0.30},
}

PRIOR_FRAUD = 0.50

# =============================================================================
# TRIAL COMPOSITIONS (proportional, same across all scale conditions)
# Naive P(F) computed from multinomial likelihood ratio
# =============================================================================

# Proportional compositions (fractions of k)
TRIAL_PROPORTIONS = [
    {'id': 't1',  'pN': 1.00, 'pU': 0.00, 'pHU': 0.00, 'naive_pf': 0.229},
    {'id': 't2',  'pN': 0.67, 'pU': 0.33, 'pHU': 0.00, 'naive_pf': 0.308},
    {'id': 't3',  'pN': 0.33, 'pU': 0.67, 'pHU': 0.00, 'naive_pf': 0.400},
    {'id': 't4',  'pN': 0.00, 'pU': 1.00, 'pHU': 0.00, 'naive_pf': 0.500},
    {'id': 't5',  'pN': 0.67, 'pU': 0.00, 'pHU': 0.33, 'naive_pf': 0.571},
    {'id': 't6',  'pN': 0.33, 'pU': 0.33, 'pHU': 0.33, 'naive_pf': 0.667},
    {'id': 't7',  'pN': 0.00, 'pU': 0.67, 'pHU': 0.33, 'naive_pf': 0.750},
    {'id': 't8',  'pN': 0.33, 'pU': 0.00, 'pHU': 0.67, 'naive_pf': 0.857},
    {'id': 't9',  'pN': 0.00, 'pU': 0.33, 'pHU': 0.67, 'naive_pf': 0.900},
    {'id': 't10', 'pN': 0.00, 'pU': 0.00, 'pHU': 1.00, 'naive_pf': 0.964},
]


def get_stimuli_for_scale(scale_name):
    """Generate the 10 trial stimuli for a given scale condition."""
    params = SCALE_CONDITIONS[scale_name]
    k, N = params['k'], params['N']
    stimuli = []
    for t in TRIAL_PROPORTIONS:
        nN = round(t['pN'] * k)
        nU = round(t['pU'] * k)
        nHU = k - nN - nU  # ensure they sum to k
        stimuli.append({
            'id': t['id'],
            'k': k,
            'N': N,
            'nNormal': nN,
            'nUnusual': nU,
            'nHU': nHU,
            'hidden': N - k,
            'naive_pf': t['naive_pf'],
        })
    return stimuli
