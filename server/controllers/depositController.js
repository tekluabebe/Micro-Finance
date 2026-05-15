const Deposit = require("../models/Deposit");
const mongoose = require("mongoose");

exports.createDeposit = async (req, res) => {
  try {
    console.log("REQ BODY:", req.body);

    const {
      employeeId,
      month,
      year,
      normalSaving,
      voluntarySaving,
      sharedPurchase
    } = req.body;

    if (!employeeId || !month || !year) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // ✅ FIX: convert to ObjectId
    const deposit = new Deposit({
      employeeId: new mongoose.Types.ObjectId(employeeId),
      month,
      year,
      normalSaving,
      voluntarySaving,
      sharedPurchase,
      totalDeposit:
        Number(normalSaving || 0) +
        Number(voluntarySaving || 0) +
        Number(sharedPurchase || 0)
    });

    await deposit.save();

    res.status(201).json({
      message: "Deposit saved successfully"
    });

  } catch (error) {
    console.error("DEPOSIT ERROR:", error);
    res.status(500).json({
      message: error.message
    });
  }
};