# SURVEY SCRIPT — FBO 2 (Selection Neglect)

*A page-by-page script of the current survey. Mark it up; I'll apply the
edits to the code.*

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
- **Retry timeout:** every wrong answer triggers a **10-second pause**
  before the next attempt.
- **Nav:** every page has a **Next** button unless noted. Practice / check
  pages block Next until the correct answer is given.
- **Time lock:** Next is disabled for `Time lock` seconds after the page
  loads. **Minimum time lock is 5 s** on any page. Omitted in the script
  = use the default per-page (instruction = 5 s, attention check = 6 s,
  quiz question = 8 s, trial = 8 s).
- **Calculator widget:** a floating calculator docks on the right side
  of every page where the participant has to do arithmetic. This
  includes (a) all 35 trial pages (5 practice + 30 scored), (b) the
  share-computation practice pages (15, 16, 17), (c) the estimate and
  bet try-it pages (33, 34, 37, 38), (d) the numeric attention check
  (35b), and (e) the two numeric quiz questions (Q9, Q10). It supports
  `+ − × ÷`, parentheses, decimals, and `=`. Every keystroke and
  every completed evaluation is logged with the current page / trial
  id, so we can see which divisors participants actually chose.
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
  - Per company: **+10¢** if your estimate is within **10 percentage points** of the
    correct answer, **± your bet** (0–10¢) on the same within-10-percentage-points event.
  - Best case per company: +20¢. Worst case per company: −10¢.
  - Summed across all 30 companies, floored at $0. Losses on one company
    eat into gains on another, never into base pay.
- **Pay range:** $3.00 to $9.00.
- **Trials:** 30 companies in two blocks.
  - **Block 1 (K = 4, 15 companies):** every combination of company size
    (10 / 20 / 30 transactions) × disclosure mix (all C, k-1 C + 1 S,
    half/half, 1 C + k-1 S, all S). Order randomized.
  - **Block 2 (K = 8, 15 companies):** same five mixes × three sizes, now
    with 8 transactions disclosed instead of 4. Order randomized.
- **Attention checks during trials:** 3, at random positions.
- **Slider requirement:** the participant has to move the fraud-estimate
  slider at least once per trial, even if they settle back at 50.

**Terminology (locked in — do not vary):**
- The participant is a **government auditor** (never just "auditor").
- Entities being audited are **companies** (never "firms").
- The participant **estimates** (never "rates"). Output is called the
  **fraud estimate**, expressed as a **percentage (0%–100%)**. The "%"
  sign is shown on every slider label, every truth value, and every
  numeric target in instructions.
- Distance from the correct answer is expressed in **percentage points** (never just
  "points"). Example: "within 10 percentage points," not "within 10
  points."

---

# ACT I — CONSENT & OVERVIEW

### PAGE 1
**Time lock:** 10 s

**TITLE:** `Welcome to our Study`

**BODY:**
- This is a research study about **decision-making**. You'll face a
  series of **hypothetical scenarios**, but your decisions still count.
  **The better your decisions, the more you earn.**

---

### PAGE 2
**Time lock:** 5 s

**TITLE:** `Welcome to our Study`

**BODY:**
- You'll play the role of a **government auditor** screening companies
  for fraud. No auditing background is needed. The scenario is simplified.
- Please **read the instructions carefully**. Throughout the study you'll
  see short attention checks. You can try each one as many times as you
  need.

**RED IMPORTANT NOTE** (light-red background, red left border, uppercase
"IMPORTANT." prefix):
- Every wrong answer triggers a **10-second pause** before you can try
  again.

---

### PAGE 3
**Time lock:** 15 s

**TITLE:** `Consent`

**BODY:**
- **What you'll do.** Learn a simple auditing task, then go through 30
  auditing rounds.
- **Time.** About 20 minutes.
- **Pay.** $3.00 base + up to $6.00 performance bonus. Base pay is
  **guaranteed**.
- **Risks.** None beyond everyday life.
- **Confidentiality.** Anonymous. We collect your Prolific ID only for
  payment.
- **Voluntary.** You may withdraw at any time by closing this window.

**CHECKBOX** (required): `I agree to participate.`
**Decline message:** *You must agree to participate in order to continue.*

---

### PAGE 4
**Time lock:** 10 s

**VISUALS (top, centered):**
- **Government auditor badge.** Teal magnifying glass hovering over a
  document (see Option C in `survey/icon_preview.html`), uppercase
  caption `GOVERNMENT AUDITOR`. ~100×120 px.

**BODY:**
- [p, 18 px] You're a **government auditor**. For each company, you
  look at its transactions and assign it a **fraud estimate**.
- [p, 18 px] At the end of the study, every company's true fraud rate is
  revealed. **The closer your estimates were, the more you earn.**

---

### PAGE 5
**Time lock:** 10 s

**Kicker** (centered, small caps, primary blue): `QUICK ATTENTION CHECK`

**Question** (20 px, bold): In this study, what is your task?

**Answers:**
- A. Decide which company to sell products to.
- B. Assign a fraud estimate to each company. ← correct
- C. Rate each company on customer service.

**Explanation when correct:** *You give each company a fraud estimate. The
more accurate, the more you earn.*

---

### PAGE 6
**Time lock:** 5 s

**BODY:**
- [headline, 24 px, bold] Now, the details.
- [p, 17 px] Up next: the auditing process, what transactions look like,
  and how the bonus works.

---

# ACT II — HOW TO READ A COMPANY

### PAGE 7
**Time lock:** 7 s

**BODY:**
- [headline, 24 px, semibold] How do you assess fraud?
- [p, 20 px] By looking at the company's **transactions**.

