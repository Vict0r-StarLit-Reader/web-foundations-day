# Ticket-Hub System Architecture & Design

## 1. Requirements
* **Functional Requirements:**
  * Users can browse events, view detailed venue and seat layouts, hold specific seats during checkout, securely pay for tickets, and view their purchased tickets.
  * The system must handle high-concurrency ticket drops for popular events without crashing or failing.
* **Non-Functional Requirements:**
  * **Speed:** Sub-200ms API response time for general event browsing and seat map loading.
  * **Correctness:** Absolute data consistency so that double-booking is strictly prevented (no two users can purchase the same seat).
  * **Fairness:** First-come, first-served purchasing rules during high-demand ticket drops using virtual waiting rooms.

---

## 2. Load Estimates (Normal Day vs. "Big Sale" Peak)
* **Registered Users:** 2,000,000 users

### A. Normal Day Traffic
* **Visitors:** 50,000 people visit on a normal day, each viewing 10 pages = $500,000 \text{ page views/day}$
  * Average Read RPS: $\frac{500,000 \text{ requests}}{86,400 \text{ seconds}} \approx \mathbf{5.78 \text{ req/sec}}$
* **Ticket Sales (Writes):** 5,000 tickets sold per day
  * Average Write RPS: $\frac{5,000 \text{ requests}}{86,400 \text{ seconds}} \approx \mathbf{0.06 \text{ req/sec}}$

### B. "Big Sale" Peak Traffic (The 10-Minute Rush)
* **Scenario:** When a popular concert goes on sale, 200,000 people try to buy its 20,000 seats within the first 10 minutes ($600 \text{ seconds}$).
* **Peak Read / Browse Traffic:** 
  * Peak Read RPS: $\frac{200,000 \text{ users} \times 5 \text{ requests}}{600 \text{ sec}} \approx \mathbf{1,666 \text{ req/sec}}$
* **Peak Write / Transaction Traffic (Seat Checkout):** 
  * Peak Write RPS: $\frac{200,000 \text{ checkout attempts}}{600 \text{ sec}} \approx \mathbf{333.33 \text{ writes/sec}}$

---

## 3. REST API Endpoints

| Method | Endpoint | Description | Success Status Code |
| :--- | :--- | :--- | :--- |
| **GET** | `/api/v1/events` | Retrieve a paginated list of upcoming concerts and events | `200 OK` |
| **GET** | `/api/v1/events/{id}` | View detailed information and seat availability for a specific event | `200 OK` |
| **POST** | `/api/v1/seats/hold` | Temporarily lock/hold a specific seat during checkout | `201 Created` |
| **POST** | `/api/v1/payments/checkout` | Process payment and confirm the ticket order | `200 OK` |
| **GET** | `/api/v1/users/{id}/tickets` | View all tickets purchased by a specific user | `200 OK` |

---

## 4. Database Tables & Relationships

### Tables & Columns
* **`users`**: `id` (PK, UUID), `username` (VARCHAR), `email` (VARCHAR), `created_at` (TIMESTAMP)
* **`events`**: `id` (PK, UUID), `title` (VARCHAR), `description` (TEXT), `date` (TIMESTAMP), `total_seats` (INT)
* **`seats`**: `id` (PK, UUID), `event_id` (FK, UUID), `seat_number` (VARCHAR), `status` (VARCHAR: `available`, `locked`, `sold`)
* **`orders`**: `id` (PK, UUID), `user_id` (FK, UUID), `seat_id` (FK, UUID), `status` (VARCHAR: `pending`, `completed`, `cancelled`), `created_at` (TIMESTAMP)

### Relationships Explanation
* **`users` to `orders` (One-to-Many):** One user can place multiple ticket orders over time, but each order belongs to a single user.
* **`events` to `seats` (One-to-Many):** One event contains many individual seats, but each seat belongs to one specific event.
* **`seats` to `orders` (One-to-One / Many-to-One):** Each seat maps to an order transaction when locked or sold.

---

## 5. Preventing Double-Booking
To guarantee absolute data correctness and ensure two people cannot purchase the same seat during a peak rush:
* **Database Row-Level Locking (`SELECT ... FOR UPDATE`):** When a user attempts to lock or hold a seat, the transaction locks that specific row in the database so concurrent transactions must wait in sequence.
* **Atomic Status Updates:** The checkout workflow executes a strict conditional update (`UPDATE seats SET status = 'locked' WHERE id = ? AND status = 'available'`). If another transaction has already locked that seat, the affected row count returns 0, failing the operation immediately and preventing double-booking.
* **Redis Distributed Locks with TTL:** Temporary seat holds are registered in Redis with a 5-minute Time-To-Live (TTL). If payment is not completed within 5 minutes, the Redis key expires and automatically releases the seat back to the available pool.

---

## 6. System Architecture Diagram

```text
[ Clients / Mobile & Web Apps ]
              │
              ▼
     [ Global CDN / Edge ] (Static assets & cached event pages)
              │
              ▼
   [ API Gateway / Load Balancer ]
              │
              ├──► [ Virtual Waiting Room / Queue Service ] (Throttles 200k peak users)
              │         │
              │         ▼
              │    [ App Servers ] ── (Cache Read/Write) ──► [ Redis Cluster ] (Seat Locks & Caching)
              │         │
              │         ▼
              │    [ Primary Relational Database ] (ACID-compliant writes & checkouts)
              │         │
              │         ▼ (Async Replication)
              │    [ Read Replicas ] (Offloads event browsing & seat map queries)
```
### Component Explanations
* **Global CDN / Edge:** Caches static event banners, venue layouts, and frontend assets globally to absorb heavy read spikes.
* **API Gateway / Load Balancer:** Entry point that evenly distributes incoming user traffic and API calls across backend application instances.
* **Virtual Waiting Room / Queue Service:** Throttles traffic during high-demand concert drops by queuing up to 200,000 peak users, allowing only controlled batches to enter the checkout flow.
* **App Servers:** Stateless application nodes handling business logic, validation, payment orchestration, and API routing.
* **Redis Cluster:** High-performance, in-memory cache used for real-time seat locking (with TTLs) and user session state management.
* **Primary Relational Database:** PostgreSQL database instance handling ACID-compliant write operations, checkout transactions, and order persistence.
* **Read Replicas:** Read-only database instances asynchronously replicated from the primary DB to handle high-volume event browsing and seat availability queries.

---

## 7. Architectural Trade-Offs & Single Points of Failure (SPOF)

### Trade-Offs
* **Trade-Off 1: Strong Consistency vs. Availability (CAP Theorem)**
  * *Choice:* Strong consistency for ticket checkouts and seat locking.
  * *Trade-off:* If the primary database experiences latency during peak ticket drops, users might experience slight checkout delays, traded off to strictly prevent double-booking seats.
* **Trade-Off 2: Virtual Waiting Room Queue vs. Direct Access**
  * *Choice:* Enforcing a virtual queue during major concert drops.
  * *Trade-off:* Users must wait in line rather than getting immediate access, prioritized in favor of protecting system stability and server uptime.

### Mitigating Single Points of Failure (SPOF)
* **Load Balancers:** Deployed in active-active pairs with automated DNS failover to prevent gateway downtime.
* **Database Layer:** Primary database configured with automated failover and multi-region read replicas to ensure high availability.
* **App Server Scaling:** Horizontally auto-scaled container instances managed behind an automated orchestration group to handle traffic surges.
