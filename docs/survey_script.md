# SURVEY SCRIPT — FBO 2 (Selection Neglect)

*A page-by-page script of the current survey, generated from
`survey/js/config.js`. Mark it up; I'll apply the edits to the code.*

**How to edit this file:**
- Every page has a `### PAGE N` heading. Numbers are just markers — I'll
  renumber after each round of edits so you don't have to.
- Everything below a page heading is fair game.
- Inline edit comments: write a parenthetical or footnote next to the
  text you want changed.
- To add a page, write a new `### PAGE NEW` section wherever you want it.
- To delete a page, write `DELETE PAGE` at the top of its section.
- Reorder pages by moving whole sections up/down.

---

## Global rules

- **Font:** IBM Plex Sans (body), IBM Plex Serif (headings, sparingly).
- **Base text size:** 17 px body, 28 px title, 24–26 px lead-in.
- **Alignment:** all body text is **left-aligned and justified**. Centered
  text is an exception and is noted explicitly. All body paragraphs share
  one max-width (620 px) so left edges align across pages.
- **No grey for text.** Emphasis comes from **bold** and **size**, not
  faded color. Secondary notes use a softer dark slate.
- **No em dashes.** Use `.`, `,`, `:`, or `()` instead.
- **No auto-hyphenation.** Body paragraphs use `hyphens: none` so
  words never break mid-word at line ends.
- **All attention checks use the label "Quick Attention Check."**
- **Retry timeout:** every wrong answer triggers a **10-second timeout**
  before the next attempt.
- **Nav:** every page has a **Next** button unless noted. Practice / check
  pages block Next until the correct answer is given.
- **Time lock:** Next is disabled for `Time lock` seconds after the page
  loads. Time locks shown below come directly from the `minTimeSeconds`
  field on each page in `config.js`. The full survey enforces a
  **16-minute floor** in aggregate (the sum of every page's minTime is
  about 16 minutes before any thinking time).
- **Calculator widget:** a floating calculator docks on the right side
  of every page where the participant has to do arithmetic (any page
  with `showCalculator: true`). Supports `+ − × ÷`, parentheses,
  decimals, `=`. Every keystroke is logged with the current page id.
  The participant gets a heads-up about the calculator on its own page
  (`p2_inst_calculator_notice`) the first time it's relevant.
- **Practice feedback reveal.** On the four interactive practice pages
  (`p4_inst_estimate_try_50/30`, `p4_inst_bet_try_good/bad`), the
  closing-line feedback card is **hidden until the participant moves
  the slider(s) to the page's target**. Once the target is reached, the
  card unhides and a **5-second read lock** runs before Next becomes
  active. If the participant clicks Next before reaching the target,
  Next disables for a **10-second cooldown** before they can try again.
- **Numbered answer badges:** the "1" / "2" badges on the two-answer
  pages and the bet/estimate kickers all use the same blue palette.
  Small inline badges: `#4361ee` filled, white text. Larger circular
  badges (Page 30 stakes list): `#dbe4ff` background with `#3730a3`
  text. No teal or amber variants remain in the flow.
- **Dev mode (`?dev=true`):** time locks are skipped, the resume prompt
  is suppressed when `?start=<page_id>` is set, and a floating page
  jumper appears in the top-left with a searchable list of every page.
- **AI-bot stealth check:** every page injects an invisible honeypot
  question in a rotating non-Latin script (Chinese, Hindi, Japanese,
  Russian, Greek, binary, reversed English, or a prompt-injection
  attempt). Field type rotates across text / radio / checkbox. Humans
  never see it (off-screen, 1-px, transparent); a DOM-scraping bot
  will try to answer it, which **immediately ends the survey** with
  a lockout screen — **no completion code, no payment**. Stored in
  `stealthCheck` in the raw data blob.

---

## Study parameters (for reference, not a page)

- **Total pages:** 90 (87 instruction/check/quiz pages + 3 trial-block
  containers: practice, K=4, K=8).
- **Comprehension quiz:** **14 questions** (Q1 through Q14, each
  kickered "Quiz: question X of 14"). All retry-with-10s-timeout.
- **Base pay:** $5.00, guaranteed; never reduced.
- **Performance bonus:** up to **$6.00**, accumulated across 30 companies.
  - Per company: **+10¢** if your estimate is within **10 percentage
    points** of the correct answer, **± your bet** (0–10¢) on the same
    within-10-percentage-points event.
  - Best case per company: +20¢. Worst case per company: −10¢.
  - Summed across all 30 companies, floored at $0. Losses on one company
    eat into gains on another, never into base pay.
