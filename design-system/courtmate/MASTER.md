# CourtMate UI system

Applied using [UI/UX Pro Max](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill).

## Direction

Compact mobile activity tool for friends organizing badminton. Follow the user's illustrated sports reference: luminous sky blue, royal blue primary actions, friendly badminton artwork, white rounded cards, navy Thai text and mint courts. Apply UI/UX Pro Max's vibrant direction with restrained shadows and clear hierarchy. Retain the three-step workspace and bundled IBM Plex Sans Thai.

## Tokens

- Canvas: `#f5faff`; surface: white; ink: `#111b38`; secondary text: `#5c6c8d`.
- Primary gradient: `#0874d5` to `#0055ee` with white text; mint court accents and pastel blue/green/purple feature tiles.
- Borders: `#dce8f9`; soft selected surface: `#eaf4ff`.
- Text: 16px inputs, 14px content, 12px metadata. Small English decorative labels may use 10px. Keep Thai line-height generous.
- Spacing: 4/8/12/16/24px. Radius: 14px inputs, 18–24px cards, 26px dialogs, pill primary buttons.

## Layout and interactions

- One viewport with header, title, flexible internally scrolling content, persistent primary action and three-item bottom navigation. Allow internal scrolling rather than shrinking text.
- Roster grouped by Level 1–5; 2/3/4 columns at phone/600px/900px. Whole player tile opens an action dialog.
- Add-player dialog offers single or bulk entry. Bulk names accept lines/commas with a shared starting Level, visible validation/count and explicit confirmation; no partial batch on errors. Keep success feedback in the dialog. Hide install actions in both header and account panel when running as an installed app.
- Player icon picker: 12 local SVG presets, native radio group with visible focus, selected border and checkmark, minimum 44px targets. Four columns on narrow phones, six from 360px. Keep choices in session memory and reuse each player's selected icon across roster, court and on-screen billing table.
- Prefer 44px touch controls; 48px primary actions. Selected, disabled, hover and pressed states must be visible without changing layout.
- Native dialog for focus containment and Escape; labeled fields and controls. Keep success feedback visible above the dialog layer.
- Team A uses blue and Team B mint, with explicit team legends. Show the selected name first, then Level and games below; retain native select controls for mobile and keyboard support.
- Large welcoming artwork is reserved for the empty state. Use short scene strips during play, hide them on short phones, and retain internally scrolling player/history/billing lists.
- Normal text contrast target 4.5:1. Do not convey skill or selected state only through color.
- Cloud account and read-only invitations use the same native dialog and blue/mint visual language. Save explicitly; show success, pending edits, load failures and conflict feedback. Explain invitation visibility before creating a link. LINE sharing is initiated and sent by the user, with a copy fallback on desktop.
- Google sign-in uses the official color mark on a white outlined 48px button, with a persistent readiness/error explanation. Email fallback is collapsed. Explain tab-scoped temporary draft restoration before redirecting; restored drafts still require explicit cloud Save. Keep the layout usable at 320px without horizontal scrolling.
- Honor reduced motion and keep fonts bundled. Supabase is the sole cloud runtime dependency.

## Verified skill searches

- `activity management dashboard --design-system --density 8`: Flat Design, teal palette, compact spacing. Applied style; adapted palette and font to the user's requirements.
- `touch target size --domain ux`: touch comfort and web target sizing. Applied generous tap areas without conflating native points and CSS pixels.
- `dialogs --stack react`: focus containment and return on close. Preserve native dialog behavior.
- `playful sports mobile blue --design-system --density 8`: vibrant block styling. Adapt to the user's blue illustrated reference, Thai typography and compact utility layout.
