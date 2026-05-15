const Employee = require("../models/Employee");

// ✅ Create Employee
exports.createEmployee = async (req, res) => {
  try {

    const {
      memberId,
      firstName,
      lastName,
      gender,
      phone,
      maritalStatus,
      wifeName,
      wifeFatherName,
      wifeMotherName,
      fatherName,
      motherName,
      brothers,
      sisters,
      children
    } = req.body;

    // 🔥 Clean empty values (very important)
    const cleanedBrothers = brothers.filter(b => b);
    const cleanedSisters = sisters.filter(s => s);
    const cleanedChildren = children.filter(c => c);

    const newEmployee = new Employee({
      memberId,
      firstName,
      lastName,
      gender,
      phone,
      maritalStatus,

      wifeName,
      wifeFatherName,
      wifeMotherName,

      fatherName,
      motherName,

      brothers: cleanedBrothers,
      sisters: cleanedSisters,
      children: cleanedChildren
    });

    const savedEmployee = await newEmployee.save();

    res.status(201).json(savedEmployee);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};


// ✅ Get All Employees
exports.getEmployees = async (req, res) => {
  try {
    const employees = await Employee.find().sort({ createdAt: -1 });
    res.json(employees);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};