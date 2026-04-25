"""One-shot: change the question paragraph on attention-check / quiz pages
from text-align:justify to text-align:center, so it visually matches the
centered kicker and button row above/below it.
"""
import re
from pathlib import Path

src_path = Path("survey/js/config.js")
src = src_path.read_text(encoding="utf-8")

lines = src.split("\n")
new_lines = []
i = 0
changed = 0

while i < len(lines):
    line = lines[i]
    # Look for a <p style='text-align:justify; ...font-weight:600 or 700...'>
    m = re.match(
        r"^(\s*)\"<p style='text-align:justify;([^']*font-weight:(?:600|700)[^']*)'>\"\s*\+\s*$",
        line,
    )
    if m:
        # Confirm the next ~8 lines contain a practice-buttons div
        window = "\n".join(lines[i : i + 10])
        if "practice-buttons" in window:
            new_line = (
                m.group(1)
                + "\"<p style='text-align:center;"
                + m.group(2)
                + "'>\" +"
            )
            new_lines.append(new_line)
            changed += 1
            i += 1
            continue
    new_lines.append(line)
    i += 1

src_path.write_text("\n".join(new_lines), encoding="utf-8")
print(f"Changed {changed} question paragraphs from justify to center.")
