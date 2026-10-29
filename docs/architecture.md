# QueueNear architecture

## Request flow

The React/Vite application calls Django REST Framework through the shared Axios client in `frontend/src/api/api.js`. Django reads secrets and PostgreSQL connection values from the root `.env`. PostgreSQL stores shops, services, barbers, profiles, and queue entries.

## Data model

- `UserProfile` gives the existing Django user either a customer or owner role; owners are linked to one shop.
- `Shop` stores location, opening hours, optional break, manual closed override, and last update time.
- `Barber` tracks active staff for a shop.
- `Service` stores service duration and a decimal price.
- `QueueEntry` stores customer or named walk-in entries and their lifecycle timestamps.
- The database conditional unique constraint allows only one active entry per customer per shop. A shop/status/join-time index supports queue reads.

## Queue safety and state transitions

Joining locks the shop row inside `transaction.atomic()`, checks opening/closed status and the customer's active entry, then creates the entry. This serializes joins to the same shop. The conditional unique constraint remains a database-level backstop. Owner actions lock the same shop row and only act on the authenticated owner's linked shop.

Queue states: `waiting -> called -> in_service -> done`. Called entries can become `no_show`; waiting or called entries can be cancelled by their customer. Called entries older than five minutes are released when the owner queue is read.

## Wait estimate

The estimate adds the service durations for waiting/called entries ahead, plus the remaining duration of the active service, then divides by the number of active barbers (at least one to avoid division by zero). This is an estimate, not a promise; old queue data is visibly marked stale after 30 minutes.

## Location and availability

Nearby searches compute Haversine distance in kilometres from latitude/longitude coordinates. Open status uses the `Asia/Kolkata` local time, opening/closing boundaries, optional break, and owner closed override. No geospatial database extension is required.

## Assistant

The assistant extracts service, an optional price cap, a time window, and a priority from English/Hinglish text. It validates filters and uses shop/service data; it does not generate shop facts, prices, or wait estimates. A 50-message labeled parser evaluation lives in `backend/assistant/eval/`.

## Known limitations

- Demo shop data is seeded for Jaipur and must be replaced with real shop onboarding.
- Queue times rely on owners keeping queue state current.
- Polling refreshes screens every eight seconds; Channels/WebSockets are not enabled.
- Owner accounts must be linked to a shop through Django admin.
- The Compose frontend runs the Vite development server; production deployment should build and serve static assets separately.
