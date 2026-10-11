# Performance notes

Measured locally on a headless Chromium desktop/mobile emulation against the seeded local Supabase environment. These are development-environment measurements, not production Lighthouse scores.

| Surface | Measurement |
| --- | --- |
| Resident Home, 390 × 844 | FCP ≈ 256 ms; LCP ≈ 256 ms; load event ≈ 812 ms |
| Township Pulse, 1280 × 900 | load event ≈ 536 ms |

Targets:

- Home LCP under 2.5 s on a mid-range phone profile: met in this local measurement.
- Township Pulse under 2 s on seeded data: met in this local measurement.

Production verification should repeat these measurements on the deployed Vercel region and record the result honestly.
