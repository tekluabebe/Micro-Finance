const mongoose = require("mongoose");

const DepositSchema = new mongoose.Schema({

  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Employee",
    required: true
  },

  month: String,
  year: Number,

  normalSaving: Number,
  voluntarySaving: Number,
  sharedPurchase: Number,
  totalDeposit: Number

});

module.exports = mongoose.model("Deposit", DepositSchema);