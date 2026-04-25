# SURVEY SCRIPT — FBO 2 (Selection Neglect)

*A page-by-page script of the current survey, generated from
`survey/js/config.js`. Mark it up; I'll apply the edits to the code.*

**How to edit this file:**
- Every page has a `### PAGE N` heading. Numbers are just markers — I'll
  renumber after each round of edits so you don't have to.
- Everything below a page heading is fair game.
- Inline edit comments: `[[ ... ]]` (e.g. `[[ shorten ]]`, `[[ DELETE ]]`).
- To add a page, write a new `### PAGE NEW` section wherever you want it.
- To delete a page, write `[[ DELETE PAGE ]]` at the top of its section.
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
  field on each page in `config.js`.
- **Calculator widget:** a floating calculator docks on the right side
  of every page where the participant has to do arithmetic (any page
  with `showCalculator: true`). Supports `+ − × ÷`, parentheses,
  decimals, `=`. Every keystroke is logged with the current page id.
- **Dev mode (`?dev=true`):** time locks are skipped, the resume prompt
  is suppressed when `?start=<page_id>` is set, and a floating page
  jumper appears in the top-left with a searchable list of every page.
- **AI-bot stealth check:** every page injects an invisible honeypot
  question in a rotating non-Latin script (Chinese, Hindi, Japanese,
  Russian, Greek, binary, reversed English, or a prompt-injection
  attempt). Field type rotates across text / radio / checkbox. Humans
  never see it (off-screen, 1-px, transparent); a DOM-scraping bot
  will try to answer it, which flags the submission. Stored in
  `stealthCheck` in the raw data blob.

---

## Study parameters (for reference, not a page)

- **Base pay:** $3.00, guaranteed; never reduced.
- **Performance bonus:** up to **$6.00**, accumulated across 30 companies.
  - Per company: **+10¢** if your estimate is within **10 percentage
    points** of the correct answer, **± your bet** (0–10¢) on the same
    within-10-percentage-points event.
  - Best case per company: +20¢. Worst case per company: −10¢.
  - Summed across all 30 companies, floored at $0. Losses on one company
    eat into gains on another, never into base pay.
- **Pay range:** $3.00 to $9.00.
- **Bonus benchmark (piecewise):** the "correct answer" used for payout
  depends on `k` (the number of suspicious transactions among those
  disclosed):
  - **`k = 0`** (no disclosed transaction is suspicious): the benchmark
    is the **uniform-prior posterior**, which equals the naive 50/50
    formula on undisclosed transactions: `(N − K) / (2 N)`. Same number
    as the "naive" formula, but for a Bayesian reason — a manager who
    hid 0 disclosed-suspicious is consistent with any number of
    suspicious among the hidden, and the posterior mean under a uniform
    prior is the midpoint.
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
- **Time.** About 20 minutes.
- **Pay.** $3.00 base + up to $6.00 performance bonus. Base pay is
  **guaranteed**; no penalty can reduce it.
- **Risks.** None beyond everyday life.
- **Confidentiality.** Anonymous. We collect your Prolific ID only for
  payment.
- **Voluntary.** You may withdraw at any time by closing this window.

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
- At the end of the study, we reveal each company's **correct answer**. **The closer your estimate to the correct answer, the more you earn.**

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
- [p, 17 px] This is a single transaction. You will not need to read
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
- [headline, 24 px, semibold] Any given transaction is a coin flip.

**VISUALS:** the same two cards, captioned **`50%`** each.

**Closing line** (centered, 22 px, bold):
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
- [headline, 24 px, semibold] Companies vary in how many of their
  transactions are suspicious.

**VISUALS (two cluster panels side by side, mini scale):**
- **Mostly clean** (green label): 18 C + 2 S, same 20 positions as the
  cluster page.
- **Mostly suspicious** (red label): 2 C + 18 S, same 20 positions.

**Closing line:**
- [p, 19 px] Your task is to distinguish them by providing a **fraud
  estimate**.

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
- B. The number of suspicious transactions.
- C. The share of a company's transactions that are suspicious. ← correct
- D. Always 50%.

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

### PAGE 19 — Practice math #1 (N=10)
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

### PAGE 20 — Practice math #2 (N=20)
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

### PAGE 21 — Practice math #3 (N=30)
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

