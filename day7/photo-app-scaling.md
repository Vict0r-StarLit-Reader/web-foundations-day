# SnapShare Scaling Plan

## 1. Assumptions and Daily Active Users (DAU)
* **Registered Users:** 10,000,000[span_5](start_span)[span_5](end_span)
* **Activity Rate:** 10% of registered users are active daily[span_6](start_span)[span_6](end_span)
* **Daily Active Users (DAU):** 10,000,000 × 0.10 = **1,000,000 users**
* **User Actions:** Each active user uploads 1 photo per day and views 50 feed pages per day[span_7](start_span)[span_7](end_span)
* **File Sizes:** Average photo size is 2 MB; each thumbnail size is 50 KB[span_8](start_span)[span_8](end_span)

---

## 2. Traffic and Storage Calculations

### Uploads & Feed Views per Second
* **Seconds in a day:** 86,400 seconds
* **Total Uploads per Day:** 1,000,000 photos[span_9](start_span)[span_9](end_span)
  * **Average Uploads/sec:** 1,000,000 ÷ 86,400 ≈ **11.57 requests/sec**
  * **Peak Uploads/sec (5× peak factor):** 11.57 × 5 ≈ **57.85 requests/sec**[span_10](start_span)[span_10](end_span)
* **Total Feed Views per Day:** 1,000,000 users × 50 views = 50,000,000 views[span_11](start_span)[span_11](end_span)
  * **Average Feed Views/sec:** 50,000,000 ÷ 86,400 ≈ **578.70 requests/sec**
  * **Peak Feed Views/sec (5× peak factor):** 578.70 × 5 ≈ **2,893.50 requests/sec**[span_12](start_span)[span_12](end_span)

### Annual Storage Requirements
* **Photo Storage per Day:** 1,000,000 photos × 2 MB = 2,000,000 MB = **2 TB/day**
* **Thumbnail Storage per Day:** 1,000,000 thumbnails × 50 KB = 50,000,000 KB = **50 GB/day**
* **Total Storage per Year:** (2 TB + 0.05 TB) × 365 days = **748.25 TB/year**

---

## 3. System Workload Type
* **Classification:** **Read-Heavy**
* **Design Implication:** Because users view 50 feed pages for every 1 photo they upload, the system experiences significantly more read operations (~2,893 reads/sec peak) than writes (~58 writes/sec peak). The architecture must prioritize caching, database read replicas, and CDNs to serve read traffic swiftly without bottlenecking the primary database.

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
         ├──► [ App Servers ] ──(Reads/Writes Metadata)──► [ Primary Database (Writes) ]
         │         │                                             │
         │         │ (Async Job)                           (Replication)
         │         ▼                                             ▼
         │    [ Message Queue ]                        [ Read Replicas (Reads) ]
         │         │
         │         ▼
         │    [ Worker Service ] (Resizes & generates thumbnails)
         │         │
         └─────────┴───────────────────────────────────► [ Object Storage (Photos & Thumbnails) ]
                   (Uploads processed media)
