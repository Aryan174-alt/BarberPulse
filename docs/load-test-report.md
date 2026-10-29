# QueueNear load-test report

Scenario: read-only nearby shop browsing against the local API using 100 simulated Locust users.

Command:

```powershell
cd backend
locust -f loadtests\locustfile.py --headless --host http://127.0.0.1:8000 -u 100 -r 10 -t 30s --csv ..\docs\locust-results
```

Measured locally with Docker Desktop, PostgreSQL 16, and the seeded eight shops:

- 100 simulated users, ramped at 10 users/second, for 30 seconds.
- 593 GET requests to nearby search; 0 failures.
- Mean response time: 2,349 ms; median: 2,300 ms; 95th percentile: 5,500 ms; max: 7,191 ms.
- Throughput: 21.64 requests/second.

An initial run averaged 8,249 ms. Nearby serialization was changed to reuse prefetched queue and barber data; the final repeat run averaged 2,349 ms. These measurements describe this local development machine and are not production capacity claims.
