# Record the 3R pitch

Open `/brief`. This public presentation follows the five-member script from the supplied team-pack PDF, pages 2–6, without changing the spoken words. It now has **26 slides and 73 visual beats**, including the opening hold. Every spoken phrase maps to a visual state. The full mapping is in [BRIEF_SCRIPT_MAP.md](BRIEF_SCRIPT_MAP.md).

## Present with the keyboard

- **Right / Page Down:** advance one visual beat. Highlights, workflow steps, estimate methods and slide changes all follow this single sequence.
- **Left / Page Up:** reverse one beat, including across slide boundaries. Returning to a slide restores its last beat in the sequence.
- **Space:** next beat when a button, link or editable control is not focused.
- **Shift + Right / Left:** jump to the start of the next / previous slide.
- **Home / End:** opening hold / final closing beat.
- **R:** restart the current slide from its first beat and replay its entrance.
- **H:** hide/show editor controls. Recording mode hides the cursor over the presentation, including its visual controls.
- **F:** enter/exit browser fullscreen where supported.
- **Escape:** restore controls. Double-click an empty part of the stage also restores them.

Optional clicks on diagrams select the corresponding narration beat; they use the same state as keyboard navigation. You never need to click an illustration during recording. Native form controls retain their normal keyboard behaviour. Holding a navigation key does not repeatedly skip beats.

## Follow the actual recordings

The editor area shows the current member, exact spoken phrase, slide/beat counter and a transition strip. Read the current phrase with its visual on screen, then press Right as the next phrase begins. The opening is a pre-speech hold: press Right as Member 1 starts “A pressure washer used once.” Hold the final closing frame after the tagline.

Navigation is manual. There are no assumed timings or automatic transitions. The full script remains 570 spoken words; the number of visual changes does not add narration. Some beats cover a phrase within a sentence, so use the original recordings to decide the exact advance point. Take a rehearsal pass before recording.

The URL stores the slide, beat and recording mode. For example `/brief?scene=borrow-loop&beat=3&clean=1` opens the borrower-return beat without editor controls. Beat numbers in URLs start at 1. Reload preserves that state. Invalid scenes fall back to the opening; invalid/out-of-range beats are clamped safely.

## Stable recording frame

The desktop workspace fills the viewport without a page-width cap. Above 900px, the slide occupies 70% of the screen width and the presenter script panel occupies 30%. Narration, navigation, app links, transition cues and keyboard guidance all live in that right panel, which scrolls independently. The slide stays 16:9 and scales with its column width only; changing window height or narration length does not resize it. Short slide panes scroll instead of shrinking the slide. At 900px and below, the script panel stacks beneath the full-width slide for readability. Mobile editor previews use the same 660px height for every slide; recording mode uses the full screen width and keeps the landscape 16:9 composition. Use a 1920x1080 or 1280x720 landscape recording viewport. Reduced-motion preferences remove entrance and spatial transition effects while preserving the visible state.

## Recording and factual boundaries

1. Assemble the five voice recordings first; old timestamps are provisional.
2. Rehearse the arrow sequence using the exact narration and next-beat cue in the script panel.
3. Press H to hide editor controls and the cursor; record each shot or section, then place it over the voices in the final editor.
4. Use Open app screen for separate footage of the actual workflow. Routes require normal authentication. Diagrams are labelled presentation illustrations and do not write data, reserve items or complete transactions.
5. Keep sample app footage labelled. The presentation avoids invented quantities, campaign percentages and point values. Recycling contributions and equivalents are self-reported estimates. Equivalents require documented factors. BetterPoints recognise eligible participation rather than measured environmental impact. The pilot is proposed.
6. Add the five members' names in the final editor and hold the closing frame.

The frame uses BorrowLah's lime/ink/paper identity, typography and township-line motif. It is excluded from search indexing and has no database writes.

## Visual assets

The washer uses the user's supplied Kärcher photo, edited with the built-in image tool to remove the room/packaging and add reuse-arrow and leaf accents. The original was not modified. The chair and bottles are generated illustrative cutouts, not resident listings. Their fixed image frames contain the full image without covering captions. The same objects return in the closing for continuity.

Assets: `apps/web/public/images/brief/`. Provenance and prompts: `docs/brief-assets/pressure-washer.prompt.txt` and `docs/brief-assets/scenario-images.prompts.txt`.

Supporting examples now add variety: a drill and ladder for borrowing, books and a plant for giveaways, and paper/cardboard with aluminium cans for recycling. The opening retains the three objects named in the script. The pressure washer stays consistent through its named loan workflow. Generic giveaway diagrams follow the books/plant example through handover, and later recaps use the new objects. These are illustrative assets generated with the built-in image tool; their exact prompts are in `docs/brief-assets/variety-images.prompts.txt`.

## Actual mobile app snippets

Slides 6 (`find-request`), 10 (`giveaway-listing`) and 15 (`recycling-entry`) now show mobile screenshots of the actual application. Each narration beat selects the corresponding captured state: product/calendar/dates, listing/condition/location, and Count items/Custom kg. Arrow and Page keys work as before; adjacent step buttons select the same beat. Phone screens are captured images rather than embedded live forms, so the recording needs no login or mouse interaction.

The product illustrations are used in the borrowing and giveaway captures and next to each phone. Captures include visibly labelled sample data and unsaved draft inputs. No transactions were submitted. Sources, substitutions and limitations are documented in [brief-assets/app-ui-captures.md](brief-assets/app-ui-captures.md).
