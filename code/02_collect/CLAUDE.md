# CLAUDE.md — Prolific Operator Runbook (single-study, v4)

**READ THIS FIRST** before any Prolific work (creating studies, publishing,
approving submissions, paying bonuses, editing screeners). Captures everything
worked out the hard way.

---

## What Lives Where

```
FBO 2/
  .env                         # PROLIFIC_API_TOKEN, FBO2_SHEET_READ_TOKEN (gitignored)
  .env.template                # template reference (committed)
  code/
    config.py                  # PROLIFIC_CONFIG, EXPERIMENT_PARAMS, SURVEY_CONFIG
    utils.py                   # ProlificClient class
    02_collect/
      CLAUDE.md                # ← this file
      RUN_PROLIFIC_STUDY.py    # CLI: create / publish / approve / bonus / etc.
      FETCH_RESPONSES.py       # Download responses from the Google Sheet via READ_TOKEN
  survey/
    js/config.js               # dataEndpoint + completionCode
    backend/
      sheets-script.gs         # Google Apps Script (receives survey POST, writes to sheet)
```

---

## Credentials

Only `PROLIFIC_API_TOKEN` is needed in `.env`. Workspace/project IDs are auto-
discovered — the account uses the "simple" structure and has no visible workspace
dropdown in the Prolific UI.

```
# FBO 2/.env (gitignored)
PROLIFIC_API_TOKEN="<the token>"
FBO2_SHEET_READ_TOKEN="<long random string, matches Apps Script READ_TOKEN>"
```

The token is loaded by `code/config.py::load_api_key()` (env var, fallback to
`.env` file). No manual `setx`/`export` needed.

If the API returns 401 Unauthorized, regenerate in Prolific UI →
Settings → API Token.

---

## Design: Single Study (v4.x)

One Prolific study. Participant opens URL → instructions → quiz (retry-mode,
no fail) → 5 practice trials → 30 scored trials → demographics → debrief.
Submits once. Gets paid base + accuracy bonus.

**Key differences from v3.x (two-part flow, archived 2026-04-24):**
- No Part 1 / Part 2 split. No participant group. No allowlist filter.
- Single completion code `COMP2SN` (participants who finish the full survey).
- Bonus computed client-side and shipped as `bonus.amount` in the submission.
- Google Apps Script just logs to Sheet; no Prolific API calls from it.

---

## The One-Command Flow

### Create a draft study (nothing published, nothing charged yet)

```powershell
cd "C:\Users\ousse\OneDrive\RESEARCH\FBO 2"

# Dry-run FIRST (always):
python code\02_collect\RUN_PROLIFIC_STUDY.py create --pilot --dry-run

# When happy, run for real:
python code\02_collect\RUN_PROLIFIC_STUDY.py create --pilot
```

What that does:
1. Resolves a participant count (`--pilot` = 20, default = 250, `--n N` = custom).
2. Builds the screener filter set (see `get_recommended_filters()` for the
   baseline: approval rate, language, country, education, subject).
3. Creates a single DRAFT study in your Prolific account.
4. Saves the study ID to `data/raw/prolific/prolific_setup_<mode>.json`.
5. Prints the Prolific URL for you to preview before publishing.

**Publishing is separate — the `create` command never publishes.**
To publish when ready:
```powershell
python code\02_collect\RUN_PROLIFIC_STUDY.py publish <STUDY_ID>
```

---

## Screeners (`get_recommended_filters`)

Baseline (applied unless `--loose` or `--no-screeners`):

| Filter | Value | Why |
|---|---|---|
| `approval_rate` | 95–100% | Quality |
| `approval_numbers` | ≥ 100 | Experience |
| `first-language` | English | Reading comprehension |
| `fluent-languages` | English | Safety net |
| `current-country-of-residence` | UK, US, CA, AU, IE, NZ | English pool |
| `age` | 18+ | Adult sample |
| `education` | Bachelor's+ | Numeracy proxy |
| `subject` | Accounting, Business admin, Economics, Finance, Math/Stats | Setting familiarity |

`--loose` drops the background filters (education + subject), keeping only
quality + language filters.

`--no-screeners` drops everything (use for maximum recruitment speed or
generalizability sensitivity analysis; never for a pilot).

### Filter ID translation

Prolific's filter API expects numeric `ChoiceID` strings. `utils.py::
_translate_filters()` auto-translates human-readable labels to IDs by
fetching `/api/v1/filters/` and building a reverse lookup. Labels are
case-sensitive and exact-match. Gotchas discovered:
- "Business and administrative studies" → use "Business"
- "Mathematics or statistics" → use "Mathematics"
- Education filter ID is `highest-education-level-completed`, not `education`.

If a label doesn't match, the translator raises `ValueError` with the list
of available options.

---

## Completion Code

`COMP2SN` (the `comp2` code from v3) is the single completion code.
Defined in three places that must match:

**`survey/js/config.js`:**
```js
prolific: {
  completionCode: "COMP2SN",
  completionUrl: "https://app.prolific.com/submissions/complete?cc=COMP2SN"
}
```

**`code/config.py::EXPERIMENT_PARAMS`:**
```python
'completion_code': 'COMP2SN',
```

**`RUN_PROLIFIC_STUDY.py::cmd_create`:** hard-codes the same `COMP2SN` in the
`completion_codes=[]` argument to `client.create_study()`.

If you rename the code, update all three places.

---

## Pay Amounts

| Field | Minor units | USD | Comment |
|---|---|---|---|
| `reward_minor` | 300 | $3.00 | Base pay, guaranteed |
| `bonus_max_minor` | 600 | $6.00 | Max accuracy bonus (30 × 20¢ per-trial max) |

**Keep in sync** with the survey copy in `survey/js/config.js` (welcome,
consent, "You're ready", scored intro, debrief). If you change these, grep
for "3.00", "6.00", "$" in `config.js` and update the copy.

The minimum-time floor (sum of all time locks) is ~14 min. The survey copy
says "about 20 minutes" on the consent page — realistic for an engaged
participant.

---

## Useful Commands

```powershell
# Create a draft (doesn't publish):
python code\02_collect\RUN_PROLIFIC_STUDY.py create --pilot --dry-run
python code\02_collect\RUN_PROLIFIC_STUDY.py create --pilot
python code\02_collect\RUN_PROLIFIC_STUDY.py create --n 50
python code\02_collect\RUN_PROLIFIC_STUDY.py create                  # full (250)

