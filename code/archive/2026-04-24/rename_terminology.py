"""
One-off: standardize terminology across survey JS files.

Changes applied (only in user-facing strings; CSS classes and DOM IDs
are left alone via negative-lookbehind/lookahead on the hyphen/word
character classes):

  Terminology:
    firm(s)       -> company/companies
    (Firm -> Company)
  Action verbs / nouns (the participant never "rates"; they "estimate"):
    true fraud rate    -> actual percentage of suspicious transactions
    fraud rate         -> percentage of suspicious transactions (truth side)
    rate a company     -> give a company an estimate
    You rate X%        -> You estimate X
    rate the company   -> give the company an estimate
    rate each company  -> give each company an estimate
    Rate each          -> Estimate each
    rated low          -> estimated low
    rate accurately    -> estimate accurately
    rating             -> estimate
  Percentage-point language (use plain "points"):
    10 percentage points -> 10 points
    10pp / 10 pp         -> 10 points
    10%                  -> 10 points (only in distance/threshold context)

Targets: survey/js/config.js, survey/js/engine.js

This script is IDEMPOTENT for the firm->company step.
It may re-apply rate->estimate replacements safely because the patterns
are phrase-level and don't match the replacement text.

Usage:  python code/scratchpad/rename_terminology.py
Run from FBO 2 root (or any working dir; paths are resolved from __file__).
"""
import re
import pathlib

ROOT = pathlib.Path(__file__).resolve().parents[2]
FILES = [
    ROOT / "survey" / "js" / "config.js",
    ROOT / "survey" / "js" / "engine.js",
]

# =====================================================================
#  Pattern table.  ORDER MATTERS.
#  Longer / more-specific phrases are applied first so short patterns
#  don't fire inside them.
# =====================================================================
PATTERNS: list[tuple[re.Pattern, str]] = [

    # ── firms / firm (plural first, then singular; preserve case) ────
    (re.compile(r'(?<![\w-])firms(?![\w-])'),  'companies'),
    (re.compile(r'(?<![\w-])Firms(?![\w-])'),  'Companies'),
    (re.compile(r'(?<![\w-])firm(?![\w-])'),   'company'),
    (re.compile(r'(?<![\w-])Firm(?![\w-])'),   'Company'),

    # ── "true fraud rate" (the TRUTH, not the estimate) ──────────────
    # Change wording so the truth is "actual percentage", not a "rate".
    (re.compile(r"every company's true fraud rate is revealed"),
        "every company's <strong>truth</strong> is revealed: the actual percentage of its transactions that were suspicious"),
    (re.compile(r"True fraud rate:"),
        "Truth:"),
    (re.compile(r"true fraud rate"),
        "truth"),
    (re.compile(r"fraud rate"),
        "percentage of suspicious transactions"),

    # ── "You rate X%" in scenario tags ───────────────────────────────
    # Write as a number out of 100, no percent symbol, to match the
    # 0-100 framing the user asked for.
    (re.compile(r"You rate (\d+)%"),
        r"You estimate \1"),

    # ── "rate a company <strong>high</strong>" and "rate a company high|low"
    (re.compile(r"rate a company <strong>high</strong>"),
        "give a company a <strong>high</strong> estimate"),
    (re.compile(r"rate a company <strong>low</strong>"),
        "give a company a <strong>low</strong> estimate"),
    (re.compile(r"rate the company <strong>high</strong>"),
        "give the company a <strong>high</strong> estimate"),
    (re.compile(r"rate the company <strong>low</strong>"),
        "your estimate is <strong>low</strong>"),
    (re.compile(r"rate each company"),
        "give each company an estimate"),
    (re.compile(r"Rate each company"),
        "Estimate each company"),
    (re.compile(r"You want to rate accurately\."),
        "You want to estimate accurately."),
    (re.compile(r"manager just wants to be rated low"),
        "manager just wants a low estimate"),

    # ── "real rate" (inside "whether the company's real rate is low or high")
    (re.compile(r"the company's real rate"),
        "the company's actual percentage"),

    # ── "rating" noun ────────────────────────────────────────────────
    (re.compile(r'(?<![\w-])rating(?![\w-])'),  'estimate'),
    (re.compile(r'(?<![\w-])Rating(?![\w-])'),  'Estimate'),

    # ── Percentage-point language → "points" ─────────────────────────
    # Note: only the bonus-threshold sense.  Don't touch "pp" inside
    # identifiers (no such ids here anyway).
    (re.compile(r'(\d+)\s*percentage\s*points?'),  r'\1 points'),
    (re.compile(r'(\d+)\s*pp\b'),                   r'\1 points'),
    (re.compile(r"within\s+<strong>10%</strong>"),  "within <strong>10 points</strong>"),
    (re.compile(r"within\s+10%(?!\w)"),             "within 10 points"),
    (re.compile(r"10pp"),                            "10 points"),

    # ── "within 10 points of X%" - drop trailing % on the truth ─────
    # Example: "within 10 points of 35%" -> "within 10 points of 35"
    (re.compile(r"within (\d+) points of (\d+)%"),  r"within \1 points of \2"),
    (re.compile(r"(\d+) points of the truth"),       r"\1 points of the truth"),

    # ── Light touch: "percent" as free word stays "percent" ─────────
    # (No change needed.)
]

def transform(text: str) -> tuple[str, int]:
    total = 0
    for pat, repl in PATTERNS:
        text, n = pat.subn(repl, text)
        total += n
    return text, total

def main():
    for p in FILES:
        raw = p.read_text(encoding='utf-8')
        new, n = transform(raw)
        if n:
            p.write_text(new, encoding='utf-8')
            print(f"{p.name}: {n} replacements")
        else:
            print(f"{p.name}: no changes")

if __name__ == '__main__':
    main()