**VISUALS:** one large, **white-page document icon** with faint faux
writing lines, centered. This is the generic transaction icon used
throughout the study. On later pages, a colored C / S stamp is overlaid.

**Closing line:**
- [p, 17 px] This is one transaction. You won't need to read what's
  inside. Just know **what kind** it is.

---

### PAGE 8
**Time lock:** 3 s

**BODY:**
- [headline, 24 px, semibold] Each transaction is one of two kinds.

**VISUALS:** a 2-slot row. Left slot: a white document with a **green
"C" stamp** tilted across it. Caption below in green: `Clean`. Right slot:
empty placeholder (reserved for Page 9). The C card stays pinned on the
left; the layout does not re-center when the S card appears later.

---

### PAGE 9
*(Same page as Page 8, revealing the second kind.)*

**Time lock:** 3 s

**BODY:**
- [headline, 24 px, semibold] Each transaction is one of two kinds.

**VISUALS (two slots):**
- **Clean** (left, same position as Page 8): white doc + green C stamp.
  Caption `Clean` in green.
- **Suspicious** (right): white doc + red S stamp. Caption `Suspicious`
  in red.

---

### PAGE 10
*(Anchor the 50/50 base rate.)*

**Time lock:** 5 s

**BODY:**
- [headline, 24 px, semibold] Any given transaction is a coin flip.

**VISUALS:** the same two cards, now captioned **`50%`** each in large
bold letters (42 px). No connector or arrow between them.

**Closing line** (centered, 22 px, bold — emphasized):
- Your job is to assess the **proportion of a company's transactions
  that are suspicious**.

---

### PAGE 10b — Attention check (coin flip)
**Time lock:** 6 s

**Kicker** (centered, small caps, primary blue): `QUICK ATTENTION CHECK`

**Question** (20 px, bold): What's the probability that any given
transaction is **clean**?

**Answers (A / B / C / D):**
- A. 0%
- B. 25%
- C. 50% ← correct
- D. 100%

**Behavior:** `retry` mode. Wrong answer triggers the standard 10-second
pause; Next stays disabled until the right answer is given.

**Explanation when correct:** *Any given transaction is a coin flip:
50% clean, 50% suspicious.*

*(Added so the 50/50 idea is tested immediately after it's taught on
Page 10, not only in the end-of-instructions comprehension quiz.)*

---

### PAGE 11
**Time lock:** 5 s

**BODY:**
- [headline, 24 px, semibold] Companies have many transactions.

**VISUALS:** ~20 white-page document icons, loosely clustered and
overlapping. **No background panel, no outline around the cluster.** The
icons sit directly on the page.

---

### PAGE 12
**Time lock:** 10 s

**BODY:**
- [headline, 24 px, semibold] Some companies are cleaner than others.

**VISUALS (three cards in a row):**
- **Mostly clean** — 5 C-stamped docs. Caption `Mostly clean` in green.
- **Mixed** — C, S, C, S, C. Caption `Mixed` in amber.
- **Mostly suspicious** — S, C, S, S, S. Caption `Mostly suspicious` in red.

**Closing line:**
- [p, 19 px] Your job: tell them apart with a **fraud estimate**.

---

### PAGE 13
**Time lock:** 10 s

**BODY:**
- [headline, 26 px, bold] **Fraud estimate** = share of suspicious
  transactions.
- [p, 17 px] Three example companies, every transaction shown:

**VISUALS (three stacked example rows — card row on top, summary row
below, so nothing overflows):**
- Row 1: 10 all-C cards · `0 / 10 → 0%` (green).
- Row 2: 7 C + 3 S · `3 / 10 → 30%` (amber).
- Row 3: 3 C + 7 S · `7 / 10 → 70%` (red).

---

### PAGE 13b — Attention check (fraud estimate definition)
**Time lock:** 6 s

**Kicker** (centered, small caps, primary blue): `QUICK ATTENTION CHECK`

**Question** (20 px, bold): The fraud estimate for a company is ...

**Answers (A / B / C / D):**
- A. Your gut feeling about the company, in percent.
- B. The number of suspicious transactions.
- C. The share of a company's transactions that are suspicious. ← correct
- D. Always 50%.

**Explanation when correct:** *The fraud estimate is the share of a
company's transactions that are suspicious, expressed as a percentage.*

---

### PAGE 14
**Time lock:** 10 s

**BODY:**
- [headline, 22 px, bold] What happens to companies after they receive an estimate?
- [bullet list, 18 px]:
  - Your estimates feed a **lottery**.
  - A higher estimate means **more lottery tickets** for that company.
  - Companies drawn in the lottery face a **full audit**, which is
    costly for them.

*(The earlier three-box chain visual was removed in favor of a simple
bullet list — cleaner, faster to read.)*

---

### PAGE 14b
**Time lock:** 7 s

**BODY:**
- [headline, 24 px, bold] The higher your estimate, the more likely a
  full audit.
- [p, 19 px] A full audit reviews every transaction. **It's costly for the
  company**, regardless of whether any fraud actually turns up.

---

### PAGE 15
**Time lock:** 5 s

**BODY:**
- [headline, 24 px, semibold] Your turn. What's the fraud estimate? - [p, 16 px] A company with **10** transactions, all shown.

**VISUALS:** 10-card grid (5 × 2), 5 C + 5 S, random order.

**Answer buttons:** `10%` · `30%` · `50%` · `70%`

**Behavior:** `directional`, wrong picks say "too low" / "too high".
**Correct:** 50%. *5 of 10 are suspicious → 5 / 10 = 50%.*

---

### PAGE 16
**Time lock:** 5 s

**BODY:**
- [headline, 24 px, semibold] Another one. - [p, 16 px] A company with **20** transactions, all shown.

