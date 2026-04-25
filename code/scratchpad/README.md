# scratchpad/ -- pre-registration power & design-search scripts

These scripts were used to explore the experimental design before the
live 9-trial binary within-subject design was locked in. None are
imported by the active pipeline; they exist to document how we got to
the final design and to support revisiting power if we later change
the sample size.

## Canonical files (current binary design)

- `binary_design.py` -- stimulus generation for the live binary-type design
- `binary_power.py`  -- power analysis under the live design
- `binary_10pct.py`  -- sensitivity to a 10% effect size under the live design

If you need to regenerate power numbers for the pre-registered design,
start with these three.

## Ambiguous / kept pending review

The following scripts may still be useful reference material but are
not tied to a specific design vintage:

- `design_search.py`  -- design-space search utility
- `eval_design.py`    -- generic design evaluator
- `optimal_prior.py`  -- prior elicitation analysis
- `power_grid.py`     -- grid-based power tool
- `sensitivities.py`  -- sensitivity explorations

## Archived (retired with the pre-binary design)

See `_archive_pre_binary/` for scripts tied to the superseded
15-cell / 3-type / 10-trial design (SCALE_CONDITIONS, FORMAT_CONDITIONS,
TYPE_DISTRIBUTIONS in the pre-2026-04-20 config.py). Those scripts will
not run as-is after the config cleanup on 2026-04-20 -- the constants
they import were removed.
