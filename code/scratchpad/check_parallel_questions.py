"""Spot drift between attention-check / quiz parallel question pairs.
Reads survey/js/config.js, prints option text for each pair side-by-side
so we can eyeball which pairs have diverged.
"""
import re
from pathlib import Path

PAIRS = [
    ("p1_overview_check", "p5_q1",  "task identification"),
    ("p2_attn_coin_flip", "p5_q11", "coin-flip probability"),
    ("p2_check_definition", "p5_q6", "fraud-estimate definition"),
    ("p2_check_audit", "p5_q7", "high-estimate consequence"),
    ("p3_check_how_many", "p5_q3", "who decides how many"),
    ("p3_check_fake", "p5_q5", "manager faking"),
    ("p4_check_manager_incentive", "p5_q12", "manager dislikes high"),
]

src = Path("survey/js/config.js").read_text(encoding="utf-8")


def extract(pid):
    start = src.find(f'id: "{pid}"')
    if start == -1:
        return None, None
    nxt = src.find('id: "p', start + 50)
    block = src[start: nxt if nxt > 0 else None]

    # First non-kicker paragraph is the question
    qm = re.search(r"<p style='[^']*font-weight:[67]00[^']*'>([^<]+)", block)
    q = qm.group(1).strip() if qm else "(no question found)"

    btns = re.findall(r"<button[^>]*data-val='([^']+)'>([^<]+)</button>", block)
    return q, btns


for a, b, label in PAIRS:
    qa, ba = extract(a)
    qb, bb = extract(b)
    print(f"\n=== {label} ({a} vs {b}) ===")
    print(f"  Q  {a}: {qa}")
    print(f"  Q  {b}: {qb}")
    if ba and bb:
        for (va, ta), (vb, tb) in zip(ba, bb):
            tag = "  " if ta.strip() == tb.strip() else "**"
            print(f"  {tag} {va:18s} | {ta[:55]:55s} | {tb[:55]}")
