# 01_build/ -- data-construction scripts

This directory will hold scripts that turn raw Prolific submissions
into clean, analysis-ready datasets.

**Currently empty by design.** Build scripts will be added once the
first pilot run completes (data starts flowing into the v4 Google
Sheet at `1xPCwJ4KEm0IOQEDNNmU4oU8iOYTj1pNVtG_8RiHy850`).

## Planned pipeline

1. `01_pull_responses.py` -- download the latest sheet via
   `code/02_collect/FETCH_RESPONSES.py`, save raw JSON to
   `data/raw/responses/`.
2. `02_parse_trial_responses.py` -- explode `raw_json` into one row per
   (participant, trial), join with stimulus metadata.
3. `03_compute_estimators.py` -- compute selection-neglect predictions
   (theta_SN), selection-aware Bayesian benchmark (theta_RB), and
   distance from each.
4. `04_clean_panel.py` -- apply screener/quality filters (failed
   attention checks, calibration outliers on all-S trials), output
   `data/clean/panel.parquet`.

Each script reads from `data/raw/` or `data/intermediate/`, writes to
the next stage's directory, and is idempotent (safe to re-run).
