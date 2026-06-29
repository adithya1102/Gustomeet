---
name: Lush Veranda Nocturnal
colors:
  surface: '#0e1511'
  surface-dim: '#0e1511'
  surface-bright: '#343b36'
  surface-container-lowest: '#09100c'
  surface-container-low: '#161d19'
  surface-container: '#1a211d'
  surface-container-high: '#242c27'
  surface-container-highest: '#2f3632'
  on-surface: '#dde4dd'
  on-surface-variant: '#bbcabf'
  inverse-surface: '#dde4dd'
  inverse-on-surface: '#2b322d'
  outline: '#86948a'
  outline-variant: '#3c4a42'
  surface-tint: '#4edea3'
  primary: '#4edea3'
  on-primary: '#003824'
  primary-container: '#10b981'
  on-primary-container: '#00422b'
  inverse-primary: '#006c49'
  secondary: '#d2bbff'
  on-secondary: '#3f008e'
  secondary-container: '#6001d1'
  on-secondary-container: '#c9aeff'
  tertiary: '#ffb3af'
  on-tertiary: '#650911'
  tertiary-container: '#fc7c78'
  on-tertiary-container: '#711419'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#6ffbbe'
  primary-fixed-dim: '#4edea3'
  on-primary-fixed: '#002113'
  on-primary-fixed-variant: '#005236'
  secondary-fixed: '#eaddff'
  secondary-fixed-dim: '#d2bbff'
  on-secondary-fixed: '#25005a'
  on-secondary-fixed-variant: '#5a00c6'
  tertiary-fixed: '#ffdad7'
  tertiary-fixed-dim: '#ffb3af'
  on-tertiary-fixed: '#410005'
  on-tertiary-fixed-variant: '#842225'
  background: '#0e1511'
  on-background: '#dde4dd'
  surface-variant: '#2f3632'
typography:
  display-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  label-sm:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  xs: 8px
  sm: 16px
  md: 24px
  lg: 40px
  xl: 64px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 48px
---

## Brand & Style

The design system is a high-contrast, dark-mode evolution of a lush, garden-inspired aesthetic. It targets a premium, tech-forward audience that values deep focus and visual clarity. The emotional response is one of nocturnal sophistication—calm, professional, yet vibrant where it matters.

The style is **High-Contrast / Modern**, utilizing deep slate backgrounds to make emerald and violet accents pop. It balances the organic softness of rounded corners with the rigorous precision of a structured grid, ensuring that "Gusto Meets" feels both welcoming and highly efficient.

## Colors

The palette is anchored in a deep midnight navy-gray to reduce eye strain while maintaining maximum legibility. 

- **Primary Green (#10B981):** Reserved for high-priority calls to action, success states, and active indicators. It provides a "lush" organic feel against the dark canvas.
- **Secondary Purple (#7C3AED):** Used for interactive secondary elements, selection states, and brand highlights.
- **Neutrals:** The background uses a solid dark slate. Surfaces use two levels of elevation: a base surface for primary content containers and an alternate surface for borders, dividers, and inactive states.

## Typography

This design system utilizes a dual-font strategy to balance personality with utility.

- **Plus Jakarta Sans:** Used for all headings and display text. Its soft, modern curves provide the "Veranda" personality.
- **Inter:** Used for all body copy, inputs, and UI labels. It ensures perfect readability and a systematic, clean appearance in data-heavy views.

For dark mode, font weights are slightly boosted (Medium instead of Regular) where necessary to compensate for the "thinning" effect of light text on dark backgrounds.

## Layout & Spacing

The layout follows a **Fluid Grid** model with high internal padding to maintain the "airy" feel of the original design system despite the darker tones.

- **Desktop:** 12-column grid with 24px gutters.
- **Tablet:** 8-column grid with 20px gutters.
- **Mobile:** 4-column grid with 16px gutters.

Spacing follows a strict 4px/8px baseline rhythm. Large sections should be separated by `lg` (40px) or `xl` (64px) units to ensure the UI feels uncluttered and high-end.

## Elevation & Depth

In this high-contrast dark environment, depth is achieved through **Tonal Layers** rather than heavy shadows.

- **Level 0 (Base):** #111827. The main canvas.
- **Level 1 (Cards/Panels):** #1F2937. Used for the primary content area.
- **Level 2 (Modals/Overlays):** #374151. Used for elements that sit on top of Level 1.
- **Outlines:** Every surface at Level 1 or higher must have a 1px solid border (#374151) to define its shape against the dark background. 
- **Shadows:** Use extremely subtle, large-radius black shadows (0px 10px 30px rgba(0,0,0,0.5)) only on Level 2 elements to provide a slight lift.

## Shapes

The design system maintains a generous, friendly shape language.

- **Standard Elements:** Buttons and small inputs use a `0.5rem` (8px) radius.
- **Large Containers:** Cards and main content sections use a `1rem` (16px) radius to maintain the established visual identity.
- **Interactive States:** Hovering over list items or menu options should trigger a `0.5rem` rounded background highlight.

## Components

### Buttons
- **Primary:** Background #10B981, Text #111827 (Dark text on light green for maximum contrast). 16px corner radius.
- **Secondary:** Border 1px #7C3AED, Text #7C3AED, Background transparent.
- **Ghost:** Text #F9FAFB, no background.

### Cards
- Background: #1F2937.
- Border: 1px #374151.
- Corner Radius: 16px.
- Padding: 24px.

### Input Fields
- Background: #111827 (Inverted from the card surface).
- Border: 1px #374151.
- Focus State: Border 1px #10B981 with a subtle green outer glow.

### Chips & Badges
- **Status:** Background #10B981 at 10% opacity, Text #10B981.
- **Category:** Background #7C3AED at 10% opacity, Text #7C3AED.

### Lists
- Separators use 1px solid #374151.
- Active items use a subtle #1F2937 background with a 4px Primary Green left-edge accent.