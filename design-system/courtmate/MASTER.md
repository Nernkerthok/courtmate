# CourtMate UI system

Applied using [UI/UX Pro Max](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill).

## Direction

Compact mobile activity tool for friends organizing badminton. Use the skill's Flat Design recommendation: clear surfaces, strong hierarchy, restrained effects, fast color feedback. The generated landing-page sections and serif typography do not fit this existing Thai utility app; retain the three-step workspace and bundled IBM Plex Sans Thai. The original emerald/teal and lime brief takes precedence over generated alternative palettes.

## Tokens

- Canvas: `#f3f7f4`; surface: white; ink: `#153e35`; secondary text: `#526b65`.
- Brand: `#075e49`; deep brand: `#103e33`; accent: `#d4f578` with deep-brand text.
- Borders: `#cfded7`; soft selected surface: `#d9efe5`.
- Text: 16px inputs, 14px content, 12px metadata. Small English decorative labels may use 10px. Keep Thai line-height generous.
- Spacing: 4/8/12/16/24px. Radius: 12px controls, 14–16px cards, 20px dialogs.

## Layout and interactions

- One viewport with header, title, flexible internally scrolling content, persistent primary action and three-item bottom navigation. Allow internal scrolling rather than shrinking text.
- Roster grouped by Level 1–5; 2/3/4 columns at phone/600px/900px. Whole player tile opens an action dialog.
- Prefer 44px touch controls; 48px primary actions. Selected, disabled, hover and pressed states must be visible without changing layout.
- Native dialog for focus containment and Escape; labeled fields and controls. Keep success feedback visible above the dialog layer.
- Team selection uses a green fieldset for Team A and blue for Team B, with explicit team legends. Show the selected name first, then Level and games below; retain native select controls for mobile and keyboard support.
- Normal text contrast target 4.5:1. Do not convey skill or selected state only through color.
- Honor reduced motion; no new runtime dependencies or remote fonts.

## Verified skill searches

- `activity management dashboard --design-system --density 8`: Flat Design, teal palette, compact spacing. Applied style; adapted palette and font to the user's requirements.
- `touch target size --domain ux`: touch comfort and web target sizing. Applied generous tap areas without conflating native points and CSS pixels.
- `dialogs --stack react`: focus containment and return on close. Preserve native dialog behavior.
