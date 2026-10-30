# QueueNear progress

## Module checklist

- [x] 0. Verify setup: Django, PostgreSQL, migrations, health endpoint, React, Tailwind.
- [x] 1. Frontend pages using live shop data and a central API client.
- [x] 2. Models, admin, seed command, nearby search, opening status, wait estimate.
- [x] 3. Queue join, customer queue status/cancel, transaction lock, unique constraint.
- [x] 4. JWT roles, owner actions, walk-in, no-show, stale indicators, polling.
- [x] 5. Frontend integration, authentication, customer and owner workflows.
- [x] 6. Docker Compose, tests, load-test scenario, deployment notes.
- [x] 7. Rule-based assistant and labeled parser evaluation.
- [x] 8. Architecture and interview documentation.
- [x] 9. Refinement & Hardening: Composite indexes, walk-in rate throttling fix, 5-min grace countdown, counter QR display, audio turn alerts, 28/28 automated test suite.

## Validation

- Backend unit/API/concurrency/DB integrity tests: 28 passed against PostgreSQL.
- Database constraints: Conditional active unique constraint, check constraint, and composite indexes verified.
- Frontend production build: Vite production build passed cleanly.
- Django system check: passed (0 issues).
- Assistant parser evaluation: 50/50 exact messages and 200/200 labeled fields (100% accuracy).
- Locust: 100 users, 657 nearby requests, 0 failures; mean 2,051 ms on local Docker.
