const mysql = require("mysql");
const inquirer = require("inquirer");
const cTable = require('console.table');

let connection = mysql.createConnection({
  host: 'localhost',
  //Enter MYSQL USER
  user: '',
  //Enter MYSQL PASSWORD
  password: '',
  database: 'trackerdatabase'
})


connection.connect(err => {
  if (err) {
    return console.error(err);
  }
  tracker();
})

async function tracker() {
  const answers = await inquirer.prompt({
    type: "list",
    name: "action",
    choices: ["View Employees",
                "View Departments",
                "View Roles", 
                "Add Employee",
                "Add Role",
                "Add Department",
                "Update Employee Role",
                "Quit"]
  });

  switch (answers.action) {
    case "View Employees":
      viewEmployees();
      break;
    case "View Departments":
      viewDepartments();
      break;
    case "View Roles":
      viewRoles();
      break;
    case "Add Employee":
      addEmployee();
      break;
    case "Add Role":
      addRole();
      break;
    case "Add Department":
      addDepartment();
      break;
    case "Update Employee Role":
      updateEmployeeRole();
      break;
    case "Quit":
      // close the database connection
      connection.end(err => {
        if (err) throw err;
      });   
  }
}


function viewEmployees() {
  const sql = 'Select * FROM employee'
  connection.query(sql, [], (err, res, fields) => {
    if (err) throw err;
    console.table(res); 
    tracker();
  });
}

function viewDepartments() {
  const sql = "SELECT name as 'Department' FROM department"
  connection.query(sql, (error, result) => {
    if (error) throw error;
    console.table(result)
    tracker();
})
}

function viewRoles() {
  const sql = "SELECT title as role, salary FROM role";
  connection.query(sql, (error, result) => {
    if (error) throw error;
    console.table(result);
    tracker();
  })
}

async function addEmployee() {
  let roleQuery;
  let managerQuery;
  try {
    roleQuery = await querySync(connection, "SELECT id, title FROM role ORDER BY title", []);
    managerQuery = await querySync(connection, "SELECT id, CONCAT(first_name, ' ', last_name) as name FROM employee ORDER BY name", []);
  } catch(err) {
    throw err;
  }
  
  const roles = roleQuery.map(elem => elem.title); // make array of strings which are the titles of the roles
  const managers = managerQuery.map(element => element.name);

  if (managers.length == 0){
    console.log("Add a department first");
    tracker();
    return;
  } else if (roles.length == 0) {
    console.log("Add a role first");
    tracker();
    return;
  }
  managers.unshift("None");

  let question = [
    {
      type: "input",
      message:"Employee First Name: ",
      name: "firstName"
    },
    {
      type: "input",
      message:"Employee Last Name: ",
      name: "lastName"
    },
    {
      type: "list",
      message:"Choose Role: ",
      choices: roles,
      name: "role"
    },
    {
      type: "list",
      message:"Choose Manager: ",
      choices: managers,
      name: "manager"
    }

  ]
  const answer = await inquirer.prompt(question);
  let role_id = roleQuery.filter(elem => elem.title === answer.role)[0].id;
  let manager_id;
  if (answer.manager !== "None"){
    manager_id = managerQuery.filter(elem => elem.name === answer.manager)[0].id;
  }
  
  let sql;
  let placeholder;
  if (answer.manager == "None") {
    sql = "INSERT INTO employee SET ?";
    placeholder = {
      first_name: answer.firstName,
      last_name: answer.lastName,
      role_id: role_id,
    };
  } else {
    sql = "INSERT INTO employee SET ?";
    placeholder = {
      first_name: answer.firstName,
      last_name: answer.lastName,
      role_id: role_id,
      manager_id: manager_id
    };
  }
  
  connection.query(sql, placeholder, (err, res, fields) => {
    if (err) {
      console.log("\nError: " + err.message);
      return;
    }
    console.log(`${answer.firstName} ${answer.lastName} added to Employees`);
    tracker(); // restart the prompt
  })
}


// adds role to database
async function addRole() {
  let departmentsQuery;
  let departmentsArray;
  let answer;
  try {
    departmentsQuery = await querySync(connection, "SELECT id, name FROM department", []);

    if (departmentsQuery.length == 0) {
      console.log("Please add a department first");
      tracker();
      return;
    }
    departmentsArray = departmentsQuery.map(elem => elem.name); // array of department names
    console.log(departmentsQuery);
    answer = await inquirer.prompt([
      {
        type: "input",
        message: "Role: ",
        name: "role"
      },
      {
        type: "input",
        message: "Salary: ",
        name: "salary",
        validate: function(value) {
          if (isNaN(parseInt(value))) return "Please input a number";
          return true;
        }
      },
      {
        type: "list",
        message: "What Department is this role under: ",
        choices: departmentsArray,
        name: "department"
      }
    ]);
  } catch(err) {
    throw err;
  }

  const departmentID = departmentsQuery.filter(elem => elem.name === answer.department)[0].id;
  const sql = "INSERT INTO role (title, salary, department_id) VALUES (?, ?, ?)" 
  connection.query(sql, [answer.role, answer.salary, departmentID], (error, result) => {
    if(error) throw error;
    console.log(`${answer.role} added to roles`);
    tracker();
  })
}

// add department 
async function addDepartment() {
  let question = [
    {
      type: "input",
      message:"Department Name: ",
      name: "departmentName"
    }
  ]
  const answer = await inquirer.prompt(question);

  const sql = "INSERT INTO department SET ?";
  const placeholder = {name: answer.departmentName};
  connection.query(sql, placeholder, (err, res, fields) => {
    if (err) {
      console.log(err.message);
      return;
    }
    console.log(`${answer.departmentName} added to departments`);
    tracker();
  })
}

async function updateEmployeeRole() {
  let employeesQuery;
  let employeeArray;
  let answer;
  try {
    employeesQuery = await querySync(connection, "SELECT id, CONCAT(first_name, ' ', last_name) as name FROM employee", []);
    roleQuery = await querySync(connection, "SELECT id, title FROM role", []);
    if (roleQuery.length == 0) {
      console.log("Please Insert roles or departments first");
      tracker();
      return;
    }
    employeeArray = employeesQuery.map(elem => elem.name);
    answer = await inquirer.prompt([
      {
        type: "list",
        message: "Choose Employee To Update Role: ",
        name: "name",
        choices: employeeArray
      },
      {
        type: "list",
        message: "Role: ",
        name: "role",
        choices: roleQuery.map(elem => elem.title)
      }
    ]);
  } catch(err) {
    throw err;
  }
  
  const employeeID = employeesQuery.filter(elem => elem.name === answer.name);
  const roleID = roleQuery.filter(elem => elem.title === answer.role)[0].id
  // if there are more than one employee with same name
  if (employeeID.length > 1) { 
    const answers = await inquirer.prompt([
      {
        type: "list",
        message: "Choose id of Employee there was more than one: ",
        name: "id",
        choices: employeeID.map(elem => elem.id)
      }
    ]);
    connection.query("UPDATE employee SET role_id = ? WHERE id = ?", [roleID, answers.id], (error, result) => {
      if (error) throw error;
      console.log(`Employee role updated successfully`);
      tracker();
    })

  } else {
    connection.query("UPDATE employee SET role_id = ? WHERE id = ?", [roleID, employeeID[0].id], (error, result) => {
      if (error) throw error;
      console.log(`Employee Role updated successfully`);
      tracker();
    })
  }  
}

function querySync(connection, sql, args) {
  return new Promise((resolve, reject) => {
    connection.query(sql, args, (error, results) => {
      if (error) reject(error);
      resolve(results);
    });
  })
}