**VISUALS:** 10 × 2 grid, 16 C + 4 S.

**Answer buttons:** `10%` · `20%` · `50%` · `80%`
**Correct:** 20%. *4 of 20 are suspicious → 4 / 20 = 20%.*

---

### PAGE 17
**Time lock:** 5 s

**BODY:**
- [headline, 24 px, semibold] Last one. - [p, 16 px] A company with **30** transactions, all shown.

**VISUALS:** 10 × 3 grid, 24 S + 6 C.

**Answer buttons:** `40%` · `60%` · `80%` · `90%`
**Correct:** 80%. *24 of 30 are suspicious → 24 / 30 = 80%.*

---

### PAGE 18
**Time lock:** 5 s

**Kicker** (centered, small caps, primary blue): `QUICK ATTENTION CHECK`

**Question** (20 px, bold): What happens when you rate a company **high**?

**Answers (A / B / C / D):**
- A. They never get audited.
- B. They get audited for sure.
- C. They're more likely to be picked for a full audit. ← correct
- D. It's random. Your estimate doesn't matter.

**Explanation:** *A higher estimate means more lottery tickets, and a
higher chance of a full audit, though not a guarantee.*

---

*(The "Independence interlude" that previously lived here has been
moved to just before the manager introduction, so the contrast between
**random** picking and the manager's **strategic** picking lands as
directly as possible. See Pages 22b–22f below.)*

---

# ACT III — THE MANAGER AND THE TWIST

### PAGE 19
**Time lock:** 5 s

**BODY:**
- [headline, 26 px] Here's the catch: A company has many transactions,
  **but the law lets it send you only
  <span style='color:#b91c1c; font-size:44px'>4</span>.**

**VISUALS:** the same transaction cluster from Page 11. **4 icons are
highlighted with a thick black outline.** The remaining icons are dimmed
(grayscale, low opacity). Do **not** use green for the highlighted 4;
green implies "clean."

---

### PAGE 20
*(Same visual as Page 19; now the 4 highlighted cards reveal their nature.)*

**Time lock:** 5 s

**BODY:**
- [headline, 26 px, bold] You only learn the nature (clean or
  suspicious) of those **4**.

**VISUALS:** same cluster. The 4 highlighted docs now show their stamp
(e.g., 3 C + 1 S). Every other doc shows a `?`.

**Closing line** (centered, 24 px, extra-bold — emphasized):
- Your view of the company is always **incomplete**.

---

### PAGE 21
**Time lock:** 5 s

**Kicker** (centered, small caps, primary blue): `QUICK ATTENTION CHECK`

**Question** (22 px, bold): When you audit a company, do you see **all** of
its transactions?

**Answers (A / B):**
- A. Yes, all of them.
- B. No, only 4. ← correct

**Explanation:** *The law requires only 4 transactions per company.*

---

### PAGE 22
**Time lock:** 5 s

**Kicker** (centered, small caps, primary blue): `QUICK ATTENTION CHECK`

**Question** (20 px, bold): Who decides **how many** transactions you see?

**Answers:**
- A. The law. ← correct
- B. The manager.
- C. You.

**Explanation:** *The law. Fixed at 4; no one can change it.*

---

### PAGE 22b — Independence: setup (reveal step 1)
**Time lock:** 5 s

**BODY:**
- [lead-in, 24 px, semibold] Now, a quick thought experiment.
- [p, 22 px] Imagine you could grab **one random transaction** from a
  company.

**VISUALS:** a single large transaction slot, centered. On 22b the slot
is an **invisible placeholder** (visibility:hidden) so the card position
is reserved — nothing moves when 22c reveals the suspicious stamp.

---

### PAGE 22c — Independence: reveal the sample (reveal step 2)
**Time lock:** 5 s

**BODY:** same lead-in and body as 22b.

**VISUALS:** same slot; the transaction card now shows a red **S** stamp.

**Closing line** (centered, 22 px, bold, red):
- It turns out to be **suspicious**.

---

### PAGE 22d — Independence: pose the question
**Time lock:** 6 s

**BODY:**
- [headline, 26 px, bold] Does this mean most of the company's other
  transactions are also suspicious?

**VISUALS:** a row — the big S card on the left, an arrow `→`, then a
3×3 grid of small `?` placeholder cards (dashed borders) representing
the company's remaining transactions.

---

### PAGE 22e — Independence: punchline
**Time lock:** 10 s

**BODY:**
- [headline, 26 px, bold] **No.** It could be **any** of these
  companies.
- [p, 17 px, secondary] A single suspicious transaction is consistent
  with a mostly-clean company, a half-and-half company, or a
  mostly-suspicious company.

**VISUALS:** three side-by-side micro cluster panels:
- **Mostly clean** (green label): ~18 C + 2 S.
- **Half & half** (amber label): ~10 C + 10 S.
- **Mostly suspicious** (red label): ~18 S + 2 C.

All three panels include at least one S, so the observed transaction is
consistent with any of them.

**Closing line** (centered, 22 px, extra-bold):
- One random transaction doesn't tell you the rest.

---

### PAGE 22f — Independence: attention check (flipped to clean)
**Time lock:** 6 s

**Kicker** (centered, small caps, primary blue): `QUICK ATTENTION CHECK`

**Setup** (20 px, bold): You grab one random transaction from a company.
It's **clean**.

**VISUALS:** single clean C card, centered.

**Question** (20 px, bold): What does that tell you about the company's
other transactions?

**Answers (A / B / C / D):**
- A. Most of them are probably clean too.
- B. Most of them are probably suspicious.
- C. Nothing. One random transaction doesn't tell you about the rest. ← correct
- D. Exactly half are clean.

