const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// =======================
// CONNECT TO MONGODB
// =======================
mongoose.connect("mongodb://127.0.0.1:27017/microfinance", {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log("MongoDB Connected"))
.catch(err => console.error(err));

// =======================
// EMPLOYEE SCHEMA
// =======================
const employeeSchema = new mongoose.Schema({
  memberId: String,
  firstName: String,
  lastName: String,
  gender: String,
  phone: String,
  maritalStatus: String,
  role: String,
  password: String,

  wifeName: String,
  wifeFatherName: String,
  wifeMotherName: String,
  husbandName: String,
  husbandFatherName: String,
  husbandMotherName: String,
  fatherName: String,
  motherName: String,
  brothers: [String],
  sisters: [String],
  children: [String]

}, { timestamps: true });

const Employee = mongoose.model("Employee", employeeSchema);

// =======================
// DEPOSIT SCHEMA
// =======================
const depositSchema = new mongoose.Schema({
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", required: true },
  month: String,
  year: String,
  normalSaving: Number,
  voluntarySaving: Number,
  sharedPurchase: Number
}, { timestamps: true });

const Deposit = mongoose.model("Deposit", depositSchema);

// =======================
// WITHDRAWAL SCHEMA
// =======================
const withdrawalSchema = new mongoose.Schema({
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", required: true },
  fullName: String,
  totalSaving: Number,
  reason: String,
  isRead: { type: Boolean, default: false },
  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending"
  }
}, { timestamps: true });

const Withdrawal = mongoose.model("Withdrawal", withdrawalSchema);

// =======================
// TERMINATED SCHEMA
// =======================
const terminatedSchema = new mongoose.Schema({
  employeeData: Object,
  totalSaving: Number,
  reason: String,
  terminatedAt: { type: Date, default: Date.now }
});

const Terminated = mongoose.model("Terminated", terminatedSchema);

// =======================
// LOAN SCHEMA (UPDATED)
// =======================
const loanSchema = new mongoose.Schema({
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", required: true },
  principalAmount: Number,
  loanType: String,
  durationMonths: String,
    guarantorId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "Employee",
  required: true
},

  isRead: { type: Boolean, default: false },

  status: {
    type: String,
    enum: ["pending", "approved", "rejected", "completed"], // ✅ FIX
    default: "pending"
  },

  remainingAmount: Number

}, { timestamps: true });

const Loan = mongoose.model("Loan", loanSchema);

// =======================
// LOAN PAYMENT SCHEMA
// =======================
const loanPaymentSchema = new mongoose.Schema({
  loanId: { type: mongoose.Schema.Types.ObjectId, ref: "Loan", required: true },
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", required: true },
  amountPaid: Number,
  penalty: { type: Number, default: 0 },
  totalPaid: Number
}, { timestamps: true });

const LoanPayment = mongoose.model("LoanPayment", loanPaymentSchema);

// =======================
// EMPLOYEE ROUTES
// =======================
app.get("/api/employees", async (req, res) => {
  res.json(await Employee.find());
});

app.post("/api/employees", async (req, res) => {
  const emp = new Employee(req.body);
  await emp.save();
  res.json(emp);
});

app.put("/api/employees/:id", async (req, res) => {
  const emp = await Employee.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(emp);
});

app.delete("/api/employees/:id", async (req, res) => {
  const id = req.params.id;

  await Employee.findByIdAndDelete(id);
  await Deposit.deleteMany({ employeeId: id });
  await Loan.deleteMany({ employeeId: id });
  await Withdrawal.deleteMany({ employeeId: id });

  res.json({ message: "Employee fully deleted" });
});

// =======================
// DEPOSIT ROUTES
// =======================
// =======================
// DEPOSIT ROUTES
// =======================
// =======================
// DEPOSIT ROUTES
// =======================

app.post("/api/deposits", async (req, res) => {
  const d = new Deposit(req.body);
  await d.save();
  res.json(d);
});

app.get("/api/deposits", async (req, res) => {
  const data = await Deposit.find().populate("employeeId");
  res.json(data);
});

