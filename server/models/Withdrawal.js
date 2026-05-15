const mongoose = require("mongoose")

const WithdrawalSchema = new mongoose.Schema({

 employeeId:{
  type:mongoose.Schema.Types.ObjectId,
  ref:"Employee"
 },

 amount:Number,
 reason:String,

 date:{
  type:Date,
  default:Date.now
 }

})

module.exports = mongoose.model("Withdrawal",WithdrawalSchema)