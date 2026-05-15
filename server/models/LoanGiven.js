const mongoose = require("mongoose")

const LoanGivenSchema = new mongoose.Schema({

 employeeId:{
  type:mongoose.Schema.Types.ObjectId,
  ref:"Employee"
 },

 personName:String,
 amount:Number,

 date:{
  type:Date,
  default:Date.now
 }

})

module.exports = mongoose.model("LoanGiven",LoanGivenSchema)