// DELETE ALL DEPOSITS
app.delete("/api/deposits", async (req, res) => {
  try {

    await Deposit.deleteMany({});

    res.json({
      success: true,
      message: "All deposits deleted successfully"
    });

  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});
// =======================
// WITHDRAWAL ROUTES
// =======================
app.post("/api/withdrawals", async (req, res) => {
  const w = new Withdrawal(req.body);
  await w.save();
  res.json(w);
});

app.put("/api/withdrawals/:id/read", async (req, res) => {
  const w = await Withdrawal.findByIdAndUpdate(req.params.id, { isRead: true }, { new: true });
  res.json(w);
});

app.put("/api/withdrawals/:id/approve", async (req, res) => {
  const w = await Withdrawal.findByIdAndUpdate(
    req.params.id,
    { status: "approved", isRead: true },
    { new: true }
  );
  res.json(w);
});



app.put("/api/withdrawals/:id/reject", async (req, res) => {
  const w = await Withdrawal.findByIdAndUpdate(
    req.params.id,
    { status: "rejected", isRead: true },
    { new: true }
  );
  res.json(w);
});

// =======================
// LOAN ROUTES
// =======================

// CREATE LOAN
app.post("/api/loans", async (req, res) => {
  try {
    const {
      employeeId,
      guarantorId, // ✅ NEW
      principalAmount,
      loanType,
      durationMonths
    } = req.body;

    // =========================
    // ✅ BASIC VALIDATION
    // =========================
    if (!employeeId || !guarantorId || !principalAmount || !durationMonths) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // ❌ borrower cannot guarantee himself
    if (employeeId === guarantorId) {
      return res.status(400).json({
        message: "Employee cannot be their own guarantor ❌"
      });
    }

    // =========================
    // ✅ EXISTING RULE (KEEPED)
    // =========================
    const existingLoan = await Loan.findOne({
      employeeId,
      loanType,
      status: "approved",
      remainingAmount: { $gt: 0 }
    });

    if (existingLoan) {
      return res.status(400).json({
        message: `Cannot create ${loanType} loan ❌. Please fully pay previous ${loanType} loan first.`
      });
    }

    // =========================
    // 🚀 GUARANTOR RULES
    // =========================

    // 1. ❌ guarantor has unpaid personal loan
    const guarantorOwnLoan = await Loan.findOne({
      employeeId: guarantorId,
      status: "approved",
      remainingAmount: { $gt: 0 }
    });

    if (guarantorOwnLoan) {
      return res.status(400).json({
        message: "Guarantor has unpaid loan ❌"
      });
    }

    // 2. ❌ guarantor already guaranteeing too many loans
    const activeGuarantees = await Loan.countDocuments({
      guarantorId: guarantorId,
      status: "approved",
      remainingAmount: { $gt: 0 }
    });

    if (activeGuarantees >= 2) {
      return res.status(400).json({
        message: "Guarantor already supports 2 active loans ❌"
      });
    }

    // =========================
    // ✅ CREATE LOAN
    // =========================
    const newLoan = new Loan({
      employeeId,
      guarantorId, // ✅ SAVE IT
      principalAmount: Number(principalAmount),
      loanType,
      durationMonths,
      status: "pending",
      remainingAmount: Number(principalAmount)
    });

    await newLoan.save();

    res.status(201).json(newLoan);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get("/api/loans/guarantor-status/:id", async (req, res) => {
  try {
    const id = req.params.id;

    const activeGuarantees = await Loan.countDocuments({
      guarantorId: id,
      status: "approved",
      remainingAmount: { $gt: 0 }
    });

    const unpaidLoan = await Loan.findOne({
      employeeId: id,
      status: "approved",
      remainingAmount: { $gt: 0 }
    });

    res.json({
      activeGuarantees,
      hasUnpaidLoan: !!unpaidLoan
    });

  } catch (err) {
    res.status(500).json({ message: "Error" });
  }
});
// APPROVE
app.put("/api/loans/:id/approve", async (req, res) => {
  const loan = await Loan.findByIdAndUpdate(
    req.params.id,
    { status: "approved", isRead: true },
    { new: true }
  );
  res.json(loan);
});

// REJECT
app.put("/api/loans/:id/reject", async (req, res) => {
  const loan = await Loan.findByIdAndUpdate(
    req.params.id,
    { status: "rejected", isRead: true },
    { new: true }
  );
  res.json(loan);
});

// =======================
// LOAN PAYMENT (NEW)
// =======================
app.post("/api/loan-payments", async (req, res) => {
  try {
    const { loanId, employeeId, amountPaid, penalty } = req.body;

    // =======================
    // VALIDATION
    // =======================
    if (!loanId || !employeeId || amountPaid == null) {
      return res.status(400).json({ message: "Missing required fields ❌" });
    }

    const paymentAmount = Number(amountPaid);
    const penaltyAmount = Number(penalty || 0);

    if (isNaN(paymentAmount)) {
      return res.status(400).json({ message: "Invalid amountPaid ❌" });
    }

    const loan = await Loan.findById(loanId);

    if (!loan) return res.status(404).json({ message: "Loan not found ❌" });

    if (loan.status !== "approved") {
      return res.status(400).json({ message: "Loan is not active ❌" });
    }

    const principal = Number(loan.principalAmount);

    // =======================
    // CALCULATIONS
    // =======================
    let monthlyPayment = 0;
    let principalPart = 0;

    if (loan.loanType === "holiday") {
      const total = principal + principal * 0.08;
      monthlyPayment = total / 6;
      principalPart = principal / 6;

      // enforce correct payment
      if (paymentAmount < monthlyPayment) {
        return res.status(400).json({
          message: `Minimum payment is ${monthlyPayment.toFixed(2)} birr ❌`
        });
      }

    } else {
      const total = principal * Math.pow(1.12, 1);
      monthlyPayment = total / 12;
      principalPart = total / 12;

      if (paymentAmount < monthlyPayment) {
        return res.status(400).json({
          message: `Minimum payment is ${monthlyPayment.toFixed(2)} birr ❌`
        });
      }
    }

    const totalPayment = paymentAmount + penaltyAmount;

    // =======================
    // UPDATE LOAN
    // =======================
    loan.remainingAmount = Math.max(
      0,
      loan.remainingAmount - principalPart
    );

    if (loan.remainingAmount === 0) {
      loan.status = "completed";
    }

    await loan.save();

    // =======================
    // SAVE PAYMENT
    // =======================
    const payment = new LoanPayment({
      loanId,
      employeeId,
      amountPaid: paymentAmount,
      penalty: penaltyAmount,
      totalPaid: totalPayment
    });

    await payment.save();

    return res.json({
      message: "Payment successful ✅",
      remainingPrincipal: loan.remainingAmount,
      monthlyPayment,
      status: loan.status
    });

  } catch (err) {
    console.error("LOAN PAYMENT ERROR:", err);
    res.status(500).json({ message: err.message });
  }
});
// =======================
// GET LOANS
// =======================
app.get("/api/loans", async (req, res) => {
  const loans = await Loan.find().populate("employeeId");
  res.json(loans);
});

app.get("/api/loans/employee/:id", async (req, res) => {
  const loans = await Loan.find({ employeeId: req.params.id });
  res.json(loans);
});

// =======================
// DASHBOARD
// =======================
app.get("/api/dashboard", async (req, res) => {
  const employeesCount = await Employee.countDocuments();
  const deposits = await Deposit.find();

  const totalSavings = deposits.reduce((sum, d) => {
    return sum + (d.normalSaving || 0) + (d.voluntarySaving || 0);
  }, 0);

  const activeLoans = await Loan.countDocuments({
    status: "approved",
    remainingAmount: { $gt: 0 }

  });

  res.json({
    employees: employeesCount,
    totalSavings,
    activeLoans
  });
});

// =======================
// TERMINATED
// =======================
app.post("/api/terminated", async (req, res) => {
  const t = new Terminated(req.body);
  await t.save();
  res.json(t);
});

app.get("/api/terminated", async (req, res) => {
  const data = await Terminated.find().sort({ terminatedAt: -1 });
  res.json(data);
});

app.delete("/api/terminated/:id", async (req, res) => {
  await Terminated.findByIdAndDelete(req.params.id);
  res.json({ message: "Deleted permanently" });
});

// =======================
// START SERVER
// =======================
const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));