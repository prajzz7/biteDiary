# BiteDiary Development Roadmap

## Project Overview

BiteDiary is a full-stack restaurant history app where users can save restaurants they visited, rate them, add notes, track cities/cuisines, and later add dishes, visits, analytics, and sharing.

The app will be built phase by phase so that the backend, database, and frontend grow naturally without becoming too complex early.

---

# Phase 1: MVP 1 — Basic Restaurant History App

## Goal

Build the first working version of the app where a user can register, log in, and manage their own visited restaurants.

## Core Features

- User registration
- User login
- JWT-based authentication
- Add visited restaurant
- View all restaurants added by logged-in user
- View single restaurant details
- Edit restaurant
- Delete restaurant
- Basic filters/search
- Basic summary analytics

## Database Models

### User

Fields:

- id
- name
- email
- passwordHash
- createdAt
- updatedAt

Relations:

- One user has many restaurants

### Restaurant

Fields:

- id
- name
- cuisine
- city
- state
- country
- address
- notes
- rating
- visitedAt
- createdAt
- updatedAt
- userId

Relations:

- One restaurant belongs to one user

## Backend APIs

### Health

```txt
GET /api/health
```

### Auth

```txt
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/me
```

### Restaurants

```txt
POST   /api/restaurants
GET    /api/restaurants
GET    /api/restaurants/:restaurantId
PATCH  /api/restaurants/:restaurantId
DELETE /api/restaurants/:restaurantId
```

### Analytics

```txt
GET /api/analytics/summary
```

## Important Backend Rules

- Restaurant routes must be protected.
- User should not send `userId` from frontend.
- Backend should get `userId` from JWT using `req.user.id`.
- User A should not see, edit, or delete User B’s restaurants.
- Password should be stored as a hash, not plain text.

## Frontend Screens

- Login page
- Register page
- Dashboard page
- Restaurant list page
- Add restaurant page
- Restaurant detail page
- Edit restaurant page
- Basic analytics page

## Done Criteria

Phase 1 is complete when:

- User can register and login.
- JWT token is returned after login.
- Protected routes work with `Authorization: Bearer <token>`.
- User can create restaurants.
- User can only see their own restaurants.
- User can edit/delete only their own restaurants.
- Restaurant data is saved in PostgreSQL.
- Frontend can consume all MVP APIs.

---

# Phase 2: Better Restaurant History — Visits and Dishes

## Goal

Improve the data model so the app can track multiple visits to the same restaurant and dishes eaten during each visit.

In Phase 1, restaurant and visit data are combined in one `Restaurant` table. In Phase 2, we separate them properly.

## Why This Phase Is Needed

A user may visit the same restaurant multiple times.

Example:

```txt
Restaurant: Vinayak Family Restaurant

Visit 1:
- Date: June 2026
- Rating: 5
- Notes: Great fish thali

Visit 2:
- Date: July 2026
- Rating: 4
- Notes: Food good, service slow
```

This is better handled using a separate `RestaurantVisit` table.

## New/Updated Models

### Restaurant

Restaurant becomes the place information.

Fields:

- id
- name
- cuisine
- city
- state
- country
- address
- createdAt
- updatedAt
- userId

### RestaurantVisit

Visit becomes the history entry.

Fields:

- id
- visitedAt
- rating
- notes
- occasion
- createdAt
- updatedAt
- userId
- restaurantId

### Dish

Fields:

- id
- name
- description
- restaurantId
- createdAt
- updatedAt

### DishReview

Fields:

- id
- rating
- notes
- price
- visitId
- dishId
- createdAt
- updatedAt

## Backend APIs

### Visits

```txt
POST   /api/restaurants/:restaurantId/visits
GET    /api/restaurants/:restaurantId/visits
GET    /api/visits/:visitId
PATCH  /api/visits/:visitId
DELETE /api/visits/:visitId
```

### Dishes

```txt
POST   /api/restaurants/:restaurantId/dishes
GET    /api/restaurants/:restaurantId/dishes
PATCH  /api/dishes/:dishId
DELETE /api/dishes/:dishId
```

