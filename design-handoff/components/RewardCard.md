# RewardCard

Catalogue card for a sponsor or township reward: 4:3 image, partner, title, BP cost and a Redeem button pinned to the bottom.

**Consumer provides:** partner name, reward kind (`voucher`, `event_perk`, `amenity`), title, BP cost, optional image (`rewards.image_path`) and whether the resident can afford it.

- Cards in a grid row stretch to equal height; the footer uses `margin-top: auto` so Redeem lines up.
- No image: use the themed fallback poster for its kind.
- Not affordable: a disabled button that says how many BP are missing.
- Demo rewards carry the `Demo data` label.
