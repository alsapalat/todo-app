# TODO

## Done
- [x] Scaffold single-page todo app (mobile-first, neutral, flat icons)
- [x] sessionStorage-backed store with pure reducers (`src/store.js`)
- [x] Add / complete / rename / delete, All·Active·Done filters, clear completed
- [x] Light + dark theme via `prefers-color-scheme`
- [x] Light/dark toggle in the header, overriding the system setting
- [x] Task details sheet: rich-text description + target date
- [x] Group the list by target date with separators
- [x] Move persistence to a zustand store on `localStorage` (survives closing the tab)
- [x] Vite build + GitHub Pages deploy workflow
- [x] Unit tests for the pure modules and the store (`npm test`, 60 passing)
- [x] Headless browser check of the UI, grouping and reload persistence (`npm run check`, 22 passing)
- [x] Dependency-free dev server (`npm run dev`)

## Waiting on the operator
- [ ] Push `main` to `git@github.com:alsapalat/todo-app.git` (remote is set, nothing pushed)
- [ ] Set the repo's Pages source to **GitHub Actions** (Settings → Pages)

## Next (unstarted — ask before picking up)
- [ ] Reorder tasks (drag or up/down)
- [ ] Swipe-to-delete on touch
- [ ] Undo after delete / clear-completed
