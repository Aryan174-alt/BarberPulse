# QueueNear interview questions

1. **What problem does the app solve?** It lets customers compare nearby barber shops by opening status, current queue, estimated wait, and service price.
2. **Why Django REST Framework?** It provides a familiar Django API layer with serializers, permissions, and authentication integration.
3. **Why PostgreSQL?** Queue joins need transactions, row locks, and conditional uniqueness that match relational data.
4. **What is a race condition in queue joining?** Two concurrent requests can both see no active entry; locking the shop row serializes the check and insert.
5. **Why also add a unique constraint?** It enforces the active-entry rule in the database even if application logic misses a case.
6. **How is the wait estimated?** Sum service minutes ahead and remaining current-service time, divided by active barbers.
7. **What can make the wait estimate inaccurate?** Queue updates may be late and actual service duration can differ from its listed duration.
8. **How does nearby sorting work?** Haversine distance estimates straight-line distance from the customer's coordinates.
9. **How is opening status determined?** The shop schedule and optional break are evaluated in India local time unless manually closed.
10. **How do owner permissions work?** Queue endpoints resolve the authenticated owner's linked shop and query/action only within it.
11. **How do JWT tokens work here?** Login and registration return short-lived access and refresh tokens; Axios refreshes an expired access token.
12. **How are walk-ins handled?** A public, rate-limited endpoint creates a queue entry with a name and a selected/default active service.
13. **How are customers notified of queue changes?** The web pages poll the API every eight seconds; Channels/WebSockets are a later option.
14. **How does the assistant avoid inventing data?** It parses request filters and ranks API-backed shop results; all prices and waits come from database records.
15. **What are the current limitations?** Demo shop data, manual owner onboarding, approximate waits, polling, and development-mode frontend serving in Compose.
