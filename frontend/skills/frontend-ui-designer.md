---
name: frontend-ui-designer
description: Design and build polished frontend UI for BiteDiary and web apps. Use when the user asks to build, redesign, improve, polish, style, or create frontend pages, components, layouts, dashboards, forms, mobile screens, dark premium restaurant diary UI, or design systems. Do not use for backend-only tasks.
---

# Frontend UI Designer Skill

## Goal

Build frontend UI that feels like a professional product designer made it in Figma: mobile-first, responsive, accessible, production-ready, and visually polished.

The UI should feel premium, calm, intentional, and useful. For BiteDiary, the product should feel like a high-end personal food journal, not a generic CRUD dashboard.

## Project Inspection

Before coding:

1. Inspect the existing framework, routes, styling system, and components.
2. Reuse existing Next.js App Router, TypeScript, Tailwind CSS, React Hook Form, Zod, and lucide-react patterns.
3. Do not install a new UI library unless the user explicitly asks.
4. Keep design tokens in `frontend/app/globals.css` and `frontend/tailwind.config.ts`; do not scatter ad-hoc hex values through components.
5. Reuse existing components and patterns before creating new ones.
6. Check the current page visually and improve the design without breaking existing data or behavior.

## BiteDiary Visual Direction

BiteDiary is a personal restaurant and dish memory app. The visual language is dark, warm, premium, editorial, image-forward, and mobile-first.

The UI should feel like a premium food journal, not a SaaS admin dashboard.

Use:

- Near-black/charcoal page backgrounds, never flat pure black.
- Warm ivory primary text, never pure white.
- Muted gold accents for active states, premium CTAs, ratings emphasis, and primary actions.
- Muted green for revisit, reorder, saved, and positive insight states.
- Restrained red for destructive actions.
- Warm low-contrast borders and subtle dark elevation.
- High-quality restaurant/dish imagery when available.
- Strong dark gradient overlays on images so text remains readable.
- Editorial spacing: clean sections, thin dividers, fewer boxed cards.
- Premium typography with clear hierarchy.
- Compact metadata chips instead of large metadata cards.

Typography:

- Use a premium font pairing.
- Use a serif display font only for emotional/display text:
  - restaurant names
  - dish names
  - major editorial insight headlines
  - large hero values in analytics
- Use a clean sans font for:
  - labels
  - metadata
  - buttons
  - chips
  - body text
  - navigation
  - form fields
  - dates in normal metadata rows
- Do not use serif fonts for every heading or every date.
- Avoid overusing bold. Use size, spacing, color, and hierarchy instead.

Avoid:

- Light theme drift.
- Generic gray/blue SaaS UI.
- Cartoon/playful styling.
- Large tables on mobile.
- Too many bordered cards.
- Every section looking like a separate card.
- Admin-dashboard style layouts.
- In-app explanatory text describing the UI.
- Random centered text.
- Overly tall rows with too much empty space.

## Font Guidance

For Next.js projects, prefer `next/font/google`.

Recommended BiteDiary pairing:

- Display font: `Cormorant Garamond`, `Playfair Display`, or `Libre Baskerville`
- UI/body font: `Inter`, `Manrope`, or `Geist Sans`

Use display font sparingly. It should create premium emotion, not reduce readability.

Suggested usage:

- Restaurant name: display serif
- Dish name: display serif
- Insight headline: display serif
- Analytics hero number/name: display serif
- Labels: sans
- Buttons: sans
- Chips: sans
- Forms: sans
- Body text: sans
- Metadata rows: sans
- Navigation: sans

Display heading style:

- `font-weight: 700`
- `letter-spacing: -0.02em`
- `line-height: 0.95` to `1.05`
- warm ivory color, not pure white

Body/UI text style:

- clean sans font
- `line-height: 1.45` to `1.6`
- muted colors for secondary text
- avoid unnecessary bold text

## Decision-Focused UX

Prioritize what the user should do next:

- Best restaurant.
- Best dish.
- Restaurants worth revisiting.
- Dishes worth reordering.
- Top cuisine/city/day.
- Rating trend and visit patterns.
- Fast add/log actions.

Keep quick stats secondary unless they directly support a decision.

Every important screen should answer:

- What did I love here?
- Should I go again?
- What should I order again?
- What should I avoid?
- What is the next useful action?

## Design Tokens

Use these roles consistently:

- `bg`: `#100F0D` - warm near-black page background.
- `surface`: `#1B1816` - elevated dark card/nav surface.
- `surface-sunken`: `#24201B` - input and inactive fills.
- `ink-primary`: `#F6EDDE` - warm ivory primary text.
- `ink-secondary`: `#B8AA98` - metadata and secondary text.
- `ink-tertiary`: `#7B7064` - placeholder and disabled text.
- `accent`: `#D19A52` - premium gold CTA/active accent.
- `accent-hover`: `#E4B264`.
- `accent-soft`: `rgba(209, 154, 82, 0.16)` - selected chips and soft gold panels.
- `rating-gold`: `#F4A51C` - star ratings only.
- `success`: `#67A36B` - revisit/reorder/saved states.
- `error`: `#E36C61` - restrained error state.
- `border`: `#40372D` - warm dark borders.

