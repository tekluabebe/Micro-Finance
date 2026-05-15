const router = require("express").Router()

const {createWithdrawal} = require("../controllers/withdrawalController")

router.post("/",createWithdrawal)

module.exports = router