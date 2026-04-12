# CLAUDE.md -- FBO 2 (Selection Neglect and Strategic Non-Disclosure)

## Project Overview

**Full title:** Selection Neglect, Strategic Non-Disclosure, and Market Survival
**Short name:** FBO 2
**Status:** Theory development (early stage)
**Solo project** (no co-authors yet)

## Research Question

Does selection neglect -- the tendency to ignore strategically undisclosed information entirely rather than merely failing to adjust for it -- create a form of investor unsophistication that is harder to arbitrage away than the "naive" investors modeled in the existing literature?

## Key Distinction

- **Naive investors** (Zhou 2020): know the discretionary signal exists, assign its unconditional mean when it is withheld. They have the RIGHT perceived variance.
- **Selection neglect investors** (this paper): drop the undisclosed signal from their mental model entirely. They have LOWER perceived variance (overconfident).

The first-moment error may be the same, but the second-moment difference (perceived precision) drives outsized market impact in a trading model.

## Key Papers

- **Zhou (2020) JAR** "The Dog That Didn't Bark" -- naive investors sustain non-disclosure in weighted-average framework
- **Farina et al. (2026)** "Selection in Communication" -- selection neglect in communication, experimental evidence
- **Verrecchia (1983)** -- disclosure cost model (our framework)
- **Daniel, Hirshleifer, Subrahmanyam (1998)** -- overconfidence in financial markets
- **DeLong, Shleifer, Summers, Waldmann (1990)** -- noise trader survival

## Directory Structure

```
FBO 2/
  CLAUDE.md          # This file
  WORKLOG.md         # Session narrative
  README.md          # Project overview
  code/
    01_build/        # Data construction (future)
    02_analysis/     # Analysis scripts (future)
    config.py        # Project configuration
    utils.py         # Shared utilities
    scratchpad/      # Exploratory scripts
  data/
    raw/             # Raw data (future)
    intermediate/    # Intermediate data (future)
    clean/           # Clean data (future)
  output/            # Figures, tables
  docs/
    theory_draft.tex # Main theory derivations
```

## Working Rules

- Theory-first project: formal derivations before any empirical or experimental work
- All propositions must be honest -- never force a result to fit the narrative
- When results are ambiguous, report the conditions under which each direction holds
- LaTeX safety: use raw strings, compile after edits, no Unicode
- This project may eventually include experiments (Prolific/lab) -- keep that in mind for design

## Session Workflow

1. Read WORKLOG.md at start
2. Do the work
3. Update WORKLOG.md, DAILYLOG.md, README.md at end
