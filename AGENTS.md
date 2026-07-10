## Security: Environment Files

- NEVER read, print, cat, log, or quote the contents of `.env`, `.env.local`,
  `.env.production`, or any file matching `.env*` (except `.env.example`).
- If you need to know what environment variables exist, look at `.env.example`
  only — it contains variable names with placeholder values, never real secrets.
- Do NOT include env variable values in commit messages, PR descriptions,
  code comments, console.log statements, or test output.
- If a task requires a secret value (e.g. to test an API call), ask the user
  to provide it directly in chat rather than reading it from disk yourself.
- If you accidentally see a real secret value anywhere (a file, a log, a
  terminal output), do not repeat it back in your response — flag that it
  should be rotated instead.