### PAGE 22 — Attention check (high estimate ⇒ ?)
**ID:** `p2_check_audit`
**Time lock:** 5 s

**Kicker** (centered, small caps, primary blue): `QUICK ATTENTION CHECK`

**Question** (20 px, bold): What happens when you rate a company
**high**?

**Answers (A / B / C / D):**
- A. They never get audited.
- B. They get audited for sure.
- C. They're more likely to be picked for a full audit. ← correct
- D. It's random. Your estimate doesn't matter.

**Behavior:** `retry` mode.

**Explanation:** *A higher estimate means more lottery tickets, and a
higher chance of a full audit, though not a guarantee.*

---

# ACT III — THE MANAGER AND THE TWIST

*(Note on ordering: in the live config, the early law-setup pages
(`p3_inst_law_4`, `p3_inst_law_4_nature`, `p3_check_all`,
`p3_check_how_many`) come first, followed by the "Independence
interlude" pages — `p2_inst_random_*` and `p2_attn_random` — then the
bridge `p3_inst_not_random` and the manager intro. The page order
below mirrors the JS array exactly.)*

### PAGE 23 — Law: send only 4
**ID:** `p3_inst_law_4`
**Time lock:** 5 s

**BODY:**
- [p, 22 px] Here's the catch.
- [headline, 26 px, bold] A company has many transactions, but the
  law requires it to send you, the auditor, only **4** transactions
  for the preliminary audit. *(big red 44 px "4")*.

**VISUALS:** the same transaction cluster from the cluster page, with
**4 icons highlighted** (thick black outline). The remaining icons
stay neutral.

---

### PAGE 24 — You only see those 4
**ID:** `p3_inst_law_4_nature`
**Time lock:** 5 s

**BODY:**
- [headline, 26 px, bold] You only learn the nature (clean or
  suspicious) of those **4** transactions.

**VISUALS:** same cluster. The 4 highlighted docs now show their
stamps (3 C + 1 S). All other docs show a `?`.

**Closing line** (centered, 24 px, extra-bold):
- This means that your view of the company's overall transactions in
  this preliminary audit is **always incomplete**.

---

### PAGE 25 — Attention check: do you see all?
**ID:** `p3_check_all`
**Time lock:** 5 s

**Kicker** (centered, small caps, primary blue): `QUICK ATTENTION CHECK`

**Question** (22 px, bold): When you audit a company, do you see
**all** of its transactions?

**Answers (A / B):**
- A. Yes, all of them.
- B. No, only 4. ← correct

**Behavior:** `retry` mode.

**Explanation:** *The law requires only 4 transactions per company.*

---

### PAGE 26 — Attention check: who picks how many?
**ID:** `p3_check_how_many`
**Time lock:** 5 s

**Kicker** (centered, small caps, primary blue): `QUICK ATTENTION CHECK`

**Question** (20 px, bold): Who decides **how many** transactions you
see?

**Answers:**
- A. The law. ← correct
- B. The manager.
- C. You.

**Behavior:** `retry` mode.

**Explanation:** *The law. Fixed at 4; no one can change it.*

---

### PAGE 27 — Independence: setup (reveal step 1)
**ID:** `p2_inst_random_a`
**Time lock:** 2 s

**BODY:**
- [lead-in, 24 px, semibold] Consider the following thought experiment.
- [p, 22 px] Imagine you could grab **one random transaction** from a
  company.

**VISUALS:** single large transaction slot, centered, kept invisible
(visibility:hidden) to reserve space.

---

### PAGE 28 — Independence: reveal the sample
**ID:** `p2_inst_random_b`
**Time lock:** 3 s

**BODY:** same lead-in and body as the previous page.

**VISUALS:** same slot; now showing a red **S** card.

**Closing line** (centered, 22 px, bold, red):
- It turns out to be suspicious.

---

### PAGE 29 — Independence: pose the question
**ID:** `p2_inst_random_c`
**Time lock:** 3 s

**BODY:**
- [headline, 26 px, bold] Does this mean most of the company's other
  transactions are also suspicious?

**VISUALS:** the big S card on the left, an arrow `→`, then a row of
9 small `?` placeholder cards.

---

### PAGE 30 — Independence: punchline
**ID:** `p2_inst_random_d`
**Time lock:** 8 s