Use exactly the app's existing radius and shadow scale:

- Cards: `rounded-card`.
- Controls/chips: `rounded-control` or full pill.
- Thumbnails: `rounded-avatar`.
- Elevation: `shadow-card` and `shadow-raised`.

Do not create random new colors unless absolutely necessary. If a new token is needed, add it to the token system first.

## Premium Minimalism Rules

Prefer fewer, better-composed surfaces.

- Do not wrap every piece of information in its own card.
- Use one clean section with rows instead of many repeated cards.
- Prefer thin dividers, aligned rows, and whitespace over heavy borders.
- Use cards only when the content is a meaningful grouped unit.
- Make the main action visually clear, but keep secondary actions quiet.
- Keep borders low contrast: they should define structure, not dominate the screen.
- Use glow effects rarely and subtly.
- Keep icons muted unless they represent an important action or status.
- Make the UI feel calm, warm, and intentional.
- Reduce visual noise wherever possible.
- Do not make the UI look like an admin settings page.
- Use editorial hierarchy: strong title, quiet metadata, clear action.

The result should feel like:

- premium restaurant journal
- editorial food diary
- high-end mobile app

Not:

- admin dashboard
- settings page
- generic CRUD app
- card-heavy SaaS page

## Layout Rules

- Design mobile first around a 390px baseline.
- Use 20px mobile padding for premium detail pages.
- Use 24px tablet padding and 32px desktop padding.
- Keep mobile content visually centered and constrained.
- On large screens, use a desktop sidebar instead of a mobile bottom nav.
- Mobile list/dashboard pages may use a floating fixed bottom nav with Home, Restaurants, Add, Analytics, Profile.
- Detail pages may avoid bottom nav if it distracts from the content, but navigation must remain clear.
- Keep the Add action visually distinct as a raised circular gold button where bottom nav exists.
- Prevent horizontal page scroll using `overflow-x-hidden`, `min-w-0`, responsive grid tracks, and contained SVG/chart dimensions.
- Do not let desktop breakpoints create overly wide text lines.
- Use section gaps around 28px to 36px.
- Use consistent x-alignment across section headings, rows, buttons, and content.
- Do not simply stretch mobile layouts on desktop.
- Desktop layouts should feel intentionally composed.

## Restaurant Detail Page Pattern

For restaurant detail pages, use this structure.

### Mobile

1. Hero image section

- Full-width image at the top.
- Height around 270px to 310px.
- Strong dark gradient overlay.
- Back and menu actions over the image.
- Restaurant name near the bottom.
- Compact metadata chips below the name:
  - cuisine
  - location
  - rating

2. Info section

- Do not create separate cards for visited, cuisine, address, city, and notes.
- Use one clean `INFO` section.
- Section title should be uppercase, small, amber, and letter-spaced.
- Each item should be a compact row:
  - left: icon + label
  - right: value
- Use thin dividers between rows.
- Values should align consistently.
- Labels should be muted.
- Values should be warm ivory and slightly stronger.
- Row height should feel compact, around 58px to 68px.
- Icons should be muted beige/gray, not bright gold everywhere.
- Do not stack label and value vertically unless the value is very long.
- Long notes can wrap, but alignment should stay clean.

3. Primary action

- Place `Log revisit` directly after the info section.
- Full-width button.
- Soft green border and transparent green background.
- Height around 54px to 56px.
- Rounded but not oversized.
- Icon and text should be centered and aligned.

4. Visit history

- Use a minimal timeline style.
- Avoid heavy nested cards.
- Show visit date, notes, rating, price, and dish tags if available.
- Use small pills for rating, price, and tags.
- Keep spacing airy but compact.
- Section header can have a small `Revisit` action on the right.

5. Insight / next best action

- Make this section feel editorial.
- Use serif only for the main insight headline.
- Use a muted icon and short supporting text.
- Avoid heavy card styling unless needed.
- The section should help the user decide what to do next.

6. Actions

- Edit restaurant is the main amber button.
- Delete restaurant is secondary/destructive with red border or red text.
- Do not make delete visually heavier than edit.
- Button height should be around 52px to 56px.

7. Record

- Keep compact at the bottom.
- Use simple rows:
  - Created
  - Updated
  - Owner link
- Avoid a large heavy card unless the rest of the page requires it.

### Desktop

- Convert mobile layout into a composed desktop layout.
- Use a max content width around 1120px to 1200px.
- Keep a sidebar navigation on desktop.
- Top area can use a wide hero/details split.
- Put visit history in the main column.
- Put insight, actions, and record in a right sidebar.
- Do not simply stretch the mobile screen full width.
- Preserve the same typography, spacing, and visual hierarchy.
- Keep line lengths comfortable.
- Desktop should feel like the mobile experience expanded, not a separate product.

