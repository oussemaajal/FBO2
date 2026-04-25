# _archive_pre_binary/ -- retired pre-registration scripts

Archived on 2026-04-20 during the audit-code sweep.

These scripts were written for the earlier experimental design that
used:

- 5 scale conditions x 3 format conditions = 15 between-subject cells
- 3 transaction types: Normal / Unusual / Highly-Unusual
- 10 trials per participant
- k in {3, 30, 300}, N in {10, 100, 1000} as scale parameters

The live design (as of the 2026-04-20 config cleanup) is:

- Within-subject, single cell
- Binary transaction types
- 9 trials per participant

The constants these scripts import from `code/config.py`
(SCALE_CONDITIONS, FORMAT_CONDITIONS, TYPE_DISTRIBUTIONS,
TRIAL_PROPORTIONS, PRIOR_FRAUD, get_stimuli_for_scale) were removed
from `config.py` on the same date. The scripts are preserved here for
the audit trail; they will not run as-is without reinstating those
constants.

## Files

- `three_types.py`, `type_predictions.py`, `aggregate_id.py` -- 3-type design
- `power_k30.py`, `power_k30_v2.py`, `scaling_p30.py`, `scaling_test.py`,
  `optimal_design_p30.py` -- k/N scale-parameter analyses
- `design_8trial.py` -- 8-trial variant (superseded by 9-trial)
- `power_analysis_sensitivity.py` -- imports the removed SCALE_CONDITIONS