**Behavior:** `retry` mode. Test uses the opposite stamp (C) from the
teaching example (S) to check generality — the participant should pick
"Nothing" regardless of which stamp they saw.

**Explanation when correct:** *Right. A random transaction could come
from a mostly-clean, half-and-half, or mostly-suspicious company. One
doesn't tell you the rest.*

---

### PAGE 22g — Bridge: "not randomly picked from the lot"
**Time lock:** 7 s

**Standalone page.** No kicker. No call-out box. Just one centered
sentence, 28 px, bold, pushed ~80 px down from the top for breathing
room. The key phrase is in **red bold** for emphasis.

> However, in our setting, the 4 transactions you see about a company
> are **not randomly picked from the lot**.

This is the narrative pivot before the manager arrives. "From the lot"
is colloquial for "from the full set of all transactions."

---

### PAGE 23 — Meet the manager
**Time lock:** 7 s

**BODY:**
- [headline, 26 px, bold] Meet the **manager** of the company you're
  auditing.

**VISUALS:** manager badge, indigo rounded square (~120×140 px) with a
white person silhouette. Uppercase caption `MANAGER`.

**Closing line:**
- [p, 20 px] The manager is the one sending the company's records to
  you.

---

### PAGE 24
**Time lock:** 6 s

**BODY:**
- [headline, 26 px, bold] The manager knows **all** of the company's
  transactions, and decides **which 4** you see.

**VISUALS:** manager badge on top. Below it, **all 10** of the
company's transactions with their true stamps visible (6 C + 4 S).
The full truth, visible to the manager only. 10 (not 5) makes the
"manager sees everything" framing concrete.

---

