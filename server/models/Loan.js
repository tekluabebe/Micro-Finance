const mongoose = require("mongoose")

const LoanSchema = new mongoose.Schema({

 employeeId:{
  type:mongoose.Schema.Types.ObjectId,
  ref:"Employee"
 },

 loanType:{
  type:String,
  enum:["normal","holiday"]
 },

 principalAmount:Number,
 interestRate:Number,
 durationMonths:Number,

 totalAmount:Number,
 monthlyPayment:Number,

 remainingAmount:Number,

 totalPaid:{
  type:Number,
  default:0
 }

})

module.exports = mongoose.model("Loan",LoanSchema)