const Employee = require("../models/Employees");
const bcrypt = require("bcryptjs");

exports.login = async (req, res) => {
  try {
    const { memberId, password } = req.body;

    const user = await Employee.findOne({ memberId });

    if (!user) {
      return res.status(404).json({ message: "Member not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Incorrect password" });
    }

    res.status(200).json({
      message: "Login successful ✅",
      user: {
        id: user._id,
        memberId: user.memberId,
        name: user.name
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};