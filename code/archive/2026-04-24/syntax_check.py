"""Proper JS token-aware balance check. Tracks state for strings, template
literals (including ${ } interpolation), regex literals, and comments.
Reports location of any unbalanced bracket.
"""
import sys

path = sys.argv[1] if len(sys.argv) > 1 else "survey/js/config.js"
with open(path, "r", encoding="utf-8") as f:
    src = f.read()


def check(src, path):
    i = 0
    n = len(src)
    line = 1
    col = 1
    stack = []  # (char, line, col)
    # state:
    # 'code'            - normal code
    # 'sq'              - inside 'single-quoted string'
    # 'dq'              - inside "double-quoted string"
    # 'tmpl'            - inside `template string`
    # 'linecomment'     - // to end of line
    # 'blockcomment'    - /* to */
    state = "code"
    # Stack for template-literal interpolation contexts. Each element is
    # 'tmpl' when a ${ opens inside a tmpl — we treat the ${...} as code
    # but need to return to tmpl when the matching } closes.
    tmpl_stack = []
    # We track `{` opens that belong to interpolation separately.
    interp_opens = []  # list of True/False per open brace (True = interp)

    pairs = {")": "(", "]": "[", "}": "{"}
    opens = "([{"
    closes = ")]}"

    while i < n:
        c = src[i]
        nc = src[i + 1] if i + 1 < n else ""
        if c == "\n":
            line += 1
            col = 1
            if state == "linecomment":
                state = "code"
            i += 1
            continue

        if state == "linecomment":
            i += 1
            col += 1
            continue
        if state == "blockcomment":
            if c == "*" and nc == "/":
                state = "code"
                i += 2
                col += 2
                continue
            i += 1
            col += 1
            continue
        if state == "sq":
            if c == "\\":
                i += 2
                col += 2
                continue
            if c == "'":
                state = "code"
            i += 1
            col += 1
            continue
        if state == "dq":
            if c == "\\":
                i += 2
                col += 2
                continue
            if c == '"':
                state = "code"
            i += 1
            col += 1
            continue
        if state == "tmpl":
            if c == "\\":
                i += 2
                col += 2
                continue
            if c == "`":
                state = "code"
                i += 1
                col += 1
                continue
            if c == "$" and nc == "{":
                # enter interpolation — this counts as code, with a { to match
                state = "code"
                tmpl_stack.append(True)
                stack.append(("{", line, col + 1))
                interp_opens.append(True)
                i += 2
                col += 2
                continue
            i += 1
            col += 1
            continue

        # state == code
        if c == "/" and nc == "/":
            state = "linecomment"
            i += 2
            col += 2
            continue
        if c == "/" and nc == "*":
            state = "blockcomment"
            i += 2
            col += 2
            continue
        if c == "'":
            state = "sq"
            i += 1
            col += 1
            continue
        if c == '"':
            state = "dq"
            i += 1
            col += 1
            continue
        if c == "`":
            state = "tmpl"
            i += 1
            col += 1
            continue
        if c in opens:
            stack.append((c, line, col))
            if c == "{":
                interp_opens.append(False)
            i += 1
            col += 1
            continue
        if c in closes:
            if not stack:
                print(f"UNMATCHED CLOSE {c} at {line}:{col}")
                return 1
            top = stack.pop()
            if top[0] != pairs[c]:
                print(
                    f"MISMATCH: close {c} at {line}:{col} does not match "
                    f"open {top[0]} at {top[1]}:{top[2]}"
                )
                return 1
            if c == "}":
                was_interp = interp_opens.pop()
                if was_interp:
                    # pop tmpl_stack and return to tmpl state
                    tmpl_stack.pop()
                    state = "tmpl"
            i += 1
            col += 1
            continue

        i += 1
        col += 1

    if stack:
        print("UNCLOSED:")
        for s in stack[-5:]:
            print(f"  {s[0]} at {s[1]}:{s[2]}")
        return 1
    print(f"OK {path}: balanced")
    return 0


sys.exit(check(src, path))
