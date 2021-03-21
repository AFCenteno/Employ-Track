DROP DATABASE IF EXISTS trackerdatabase;

CREATE DATABASE trackerdatabase;

USE trackerdatabase;

CREATE TABLE department
(
    id INTEGER NOT NULL PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(30) NOT NULL
);

CREATE TABLE role
(
    id INTEGER PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(30) NOT NULL,
    salary DECIMAL(10, 2) NOT NULL,
    department_id INTEGER NOT  NULL,
    FOREIGN KEY (department_id) REFERENCES department(id) ON DELETE CASCADE
);

CREATE TABLE employee
(
    id INTEGER PRIMARY KEY AUTO_INCREMENT,
    first_Name VARCHAR(30) NOT NULL,
    last_Name VARCHAR(30) NOT NULL,
    role_id INTEGER,
    FOREIGN KEY (role_id) REFERENCES role(id),
    manager_id INTEGER, 
    FOREIGN KEY (manager_id) REFERENCES employee(id)
);

INSERT INTO department (`name`) VALUES ("Sales");
INSERT INTO department (`name`) VALUES ("Theater");
INSERT INTO department (`name`) VALUES ("Concession");

INSERT INTO `role` (title, salary, department_id) VALUES ("Stage Hand", 48000, 1);
INSERT INTO `role` (title, salary, department_id) VALUES ("Cashier", 24000, 1);
INSERT INTO `role` (title, salary, department_id) VALUES ("Janitor", 100000, 3);

INSERT INTO employee (first_name, last_name, role_id) VALUES ("Stan", "Smithy", 3); 
INSERT INTO employee (first_name, last_name, role_id, manager_id) VALUES ("Rain", "Drizzle", 1, 1);
INSERT INTO employee (first_name, last_name, role_id, manager_id) VALUES ("Chan", "Opener", 2, 2); 
