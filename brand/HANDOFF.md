# Finding Zora brand kit: website handoff

Drop this folder into the repo at `brand/` (replacing older mark files) and use it as the source of truth for the website.

## What changed (October 2026)

- The Z is drawn the right way round. The trail starts at the trailhead (bottom right, two stones in the tread), passes a three-stone cairn at the first bend (bottom left), climbs the diagonal, and finishes along the top line with the sun rising off its left end.
- The trail has hairpin turns, a slight drift and worn edges, and narrows from the trailhead toward the horizon.
- ZORA lockups: "ora" stands close beside the Z, top aligned with the Z's top and baseline just above the Z's bottom line. No cairn in the lockups.
- Coin disk and field stamp carry the new Z.
- Any older Z, lockup, favicon or inline SVG path on the site (including `M14 100 H98 L22 40 H106`) is outdated and should be replaced.

## Files

- `logos/`: zora-z (light), zora-z-reverse (dark grounds), zora-z-mono (one ink), finding-zora-lockup (+ reverse), zora-lockup (+ reverse), zora-coin-disk, zora-field-stamp. All text is outlined.
- `fonts/`: Big Shoulders Stencil Display (display), Overpass (body), Overpass Mono (field-stamp data only). Copy to `public/fonts/` or swap the @font-face rules for next/font.
- `tokens/tokens.json`: colors (field and night themes), type scale, spacing, radius.
- `tokens/zora-theme.css`: the same tokens as a Tailwind 4 `@theme` block with light/dark theme variables.
- `BRAND-GUIDE.md`: usage rules (clear space, minimum size, color budget, voice, never mirror or rotate the Z).

## Suggested website updates

1. Replace the header logo with `finding-zora-lockup` (`-reverse` on dark).
2. Regenerate the favicon and app icons from `zora-z` (simplified stones and cairn are expected at 16 to 32 px).
3. Wire `zora-theme.css` into the global stylesheet and move hard-coded brand colors onto the tokens.
4. Update the share card and any OG images that use the old mark.
