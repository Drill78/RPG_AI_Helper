# Project guidance

## Intent

- Build a practical Chinese AI learning and collaboration tool. Fantasy RPG art is a presentation layer, not complex game mechanics.
- Preserve the mature D&D / classic CRPG pixel aesthetic. Avoid chibi characters, toy-like scenes and childish visual language.
- General AI practice covers transferable advanced workflows as well as fundamentals. Game creation is one specialist track, not the whole product.
- Do not imply that generated prompts have been executed. Do not add paid APIs, public deployment or cloud accounts without user direction.

## Work layout

- React + TypeScript + Vite UI, native Node.js 24 HTTP server and SQLite.
- `src/types.ts` is the content/client contract. `server/validation.mjs` is the runtime input contract; keep limits and optionality aligned.
- Content and user state remain separate. See `docs/CONTENT_GUIDE.md` before adding lessons/recipes.
- Local server listens on loopback only. Preserve strict import validation and transactional If-Match conflict checks.
- Never commit `data/`, backups, local runtime logs, user notes, secrets or generated test databases.

## Verification

- `pnpm build` checks types and builds production output.
- `pnpm test` checks actual HTTP/database behavior and content integrity.
- `pnpm test:e2e` uses port 4178 and a disposable SQLite database, not the user's work area. Build first.
- `node scripts/accessibility.mjs` checks the running development UI on 4173 without API mutations.
- Keep meaningful regressions for note drafts, member isolation, malformed imports, stale revisions and keyboard focus.
- A browser snapshot alone is not proof of persistence or action success. Verify the response and stored result.
- In a long task, update `docs/BUILD_PLAN.md` and `docs/CHANGELOG.md` so another context can resume.

## Known design choices

- Three fixed member IDs (`drill`, `lin`, `an`) with editable names. They are local profiles, not an authentication system.
- All successful mutation endpoints return the complete AppState with an ETag. Send If-Match; on 409 refresh and ask the user to retry, never replay a stale full-array payload automatically.
- Member colors are hexadecimal values, not CSS classes.
- Lesson notes are manually saved to the database; session drafts must not be erased by checklist responses or leaked into another profile.
- Content templates use literal `{{key}}` tokens matching every declared variable exactly. Treat embedded user documents as data.
