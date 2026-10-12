# StatusPage

Dark editorial shell for 404 and error pages: a large muted "Oops!", a white headline, a white pill CTA and three quick-route cards.

**Consumer provides:** the headline, one sentence of explanation, the CTA and three routes. Lives at `apps/web/components/shared/status-page.tsx`.

- `ink` band with `radius-band` bottom corners; headline `surface`, copy and route eyebrows `band-eyebrow`.
- Say what happened in plain words and offer a way forward; no error codes in the headline.
- Focus rings switch to `surface` on this band.
