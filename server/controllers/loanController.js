const Loan = require("../models/Loan")
const {calculateLoan} = require("../utils/loanCalculator")

exports.createLoan = async(req,res)=>{

 const {
 employeeId,
 principalAmount,
 loanType,
 durationMonths
 } = req.body

 const rate = loanType === "normal" ? 15 : 8

 const result = calculateLoan(principalAmount,rate,durationMonths)

 const loan = new Loan({

  employeeId,
  loanType,
  principalAmount,
  interestRate:rate,
  durationMonths,

  totalAmount:result.totalAmount,
  monthlyPayment:result.monthlyPayment,
  remainingAmount:result.totalAmount

 })

 await loan.save()

 res.json(loan)

}