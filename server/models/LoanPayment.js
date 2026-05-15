const mongoose = require("mongoose")

const LoanPaymentSchema = new mongoose.Schema({

 loanId:{
  type:mongoose.Schema.Types.ObjectId,
  ref:"Loan"
 },

 employeeId:{
  type:mongoose.Schema.Types.ObjectId,
  ref:"Employee"
 },

 amountPaid:Number,
 penalty:Number,

 paymentDate:{
  type:Date,
  default:Date.now
 }

})

module.exports = mongoose.model("LoanPayment",LoanPaymentSchema)