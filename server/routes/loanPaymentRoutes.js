const router = require("express").Router()

const {payLoan} = require("../controllers/loanPaymentController")

router.post("/",payLoan)

module.exports = router