**BODY:**
- [headline, 26 px, bold] No. It could be **any** of these companies.
- [p, 17 px, secondary] A single suspicious transaction is consistent
  with a mostly-clean company, a half-and-half company, or a
  mostly-suspicious company.

**VISUALS:** three side-by-side micro cluster panels (Mostly clean /
Half & half / Mostly suspicious), each containing at least one S so
the observed transaction is consistent with all three.

**Closing line** (centered, 22 px, extra-bold):
- A single random transaction tells you very little about the rest.

---

### PAGE 31 — Independence: attention check (flipped to clean)
**ID:** `p2_attn_random`
**Time lock:** 6 s

**Kicker** (centered, small caps, primary blue): `QUICK ATTENTION CHECK`

**Setup** (20 px, bold): You grab one random transaction from a
company. It's **clean**.

**VISUALS:** single clean C card, centered.

**Question** (20 px, bold): What does that tell you about the
company's other transactions?

**Answers (A / B / C / D):**
- A. Most of them are probably clean too.
- B. Most of them are probably suspicious.
- C. Nothing. One random transaction doesn't tell you about the rest. ← correct
- D. Exactly half are clean.

**Behavior:** `retry` mode. Visible card is **clean** (opposite of the
teaching example) so the participant can't pattern-match on
"suspicious → nothing".

**Explanation when correct:** *Right. A random transaction could come
from a mostly-clean, half-and-half, or mostly-suspicious company. One
doesn't tell you the rest.*

---

### PAGE 32 — Bridge: "not selected at random"
**ID:** `p3_inst_not_random`
**Time lock:** 6 s

**Standalone page.** No kicker, no call-out. One centered sentence,
28 px, bold, dropped ~80 px from the top:

> In this study, however, the 4 transactions you see about a company
> are **NOT selected at random** from all of its transactions.

The key phrase is in red bold for emphasis.

---

### PAGE 33 — Meet the manager
**ID:** `p3_inst_meet_manager`
**Time lock:** 7 s

**BODY:**
- [headline, 26 px, bold] Meet the **manager** of the company you are
  auditing.

**VISUALS:** [SVG: manager badge — indigo rounded square with white
person silhouette, uppercase caption `MANAGER`].

**Closing line:**
- [p, 20 px] The manager is responsible for sending you the company's
  transactions for the preliminary audit.

---

### PAGE 34 — Manager knows all, picks 4
**ID:** `p3_inst_manager_knows_all`
**Time lock:** 5 s

**BODY:**
- [headline, 24 px, bold] Here's the catch: the manager knows the type
  of every transaction in the company, and decides **which 4** are
  sent for the preliminary audit.

**VISUALS:** mini manager badge above, captioned `Sees everything`.
Below: all 10 of the company's transactions with their true stamps
(6 C + 4 S).

---

### PAGE 35 — Split view: manager picks, auditor sees 4
**ID:** `p3_inst_manager_picks`
**Time lock:** 5 s

**BODY:**
- [headline, 24 px, bold] The manager picks the **4** you see.

**VISUALS (split view):**
- **Manager side:** badge + full set of **10** transactions
  (6 C + 4 S). Caption: `Sees all 10`.
- **→** arrow.
- **Auditor side:** badge + the 4 the manager chose to send,
  **all Clean** (`C C C C`). Caption: `Sees 4 (manager's pick)`.

---

### PAGE 36 — The two rules the manager can't break
**ID:** `p3_inst_mandate`
**Time lock:** 6 s

**VISUALS (centered):**
- Enormous `4`, 110 px, primary-blue, ultra-bold.
- Small caps caption below: `REQUIRED BY LAW`.

**BODY:**
- [headline, 22 px, bold] Two rules the manager **cannot** break:
- [ordered list, 19 px]:
  1. The manager sends **exactly 4** transactions. Not more, not fewer.
  2. The manager cannot falsify or forge transactions to change their
     type.

---

### PAGE 37 — Attention check: who picks which?
**ID:** `p3_check_which`
**Time lock:** 5 s

**Kicker** (centered, small caps, primary blue): `QUICK ATTENTION CHECK`

**Question** (20 px, bold): Who picks **which** transactions you see?

**Answers:**
- A. The law.
- B. Random chance.
- C. The manager. ← correct

**Behavior:** `retry` mode.

**Explanation:** *The law sets how many. The manager picks which ones.*

---

