-- Student Verification Assistant (SVA) Terminal Database Schema
-- Supabase PostgreSQL Database
-- Version: 1.0
-- Created: September 2024

-- Enable Row Level Security
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret';

-- Create custom types
CREATE TYPE verification_status AS ENUM ('Verified', 'Failed');

-- =====================================================
-- COURSES TABLE
-- Stores academic course information
-- =====================================================
CREATE TABLE courses (
    id SERIAL PRIMARY KEY,
    course_code VARCHAR(20) UNIQUE NOT NULL,
    course_name VARCHAR(255) NOT NULL,
    department VARCHAR(100) NOT NULL,
    faculty VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX idx_courses_code ON courses(course_code);
CREATE INDEX idx_courses_department ON courses(department);

-- =====================================================
-- STUDENTS TABLE
-- Stores student information and biometric data
-- =====================================================
CREATE TABLE students (
    id SERIAL PRIMARY KEY,
    matric_number VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    class VARCHAR(50),
    department VARCHAR(100) NOT NULL,
    faculty VARCHAR(100) NOT NULL,
    photo_url TEXT,
    fingerprint_template TEXT, -- Hashed fingerprint template
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX idx_students_matric ON students(matric_number);
CREATE INDEX idx_students_name ON students(name);
CREATE INDEX idx_students_department ON students(department);

-- =====================================================
-- STUDENT_COURSES TABLE
-- Many-to-many relationship between students and courses
-- =====================================================
CREATE TABLE student_courses (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(student_id, course_id)
);

-- Add indexes for better performance
CREATE INDEX idx_student_courses_student ON student_courses(student_id);
CREATE INDEX idx_student_courses_course ON student_courses(course_id);

-- =====================================================
-- EXAMS TABLE
-- Stores examination schedule information
-- =====================================================
CREATE TABLE exams (
    id SERIAL PRIMARY KEY,
    course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    exam_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX idx_exams_course ON exams(course_id);
CREATE INDEX idx_exams_datetime ON exams(exam_datetime);
CREATE INDEX idx_exams_created_by ON exams(created_by);

-- =====================================================
-- ATTENDANCE TABLE
-- Stores student verification attempts and results
-- =====================================================
CREATE TABLE attendance (
    id SERIAL PRIMARY KEY,
    exam_id INTEGER NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    verification_status verification_status NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    verification_method VARCHAR(50) DEFAULT 'biometric', -- face+fingerprint, face_only, fingerprint_only
    notes TEXT
);

-- Add indexes for better performance
CREATE INDEX idx_attendance_exam ON attendance(exam_id);
CREATE INDEX idx_attendance_student ON attendance(student_id);
CREATE INDEX idx_attendance_timestamp ON attendance(timestamp);
CREATE INDEX idx_attendance_status ON attendance(verification_status);

-- =====================================================
-- TRIGGERS FOR UPDATED_AT TIMESTAMPS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to tables with updated_at columns
CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON courses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON students
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_exams_updated_at BEFORE UPDATE ON exams
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

-- Courses policies
CREATE POLICY "Allow authenticated users to read courses" ON courses
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert courses" ON courses
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update courses" ON courses
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete courses" ON courses
    FOR DELETE USING (auth.role() = 'authenticated');

-- Students policies
CREATE POLICY "Allow authenticated users to read students" ON students
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert students" ON students
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update students" ON students
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete students" ON students
    FOR DELETE USING (auth.role() = 'authenticated');

-- Student_courses policies
CREATE POLICY "Allow authenticated users to read student_courses" ON student_courses
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert student_courses" ON student_courses
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update student_courses" ON student_courses
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete student_courses" ON student_courses
    FOR DELETE USING (auth.role() = 'authenticated');

-- Exams policies
CREATE POLICY "Allow authenticated users to read exams" ON exams
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert exams" ON exams
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update exams" ON exams
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete exams" ON exams
    FOR DELETE USING (auth.role() = 'authenticated');

-- Attendance policies
CREATE POLICY "Allow authenticated users to read attendance" ON attendance
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert attendance" ON attendance
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update attendance" ON attendance
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete attendance" ON attendance
    FOR DELETE USING (auth.role() = 'authenticated');

-- =====================================================
-- USEFUL VIEWS FOR REPORTING
-- =====================================================

-- View for student course enrollments
CREATE VIEW student_course_view AS
SELECT 
    s.id as student_id,
    s.matric_number,
    s.name as student_name,
    s.department as student_department,
    c.id as course_id,
    c.course_code,
    c.course_name,
    sc.enrolled_at
FROM students s
JOIN student_courses sc ON s.id = sc.student_id
JOIN courses c ON sc.course_id = c.id;

-- View for exam attendance summary
CREATE VIEW exam_attendance_summary AS
SELECT 
    e.id as exam_id,
    c.course_code,
    c.course_name,
    e.exam_datetime,
    COUNT(a.id) as total_attempts,
    COUNT(CASE WHEN a.verification_status = 'Verified' THEN 1 END) as verified_count,
    COUNT(CASE WHEN a.verification_status = 'Failed' THEN 1 END) as failed_count,
    ROUND(
        COUNT(CASE WHEN a.verification_status = 'Verified' THEN 1 END) * 100.0 / 
        NULLIF(COUNT(a.id), 0), 2
    ) as success_rate
FROM exams e
JOIN courses c ON e.course_id = c.id
LEFT JOIN attendance a ON e.id = a.exam_id
GROUP BY e.id, c.course_code, c.course_name, e.exam_datetime;

-- View for detailed attendance records
CREATE VIEW attendance_detail_view AS
SELECT 
    a.id as attendance_id,
    e.exam_datetime,
    c.course_code,
    c.course_name,
    s.matric_number,
    s.name as student_name,
    s.department,
    a.verification_status,
    a.timestamp,
    a.verification_method,
    a.notes
FROM attendance a
JOIN exams e ON a.exam_id = e.id
JOIN courses c ON e.course_id = c.id
JOIN students s ON a.student_id = s.id
ORDER BY a.timestamp DESC;

-- =====================================================
-- FUNCTIONS FOR COMMON OPERATIONS
-- =====================================================

-- Function to get student by matriculation number
CREATE OR REPLACE FUNCTION get_student_by_matric(matric_num VARCHAR(50))
RETURNS TABLE (
    id INTEGER,
    matric_number VARCHAR(50),
    name VARCHAR(255),
    class VARCHAR(50),
    department VARCHAR(100),
    faculty VARCHAR(100),
    photo_url TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT s.id, s.matric_number, s.name, s.class, s.department, s.faculty, s.photo_url
    FROM students s
    WHERE s.matric_number = matric_num;
END;
$$ LANGUAGE plpgsql;

-- Function to log attendance
CREATE OR REPLACE FUNCTION log_attendance(
    p_exam_id INTEGER,
    p_student_id INTEGER,
    p_status verification_status,
    p_method VARCHAR(50) DEFAULT 'biometric',
    p_notes TEXT DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
    attendance_id INTEGER;
BEGIN
    INSERT INTO attendance (exam_id, student_id, verification_status, verification_method, notes)
    VALUES (p_exam_id, p_student_id, p_status, p_method, p_notes)
    RETURNING id INTO attendance_id;
    
    RETURN attendance_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get upcoming exams
CREATE OR REPLACE FUNCTION get_upcoming_exams(days_ahead INTEGER DEFAULT 7)
RETURNS TABLE (
    exam_id INTEGER,
    course_code VARCHAR(20),
    course_name VARCHAR(255),
    exam_datetime TIMESTAMP WITH TIME ZONE,
    department VARCHAR(100)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        e.id,
        c.course_code,
        c.course_name,
        e.exam_datetime,
        c.department
    FROM exams e
    JOIN courses c ON e.course_id = c.id
    WHERE e.exam_datetime >= NOW()
    AND e.exam_datetime <= NOW() + INTERVAL '1 day' * days_ahead
    ORDER BY e.exam_datetime;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- SAMPLE DATA (OPTIONAL - FOR TESTING)
-- =====================================================

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

-- Insert sample exams (future dates)
INSERT INTO exams (course_id, exam_datetime, created_by)
SELECT c.id, '2024-12-10 09:00:00+00', '00000000-0000-0000-0000-000000000000'
FROM courses c WHERE c.course_code = 'COEN 401';

INSERT INTO exams (course_id, exam_datetime, created_by)
SELECT c.id, '2024-12-12 14:00:00+00', '00000000-0000-0000-0000-000000000000'
FROM courses c WHERE c.course_code = 'COEN 402';

INSERT INTO exams (course_id, exam_datetime, created_by)
SELECT c.id, '2024-12-15 10:00:00+00', '00000000-0000-0000-0000-000000000000'
FROM courses c WHERE c.course_code = 'COEN 403';

-- =====================================================
-- MAINTENANCE QUERIES
-- =====================================================

-- Query to check database health
-- SELECT 
--     schemaname,
--     tablename,
--     attname,
--     n_distinct,
--     correlation
-- FROM pg_stats
-- WHERE schemaname = 'public';

-- Query to monitor table sizes
-- SELECT 
--     schemaname,
--     tablename,
--     pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
-- FROM pg_tables
-- WHERE schemaname = 'public'
-- ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- =====================================================
-- BACKUP AND RESTORE NOTES
-- =====================================================

-- To backup specific tables:
-- pg_dump -h hostname -U username -d database_name -t courses -t students -t student_courses -t exams -t attendance > sva_backup.sql

-- To restore:
-- psql -h hostname -U username -d database_name < sva_backup.sql

-- =====================================================
-- PERFORMANCE OPTIMIZATION NOTES
-- =====================================================

-- Consider adding these indexes for large datasets:
-- CREATE INDEX CONCURRENTLY idx_attendance_exam_student ON attendance(exam_id, student_id);
-- CREATE INDEX CONCURRENTLY idx_attendance_timestamp_status ON attendance(timestamp, verification_status);

-- For very large datasets, consider partitioning the attendance table by date:
-- CREATE TABLE attendance_2024 PARTITION OF attendance FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');

-- =====================================================
-- SECURITY NOTES
-- =====================================================

-- 1. Always use environment variables for database credentials
-- 2. Enable SSL connections in production
-- 3. Regularly rotate database passwords
-- 4. Monitor for suspicious query patterns
-- 5. Keep Supabase and all dependencies updated
-- 6. Use strong passwords for admin accounts
-- 7. Enable audit logging for sensitive operations

-- =====================================================
-- END OF SCHEMA
-- =====================================================

