# Event Planner (Version 1)

Mobile-first guest list & event management app built with pure HTML + CSS + JavaScript.

## How to use

1. Open `index.html` in a mobile browser (Chrome recommended on Android).
2. Create your first event.
3. Go to **Guests** tab and start adding families or import a CSV.
4. Create sub-events (Haldi, Mehendi, etc.) from the **Events** page.
5. Use the tabs on Guests page to mark Invited / Confirmed / Attended per function.
6. Export lists as CSV or print-friendly view from the **Share** page.

## Features in this version

- Family / household based guest list
- Flexible columns (Return Gift, Shagan, Rooms, Address, Side, Notes)
- Multiple sub-events with separate invite status
- CSV import
- CSV + Print/PDF export
- Room list, Gift list, Confirmed list quick exports
- Documents / Banquet terms / Menu notes
- Full event backup & restore (JSON)
- Completely offline – data stored in browser localStorage
- WhatsApp direct open from guest phone number

## Next steps (future)

- Turn into a proper PWA (add to home screen + offline caching)
- Better PDF generation
- Room type inventory & remaining rooms calculation
- More polished print templates

## Folder structure

```
event-planner/
├── index.html          → Dashboard
├── guests.html         → Guest List (main feature)
├── events.html         → Main event + Sub-events
├── documents.html      → Banquet terms, menu, costs
├── share.html          → Export & Share tools
├── css/styles.css
└── js/app.js           → Core logic & storage
```
