# todo-app

A single-page to-do list. Mobile-first, neutral palette, flat stroke icons.
Tasks are held in a zustand store persisted to `localStorage`, so they survive
reloads and closing the tab. Built with Vite and deployed to GitHub Pages.

```bash
npm install
npm run dev      # http://localhost:3000 (bound to every interface)
npm test         # pure logic, no browser needed (node:test)
npm run check    # the real UI in headless Chrome: sheet, grouping, persistence
npm run build    # production bundle into dist/
npm run preview  # serve dist/ exactly as Pages will
```

## Layout

| Path                  | What it is                                     |
| --------------------- | ---------------------------------------------- |
| `index.html`          | Markup + the inline SVG icon sprite            |
| `src/styles.css`      | Design tokens, light/dark, mobile-first layout  |
| `src/tasks.js`        | Pure task reducers — no storage, no zustand       |
| `src/store.js`        | zustand store + `persist` to `localStorage`      |
| `src/theme.js`        | Theme preference (localStorage) + resolution     |
| `src/richtext.js`     | Allowlist sanitiser for the description field    |
| `src/dates.js`        | Target-date parsing, comparison and labels       |
| `src/group.js`        | Buckets the visible list under date separators   |
| `src/app.js`          | DOM rendering and event wiring                  |
| `test/*.test.mjs`     | Unit tests for the four pure modules            |
| `test/browser/`       | Headless integration check of the details sheet |

## Features

- Add, complete, delete; tap a task for its details sheet
- Details: rename, a rich-text description (bold, italic, underline, strike,
  bullet and numbered lists) and a target date
- Rows show a notes chip and the due date; overdue dates go amber
- The list groups under date separators: Overdue, Today, Tomorrow, each later
  day, then No date
- All / Active / Done filters, clear-completed
- Light/dark toggle in the header; follows the system until you override it
- 44px tap targets, safe-area padding, iOS-safe 16px inputs

Colours are declared once with CSS `light-dark()`, so the app needs a browser with
Baseline 2024 support (Chrome 123+, Safari 17.5+, Firefox 120+).

## Deploying

Pushing to `main` runs `.github/workflows/deploy.yml`, which installs, tests,
builds and publishes `dist/` to GitHub Pages. The repo's Pages source must be
set to **GitHub Actions**. `base: './'` in `vite.config.js` keeps asset URLs
relative, so the build works under a repo subpath as well as at a domain root.
