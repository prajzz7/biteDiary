# UI/UX Skill: Visited Restaurants App

These instructions apply to frontend work in this workspace.

## Product goal

Users should quickly log restaurants and dishes they visited, rate them, and view their food history and analytics.

## Design style

- Mobile-first dark premium restaurant diary UI.
- Use near-black/charcoal backgrounds, warm ivory text, muted gold accents, and restrained green revisit/reorder states.
- Use image-forward restaurant and dish cards with soft rounded corners, subtle warm borders, and premium spacing.
- Avoid clutter. Prioritize fast decisions: best restaurant, best dish, revisit again, reorder again.

## Tech stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn/ui components if available
- React Hook Form + Zod for forms
- lucide-react for icons

## UX rules

- Every page must be responsive, but mobile layout is the priority.
- Important actions should be thumb-friendly.
- Primary CTA should be clearly visible.
- Forms should be short and grouped logically.
- Use loading, empty, error, and success states.
- Avoid large tables on mobile. Use cards/lists instead.
- Use bottom navigation on mobile for main sections.
- Prevent horizontal page scroll on mobile and desktop.
- Keep the mobile bottom navigation fixed/floating and visible while vertically scrolling.

## Core navigation

Mobile bottom tabs:

- Home
- Restaurants
- Add
- Analytics
- Profile

Desktop:

- Sidebar or top nav is acceptable.

## Main screens

1. Home dashboard
   - Greeting
   - Quick stats
   - Recently visited restaurants
   - Top dishes
   - Quick add button

2. Restaurants list
   - Search
   - City/cuisine/rating filters
   - Restaurant cards with name, cuisine, location, rating, visit date

3. Restaurant detail
   - Restaurant info
   - Dishes eaten
   - Notes
   - Visit history
   - Edit/delete actions

4. Add restaurant
   - Restaurant name
   - Cuisine
   - Location
   - Rating
   - Visited date
   - Notes
   - Add dishes section

5. Dish card
   - Dish name
   - Rating
   - Price optional
   - Notes
   - Would eat again

6. Analytics
   - Best restaurant
   - Best dish
   - Most visited cuisine
   - Most visited city
   - Monthly visits
   - Rating distribution

## Component rules

- Create reusable components:
  - RestaurantCard
  - DishCard
  - RatingStars
  - EmptyState
  - PageHeader
  - BottomNav
  - StatCard
  - FilterSheet
- Do not duplicate UI logic across pages.
- Keep components small and readable.

## Accessibility

- Use semantic HTML.
- Buttons must have clear labels.
- Inputs must have labels.
- Maintain good color contrast.
- Keyboard navigation should work.

## Visual quality checklist

Before finishing any UI task:

- Check mobile layout first.
- Check empty state.
- Check loading state.
- Check error state.
- Check spacing consistency.
- Check whether the CTA is obvious.
- Remove unnecessary visual noise.

## Conditional Project Skills

When the user asks for frontend UI design, redesign, visual polish, layout improvement, mobile UI, production-level UI, or web/app screen design, read and follow:

`frontend/skills/frontend-ui-designer.md`
