# Mobile app captures used in the pitch

Captured from the running BorrowLah app on 20 October 2026 at a 390 × 760 mobile viewport, in the light theme. These are screenshots of the actual routes and components, not redrawn mockups.

Files are in `apps/web/public/images/brief/app/`. `/brief` displays them in a phone frame; the existing narration beat selects the screenshot. All screenshots for the current slide load eagerly, and Left/Right reverses/advances their selection. The presentation itself requires no account or network data beyond its static assets.

| Slide | Source | Captured states |
| --- | --- | --- |
| Find, check, request | `/borrow/items/[id]` · `ItemDetailPage`, `ItemBookingFlow`, `DayRangePicker` | Item details; availability calendar; selected dates with Request enabled |
| Giveaway listing | `/giveaway` · `GiveawayCard`; `/giveaway/new` · `GiveawayForm` | Sample listing; draft description/condition; draft shared handover location |
| Recycling entry | `/recycling` · `RecyclingLogDialog`, `RecyclingLogForm` | Count items with one sample bottle; Custom kg with 1 kg of sample paper |

The borrowing product photo was substituted in the capture browser only with the existing edited pressure-washer illustration. The giveaway card was populated in the capture browser with a sample books/plant title, description, good condition, Clubhouse lobby location and the existing books/plant illustration. This kept the actual card layout, labels and controls. The other giveaway captures show typed, unsaved form values for the same sample item. The phone-side product art uses the same existing illustrations.

No booking request, giveaway publication/withdrawal, recycling save or image upload was submitted. Demo-account sign-in was used to access the existing routes. Selected dates, counts and weights are illustrative inputs, not measured outcomes. The request capture shows a request ready to send, not a successful transaction. Captured dates are fixed at the recording date.

The slides label these as **Actual app UI · sample data**. The controls shown inside screenshots are captured pixels; use the slide's adjacent steps or the normal arrow/Page keys to change views. For a live workflow, use the editor's existing Open app screen link.
