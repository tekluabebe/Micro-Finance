const Withdrawal = require("../models/Withdrawal")

exports.createWithdrawal = async(req,res)=>{

 const withdrawal = new Withdrawal(req.body)

 await withdrawal.save()

 res.json(withdrawal)

}