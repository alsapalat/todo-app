# TODO

## Done
- [x] Scaffold single-page todo app (mobile-first, neutral, flat icons)
- [x] sessionStorage-backed store with pure reducers (`src/store.js`)
- [x] Add / complete / rename / delete, All·Active·Done filters, clear completed
- [x] Light + dark theme via `prefers-color-scheme`
- [x] Light/dark toggle in the header, overriding the system setting
- [x] Task details sheet: rich-text description + target date
- [x] Group the list by target date with separators
- [x] Unit tests for the pure modules (`npm test`, 53 passing)
- [x] Headless browser check of the sheet, storage and grouping (`npm run check`, 20 passing)
- [x] Dependency-free dev server (`npm run dev`)

## Next (unstarted — ask before picking up)
- [ ] Reorder tasks (drag or up/down)
- [ ] Swipe-to-delete on touch
- [ ] Undo after delete / clear-completed
- [ ] Optional localStorage mode so tasks survive closing the tab