# Variations:
python code\02_collect\RUN_PROLIFIC_STUDY.py create --pilot --loose       # drop bg filters
python code\02_collect\RUN_PROLIFIC_STUDY.py create --pilot --no-screeners

# Study management:
python code\02_collect\RUN_PROLIFIC_STUDY.py list
python code\02_collect\RUN_PROLIFIC_STUDY.py publish <STUDY_ID>
python code\02_collect\RUN_PROLIFIC_STUDY.py pause <STUDY_ID>
python code\02_collect\RUN_PROLIFIC_STUDY.py status <STUDY_ID>
python code\02_collect\RUN_PROLIFIC_STUDY.py submissions <STUDY_ID>

# Approvals + bonuses (after submissions land):
python code\02_collect\RUN_PROLIFIC_STUDY.py approve <STUDY_ID>
python code\02_collect\RUN_PROLIFIC_STUDY.py bonus <STUDY_ID>               # auto from Google Sheets
python code\02_collect\RUN_PROLIFIC_STUDY.py bonus <STUDY_ID> --csv F.csv   # manual CSV
```

---

## Google Apps Script Setup (one time per new sheet)

1. Create a Google Sheet (name: "FBO Survey Responses v4" or similar).
2. Extensions → Apps Script → paste `survey/backend/sheets-script.gs`.
3. Deploy → New deployment → Web app. Execute as Me. Access: Anyone.
4. Copy the Web App URL → paste into `survey/js/config.js` as `dataEndpoint`.
5. Copy the Sheet ID (long string in the URL) → paste into
   `code/config.py::SURVEY_CONFIG['google_sheet_id']`.
6. (Optional) Script Properties → add `READ_TOKEN = <long random string>`.
   Use the same value in `.env` as `FBO2_SHEET_READ_TOKEN`. This lets
   `FETCH_RESPONSES.py` download the sheet over HTTPS.

**No Prolific API token or group ID is needed in Script Properties** (v3
footgun — only needed for the participant-group gate, which is gone).

### What the Apps Script does

- Receives `POST` from the survey on submit.
- Flattens the summary payload to dot-notation keys, appends as a row
  on the active sheet. Auto-extends header row when new fields appear.
- Appends the full nested JSON (`raw_json`) as one row on the `raw` tab,
  with `submission_time_utc`, `prolific_pid`, `bonus_amount`, and the blob.
- Serves a read-only `GET` endpoint (gated by `READ_TOKEN`) for
  `FETCH_RESPONSES.py` to pull the latest data.

---

## Debugging

**API returns 401 Unauthorized:**
- Token expired. Regenerate in Prolific Settings → API Token.
- Check that `load_api_key('PROLIFIC_API_TOKEN')` returns non-empty.

**API returns 400 on `create_study`:**
- Most likely a bad `filter_id` in screeners. Error body names the
  offending filter.
- Check `external_study_url` is well-formed + contains
  `{{%PROLIFIC_PID%}}`, `{{%STUDY_ID%}}`, `{{%SESSION_ID%}}`.

**Participants land on the survey but nothing submits to the sheet:**
- Hit the Apps Script URL directly in a browser — should show
  `{"status":"ok","message":"FBO Survey data endpoint is active."}`.
  If not, the deployment is stale; re-deploy.
- Check the browser's DevTools console for CORS or 404 errors.

**Participants see the old survey:**
- Browser cache. Bump `?v=<timestamp>` in `survey/index.html` on
  `gh-pages` and redeploy. Script:
  ```python
  import re, time
  new = int(time.time())
  p = 'survey/index.html'
  with open(p) as f: c = f.read()
  c = re.sub(r'\?v=\d+', f'?v={new}', c)
  with open(p, 'w') as f: f.write(c)
  ```

**`.env` not loading:**
- File must be at project root (`FBO 2/.env`).
- Key format: `PROLIFIC_API_TOKEN=...` or `PROLIFIC_API_TOKEN="..."`.
  Both work; no spaces around `=`.

---

## Environment Lessons (don't repeat these)

1. **Never commit `.env`** — it's in `.gitignore` for a reason.
2. **Don't hardcode the API token** anywhere in code.
3. **Always `--dry-run` first** when creating a study. A bad filter ID
   or wrong reward amount costs real money once the study is ACTIVE
   (you can't edit reward on an active study; you'd have to pause +
   duplicate + republish).
4. **Publishing is irreversible once participants submit.** You can
   pause, but submissions already collected are billed.
5. **Bonus payment is final.** Always `--dry-run` the `bonus` command
   and sanity-check the CSV / Google Sheets data before paying.
6. **The survey URL is static.** It never changes with a new study —
   the same `survey_url` in `SURVEY_CONFIG` serves every study. Only
   the study ID (which the URL doesn't need) changes.

---

## When To Update This File

Update whenever you:
- Change the completion code
- Change pay amounts
- Add/remove a screener
- Change the Apps Script logic
- Hit a new failure mode worth documenting
