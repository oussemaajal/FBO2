# CLAUDE.md -- Prolific Setup for FBO 2

**READ THIS FIRST** before doing any Prolific work (creating studies, publishing,
approving submissions, paying bonuses, editing screeners, debugging API errors).
This file captures everything we worked out the hard way so we never repeat it.

---

## What Lives Where

```
FBO 2/
  .env                         # PROLIFIC_API_TOKEN (gitignored)
  .env.template                # template reference (committed)
  code/
    config.py                  # PROLIFIC_CONFIG, EXPERIMENT_PARAMS, load_api_key()
    utils.py                   # ProlificClient class
    02_collect/
      CLAUDE.md                # ← this file
      RUN_PROLIFIC_STUDY.py    # CLI for create/publish/approve/bonus
      FETCH_SURVEY_RESPONSES.py
  survey/
    js/config.js               # Completion codes + part2StudyUrl
    backend/
      sheets-script.gs         # Google Apps Script -- receives survey data
                               # + auto-adds PASS1SN participants to group
```

---

## Credentials

Only `PROLIFIC_API_TOKEN` is needed. Workspace and project IDs are **not
required** for Oussema's Prolific account (it uses the "simple" structure,
no workspaces visible in the UI). The Prolific web UI will not show
"Workspace ID" or "Project ID" menu items for this account.

**File:** `FBO 2/.env` (gitignored)

```
PROLIFIC_API_TOKEN="<the token>"
```

**How the token is loaded:** `code/config.py::load_api_key()` first checks
the environment variable, then falls back to reading `.env` at project root.
**No manual `setx` / `export` needed** -- just keep the token in the `.env` file.

The same token was copied over from `../FBO/.env` on 2026-04-19.

If the API ever returns 401 Unauthorized, the token rotated. Regenerate in
Prolific UI → Settings → Go to API Token.

---

## The Critical Rule: workspace_id IS Required (auto-discovered)

Prolific participant groups (and studies, in some account structures) must
be associated with a **project, workspace, or organisation**. Even though
Oussema's Prolific UI shows no workspace dropdown, a default workspace
exists under the hood.

`utils.py` auto-discovers it: `_discover_workspace_id()` calls
`GET /api/v1/workspaces/` and uses the first workspace returned. The result
is cached on the client instance.

**If you re-introduce an unconditional `'project': self.project_id` without
the workspace fallback, participant-group creation breaks with:**
```
"A participant group can only be associated with one of project,
 workspace or organisation."
```

The current pattern: "prefer project_id if set, else use auto-discovered
workspace_id". Don't change this without testing.

## Filter ID Translation: Labels → Numeric ChoiceIDs

Prolific's filter API expects **numeric string ChoiceIDs**, not human-readable
labels. E.g., `fluent-languages: ["English"]` must be sent as
`fluent-languages: ["19"]`.

`utils.py::_translate_filters()` auto-translates by fetching
`GET /api/v1/filters/` metadata and building a `label → id` reverse lookup
for each filter. It caches the result and runs transparently inside
`create_study()`.

**If you add a new ChoiceID-based filter:** just use the human-readable
label string in `get_recommended_filters()`. The translator will convert.
If the label doesn't match Prolific's catalog, translator raises
`ValueError` with a helpful list of available options.

Labels are **exact match, case-sensitive**. Example gotchas discovered:
- "Business and administrative studies" → not a label. Use "Business".
- "Mathematics or statistics" → not a label. Use "Mathematics".
- The filter ID for education is `highest-education-level-completed`, not
  `education`.

## Completion Codes: Required `actions` Field

Newer Prolific API requires every completion code to have a non-empty
`actions` array with a valid action type. Example:

```python
completion_codes=[
    {"code": "PASS1SN", "code_type": "COMPLETED",
     "actions": [{"action": "AUTOMATICALLY_APPROVE"}]},
    {"code": "FAIL1SN", "code_type": "COMPLETED",
     "actions": [{"action": "AUTOMATICALLY_APPROVE"}]},
]
```

