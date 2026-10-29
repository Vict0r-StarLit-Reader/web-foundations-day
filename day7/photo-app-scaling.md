# SnapShare Scaling Plan

## 1. Assumptions and Daily Active Users (DAU)
* **Registered Users:** 10,000,000
* **Activity Rate:** 10% of registered users are active daily
* **Daily Active Users (DAU):** 10,000,000 × 0.10 = **1,000,000 users**
* **User Actions:** Each active user uploads 1 photo per day and views 50 feed pages per day
* **File Sizes:** Average photo size is 2 MB; each thumbnail size is 50 KB

---

## 2. Traffic and Storage Calculations

### Uploads & Feed Views per Second
* **Seconds in a day:** 86,400 seconds
* **Total Uploads per Day:** 1,000,000 photos
  * **Average Uploads/sec:** 1,000,000 ÷ 86,400 ≈ **11.57 requests/sec**
  * **Peak Uploads/sec (5× peak factor):** 11.57 × 5 ≈ **57.85 requests/sec**
* **Total Feed Views per Day:** 1,000,000 users × 50 views = 50,000,000 views
  * **Average Feed Views/sec:** 50,000,000 ÷ 86,400 ≈ **578.70 requests/sec**
  * **Peak Feed Views/sec (5× peak factor):** 578.70 × 5 ≈ **2,893.50 requests/sec**

### Annual Storage Requirements
* **Photo Storage per Day:** 1,000,000 photos × 2 MB = 2,000,000 MB = **2 TB/day**
* **Thumbnail Storage per Day:** 1,000,000 thumbnails × 50 KB = 50,000,000 KB = **50 GB/day**
* **Total Storage per Year:** (2 TB + 0.05 TB) × 365 days = **748.25 TB/year**

---

## 3. System Workload Type
* **Classification:** **Read-Heavy**
* **Design Implication:** Because users view 50 feed pages for every 1 photo they upload, the system experiences significantly more read operations (~2,893 reads/sec peak) than writes (~58 writes/sec peak). The architecture must prioritize an in-memory caching layer, database read replicas, and CDNs to serve read traffic swiftly without bottlenecking the database tier.

---

## 4. Database vs. Object Storage for Photos
* **Why photos should not be stored in the database:** Relational and standard databases are optimized for structured tabular data, quick indexing, and transactional integrity. Storing large binary blobs (like 2 MB images) directly inside rows bloats database file sizes, degrades query performance, slows down backups, and increases memory/disk input-output costs.
* **Where they should go instead:** Raw photo files and thumbnails should be stored in a distributed **Object Storage** service (such as AWS S3), while metadata (photo URL, uploader ID, timestamps, captions) is stored in the relational database.

---

## 5. System Architecture Diagram

```text
[ Users / Mobile App ]
         │
         ▼
     [ CDN ] (Caches static images & thumbnails globally)
         │
         ▼
[ Load Balancer ] (Distributes incoming traffic)
         │
         ├──► [ App Servers ] ──(Reads/Writes Cache & Metadata)──► [ Redis In-Memory Cache ]
         │         │                                                         │
         │         │ (Async Job)                                      (Cache Misses)
         │         ▼                                                         ▼
         │    [ Message Queue ]                               [ Read Replicas (Reads) ]
         │         │                                                         │
         │         ▼                                            [ Primary Database (Writes) ]
         │    [ Worker Service ] (Resizes & generates thumbnails)
         │         │
         └─────────┴───────────────────────────────────────────────────────► [ Object Storage (Photos & Thumbnails) ]
                   (Uploads processed media)
```
## 6. Component Explanations
* **CDN:** Caches static photo assets and thumbnails geographically close to users to minimize latency and reduce origin server load.
* **Load Balancer:** Distributes incoming user requests evenly across multiple application servers to ensure high availability and prevent overload.
* **App Servers:** Handle incoming API requests, authenticate users, coordinate business logic, and interact with the caching tier, databases, and object storage.
* **Redis In-Memory Cache:** Caches hot user timelines, feed metadata, and frequent user profile lookups in memory to serve reads instantly and eliminate unnecessary query pressure on the database read replicas.
* **Primary Database:** Handles all transactional write operations (user accounts, new photo metadata, follows).
* **Read Replica:** Handles read-only database queries dispatched on cache misses to offload the primary database.
* **Object Storage:** Provides scalable, durable cloud storage specifically designed to hold large binary files like raw photos and generated thumbnails.
* **Message Queue:** Decouples heavy background tasks (like image resizing and thumbnail generation) from the main API request-response cycle.
* **Worker Service:** Consumes jobs from the message queue to process raw images, generate 50 KB thumbnails, and save them back to object storage asynchronously.

---

## 7. Step-by-Step Upload Walkthrough (Client to Queue to Object Storage)
1. **Client Initiation:** The mobile app client captures or selects a photo, compresses it locally if needed, and sends an HTTP `POST /upload` request containing the binary image and metadata to the Load Balancer.
2. **Routing & Authentication:** The Load Balancer forwards the request to an available App Server, which validates the user's authentication token and request payload.
3. **Direct Upload to Object Storage:** The App Server streams the raw full-size photo (2 MB) directly into the distributed Object Storage bucket and receives a permanent public URL/key.
4. **Metadata Persistence:** The App Server writes the photo metadata record (photo ID, storage URL, uploader user ID, caption, creation timestamp) into the Primary Database and invalidates stale user feed cache keys in Redis.
5. **Enqueue Background Job:** The App Server pushes an asynchronous processing job containing the photo reference path to the Message Queue and immediately returns a `201 Created` success response to the client.
6. **Async Worker Completion:** A background Worker Service pulls the job from the Message Queue, downloads the raw photo from Object Storage, processes and generates the optimized 50 KB thumbnail, uploads the generated thumbnail back to Object Storage, and updates the photo record in the primary database with the completed thumbnail URL.

---

## 8. Architectural Trade-Offs
* **Trade-Off 1: Eventual Consistency Across Read Replicas (Performance vs. Consistency)**
  * *Choice:* Using database read replicas combined with Redis caching and asynchronous background workers for feed updates and thumbnail processing.
  * *Trade-off:* While write transactions commit immediately to the primary database, read replicas and Redis cache layers experience brief replication and invalidation delays. Followers may experience a short delay (a few seconds) before seeing a newly uploaded photo, trading strict immediate consistency for massive read throughput and low latency.
* **Trade-Off 2: CPU Load of Proxying Media Through App Servers vs. Direct Uploads (Compute vs. Architecture Complexity)**
  * *Choice:* Routing initial upload payloads through App Servers before pushing to Object Storage.
  * *Trade-off:* Proxying binary files directly through App Servers consumes significant network bandwidth and CPU cycles for request parsing and stream handling compared to direct client-to-storage pre-signed URL uploads. However, proxying provides centralized rate-limiting, authentication enforcement, and payload validation before any data touches storage.
