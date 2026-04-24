# FBO 2 -- WORKLOG

## Session 1 (2026-04-11)

**Goal:** Create project directory and develop first draft of theoretical model.

**What we did:**
- Created project directory with Gentzkow-Shapiro structure
- Developed formal model comparing selection neglect vs. naive investors in:
  1. Weighted-average expectations framework (Zhou 2020 style)
  2. CARA-Normal trading model with noise traders
- Derived key propositions:
  - Equivalence of naive and SN in weighted-average model (when prior mean = 0)
  - Precision ordering: SN > Rational > Naive
  - Mispricing comparison in trading model
  - Asymmetric impact: trading amplifies SN, diminishes naive
  - Critical fraction comparison
  - Non-disclosure threshold comparison
- Wrote full theory draft in docs/theory_draft.tex
- Discussed contribution framing and research strategy

**Key findings:**
- The distinction between naive and SN is primarily about perceived PRECISION (second moment), not beliefs (first moment)
- SN investors' overconfidence gives them disproportionate price weight in trading models
- You need strictly more rational investors to counteract SN mispricing than naive mispricing
- The precision advantage ratio is 1 + sigma_d^2/sigma_epsilon^2

**Current state:** Theory draft complete, ready for review and refinement.

**Next steps:**
- Refine theoretical framework based on discussion
- Consider extensions: correlated signals, partial selection neglect, dynamic survival
- Think about empirical/experimental design
- Develop contribution framing for target audience

---

## Session 2026-04-24 — Single-study refactor + v4 deploy

**Goal:** collapse the two-part design into a single flow, sync survey script
to code, prepare for Prolific friend-test.

**Major survey changes shipped this session (on top of existing v3.x):**
- Independence interlude (5 pages) teaching "one random transaction doesn't
  tell you about the rest," placed immediately before the manager reveal so
  the contrast with strategic selection lands crisply.
- 5 practice (warm-up) trials sampled from the K=4 pool, with aggregate
  "would have earned" summary before the 30 scored trials.
- New attention checks: coin-flip probability (after Page 10), fraud-estimate
  definition (after Page 13), manager's incentive (after Page 29), numeric
  "within 10 pp" bonus check (after Page 35). Independence sequence ends with
  a flipped-to-clean attention check too.
- New quiz Q5: "the 4 transactions are randomly picked — true/false" → false.
  Quiz now 14 questions (was 13).
- Splits for progressive reveal: Page 31 (answer 1 → answer 2), Page 40
  (auditor → vs manager → emphasis punchline), Page 53 (three company size
  cabinets reveal one at a time), Page 54 (rule-change announcement → "15
  more companies"), size rule reminder on its own page.
- Rule reminder page after size reveals: "The law still requires the manager
  to disclose **exactly 4**, regardless of size" in red, standalone.
- Pages 36 / 36b: bet explanation split into two pages.
- Stripped debrief so it no longer reveals the study's hypothesis / "correct"
  reasoning / real disclosure-strategy incentives. Two-line "thanks + here's
  your bonus" format only.
- Trial layout: black text splash, bullet list "Company Size: Medium (20
  transactions) / The manager sent the following K transactions:" with K
  plugged in dynamically (4 in Block 1, 8 in Block 2). Auditor on Page 25
  now sees 4 Cleans (strategic pick driven home in the visual).
- Terminology sweep: "truth" → "correct answer"; "firm" → "company";
  consistent use of % and "percentage points."
- Calculator widget docked right-side on all trial + numeric pages (5
  practice + 30 scored + share-practice + try-its + numeric attention check
  + numeric quiz questions). Supports `+ − × ÷`, parens, decimals, backspace,
  equals, full-width action button. Every keystroke and every evaluation
  logged with the trial ID for post-hoc divisor analysis (4 vs N).
- AI-bot stealth honeypot upgraded: rotating non-Latin prompts (Chinese,
  Hindi, Japanese, Russian, Greek, binary, reversed English, prompt-
  injection), three field types (text / radio / checkbox) cycled across
  pages.
- Full slider-drag trajectory + navigation trail added to the submitted
  data blob.
- Dev-mode page jumper: `?dev=true` + floating top-left panel, and
  `?start=<page_id>` URL param to jump straight to any page.

**Single-study refactor (this session):**
- Dropped `part1Pages`/`part2Pages` in `config.js` → single `pages` array.
- `prolific.completionCodes`/`completionUrls` flattened to one
  `completionCode: "COMP2SN"` + `completionUrl`.
- `engine.js` dropped `this.part` parsing, part-based routing, quiz-fail
  and fail-completion renderers, renderComprehension, `renderPart1Fail`,
  `retakeQuiz`, `exitQuizNoRetake`. Quiz is now purely per-question retry.
- `sheets-script.gs` dropped `addToParticipantGroup` + the Part 1 gate.
  Apps Script no longer needs `PROLIFIC_API_TOKEN` or `PROLIFIC_GROUP_ID`
  as Script Properties.
- `code/config.py` collapsed `part1_reward_pence`/`part2_reward_pence`
  to single `reward_minor` ($3.00) + `bonus_max_minor` ($6.00). One
  `completion_code`.
- `RUN_PROLIFIC_STUDY.py` replaced `cmd_create_two_part` with single-study
  `cmd_create`. Drops participant-group creation, drops `patch_part2_study_url`,
  drops `?part=1/2` URL parameters. `bonus` command simplified (no Part 2
  filter) and relabeled GBP → USD in prints.
- `code/02_collect/CLAUDE.md` rewritten for single-study operator runbook.
  Old two-part runbook archived to `code/archive/2026-04-24/`.
- `data/raw/prolific/two_part_setup_pilot.json` archived to
  `data/archive/2026-04-24/`.

**Google Sheet + Apps Script (v4):**
- Fresh sheet created (ID: `1xPCwJ4KEm0IOQEDNNmU4oU8iOYTj1pNVtG_8RiHy850`).
- Updated `sheets-script.gs` deployed as Web App. New dataEndpoint URL
  wired into `config.js` and `config.py`.
- Old pilot sheet (`1Vjay...qPS5U`) preserved as historical record.

**Next steps:**
- User sends friend a GitHub Pages URL with a fake PROLIFIC_PID for an
  end-to-end smoke test.
- After verifying submission lands in the v4 sheet: create Prolific
  draft study (not publish yet). Friend test → pilot → full run.