### PAGE 38 — Attention check: can the manager fake?
**ID:** `p3_check_fake`
**Time lock:** 5 s

**Kicker** (centered, small caps, primary blue): `QUICK ATTENTION CHECK`

**Question** (20 px, bold): The manager can turn a suspicious
transaction into a clean one.

**Answers (A / B):**
- A. True.
- B. False. ← correct

**Behavior:** `retry` mode.

**Explanation:** *The manager can't fake transactions. They can only
pick which ones get sent.*

---

# ACT IV — STAKES AND YOUR BONUS

### PAGE 39 — Manager's stakes (the raise)
**ID:** `p4_inst_manager_stakes`
**Time lock:** 6 s

**BODY:**
- [headline, 26 px, bold] What's at stake for the manager? Their raise!
- [p, 18 px] A full audit is costly for the company. And if it
  happens, the manager **loses their raise**.

**VISUALS (two scenario lines):**
- Line 1 (green): `You estimate 10%` → **Full audit** unlikely → **Manager gets the raise**.
- Line 2 (red): `You estimate 80%` → **Full audit** likely → **Manager loses the raise**.

**Closing line:**
- [p, 18 px] The manager therefore wants a **low** fraud estimate.

---

### PAGE 40 — Attention check (manager's incentive)
**ID:** `p4_check_manager_incentive`
**Time lock:** 6 s

**Kicker** (centered, small caps, primary blue): `QUICK ATTENTION CHECK`

**Question** (20 px, bold): Why does the manager **not** want a high
fraud estimate?

**Answers (A / B / C / D):**
- A. A high estimate triggers a fine on the manager.
- B. A high estimate makes a full audit likely, and a full audit costs
  the manager their raise. ← correct
- C. A high estimate lowers the government auditor's bonus.
- D. The manager doesn't care about your estimate.

**Behavior:** `retry` mode.

**Explanation when correct:** *A high estimate makes a full audit
likely, and a full audit costs the manager their raise.*

---

### PAGE 41 — Your stakes
**ID:** `p4_inst_auditor_stakes`
**Time lock:** 8 s

**BODY:**
- [headline, 26 px, bold] What's at stake for **you**?
- [ordered list, 19 px]:
  1. You earn more when your estimates are **accurate**, summed across
     all 30 companies you will audit.
  2. You also earn extra when you're **confident and correct** (by
     placing bets on your estimates).

---

### PAGE 42 — Two answers (reveal Answer 1)
**ID:** `p4_inst_two_answers_a`
**Time lock:** 5 s

**BODY:**
- [headline, 26 px, bold] For each audited company, you are required
  to provide **two** answers.

**VISUALS (two cards, second invisible placeholder):**
- Card 1 (visible): `1`, **Fraud estimate**. *Your best guess of the
  share of the company's transactions that are suspicious. Be as
  **precise** as you can.*
- Card 2 (invisible): `2`, **Bet** (reserves space).

---

### PAGE 43 — Two answers (reveal Answer 2)
**ID:** `p4_inst_two_answers_b`
**Time lock:** 4 s

**BODY:**
- [headline, 26 px, bold] For each company, you give **two** answers.

**VISUALS (both cards visible):**
- Card 1: `1`, **Fraud estimate**. *Your best guess of the share of
  the company's transactions that are suspicious. Be as **precise**
  as you can.*
- Card 2: `2`, **Bet**. *How confident you are that your estimate is
  **within 10 percentage points** of the correct answer.*

**Closing line** (centered, 20 px, bold):
- Each one earns its own bonus.

---

### PAGE 44 — Estimate bonus intro
**ID:** `p4_inst_estimate_intro`
**Time lock:** 8 s

**Kicker** (centered, small caps, primary blue): `ANSWER 1: FRAUD ESTIMATE`

**BODY:**
- [headline, 24 px, bold] The estimate bonus.
- [bullet list, 18 px]:
  - If your estimate is **within 10 percentage points** of the correct
    answer, you earn **+10¢**.
  - If your estimate is **more than 10 percentage points** away from
    the correct answer, you earn **0¢**.

---

### PAGE 45 — Walk-through example intro
**ID:** `p4_inst_estimate_example_intro`
**Time lock:** 4 s

**Standalone page**, dropped ~60 px from the top.

