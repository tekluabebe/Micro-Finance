const mongoose = require("mongoose")

const LoanTakenSchema = new mongoose.Schema({

 employeeId:{
  type:mongoose.Schema.Types.ObjectId,
  ref:"Employee"
 },

 personName:String,

 principalAmount:Number,
 interestAmount:Number,

 date:{
  type:Date,
  default:Date.now
 }

})

module.exports = mongoose.model("LoanTaken",LoanTakenSchema)