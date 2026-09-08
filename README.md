# todo-app

A single-page to-do list. Mobile-first, neutral palette, flat stroke icons,
no build step and no dependencies. Tasks live in `sessionStorage`, so they
persist across reloads and disappear when the tab closes.

```bash
npm run dev      # http://localhost:3000
npm test         # store logic (node:test)
```

## Layout

| Path                  | What it is                                     |
| --------------------- | ---------------------------------------------- |
| `index.html`          | Markup + the inline SVG icon sprite            |
| `src/styles.css`      | Design tokens, light/dark, mobile-first layout  |
| `src/store.js`        | Pure task reducers + sessionStorage persistence |
| `src/app.js`          | DOM rendering and event wiring                  |
| `test/store.test.mjs` | Unit tests for the store                        |

## Features

- Add, complete, rename (tap the text), delete
- All / Active / Done filters, clear-completed
- Light and dark, follows the system setting
- 44px tap targets, safe-area padding, iOS-safe 16px inputs
