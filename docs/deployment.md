# Deployment notes

The Compose setup is for local development and demonstration. Before using a hosting provider:

1. Check that provider's current free-tier, database persistence, sleep, bandwidth, and build limits; these change over time.
2. Use a managed PostgreSQL database or a persistent volume. Do not rely on an ephemeral container filesystem for production data.
3. Set `DJANGO_DEBUG=False`, a unique secret key, database credentials, allowed hosts, and the public frontend origin as platform environment variables. Do not upload `.env`.
4. Build the React app with `npm run build` and serve `frontend/dist` using the host's static-file service or a web server.
5. Run Django with an ASGI/WSGI production process, HTTPS, database backups, and appropriate logging.
6. Configure `VITE_API_URL` to the public API origin at frontend build time and set Django CORS to the exact deployed frontend origin.
7. Verify migrations, health endpoint, authentication, rate limiting, and PostgreSQL connectivity before directing users to the deployment.

No hosting provider is selected here because availability and free-plan terms should be verified at deployment time.
