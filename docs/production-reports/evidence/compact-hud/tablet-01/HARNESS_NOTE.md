The first invocation of `reproduce.cjs` exited1 before launching Chromium because
its relative helper path had six parent segments instead of five:
`Cannot find module '../../../../../../scripts/browser-qa-helpers.cjs'`.
The helper/root paths were corrected. This was a QA harness failure and supplies
no evidence about the game. The subsequent `results.json` records the browser
execution separately.