**BODY:**
- [p, 20 px] Let us walk through an example. For this company, let's
  assume that the correct answer is **35%**.

---

### PAGE 46 — Estimate practice (move to 50%, wrong, 0¢)
**ID:** `p4_inst_estimate_try_50`
**Time lock:** 12 s
**Calculator:** ON

**BODY:**
- [headline, 22 px, bold] Practice this.
- [bullet list, 18 px]:
  - The correct answer for this company is **35%**.
  - Move your estimate to **50%**.

**INTERACTIVE:**
- Estimate slider 0–100%. Band shaded 25–45% (within-10 window of 35).
- Live result: `Within 10 percentage points of the correct answer? No ✗` ·
  `Estimate bonus: 0¢`.
- Next unlocks once the slider reaches 50%.

**Closing line** (left-aligned, 20 px, bold, red):
- At 50%, you're 15 percentage points off the correct answer. You
  earn **0¢** on this company.

---

### PAGE 47 — Estimate practice (move to 30%, right, +10¢)
**ID:** `p4_inst_estimate_try_30`
**Time lock:** 12 s
**Calculator:** ON

**BODY:**
- [headline, 22 px, bold] Now try a different estimate.
- [bullet list, 18 px]:
  - Same correct answer: **35%**.
  - Move your estimate to **30%**.

**INTERACTIVE:** same layout. Next unlocks at 30 (inside the band).
- `Within 10 percentage points of the correct answer? Yes ✓` ·
  `Estimate bonus: +10¢`.

**Closing line** (left-aligned, 20 px, bold, green):
- At 30%, you're within 10 percentage points of 35%. You earn **+10¢**.

---

### PAGE 48 — Takeaway
**ID:** `p4_inst_estimate_takeaway`
**Time lock:** 6 s

**BODY:**
- [headline, 22 px, semibold] Summary.
- [p, 18 px] Correct answer **35%** → the bonus pays out for any
  estimate between **25%** and **45%**.

---

### PAGE 49 — Attention check (estimate bonus, numeric)
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

**Behavior:** `retry` mode. Uses a fresh truth (60%) so participants
who memorized the 35/25/45 example must apply the rule.

**Explanation when correct:** *55% is within 10 percentage points of
60% (difference is 5), so the estimate bonus is +10¢.*

---

### PAGE 50 — Bet intro
**ID:** `p4_inst_bet_intro`
**Time lock:** 7 s

**BODY:**
- [headline, 26 px, bold] The bet.
- [p, 18 px] In addition to your estimate, you may **bet up to 10¢**
  on whether your estimate is within 10 percentage points of the
  correct answer.

---

### PAGE 51 — Bet example
**ID:** `p4_inst_bet_example`
**Time lock:** 9 s

**BODY:**
- [p, 22 px, bold, centered] For example, suppose you bet **5¢** on
  your estimate:
- [bullet list, 18 px]:
  - Within 10 percentage points → you **win the bet**: **+5¢**.
  - More than 10 percentage points away → you **lose the bet**: **−5¢**
    (deducted from bonus on other companies).
  - Your **$3 base pay is never affected.** Lost bets only reduce the
    bonus from other companies, and the total bonus cannot fall below
    $0.

---

### PAGE 52 — Bet practice, good scenario (+18¢)
**ID:** `p4_inst_bet_try_good`
**Time lock:** 12 s
**Calculator:** ON

**BODY:**
- [headline, 22 px, bold] Practice this.
- [bullet list, 18 px]:
  - The correct answer is **35%**.
  - Set your estimate to **30%**.
  - Set your bet to **8¢**.

**INTERACTIVE (estimate + bet sliders):**
- Estimate band: 25–45%. Bet slider 0–10¢.
- Live tiles update as you drag:
  - `Within 10 percentage points? Yes ✓`
  - `Estimate bonus: +10¢`
  - `Bet outcome: +8¢`
  - **Total: +18¢** (bold, green).

**Closing line** (left-aligned, 20 px, bold, green):
- Within 10 percentage points, bet won. You earn **+18¢**.

---

### PAGE 53 — Bet practice, bad scenario (−8¢)
**ID:** `p4_inst_bet_try_bad`
**Time lock:** 12 s
**Calculator:** ON

**BODY:**
- [headline, 22 px, bold] Now try a different estimate.
- [bullet list, 18 px]:
  - Same correct answer: **35%**.
  - Set your estimate to **50%**.
  - Keep your bet at **8¢**.

