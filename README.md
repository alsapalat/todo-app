# todo-app

A single-page to-do list. Mobile-first, neutral palette, flat stroke icons,
no build step and no dependencies. Tasks live in `sessionStorage`, so they
persist across reloads and disappear when the tab closes.

```bash
npm run dev      # http://localhost:3000
npm test         # pure logic: store, theme, sanitiser, dates (node:test)
npm run check    # details sheet + storage round trip, in headless Chrome
```

## Layout

| Path                  | What it is                                     |
| --------------------- | ---------------------------------------------- |
| `index.html`          | Markup + the inline SVG icon sprite            |
| `src/styles.css`      | Design tokens, light/dark, mobile-first layout  |
| `src/store.js`        | Pure task reducers + sessionStorage persistence |
| `src/theme.js`        | Theme preference (localStorage) + resolution     |
| `src/richtext.js`     | Allowlist sanitiser for the description field    |
| `src/dates.js`        | Target-date parsing, comparison and labels       |
| `src/app.js`          | DOM rendering and event wiring                  |
| `test/*.test.mjs`     | Unit tests for the four pure modules            |
| `test/browser/`       | Headless integration check of the details sheet |

## Features

- Add, complete, delete; tap a task for its details sheet
- Details: rename, a rich-text description (bold, italic, underline, strike,
  bullet and numbered lists) and a target date
- Rows show a notes chip and the due date; overdue dates go amber
- All / Active / Done filters, clear-completed
- Light/dark toggle in the header; follows the system until you override it
- 44px tap targets, safe-area padding, iOS-safe 16px inputs

Colours are declared once with CSS `light-dark()`, so the app needs a browser with
Baseline 2024 support (Chrome 123+, Safari 17.5+, Firefox 120+).
