"""Patch the few stale items in survey_script.md that the resync agent
missed because it ran on a slightly older code snapshot.
"""
import sys, io
from pathlib import Path

# Force UTF-8 stdout so the script can print arrows/em-dashes on cp1252 consoles.
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

p = Path("docs/survey_script.md")
s = p.read_text(encoding="utf-8")

edits = [
    # p2_attn_random correct option
    (
        "- C. Nothing reliable — one transaction isn’t enough. ← correct",
        "- C. Nothing — the type of one transaction tells you nothing about the type of another. ← correct",
    ),
    (
        # alternate apostrophe encoding in case the source uses ASCII
        "- C. Nothing reliable — one transaction isn't enough. ← correct",
        "- C. Nothing — the type of one transaction tells you nothing about the type of another. ← correct",
    ),
    # p4_inst_estimate_try_50 instruction
    (
        "- Move your estimate to **50%**.",
        "- Move your estimate to **60%**.",
    ),
    # p4_inst_estimate_try_50 closing line
    (
        "- [p, 20 px, bold, red] At 50%, you’re 15 percentage points off the",
        "- [p, 20 px, bold, red] At 60%, you’re 25 percentage points off the",
    ),
    (
        "- [p, 20 px, bold, red] At 50%, you're 15 percentage points off the",
        "- [p, 20 px, bold, red] At 60%, you're 25 percentage points off the",
    ),
    # p5_q1 question
    (
        "**Question** (20 px, semibold): What is your job in this study?",
        "**Question** (20 px, semibold): What is your task in this study?",
    ),
    # p5_q8 question prompt — make it match the new total-bonus framing
    (
        "Correct answer: **40%**. Your estimate: **46%**.\nEstimate bonus?",
        "Correct answer: **40%**. Your estimate: **46%**. You bet **0¢**. Total bonus?",
    ),
    (
        "Correct answer: **40%**. Your estimate: **46%**. Estimate bonus?",
        "Correct answer: **40%**. Your estimate: **46%**. You bet **0¢**. Total bonus?",
    ),
]

n_done = 0
for old, new in edits:
    if old in s:
        s = s.replace(old, new, 1)
        print(f"patched: {old[:80]}...")
        n_done += 1
    else:
        print(f"miss   : {old[:80]}...")

p.write_text(s, encoding="utf-8")
print(f"\nApplied {n_done} edits.")