## Detail Page Alignment Rules

Fix alignment carefully:

- All section headings should start at the same x-position.
- All info rows should have the same icon column width.
- All values in the info section should align to the right.
- Do not randomly center text.
- Use consistent dividers.
- Keep labels smaller and muted.
- Make only important values bright.
- Use serif font only for restaurant name and editorial headings, not for every date/value.
- Icons, labels, values, and buttons should visually line up.
- Avoid oversized empty vertical spacing inside rows.
- Do not let one row look taller unless the content needs it.

## Component Rules

Create or reuse small readable components:

- `RestaurantCard`
- `DishCard`
- `RatingStars`
- `EmptyState`
- `PageHeader`
- `BottomNav`
- `StatCard`
- `FilterSheet`
- `MetadataChip`
- `DetailHero`
- `InfoRows`
- `VisitTimeline`
- `InsightPanel`
- `RecordRows`
- `ActionButtons`
- Analytics/insight tiles

Do not duplicate major UI logic across pages. Reuse card anatomy, rating display, image treatment, empty/loading/error states, and nav behavior.

For detail pages, prefer reusable row-based components over repeated card components.

## Core Patterns

### Restaurant cards

- Photo-first.
- Serif restaurant name.
- City/state/country with pin icon.
- Cuisine/revisit tag.
- Rating stars or one consistent rating badge pattern.
- Favorite dish and visit/revisit detail.
- Avoid too much text inside the card.

### Dish cards

- Photo-first.
- Dish name in serif.
- Parent restaurant as secondary caption.
- Rating and reorder/would-eat-again state.
- Use compact tags for cuisine/type if needed.

### Analytics tiles

- Big serif value/name.
- Small uppercase label.
- Gold or green visual cue.
- Insight text should be short and actionable.
- Avoid chart clutter on mobile.

### Forms

- Short, grouped fields.
- Labels on every input.
- Inline validation messages.
- Loading, success, and error states.
- Use clear primary and secondary actions.
- Keep form surfaces calm and readable.

## Accessibility

- Use semantic HTML.
- Buttons need clear labels.
- Inputs need labels.
- Maintain contrast on dark surfaces.
- Preserve keyboard focus states.
- Make thumb targets at least 44px where practical.
- Do not rely on color alone for important states.
- Ensure icons have accessible labels or are hidden if decorative.
- Keep text readable over image backgrounds with gradients.

## States

Every list/dashboard-style page should include:

- Loading skeletons matching the final card shape.
- Empty state with a clear next action.
- Error state with restrained error color and retry action.
- Hover/focus states for interactive cards, chips, nav, and buttons.

Detail pages should include graceful handling for:

- Missing cuisine.
- Missing location.
- Missing address.
- Missing notes.
- No visit history.
- No saved dishes.
- No image.
- Not rated state.

Empty states should feel helpful, not noisy.

## Responsive Behavior

Mobile:

- Prioritize single-column layout.
- Keep actions easy to tap.
- Avoid dense dashboards.
- Use image-led hierarchy.
- Keep sections compact and readable.

Tablet:

- Slightly increase padding.
- Avoid awkward half-desktop layouts.
- Use max-width constraints.

Desktop:

- Use sidebar navigation.
- Use composed two-column layouts where useful.
- Keep main content width controlled.
- Avoid stretching cards across the entire viewport.
- Preserve the same visual language as mobile.

## Guardrails

- No pure black or pure white as primary surfaces/text.
- No random colors outside tokens.
- No mixed icon sets.
- No unnecessary visual noise.
- No mobile tables.
- No horizontal scroll.
- No bottom nav that disappears behind content or device safe areas.
- No desktop top nav replacing the mobile IA; use sidebar.
- No card for every metadata field.
- No stacked label/value layout when a clean row layout would work better.
- No serif font for ordinary UI labels, buttons, chips, or metadata.
- No oversized empty vertical spacing inside rows.
- No randomly centered text.
- No misaligned icons or values.
- No heavy borders around every section.
- No dev overlays or debug bubbles visible in the final UI.
- No generic SaaS dashboard feel.
- No excessive shadows or glows.
- No large explanatory text blocks unless they help the user act.

## Finish Checklist

Before handoff:

1. Check mobile layout first.
2. Check desktop reflow.
3. Check empty, loading, and error states.
4. Check spacing consistency.
5. Check CTA clarity.
6. Check typography hierarchy.
7. Check icon, label, and value alignment.
8. Check that serif fonts are used sparingly.
9. Check for horizontal scroll.
10. Check bottom nav stays visible while scrolling where used.
11. Check that metadata is not split into too many cards.
12. Check that the page feels like a premium food diary, not an admin dashboard.
13. Run typecheck/build when available.
