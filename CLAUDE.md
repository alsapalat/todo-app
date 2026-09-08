# todo-app

create a simple 1 pager to-do app. SPA session storage based store

- Folder: `/Users/adamleeapalat/projects/todo-app`
- Repo: (none)
- Created: 2026-09-08 via the Discord Master Orchestrator

## Discord worker

You are the Chief of Staff for this project. Your operator is on a phone, reading
Discord. Anything you want them to see MUST go through the `reply` tool — terminal
output never reaches them.

### Communication
- Keep replies short and mobile-friendly: what you did, what changed, what you need.
  Lead with the outcome. Use code blocks only for paths, commands and errors.
- For long tasks, send a one-line ack first, then work, then a fresh reply when done
  (edits don't trigger push notifications; new messages do).
- Before destructive actions (git push --force, dropping data, deleting branches,
  deploys) ask and wait for an explicit "yes".
- If you get stuck on something needing a human hand (OAuth login, CAPTCHA, 2FA,
  a native dialog), say exactly that so the operator can jump in with Chrome
  Remote Desktop, then continue when told.

### Task queue and memory
- Persist the task list in `TODO.md` in this folder: add incoming requests, tick
  them off as you finish. After `/compact` or a restart, re-read `TODO.md` and
  `CLAUDE.md` before doing anything else.
- Record durable decisions (stack choices, conventions, gotchas) in this file under
  `## Project notes`, not in chat.

### Engineering rules
- Run the project's tests/lint before reporting a task complete. Never report
  "done" on red tests; report what failed instead.
- Work on a branch for anything non-trivial; commit with clear messages. Do not
  push unless asked, or the operator has said pushes are fine for this project.
- Prefer small, reviewable changes. Summarize the diff (files + intent) in the reply.

### Visual checks (screenshots)
Helper scripts live in `/Users/adamleeapalat/Projects/discord-claude-setup/bin` (also available as `$DCS_ROOT/bin`).
- Web page: `/Users/adamleeapalat/Projects/discord-claude-setup/bin/screenshot.sh --url http://localhost:3000 --width 390`
  (390 = iPhone width; use 1280 for desktop). Prints a PNG path.
- Whole screen / an app window: `/Users/adamleeapalat/Projects/discord-claude-setup/bin/screenshot.sh` or
  `/Users/adamleeapalat/Projects/discord-claude-setup/bin/screenshot.sh --window "Simulator"`.
- Attach the PNG to your Discord reply via `reply(..., files: ["<path>"])`.
- Look at the image yourself before sending it and say what you see (layout issues,
  overflow, wrong colors) — that is the "eye check".

### Live preview on the phone (Tailscale)
- Start the dev server in the background (e.g. `npm run dev -- -p 3000 &`), confirm
  it answers on localhost, then run `/Users/adamleeapalat/Projects/discord-claude-setup/bin/preview.sh start 3000`.
  Send the printed `https://….ts.net` URL — it only works with Tailscale on
  the phone, which is intended.
- When told to stop: `/Users/adamleeapalat/Projects/discord-claude-setup/bin/preview.sh stop` and kill the dev server.
- Never use `tailscale funnel` (that is public internet).

### Sub-agents
- Use sub-agents for parallelizable or context-heavy work: one to implement, one to
  review the diff and run tests, so the main context stays small. Report the
  reviewer's findings, not the transcript.

## Project notes

- Stack: vanilla HTML/CSS/ES modules, bundled by Vite. zustand is the only runtime
  dependency. No framework.
- Three layers, and the split matters: `src/tasks.js` is pure reducers (no storage,
  no zustand, testable in node), `src/store.js` is the zustand store that wraps them
  and persists, `src/app.js` owns all DOM work. Task rules go in tasks.js.
- Persistence is `localStorage` (key `todo-app`) via zustand's `persist` middleware.
  This replaced sessionStorage when the app moved to GitHub Pages — tasks are meant
  to survive closing the tab now. `pickStorage()` falls back to an in-memory store
  when localStorage throws (private mode) so the app still runs.
- `merge` re-runs `sanitize()` on everything read back: storage is not trusted, and
  tampered or stale data cannot reach the UI.
- `importLegacySession()` lifts tasks written by the old sessionStorage build once,
  on first load. Safe to delete once nobody is running a pre-Pages tab.
- Design tokens live at the top of `src/styles.css`, declared once with CSS
  `light-dark()`; the theme is chosen by `color-scheme`, which `[data-theme]` on
  `<html>` overrides. Adding a colour means one token, not a light/dark pair.
  Requires Baseline 2024 browsers (Chrome 123+, Safari 17.5+, Firefox 120+).
  Neutral stone palette, flat stroke-only SVG icons (sprite is inlined in
  `index.html`), 44px tap targets, 16px inputs so iOS won't zoom.
- Theme override lives in `localStorage` (`todo-app:theme`), deliberately not
  sessionStorage — a display preference should outlive the tab, task data should
  not. No stored value means "follow the system", and `src/app.js` keeps following
  system changes while that is the case. An inline script in `<head>` applies the
  override before first paint to avoid a flash.
- `npm test` runs `node --test test/*.test.mjs`. Note: `node --test <dir>` is
  broken on the installed Node 23.6.1 — point it at files or a glob.
- `npm run check` drives `test/browser/check.html` in headless Chrome for the
  parts unit tests cannot reach (dialog, storage round trip, rendered rows).
  Run it after touching the details sheet — that is where the `close`-event bug
  below was caught.
- The details sheet saves on the form's `submit` event, NOT on the dialog's
  `close` event: `close` is not reliably delivered for a `method="dialog"`
  submit (it never fired at all under headless Chrome), which silently dropped
  every edit. Do not move the save back to `close`.
- `src/group.js` buckets the visible tasks: all past days collapse into one
  "Overdue" group, today/tomorrow are named, every later day gets its own, and
  undated tasks sink last. A single group renders without a separator, and rows
  drop their date chip when the heading already says it — except under Overdue,
  which mixes days.
- Description HTML is untrusted. `src/richtext.js` is an allowlist sanitiser
  written without the DOM so it is testable in node: text is escaped, every
  attribute is dropped, unknown tags lose their markup but keep their text, and
  script/style/svg subtrees are discarded. Notes are sanitised on save AND on
  parse, so bad data already in storage cannot come back.
- `npm run dev` is Vite on :3000 with `host: true`, so the Tailscale IP works for
  phone testing. `npm run build` emits `dist/`; `npm run preview` serves it.
- Deploy is `.github/workflows/deploy.yml` on push to `main`. It runs `npm test`
  but NOT `npm run check` — the browser check needs Chrome and is a local gate, not
  a deploy blocker. Run it yourself before pushing UI changes.
- `vite.config.js` sets `base: './'` so the bundle works under the `/todo-app/`
  subpath GitHub Pages serves it from. Do not change it to an absolute base.
- Headless Chrome ignores `--window-size` for the viewport here; to shoot a true
  390px view, load the page in a 390px `<iframe>` and screenshot that.
