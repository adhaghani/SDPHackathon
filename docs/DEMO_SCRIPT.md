# BorrowBetter demo script

Three-minute walkthrough of the verified core loop. Use a phone-sized window and a laptop-sized window. The seeded demo is fictional and labelled in the UI.

## Before the demo

```bash
npm run demo:reset
npm run dev --workspace web
```

Open `http://127.0.0.1:3000`. If Supabase is paused, run the reset again after opening the dashboard.

## 1. Join — 20 seconds

1. On the landing page, choose **Continue as → Aisyah · resident**.
2. Aisyah lands on **Home** with `1,250 BP` and the demo-data banner visible.
3. Explain that points come only from verified activity.

## 2. Discover and participate — 35 seconds

1. Open **Events**.
2. Open **Demo check-in window · gotong-royong**.
3. Choose **RSVP as attendee**.
4. Open **QR ticket**. The pass renders a QR and a 30-second refresh countdown.

## 3. Verify — 50 seconds

1. Sign out and choose **Continue as → Raj · organiser**.
2. Open **Events → Demo check-in window · gotong-royong → Manage check-in**.
3. Use **Open camera scanner** if a camera is available, or paste the QR token in the accessible fallback.
4. The result announces the resident name and points; Aisyah's phone shows the points moment and updated balance.
5. If the event is outside its check-in window, use the seeded completed activity on Home and Rewards to explain the verified ledger.

## 4. Share — 50 seconds

1. Sign out and continue as **Aisyah · resident**.
2. Open **Borrow**, then **Pressure washer for the next clean-up**.
3. Request a future loan. The seeded booking is already at the request stage for a shorter path.
4. Sign out and continue as **Raj · organiser** or the lender view in **Borrow → Mine**.
5. Approve, confirm handover on both sides, mark returned with the “would you have bought it?” answer, then confirm return.
6. The lender receives `+40 BP`; an on-time return receives `+10 BP`.

## 5. Recognise — 30 seconds

1. Continue as Aisyah and open **Rewards**.
2. Show the balance, Contributor level, route progress, earned badges and plain-language activity history.
3. Explain that the partner catalogue arrives in Phase 2.

## 6. Improve the township — 35 seconds

1. Sign out and continue as **Township office · admin**.
2. Open **Township Pulse**.
3. Show active residents, repeat attendance, completed borrows, items reused, estimated purchases avoided and the three chart tabs.
4. Point out that breakdowns under five residents are suppressed and that the dashboard uses aggregate functions only.

## Fallback

If camera access or Supabase is unavailable:

1. Use the manual token/search path on the event manage page.
2. Use the seeded `Home`, `Rewards` and `Township Pulse` pages to show the completed loop.
3. Run `npm run demo:reset` to restore the same state.
