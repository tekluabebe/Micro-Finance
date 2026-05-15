const mongoose = require("mongoose");

const EmployeeSchema = new mongoose.Schema({
  memberId: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String
  },
  password: {
    type: String,
    required: true
  }
});

module.exports = mongoose.model("Employee", EmployeeSchema);