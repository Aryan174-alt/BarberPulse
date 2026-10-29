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

## Validation

- Backend unit/API/concurrency tests: 21 passed against PostgreSQL.
- Frontend production build: passed.
- Django system check: passed.
- Assistant parser evaluation: 50/50 exact messages and 200/200 labeled fields.
- Locust: 100 users, 657 nearby requests, 0 failures; mean 2,051 ms on local Docker.
