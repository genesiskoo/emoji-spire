End the current session cleanly.

## Steps

1. **Check for leftover temp files** and report any found:
   ```
   find . -name "*.tmp" -o -name "*.bak" -o -name "test_*" -o -name "temp_*" -o -name "debug_*" | grep -v node_modules | grep -v .git
   ```
   Delete any found files after confirming they are not intentional.

2. **Remove debug logs** — scan all source files and remove any `console.log`, `console.debug`, `console.warn` that were added for debugging (not intentional production logging):
   ```
   grep -rn "console\." src/ --include="*.ts" --include="*.tsx"
   ```

3. **Remove unused imports** — review any files changed this session for imports that are no longer referenced.

4. **Run `npm run build`** and fix any errors before continuing.

5. **Update `CHANGELOG.md`** with a summary of work done this session. Use today's date. Keep it concise — one line per feature/fix.

6. **Commit and push**:
   - If `$ARGUMENTS` is provided, use it as the commit message.
   - If `$ARGUMENTS` is empty, generate a commit message based on the CHANGELOG.md entries added today (use conventional commit format: `feat:`, `fix:`, `refactor:`, etc.).
   ```
   git add -A && git commit -m "<message>" && git push
   ```
