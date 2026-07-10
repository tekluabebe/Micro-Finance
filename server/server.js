const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

app.use(express.urlencoded({ extended: true }));

//app.use("/api/reports", reportsRoutes);
// =======================
// CONNECT TO MONGODB
// =======================
// =======================
// CONNECT TO MONGODB ATLAS
// =======================
// <db_password> በሚለው ቦታ የአንተን ዳታቤዝ ፓስወርድ መተካት እንዳትረሳ!
const ATLAS_URI = "mongodb+srv://myproject:%25TGBnhy6@cluster0.kzx9prr.mongodb.net/microfinance?retryWrites=true&w=majority&appName=Cluster0";

mongoose.connect(ATLAS_URI)
.then(() => console.log("MongoDB Atlas Connected ✅"))
.catch((err) => console.error("MongoDB Connection Error ❌:", err));

// =======================
// EMPLOYEE SCHEMA
// =======================
const employeeSchema = new mongoose.Schema({

  memberId: { type: String, required: true, unique: true },
  category: { type: String, required: true },
  age: Number,
  birthDate: Date,
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

const Employee = mongoose.model(
  "Employee",
  employeeSchema
);


// =======================
// PASSWORD RESET REQUEST
// =======================
const passwordResetRequestSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Employee",
    required: true
  },

  memberId: {
    type: String,
    required: true
  },

  fullName: String,

  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending"
  },

  requestedAt: {
    type: Date,
    default: Date.now
  },
  isRead: {
  type: Boolean,
  default: false
},

}, { timestamps: true });

const PasswordResetRequest = mongoose.model(
  "PasswordResetRequest",
  passwordResetRequestSchema
);

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

  normalSaving: {
    type: Number,
    default: 0
  },

  voluntarySaving: {
    type: Number,
    default: 0
  },

  sharedPurchase: {
    type: Number,
    default: 0
  },

  // NEW
  registrationFee: {
    type: Number,
    default: 0
  },

  // NEW
  latePenalty: {
    type: Number,
    default: 0
  }

}, { timestamps: true });

const Deposit = mongoose.model(
  "Deposit",
  depositSchema
);

// =======================
// REGISTRATION FEE SCHEMA
// =======================
const registrationFeeSchema = new mongoose.Schema({

  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Employee"
  },

  amount: {
    type: Number,
    default: 0
  },

  month: String,

  year: String

}, { timestamps: true });

const RegistrationFee = mongoose.model(
  "RegistrationFee",
  registrationFeeSchema
);

// =======================
// LATE PENALTY SCHEMA
// =======================
const latePenaltySchema = new mongoose.Schema({

  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Employee"
  },

  amount: {
    type: Number,
    default: 0
  },

  month: String,

  year: String

}, { timestamps: true });

const LatePenalty = mongoose.model(
  "LatePenalty",
  latePenaltySchema
);

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

  isRead: {
    type: Boolean,
    default: false
  },

  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending"
  }

}, { timestamps: true });

const Withdrawal = mongoose.model(
  "Withdrawal",
  withdrawalSchema
);

// =======================
// TERMINATED SCHEMA
// =======================
const terminatedSchema = new mongoose.Schema({
  memberId: String,
  fullName: String,
  totalSaving: Number,
  reason: String,
  terminatedAt: {
    type: Date,
    default: Date.now
  }
});

const Terminated = mongoose.model(
  "Terminated",
  terminatedSchema
);

// =======================
// LOAN SCHEMA
// =======================
const loanSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Employee",
    required: true
  },

  principalAmount: {
    type: Number,
    required: true
  },

  interestRate: {
    type: Number,
    default: 0
  },

  totalAmount: {
    type: Number,
    required: true
  },

  loanType: String,
  durationMonths: String,

  guarantors: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Employee"
  }],

  isRead: {
    type: Boolean,
    default: false
  },

  status: {
    type: String,
    enum: ["pending", "approved", "rejected", "completed"],
    default: "pending"
  },

  remainingAmount: {
    type: Number,
    required: true
  }

}, { timestamps: true });

const Loan = mongoose.model("Loan", loanSchema);
// =======================
// LOAN PAYMENT SCHEMA
// =======================
const loanPaymentSchema = new mongoose.Schema({
  loanId: { type: mongoose.Schema.Types.ObjectId, ref: "Loan", required: true },
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", required: true },
  
  // አዲስ የተጨመሩ መስኮች
  monthYear: { type: String, required: true }, // ለምሳሌ "May 2026"
  amountPaid: Number,      // የተከፈለ Principal
  interestPaid: Number,    // የተከፈለ የወለድ ድርሻ
  penalty: { type: Number, default: 0 },
  totalPaid: Number        // (amountPaid + interestPaid + penalty)
}, { timestamps: true });

const LoanPayment = mongoose.model(
  "LoanPayment",
  loanPaymentSchema
);



