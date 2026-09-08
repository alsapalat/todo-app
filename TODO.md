# TODO

## Done
- [x] Scaffold single-page todo app (mobile-first, neutral, flat icons)
- [x] Pure task reducers (`src/tasks.js`)
- [x] Add / complete / edit / delete, All·Active·Done filters, clear completed
- [x] Light + dark theme via `prefers-color-scheme`
- [x] Light/dark toggle in the header, overriding the system setting
- [x] Task details sheet: rich-text description + target date
- [x] Group the list by target date with separators
- [x] Move persistence to a zustand store on `localStorage` (survives closing the tab)
- [x] Vite build + GitHub Pages deploy workflow
- [x] Live at https://alsapalat.github.io/todo-app/ (auto-deploys on push to `main`)
- [x] Unit tests for the pure modules and the store (`npm test`, 60 passing)
- [x] Headless browser check of the UI, grouping and reload persistence (`npm run check`, 26 passing)

## Next (unstarted — ask before picking up)
- [ ] Reorder tasks (drag or up/down)
- [ ] Swipe-to-delete on touch
- [ ] Undo after delete / clear-completed
