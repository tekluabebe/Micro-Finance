exports.calculateLoan = (principal,rate,months)=>{

 const r = rate / 100
 const t = months / 12

 const totalAmount = principal * Math.pow((1+r),t)

 const monthlyPayment = totalAmount / months

 return{
  totalAmount,
  monthlyPayment
 }

}