- **Pay range:** $5.00 to $10.00 ($5 base + up to $6 bonus).
- **Total survey time floor:** **16 minutes** in aggregate (sum of every
  page's `minTimeSeconds` before any thinking time).
- **Bonus benchmark (piecewise):** the "correct answer" used for payout
  depends on `k` (the number of suspicious transactions among those
  disclosed):
  - **`k = 0`** (no disclosed transaction is suspicious): the benchmark
    is the **uniform-prior posterior**, which equals the naive 50/50
    formula on undisclosed transactions: `(N − K) / (2 N)`. Same number
    as the "naive" formula, but for a Bayesian reason — a manager who
    hid 0 disclosed-suspicious is consistent with any number of
    suspicious among the hidden, and the posterior mean under a uniform
    prior is the midpoint. This is the **k=0 benchmark** flagged
    deliberately in the bonus rule.
  - **`k ≥ 1`** (at least one disclosed transaction is suspicious):
    strategic disclosure pins down the pool exactly — the manager would
    have hidden any clean transaction first, so observing `k` suspicious
    among disclosed implies all hidden transactions are suspicious.
    Benchmark: `(k + N − K) / N` (full unraveling).
- **Trials:** 30 companies in two blocks.
  - **Block 1 (K = 4, 15 companies):** every combination of company size
    (10 / 20 / 30 transactions) × disclosure mix
    (k ∈ {0, 1, 2, 3, 4}). Order randomized.
  - **Block 2 (K = 8, 15 companies):** three sizes × five mixes
    (k ∈ {0, 1, 4, 7, 8}). Order randomized.
- **Practice block:** **5 warm-up trials** sampled from Block 1 (K=4),
  **stratified by k ∈ {0, 1, 2, 3, 4}** (one per stratum), in stable
  shuffled order seeded by Prolific PID. Same task as scored trials but
  responses do not count toward the bonus.
- **Attention checks during trials:** 3, at random positions across the
  full 30-trial run.
- **Slider requirement:** the participant has to move the fraud-estimate
  slider at least once per trial, even if they settle back at 50.
- **Bot detection enforcement:** any page with a non-empty `stealthCheck`
  field (the rotating invisible honeypot) immediately aborts the survey
  on submit. The participant is shown a lockout screen, **no completion
  code is issued, no payment is made**. The consent page (Page 4) carries
  an IMPORTANT red callout warning participants of this rule before they
  agree to participate.

**Terminology (locked in — do not vary):**
- The participant is a **government auditor** (never just "auditor").
- Entities being audited are **companies** (never "firms").
- The participant **estimates** (never "rates"). Output is called the
  **fraud estimate**, expressed as a **percentage (0%–100%)**. The "%"
  sign is shown on every slider label, every truth value, and every
  numeric target in instructions.
- Distance from the correct answer is expressed in **percentage points**
  (never just "points"). Example: "within 10 percentage points," not
  "within 10 points."

---

# ACT I — CONSENT & OVERVIEW

### PAGE 1
**ID:** `p1_intro_decisions`
**Time lock:** 5 s
**TITLE:** Welcome to our Study

**BODY:**
- This is a study about **decision-making**. You'll face a series of
  **hypothetical scenarios** where you make decisions. **The better
  your decisions, the more you earn.**

---

### PAGE 2
**ID:** `p1_intro_role`
**Time lock:** 5 s
**TITLE:** What the Study is About

**BODY:**
- You'll play the role of a **government auditor** screening companies
  for fraud. **No auditing background is needed. The scenario is
  simplified.**

---

### PAGE 3 — Introduction (read carefully)
**ID:** `p1_intro_attention`
**Time lock:** 10 s
**TITLE:** Introduction

**BODY:**
- Please **read the instructions carefully**. Throughout the study
  you'll see short attention checks and quizzes to test your
  understanding of your task. You can try each one as many times as
  you need.

**RED IMPORTANT NOTE** (light-red background, red left border, uppercase
"IMPORTANT." prefix):
- Every wrong answer triggers a **10-second timeout** before you can try
  again. **Think carefully about your answers.**

---

### PAGE 4
**ID:** `p1_consent`
**Time lock:** 15 s
**TITLE:** Consent
**Type:** consent (checkbox required)

**BODY:**
- **What you'll do.** Learn a simple auditing task, then go through 30
  auditing rounds.
- **Time.** About 25 minutes.
- **Pay.** $5.00 base + up to $6.00 performance bonus. Base pay is
  **guaranteed**; no penalty can reduce it.
- **Risks.** None beyond everyday life.
- **Confidentiality.** Anonymous. We collect your Prolific ID only for
  payment.
- **Voluntary.** You may withdraw at any time by closing this window.

**RED IMPORTANT NOTE** (light-red background, red left border, uppercase
"IMPORTANT." prefix — bot-detection warning, no completion code if
triggered):
- This study includes hidden checks for automated agents (e.g., AI
  assistants completing the form on your behalf). If detected, the
  survey will end immediately. **No completion code will be issued, and
  no payment will be made.** Please complete the study yourself.

**CHECKBOX** (required): `I agree to participate.`
**Decline message:** *You must agree to participate in order to continue.*

---

### PAGE 5
**ID:** `p1_overview`
**Time lock:** 10 s

**VISUALS (top, centered):**
- [SVG: government auditor badge — teal magnifying glass over a document, uppercase caption `GOVERNMENT AUDITOR`]

**BODY:**
- You play the role of a **government auditor**. For each company, you
  review its transactions and provide a preliminary **fraud estimate**.
- At the end of the study, we reveal each company's **correct answer**.
  **The closer your estimate to the correct answer, the more you earn.**

---

### PAGE 6
**ID:** `p1_overview_check`
**Time lock:** 8 s

**Kicker** (centered, small caps, primary blue): `QUICK ATTENTION CHECK`

**Question** (20 px, bold): In this study, what is your task?

**Answers:**
- A. Decide which company to sell products to.
- B. Assign a fraud estimate to each company. ← correct
- C. Give each company a customer-service score.

**Behavior:** `retry` mode.

**Explanation when correct:** *You assign fraud estimates. The more
accurate you are, the more you earn.*

---

### PAGE 7
**ID:** `p1_inst_mission`
**Time lock:** 5 s

**BODY:**
- [headline, 24 px, bold] What follows: the details.
- [p, 17 px] The next section explains the auditing process, the two
  types of transactions, and how the bonus is calculated.

---

# ACT II — HOW TO READ A COMPANY

### PAGE 8
**ID:** `p2_inst_transaction_intro`
**Time lock:** 8 s

**BODY:**
- [headline, 24 px, semibold] How do you assess a company for fraud?
- [p, 20 px] By examining the company's **transactions**.

**VISUALS:** one large neutral document icon, centered.

**Closing line:**
- [p, 20 px] This is a single transaction. You will not need to read
  its contents. You only need to know **what type** of transaction it
  is.

---

### PAGE 9
**ID:** `p2_inst_transaction_clean`
**Time lock:** 3 s

**BODY:**
- [headline, 24 px, semibold] Each transaction is one of two types.

**VISUALS:** a 2-slot row. Left slot: a white document with a green
"C" stamp. Caption below in green: `Clean`. Right slot: invisible
placeholder reserved for the next page (so the layout doesn't shift).

---

### PAGE 10
**ID:** `p2_inst_transactions_both`
**Time lock:** 2 s

**BODY:**
- [headline, 24 px, semibold] Each transaction is one of two types.

**VISUALS (two slots):**
- **Clean** (left): white doc + green C stamp. Caption `Clean` (green).
- **Suspicious** (right): white doc + red S stamp. Caption `Suspicious`
  (red).

---

### PAGE 11
**ID:** `p2_inst_fifty_fifty`
**Time lock:** 5 s

**BODY:**
- [headline, 24 px] Any given transaction is a coin flip.

**VISUALS:** the same two cards, captioned **`50%`** each.

**Closing line** (centered, 24 px):
- Your job is to assess the **proportion of a company's transactions
  that are suspicious**.

---

### PAGE 12 — Attention check (coin flip)
**ID:** `p2_attn_coin_flip`
**Time lock:** 6 s

**Kicker** (centered, small caps, primary blue): `QUICK ATTENTION CHECK`

**Question** (20 px, bold): What's the probability that any given
transaction is **clean**?

**Answers (A / B / C / D):**
- A. 0%
- B. 25%
- C. 50% ← correct
- D. 100%

**Behavior:** `retry` mode.

**Explanation when correct:** *Any given transaction is a coin flip:
50% clean, 50% suspicious.*

---

### PAGE 13
**ID:** `p2_inst_cluster`
**Time lock:** 3 s

**BODY:**
- [headline, 24 px, semibold] Each company has many transactions.

**VISUALS:** ~20 neutral document icons, loosely clustered (no
background panel).

---

### PAGE 14
**ID:** `p2_inst_mixes`
**Time lock:** 10 s

**BODY:**
- [headline, 20 px] Companies vary in how many of their
  transactions are suspicious.

**VISUALS (two cluster panels side by side, mini scale):**
- **Mostly clean** (green label): 18 C + 2 S, same 20 positions as the
  cluster page.
- **Mostly suspicious** (red label): 2 C + 18 S, same 20 positions.

**Closing line:**
- [p, 24 px, centered] Your task is to distinguish them by providing a
  **fraud estimate**.

---

### PAGE 15
**ID:** `p2_inst_rule`
**Time lock:** 10 s

**BODY:**
- [headline, 26 px, bold] **Fraud estimate** = share of suspicious
  transactions.
- [p, 17 px] Three example companies, with every transaction shown:

**VISUALS (three stacked example rows):**
- Row 1: 10 C cards · `0 / 10 → 0%` (green).
- Row 2: 7 C + 3 S · `3 / 10 → 30%` (amber).
- Row 3: 3 C + 7 S · `7 / 10 → 70%` (red).

---

### PAGE 16 — Attention check (fraud estimate definition)
**ID:** `p2_check_definition`
**Time lock:** 6 s

**Kicker** (centered, small caps, primary blue): `QUICK ATTENTION CHECK`

**Question** (20 px, bold): The fraud estimate for a company is ...

**Answers (A / B / C / D):**
- A. Your gut feeling about the company, in percent.
- B. The total number of suspicious transactions.
- C. The share of suspicious transactions out of all its transactions. ← correct
- D. Always 50%, set by law for every company.

**Behavior:** `retry` mode.

**Explanation when correct:** *The fraud estimate is the share of a
company's transactions that are suspicious, expressed as a percentage.*

---

### PAGE 17
**ID:** `p2_inst_consequence`
**Time lock:** 10 s

**BODY:**
- [headline, 22 px, bold] What happens to a company after you submit
  its estimate?
- [bullet list, 18 px]:
  - Your estimates feed a **lottery**.
  - A higher estimate means **more lottery tickets** for that company.
  - Companies drawn in the lottery face a **full audit**, which is
    very costly for them.

---

### PAGE 18
**ID:** `p2_inst_consequence_weight`
**Time lock:** 7 s

**BODY:**
- [headline, 24 px, bold] The higher your estimate, the more likely
  the assessed company will face a full audit.
- [p, 19 px] A full audit reviews every transaction. It's costly for
  the company whether fraud is found or not.

---

### PAGE 19 — Calculator heads-up
**ID:** `p2_inst_calculator_notice`
**Time lock:** 6 s

**Standalone callout page** introducing the floating calculator widget
**before** the first page that calls for arithmetic.

**Kicker** (centered, small caps, primary blue): `HEADS-UP`

**Headline** (centered, 24 px, bold):
- A calculator will appear on the right side of the page.

**BODY:**
- From here on, a small calculator sits on the right side of your
  screen whenever the page calls for arithmetic. Open it any time you
  would like to work out the math. There is no requirement to use it.

---

### PAGE 20 — Practice math #1 (N=10)
**ID:** `p2_inst_try_n10`
**Time lock:** 5 s
**Calculator:** ON

**BODY:**
- [headline, 24 px, semibold] Your turn. What's the fraud estimate?
- [p, 16 px] A company with **10** transactions, all shown.

**VISUALS:** 10-card grid, 5 C + 5 S, mixed order.

**Answer buttons:** `10%` · `30%` · `50%` · `70%`

**Behavior:** `directional` (wrong picks say "too low" / "too high").

**Correct:** 50%.
**Explanation:** *5 of 10 transactions are suspicious → 5 / 10 = 50%.*

---

### PAGE 21 — Practice math #2 (N=20)
**ID:** `p2_inst_try_n20`
**Time lock:** 5 s
**Calculator:** ON

**BODY:**
- [headline, 24 px, semibold] A second example.
- [p, 16 px] A company with **20** transactions, all shown.

**VISUALS:** 10 × 2 grid, 16 C + 4 S.

**Answer buttons:** `10%` · `20%` · `50%` · `80%`

**Behavior:** `directional`.

**Correct:** 20%.
**Explanation:** *4 of 20 transactions are suspicious → 4 / 20 = 20%.*

---

### PAGE 22 — Practice math #3 (N=30)
**ID:** `p2_inst_try_n30`
**Time lock:** 5 s
**Calculator:** ON

**BODY:**
- [headline, 24 px, semibold] A final example.
- [p, 16 px] A company with **30** transactions, all shown.

**VISUALS:** grid of 30, 24 S + 6 C.

**Answer buttons:** `40%` · `60%` · `80%` · `90%`

**Behavior:** `directional`.

**Correct:** 80%.
**Explanation:** *24 of 30 transactions are suspicious → 24 / 30 = 80%.*

---

### PAGE 23 — Attention check (high estimate ⇒ ?)
**ID:** `p2_check_audit`
**Time lock:** 5 s

**Kicker** (centered, small caps, primary blue): `QUICK ATTENTION CHECK`

**Question** (20 px, bold): What happens when you rate a company
**high**?

**Answers (A / B / C / D):**
- A. They never face a full audit.
- B. They face a full audit for sure.
- C. They are more likely to face a full audit. ← correct
- D. Audits are random — your estimate doesn't matter.

**Behavior:** `retry` mode.

**Explanation when correct:** *A higher estimate means more lottery
tickets, and a higher chance of a full audit, though not a guarantee.*

---

# ACT III — THE MANAGER AND THE TWIST

### PAGE 24 — Law requires exactly 4
**ID:** `p3_inst_law_4`
**Time lock:** 5 s

**BODY:**
- [p, 24 px] Here's the catch: A company has many transactions, but the
  law requires it to send you, the auditor, only
  **4** (44 px, red, inline) **transactions** for the preliminary audit.

**VISUALS:** the same 20-document cluster as Page 13, but **4** of the
documents are **highlighted** (gold ring) to show which would be picked.

---

### PAGE 25 — You only see those 4
**ID:** `p3_inst_law_4_nature`
**Time lock:** 5 s

**BODY:**
- [p, 22 px] You only learn the nature (clean vs suspicious) of those
  **4 transactions.**

**VISUALS:** same cluster, the 4 highlighted ones now show their type
(C/S stamps), the remaining 16 show a `?` mark on a hidden background.

**Closing line** (centered, 26 px):
- This means that your view of the company's overall transactions in
  this preliminary audit is **always incomplete**.

---

### PAGE 26 — Attention check (do you see all?)
**ID:** `p3_check_all`
**Time lock:** 5 s

**Kicker** (centered, small caps, primary blue): `QUICK ATTENTION CHECK`

**Question** (22 px, bold): When you audit a company, do you see
**all** of its transactions?

**Answers (A / B):**
- A. Yes, all of them.
- B. No, only 4. ← correct

**Behavior:** `retry` mode.

**Explanation when correct:** *The law requires only 4 transactions per
company.*

---

### PAGE 27 — Attention check (who picks how many)
**ID:** `p3_check_how_many`
**Time lock:** 5 s

**Kicker** (centered, small caps, primary blue): `QUICK ATTENTION CHECK`

**Question** (20 px, bold): Who decides **how many** transactions you
see?

**Answers (A / B / C):**
- A. The law. ← correct
- B. The manager.
- C. You.

**Behavior:** `retry` mode.

**Explanation when correct:** *The law. Fixed at 4; no one can change
it.*

---

### PAGE 28 — Independence interlude: thought experiment
**ID:** `p2_inst_random_a`
**Time lock:** 2 s

**BODY:**
- [headline, 24 px, semibold] Consider the following thought experiment.
- [p, 22 px] Imagine you could grab **one random transaction** from a
  company.

**VISUALS:** an empty single-transaction slot (placeholder, kept
invisible so the layout matches the next page).

---

### PAGE 29 — Independence interlude: it's suspicious
**ID:** `p2_inst_random_b`
**Time lock:** 3 s

**BODY:**
- [headline, 24 px, semibold] Consider the following thought experiment.
- [p, 22 px] Imagine you could grab **one random transaction** from a
  company.

**VISUALS:** the same single slot, now showing one large suspicious (S)
card.

**Closing line** (centered, 22 px, bold, red):
- It turns out to be suspicious.

---

### PAGE 30 — Independence interlude: pose the question
**ID:** `p2_inst_random_c`
**Time lock:** 3 s

**BODY:**
- [headline, 26 px, bold] Does this mean most of the company's other
  transactions are also suspicious?

**VISUALS:** the suspicious card on the left, an arrow `→`, and 9 mini
unknown (`?`) document tiles on the right.

---

### PAGE 31 — Independence interlude: punchline
**ID:** `p2_inst_random_d`
**Time lock:** 8 s

**BODY:**
- [p, 22 px] No. It could be **any** of these companies.

**VISUALS (three cluster panels side by side, micro scale):**
- **Mostly clean** (green label): 18 C + 2 S.
- **Half & half** (slate label): 10 C + 10 S.
- **Mostly suspicious** (red label): 18 S + 2 C.

**Closing line** (centered, 25 px, extra-bold):
- The type of single randomly selected transaction tells you nothing
  about the nature of the rest of the company's transactions.

---

### PAGE 32 — Attention check (one random clean)
**ID:** `p2_attn_random`
**Time lock:** 6 s

**Kicker** (centered, small caps, primary blue): `QUICK ATTENTION CHECK`

**Setup** (20 px, bold): You grab one random transaction from a
company. It's **clean**.

**VISUALS:** one large clean (C) card, centered.

**Question** (20 px, bold): What does that tell you about the
company's other transactions?

**Answers (A / B / C / D):**
- A. Most of them are probably clean too.
- B. Most of them are probably suspicious too.
- C. Nothing — the type of one transaction tells you nothing about the type of another. ← correct
- D. Roughly half of them should be clean too.

**Behavior:** `retry` mode.

**Explanation when correct:** *Right. A random transaction could come
from a mostly-clean, half-and-half, or mostly-suspicious company. One
doesn't tell you the rest.*

---

### PAGE 33 — Bridge: but here, NOT random
**ID:** `p3_inst_not_random`
**Time lock:** 6 s

**BODY** (centered, 28 px, bold; sits on plain background, no callout
box):
- In this study, however, the 4 transactions you see about a company
  are **NOT selected at random** (red) from all of its transactions.

---

### PAGE 34 — Meet the manager
**ID:** `p3_inst_meet_manager`
**Time lock:** 7 s

**BODY:**
- [p, 22 px] Meet the **manager** of the company you are auditing.

**VISUALS (centered):**
- [SVG: indigo "manager" badge — purple square card with a generic
  silhouette of a person, uppercase caption `MANAGER`]

**Closing line:**
- [p, 20 px] The manager is responsible for sending you the 4
  transactions for the preliminary audit.

---

### PAGE 35 — Manager knows all, picks 4
**ID:** `p3_inst_manager_knows_all`
**Time lock:** 5 s

**BODY:**
- [p, 24 px] Here's the catch: the manager **knows the type of every
  transaction** in the company, and decides **which 4** (red) are sent
  for the preliminary audit.

**VISUALS:**
- The manager mini-badge above, captioned `Sees everything`.
- Below: a row of 10 small transaction cards (6 C + 4 S, mixed) — the
  full company.

---

### PAGE 36 — Split view: manager picks 4, auditor sees 4
**ID:** `p3_inst_manager_picks`
**Time lock:** 5 s

**BODY:**
- [headline, 24 px, bold] The manager picks the **4** you see.

**VISUALS (two-panel split):**
- **Left panel:** manager mini-badge labelled `Manager`; below, a row
  of all 10 transactions (6 C + 4 S); caption `Sees all 10`.
- **Center:** small uppercase label `SENT` above a giant arrow `→`.
- **Right panel:** auditor magnifying-glass mini-badge labelled `You`;
  below, a row of 4 cards, all clean (C / C / C / C); caption
  `Sees 4 (manager's pick)`.

---

### PAGE 37 — Mandate split A: giant 4 + headline
**ID:** `p3_inst_mandate_a`
**Time lock:** 3 s

**(3-page progressive sequence: Pages 37–39 share the same headline
visual; rules are revealed one at a time across the three screens.)**

**VISUALS (centered, top of page):**
- A massive `4` (110 px, extra-bold, primary blue).
- Subtitle: `transactions disclosed` (24 px, bold).
- Tag: `REQUIRED BY LAW` (14 px, uppercase, slate).

**BODY:**
- [headline, 22 px, bold] Two rules the manager **cannot** break:

(No rules listed yet — this page is a build-up; rules appear on the
next two pages.)

---

### PAGE 38 — Mandate split B: rule 1
**ID:** `p3_inst_mandate_b`
**Time lock:** 3 s

**(3-page progressive sequence, screen 2 of 3.)**

**VISUALS (centered):**
- Same `4` + `transactions disclosed` + `REQUIRED BY LAW` block as
  Page 37.

**BODY:**
- [headline, 22 px, bold] Two rules the manager **cannot** break:
- [ordered list, 19 px]:
  1. The manager sends **exactly 4** transactions. Not more, not fewer.

---

### PAGE 39 — Mandate split C: rule 1 + rule 2
**ID:** `p3_inst_mandate_c`
**Time lock:** 5 s

**(3-page progressive sequence, screen 3 of 3.)**

**VISUALS (centered):**
- Same `4` + `transactions disclosed` + `REQUIRED BY LAW` block.

**BODY:**
- [headline, 22 px, bold] Two rules the manager **cannot** break:
- [ordered list, 19 px]:
  1. The manager sends **exactly 4** transactions. Not more, not fewer.
  2. The manager **cannot falsify or forge transactions** to change
     their types.

---

### PAGE 40 — Attention check (who picks which?)
**ID:** `p3_check_which`
**Time lock:** 5 s

**Kicker** (centered, small caps, primary blue): `QUICK ATTENTION CHECK`

**Question** (20 px, bold): Who picks **which** transactions you see?

**Answers (A / B / C):**
- A. The law.
- B. Random chance.
- C. The manager. ← correct

**Behavior:** `retry` mode.

**Explanation when correct:** *The law sets how many. The manager
picks which ones.*

---

### PAGE 41 — Attention check (manager can fake?)
**ID:** `p3_check_fake`
**Time lock:** 5 s

**Kicker** (centered, small caps, primary blue): `QUICK ATTENTION CHECK`

**Statement** (20 px, bold): The manager can turn a suspicious
transaction into a clean one.

**Answers (A / B):**
- A. True.
- B. False. ← correct

**Behavior:** `retry` mode.

**Explanation when correct:** *The manager can't fake transactions.
They can only pick which ones get sent.*

---

# ACT IV — STAKES AND YOUR BONUS

### PAGE 42 — Manager's stakes (the raise)
**ID:** `p4_inst_manager_stakes`
**Time lock:** 6 s

**BODY:**
- [headline, 26 px, bold] What's at stake for the manager? Their raise!
- [p, 18 px] A full audit is costly for the company. And if it happens,
  the manager **loses their raise**.

**VISUALS (two scenario lines):**
- *Good for the manager:* `You estimate 10%` → **Full audit** unlikely
  → `Manager gets the raise`.
- *Bad for the manager:* `You estimate 80%` → **Full audit** likely
  → `Manager loses the raise`.

**Closing line:**
- [p, 18 px] The manager therefore wants a **low** fraud estimate.

---

### PAGE 43 — Attention check (manager's incentive)
**ID:** `p4_check_manager_incentive`
**Time lock:** 6 s

**Kicker** (centered, small caps, primary blue): `QUICK ATTENTION CHECK`

**Question** (20 px, bold): Why does the manager **not** want a high
fraud estimate?

**Answers (A / B / C / D):**
- A. A high estimate triggers a personal fine for the manager.
- B. A high estimate makes a full audit likely and costs them their
  raise. ← correct
- C. A high estimate lowers the government auditor's bonus payout.
- D. The manager has no stake in what you estimate.

**Behavior:** `retry` mode.

**Explanation when correct:** *A high estimate makes a full audit
likely, and a full audit costs the manager their raise.*

---

### PAGE 44 — Your stakes
**ID:** `p4_inst_auditor_stakes`
**Time lock:** 8 s

**BODY:**
- [headline, 26 px, bold] What's at stake for **you**?
- [unordered list, 19 px, blue circular badges (#dbe4ff bg, #3730a3
  text), no bullets]:
  1. You earn more when your estimates are **accurate**, summed across
     all 30 companies you will audit.
  2. You also earn extra when you're **confident and correct** (by
     placing bets on your estimates).

---

### PAGE 45 — Two answers: reveal Answer 1
**ID:** `p4_inst_two_answers_a`
**Time lock:** 5 s

**BODY:**
- [headline, 26 px, bold] For each audited company, you are required
  to provide **two** answers.

**VISUALS (two answer cards in a row; second card invisible
placeholder):**
- **Card 1 (visible):**
  - Big number `1`.
  - Title: `Fraud estimate`.
  - Sub: *Your best guess of the share of the company's transactions
    that are suspicious. Be as **precise** as you can.*
- **Card 2 (placeholder):** kept invisible to prevent layout shift.

---

### PAGE 46 — Two answers: reveal Answer 2
**ID:** `p4_inst_two_answers_b`
**Time lock:** 4 s

**BODY:**
- [headline, 26 px, bold] For each audited company, you are required
  to provide **two** answers.

**VISUALS (two answer cards):**
- **Card 1:** Big `1`, title `Fraud estimate`, same sub as Page 45.
- **Card 2:** Big `2`, title `Bet`, sub: *How confident you are that
  your estimate is **within 10 percentage points** of the correct
  answer.*

**Closing line** (centered, 20 px, bold):
- Each one earns its own bonus.

---

### PAGE 47 — Estimate bonus intro
**ID:** `p4_inst_estimate_intro`
**Time lock:** 8 s

**Kicker** (centered, small caps, primary blue):
- Small blue badge `1` + label `Answer 1: fraud estimate`.

**BODY:**
- [headline, 24 px, bold] The estimate bonus.
- [unordered list, 18 px]:
  - If your estimate is **within 10 percentage points** of the correct
    answer, you earn **+10¢**.
  - If your estimate is **more than 10 percentage points** away from
    the correct answer, you earn **0¢**.

---

### PAGE 48 — Walk-through example intro
**ID:** `p4_inst_estimate_example_intro`
**Time lock:** 4 s

**Kicker** (centered, small caps, primary blue):
- Small blue badge `1` + label `Answer 1: fraud estimate`.

**BODY** (centered, 22 px, bold):
- Let us walk through an example. For this company, let's assume that
  the correct answer is **35%** (red).

---

### PAGE 49 — Estimate practice: move to 50% (wrong, 0¢)
**ID:** `p4_inst_estimate_try_50`
**Time lock:** 12 s
**Calculator:** ON

**Kicker** (centered, small caps, primary blue):
- Small blue badge `1` + label `Answer 1: fraud estimate`.

**BODY:**
- [headline, 22 px, bold] Practice this.
- [unordered list, 18 px]:
  - The correct answer for this company is **35%**.
  - Move your estimate to **60%**.

**INTERACTIVE:**
- Estimate slider (0%–100%, default 50). Coverage band moves with the
  thumb. Truth band fixed at 25%–45% (the "within 10 pp" window
  around 35%).
- Live readouts: `Within 10 percentage points of the correct answer?`
  (Yes/No flag), `Estimate bonus:` (in ¢).

**Closing line** (hidden until target reached; 5s read lock follows;
10s cooldown if Next clicked early):
- [p, 20 px, bold, red] At 60%, you're 25 percentage points off the
  correct answer. You earn **0¢** on this company.

---

### PAGE 50 — Estimate practice: move to 30% (correct, +10¢)
**ID:** `p4_inst_estimate_try_30`
**Time lock:** 12 s
**Calculator:** ON

**Kicker** (centered, small caps, primary blue):
- Small blue badge `1` + label `Answer 1: fraud estimate`.

**BODY:**
- [headline, 22 px, bold] Now try a different estimate.
- [unordered list, 18 px]:
  - Same correct answer: **35%**.
  - Move your estimate to **30%**.

**INTERACTIVE:** identical slider widget to Page 49, target = 30.

**Closing line** (hidden until target reached; 5s read lock follows;
10s cooldown if Next clicked early):
- [p, 20 px, bold, green] At 30%, you're within 10 percentage points
  of 35%. You earn **+10¢**.

---

### PAGE 51 — Estimate takeaway
**ID:** `p4_inst_estimate_takeaway`
**Time lock:** 6 s

**Kicker** (centered, small caps, primary blue):
- Small blue badge `1` + label `Answer 1: fraud estimate`.

**BODY:**
- [headline, 22 px, semibold] Summary.
- [p, 18 px] Correct answer **35%** → the bonus pays out for any
  estimate between **25%** and **45%**.

---

### PAGE 52 — Attention check (estimate bonus numeric)
**ID:** `p4_check_estimate_bonus`
**Time lock:** 6 s
**Calculator:** ON

**Kicker** (centered, small caps, primary blue): `QUICK ATTENTION CHECK`

**Question** (20 px, bold): The correct answer is **60%**. You
estimate **55%**. How much would you earn from the estimate?

**Answers (A / B / C / D):**
- A. 0¢
- B. +5¢
- C. +10¢ ← correct
- D. −5¢

**Behavior:** `retry` mode.

**Explanation when correct:** *55% is within 10 percentage points of
60% (difference is 5), so the estimate bonus is +10¢.*

---

### PAGE 53 — Bet intro (concept)
**ID:** `p4_inst_bet_intro`
**Time lock:** 7 s

**Kicker** (centered, small caps, color `#b45309`):
- Small blue badge `2` + label `Answer 2: bet`.

**BODY:**
- [headline, 26 px, bold] The bet.
- [p, 18 px] In addition to your estimate, you may **bet up to 10¢**
  on whether your estimate is within 10 percentage points of the
  correct answer.

---

### PAGE 54 — Bet example (concrete)
**ID:** `p4_inst_bet_example`
**Time lock:** 9 s

**Kicker** (centered, small caps, color `#b45309`):
- Small blue badge `2` + label `Answer 2: bet`.

**BODY:**
- [centered, 22 px, bold] For example, suppose you bet **5¢** on your
  estimate:
- [unordered list, 18 px]:
  - Within 10 percentage points → you **win the bet**: **+5¢**.
  - More than 10 percentage points away → you **lose the bet**: **−5¢**
    (deducted from bonus on other companies).

---

### PAGE 55 — Bet safety (standalone callout)
**ID:** `p4_inst_bet_safety`
**Time lock:** 6 s

**Standalone callout page** reassuring participants that the $5 base pay
is never reduced by lost bets, before any bet practice begins.

**VISUALS (centered green callout, soft border, light-green background):**
- **Headline** (24 px, extra-bold): `Your $5 base pay is never affected.`
- **Sub** (17 px): *Lost bets only reduce the bonus from other
  companies, and the total bonus cannot fall below $0.*

---

### PAGE 56 — Bet practice: good scenario (+18¢)
**ID:** `p4_inst_bet_try_good`
**Time lock:** 12 s
**Calculator:** ON

**Kicker** (centered, small caps, color `#b45309`):
- Small blue badge `2` + label `Answer 2: bet`.

**BODY:**
- [headline, 22 px, bold] Practice this.
- [unordered list, 18 px]:
  - The correct answer is **35%**.
  - Set your estimate to **30%**.
  - Set your bet to **8¢**.

**INTERACTIVE (two stacked slider cards):**
- Estimate slider (0%–100%, default 50%, target 30%).
- Bet slider (0¢–10¢, default 0¢, target 8¢).
- Live readouts: within-band flag, estimate bonus, bet outcome,
  total earned.

**Closing line** (hidden until target reached; 5s read lock follows;
10s cooldown if Next clicked early):
- [p, 20 px, bold, green] Within 10 percentage points, bet won. You
  earn **+18¢**.

---

### PAGE 57 — Bet practice: bad scenario (−8¢)
**ID:** `p4_inst_bet_try_bad`
**Time lock:** 12 s
**Calculator:** ON

**Kicker** (centered, small caps, color `#b45309`):
- Small blue badge `2` + label `Answer 2: bet`.

**BODY:**
- [headline, 22 px, bold] Now try a different estimate.
- [unordered list, 18 px]:
  - Same correct answer: **35%**.
  - Set your estimate to **50%**.
  - Keep your bet at **8¢**.

**INTERACTIVE:** same two-slider widget, default estimate 30%, target
50%; default bet 0¢, target 8¢.

**Closing line** (hidden until target reached; 5s read lock follows;
10s cooldown if Next clicked early):
- [p, 20 px, bold, red] More than 10 percentage points off, bet lost.
  You earn **−8¢**.
- [p, 17 px] Bet **0¢** instead, and you'd have earned **0¢**, not
  lost 8¢. **Only bet when you're confident.**

---

### PAGE 58 — Opposing goals: reveal YOU
**ID:** `p4_inst_opposing_a`
**Time lock:** 2 s

**BODY:**
- [headline, 24 px, bold] Your goal and the manager's are
  **opposite**.

**VISUALS (two cards in a row; second card invisible placeholder):**
- **Auditor card (left, visible):**
  - Icon: teal magnifying-glass mini-badge.
  - Label: `You – the government auditor`.
  - Body: **Detect fraud.** Estimate each company as accurately as
    you can.
- **Manager card (right, placeholder):** invisible to prevent layout
  shift.

---

### PAGE 59 — Opposing goals: reveal MANAGER (vs)
**ID:** `p4_inst_opposing_b`
**Time lock:** 4 s

**BODY:**
- [headline, 24 px, bold] Your goal and the manager's are
  **opposite**.

**VISUALS (two cards in a row, divider `vs` between them):**
- **Auditor card** (same as Page 58).
- **Manager card** (visible):
  - Icon: indigo "manager" mini-badge.
  - Label: `The manager`.
  - Body: Wants the **lowest estimate** possible, ideally **0%**, even
    if the company really is fraudulent.

---

### PAGE 60 — Opposing goals: sum-up
**ID:** `p4_inst_opposing_c`
**Time lock:** 5 s

**BODY** (centered, 30 px, extra-bold):
- The manager wants a **low** *(red)* estimate.
- You want an **accurate** *(teal)* estimate.

**Closing line** (centered, 17 px, slate):
- A full audit costs the manager their raise, whether fraud is found
  or not.

---

# ACT V — COMPREHENSION QUIZ (14 QUESTIONS)

### PAGE 61 — Quiz intro
**ID:** `p5_quiz_intro`
**Time lock:** 8 s

**BODY:**
- [headline, 26 px, bold] A final check before the audits.
- [p, 18 px] Answer 14 quick questions. Each wrong answer triggers a
  **10-second timeout** before you can try again.

---

### Quiz Q1
**ID:** `p5_q1`
**Time lock:** 8 s

**Kicker** (centered, small caps, primary blue): `QUIZ: QUESTION 1 OF 14`

**Question** (20 px, semibold): What is your task in this study?

**Answers (A / B / C / D):**
- A. Decide which companies to invest in.
- B. Assign each company a fraud estimate. ← correct
- C. Give each company a customer-service score.
- D. Pick which transactions the company discloses.

**Behavior:** `retry`.

**Explanation when correct:** *You are the government auditor. You
estimate the percentage of each company's transactions that are
suspicious.*

---

### Quiz Q2
**ID:** `p5_q2`
**Time lock:** 8 s

**Kicker:** `QUIZ: QUESTION 2 OF 14`

**Question:** How many transactions must a company send you?

**Answers (A / B / C / D):**
- A. 1.
- B. 2.
- C. 4. ← correct
- D. All of them.

**Behavior:** `retry`.

**Explanation when correct:** *Exactly 4. Set by law.*

---

### Quiz Q3
**ID:** `p5_q3`
**Time lock:** 8 s

**Kicker:** `QUIZ: QUESTION 3 OF 14`

**Question:** Who decides **how many** transactions are disclosed?

**Answers (A / B / C):**
- A. The law. ← correct
- B. The manager.
- C. You.

**Behavior:** `retry`.

**Explanation when correct:** *The law. Fixed at 4; no one can change
it.*

---

### Quiz Q4 — True/False (random?)
**ID:** `p5_q4`
**Time lock:** 8 s

**Kicker:** `QUIZ: QUESTION 4 OF 14`

**Statement:** The 4 transactions you receive from a company are
**randomly picked** from all of its transactions.

**Answers (A / B):**
- A. True.
- B. False. ← correct

**Behavior:** `retry`.

**Explanation when correct:** *False. The manager picks which 4 to
send.*

---

### Quiz Q5
**ID:** `p5_q5`
**Time lock:** 8 s

**Kicker:** `QUIZ: QUESTION 5 OF 14`

**Question:** Can the manager turn a suspicious transaction into a
clean one?

**Answers (A / B):**
- A. Yes.
- B. No. ← correct

**Behavior:** `retry`.

**Explanation when correct:** *No. The manager can only pick which
ones get sent.*

---

### Quiz Q6
**ID:** `p5_q6`
**Time lock:** 8 s

**Kicker:** `QUIZ: QUESTION 6 OF 14`

**Question:** Fraud estimate =

**Answers (A / B / C / D):**
- A. Your gut feeling about the company, in percent.
- B. The total count of suspicious transactions.
- C. The share of suspicious transactions out of all its transactions. ← correct
- D. Always 50% by default, the same for every company.

**Behavior:** `retry`.

**Explanation when correct:** *The fraud estimate is the share of a
company's transactions that are suspicious.*

---

### Quiz Q7
**ID:** `p5_q7`
**Time lock:** 8 s

**Kicker:** `QUIZ: QUESTION 7 OF 14`

**Question:** What happens when you rate a company **high**?

**Answers (A / B / C / D):**
- A. They never face a full audit.
- B. They face a full audit for sure.
- C. They are more likely to face a full audit. ← correct
- D. Audits are random — your estimate doesn't matter.

**Behavior:** `retry`.

**Explanation when correct:** *Higher estimate → more lottery tickets
→ higher chance of a full audit.*

---

### Quiz Q8
**ID:** `p5_q8`
**Time lock:** 8 s
**Calculator:** ON

**Kicker:** `QUIZ: QUESTION 8 OF 14`

**Question:** Correct answer: **40%**. Your estimate: **46%**. You bet **0¢**. Total bonus?

**Answers (A / B / C / D):**
- A. 0¢.
- B. +10¢. ← correct
- C. +6¢.
- D. −10¢.

**Behavior:** `retry`.

**Explanation when correct:** *46 is within 10 percentage points of
40. Pays the +10¢.*

---

### Quiz Q9
**ID:** `p5_q9`
**Time lock:** 8 s
**Calculator:** ON

**Kicker:** `QUIZ: QUESTION 9 OF 14`

**Question:** Correct answer: **50%**. Estimate: **80%**. Bet:
**7¢**. Total for this company?

**Answers (A / B / C / D):**
- A. +17¢.
- B. +7¢.
- C. 0¢.
- D. −7¢. ← correct

**Behavior:** `retry`.

**Explanation when correct:** *30 percentage points off → 0¢ estimate
bonus. Bet lost → −7¢.*

---

### Quiz Q10
**ID:** `p5_q10`
**Time lock:** 8 s

**Kicker:** `QUIZ: QUESTION 10 OF 14`

**Question:** If you lose several bets, can your **$5 base pay** drop
below $5?

**Answers (A / B):**
- A. Yes — lost bets can pull base pay below $5.
- B. No — base pay is guaranteed and the bonus floors at $0. ← correct

**Behavior:** `retry`.

**Explanation when correct:** *Correct. Lost bets only reduce the
bonus. They never touch the base pay.*

---

### Quiz Q11
**ID:** `p5_q11`
**Time lock:** 8 s

**Kicker:** `QUIZ: QUESTION 11 OF 14`

**Question:** What's the probability that any given transaction is
clean?

**Answers (A / B / C / D):**
- A. 0%.
- B. 25%.
- C. 50%. ← correct
- D. 100%.

**Behavior:** `retry`.

**Explanation when correct:** *Any transaction is a coin flip: 50%
clean, 50% suspicious.*

---

### Quiz Q12
**ID:** `p5_q12`
**Time lock:** 8 s

**Kicker:** `QUIZ: QUESTION 12 OF 14`

**Question:** Why doesn't the manager want a **high** fraud estimate?

**Answers (A / B / C / D):**
- A. A high estimate triggers a personal fine for the manager.
- B. A high estimate makes a full audit likely and costs them their
  raise. ← correct
- C. A high estimate directly reduces the auditor's bonus payout.
- D. The manager has no stake in what you estimate.

**Behavior:** `retry`.

**Explanation when correct:** *A high estimate makes a full audit
likely, and a full audit costs the manager their raise.*

---

### Quiz Q13
**ID:** `p5_q13`
**Time lock:** 8 s

**Kicker:** `QUIZ: QUESTION 13 OF 14`

**Question:** If you are **not at all confident** in your fraud
estimate, how much should you bet?

**Answers (A / B / C / D):**
- A. 10¢, to maximize the upside.
- B. 5¢, to hedge your bet.
- C. 0¢, since you only bet if confident. ← correct
- D. Any amount, since betting is mandatory.

**Behavior:** `retry`.

**Explanation when correct:** *Bet 0. An uncertain estimate is more
likely to miss the 10-point band, and losing a bet only costs you.*

---

### Quiz Q14
**ID:** `p5_q14`
**Time lock:** 8 s
**Calculator:** ON

**Kicker:** `QUIZ: QUESTION 14 OF 14`

**Question:** Correct answer: **25%**. Estimate: **30%**. Bet:
**6¢**. Total for this company?

**Answers (A / B / C / D):**
- A. +16¢. ← correct
- B. +10¢.
- C. +6¢.
- D. −6¢.

**Behavior:** `retry`.

**Explanation when correct:** *30 is within 10 percentage points of
25 → +10¢ estimate bonus. Bet won → +6¢. Total = +16¢.*

---

### PAGE 76 — You're ready
**ID:** `p5_ready`
**Time lock:** 6 s

**BODY:**
- [headline, 26 px, bold] You are ready.
- [p, 19 px] The audits proceed in two parts:
- [ordered list, 18 px]:
  1. **5 warm-up audits.** These help you become familiar with the
     task. **No bonus** on these.
  2. **30 scored audits.** These count toward your bonus, **up to
     $6.00**.

---

# ACT VI — THE TRIALS (5 + 15 + 15)

### PAGE 77 — Firm sizes A: small (10)
**ID:** `p6_firm_sizes_a`
**Time lock:** 2 s

**BODY:**
- [headline, 26 px, bold] One last thing. Companies come in different
  sizes.

**VISUALS (three firm-size cards in a row; only Small is visible,
Medium and Large are placeholder-invisible):**
- **Small:** small filing cabinet SVG, number `10`, sub
  `transactions (small)`.
- *(Medium and Large reserved as invisible placeholders so the layout
  doesn't shift on the next two pages.)*

**Closing line** (centered, 20 px, bold):
- Some are **small** — **10 transactions**.

---

### PAGE 78 — Firm sizes B: medium (20)
**ID:** `p6_firm_sizes_b`
**Time lock:** 2 s

**BODY:**
- [headline, 26 px, bold] One last thing. Companies come in different
  sizes.

**VISUALS:**
- **Small** card visible (as Page 77).
- **Medium** card now visible: medium cabinet SVG, number `20`, sub
  `transactions (medium)`.
- **Large** card still placeholder-invisible.

**Closing line** (centered, 20 px, bold):
- Some are **medium** — **20 transactions**.

---

### PAGE 79 — Firm sizes C: large (30)
**ID:** `p6_firm_sizes_c`
**Time lock:** 3 s

**BODY:**
- [headline, 26 px, bold] One last thing. Companies come in different
  sizes.

**VISUALS:** all three cards visible.
- **Small** (10 transactions), **Medium** (20), **Large** (30 — large
  filing cabinet SVG, sub `transactions (large)`).

**Closing line** (centered, 20 px, bold):
- Some are **large** — **30 transactions**.

---

### PAGE 80 — Firm sizes: rule reminder
**ID:** `p6_firm_sizes_rule`
**Time lock:** 7 s

**BODY** (two centered, bold paragraphs at 26 px):
- We'll tell you each company's size.
- The law still requires the manager to disclose **exactly 4** *(red)*,
  regardless of size.

---

### PAGE 81 — Practice intro
**ID:** `p6_practice_intro`
**Time lock:** 8 s

**BODY:**
- [headline, 28 px, bold] First, **5 warm-up audits**.
- [unordered list, 18 px]:
  - The task is the same as the scored audits: provide an estimate
    and a bet.
  - **These do not count toward your bonus.**
  - At the end, we will report how much you *would have* earned, so
    you can see your performance before the scored rounds begin.

**Closing line** (centered, 20 px, bold):
- Treat them seriously: the 30 scored audits begin immediately
  afterward.

---

### BLOCK 1 — Warm-up trials (5 unscored audits, K = 4)
**ID:** `block_practice`
**Type:** `trial_block` (block 0, practice)
**Per-trial time lock:** 10 s

**Sampling:** 5 trials sampled from the 15 phase-1 (K=4) stimuli,
**stratified by k ∈ {0, 1, 2, 3, 4}** (one per stratum). Order is a
stable shuffle seeded by Prolific PID. The trial intro splash reads
"Practice X" instead of "Company X" and shows for **2 seconds** (down
from 5 in earlier versions).

**Per-trial layout** (same as scored, with these differences):
- Header card uses an amber gradient instead of dark slate, with a
  white `WARM-UP` pill, "Practice X of 5" counter, and italic note:
  *"No bonus on these. Take them seriously."*
- Responses stored in `practiceResponses` (separate from
  `trialResponses`); they don't enter the bonus calculation.

---

### PAGE 83 — Practice summary
**ID:** `p6_practice_summary`
**Time lock:** 10 s
**Type:** `practice_summary`

**Card layout** (centered, max-width ~620 px, soft shadow):
- **Kicker** (amber, uppercase): `Warm-up complete`.
- **Title** (24 px, bold): You finished the 5 warm-up audits.
- **Amount panel** (green tint, 2-px green border):
  - Label: "If these had counted, you would have earned:"
  - Amount (36 px, bold, dark green): `USD $X.XX`
  - Sub-label (14 px): "out of a possible USD $1.00 on 5 rounds
    (NN% of the max)."
- **Reminder note** (amber call-out): *These 5 rounds don't count
  toward your real bonus. We won't tell you which specific rounds you
  got right — the scored rounds are next, and your accuracy on those
  is what pays.*

**Design choice:** aggregate only. We deliberately do **not** show
per-round correctness, to prevent participants from reverse-engineering
which selection they got right and carrying it into scored rounds.

---

### PAGE 84 — Scored intro
**ID:** `p6_scored_intro`
**Time lock:** 6 s

**BODY:**
- [headline, 26 px, bold] The scored audits begin now.
- [p, 19 px] The following **30 audits** count toward your bonus, up
  to **$6.00**.
- [p, 17 px, dark slate] The task is the same as the warm-up.

---

### BLOCK 2 — 15 companies, K = 4
**ID:** `block_k4`
**Type:** `trial_block` (block 1)
**Per-trial time lock:** 10 s

Every combination of:
- N ∈ {10, 20, 30} (size)
- k ∈ {0, 1, 2, 3, 4} (suspicious count among disclosed)

Order randomized per participant. Trial intro splash (2 s) shows
**"Company X of 30"**.

**Per-trial page layout:**
- Header: **"Company X of 30"** (global counter, not per-block).
- **Header bullet list** (big, bold, no colored background):
  - `Company Size: [Small | Medium | Large] (N transactions)`
  - `The manager sent the following [K] transactions:` (K = 4 here)
- **Disclosed transactions** (small cards, C/S stamps): in a row
  directly under the bullets.
- Estimate slider, 0%–100%. **Requires a drag** even if the
  participant ends at 50% (a check against no-interaction clicks).
- Coverage band under the slider thumb shows the 10-percentage-point
  window the current estimate covers.
- Bet slider, 0¢–10¢, default 0¢.
- Next disabled for the first 10 s. If the estimate slider hasn't been
  touched, a red error appears instead of advancing.

---

### PAGE 86 — Rule change: announcement
**ID:** `p6_rule_change_a`
**Time lock:** 10 s

**Kicker** (centered, small caps, primary blue): `RULE CHANGE`

**BODY:**
- [headline, 28 px, extra-bold, centered] Audit regulations just
  changed.

**VISUALS (centered row):**
- **Old rule** card: label `Old rule`, number `4` struck through.
- **Arrow** `→`.
- **New rule** card: green-tinted, label `New rule`, number `8`.

**Emphasized callout** (26 px, extra-bold, centered):
- Managers must now disclose **8** *(green)* transactions, not **4**
  *(red, struck through)*.

---

### PAGE 87 — Rule change: everything else the same
**ID:** `p6_rule_change_b`
**Time lock:** 7 s

**BODY:**
- [p, 22 px, weight 600] Everything else stays the same: the manager
  still picks which ones, you still estimate and bet.
- [p, 20 px] **15 more companies** under the new rule.

---

### BLOCK 3 — 15 companies, K = 8
**ID:** `block_k8`
**Type:** `trial_block` (block 2)
**Per-trial time lock:** 10 s

Every combination of:
- N ∈ {10, 20, 30}
- k ∈ {0, 1, 4, 7, 8}

Same per-trial layout as Block 2; the global counter continues
(16 of 30, 17 of 30, ...). The header reads `The manager sent the
following 8 transactions:`.

**Across the full 30-trial run (Blocks 2 + 3):** 3 attention checks
are interleaved at random positions (`trialAttentionCheckCount: 3`).

---

# ACT VII — WRAP-UP

### PAGE 89 — Demographics
**ID:** `demographics`
**Type:** `questionnaire`
**Time lock:** 10 s
**TITLE:** About You

**Questions:**
- **Age** *(dropdown, required)*: 18-24 · 25-34 · 35-44 · 45-54 ·
  55-64 · 65 or older.
- **Gender** *(dropdown, required)*: Male · Female · Non-binary ·
  Other · Prefer not to say.
- **Stats comfort** *(5-point Likert, required)*:
  *"How comfortable are you with probability and statistics?"*
  1 = Not at all · 5 = Very comfortable.

---

### PAGE 90 — Debrief (deliberately minimal)
**ID:** `debrief`
**Type:** `debrief`
**Time lock:** none
**TITLE:** Thank You, Government Auditor

**BODY:**
- Thanks for taking part in this study.
- Your bonus is shown below. Use the completion code to register your
  submission on Prolific.

**Design choice:** intentionally does NOT reveal the study's
hypothesis, what the "correct" reasoning would have been, or the real
incentive structure behind disclosure. A detailed explanation at the
end can prime future participants (word-of-mouth on Prolific) and
distort later samples.

**EXTRAS:**
- Earned bonus displayed (`showBonus: true`).
- Completion code `COMP2SN` + Prolific return button.

---

# END OF SCRIPT
