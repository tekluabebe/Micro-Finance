const router = require("express").Router();
const { createDeposit } = require("../controllers/depositController");

router.post("/", createDeposit);

module.exports = router;

router.delete("/employee/:employeeId", async (req, res) => {
  try {
    const { employeeId } = req.params;

    await Deposit.deleteMany({ employeeId });

    res.json({
      success: true,
      message: "All employee deposits deleted",
    });

  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});