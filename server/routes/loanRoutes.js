const router = require("express").Router()

const {createLoan} = require("../controllers/loanController")

router.post("/",createLoan)

module.exports = router