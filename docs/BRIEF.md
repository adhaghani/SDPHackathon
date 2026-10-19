# Record the 3R pitch

Open `/brief`. This public presentation companion is excluded from search indexing and has no database writes. It follows the five-member planet-first script: introduction, Reduce, Reuse, Recycle, participation and proposed pilot, closing.

## Controls

- Left/right arrows or Page Up/Page Down: previous/next scene. Space also advances when a form control is not focused.
- Home/End: first/last scene.
- R: replay the current scene's entrance animation. Animations finish and hold; there is no automatic timeline.
- H: hide/show the editor controls. The cursor stays visible for pointer-led recordings.
- F: enter/exit browser fullscreen where supported.
- Escape: restore controls. Double-click/tap the scene to restore them without a keyboard. Browser Escape may also exit fullscreen.
- Jump to scene: choose any of the 12 scenes directly.

The URL follows the current scene. For example `/brief?scene=recycle&clean=1` opens the recycling scene without editor controls. Unknown scenes fall back to the opening. Reload preserves the current scene and clean-mode setting. Fullscreen requires an explicit user gesture.

## Recording workflow

1. Assemble the five actual voice recordings first; the old script timestamps are provisional.
2. Choose the scene whose cue matches the voice. Cues and capture notes appear below the preview, outside the recording frame.
3. Use a landscape 16:9 recording viewport, ideally 1920x1080 or 1280x720. Hide controls, move through scenes manually and press R for retakes. Other aspect ratios receive letterboxing rather than cropping the presentation.
4. Capture each shot separately. The exported app demo clips and presentation shots are placed over the narration in the final video editor.
5. Use Open app screen to open the relevant real workflow in another tab. App routes still require normal authentication. Presentation diagrams explain the flow; they do not simulate live successful transactions.
6. Record a production build when possible; development tools can otherwise appear over the frame.

The presentation preserves BorrowLah's fixed light recording palette even when the app uses a dark theme. Reduced-motion preferences remove entrance animations. A phone-sized editor preview stacks the scene for legibility; clean mode keeps the 16:9 composition.

Recycling weights and equivalents remain estimates. Campaign visuals describe the capability without inventing progress or a completed target. BetterPoints recognise participation, not measured environmental impact. The pilot is proposed. Add team members' actual names in the final video editor.

## Pressure-washer photo

The Reduce scene uses the user's supplied Kärcher photo, edited with the built-in image tool to remove the room/packaging and add reuse-arrow and leaf accents. The transparent asset is `apps/web/public/images/brief/pressure-washer-photo.png`; its generation prompt and provenance are in `docs/brief-assets/pressure-washer.prompt.txt`. The original supplied photograph was not modified. This replaces only the presentation's pressure-washer mock; it does not change resident listings or database records.

## Mouse-led presentation

Five visuals support mouse or keyboard selection without changing scenes:

- Three Rs: click Reduce, Reuse or Recycle to highlight the principle and reveal its meaning.
- Borrow & return: click any numbered step to explain the corresponding action.
- A second home: click the giver or recipient to explain their role in the handover.
- Recycle: click Paper, Plastic, Metal or Glass to highlight the material and its estimate methods.
- The next step: click a pilot measure to explain what would be tracked.

Selections remain visible until you choose another item or replay/leave the scene. R resets the interaction and replays the entrance. These explanatory interactions do not write data or complete real transactions. All remain available when editor controls are hidden. Double-click an empty part of the stage to restore editor controls; double-clicking a visual button does not exit clean mode.
