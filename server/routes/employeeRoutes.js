const router = require("express").Router();

const {
  createEmployee,
  getEmployees
} = require("../controllers/employeeController");

router.post("/", createEmployee);
router.get("/", getEmployees);

module.exports = router;