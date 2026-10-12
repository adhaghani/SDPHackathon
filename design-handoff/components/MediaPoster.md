# MediaPoster

Responsive 3:4 poster for item and event cards, with title and details set over a dark gradient.

**Consumer provides:** the image (uploaded WebP or the demo SVG fallback), the eyebrow (township-line name and category), the title and up to two lines of details. Lives at `apps/web/components/shared/media-poster.tsx`.

- Always 3:4. The image fills with `object-fit: cover`, positioned so faces and labels inside the image are not cropped.
- The scrim is an `ink` gradient from the bottom; overlay text is `surface`, the eyebrow `band-eyebrow`.
- Events: category, date and shared-space location over the image. Items: category, price or "Free", loan limit.
- Missing image: fall back to `/demo/event-placeholder.svg` or the item's themed demo SVG, never an empty box.
