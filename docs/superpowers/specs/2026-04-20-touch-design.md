# Touch-Friendly Redesign

> **Goal:** Make Second Chance fully usable on touch devices (phones, tablets) with swipe gestures, larger tap targets, and pull-to-restart on the end screen.

## Architecture

- Add Hammer.js via CDN (`https://cdnjs.cloudflare.com/ajax/libs/hammer.js/2.0.8/hammer.min.js`)
- Create a `TouchManager` class that attaches recognizers to the `.stage` container
- Touch detection at init time: `('ontouchstart' in window) || (navigator.maxTouchPoints > 0)`
- Store in `window.IS_TOUCH = true`
- Apply CSS class to `<body>` (`.touch-device`) for conditional styling

## Gesture Map

| Gesture | Context | Action |
|---------|---------|--------|
| `tap` | Answer buttons | Answer (already handled by click; add explicit tap to avoid double-fire) |
| `swipeleft` | Question card area | Advance to next question |
| `swipe` (any dir) | End-screen | Restart game |
| `swipe` | Start-screen | Ignored |

## Visual Changes

- Answer buttons: `min-height` grows from 72px → 96px on touch devices
- Font sizes scale up slightly on mobile (14px → 16px for answer text)
- Add `:active` states for all buttons (already have some, but need touch-specific)
- Progress track and stat chips get a bit more padding for touch targets
- Start screen: `btn-start` gets a larger hit area

## State Management

- Detect touch device early with `('ontouchstart' in window) || (navigator.maxTouchPoints > 0)`
- Store in `window.IS_TOUCH = true`
- Apply CSS classes to `<body>` (`.touch-device`) for conditional styling
- TouchManager only initializes on touch devices

## Error Handling & Edge Cases

- Swipe on answer buttons should NOT trigger "advance to next question" — buttons need `touch-action: pan-y` to allow vertical scrolling
- Swipe on the question card area triggers advance
- On end-screen, swipe anywhere triggers restart
- On start-screen, swipe is ignored (only start button)
- Prevent default on swipes to avoid page scroll interference

## File Structure

All changes in `Second_Chance.html`:
- Add Hammer.js CDN link in `<head>`
- New `<style>` block for `.touch-device` overrides
- New `<script>` section with `TouchManager` class (after the game logic, before `</body>`)

## Implementation Order

1. Add Hammer.js CDN link
2. Add touch-device CSS overrides
3. Implement `TouchManager` class
4. Wire up touch detection on init
5. Test in browser (mobile emulator)
