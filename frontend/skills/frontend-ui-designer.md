---
name: frontend-ui-designer
description: Design and build polished frontend UI for BiteDiary and web apps. Use when the user asks to build, redesign, improve, polish, style, or create frontend pages, components, layouts, dashboards, forms, mobile screens, dark premium restaurant diary UI, or design systems. Do not use for backend-only tasks.
---

# Frontend UI Designer Skill

## Goal

Build frontend UI that feels like a professional product designer made it in Figma: mobile-first, responsive, accessible, production-ready, and visually polished.

## Project Inspection

Before coding:

1. Inspect the existing framework, routes, styling system, and components.
2. Reuse existing Next.js App Router, TypeScript, Tailwind CSS, React Hook Form, Zod, and lucide-react patterns.
3. Do not install a new UI library unless the user explicitly asks.
4. Keep design tokens in `frontend/app/globals.css` and `frontend/tailwind.config.ts`; do not scatter ad-hoc hex values through components.

## BiteDiary Visual Direction

BiteDiary is a personal restaurant and dish history app. The current visual language is dark premium, image-forward, and mobile-first.

Use:

- Near-black/charcoal page backgrounds.
- Warm ivory primary text.
- Muted gold accents for active states, primary CTAs, ratings emphasis, and the raised Add action.
- Muted green for revisit, reorder, saved, and positive insight states.
- Warm low-contrast borders and subtle dark elevation.
- Serif display type for restaurant names, dish names, hero numbers, and screen titles.
- Clean sans UI type for metadata, labels, body copy, buttons, and navigation.
- Real restaurant/dish photography for primary cards whenever mock data implies visual content.

Avoid:

- Light theme drift.
- Generic gray/blue SaaS UI.
- Cartoon/playful styling.
- Large tables on mobile.
- In-app explanatory text describing the UI.

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

## Layout Rules

- Design mobile first around a 390px baseline.
- Use 16px mobile padding, 24px tablet padding, and 32px desktop padding.
- Use a floating fixed mobile bottom nav with Home, Restaurants, Add, Analytics, Profile.
- Keep the Add action visually distinct as a raised circular gold button.
- Keep bottom nav visible during vertical scroll and padded above safe areas/home indicators.
- Convert bottom nav to a desktop sidebar at large breakpoints without changing information architecture.
- Prevent horizontal page scroll. Use `overflow-x-hidden`, `min-w-0`, responsive grid tracks, and contained SVG/chart dimensions.
- Do not let desktop breakpoints trigger a layout wider than the content area left after the sidebar.

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
- Analytics/insight tiles

Do not duplicate major UI logic across pages. Reuse card anatomy, rating display, image treatment, empty/loading/error states, and nav behavior.

## Core Patterns

Restaurant cards:

- Photo-first.
- Serif restaurant name.
- City/state/country with pin icon.
- Cuisine/revisit tag.
- Rating stars or one consistent rating badge pattern.
- Favorite dish and visit/revisit detail.

Dish cards:

- Photo-first.
- Dish name in serif.
- Parent restaurant as secondary caption.
- Rating and reorder/would-eat-again state.

Analytics tiles:

- Big serif value/name.
- Small uppercase label.
- Gold or green visual cue.
- Insight text should be short and actionable.

Forms:

- Short, grouped fields.
- Labels on every input.
- Inline validation messages.
- Loading, success, and error states.

## Accessibility

- Use semantic HTML.
- Buttons need clear labels.
- Inputs need labels.
- Maintain contrast on dark surfaces.
- Preserve keyboard focus states.
- Make thumb targets at least 44px where practical.

## States

Every list/dashboard-style page should include:

- Loading skeletons matching the final card shape.
- Empty state with a clear next action.
- Error state with restrained error color and retry action.
- Hover/focus states for interactive cards, chips, nav, and buttons.

## Guardrails

- No pure black or pure white as primary surfaces/text.
- No random colors outside tokens.
- No mixed icon sets.
- No unnecessary visual noise.
- No mobile tables.
- No horizontal scroll.
- No bottom nav that disappears behind content or device safe areas.
- No desktop top nav replacing the mobile IA; use sidebar.

## Finish Checklist

Before handoff:

1. Check mobile layout first.
2. Check desktop reflow.
3. Check empty, loading, and error states.
4. Check spacing consistency.
5. Check CTA clarity.
6. Check for horizontal scroll.
7. Check bottom nav stays visible while scrolling.
8. Run typecheck/build when available.
