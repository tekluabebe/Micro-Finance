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
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Employee",
    required: true
  },
  month: String,
  year: String,
  normalSaving: Number,
  voluntarySaving: Number,
  sharedPurchase: Number,
  
 
}, { timestamps: true });

const Deposit = mongoose.model("Deposit", depositSchema);

// =======================
// WITHDRAWAL SCHEMA
// =======================
const withdrawalSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Employee",
    required: true
  },
  fullName: String,
  totalSaving: Number,
  reason: String,
}, { timestamps: true });

const Withdrawal = mongoose.model("Withdrawal", withdrawalSchema);

// CREATE withdrawal
app.post("/api/withdrawals", async (req, res) => {
  try {
    const withdrawal = new Withdrawal(req.body);
    await withdrawal.save();
    res.json(withdrawal);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// =======================
// DELETE TERMINATED (PERMANENT)
// =======================
// DELETE TERMINATED (PERMANENT)
app.delete("/api/terminated/:id", async (req, res) => {
  try {
    await Terminated.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted permanently" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});
// =======================
// TERMINATED SCHEMA (FIX)
// =======================
// =======================
// TERMINATED SCHEMA (REQUIRED FIX)
// =======================
const terminatedSchema = new mongoose.Schema({
  employeeData: Object,
  totalSaving: Number,
  reason: String,
  terminatedAt: {
    type: Date,
    default: Date.now
  }
});

const Terminated = mongoose.model("Terminated", terminatedSchema);

// =======================
// LOAN SCHEMA (NEW FIX)
// =======================
const loanSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Employee",
    required: true
  },
  principalAmount: Number,
  loanType: String,
  durationMonths: String,
   isRead: {
    type: Boolean,
    default: false
  },

  status: {
  type: String,
  enum: ["pending", "approved", "rejected"],
  default: "pending"
},
remainingAmount: {
  type: Number
}
}, { timestamps: true });

const Loan = mongoose.model("Loan", loanSchema);


// =======================
// EMPLOYEE ROUTES
// =======================

// GET employees
app.get("/api/employees", async (req, res) => {
  try {
    const employees = await Employee.find();
    res.json(employees);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// CREATE employee
app.post("/api/employees", async (req, res) => {
  try {
    const emp = new Employee(req.body);
    await emp.save();
    res.json(emp);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE employee
app.put("/api/employees/:id", async (req, res) => {
  try {
    const emp = await Employee.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(emp);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE employee + related data
app.delete("/api/employees/:id", async (req, res) => {
  try {
    const employeeId = req.params.id;

    // delete employee
    await Employee.findByIdAndDelete(employeeId);

    // delete related data
    await Deposit.deleteMany({ employeeId });
    await Loan.deleteMany({ employeeId });

    // 👉 ADD THIS ONLY IF YOU HAVE Withdrawal model
    // await Withdrawal.deleteMany({ employeeId });

    res.json({ message: "Employee fully deleted" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// =======================
// DEPOSIT ROUTES
// =======================

// CREATE deposit
app.post("/api/deposits", async (req, res) => {
  try {
    const deposit = new Deposit(req.body);
    await deposit.save();
    res.json(deposit);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET deposits
app.get("/api/deposits", async (req, res) => {
  try {
    const deposits = await Deposit.find().populate("employeeId");
    res.json(deposits);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// =======================
// LOAN ROUTES (FIX 404 ERROR)
// =======================

// CREATE LOAN
// CREATE LOAN
app.post("/api/loans", async (req, res) => {
  try {
    const { employeeId, principalAmount, loanType, durationMonths } = req.body;

    // Validation
    if (!employeeId || !principalAmount || !durationMonths) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Check active loan
    const existingLoan = await Loan.findOne({
      employeeId,
      status: "approved",
      remainingAmount: { $gt: 0 }
    });

    if (existingLoan) {
      return res.status(400).json({
        message: "You can't create a new loan unless the previous loan is fully paid"
      });
    }

    const newLoan = new Loan({
      employeeId,
      principalAmount: Number(principalAmount),
      loanType,
      durationMonths,
      status: "pending",
      remainingAmount: Number(principalAmount)
    });

    await newLoan.save();

    res.status(201).json(newLoan);

  } catch (err) {
    console.error("CREATE LOAN ERROR:", err);
    res.status(500).json({ message: err.message });
  }
});

// MARK LOAN AS READ
app.put("/api/loans/:id/read", async (req, res) => {
  try {
    const loan = await Loan.findByIdAndUpdate(
      req.params.id,
      { isRead: true },
      { new: true }
    );

    res.json(loan);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =======================
// APPROVE LOAN
// APPROVE
app.put("/api/loans/:id/approve", async (req, res) => {
  try {
    const loan = await Loan.findByIdAndUpdate(
      req.params.id,
      { status: "active", isRead: true },
      { new: true }
    );
    res.json(loan);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// REJECT
app.put("/api/loans/:id/reject", async (req, res) => {
  try {
    const loan = await Loan.findByIdAndUpdate(
      req.params.id,
      { status: "Rejected", isRead: true },
      { new: true }
    );
    res.json(loan);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// MARK WITHDRAWAL AS READ
app.put("/api/withdrawals/:id/read", async (req, res) => {
  try {
    const withdrawal = await Withdrawal.findByIdAndUpdate(
      req.params.id,
      { isRead: true },
      { new: true }
    );
    res.json(withdrawal);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// APPROVE WITHDRAWAL
app.put("/api/withdrawals/:id/approve", async (req, res) => {
  try {
    await Withdrawal.findByIdAndDelete(req.params.id);
    res.json({ message: "Approved & removed" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// REJECT WITHDRAWAL
app.put("/api/withdrawals/:id/reject", async (req, res) => {
  try {
    const withdrawal = await Withdrawal.findByIdAndUpdate(
      req.params.id,
      { status: "Rejected", isRead: true },
      { new: true }
    );
    res.json(withdrawal);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET ALL LOANS
app.get("/api/loans", async (req, res) => {
  try {
    const loans = await Loan.find().populate("employeeId");
    res.json(loans);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET LOANS BY EMPLOYEE
app.get("/api/loans/employee/:id", async (req, res) => {
  try {
    const loans = await Loan.find({ employeeId: req.params.id });
    res.json(loans);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/loans", async (req, res) => {
  try {
    await Loan.deleteMany({});
    res.send("All loans deleted");
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =======================
// DASHBOARD API
// =======================
app.get("/api/dashboard", async (req, res) => {
  try {
    const employeesCount = await Employee.countDocuments();
    const deposits = await Deposit.find();

    const totalSavings = deposits.reduce((sum, d) => {
      return sum + (Number(d.normalSaving) || 0) + (Number(d.voluntarySaving) || 0);
    }, 0);

    const activeLoans = await Loan.countDocuments();

    const now = new Date();
    const currentMonth = now.toLocaleString("en-US", { month: "long" });
    const currentYear = now.getFullYear().toString();

    const monthlyDeposits = deposits
      .filter(d => d.month === currentMonth && d.year === currentYear)
      .reduce((sum, d) => {
        return sum + (Number(d.normalSaving) || 0) + (Number(d.voluntarySaving) || 0);
      }, 0);

    res.json({
      employees: employeesCount,
      totalSavings,
      activeLoans,
      monthlyDeposits
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// =======================
// MONTHLY SAVINGS CHART
// =======================
app.get("/api/dashboard/monthly-savings", async (req, res) => {
  try {
    const deposits = await Deposit.find();
    const map = {};

    deposits.forEach(d => {
      const key = `${d.month} ${d.year}`;
      const total = (Number(d.normalSaving) || 0) + (Number(d.voluntarySaving) || 0);

      map[key] = (map[key] || 0) + total;
    });

    const result = Object.keys(map).map(k => ({
      month: k,
      total: map[k]
    }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// SAVE TERMINATED EMPLOYEE
// SAVE TERMINATED EMPLOYEE

// SAVE TERMINATED EMPLOYEE
app.post("/api/terminated", async (req, res) => {
  try {
    const terminated = new Terminated(req.body); // ✅ FIXED
    await terminated.save();
    res.json(terminated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// GET TERMINATED EMPLOYEES
app.get("/api/terminated", async (req, res) => {
  try {
    const data = await Terminated.find().sort({ terminatedAt: -1 });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// GET TERMINATED EMPLOYEES



// =======================
// START SERVER
// =======================
const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));