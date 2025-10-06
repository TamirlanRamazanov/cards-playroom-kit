-- Database Schema Creation
CREATE TABLE Departments(
    dep_id int PRIMARY KEY,
    name varchar(100)
);

CREATE TABLE Majors(
    major_id int PRIMARY KEY,
    code varchar(10) UNIQUE,
    name varchar(100),
    dep_id int REFERENCES Departments (dep_id)
);

CREATE TABLE Students(
    stud_id int PRIMARY KEY,
    fname varchar(20),
    lname varchar(20),
    bdate date,
    major_id int REFERENCES Majors(major_id)
);

CREATE TABLE Phd(
    phd_id int PRIMARY KEY,
    fname varchar(20),
    lname varchar(20),
    bdate date,
    research_topic varchar(200),
    major_id int REFERENCES Majors(major_id)
);

CREATE TABLE Teachers(  
    teach_id int PRIMARY KEY,
    fname varchar(20),
    lname varchar(20),
    bdate date,
    dep_id int REFERENCES Departments (dep_id)
);

-- Insert sample data
INSERT INTO Departments VALUES 
    (1, 'Mathematical and computer modeling'), 
    (2, 'Computer Engineering'), 
    (3, 'Cybersecurity');

INSERT INTO Majors VALUES 
    (1,'6B06101','Computer science',1), 
    (2,'6B06112','Data science',1), 
    (3,'6B06106','Computer Systems and Software Engineering',2);

INSERT INTO Students VALUES 
    (1,'A_fname','A_lname', '2002-01-01', 1),
    (2,'B_fname','B_lname', '2001-02-02', 2), 
    (5,'G_fname','G_lname', '2001-07-08', 2);

INSERT INTO Students (stud_id, fname, lname) VALUES 
    (3,'F_fname','F_lname'),
    (4,'A_fname','F_lname');

INSERT INTO Phd VALUES 
    (1,'C_fname','C_lname', '1996-02-01', 'Machine Learning Applications', 2),
    (2,'D_fname','D_lname', '1995-03-04', 'Database Systems', 1);

INSERT INTO Teachers VALUES 
    (1,'C_fname','C_lname', '1988-05-01', 1),
    (2,'E_fname','E_lname', '1960-05-04', 2);

-- 1. Create 3 group roles: Students, Teachers and Managers
CREATE ROLE Students;
CREATE ROLE Teachers;
CREATE ROLE Managers;

-- 2. Create 2 user roles for each group role with different options

-- Students group - 2 users: Artur and Bob
CREATE ROLE artur_student WITH 
    LOGIN 
    PASSWORD 'student123' 
    VALID UNTIL '2025-12-31'
    IN ROLE Students;

CREATE ROLE bob_student WITH 
    LOGIN 
    PASSWORD 'student456' 
    VALID UNTIL '2026-06-30'
    IN ROLE Students;

-- Teachers group - 2 users: Zeinel and Olzhas
CREATE ROLE zeinel_teacher WITH 
    LOGIN 
    PASSWORD 'teacher789' 
    VALID UNTIL '2025-12-31'
    CREATEDB
    IN ROLE Teachers;

CREATE ROLE olzhas_teacher WITH 
    LOGIN 
    PASSWORD 'teacher012' 
    VALID UNTIL '2026-03-31'
    CREATEROLE
    IN ROLE Teachers;

-- Managers group - 2 users: Guardiola and Mourinho
CREATE ROLE guardiola_manager WITH 
    LOGIN 
    PASSWORD 'manager345' 
    VALID UNTIL '2026-12-31'
    CREATEDB 
    CREATEROLE
    SUPERUSER
    IN ROLE Managers;

CREATE ROLE mourinho_manager WITH 
    LOGIN 
    PASSWORD 'manager678' 
    VALID UNTIL '2025-08-31'
    CREATEDB 
    CREATEROLE
    IN ROLE Managers;

-- 3. Edit one of the user roles (artur_student)
-- Add CREATEDB privilege and extend password validity
ALTER ROLE artur_student CREATEDB;
ALTER ROLE artur_student VALID UNTIL '2026-12-31';

-- 4. Rename one of the user roles (bob_student to robert_student)
ALTER ROLE bob_student RENAME TO robert_student;

-- 5. Delete one of the user roles (robert_student)
DROP ROLE robert_student;

-- 6. Check information about these roles
SELECT rolname FROM pg_roles ORDER BY rolname;

/*
In conclusion of this laboratory work, I learned and practiced how to work with PostgreSQL role management system, including how to use commands such as CREATE ROLE for creating both group and user roles, ALTER ROLE for modifying role properties and privileges, DROP ROLE for removing roles, and various role options like LOGIN, PASSWORD, VALID UNTIL, CREATEDB, CREATEROLE, and SUPERUSER for different types of access control. Also working with this database schema provided practical experience in handling relational database design, particularly the foreign key relationships between Departments, Majors, Students, PhD, and Teachers tables, and understanding how role-based access control can be implemented to manage different user groups with varying levels of privileges and security requirements.
*/