**INTERACTIVE:** same layout. Estimate starts at 30 (inside band),
target moves to 50 (out of band).
- Live tiles:
  - `Within 10 percentage points? No ✗`
  - `Estimate bonus: 0¢`
  - `Bet outcome: −8¢`
  - **Total: −8¢** (bold, red).

**Closing line** (left-aligned, 20 px, bold, red):
- More than 10 percentage points off, bet lost. You earn **−8¢**.

**Footer note** (17 px):
- Bet **0¢** instead, and you'd have earned **0¢**, not lost 8¢.
  **Only bet when you're confident.**

---

### PAGE 54 — Opposing goals (reveal YOU)
**ID:** `p4_inst_opposing_a`
**Time lock:** 2 s

**BODY:**
- [headline, 24 px, bold] Your goal and the manager's are **opposite**.

**VISUALS (two-card layout, only Auditor card revealed):**
- **Auditor card** (visible): teal magnifier-on-document icon. Label
  `You – the government auditor`. Body: **Detect fraud.** Estimate
  each company as accurately as you can.
- `vs` divider and **Manager card**: invisible placeholders so the
  next page doesn't shift layout.

---

### PAGE 55 — Opposing goals (reveal MANAGER)
**ID:** `p4_inst_opposing_b`
**Time lock:** 4 s

**BODY:** same headline as the previous page.

**VISUALS (both cards visible):**
- **Auditor card** (left): teal magnifier icon. Label `You – the
  government auditor`. Body: **Detect fraud.** Estimate each company
  as accurately as you can.
- `vs` divider, centered.
- **Manager card** (right): indigo manager badge. Label `The manager`.
  Body: Wants the **lowest estimate** possible, ideally **0%**, even
  if the company really is fraudulent.

---

### PAGE 56 — The punchline, emphasized
**ID:** `p4_inst_opposing_c`
**Time lock:** 5 s

**Standalone page**, centered, no visuals. Two big bold lines
(30 px, weight 800), color-coded:

> The manager wants a <span style="color:red">**low**</span> estimate.
>
> You want an <span style="color:green">**accurate**</span> estimate.

**Small note below** (17 px, soft slate, centered):
- A full audit costs the manager their raise, whether fraud is found
  or not.

---

# ACT V — COMPREHENSION QUIZ (13 QUESTIONS)

*Same retry-with-10-second-timeout behavior as the attention checks.
Participants can't advance until every question is answered correctly.
Per-quiz-question time lock: 8 s by default.*

### PAGE 57 — Quiz intro
**ID:** `p5_quiz_intro`
**Time lock:** 8 s

**BODY:**
- [headline, 26 px, bold] A final check before the audits.
- [p, 18 px] Answer 13 quick questions. Each wrong answer triggers a
  **10-second timeout** before you can try again.

---

### Quiz Q1
**ID:** `p5_q1`
**Time lock:** 8 s
**Kicker:** `QUIZ: QUESTION 1 OF 13`

**Question:** What is your job in this study?
- A. Decide which companies to invest in.
- B. Give each company a fraud estimate based on its transactions. ← correct
- C. Give each company a customer-service score.
- D. Pick which transactions the company discloses.

**Explanation:** *You are the government auditor. You estimate the
percentage of each company's transactions that are suspicious.*

---

### Quiz Q2
**ID:** `p5_q2`
**Time lock:** 8 s
**Kicker:** `QUIZ: QUESTION 2 OF 13`

**Question:** How many transactions must a company send you?
- A. 1.
- B. 2.
- C. 4. ← correct
- D. All of them.

**Explanation:** *Exactly 4. Set by law.*

---

### Quiz Q3
**ID:** `p5_q3`
**Time lock:** 8 s
**Kicker:** `QUIZ: QUESTION 3 OF 13`

**Question:** Who decides **how many** transactions are disclosed?
- A. The law. ← correct
- B. The manager.
- C. You.

**Explanation:** *The law. Fixed at 4; no one can change it.*

---

### Quiz Q4 — True/False (random?)
**ID:** `p5_q4`
**Time lock:** 8 s
**Kicker:** `QUIZ: QUESTION 4 OF 13`

**Question (True/False):** The 4 transactions you receive from a
company are **randomly picked** from all of its transactions.
- A. True.
- B. False. ← correct

