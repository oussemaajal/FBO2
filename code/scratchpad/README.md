# scratchpad/ -- pre-registration power & design-search scripts

These scripts were used to explore the experimental design before the
live within-subject design was locked in. None are imported by the
active pipeline; they exist to document how we got to the final design,
to support revisiting power if we later change the sample size, and to
regenerate design figures that ship with the manuscript.

## Canonical files (current binary design)

| File | Purpose | Output |
|---|---|---|
| `binary_design.py` | Stimulus generation for the live binary-type design | (none -- analysis only) |
| `binary_power.py` | Power analysis under the live design | (none -- analysis only) |
| `binary_10pct.py` | Sensitivity to a 10% effect size under the live design | (none -- analysis only) |
| `build_parameter_excel.py` | Builds the trial-grid Excel inspector | `docs/parameter_sweep.xlsx` |
| `compute_on_vs_mr_heatmaps.py` | Builds ON-vs-MR ratio heatmaps | `docs/heatmaps_on_only.{pdf,png}` and `docs/heatmaps_on_vs_mr.{pdf,png}` |

To regenerate any of the above power numbers or figures from scratch,
run the relevant script (no CLI arguments needed). All four write to
`docs/`.

## Generic tools (kept for future revisits)

These don't target the live design specifically; keep them in case you
revisit pre-registration power or explore a new design grid.

- `design_search.py` -- design-space search utility
- `eval_design.py` -- generic design evaluator
- `optimal_prior.py` -- prior elicitation analysis
- `power_grid.py` -- grid-based power tool
- `sensitivities.py` -- sensitivity explorations

## Tooling

- `syntax_check_js.py` -- token-aware brace/paren/bracket balance check
  for JavaScript source. Used during survey edits to confirm
  `survey/js/` files parse before deploy. Usage:
  `python syntax_check_js.py <file.js>`.

## Archived (retired with the pre-binary design)

See `_archive_pre_binary/` for scripts tied to the superseded
15-cell / 3-type / 10-trial design (`SCALE_CONDITIONS`,
`FORMAT_CONDITIONS`, `TYPE_DISTRIBUTIONS` in the pre-2026-04-20
`config.py`).

**Note:** these scripts compile cleanly and can still be run -- the
constants they need are defined inline in each file, not imported from
`config.py`. The previous version of this README incorrectly claimed
they "will not run as-is." They DO run; they just produce results for
the superseded design that is no longer the canonical design.
