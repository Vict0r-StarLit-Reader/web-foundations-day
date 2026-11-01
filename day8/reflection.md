## Reflection
Designing the Ticket-Hub event ticketing system pushed my understanding of distributed concurrency and data consistency to a new level. The most difficult concept to master was preventing race conditions and double-bookings during extreme peak traffic—specifically handling 200,000 users competing for just 20,000 seats without crashing the database or allowing simultaneous overlapping transactions. I overcame this by combining Redis distributed locks with TTL expiration windows and ACID-compliant row-level database locks (`SELECT ... FOR UPDATE`), ensuring strict atomicity during checkout.

Based on the feedback received throughout these system design modules, the part of my architecture I would improve is introducing an asynchronous message broker (such as RabbitMQ or Kafka) between the checkout API and the payment processor to further buffer peak write spikes and decouple order persistence. 

Moving forward, what I will learn next is how to implement containerized microservices using Docker and Kubernetes, allowing these high-throughput system designs to scale automatically across distributed cloud infrastructure.
