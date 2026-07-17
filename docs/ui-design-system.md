# UI Design System

## Visual Language

- Premium light wellness theme only.
- Warm ivory background, soft white/cream cards, deep navy typography, muted gold accents.
- Subtle lotus/mandala watermark only; no fantasy backgrounds, dark mystical theme, excessive glow, or clutter.
- Cards are left-aligned with calm spacing and large readable text.
- Minimum button height is 52px.
- Maximum two actions per card.

## Typography

- Headings: Georgia/Cambria-style elegant serif.
- Body: clean system sans-serif.
- Letter spacing stays at 0.

## Components

Mobile components live in `apps/mobile/src/components/Sacred.tsx`:

- `LightScreen`
- `PlainScreen`
- `LogoMark`
- `AppHeader`
- `PremiumCard`
- `PrimaryButton`
- `SecondaryButton`
- `TextField`
- `StatusBadge`
- `EmptyState`
- `LoadingState`

Admin components live in `apps/admin/src/components`:

- `AdminLayout`
- `Dashboard`
- `CrudPage`
- `LoginPage`

## Usability Rule

Before accepting a screen, ask: can a 55-65 year old user understand this screen without explanation? If not, simplify it.
