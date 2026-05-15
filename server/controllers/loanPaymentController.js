const LoanPayment = require("../models/LoanPayment")
const Loan = require("../models/Loan")

exports.payLoan = async(req,res)=>{

 const {loanId,employeeId,amountPaid,isLate} = req.body

 let penalty = 0

 if(isLate){
 penalty = amountPaid * 0.03
 }

 const payment = new LoanPayment({

 loanId,
 employeeId,
 amountPaid,
 penalty

 })

 await payment.save()

 const loan = await Loan.findById(loanId)

 loan.totalPaid += amountPaid
 loan.remainingAmount -= amountPaid

 await loan.save()

 res.json(payment)

}