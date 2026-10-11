# School Database Design

## Table Explanations
* **`students`**: Stores personal details for every student, including a unique ID, full name, and a unique email address.
* **`courses`**: Stores details about available subjects, including a unique ID, course title, and a unique course code.
* **`enrolments`**: A junction (join) table connecting students and courses, storing foreign keys for both alongside the specific grade achieved.

## Relationships & Join Table
* **Relationship Type:** The relationship between `students` and `courses` is **many-to-many** (one student can take many courses, and one course can have many students).
* **Why a Join Table is Needed:** Relational databases cannot directly model many-to-many relationships in flat tables without massive data duplication. The `enrolments` table bridges the two entities and allows us to store relationship-specific attributes like `grade`.

## Indexing
* **Recommended Index:** An index on foreign keys `enrolments(student_id)` and `enrolments(course_id)`.
* **Reason:** As the database grows, looking up student transcripts or course rosters requires scanning the join table frequently. Indexes drastically speed up `JOIN` performance and lookups.

## SQL vs NoSQL Choice
For an academic school database system, **SQL (Relational Database)** is the correct choice. School records require strict schema enforcement, data integrity, foreign key constraints to prevent orphaned records, and ACID-compliant transactions when updating grades or processing student data. NoSQL is better suited for unstructured or rapidly scaling flexible documents, whereas a school environment relies heavily on structured relational integrity.