### PAGE 25
*(Same setup as Page 24, now showing the manager's pick being sent.)*

**Time lock:** 6 s

**BODY:**
- [headline, 26 px, bold] The manager picks the **4** you see.

**VISUALS (split view):**
- **Manager side:** badge + full set of **10** transactions (6 C + 4 S).
  Caption: `Sees all 10`.
- **→** arrow.
- **Auditor side:** badge + the 4 the manager chose to send, **all
  Clean** (`C C C C`). Caption: `Sees 4 (manager's pick)`.

The asymmetry (manager sees obvious fraud, auditor sees a spotless set)
is the whole study in one image. No closing line — the visual carries
the point.

---

### PAGE 26
**Time lock:** 6 s
**Alignment:** left (big "4" centered — exception).

**VISUALS (centered):**
- Enormous `4`, 110 px, primary-blue, ultra-bold.
- Small caps caption below: `REQUIRED BY LAW`.

**BODY:**
- [headline, 22 px, bold] Two rules the manager **cannot** break:
- [ordered list, 19 px]:
  1. Send **exactly 4** transactions. Not more, not fewer.
  2. Send them as they are. A suspicious transaction stays suspicious;
     a clean one stays clean.
- [p, 19 px] A manager who breaks either rule is flagged as fraudulent.

---

### PAGE 27
**Time lock:** 5 s

**Kicker** (centered, small caps, primary blue): `QUICK ATTENTION CHECK`

**Question** (20 px, bold): Who picks **which** transactions you see?

**Answers:**
- A. The law.
- B. Random chance.
- C. The manager. ← correct

**Explanation:** *The law sets how many. The manager picks which ones.*

---

### PAGE 28
**Time lock:** 5 s

**Kicker** (centered, small caps, primary blue): `QUICK ATTENTION CHECK`

**Question** (20 px, bold): True or false: the manager can turn a
suspicious transaction into a clean one.

**Answers (A / B):**
- A. True.
- B. False. ← correct

**Explanation:** *The manager can't fake transactions. They can only pick
which ones get sent.*

---

# ACT IV — STAKES AND YOUR BONUS

### PAGE 29
**Time lock:** 6 s

**BODY:**
- [headline, 26 px, bold] What's at stake for the manager?
- [p, 18 px] A full audit is costly for the company. And if it happens, the
  manager **loses their raise**.

**VISUALS (two scenario lines):**
- Line 1 (green): `You rate 10%` → `Audit unlikely` → **Manager gets the raise**
- Line 2 (red):   `You rate 80%` → `Audit likely` → **Manager loses the raise**

**Closing line:**
- [p, 18 px] So the manager is better off when your estimate is **low**.

---

### PAGE 29b — Attention check (manager's incentive)
**Time lock:** 6 s

**Kicker** (centered, small caps, primary blue): `QUICK ATTENTION CHECK`

**Question** (20 px, bold): Why does the manager **not** want a high
fraud estimate?

**Answers (A / B / C / D):**
- A. A high estimate triggers a fine on the manager.
- B. A high estimate makes a full audit likely, and a full audit
  costs the manager their raise. ← correct
- C. A high estimate lowers the government auditor's bonus.
- D. The manager doesn't care about your estimate.

**Explanation when correct:** *A high estimate makes a full audit
likely, and a full audit costs the manager their raise.*

---

### PAGE 30
**Time lock:** 6 s

**BODY:**
- [headline, 26 px, bold] What's at stake for **you**?
- [ordered list, 19 px]:
  1. Your bonus rewards **accuracy** of your estimates across all 30 companies.
  2. Your bonus depends on **your confidence** in your estimates.

---

### PAGE 31a  *(reveal Answer 1)*
**Time lock:** 5 s

**BODY:**
- [headline, 26 px, bold] For each company, you give **two** answers.

**VISUALS (two cards side by side, right card invisible placeholder):**
- Card 1 (visible): `1`, **Fraud estimate**. *Your best guess. Be as
  **precise** as you can.*
- Card 2 (invisible, reserves space): `2`, **Bet**.

---

### PAGE 31b  *(reveal Answer 2)*
**Time lock:** 6 s

**BODY:**
- [headline, 26 px, bold] For each company, you give **two** answers.

**VISUALS (both cards visible):**
- Card 1: `1`, **Fraud estimate**. *Your best guess. Be as **precise** as
  you can.*
- Card 2: `2`, **Bet**. *How confident you are that your estimate is
  **within 10 percentage points** of the truth.*

**Closing line** (centered, 20 px, bold):
- Each one earns its own bonus.

---

### PAGE 32
**Time lock:** 8 s

**Kicker** (centered, small caps, primary blue): `ANSWER 1: FRAUD ESTIMATE`

**BODY:**
- [headline, 24 px, bold] The estimate bonus.
- [bullet list, 18 px]:
  - If your estimate is **within 10 percentage points** of the truth, you earn
    **+10¢**.
  - If your estimate is **more than 10 percentage points** away from the truth,
    you earn **0¢**.
- [p, 17 px] Let's practice. For our example company, the correct answer is **35**.

---

### PAGE 33  *(no banner, plain bullets)*
**Time lock:** 12 s

**BODY:**
- [headline, 22 px, bold] Try it.
- [bullet list, 18 px]:
  - The correct answer for this company is **35%**.
  - Move your estimate to **50%**.

**INTERACTIVE:** No `Truth: 35` banner above the slider; the truth
number lives only inside the bullet list, not as a standalone box.
- Estimate slider, 0–100%. Band shaded from 25%–45% (the within-10
  window around 35%). Slider thumb is small and semi-transparent so
  the band shows through. Endpoint labels read `0%` and `100%`.
- Live result: `Within 10 percentage points of the correct answer? No ✗` /
  `Estimate bonus: 0¢`.
- Next unlocks once the slider is at 50%.

**Closing line** (left-aligned, 20 px, bold, red):
- At 50%, you're 15 percentage points off the correct answer. You earn **0¢**
  on this assessment.

---

### PAGE 34  *(no banner, plain bullets)*
**Time lock:** 12 s

**BODY:**
- [headline, 22 px, bold] Now try again.
- [bullet list, 18 px]:
  - Same correct answer: **35**.
  - Move your estimate to **30**.

**INTERACTIVE:** same layout. Next unlocks when the slider hits 30
(inside the band).
- `Within 10 percentage points of the correct answer? Yes ✓` / `Estimate bonus: +10¢`.

**Closing line** (left-aligned, 20 px, bold, green):
- At 30, you're within 10 percentage points of 35. You earn **+10¢**.

---

### PAGE 35
**Time lock:** 6 s

**BODY:**
- [headline, 22 px, semibold] Takeaway.
- [p, 18 px] Correct answer **35%** → the bonus pays out for any estimate between
  **25%** and **45%**.

---

### PAGE 35b — Attention check (estimate bonus, numeric)
**Time lock:** 6 s

**Kicker** (centered, small caps, primary blue): `QUICK ATTENTION CHECK`

**Question** (20 px, bold): The correct answer is **60%**. You estimate **55%**.
How much do you earn from the estimate?

**Answers (A / B / C / D):**
- A. 0¢
- B. +5¢
- C. +10¢ ← correct
- D. −5¢

**Behavior:** `retry` mode. Uses a fresh truth (60%) so participants
who just memorized the 35/25/45 example have to actually apply the
"within 10 percentage points" rule.

**Explanation when correct:** *55% is within 10 percentage points of
60% (difference is 5), so the estimate bonus is +10¢.*

---

### PAGE 36
**Time lock:** 8 s

**BODY:**
- [headline, 24 px, bold] The bet.
- [p, 18 px] Besides your estimate, you can also **bet up to 10¢** on
  whether your estimate is within 10 percentage points of the correct answer.

---

### PAGE 36b
**Time lock:** 8 s

**BODY:**
- [p, 22 px, bold, centered] For instance, you bet **5¢** on your
  estimate:
- [ul, 18 px]
  - Within 10 percentage points → you **win the bet**: **+5¢**.
  - More than 10 percentage points away → you **lose the bet**: **−5¢** (deducted
    from bonus on other companies).
  - Your **$3 base pay is never touched.** Lost bets only reduce bonus
    from other companies, and total bonus can't drop below $0.

---

### PAGE 37  *(no banner, plain bullets)*
**Time lock:** 12 s

**BODY:**
- [p, 22 px, bold, centered] Try it.
- [ul, 18 px]
  - Truth is **35**.
  - Slide the estimate to **30** and the bet slider to **8¢**.
  - Next unlocks once both are set.

**INTERACTIVE:** same layout as Pages 33–34, plus a bet slider (0–10¢).
- Estimate default 50. Bet default 0. Slider labels show plain numbers
  (`0`, `50`, `100`), not percentages.
- Live result tiles update as you drag:
  - `Within 10 percentage points? Yes ✓`
  - `Estimate bonus: +10¢`
  - `Bet outcome: +8¢`
  - **Total: +18¢** (bold).

**Closing line (green, bold):**
- [p, 18 px, bold, green] At **30** you're within 10 percentage points of 35, and
  your **8¢** bet pays off. **Total: +18¢.**

---

### PAGE 38  *(no banner, plain bullets)*
**Time lock:** 12 s

**BODY:**
- [p, 22 px, bold, centered] Try it.
- [ul, 18 px]
  - Truth is **35**.
  - Slide the estimate to **50** and the bet slider to **8¢**.
  - Watch what happens when the bet is wrong.

**INTERACTIVE:** same layout.
- Estimate starts at 30 (inside band). Bet starts at 0.
- Live result tiles:
  - `Within 10 percentage points? No ✗`
  - `Estimate bonus: 0¢`
  - `Bet outcome: −8¢`
  - **Total: −8¢** (bold, red).

**Closing line (red, bold):**
- [p, 18 px, bold, red] At **50** you're 15 percentage points off, and the **8¢**
  bet is lost. **Total: −8¢.** Bet **0** here and you'd lose nothing.
  **Only bet when you're confident.**

---

### PAGE 40a — Opposing goals (reveal YOU)
**Time lock:** 5 s

**BODY:**
- [headline, 24 px, bold] Your goal and the manager's are **opposite**.

**VISUALS (two-card layout, only the first card revealed):**
- **Auditor card** (visible): teal magnifier-on-document icon (Option
  C). Label `You — the government auditor`.
  Body: **Detect fraud.** Estimate each company as accurately as you
  can.
- **vs** divider and **Manager card**: kept as **invisible
  placeholders** (visibility:hidden) so nothing shifts when 40b adds
  them.

---

### PAGE 40b — Opposing goals (reveal VS MANAGER)
**Time lock:** 7 s

**BODY:** same headline as 40a.

**VISUALS (both cards visible):**
- **Auditor card** (left): teal magnifier icon, label `You — the
  government auditor`. Body: **Detect fraud.** Estimate each company
  as accurately as you can.
- **vs** divider, centered.
- **Manager card** (right): indigo manager badge. Label `The manager`.
  Body: Wants the **lowest estimate** possible, ideally **0%**, even
  if the company really is fraudulent.

---

### PAGE 40c — Opposing goals: the punchline, emphasized
**Time lock:** 8 s

**Standalone page**, centered, no visuals. Two big bold lines (30 px,
weight 800, dropped ~60 px from top), color-coded to drive the
contrast:

> The manager just wants a <span style="color:red">**low**</span>
> estimate.
>
> You want an <span style="color:green">**accurate**</span> one.

**Small note below** (17 px, softer slate, centered):
- A full audit costs the manager their raise whether fraud is found
  or not.

*(Page 39, "Play with the bonus", was removed as redundant with the
two try-it pages.)*

---

# ACT V — COMPREHENSION QUIZ (14 QUESTIONS)

*Same retry-with-10-second-timeout behavior as the attention checks.
Participants can't advance until every question is answered correctly.
**Per-quiz-question time lock: 8 s** (Next stays disabled for the first
8 s to discourage skimming).*

### PAGE 41
**Time lock:** 3 s

**Kicker** (centered, small caps, primary blue): `COMPREHENSION QUIZ`

**BODY:**
- [headline, 24 px, bold] One last check before the trials.
- [p, 18 px] Answer 14 quick questions. Each wrong answer triggers a
  **10-second pause** before you can try again.

---

### Quiz Q1
**Kicker:** `QUIZ: QUESTION 1 OF 14`
**Question:** What is your job in this study?
- A. Decide which companies to invest in.
- B. Assign each company a **fraud estimate** from its transactions. ← correct
- C. Rate each company on customer service.
- D. Pick which transactions the company discloses.

**Explanation:** *You're the government auditor. You estimate each company's fraud rate.*

---

### Quiz Q2
**Kicker:** `QUIZ: QUESTION 2 OF 14`
**Question:** How many transactions must a company send you?
- A. 1. / B. 2. / C. 4. ← correct / D. All of them.
**Explanation:** *Exactly 4. Set by law.*

---

### Quiz Q3
**Kicker:** `QUIZ: QUESTION 3 OF 14`
**Question:** Who decides **how many** transactions are disclosed?
- A. The law. ← correct / B. The manager. / C. You.
**Explanation:** *The law. Fixed at 4; no one can change it.*

---

### Quiz Q4
**Kicker:** `QUIZ: QUESTION 4 OF 14`
**Question:** Who decides **which** transactions get sent to you?
- A. The law. / B. Random chance. / C. The manager. ← correct / D. You.
**Explanation:** *The manager picks which 4 to disclose.*

---

### Quiz Q5 — NEW
**Kicker:** `QUIZ: QUESTION 5 OF 14`
**Question (True/False):** The 4 transactions you receive from a
company are **randomly picked** from all of its transactions.
- A. True.
- B. False. ← correct

**Explanation:** *False. The manager picks which 4 to send.*

*Placement: directly after Q4 so the manager-selection cluster (Q4
"who picks?", Q5 "not random", Q6 "can't fake transactions") reads
as a tight three-fact set.*

---

### Quiz Q6
**Kicker:** `QUIZ: QUESTION 6 OF 14`
**Question:** Can the manager turn a suspicious transaction into a clean one?
- A. Yes. / B. No. ← correct
**Explanation:** *No. The manager can only pick which ones get sent.*

---

### Quiz Q7
**Kicker:** `QUIZ: QUESTION 7 OF 14`
**Question:** Fraud estimate =
- A. Your gut feeling, in percent.
- B. The count of suspicious transactions.
- C. The **share** of suspicious transactions out of all the company's
  transactions. ← correct
- D. 50% for every company.
**Explanation:** *Suspicious divided by total.*

---

### Quiz Q8
**Kicker:** `QUIZ: QUESTION 8 OF 14`
**Question:** What happens when you rate a company **high**?
- A. They never get audited.
- B. They get audited for sure.
- C. They're more likely to be picked for a full audit. ← correct
- D. It's random. Your estimate doesn't matter.
**Explanation:** *Higher estimate → more lottery tickets → higher chance
of a full audit.*

---

### Quiz Q9
**Kicker:** `QUIZ: QUESTION 9 OF 14`
**Question:** Truth: **40%**. Your estimate: **46%**. Estimate bonus?
- A. 0¢. / B. +10¢. ← correct / C. +6¢. / D. −10¢.
**Explanation:** *46 is within 10 percentage points of 40. Pays the +10¢.*

---

### Quiz Q10
**Kicker:** `QUIZ: QUESTION 10 OF 14`
**Question:** Truth: **50%**. Estimate: **80%**. Bet: **7¢**. Total for
this company?
- A. +17¢. / B. +7¢. / C. 0¢. / D. −7¢. ← correct
**Explanation:** *30 points off → 0¢ estimate bonus. Bet lost → −7¢.*

---

### Quiz Q11
**Kicker:** `QUIZ: QUESTION 11 OF 14`
**Question:** If you lose several bets, can your **$3 base pay** drop
below $3?
- A. Yes, wrong answers cut into base pay.
- B. No. Base pay is guaranteed; lost bets only reduce bonus, and total
  bonus can't go below $0. ← correct
**Explanation:** *Correct. Bets can eat into bonus, never into base pay.*

---

### Quiz Q12 — NEW
**Kicker:** `QUIZ: QUESTION 12 OF 14`
**Question:** What's the probability that any given transaction is
clean?
- A. 0%. / B. 25%. / C. 50%. ← correct / D. 100%.
**Explanation:** *Any transaction is a coin flip: 50% clean, 50%
suspicious.*

---

### Quiz Q13 — NEW
**Kicker:** `QUIZ: QUESTION 13 OF 14`
**Question:** Why doesn't the manager want a **high** fraud estimate?
- A. A high estimate triggers a fine for the manager.
- B. A high estimate makes a full audit likely, and a full audit costs
  the manager their raise. ← correct
- C. A high estimate directly reduces the auditor's bonus.
- D. The manager is indifferent to your estimate.
**Explanation:** *A high estimate makes a full audit likely, and a full
audit costs the manager their raise.*

---

### Quiz Q14 — NEW
**Kicker:** `QUIZ: QUESTION 14 OF 14`
**Question:** If you are **not at all confident** in your fraud
estimate, how much should you bet?
- A. 10¢, the maximum.
- B. 5¢, to hedge.
- C. 0¢. Bet only when you're confident. ← correct
- D. Whatever. Betting is mandatory.
**Explanation:** *Bet 0. An uncertain estimate is more likely to miss
the 10-point band, and losing a bet only costs you.*

---

### PAGE 52 — You're ready
**Time lock:** 6 s

**BODY:**
- [headline, 26 px, bold] You're ready.
- [p, 19 px] The audits come in two parts:
- [ordered list, 18 px]:
  1. **5 warm-up audits.** To get the hang of it. **No bonus** on
     these.
  2. **30 scored audits.** These count toward your bonus, **up to
     $6.00**.

*(The rule change between blocks is no longer foreshadowed here — it
surprises the participant when it happens, which is more realistic.)*

---

# ACT VI — THE TRIALS (5 WARM-UP + 30 SCORED)

### WARM-UP INTRO — Before the size reveals
**Time lock:** 8 s

**Kicker** (centered, small caps, primary blue): `WARM-UP`

**BODY:**
- [headline, 26 px, bold] First, **5 warm-up audits**.
- [bullet list, 18 px]:
  - Same task as the real audits: estimate + bet.
  - **These don't count toward your bonus.**
  - At the end, we'll tell you how much you *would have* earned, so
    you can see how you did before the scored rounds.

**Closing line** (centered, 20 px, bold):
- Take them seriously — the 30 scored audits come right after.

---

### PAGE 53a — Company size intro (reveal step 1)
**Time lock:** 6 s

**BODY:**
- [headline, 26 px, bold] One last thing. Companies come in different
  sizes.

**VISUALS:** three file-cabinet slots in a row, bottom-aligned. Only the
**small** cabinet is visible; the medium and large slots are kept as
invisible placeholders so the layout doesn't shift between reveals.

**Closing line:**
- [p, 22 px, bold, centered] Some are **small** — 10 transactions.

---

### PAGE 53b — Company size intro (reveal step 2)
**Time lock:** 5 s

**BODY:** same headline as 53a.

**VISUALS:** same row of three slots; **small + medium** cabinets
visible, large slot still an invisible placeholder.

**Closing line:**
- [p, 22 px, bold, centered] Some are **medium** — 20 transactions.

---

### PAGE 53c — Company size intro (reveal step 3)
**Time lock:** 6 s

**BODY:** same headline as 53a/53b.

**VISUALS:** all three cabinets visible, small → medium → large,
bottom-aligned so the height differences visually carry the "10 vs 20
vs 30" contrast.

**Closing line:**
- [p, 22 px, bold, centered] Some are **large** — 30 transactions.

---

### PAGE 53d — Size rule reminder (standalone, emphasized)
**Time lock:** 7 s

**Standalone page.** No kicker, no visuals. Two centered lines dropped
~60 px from the top, both bold:

- [p, 26 px, bold, centered] We'll tell you each company's size.
- [p, 26 px, bold, centered] The law still requires the manager to
  disclose <span style="color:red">**exactly 4**</span>, regardless
  of size.

**Why its own page:** the N=10 vs N=30 contrast in the trials only
matters if the participant holds "always 4 disclosed, regardless"
firmly in mind. The red "exactly 4" callback visually ties this page
to Page 19 (the giant red "4" that first established the law).

---

### PRACTICE BLOCK — 5 warm-up audits, K = 4
**Per-trial time lock:** 8 s

**Sampling:** Randomly sample **5 of the 15** phase-1 (K=4) trials per
participant (seed: Prolific PID). Same layout as a scored trial (see
Block 1 below), with two differences:

- **Header card** uses an amber gradient instead of the usual dark
  slate, with a small white `WARM-UP` pill + "Practice X of 5" counter
  + italic note: *"No bonus on these. Take them seriously."*
- Trial intro splash reads **"Practice X"** instead of "Company X".

Responses are stored separately from scored responses (the engine uses
`practiceResponses` vs `trialResponses`) and do not contribute to the
bonus calculation.

---

### PRACTICE SUMMARY — After the 5 warm-ups
**Time lock:** 10 s

**Card layout** (centered, max-width ~620 px, soft shadow):
- **Kicker** (amber, uppercase): `Warm-up complete`
- **Title** (24 px, bold): You finished the 5 warm-up audits.
- **Amount panel** (green tint, 2-px green border):
  - Label: "If these had counted, you would have earned:"
  - Amount (36 px, bold, dark green): `USD $X.XX`
  - Sub-label (14 px): "out of a possible USD $1.00 on 5 rounds
    (NN% of the max)."
- **Reminder note** (amber call-out):
  - *These 5 rounds don't count toward your real bonus. We won't tell
    you which specific rounds you got right — the scored rounds are
    next, and your accuracy on those is what pays.*

**Design choice:** aggregate only. We deliberately do **not** show
per-round correctness. The point of the summary is calibration on
effort/confidence, not diagnostic feedback on specific items (which
would let participants reverse-engineer which selection they got
"right" and carry that into the scored block).

---

### SCORED INTRO — handoff from warm-up to real
**Time lock:** 6 s

**BODY:**
- [headline, 26 px, bold] Now, the real thing.
- [p, 19 px] The next **30 audits** count toward your bonus (**up to
  $6.00**).
- [p, 17 px, dark slate] Same task as the warm-up. Good luck.

---

### BLOCK 1 — 15 companies, K = 4 
**Per-trial time lock:** 8 s

Every combination of:
- N ∈ {10, 20, 30} (size)
- k ∈ {0, 1, 2, 3, 4} (suspicious count)
Order randomized per participant.

**Per-trial page layout:**
- Header: **"Company X of 30"** (global counter, not per-block). No
  "3 of 8" or block indicators.
- **Header bullet list** (big, bold, no colored background) — this is
  the visually dominant element on the page:
  - `Company Size: [Small | Medium | Large] (N transactions)`
  - `The manager sent the following [K] transactions:`  (K = 4 in
    Block 1, K = 8 in Block 2 — plugged in dynamically from the
    current trial's disclosure count)
- **Disclosed transactions** (small cards, C/S stamps): shown in a row
  directly under the bullets. Intentionally kept smaller than the
  header text so the bullet list leads the page.
- Estimate slider, 0%–100%. **Requires a drag** even if the
  participant ends at 50% (a check against no-interaction clicks).
- **Coverage band** under the slider thumb shows what 10-percentage-
  point window the current estimate covers (e.g., picking 20% shows a
  shaded band from 10%–30%).
- Bet slider, 0¢–10¢, default 0¢.
- Next disabled for the first 8 s. If the estimate slider hasn't been
  touched, a red error appears instead of advancing.

---

### PAGE 54a — Rule change: announcement
**Time lock:** 8 s

**Kicker** (centered, small caps, primary blue): `RULE CHANGE`

**BODY:**
- [headline, 28 px, extra-bold, centered] Audit regulations just
  changed.

**VISUALS (centered row):**
- **Old rule** card: label `Old rule`, number `4` struck through.
- **Arrow** `→`.
- **New rule** card: green-tinted, label `New rule`, number `8`.

**Emphasized callout** (26 px, extra-bold, centered, with color cues):
- [p, 26 px, centered, weight 800] Managers must now disclose
  <span style="color:green">**8**</span> transactions, not
  <span style="color:red; text-decoration:line-through;">**4**</span>.

---

### PAGE 54b — Rule change: everything else the same
**Time lock:** 7 s

**BODY:**
- [p, 22 px, weight 600] Everything else stays the same: the manager
  still picks which ones, you still estimate and bet.
- [p, 20 px] **15 more companies** under the new rule.

---

### BLOCK 2 — 15 companies, K = 8
**Per-trial time lock:** 8 s

Every combination of:
- N ∈ {10, 20, 30}
- k ∈ {0, 1, 4, 7, 8}
Same per-trial layout as Block 1; header continues the global counter
(16 of 30, 17 of 30, ...).

3 attention checks are interleaved at random positions across the full
30-trial run.

---

# ACT VII — WRAP-UP

### PAGE 55
**Time lock:** 10 s

**TITLE:** `About You`

**Questions:**
- **Age** *(dropdown, required)*: 18-24 · 25-34 · 35-44 · 45-54 · 55-64 ·
  65 or older.
- **Gender** *(dropdown, required)*: Male · Female · Non-binary · Other ·
  Prefer not to say.
- **Stats comfort** *(5-point Likert, required)*:
  *"How comfortable are you with probability and statistics?"*
  1 = Not at all · 5 = Very comfortable.

---

### PAGE 56 — Debrief (deliberately minimal)
**Time lock:** none

**TITLE:** `Thank You, Government Auditor`

**BODY:**
- Thanks for taking part in this study.
- Your bonus is shown below. Use the completion code to register your
  submission on Prolific.

**Design choice:** we intentionally do **not** reveal:
- The study's research question.
- What the "correct" reasoning would have been (e.g., how to treat the
  undisclosed transactions).
- The manager's actual incentive structure or the fact that disclosure
  is strategic in real settings.

A detailed debrief would let early participants share the hypothesis
with later participants (word-of-mouth is heavy on Prolific), priming
later samples. The researcher can provide a full debrief via Prolific's
post-study message if requested.

**EXTRAS:**
- Earned bonus displayed.
- Completion code `COMP2SN` + Prolific return button.

---

# END OF SCRIPT