### Dish Reviews

```txt
POST   /api/visits/:visitId/dish-reviews
PATCH  /api/dish-reviews/:dishReviewId
DELETE /api/dish-reviews/:dishReviewId
```

## Frontend Screens

- Restaurant timeline page
- Add visit page
- Visit detail page
- Add dish page
- Add dish review page
- Dish detail page

## Done Criteria

Phase 2 is complete when:

- User can add multiple visits to the same restaurant.
- User can add dishes to a restaurant.
- User can rate dishes per visit.
- Restaurant rating and visit rating are separated.
- Analytics can use visits and dishes.

---

# Phase 3: Analytics and Insights

## Goal

Add meaningful analytics so the user can understand their food history.

## Analytics Features

- Total restaurants visited
- Total visits
- Average restaurant rating
- Top-rated restaurants
- Most visited restaurants
- Best-rated dishes
- Most eaten dishes
- Restaurants by city
- Restaurants by cuisine
- Monthly visits
- Recent visits
- Highest-rated cities/cuisines

## Backend APIs

```txt
GET /api/analytics/summary
GET /api/analytics/top-restaurants
GET /api/analytics/top-dishes
GET /api/analytics/most-visited-restaurants
GET /api/analytics/by-city
GET /api/analytics/by-cuisine
GET /api/analytics/monthly-visits
```

## Frontend Screens

- Analytics dashboard
- Top restaurants section
- Top dishes section
- City/cuisine charts
- Monthly visit chart

## Done Criteria

Phase 3 is complete when:

- Dashboard shows useful numbers.
- User can see best restaurants and dishes.
- User can see most visited places.
- User can filter analytics by city, cuisine, and date range.

---

# Phase 4: Sharing With Partners

## Goal

Allow users to share their restaurant history with partners/friends.

## Example Use Case

Prajwal shares his food history with a partner so they can view his restaurants, dishes, and analytics.

## New Model

### SharedAccess

Fields:

- id
- ownerId
- sharedWithEmail
- sharedWithUserId
- permission
- status
- createdAt
- updatedAt

Possible permissions:

```txt
VIEW_ONLY
```

Possible statuses:

```txt
PENDING
ACCEPTED
REVOKED
```

## Backend APIs

```txt
POST   /api/sharing/invite
GET    /api/sharing/shared-with-me
GET    /api/sharing/my-shares
PATCH  /api/sharing/:shareId/accept
DELETE /api/sharing/:shareId
```

## Frontend Screens

- Share history page
- Shared with me page
- Partner view page
- Manage shared access page

## Done Criteria

Phase 4 is complete when:

- User can invite another user by email.
- Shared user can view owner’s history.
- Shared user cannot edit owner’s data.
- Owner can revoke access.

---

# Phase 5: Google Login and Better Auth

## Goal

Improve authentication and make login easier.

## Features

- Google login
- Account linking
- Better token handling
- Optional refresh tokens
- HTTP-only cookie auth
- Logout
- Session persistence

## Updated Auth APIs

```txt
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me
GET  /api/auth/google
GET  /api/auth/google/callback
```

## New/Updated Models

### User

Add fields:

- provider
- googleId
- avatarUrl

Optional:

### RefreshToken / Session

Fields:

- id
- userId
- tokenHash
- expiresAt
- createdAt

## Done Criteria

Phase 5 is complete when:

- User can login with Google.
- Existing email/password user can be linked safely.
- Auth works across page refresh.
- Logout works properly.

---

# Phase 6: Images and Media

## Goal

Allow users to upload photos of restaurants, dishes, bills, menus, or memories.

## Features

- Restaurant image
- Dish image
- Visit photos
- Optional bill image
- Cloud storage integration

## Possible Storage Options

- Cloudinary
- AWS S3
- Supabase Storage

## New Model

### Media

Fields:

- id
- url
- publicId
- type
- restaurantId
- visitId
- dishId
- userId
- createdAt