**Do NOT use:**
- Omitting `actions` entirely (400: "This field is required.")
- `"action": "APPROVE"` (400: "Unknown action type. Please provide a valid
  known fixed screen out payment action type.")

The valid action for normal completion is `AUTOMATICALLY_APPROVE` (string,
all caps). Screen-out actions (like `NO_CONSENT`) use different action
types — consult docs if you add them.

---

## The Two-Part Flow

### One command sets up everything

```powershell
cd "C:\Users\ousse\OneDrive\RESEARCH\FBO 2"

# Dry run first (ALWAYS):
python code\02_collect\RUN_PROLIFIC_STUDY.py create-two-part --pilot --dry-run

# When happy, run for real:
python code\02_collect\RUN_PROLIFIC_STUDY.py create-two-part --pilot
```

### What that command does (in order)

1. **Creates participant group** "FBO2 PILOT - Part 1 Passed" -- this is
   the allowlist for Part 2. Returns a group ID.

2. **Creates Part 1 study** with TWO completion codes:
   - `PASS1SN` -- participant passed the quiz. Apps Script will add them
     to the participant group. Marked `APPROVE` in Prolific.
   - `FAIL1SN` -- participant failed. Still `APPROVE` (they get the £1)
     but they will NOT be added to the group, so Part 2 is unavailable.

3. **Creates Part 2 study** filtered to the participant group (allowlist).
   Only Part 1 passers can see/enter.

4. **Saves study IDs** to `data/raw/prolific/two_part_setup_pilot.json`.

5. **Prints next steps** -- including the Part 2 URL that has to go into
   `survey/js/config.js` as `part2StudyUrl`.

### After creation, manual steps

1. Copy the Part 2 URL from the script output.
2. Paste into `survey/js/config.js` in the `prolific` block:
   ```js
   part2StudyUrl: "https://app.prolific.com/studies/<STUDY2_ID>/start",
   ```
3. Deploy the updated config to GitHub Pages (commit both `main` and `gh-pages`,
   bump cache-buster in `index.html` so browsers refresh).
4. Set the group ID in Google Apps Script Script Properties (see below).
5. **Publish Part 2 FIRST**, then Part 1:
   ```powershell
   python code\02_collect\RUN_PROLIFIC_STUDY.py publish <STUDY2_ID>
   python code\02_collect\RUN_PROLIFIC_STUDY.py publish <STUDY1_ID>
   ```
   Reason: the moment Part 1 goes live, passers will hit the completion page
   immediately. Part 2 must already exist or they see "study not available".

---

## Google Apps Script Integration (Sheets + Group-Add)

The survey POSTs each submission to a Google Apps Script endpoint that
(a) appends the data to a Google Sheet and (b) calls the Prolific API
to add Part 1 passers to the participant group.

**Script file:** `survey/backend/sheets-script.gs`

**Deploy steps** (one-time per new sheet):
1. Create a Google Sheet named "FBO Survey Responses"
2. Extensions → Apps Script → paste the `.gs` file
3. Deploy → New deployment → Web app. Execute as Me. Access: Anyone
4. Copy the Web App URL → paste into `survey/js/config.js` as `dataEndpoint`

**Script Properties** (Project Settings → Script Properties):
- `PROLIFIC_API_TOKEN` = same token as `.env`
- `PROLIFIC_GROUP_ID` = the group ID printed by `create-two-part`

The script auto-adds a PID to the group when it sees:
```
data.part === 1 && data.comprehensionFailed === false && data.prolificPID
```

**Important:** this Apps-Script-based group-add is the REAL mechanism.
The Prolific completion-code `actions` field is only `APPROVE`; we do NOT
use completion-code-based group-add. Don't attempt to switch to that
without testing -- it's historically been unreliable.

---

## Screeners (Pre-Screens)

All configured in `get_recommended_filters()` in `RUN_PROLIFIC_STUDY.py`.

### Baseline (always on unless `--loose` or `--no-screeners`)

**Quality + language:**
| Filter ID | Value | Why |
|---|---|---|
| `approval_rate` | 95-100% | Standard quality |
| `approval_numbers` | ≥ 100 | Experience; cuts newbies |
| `first-language` | English | Native-level reading |
| `fluent-languages` | English | Safety net |
| `current-country-of-residence` | UK, US, CA, AU, IE, NZ | English pool |
| `age` | 18+ | Adult sample |

**Background + ability:**
| Filter ID | Value | Why |
|---|---|---|
| `education` | Bachelor's+ | Reasoning / literacy / numeracy proxy |
| `subject` | Accounting, Business admin, Economics, Finance, Math/Stats | Setting familiarity; Oussema's explicit requirement |

### `--loose` drops the background + ability filters

Use if recruitment is too slow on full runs (250+ participants) or for a
generalizability-focused sensitivity analysis. Only quality and language
filters remain. **For pilots: always keep the default (stringent) set.**

**Pool size:** baseline drops the eligible pool from ~300k to ~5-15k. That's
plenty for a 30-person pilot. For the full 250-person run, plan for several
days of recruitment (not hours).

### Filter ID stability

Prolific's `filter_id` strings (`"first-language"`, `"subject"`, etc.) are
stable but not documented cleanly. If the API returns 400, the error body
names the specific filter that failed. Fix that one, re-dry-run, then re-run.

**Never introduce a filter without dry-running first.** A bad filter ID
fails silently inside the print statements but hard-fails on the real
POST, and then the group + Part 1 are already created -- you'd need to
delete them manually before retrying.

---

## Completion Codes

Defined in TWO places that must match:

**`survey/js/config.js`:**
```js
prolific: {
  completionCodes: { pass1: "PASS1SN", fail1: "FAIL1SN", comp2: "COMP2SN" },
  completionUrls: {
    pass1: "https://app.prolific.com/submissions/complete?cc=PASS1SN",
    fail1: "https://app.prolific.com/submissions/complete?cc=FAIL1SN",
    comp2: "https://app.prolific.com/submissions/complete?cc=COMP2SN"
  }
}
```

**`code/config.py EXPERIMENT_PARAMS`:**
```python
'pass_code_part1': 'PASS1SN',
'fail_code_part1': 'FAIL1SN',
'completion_code_part2': 'COMP2SN',
```

**`RUN_PROLIFIC_STUDY.py`** hard-codes the same `PASS1SN` / `FAIL1SN`
in the `completion_codes=[]` argument to `client.create_study()`.

If you ever rename the codes, update all four places.

---

## Pay Amounts (as of v3.11 survey copy)

| Field | Pence | GBP |
|---|---|---|
| `part1_reward_pence` | 100 | £1.00 |
| `part2_reward_pence` | 150 | £1.50 base |
| `bonus_max_pence` | 100 | £1.00 max accuracy bonus |

**Keep these in sync** with the survey text in `survey/js/config.js`
(Welcome pages, consent pages, debrief). If you change the pay in
`config.py`, grep for "1.00", "1.50", "£" in `config.js` and update.

### Known discrepancy: bonus formula

The actual bonus formula in `survey/js/config.js`:
```js
bonus: { baseAmount: 1.50, penaltyMultiplier: 3.00, selectionMethod: "random_trial" }
```

Under this formula, a perfect-accuracy answer earns `baseAmount` = £1.50 total.
So the survey copy "£1.50 base + up to £1.00 bonus" is slightly misleading:
the scoring is Brier-style (quadratic penalty from £1.50 base), not an
additive bonus on top of £1.50.

If you want the literal "base + bonus" framing to match the formula, EITHER:
- Update the survey copy to "up to £1.50, reduced by inaccuracy"; OR
- Rework the bonus formula to `base = 1.50; bonus = max(0, 1.00 - penalty * error)`.

Not fixed as of 2026-04-19 -- flagged to Oussema.

---

## Useful Commands

```powershell
# Create full two-part (baseline screeners):
python code\02_collect\RUN_PROLIFIC_STUDY.py create-two-part --pilot
python code\02_collect\RUN_PROLIFIC_STUDY.py create-two-part          # full (250 participants)
python code\02_collect\RUN_PROLIFIC_STUDY.py create-two-part --n 30    # custom count

# Variations:
python code\02_collect\RUN_PROLIFIC_STUDY.py create-two-part --pilot --strict
python code\02_collect\RUN_PROLIFIC_STUDY.py create-two-part --pilot --no-screeners

# Dry-run ANYTHING first:
python code\02_collect\RUN_PROLIFIC_STUDY.py create-two-part --pilot --dry-run

# Study management:
python code\02_collect\RUN_PROLIFIC_STUDY.py list
python code\02_collect\RUN_PROLIFIC_STUDY.py publish <STUDY_ID>
python code\02_collect\RUN_PROLIFIC_STUDY.py pause <STUDY_ID>
python code\02_collect\RUN_PROLIFIC_STUDY.py status <STUDY_ID>
python code\02_collect\RUN_PROLIFIC_STUDY.py submissions <STUDY_ID>

# Approvals + bonuses:
python code\02_collect\RUN_PROLIFIC_STUDY.py approve <STUDY_ID>
python code\02_collect\RUN_PROLIFIC_STUDY.py bonus <STUDY2_ID>              # auto from Google Sheets
python code\02_collect\RUN_PROLIFIC_STUDY.py bonus <STUDY2_ID> --csv F.csv  # manual CSV
```

---

## Debugging Checklist

**API returns 401 Unauthorized:**
- Token expired or wrong. Regenerate in Prolific Settings → API Token.
- Token not reaching `ProlificClient`. Check `load_api_key('PROLIFIC_API_TOKEN')`
  returns non-empty when run from the project root.

**API returns 400 Bad Request on `create_study`:**
- Most likely a bad `filter_id` in your screeners. Check response body;
  remove or rename the offending filter; dry-run; retry.
- Also check: `external_study_url` malformed, missing `{{%PROLIFIC_PID%}}`
  placeholders. Prolific rejects URLs without them when
  `prolific_id_option: 'url_parameters'`.

**API returns 400 on `create_participant_group`:**
- Account probably doesn't use workspaces. Verify `utils.py` line
  `data = {'name': name}` (nothing else unconditional).

**Participants pass Part 1 but Part 2 doesn't appear:**
- Apps Script not wired up. Check `survey/js/config.js::dataEndpoint` is
  set to the deployed Web App URL.
- Script Properties missing `PROLIFIC_API_TOKEN` or `PROLIFIC_GROUP_ID`.
- Check Apps Script → Executions for error logs.

**Participants see old v3.X survey after a deploy:**
- Browser cache. Bump `?v=<timestamp>` in BOTH `index.html` and
  `survey/index.html` on the gh-pages branch. Script:
  ```python
  import re, time
  new = int(time.time())
  for p in ['index.html', 'survey/index.html']:
      with open(p) as f: c = f.read()
      c = re.sub(r'\?v=\d+', f'?v={new}', c)
      with open(p, 'w') as f: f.write(c)
  ```

**Script says "Prolific API token not found":**
- `.env` missing or has wrong key name. Must be `PROLIFIC_API_TOKEN=` (no
  spaces around =). Supports optional quotes: `PROLIFIC_API_TOKEN="..."`.

---

## Environment Lessons (don't repeat these)

1. **Never commit `.env`** — it's in `.gitignore` for a reason.
2. **Don't hardcode the API token** anywhere in code. Always via `.env`.
3. **Don't create studies without `--dry-run` first.** A mis-typed filter
   ID or wrong reward amount costs real money (you can't edit reward once
   a study is ACTIVE; you'd have to pause, duplicate, republish).
4. **The Part 2 study URL changes every time you recreate.** If you run
   `create-two-part` twice, the `part2StudyUrl` in `config.js` will be
   stale — update and redeploy.
5. **Publishing is irreversible once participants submit.** You can pause,
   but submissions that already came in cost whatever they cost.
6. **Bonus payment is final.** Always `--dry-run` the bonus command and
   sanity-check the CSV / Google Sheets data before paying.

---

## When To Update This File

Update this CLAUDE.md whenever you:
- Change completion codes
- Change pay amounts
- Add/remove a screener to the default set
- Change the Apps Script group-add logic
- Discover a new failure mode
- Switch to a different Prolific account structure (workspaces, etc.)