// =======================
// AUTH ROUTES (ይህንን ጨምር)
// =======================
// =======================
// AUTH ROUTES (የተስተካከለ ስሪት - Case Insensitive)
// =======================
// =======================
// AUTH LOGIN
// =======================
app.post("/api/auth/login", async (req, res) => {
  try {
    const { memberId, password, role } = req.body;

    const user = await Employee.findOne({ memberId });

    if (!user) {
      return res.status(401).json({ message: "Member not found ❌" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: "Incorrect password ❌" });
    }

    if (user.role.toLowerCase() !== role.toLowerCase()) {
      return res.status(401).json({ message: "Wrong role ❌" });
    }

  res.json({
    success:true,
  
  user:{
    memberId: user.memberId,
    fullName: user.fullName,
    role: user.role
  }
});

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


// =======================
// EMPLOYEE ROUTES
// =======================
function calculateAge(birthDate) {
  if (!birthDate) return 0;

  const today = new Date();
  const birth = new Date(birthDate);

  let age = today.getFullYear() - birth.getFullYear();

  const m = today.getMonth() - birth.getMonth();

  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }

  return age;
}

app.get("/api/employees", async (req, res) => {
  try {

    const employees = await Employee.find();

    for (const emp of employees) {

      const age = calculateAge(emp.birthDate);
      const category = age >= 18 ? "Adult" : "Child";

      if (emp.age !== age || emp.category !== category) {
        emp.age = age;
        emp.category = category;
        await emp.save();
      }
    }

    const updatedEmployees = await Employee.find();

    res.json(updatedEmployees);

  } catch (err) {
    res.status(500).json({
      message: err.message
    });
  }
});

const bcrypt = require("bcryptjs");

app.post("/api/employees", async (req, res) => {
  try {
    const { password, birthDate, memberId } = req.body;

    // 1. Check duplicate memberId
    const exists = await Employee.findOne({ memberId });
    if (exists) {
      return res.status(400).json({ message: "duplicate memberId" });
    }

    // 2. Validate password
    if (!password) {
      return res.status(400).json({ message: "Password required" });
    }

    // 3. Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 4. Calculate age (BACKEND ONLY)
    let age = 0;
    let category = "Child";

    if (birthDate) {
      const today = new Date();
      const birth = new Date(birthDate);

      age = today.getFullYear() - birth.getFullYear();

      const m = today.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
        age--;
      }

      category = age >= 18 ? "Adult" : "Child";
    }

    // 5. Create employee
 const newEmp = new Employee({
  ...req.body,

  password: hashedPassword,
  age,
  category,
  role: (req.body.role || "member").toLowerCase(),
});

    await newEmp.save();

    res.status(201).json(newEmp);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
//new update
app.put("/api/employees/:id", async (req, res) => {
  try {
    if (req.body.birthDate) {
      const today = new Date();
      const birth = new Date(req.body.birthDate);

      let age = today.getFullYear() - birth.getFullYear();

      const m = today.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
        age--;
      }

      req.body.age = age;
      req.body.category = age >= 18 ? "Adult" : "Child";
    }

    const updated = await Employee.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.put("/api/employees/:id/terminate", async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);

    if (!employee) {
      return res.status(404).json({
        message: "Employee not found"
      });
    }

    const withdrawal = await Withdrawal.findOne({
      employeeId: req.params.id
    }).sort({ createdAt: -1 });

await Terminated.create({
  memberId: employee.memberId,
  fullName: `${employee.firstName} ${employee.lastName}`,
  totalSaving: withdrawal?.totalSaving || 0,
  reason: withdrawal?.reason || "Not specified",
  terminatedAt: new Date()
});

    await Employee.findByIdAndDelete(req.params.id);

    res.json({
      success: true
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: err.message
    });
  }
});

app.delete("/api/employees/:id", async (req, res) => {

  const id = req.params.id;

  await Employee.findByIdAndDelete(id);

  await Deposit.deleteMany({ employeeId: id });

  await RegistrationFee.deleteMany({
    employeeId: id
  });

  await LatePenalty.deleteMany({
    employeeId: id
  });

  await Loan.deleteMany({ employeeId: id });

  await Withdrawal.deleteMany({
    employeeId: id
  });

  res.json({
    message: "Employee fully deleted ✅"
  });
});

// =======================
// DEPOSIT ROUTES
// =======================

// CREATE DEPOSIT
app.post("/api/deposits", async (req, res) => {

  try {

    const d = new Deposit({

      employeeId: req.body.employeeId,

      month: req.body.month,

      year: req.body.year,

      normalSaving:
        Number(req.body.normalSaving) || 0,

      voluntarySaving:
        Number(req.body.voluntarySaving) || 0,

      sharedPurchase:
        Number(req.body.sharedPurchase) || 0,

      registrationFee:
        Number(req.body.registrationFee) || 0,

      latePenalty:
        Number(req.body.latePenalty) || 0

    });

    await d.save();

    // =======================
    // SAVE REGISTRATION FEE
    // =======================
    if (Number(req.body.registrationFee) > 0) {

      const registration =
        new RegistrationFee({

          employeeId: req.body.employeeId,

          amount:
            Number(req.body.registrationFee),

          month: req.body.month,

          year: req.body.year

        });

      await registration.save();
    }

    // =======================
    // SAVE LATE PENALTY
    // =======================
    if (Number(req.body.latePenalty) > 0) {

      const penalty =
        new LatePenalty({

          employeeId: req.body.employeeId,

          amount:
            Number(req.body.latePenalty),

          month: req.body.month,

          year: req.body.year

        });

      await penalty.save();
    }

    res.json({
      message: "Deposit saved successfully ✅",
      deposit: d
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      message: "Error saving deposit ❌"
    });
  }
});

// =======================
// REQUEST PASSWORD RESET
// =======================
app.post("/api/password-reset-request", async (req, res) => {
  try {
    const { memberId } = req.body;

    const employee = await Employee.findOne({ memberId });

    if (!employee) {
      return res.status(404).json({
        message: "Member not found"
      });
    }

    // =========================
    // 🔥 ADMIN FLOW → DIRECT RESET
    // =========================
    if (employee.role?.toLowerCase() === "admin") {

      return res.json({
        success: true,
        isAdmin: true,
        message: "Admin detected. Redirecting to reset page",
        redirect: `/reset-password?memberId=${employee.memberId}`
      });
    }

    // =========================
    // 👤 MEMBER FLOW → NOTIFY ADMIN
    // =========================
    const existing = await PasswordResetRequest.findOne({
      memberId,
      status: "pending"
    });

    if (existing) {
      return res.status(400).json({
        message: "Password reset request already submitted"
      });
    }

    const request = new PasswordResetRequest({
      employeeId: employee._id,
      memberId: employee.memberId,
      fullName: employee.firstName + " " + employee.lastName,
      status: "pending",
      isRead: false
    });

    await request.save();

    res.json({
      success: true,
      isAdmin: false,
      message: "Request sent to admin successfully"
    });

  } catch (err) {
    res.status(500).json({
      message: err.message
    });
  }
});

app.post("/api/auth/admin-reset-password", async (req, res) => {
  try {
    const { memberId, newPassword, requesterRole } = req.body;

    const employee = await Employee.findOne({ memberId });

    if (!employee) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    // =========================
    // 🚨 SECURITY CHECK HERE
    // =========================
    if (employee.role === "admin" && requesterRole !== "admin") {
      return res.status(403).json({
        message: "Not allowed to reset admin password"
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    employee.password = hashedPassword;
    await employee.save();

    res.json({
      success: true,
      message: "Password updated successfully"
    });

  } catch (err) {
    res.status(500).json({
      message: err.message
    });
  }
});

app.get("/api/password-reset-request/unread-count", async (req, res) => {
  const count = await PasswordResetRequest.countDocuments({
    isRead: false
  });

  res.json({ count });
});
// =======================
// GET RESET REQUESTS
// =======================
app.get("/api/password-reset-request", async (req, res) => {
  try {

    const requests =
      await PasswordResetRequest.find()
      .sort({ createdAt: -1 });

    res.json(requests);

  } catch (err) {

    res.status(500).json({
      message: err.message
    });
  }
});

app.put("/api/password-reset-request/:id/read", async (req, res) => {
  const updated = await PasswordResetRequest.findByIdAndUpdate(
    req.params.id,
    { isRead: true },
    { new: true }
  );

  res.json(updated);
});

//const bcrypt = require("bcryptjs");

// RESET PASSWORD
app.post("/api/auth/reset-password", async (req, res) => {
  try {
    const { memberId, newPassword } = req.body;

    console.log("RESET REQUEST:", req.body);

    const employee = await Employee.findOne({ memberId });

    console.log("FOUND EMPLOYEE:", employee);

    if (!employee) {
      return res.status(404).json({
        message: "Employee not found"
      });
    }

    // 🔐 HASH PASSWORD HERE
  const salt = await bcrypt.genSalt(10);
const hashedPassword = await bcrypt.hash(newPassword, salt);

employee.password = hashedPassword;
await employee.save();

    res.json({
      success: true,
      message: "Password reset successfully"
    });

  } catch (err) {
    res.status(500).json({
      message: err.message
    });
  }
});

//const bcrypt = require("bcryptjs");

// =======================
// APPROVE PASSWORD RESET
// =======================
app.put("/api/password-reset-request/:id/approve",
  async (req, res) => {
    try {
      const { id } = req.params;
      const { newPassword } = req.body;

      const request =
        await PasswordResetRequest.findById(id);

      if (!request) {
        return res.status(404).json({
          message: "Request not found",
        });
      }

      const employee =
        await Employee.findOne({
          memberId: request.memberId,
        });

      if (!employee) {
        return res.status(404).json({
          message: "Employee not found",
        });
      }

      // HASH PASSWORD
      const salt = await bcrypt.genSalt(10);
      const hashedPassword =
        await bcrypt.hash(newPassword, salt);

      // SAVE HASHED PASSWORD
      employee.password = hashedPassword;
      await employee.save();

      request.status = "approved";
      request.isRead = true;
      await request.save();

      res.json({
        message:
          "Password reset approved successfully",
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        message: "Server error",
      });
    }
  }
);

// =======================
// REJECT PASSWORD RESET
// =======================
app.put("/api/password-reset-request/:id/reject",
  async (req, res) => {

    try {

      const request =
        await PasswordResetRequest.findById(
          req.params.id
        );

      if (!request) {
        return res.status(404).json({
          message: "Request not found"
        });
      }

      request.status = "rejected";

      await request.save();

      res.json({
        success: true,
        message:
          "Password reset request rejected"
      });

    } catch (err) {

      res.status(500).json({
        message: err.message
      });
    }
  }
);

app.put("/api/password-reset-request/:id/read",
  async (req, res) => {

    const request =
      await PasswordResetRequest.findByIdAndUpdate(
        req.params.id,
        { isRead: true },
        { new: true }
      );

    res.json(request);
  }
);
// GET DEPOSITS
app.get("/api/deposits", async (req, res) => {

  const data = await Deposit.find()
    .populate("employeeId");

  res.json(data);
});

// DELETE ALL DEPOSITS
app.delete("/api/deposits", async (req, res) => {

  await Deposit.deleteMany({});

  await RegistrationFee.deleteMany({});

  await LatePenalty.deleteMany({});

  res.json({
    message: "All deposits deleted ✅"
  });
});

// DELETE EMPLOYEE DEPOSITS
app.delete("/api/deposits/employee/:id", async (req, res) => {

  const employeeId = req.params.id;

  await Deposit.deleteMany({
    employeeId
  });

  await RegistrationFee.deleteMany({
    employeeId
  });

  await LatePenalty.deleteMany({
    employeeId
  });

  res.json({
    message:
      "Employee deposits reset successfully ✅"
  });
});

// =======================
// REGISTRATION FEES ROUTES
// =======================
app.get("/api/registration-fees", async (req, res) => {

  const data = await RegistrationFee.find()
    .populate("employeeId");

  res.json(data);
});

// =======================
// LATE PENALTIES ROUTES
// =======================
app.get("/api/late-penalties", async (req, res) => {

  const data = await LatePenalty.find()
    .populate("employeeId");

  res.json(data);
});

// =======================
// WITHDRAWAL ROUTES
// =======================
app.post("/api/withdrawals", async (req, res) => {
  const w = new Withdrawal(req.body);
  await w.save();
  res.json(w);
});

app.get("/api/withdrawals", async (req, res) => {
  const data = await Withdrawal.find().populate("employeeId");
  res.json(data);
});


app.put("/api/withdrawals/:id/read", async (req, res) => {
  const w = await Withdrawal.findByIdAndUpdate(
    req.params.id,
    { isRead: true },
    { new: true }
  );
  res.json(w);
});

app.get("/api/withdrawals/unread-count", async (req, res) => {
  try {
    const count = await Withdrawal.countDocuments({ isRead: false });
    res.json({ count });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get("/api/withdrawals/filter", async (req, res) => {
  try {
    const { type } = req.query;

    let query = {};

    if (type === "unread") query.isRead = false;
    if (type === "seen") query.isRead = true;
    if (type === "pending") query.status = "pending";
    if (type === "approved") query.status = "approved";
    if (type === "rejected") query.status = "rejected";

    const data = await Withdrawal.find(query)
      .populate("employeeId")
      .sort({ createdAt: -1 });

    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
app.put("/api/withdrawals/:id/approve", async (req, res) => {

  const w = await Withdrawal.findByIdAndUpdate(

    req.params.id,

    {
      status: "approved",
      isRead: true
    },

    { new: true }

  );

  res.json(w);
});

app.put("/api/withdrawals/:id/approve", async (req, res) => {
  try {
    const withdrawal = await Withdrawal.findById(req.params.id);

    if (!withdrawal) {
      return res.status(404).json({ message: "Not found" });
    }

    withdrawal.status = "approved";
    withdrawal.isRead = true;

    await withdrawal.save();

    res.json(withdrawal);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


app.put("/api/withdrawals/:id/reject", async (req, res) => {

  const w = await Withdrawal.findByIdAndUpdate(

    req.params.id,

    {
      status: "rejected",
      isRead: true
    },

    { new: true }

  );

  res.json(w);
});

// =======================
// CREATE LOAN
/// =======================
// LOAN SCHEMA (UPDATED)
// =======================


// =======================
// CREATE LOAN ROUTE (UPDATED)
// =======================
// =======================
// CREATE LOAN (WITH VALIDATION)
// =======================
// ==========================================
// CREATE LOAN (FINAL FULL VERSION)
// ==========================================
// ==========================================
// CREATE LOAN (FINAL FULL VERSION WITH NO-DEPOSIT CHECK)
// ==========================================
// ============================================================
// CREATE LOAN - COMPLETE UPDATED VERSION
// ============================================================
// ==========================================
// CREATE LOAN (BACKEND WITH DETAILED NAMES)
// ==========================================
app.post("/api/loans", async (req, res) => {
  try {
    const { 
      employeeId, 
      guarantors, 
      principalAmount, 
      loanType, 
      durationMonths, 
      totalSaving 
    } = req.body;

    // 1. መሠረታዊ ፊልዶች መኖራቸውን ማረጋገጥ
    if (!employeeId || !principalAmount || !loanType || !durationMonths) {
      return res.status(400).json({ message: "እባክዎ ሁሉንም አስፈላጊ መረጃዎች ይሙሉ ❌" });
    }

    const amount = Number(principalAmount);
    const borrowerSaving = Number(totalSaving || 0);

    // 2. ተመሣሣይ የብድር አይነት ቼክ
    const hasActiveSameTypeLoan = await Loan.findOne({
      employeeId: employeeId,
      loanType: loanType,
      status: "approved",
      remainingAmount: { $gt: 0 }
    });

    if (hasActiveSameTypeLoan) {
      return res.status(400).json({ 
        message: `ያልተከፈለ የ${loanType} ብድር ስላለብዎት፣ ተጨማሪ የ${loanType} ብድር መውሰድ አይችሉም! ❌` 
      });
    }

    
    // 3. የዋስትና ህጎች (ስማቸውን ለይቶ ለማውጣት)
    const gap = amount - borrowerSaving;

    if (gap > 0) {
      if (!guarantors || guarantors.length === 0) {
        return res.status(400).json({ 
          message: `ብድሩ ከቁጠባዎ በ ${gap} ብር ስለሚበልጥ ዋስ ማስገባት ግዴታ ነው! ❌` 
        });
      }

      let overLimitNames = []; // ለ 2 ሰው ዋስ የሆኑ
      let hasLoanNames = [];   // እራሳቸው ብድር ያለባቸው
      let totalGuarantorsSavingSum = 0;

      for (const gId of guarantors) {
        // የዋሱን ስም ለማግኘት
        const guarantorInfo = await Employee.findById(gId);
        const fullName = guarantorInfo ? `${guarantorInfo.firstName} ${guarantorInfo.lastName}` : "ያልታወቀ ዋስ";

        // i. ዋሱ እራሱ ብድር ካለበት
        const guarantorHasLoan = await Loan.findOne({
          employeeId: gId,
          status: "approved",
          remainingAmount: { $gt: 0 }
        });
        if (guarantorHasLoan) {
          hasLoanNames.push(fullName);
        }

        // ii. ዋሱ አስቀድሞ ለ 2 ብድሮች ዋስ መሆኑን መፈተሽ
        const activeGuaranteesCount = await Loan.countDocuments({
          guarantors: gId,
          status: "approved",
          remainingAmount: { $gt: 0 }
        });
        if (activeGuaranteesCount >= 2) {
          overLimitNames.push(fullName);
        }

        // iii. ቁጠባቸውን መደመር
        const guarantorDeposits = await Deposit.find({ employeeId: gId });
        const individualSum = guarantorDeposits.reduce((sum, d) => 
          sum + (d.normalSaving || 0) + (d.voluntarySaving || 0), 0
        );
        totalGuarantorsSavingSum += individualSum;
      }

      // --- ስህተቶቹን አቀናጅቶ መላክ ---
      if (overLimitNames.length > 0 || hasLoanNames.length > 0) {
        let errorParts = [];
        
        if (overLimitNames.length > 0) {
          errorParts.push(`${overLimitNames.join(", ")} አስቀድሞ ለ 2 ብድሮች ዋስ ስለሆነ/ስለሆኑ ተጨማሪ ዋስትና መስጠት አይችልም/አይችሉም! ❌`);
        }
        if (hasLoanNames.length > 0) {
          errorParts.push(`${hasLoanNames.join(", ")} ያልተከፈለ ብድር ስላለበት/ስላለባቸው ዋስ መሆን አይችልም/አይችሉም! ❌`);
        }

        return res.status(400).json({ message: errorParts.join("\n") });
      }

      // iv. የቁጠባ ድምር ማረጋገጫ
      if (totalGuarantorsSavingSum < gap) {
        return res.status(400).json({ 
          message: `የዋሶቹ ጠቅላላ ቁጠባ (${totalGuarantorsSavingSum} ብር) ከሚያስፈልገው ${gap} ብር ያነሰ ነው! ❌` 
        });
      }
    }

    // 4. ብድሩን መመዝገብ
// 4. ብድሩን መመዝገብ

let interestRate;
let totalAmount;

// =========================
// NORMAL LOAN (15% COMPOUND)
// =========================
if (loanType === "normal") {
  interestRate = 0.15;

  const monthlyRate = interestRate / 12;

  totalAmount =
    amount *
    Math.pow(
      1 + monthlyRate,
      Number(durationMonths)
    );
}

// =========================
// HOLIDAY LOAN (8% FLAT)
// =========================
else if (loanType === "holiday") {
  interestRate = 0.08;

  totalAmount =
    amount * (1 + interestRate);
}

// =========================
// INVALID TYPE
// =========================
else {
  return res.status(400).json({
    message: "Invalid loan type ❌"
  });
}

// round to nearest birr
// Always round UP
totalAmount = Math.ceil(totalAmount);

// Monthly installment
const monthlyInstallment =
  Math.ceil(
    totalAmount / Number(durationMonths)
  );

// dates
const loanDate = new Date();

const paymentStartDate = new Date();
paymentStartDate.setMonth(
  paymentStartDate.getMonth() + 2
);

const loanEndDate = new Date();
loanEndDate.setMonth(
  loanEndDate.getMonth() + Number(durationMonths)
);

// create loan
const loan = new Loan({
  employeeId,

  guarantors:
    gap > 0 ? guarantors : [],

  principalAmount: amount,

  interestRate,

  totalAmount,

  loanType,

  durationMonths: String(durationMonths),

  monthlyInstallment,

  loanStartDate: loanDate,

  paymentStartDate,

  loanEndDate,

  status: "pending",

  remainingAmount: totalAmount
});

// debug log
console.log({
  principalAmount: amount,
  durationMonths,
  interestRate,
  totalAmount,
  monthlyInstallment
});

await loan.save();

res.status(201).json({
  message: "Loan created successfully ✅",
  loan
});

    await loan.save();
    res.status(201).json(loan);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "ስህተት ተፈጥሯል፡ " + err.message });
  }
});


// GET LOANS (Populate ለማድረግ)
// በ server.js ወይም በ loans route ውስጥ እንዲህ መሆን አለበት
app.get("/api/loans", async (req, res) => {
  try {
    const loans = await Loan.find()
      .populate("employeeId") // ተበዳሪውን ለማምጣት
      .populate("guarantors") // ዋሶችን ለማምጣት (ይህ ወሳኝ ነው!)
      .sort({ createdAt: -1 });
    res.json(loans);
  } catch (err) {
    res.status(500).json({ message: "Error fetching loans" });
  }
});

/*app.put("/api/loans/:id/read", async (req, res) => {
  try {
    const loan = await Loan.findByIdAndUpdate(
      req.params.id,
      { isRead: true },
      { new: true }
    );

    if (!loan) {
      return res.status(404).json({
        message: "Loan not found"
      });
    }

    res.json(loan);

  } catch (err) {
    res.status(500).json({
      message: err.message
    });
  }
});*/

//reports
// =======================
// REPORT ROUTES
// =======================

// =========================================
// INDIVIDUAL MONTHLY REPORT
// =========================================
app.get("/api/reports/individual-monthly", async (req, res) => {

  try {

    const { employeeId, month, year } = req.query;

    const employee = await Employee.findById(employeeId);

    if (!employee) {

      return res.status(404).json({
        message: "Employee not found"
      });
    }

    // =========================
    // DEPOSITS
    // =========================
    const deposits = await Deposit.find({
      employeeId,
      month,
      year
    });

    const totalNormalSaving = deposits.reduce(
      (sum, d) => sum + (d.normalSaving || 0),
      0
    );

    const totalVoluntarySaving = deposits.reduce(
      (sum, d) => sum + (d.voluntarySaving || 0),
      0
    );

    const monthlyTotalDeposit =
      totalNormalSaving + totalVoluntarySaving;

    const sharesPurchased = deposits.reduce(
      (sum, d) => sum + (d.sharedPurchase || 0),
      0
    );

    // =========================
    // REGISTRATION FEES
    // =========================
    const registrationFees =
      await RegistrationFee.find({
        employeeId,
        month,
        year
      });

    const registrationFee =
      registrationFees.reduce(
        (sum, r) => sum + (r.amount || 0),
        0
      );

    // =========================
    // DEPOSIT PENALTIES
    // =========================
    const penalties =
      await LatePenalty.find({
        employeeId,
        month,
        year
      });

    const depositPenalty =
      penalties.reduce(
        (sum, p) => sum + (p.amount || 0),
        0
      );

    // =========================
    // ACTIVE LOAN
    // =========================
    const activeLoan =
      await Loan.findOne({
        employeeId,
        status: "approved",
        remainingAmount: { $gt: 0 }
      });

    // =========================
    // LOAN PAYMENTS
    // =========================
    const startDate =
      new Date(`${year}-${month}-01`);

    const endDate = new Date(startDate);

    endDate.setMonth(
      endDate.getMonth() + 1
    );

    const payments =
      await LoanPayment.find({

        employeeId,

        createdAt: {
          $gte: startDate,
          $lt: endDate
        }
      });

    const loanPaidAmount =
      payments.reduce(
        (sum, p) =>
          sum + (p.amountPaid || 0),
        0
      );

    const loanPenalty =
      payments.reduce(
        (sum, p) =>
          sum + (p.penalty || 0),
        0
      );

    // =========================
    // INTEREST
    // =========================
    let loanInterestAmount = 0;

    if (activeLoan) {

      loanInterestAmount =
        activeLoan.principalAmount * 0.12;
    }

    const interestPaid =
      payments.reduce(
        (sum, p) =>
          sum +
          (
            (p.totalPaid || 0) -
            (p.amountPaid || 0)
          ),
        0
      );

    const remainingInterest =
      loanInterestAmount - interestPaid;

    res.json({

      employee: {

        id: employee._id,

        memberId: employee.memberId,

        fullName:
          employee.firstName +
          " " +
          employee.lastName
      },

      month,

      year,

      monthlyTotalDeposit,

      activeLoanAmount:
        activeLoan?.principalAmount || 0,

      loanStartDate:
        activeLoan?.createdAt || null,

      loanEndDate:
        activeLoan
          ? new Date(
              activeLoan.createdAt.getTime() +
              Number(
                activeLoan.durationMonths
              ) *
              30 *
              24 *
              60 *
              60 *
              1000
            )
          : null,

      loanInterestAmount,

      loanPaidAmount,

      remainingLoanAmount:
        activeLoan?.remainingAmount || 0,

      registrationFee,

      depositPenalty,

      interestPaid,

      remainingInterest,

      loanPenalty,

      sharesPurchased
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      message:
        "Monthly report generation failed"
    });
  }
});

// =========================================
// INDIVIDUAL ANNUAL REPORT
// =========================================
app.get("/api/reports/individual-annual", async (req, res) => {

  try {

    const { employeeId, year } = req.query;

    const employee =
      await Employee.findById(employeeId);

    const deposits =
      await Deposit.find({
        employeeId,
        year
      });

    const totalAnnualDeposits =
      deposits.reduce(
        (sum, d) =>
          sum +
          (d.normalSaving || 0) +
          (d.voluntarySaving || 0),
        0
      );

    const sharesPurchased =
      deposits.reduce(
        (sum, d) =>
          sum + (d.sharedPurchase || 0),
        0
      );

    const registrationFees =
      await RegistrationFee.find({
        employeeId,
        year
      });

    const registrationFee =
      registrationFees.reduce(
        (sum, r) =>
          sum + (r.amount || 0),
        0
      );

    const penalties =
      await LatePenalty.find({
        employeeId,
        year
      });

    const totalAnnualDepositPenalties =
      penalties.reduce(
        (sum, p) =>
          sum + (p.amount || 0),
        0
      );

    const activeLoan =
      await Loan.findOne({
        employeeId,
        status: "approved",
        remainingAmount: { $gt: 0 }
      });

    const startDate =
      new Date(`${year}-01-01`);

    const endDate =
      new Date(`${year}-12-31`);

    const payments =
      await LoanPayment.find({

        employeeId,

        createdAt: {
          $gte: startDate,
          $lte: endDate
        }
      });

    const annualLoanPaid =
      payments.reduce(
        (sum, p) =>
          sum + (p.amountPaid || 0),
        0
      );

    const totalAnnualLoanPenalties =
      payments.reduce(
        (sum, p) =>
          sum + (p.penalty || 0),
        0
      );

    let loanInterestAmount = 0;

    if (activeLoan) {

      loanInterestAmount =
        activeLoan.principalAmount * 0.12;
    }

    const interestPaid =
      payments.reduce(
        (sum, p) =>
          sum +
          (
            (p.totalPaid || 0) -
            (p.amountPaid || 0)
          ),
        0
      );

    const remainingInterest =
      loanInterestAmount - interestPaid;

    res.json({

      employee: {

        id: employee._id,

        memberId: employee.memberId,

        fullName:
          employee.firstName +
          " " +
          employee.lastName
      },

      year,

      totalAnnualDeposits,

      activeLoanAmount:
        activeLoan?.principalAmount || 0,

      loanInterestAmount,

      annualLoanPaid,

      remainingLoanAmount:
        activeLoan?.remainingAmount || 0,

      registrationFee,

      totalAnnualDepositPenalties,

      interestPaid,

      remainingInterest,

      totalAnnualLoanPenalties,

      sharesPurchased
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      message:
        "Annual report generation failed"
    });
  }
});




//restore data


// POST /terminated/restore/:id
app.post("/api/terminated/restore/:id", async (req, res) => {
  try {
    const terminatedEmp = await Terminated.findById(req.params.id);

    if (!terminatedEmp) {
      return res.status(404).json({ message: "Not found" });
    }

    // 🔁 recreate FULL employee
 const restored = new Employee({
  memberId: terminatedEmp.memberId,
  firstName: terminatedEmp.firstName,
  lastName: terminatedEmp.lastName,
  fullName: `${terminatedEmp.firstName || ""} ${terminatedEmp.lastName || ""}`.trim(),

  gender: terminatedEmp.gender,
  birthDate: terminatedEmp.birthDate,
  age: terminatedEmp.age,

  category: terminatedEmp.category || (terminatedEmp.age >= 18 ? "Adult" : "Child"),

  phone: terminatedEmp.phone,
  maritalStatus: terminatedEmp.maritalStatus,
  role: terminatedEmp.role,
  password: terminatedEmp.password,

  fatherName: terminatedEmp.fatherName,
  motherName: terminatedEmp.motherName,
  wifeName: terminatedEmp.wifeName,
  wifeFatherName: terminatedEmp.wifeFatherName,
  wifeMotherName: terminatedEmp.wifeMotherName,
  husbandName: terminatedEmp.husbandName,
  husbandFatherName: terminatedEmp.husbandFatherName,
  husbandMotherName: terminatedEmp.husbandMotherName,

  brothers: terminatedEmp.brothers || [],
  sisters: terminatedEmp.sisters || [],
  children: terminatedEmp.children || []
});

    await restored.save();

    // ❌ remove from terminated
    await Terminated.findByIdAndDelete(req.params.id);

    res.json({ message: "Employee restored successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Restore failed" });
  }
});

// =========================================
// TOTAL MEMBERS REPORT
// =========================================
app.get("/api/reports/total-members", async (req, res) => {
  try {
    const { month, year, type } = req.query;

    // 1. የሰነዶች ፊልተር (Deposits Query)
    let depositQuery = { year };
    if (type === "monthly") {
      depositQuery.month = month;
    }
    const deposits = await Deposit.find(depositQuery);

    // 2. የብድር ክፍያ ፊልተር (Loan Payments Filtering Logic)
    // ይህ ክፍል ነው ያንን የተሳሳተ ትልቅ ቁጥር የሚያስተካክለው
    let paymentQuery = {};
    if (type === "monthly") {
      // ለወር ከሆነ፡ የወሩ መጀመሪያ እና መጨረሻ ቀን
      const startDate = new Date(`${year}-${month}-01T00:00:00Z`);
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + 1);
      paymentQuery.createdAt = { $gte: startDate, $lt: endDate };
    } else {
      // ለአመት ከሆነ፡ የአመቱ መጀመሪያ እና መጨረሻ ቀን
      const startDate = new Date(`${year}-01-01T00:00:00Z`);
      const endDate = new Date(`${year}-12-31T23:59:59Z`);
      paymentQuery.createdAt = { $gte: startDate, $lte: endDate };
    }

    const payments = await LoanPayment.find(paymentQuery);
    const loans = await Loan.find({ status: "approved" });

    // 3. ስሌቶች (Calculations)
    const totalSavings = deposits.reduce(
      (sum, d) => sum + (d.normalSaving || 0) + (d.voluntarySaving || 0),
      0
    );

    const totalShares = deposits.reduce(
      (sum, d) => sum + (d.sharedPurchase || 0),
      0
    );

    const totalRegistrationFees = deposits.reduce(
      (sum, d) => sum + (d.registrationFee || 0),
      0
    );

    const totalDepositPenalties = deposits.reduce(
      (sum, d) => sum + (d.latePenalty || 0),
      0
    );

    const totalLoanAmount = loans.reduce(
      (sum, l) => sum + (l.principalAmount || 0),
      0
    );

    const totalRemainingLoan = loans.reduce(
      (sum, l) => sum + (l.remainingAmount || 0),
      0
    );

    // አሁን ፊልተር የተደረገውን ብቻ ይደምራል
    const totalLoanPaid = payments.reduce(
      (sum, p) => sum + (p.amountPaid || 0),
      0
    );

    const totalLoanPenalties = payments.reduce(
      (sum, p) => sum + (p.penalty || 0),
      0
    );

    // 4. ውጤቱን መላክ
    res.json({
      totalMembers: await Employee.countDocuments(),
      totalSavings,
      totalShares,
      totalRegistrationFees,
      totalDepositPenalties,
      totalLoanAmount,
      totalRemainingLoan,
      totalLoanPaid, // አሁን 0 ይሆናል (በዚያ ወር ዳታ ከሌለ)
      totalLoanPenalties
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Total members report failed",
      error: err.message
    });
  }
});

// =======================
// APPROVE LOAN
// =======================
app.put("/api/loans/:id/approve", async (req, res) => {

  const loan = await Loan.findByIdAndUpdate(

    req.params.id,

    {
      status: "approved",
      isRead: true
    },

    { new: true }

  );

  res.json(loan);
});

// =======================
// REJECT LOAN
// =======================
app.put("/api/loans/:id/reject", async (req, res) => {

  const loan = await Loan.findByIdAndUpdate(

    req.params.id,

    {
      status: "rejected",
      isRead: true
    },

    { new: true }

  );

  res.json(loan);
});

// =======================
// LOAN PAYMENTS
// =======================
app.post("/api/loan-payments", async (req, res) => {
  try {
    const {
      loanId,
      employeeId,
      amountPaid,     // Principal
      interestPaid,   // Interest
      penalty,
      monthYear
    } = req.body;

    const loan = await Loan.findById(loanId);

    if (!loan) {
      return res.status(404).json({
        message: "Loan not found"
      });
    }

    const principalPaid = Number(amountPaid || 0);
    const monthlyInterest = Number(interestPaid || 0);
    const monthlyPenalty = Number(penalty || 0);

    const totalMonthlyPaid =
      principalPaid +
      monthlyInterest +
      monthlyPenalty;

    console.log("========== PAYMENT ==========");
    console.log("Loan ID:", loanId);
    console.log("Before:", loan.remainingAmount);
    console.log("Principal:", principalPaid);
    console.log("Interest:", monthlyInterest);
    console.log("Penalty:", monthlyPenalty);
    console.log("Total:", totalMonthlyPaid);

    // Prevent overpayment
    if (totalMonthlyPaid > loan.remainingAmount) {
      return res.status(400).json({
        message: `Cannot pay more than remaining balance (${loan.remainingAmount})`
      });
    }

    // Save payment record
    const payment = new LoanPayment({
      loanId,
      employeeId,
      monthYear,
      amountPaid: principalPaid,
      interestPaid: monthlyInterest,
      penalty: monthlyPenalty,
      totalPaid: totalMonthlyPaid
    });

    await payment.save();

    // Update loan balance
    loan.remainingAmount =
      Number(loan.remainingAmount) -
      totalMonthlyPaid;

    if (loan.remainingAmount < 0) {
      loan.remainingAmount = 0;
    }

    if (loan.remainingAmount === 0) {
      loan.status = "completed";
    }

    await loan.save();

    // Verify saved value
    const updatedLoan = await Loan.findById(loanId);

    console.log("After:", updatedLoan.remainingAmount);
    console.log("============================");

    res.status(200).json({
      success: true,
      message: "Payment recorded successfully",
      remainingAmount: updatedLoan.remainingAmount,
      loanStatus: updatedLoan.status
    });

  } catch (err) {
    console.error("Loan Payment Error:", err);

    res.status(500).json({
      success: false,
      message: err.message
    });
  }
});

//IncomeExpense logicapp.get("/loan-payments", async (req, res) => {


// ==========================================
// FINANCIAL REPORT SCHEMA
// ==========================================
const financialReportSchema = new mongoose.Schema({

  year: {
    type: Number,
    required: true,
    unique: true
  },

  registrationFees: {
    type: Number,
    default: 0
  },

  lateDepositPenalty: {
    type: Number,
    default: 0
  },

  loanInterestPaid: {
    type: Number,
    default: 0
  },

  lateLoanPenalty: {
    type: Number,
    default: 0
  },

  bankIncomes: [
    {
      name: String,
      amount: {
        type: Number,
        default: 0
      }
    }
  ],

  otherIncomes: [
    {
      name: String,
      amount: {
        type: Number,
        default: 0
      }
    }
  ],

  expenses: [
    {
      title: String,
      amount: {
        type: Number,
        default: 0
      }
    }
  ],

  totalIncome: {
    type: Number,
    default: 0
  },

  totalExpense: {
    type: Number,
    default: 0
  },

  netProfit: {
    type: Number,
    default: 0
  }

}, { timestamps: true });

const FinancialReport = mongoose.model(
  "FinancialReport",
  financialReportSchema
);


// ==========================================
// SAVE FINANCIAL REPORT
// ==========================================
app.post("/api/financial-reports", async (req, res) => {

  try {

    const {

      year,

      registrationFees,
      lateDepositPenalty,
      loanInterestPaid,
      lateLoanPenalty,

      bankIncomes,
      otherIncomes,
      expenses,

      totalIncome,
      totalExpense,
      netProfit

    } = req.body;

    // CHECK IF YEAR ALREADY EXISTS
    const existingReport =
      await FinancialReport.findOne({ year });

    // ==================================
    // UPDATE EXISTING YEAR REPORT
    // ==================================
    if (existingReport) {

      existingReport.registrationFees =
        registrationFees || 0;

      existingReport.lateDepositPenalty =
        lateDepositPenalty || 0;

      existingReport.loanInterestPaid =
        loanInterestPaid || 0;

      existingReport.lateLoanPenalty =
        lateLoanPenalty || 0;

      existingReport.bankIncomes =
        bankIncomes || [];

      existingReport.otherIncomes =
        otherIncomes || [];

      existingReport.expenses =
        expenses || [];

      existingReport.totalIncome =
        totalIncome || 0;

      existingReport.totalExpense =
        totalExpense || 0;

      existingReport.netProfit =
        netProfit || 0;

      await existingReport.save();

      return res.json({
        success: true,
        message: "Financial report updated successfully ✅",
        report: existingReport
      });
    }

    // ==================================
    // CREATE NEW REPORT
    // ==================================
    const report = new FinancialReport({

      year,

      registrationFees,
      lateDepositPenalty,
      loanInterestPaid,
      lateLoanPenalty,

      bankIncomes,
      otherIncomes,

      expenses,

      totalIncome,
      totalExpense,
      netProfit

    });

    await report.save();

    res.status(201).json({
      success: true,
      message: "Financial report saved successfully ✅",
      report
    });

  } catch (err) {

    console.error("FINANCIAL REPORT ERROR:", err);

    res.status(500).json({
      success: false,
      message: "Failed to save financial report ❌",
      error: err.message
    });
  }
});


// ==========================================
// GET ALL FINANCIAL REPORTS
// ==========================================
app.get("/api/financial-reports", async (req, res) => {
  try {
    const { year } = req.query;

    let query = {};

    if (year) {
      query.year = Number(year);
    }

    const reports = await FinancialReport.find(query);

    res.json(reports);

  } catch (err) {
    res.status(500).json({
      message: err.message
    });
  }
});


app.put("/api/loans/:id/status", async (req, res) => {
  try {
    const { status } = req.body;

    const loan = await Loan.findById(req.params.id);

    if (!loan) {
      return res.status(404).json({
        message: "Loan not found"
      });
    }

    loan.status = status;

    await loan.save();

    res.json({
      success: true,
      loan
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: err.message
    });
  }
});


app.delete("/api/loans/:id", async (req, res) => {
  try {
    const loan = await Loan.findById(req.params.id);

    if (!loan) {
      return res.status(404).json({
        message: "Loan not found"
      });
    }

    // Allow deleting completed loans
    if (loan.status !== "completed") {
      const paymentStarted =
        Number(loan.remainingAmount || 0) <
        Number(loan.totalAmount || 0);

      if (paymentStarted) {
        return res.status(400).json({
          message:
            "Cannot delete loan because payment has started"
        });
      }
    }

    // delete related payments too
    await LoanPayment.deleteMany({
      loanId: loan._id
    });

    await Loan.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Loan deleted successfully ✅"
    });

  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: err.message
    });
  }
});


// =======================
// PROFIT DISTRIBUTION SCHEMA
// =======================
const profitDistributionSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Employee",
    required: true,
  },

  year: {
    type: Number,
    required: true,
  },

  dividendAmount: {
    type: Number,
    default: 0,
  },

  savingAmount: {
    type: Number,
    default: 0,
  },

  shareAmount: {
    type: Number,
    default: 0,
  },

  sharesAdded: {
    type: Number,
    default: 0,
  }

}, { timestamps: true });

const ProfitDistribution = mongoose.model(
  "ProfitDistribution",
  profitDistributionSchema
);


//total loan interest paid

// =======================
// GET ALL LOAN PAYMENTS FOR FINANCIAL REPORT
// =======================
app.get("/api/loan-payments/all", async (req, res) => {

  try {

    const payments = await LoanPayment.find();


    res.json(payments);


  } catch (err) {

    console.error(err);

    res.status(500).json({
      message: "Failed to load all loan payments"
    });

  }

});
// =======================
// TOTAL SHARES
// =======================
app.get("/api/deposits/total-shares", async (req, res) => {
  try {
    const deposits = await Deposit.find();

    const totalShares = deposits.reduce(
      (sum, d) => sum + Number(d.sharedPurchase || 0),
      0
    );

    res.json({
      totalShares
    });

  } catch (err) {
    res.status(500).json({
      message: err.message
    });
  }
});


// =======================
// GET PROFIT DISTRIBUTIONS
// =======================
app.get("/api/profit-distributions", async (req, res) => {
  try {

    const data = await ProfitDistribution.find()
      .populate("employeeId")
      .sort({ createdAt: -1 });

    res.json(data);

  } catch (err) {
    res.status(500).json({
      message: err.message
    });
  }
});
// =======================
// SAVE PROFIT DISTRIBUTION
// =======================
app.post("/api/profit-distributions", async (req, res) => {
  try {

    const {
      employeeId,
      year,
      dividendAmount,
      savingAmount,
      shareAmount
    } = req.body;

    const sharesAdded = Math.floor(
      Number(shareAmount || 0) / 500
    );

    const record = new ProfitDistribution({
      employeeId,
      year,
      dividendAmount,
      savingAmount,
      shareAmount,
      sharesAdded
    });

    await record.save();

    res.status(201).json({
      success: true,
      message: "Profit distributed successfully",
      data: record
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
});

app.get("/api/financial-reports/net-profit/:year", async (req, res) => {
  try {
    const year = Number(req.params.year);

    const report = await FinancialReport.findOne({ year });

    if (!report) {
      return res.json({ netProfit: 0 });
    }

    res.json({
      netProfit: report.netProfit || 0,
    });

  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
});


app.get("/api/profit-distribution/year-summary/:year", async (req, res) => {
  try {
    const year = Number(req.params.year);

    const report = await FinancialReport.findOne({ year });

    res.json({
      year,
      netProfit: report?.netProfit || 0,
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
});

// ==========================================
// GET REPORT BY YEAR
// ==========================================
app.get("/api/financial-reports/:year", async (req, res) => {

  try {

    const report =
      await FinancialReport.findOne({
        year: Number(req.params.year)
      });

    if (!report) {

      return res.status(404).json({
        message: "Financial report not found"
      });
    }

    res.json(report);

  } catch (err) {

    res.status(500).json({
      message: err.message
    });
  }
});


// ==========================================
// DELETE FINANCIAL REPORT
// ==========================================
app.delete("/api/financial-reports/:id", async (req, res) => {

  try {

    await FinancialReport.findByIdAndDelete(
      req.params.id
    );

    res.json({
      success: true,
      message: "Financial report deleted ✅"
    });

  } catch (err) {

    res.status(500).json({
      message: err.message
    });
  }
});


// ==========================================
// UPDATE FINANCIAL REPORT
// ==========================================
app.put("/api/financial-reports/:id", async (req, res) => {

  try {

    const updated =
      await FinancialReport.findByIdAndUpdate(

        req.params.id,

        req.body,

        { new: true }

      );

    res.json({
      success: true,
      message: "Financial report updated ✅",
      report: updated
    });

  } catch (err) {

    res.status(500).json({
      message: err.message
    });
  }
});




// GET LOAN PAYMENTS


app.get("/api/loan-payments/check", async (req, res) => {
  const { loanId, month } = req.query;
  const existing = await LoanPayment.findOne({ loanId, monthYear: month });
  
  if (existing) {
    res.json({ 
      exists: true, 
      paymentId: existing._id, 
      currentAmount: existing.amountPaid || 0,
      currentInterest: existing.interestPaid || 0, // ስሙን አረጋግጥ
      currentPenalty: existing.penalty || 0 
    });
  } else {
    res.json({ exists: false });
  }
});

// =======================
// GET ALL LOAN PAYMENTS
// =======================
app.get("/api/loan-payments", async (req, res) => {

  try {

    const { loanId, employeeId } = req.query;


    const payments = await LoanPayment.find({
      loanId: loanId,
      employeeId: employeeId
    });


    res.json(payments);


  } catch (err) {

    console.error(err);

    res.status(500).json({
      message: "Failed to load payment history"
    });

  }

});


app.get("/api/employees/:memberId", async (req, res) => {
  try {
    const employee = await Employee.findOne({ memberId: req.params.memberId });
    console.log("Found Employee in DB:", employee); // 💡 ሰርቨሩ ላይ ዳታው መገኘቱን እይ

    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }
    res.json(employee);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.put("/api/employees/profile/:memberId", async (req, res) => {
  try {

    const { phone, password } = req.body;

    const updatedEmployee =
      await Employee.findOneAndUpdate(

        { memberId: req.params.memberId },

        {
          $set: {
            phone,
            password
          }
        },

        { new: true }
      );

    if (!updatedEmployee) {

      return res.status(404).json({
        message: "Employee not found"
      });
    }

    res.json(updatedEmployee);

  } catch (err) {

    res.status(500).json({
      message: err.message
    });
  }
});


// UPDATE EXISTING MONTHLY PAYMENT
app.put("/api/loan-payments/:id", async (req, res) => {
  try {
    const { amountPaid, interestPaid, penalty } = req.body;

    // safe numbers
    const pPaid = Number(amountPaid) || 0;
    const iPaid = Number(interestPaid) || 0;
    const pen = Number(penalty) || 0;

    const existingPayment = await LoanPayment.findById(req.params.id);
    if (!existingPayment)
      return res.status(404).json({ message: "Not found" });

    const loan = await Loan.findById(existingPayment.loanId);
    if (!loan)
      return res.status(404).json({ message: "Loan not found" });

    // ====================================
    // STEP 1: OLD TOTAL PAYMENT
    // ====================================
    const oldTotal =
      Number(existingPayment.amountPaid || 0) +
      Number(existingPayment.interestPaid || 0) +
      Number(existingPayment.penalty || 0);

    // ====================================
    // STEP 2: NEW TOTAL PAYMENT
    // ====================================
    const newTotal = pPaid + iPaid + pen;

    // ====================================
    // STEP 3: RESTORE THEN APPLY
    // ====================================
    loan.remainingAmount = loan.remainingAmount + oldTotal;
    loan.remainingAmount = loan.remainingAmount - newTotal;

    loan.remainingAmount = Math.max(0, loan.remainingAmount);

    if (loan.remainingAmount <= 0) {
      loan.status = "completed";
    }

    await loan.save();

    // ====================================
    // UPDATE PAYMENT RECORD
    // ====================================
    existingPayment.amountPaid = pPaid;
    existingPayment.interestPaid = iPaid;
    existingPayment.penalty = pen;
    existingPayment.totalPaid = newTotal;

    await existingPayment.save();

    res.json({
      message: "Updated successfully ✅",
      payment: existingPayment,
    });

  } catch (err) {
    console.error("DEBUG ERROR:", err);
    res.status(500).json({ message: err.message });
  }
});

// server.js

// Individual Report Logic
app.get("/api/reports/individual", async (req, res) => {
  const { employeeId, month, year, type } = req.query;

  try {
    const query = { employeeId, year: parseInt(year) };
    if (type === "monthly") query.month = month;

    // ዳታዎችን ከየክፍሉ ሰብስቦ ማምጣት
    const deposits = await Deposit.find(query);
    const loans = await Loan.find({ employeeId, status: "active" });
    const payments = await LoanPayment.find(query);

    // ስሌቶች (Calculations)
    const totalNormal = deposits.reduce((sum, d) => sum + (d.normalSaving || 0), 0);
    const totalVoluntary = deposits.reduce((sum, d) => sum + (d.voluntarySaving || 0), 0);
    
    // ሪፖርቱን ማደራጀት
    const reportData = {
      totalDeposit: totalNormal + totalVoluntary,
      activeLoan: loans[0] || null, // አሁን ያለ ብድር
      loanPaid: payments.reduce((sum, p) => sum + (p.principalAmount || 0), 0),
      interestPaid: payments.reduce((sum, p) => sum + (p.interestAmount || 0), 0),
      penalties: payments.reduce((sum, p) => sum + (p.penalty || 0), 0),
      registrationFee: 0, // አስፈላጊ ከሆነ ከሌላ ስብስብ (Collection) ይጨመራል
      shares: 0 // የሼር ብዛት
    };

    res.json(reportData);
  } catch (err) {
    res.status(500).json({ error: "Report generation failed" });
  }
});

// =======================
// DASHBOARD
// =======================
app.get("/api/dashboard", async (req, res) => {
  try {

    const employeesCount =
      await Employee.countDocuments();

    const deposits = await Deposit.find();

    const registrationFees =
      await RegistrationFee.find();

    const latePenalties =
      await LatePenalty.find();

   const activeLoans = await Loan.countDocuments({
      status: "approved", // <--- Approved የሆኑትን ብቻ ይቆጥራል
      remainingAmount: { $gt: 0 }
    });

    const totalSavings = deposits.reduce(
      (sum, d) => {

        return (
          sum +
          (d.normalSaving || 0) +
          (d.voluntarySaving || 0)
        );

      }, 0
    );

    const totalRegistrationFees =
      registrationFees.reduce((sum, r) => {

        return sum + (r.amount || 0);

      }, 0);

    const totalLatePenalties =
      latePenalties.reduce((sum, p) => {

        return sum + (p.amount || 0);

      }, 0);

    res.json({

      employees: employeesCount,

      totalSavings,

      activeLoans,

      totalRegistrationFees,

      totalLatePenalties

    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      message: "Dashboard error ❌"
    });
  }
});



// ==========================================
// FINANCIAL REPORTS LOGIC (API ENDPOINTS)
// ==========================================

// 1. Individual Monthly Report
app.get("/api/reports/individual-monthly", async (req, res) => {
  try {
    const { employeeId, month, year } = req.query;

    // ወሩን እና አመቱን ወደ ቁጥር (Number) መቀየር ለጥንቃቄ
    const targetMonth = month; // "05" ከሆነ በስትሪንግ መፈለግ ካልሆነ parseInt(month)
    const targetYear = year;

    // የዚያን ወር የተቀመጠ ገንዘብ (Deposits)
    const deposits = await Deposit.find({ employeeId, month: targetMonth, year: targetYear });
    
    // ብድር ካለ መረጃውን ማምጣት
    const activeLoan = await Loan.findOne({ employeeId, status: "approved" });
    
    // የዚያን ወር የብድር ክፍያ (Payments)
    const payments = await LoanPayment.find({ 
      employeeId, 
      // በከፈለው ቀን ወር እና አመት ፊልተር ለማድረግ (እንደ ዳታቤዝህ አወቃቀር ይለያያል)
    });

    // ክፍያዎችን ለዚያ ወር ብቻ ፊልተር ማድረግ (CreatedAt በመጠቀም)
    const monthlyPayments = payments.filter(p => {
      const d = new Date(p.createdAt);
      return (d.getMonth() + 1).toString().padStart(2, '0') === targetMonth && 
             d.getFullYear().toString() === targetYear;
    });

    // ስሌቶች
    const monthlyTotalDeposit = deposits.reduce((sum, d) => sum + (d.normalSaving || 0) + (d.voluntarySaving || 0), 0);
    const regFee = deposits.reduce((sum, d) => sum + (d.registrationFee || 0), 0);
    const penalty = deposits.reduce((sum, d) => sum + (d.latePenalty || 0), 0);
    const shares = deposits.reduce((sum, d) => sum + (d.sharedPurchase || 0), 0);
    const loanPaid = monthlyPayments.reduce((sum, p) => sum + (p.amountPaid || 0), 0);
    const loanInt = monthlyPayments.reduce((sum, p) => sum + (p.interestPaid || 0), 0);

    res.json({
      month: targetMonth,
      year: targetYear,
      monthlyTotalDeposit,
      activeLoanAmount: activeLoan ? activeLoan.principalAmount : 0,
      loanStartDate: activeLoan ? new Date(activeLoan.createdAt).toLocaleDateString() : "No Active Loan",
      loanEndDate: activeLoan && activeLoan.dueDate ? new Date(activeLoan.dueDate).toLocaleDateString() : "N/A",
      loanInterestPaid: loanInt,
      loanPaidAmount: loanPaid,
      remainingLoanAmount: activeLoan ? activeLoan.remainingAmount : 0,
      registrationFee: regFee,
      depositPenalty: penalty,
      sharesPurchased: shares
    });
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error", details: err.message });
  }
});

// 2. Individual Annual Report
app.get("/api/reports/individual-annual", async (req, res) => {
  try {
    const { employeeId, year } = req.query;

    const deposits = await Deposit.find({ employeeId, year });
    const activeLoan = await Loan.findOne({ employeeId, status: "approved" });

    res.json({
      year,
      yearlyTotalDeposit: deposits.reduce((sum, d) => sum + (d.normalSaving || 0) + (d.voluntarySaving || 0), 0),
      totalSharesInYear: deposits.reduce((sum, d) => sum + (d.sharedPurchase || 0), 0),
      totalRegistrationFees: deposits.reduce((sum, d) => sum + (d.registrationFee || 0), 0),
      totalPenalties: deposits.reduce((sum, d) => sum + (d.latePenalty || 0), 0),
      currentLoanStatus: activeLoan ? "Active" : "No Loan",
      remainingLoanBalance: activeLoan ? activeLoan.remainingAmount : 0
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Total Members Report (Monthly & Annual)
app.get("/api/reports/total-members", async (req, res) => {
  try {
    const { month, year, type } = req.query;
    
    let filter = { year };
    if (type === "monthly") {
      filter.month = month;
    }

    const allDeposits = await Deposit.find(filter);
    const allLoans = await Loan.find({ status: "approved" });

    res.json({
      period: type === "monthly" ? `${month}/${year}` : year,
      totalMembersSavings: allDeposits.reduce((sum, d) => sum + (d.normalSaving || 0) + (d.voluntarySaving || 0), 0),
      totalCapitalFromShares: allDeposits.reduce((sum, d) => sum + (d.sharedPurchase || 0), 0),
      totalRegistrationIncome: allDeposits.reduce((sum, d) => sum + (d.registrationFee || 0), 0),
      totalActiveLoanAssets: allLoans.reduce((sum, l) => sum + l.remainingAmount, 0),
      totalPenaltyIncome: allDeposits.reduce((sum, d) => sum + (d.latePenalty || 0), 0)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
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

  const data = await Terminated.find()
    .sort({ terminatedAt: -1 });

  res.json(data);
});

app.delete("/api/terminated/:id", async (req, res) => {

  await Terminated.findByIdAndDelete(
    req.params.id
  );

  res.json({
    message: "Deleted permanently ✅"
  });
});

// =======================
// START SERVER
// =======================
const path = require("path");
//const { default: IncomeExpense } = require("../client/src/pages/IncomeExpense");

// ሰርቨሩ ካለበት ፎልደር አንድ እርምጃ ወደ ኋላ ወጥቶ ወደ client/build እንዲገባ ያደርጋል
const buildPath = path.join(__dirname, "..", "client", "build");

app.use(express.static(buildPath));

app.get("*", (req, res) => {
  res.sendFile(path.join(buildPath, "index.html"), (err) => {
    if (err) {
      res.status(500).send("የሪአክት ቢልድ ፋይል አልተገኘም! እባክህ Render ላይ Build መደረጉን አረጋግጥ።");
    }
  });
});

// START SERVER
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running successfully on port ${PORT} 🚀`);
});