## Backend APIs

```txt
POST   /api/uploads
DELETE /api/uploads/:mediaId
```

## Done Criteria

Phase 6 is complete when:

- User can upload images.
- Images are linked to restaurants, visits, or dishes.
- User can delete uploaded images.
- Images are shown in frontend.

---

# Phase 7: Location and Map Features

## Goal

Add location-based restaurant tracking.

## Features

- Latitude/longitude for restaurant
- Map view of visited restaurants
- Filter restaurants by city/country
- Nearby visited restaurants
- Location-based analytics

## Updated Restaurant Fields

- latitude
- longitude
- placeId
- mapUrl

## Possible Integrations

- Google Maps API
- Mapbox
- OpenStreetMap

## Frontend Screens

- Map view
- City explorer
- Country explorer
- Restaurant location picker

## Done Criteria

Phase 7 is complete when:

- User can save restaurant location.
- User can view visited places on a map.
- User can filter by location.
- Map UI works on mobile.

---

# Phase 8: Production Readiness

## Goal

Make the app more stable, secure, and production-ready.

## Backend Improvements

- Central error middleware
- Request validation using Zod
- Rate limiting
- Helmet security headers
- CORS configuration
- Logging
- Pagination
- Better query performance
- Database indexes
- Environment-based config
- API response standardization

## Frontend Improvements

- Error states
- Loading states
- Empty states
- Form validation
- Mobile-first polish
- Better navigation
- Protected routes
- Token expiry handling

## Testing

- Backend API testing
- Auth testing
- Restaurant CRUD testing
- Permission testing
- Frontend basic flow testing

## Done Criteria

Phase 8 is complete when:

- App handles errors gracefully.
- API responses are consistent.
- Basic security measures are added.
- App is ready for deployment.

---

# Phase 9: Deployment

## Goal

Deploy the full-stack app online.

## Possible Deployment Setup

### Frontend

- Vercel
- Netlify

### Backend

- Render
- Railway
- Fly.io
- VPS

### Database

- Neon PostgreSQL
- Supabase PostgreSQL
- Railway PostgreSQL

## Deployment Tasks

- Setup production database
- Add environment variables
- Run Prisma migrations in production
- Deploy backend
- Deploy frontend
- Configure CORS
- Test APIs from frontend
- Setup domain later if needed

## Done Criteria

Phase 9 is complete when:

- Frontend is live.
- Backend is live.
- PostgreSQL database is hosted.
- Login works in production.
- Restaurant CRUD works in production.

---

# Phase 10: Polish and Portfolio Preparation

## Goal

Make the project strong enough to show in interviews and GitHub.

## Tasks

- Write clean README
- Add screenshots
- Add API documentation
- Add architecture diagram
- Add database schema diagram
- Add setup instructions
- Add sample environment variables
- Add feature list
- Add future improvements
- Record short demo video
- Deploy live version

## README Sections

- Project overview
- Tech stack
- Features
- Screenshots
- Database design
- API routes
- Local setup
- Environment variables
- Future roadmap
- Learnings

## Done Criteria

Phase 10 is complete when:

- GitHub repo looks professional.
- README clearly explains the app.
- Live demo link works.
- Project can be discussed confidently in interviews.

---

# Final Phase Order

```txt
Phase 1: MVP 1 — Auth + Restaurant CRUD
Phase 2: Visits + Dishes
Phase 3: Analytics
Phase 4: Sharing with partners
Phase 5: Google login and better auth
Phase 6: Images and media
Phase 7: Location and map features
Phase 8: Production readiness
Phase 9: Deployment
Phase 10: Portfolio polish
```

---

# Current Focus

The current focus is Phase 1.

Do not jump to dishes, sharing, Google login, image upload, or deployment yet.

Current priority:

```txt
1. Finish restaurant CRUD
2. Add register/login
3. Add JWT middleware
4. Protect restaurant APIs
5. Add basic filters
6. Add basic analytics
```

Once Phase 1 is complete, the app will already be a usable MVP.
