# Empty root-level directories removed -- 2026-04-20

During the audit-code sweep, three empty directories were found at the
project root that were leftovers from a pre-`survey/` layout:

```
FBO 2/
  backend/   (empty -- survey backend now lives in survey/backend/)
  css/       (empty -- survey CSS now lives in survey/css/)
  js/        (empty -- survey JS now lives in survey/js/)
```

All three were confirmed empty before removal via
`ls backend/ css/ js/` returning no files.

This marker preserves the record of what was removed, in keeping with
the audit-code rule "never delete files" (these were not files but
empty directories; the note is for posterity).

If any of these directories reappears with contents, something is
wrong -- investigate before letting it stay.
