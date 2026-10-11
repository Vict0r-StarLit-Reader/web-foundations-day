-- 1. Create Tables with Primary Keys, Foreign Keys, NOT NULL, and UNIQUE constraints
CREATE TABLE students (
    student_id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE
);

CREATE TABLE courses (
    course_id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE
);

CREATE TABLE enrolments (
    enrolment_id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    course_id INTEGER NOT NULL,
    grade TEXT,
    FOREIGN KEY (student_id) REFERENCES students(student_id),
    FOREIGN KEY (course_id) REFERENCES courses(course_id),
    UNIQUE(student_id, course_id) -- Prevents a student from enrolling in the same course twice
);

-- 2. Insert Sample Data (At least 3 students, 3 courses, and 5 enrolments)
-- Note: Diana Prince is added without enrolments to test the "no enrolments" query.
INSERT INTO students (name, email) VALUES 
('Alice Smith', 'alice@example.com'),
('Bob Jones', 'bob@example.com'),
('Charlie Brown', 'charlie@example.com'),
('Diana Prince', 'diana@example.com');

INSERT INTO courses (title, code) VALUES 
('Database Systems', 'CS101'),
('Web Development', 'CS102'),
('Data Structures', 'CS103');

INSERT INTO enrolments (student_id, course_id, grade) VALUES 
(1, 1, 'A'),
(1, 2, 'B'),
(2, 1, 'B+'),
(2, 3, 'A-'),
(3, 2, 'C');

-- 3. Query 1: All courses for one student (by name)
SELECT s.name AS student_name, c.title AS course_title, e.grade
FROM students s
JOIN enrolments e ON s.student_id = e.student_id
JOIN courses c ON e.course_id = c.course_id
WHERE s.name = 'Alice Smith';

-- 4. Query 2: All students on one course (by course code)
SELECT c.title AS course_title, s.name AS student_name, e.grade
FROM courses c
JOIN enrolments e ON c.course_id = e.course_id
JOIN students s ON e.student_id = s.student_id
WHERE c.code = 'CS101';

-- 5. Query 3: Number of students per course (using GROUP BY)
SELECT c.title AS course_title, COUNT(e.student_id) AS student_count
FROM courses c
LEFT JOIN enrolments e ON c.course_id = e.course_id
GROUP BY c.course_id, c.title;

-- 6. Query 4: Students who have no enrolments (using LEFT JOIN)
SELECT s.student_id, s.name, s.email
FROM students s
LEFT JOIN enrolments e ON s.student_id = e.student_id
WHERE e.enrolment_id IS NULL;

-- 7. Query 5: Update one enrolment's grade
UPDATE enrolments
SET grade = 'A+'
WHERE student_id = 1 AND course_id = 1;