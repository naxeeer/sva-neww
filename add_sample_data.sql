-- Sample data for SVA Terminal testing
-- Run this in Supabase SQL Editor

-- Insert sample courses
INSERT INTO courses (course_code, course_name, department, faculty) VALUES
('COEN 401', 'Microprocessor Systems', 'Computer Engineering', 'Engineering'),
('COEN 402', 'Digital Signal Processing', 'Computer Engineering', 'Engineering'),
('COEN 403', 'Computer Networks', 'Computer Engineering', 'Engineering'),
('COEN 404', 'Software Engineering', 'Computer Engineering', 'Engineering'),
('COEN 405', 'Database Systems', 'Computer Engineering', 'Engineering');

-- Insert sample students
INSERT INTO students (matric_number, name, class, department, faculty, photo_url) VALUES
('ENG/2021/001', 'John Doe', '400L', 'Computer Engineering', 'Engineering', 'https://example.com/photos/john_doe.jpg'),
('ENG/2021/002', 'Jane Smith', '400L', 'Computer Engineering', 'Engineering', 'https://example.com/photos/jane_smith.jpg'),
('ENG/2021/003', 'Mike Johnson', '400L', 'Computer Engineering', 'Engineering', 'https://example.com/photos/mike_johnson.jpg'),
('ENG/2021/004', 'Sarah Wilson', '400L', 'Computer Engineering', 'Engineering', 'https://example.com/photos/sarah_wilson.jpg'),
('ENG/2021/005', 'David Brown', '400L', 'Computer Engineering', 'Engineering', 'https://example.com/photos/david_brown.jpg');

-- Link students to courses
INSERT INTO student_courses (student_id, course_id)
SELECT s.id, c.id
FROM students s, courses c
WHERE s.matric_number IN ('ENG/2021/001', 'ENG/2021/002', 'ENG/2021/003')
AND c.course_code IN ('COEN 401', 'COEN 402', 'COEN 403');

INSERT INTO student_courses (student_id, course_id)
SELECT s.id, c.id
FROM students s, courses c
WHERE s.matric_number IN ('ENG/2021/004', 'ENG/2021/005')
AND c.course_code IN ('COEN 404', 'COEN 405');

-- Insert sample exams
INSERT INTO exams (course_id, exam_datetime, created_by)
SELECT c.id, '2024-09-10 09:00:00', '00000000-0000-0000-0000-000000000000'
FROM courses c
WHERE c.course_code = 'COEN 401';

INSERT INTO exams (course_id, exam_datetime, created_by)
SELECT c.id, '2024-09-12 14:00:00', '00000000-0000-0000-0000-000000000000'
FROM courses c
WHERE c.course_code = 'COEN 402';

INSERT INTO exams (course_id, exam_datetime, created_by)
SELECT c.id, '2024-09-15 10:00:00', '00000000-0000-0000-0000-000000000000'
FROM courses c
WHERE c.course_code = 'COEN 403';

-- Insert sample attendance records
INSERT INTO attendance (exam_id, student_id, verification_status, timestamp)
SELECT e.id, s.id, 'Verified', '2024-09-04 09:15:00'
FROM exams e, students s, courses c
WHERE e.course_id = c.id
AND c.course_code = 'COEN 401'
AND s.matric_number = 'ENG/2021/001';

INSERT INTO attendance (exam_id, student_id, verification_status, timestamp)
SELECT e.id, s.id, 'Verified', '2024-09-04 09:18:00'
FROM exams e, students s, courses c
WHERE e.course_id = c.id
AND c.course_code = 'COEN 401'
AND s.matric_number = 'ENG/2021/002';

INSERT INTO attendance (exam_id, student_id, verification_status, timestamp)
SELECT e.id, s.id, 'Failed', '2024-09-04 09:22:00'
FROM exams e, students s, courses c
WHERE e.course_id = c.id
AND c.course_code = 'COEN 401'
AND s.matric_number = 'ENG/2021/003';