**Explanation:** *False. The manager picks which 4 to send.*

---

### Quiz Q5
**ID:** `p5_q5`
**Time lock:** 8 s
**Kicker:** `QUIZ: QUESTION 5 OF 13`

**Question:** Can the manager turn a suspicious transaction into a
clean one?
- A. Yes.
- B. No. ← correct

**Explanation:** *No. The manager can only pick which ones get sent.*

---

### Quiz Q6
**ID:** `p5_q6`
**Time lock:** 8 s
**Kicker:** `QUIZ: QUESTION 6 OF 13`

**Question:** Fraud estimate =
- A. Your gut feeling, in percent.
- B. The count of suspicious transactions.
- C. The share of suspicious transactions out of all the company's
  transactions. ← correct
- D. 50% for every company.

**Explanation:** *Suspicious divided by total.*

---

### Quiz Q7
**ID:** `p5_q7`
**Time lock:** 8 s
**Kicker:** `QUIZ: QUESTION 7 OF 13`

**Question:** What happens when you rate a company **high**?
- A. They never get audited.
- B. They get audited for sure.
- C. They're more likely to be picked for a full audit. ← correct
- D. It's random. Your estimate doesn't matter.

**Explanation:** *Higher estimate → more lottery tickets → higher
chance of a full audit.*

---

### Quiz Q8
**ID:** `p5_q8`
**Time lock:** 8 s
**Calculator:** ON
**Kicker:** `QUIZ: QUESTION 8 OF 13`

**Question:** Correct answer: **40%**. Your estimate: **46%**.
Estimate bonus?
- A. 0¢.
- B. +10¢. ← correct
- C. +6¢.
- D. −10¢.

**Explanation:** *46 is within 10 percentage points of 40. Pays the
+10¢.*

---

### Quiz Q9
**ID:** `p5_q9`
**Time lock:** 8 s
**Calculator:** ON
**Kicker:** `QUIZ: QUESTION 9 OF 13`

**Question:** Correct answer: **50%**. Estimate: **80%**. Bet: **7¢**.
Total for this company?
- A. +17¢.
- B. +7¢.
- C. 0¢.
- D. −7¢. ← correct

**Explanation:** *30 percentage points off → 0¢ estimate bonus. Bet
lost → −7¢.*

---

### Quiz Q10
**ID:** `p5_q10`
**Time lock:** 8 s
**Kicker:** `QUIZ: QUESTION 10 OF 13`

**Question:** If you lose several bets, can your **$3 base pay** drop
below $3?
- A. Yes, lost bets can cut into base pay.
- B. No. Base pay is guaranteed. Lost bets only reduce the bonus, and
  the bonus can't go below $0. ← correct

**Explanation:** *Correct. Lost bets only reduce the bonus. They never
touch the base pay.*

---

### Quiz Q11
**ID:** `p5_q11`
**Time lock:** 8 s
**Kicker:** `QUIZ: QUESTION 11 OF 13`

**Question:** What's the probability that any given transaction is
clean?
- A. 0%.
- B. 25%.
- C. 50%. ← correct
- D. 100%.

**Explanation:** *Any transaction is a coin flip: 50% clean, 50%
suspicious.*

---

### Quiz Q12
**ID:** `p5_q12`
**Time lock:** 8 s
**Kicker:** `QUIZ: QUESTION 12 OF 13`

**Question:** Why doesn't the manager want a **high** fraud estimate?
- A. A high estimate triggers a fine for the manager.
- B. A high estimate makes a full audit likely, and a full audit costs
  the manager their raise. ← correct
- C. A high estimate directly reduces the government auditor's bonus.
- D. The manager is indifferent to your estimate.

**Explanation:** *A high estimate makes a full audit likely, and a
full audit costs the manager their raise.*

---

### Quiz Q13
**ID:** `p5_q13`
**Time lock:** 8 s
**Kicker:** `QUIZ: QUESTION 13 OF 13`

**Question:** If you are **not at all confident** in your fraud
estimate, how much should you bet?
- A. 10¢, the maximum.
- B. 5¢, to hedge.
- C. 0¢. Bet only when you're confident. ← correct
- D. Whatever. Betting is mandatory.

**Explanation:** *Bet 0. An uncertain estimate is more likely to miss
the 10-point band, and losing a bet only costs you.*

