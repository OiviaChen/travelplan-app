# TN Travel Card Design System

## Product Direction

This app turns pasted travel notes into printable Traveler's Notebook route cards. The interface should feel like a calm travel-planning tool: practical, tactile, mobile-first, and print-aware.

The product is not a marketing site. The first screen should help the user make a route card, not explain the product with a hero section.

## Visual Principles

- Paper-first: use white, soft gray, and ink-like black as the main palette.
- Travel clarity: express selection, progress, and primary action states with black, white, and gray only.
- Print clarity: previews must look like physical cards with stable aspect ratios and clear safe margins.
- Quiet editing: route editing should feel organized and low-friction, with obvious selected states.
- Mobile-first: primary actions live near the bottom and touch targets should be large.
- No decorative gradients, floating orbs, oversized hero layouts, or generic SaaS dashboard styling.

## References

- Airbnb inspiration: warm travel tone, friendly spacing, simple consumer UI.
- Notion inspiration: quiet editor surfaces, document-like cards, restrained controls.
- Apple inspiration: clean preview presentation and confident whitespace.

Do not copy any external brand identity directly. These references are mood and interaction guidance only.

## Color Tokens

- `canvas`: `#ffffff` for the app shell and printable cards.
- `page`: `#f2f2f2` for browser background outside the app.
- `ink`: `#111111` for primary text and active progress.
- `body`: `#333333` for secondary readable text.
- `muted`: `#707070` for hints and metadata.
- `hairline`: `#dedede` for dividers and inactive progress.
- `border`: `#c8c8c8` for controls and card outlines.
- `surface`: `#f7f7f5` for soft editor panels.
- `accent`: `#111111` for selected items and primary emphasis.
- `accent-soft`: `#f2f2f2` for subtle selected backgrounds.

Keep the UI strictly neutral. All interface states should be expressed with black, white, and grays so the printable route card remains calm and readable.

## Typography

Use the existing system stack:

```css
Arial, "PingFang SC", "Microsoft YaHei", sans-serif
```

Type should be readable before it is expressive.

- Screen titles: 28-32px, 700 weight, 1.15-1.2 line height.
- Section titles: 20-24px, 700 weight.
- Route titles: 16-18px, 700 weight.
- Body text: 14-16px, 400-500 weight, 1.4-1.6 line height.
- Metadata and helper text: 12-14px, 400-500 weight.
- Printable card text may be bold when it improves legibility at small physical sizes.

Avoid negative letter spacing. Avoid viewport-scaled font sizes.

## Layout

- Keep the app shell full width and mobile-friendly.
- Use stable dimensions for previews, route rows, bottom bars, and printable card stages.
- Preserve safe-area padding for mobile devices.
- Keep bottom action bars fixed and predictable.
- Do not nest cards inside cards.
- Use full-width sections or simple panels for workflow surfaces.
- Route editing can use a wider desktop layout with the route list and preview side by side.

## Components

### Header

- Back button is a circular icon control.
- Progress segments are simple bars, not decorative steps.
- Header spacing should remain consistent across screens.

### Purpose and Template Cards

- Cards are selectable list items, not marketing tiles.
- Use clear title, short subtitle, and a compact selection marker.
- Disabled states should be visibly muted and non-interactive.

### Route List

- Each route row should clearly separate time/label from route content.
- Empty route fields should remain discoverable in edit mode.
- Selected rows need a strong but calm visual state.
- Drag and reorder states should not resize the row.

### Editor Panels

- Inputs and textareas should feel like direct editing surfaces.
- Labels should be short and utilitarian.
- Preserve enough spacing for touch editing on mobile.

### Printable Small Card

- The route card is the hero object of the app.
- Keep a stable physical-card aspect and strong print contrast.
- Use simple dividers between title, route, and metadata.
- Avoid shadows or effects that would confuse print output.
- Text should never overflow the printable card.

### Timeline Sticker

- Preserve the selected TN size ratio.
- The timeline should be scannable at small printed sizes.
- Use line, dot, and label structure rather than decorative timeline art.

### Buttons

- Primary buttons are high-contrast and easy to tap.
- Secondary actions are quieter but still clearly interactive.
- Use disabled states instead of hiding expected actions.

## Responsive Behavior

- Mobile: single-column workflow, bottom action bar, route edit bottom sheet.
- Tablet/Desktop: route editor can expand into a workbench with side preview.
- Printable previews must remain centered and fully visible at common viewport sizes.
- No text should overlap controls or overflow buttons.

## Do

- Make route creation feel quick and calm.
- Prioritize legibility for Chinese route text.
- Keep print preview accurate and uncluttered.
- Reuse existing CSS patterns before creating new abstractions.
- Test important visual changes at mobile and desktop sizes.

## Don't

- Do not make a landing page.
- Do not use dark-mode-first styling.
- Do not add stock travel imagery unless the user explicitly asks for it.
- Do not introduce heavy brand colors across the whole interface.
- Do not add decorative gradients, blobs, or oversized illustration panels.
- Do not make printable output depend on browser-only visual effects.
