# 02_analysis/ -- analysis scripts

This directory will hold scripts that consume `data/clean/panel.parquet`
(produced by `code/01_build/`) and emit tables and figures into
`output/`.

**Currently empty by design.** Analysis scripts will be added once the
first pilot run completes and `01_build/` produces a clean panel.

## Planned pipeline

1. `01_descriptives.py` -- table of participant demographics, mean
   completion time, attention-check pass rate, calibration trial
   accuracy.
2. `02_main_test.py` -- core selection-neglect vs selection-aware
   contrast: do estimates align more with theta_SN (k/K) or with
   theta_RB (selection-aware Bayesian)? Mixed-effects regression with
   random intercepts per participant.
3. `03_heterogeneity.py` -- by N (10/20/30), by k (mix of suspicious
   transactions disclosed), by block (K=4 vs K=8), by quiz-retake
   count.
4. `04_robustness.py` -- multiverse / specification curve across
   reasonable analytical choices (which calibration trials count, how
   to handle attention-check failures, alternative weightings of the
   bet outcome, etc.).

Each script reads `data/clean/panel.parquet` (and any auxiliary clean
inputs), writes to `output/tables/` or `output/figures/`, and includes
a one-paragraph header summarizing what it does and what it produces.