---

### PAGE 71 — You're ready
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

# ACT VI — THE TRIALS (5 WARM-UP + 30 SCORED)

### PAGE 72 — Company size intro (reveal step 1)
**ID:** `p6_firm_sizes_a`
**Time lock:** 2 s

**BODY:**
- [headline, 26 px, bold] One last thing. Companies come in different
  sizes.

**VISUALS:** three file-cabinet slots in a row, bottom-aligned. Only
the **small** cabinet is visible (10 transactions); medium and large
slots are invisible placeholders.

**Closing line** (centered, 20 px, bold):
- Some are **small** — **10 transactions**.

---

### PAGE 73 — Company size intro (reveal step 2)
**ID:** `p6_firm_sizes_b`
**Time lock:** 2 s

**BODY:** same headline as the previous page.

**VISUALS:** small + medium cabinets visible; large still a
placeholder.

**Closing line** (centered, 20 px, bold):
- Some are **medium** — **20 transactions**.

---

### PAGE 74 — Company size intro (reveal step 3)
**ID:** `p6_firm_sizes_c`
**Time lock:** 3 s

**BODY:** same headline as the previous two pages.

**VISUALS:** all three cabinets visible (small → medium → large,
bottom-aligned so the height differences carry the contrast).

**Closing line** (centered, 20 px, bold):
- Some are **large** — **30 transactions**.

---

### PAGE 75 — Size rule reminder (standalone)
**ID:** `p6_firm_sizes_rule`
**Time lock:** 7 s

**Standalone page.** No kicker, no visuals. Two centered bold lines
dropped ~60 px from the top:

- [p, 26 px, bold, centered] We'll tell you each company's size.
- [p, 26 px, bold, centered] The law still requires the manager to
  disclose <span style="color:red">**exactly 4**</span>, regardless
  of size.

---

### PAGE 76 — Warm-up intro
**ID:** `p6_practice_intro`
**Time lock:** 8 s

**BODY:**
- [headline, 28 px, bold] First, **5 warm-up audits**.
- [bullet list, 18 px]:
  - The task is the same as the scored audits: provide an estimate and
    a bet.
  - **These do not count toward your bonus.**
  - At the end, we will report how much you *would have* earned, so
    you can see your performance before the scored rounds begin.

**Closing line** (centered, 20 px, bold):
- Treat them seriously: the 30 scored audits begin immediately
  afterward.

---

### PRACTICE BLOCK — 5 warm-up audits, K = 4
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

### PRACTICE SUMMARY
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

### SCORED INTRO
**ID:** `p6_scored_intro`
**Time lock:** 6 s

**BODY:**
- [headline, 26 px, bold] The scored audits begin now.
- [p, 19 px] The following **30 audits** count toward your bonus, up
  to **$6.00**.
- [p, 17 px, dark slate] The task is the same as the warm-up.

---

### BLOCK 1 — 15 companies, K = 4
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
- Next disabled for the first 8 s. If the estimate slider hasn't been
  touched, a red error appears instead of advancing.

---

### PAGE 80 — Rule change: announcement
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
- Managers must now disclose <span style="color:green">**8**</span>
  transactions, not <span style="color:red; text-decoration:line-through;">**4**</span>.

---

### PAGE 81 — Rule change: everything else the same
**ID:** `p6_rule_change_b`
**Time lock:** 7 s

**BODY:**
- [p, 22 px, weight 600] Everything else stays the same: the manager
  still picks which ones, you still estimate and bet.
- [p, 20 px] **15 more companies** under the new rule.

---

### BLOCK 2 — 15 companies, K = 8
**ID:** `block_k8`
**Type:** `trial_block` (block 2)
**Per-trial time lock:** 10 s

Every combination of:
- N ∈ {10, 20, 30}
- k ∈ {0, 1, 4, 7, 8}

Same per-trial layout as Block 1; the global counter continues
(16 of 30, 17 of 30, ...). The header reads `The manager sent the
following 8 transactions:`.

**Across the full 30-trial run (Blocks 1 + 2):** 3 attention checks
are interleaved at random positions (`trialAttentionCheckCount: 3`).

---

# ACT VII — WRAP-UP

### PAGE 84 — Demographics
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

### PAGE 85 — Debrief (deliberately minimal)
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
