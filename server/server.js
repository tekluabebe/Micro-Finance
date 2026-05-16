require("dotenv").config(); // .env ፋይልን ለማንበብ

// ... ሌሎቹ እንዳሉ ሆነው
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

//app.use("/api/reports", reportsRoutes);
// =======================
// CONNECT TO MONGODB
// =======================

// =======================
// CONNECT TO MONGODB ATLAS
// =======================
// <db_password> በሚለው ቦታ የአንተን ዳታቤዝ ፓስወርድ መተካት እንዳትረሳ!
// 1. የቆየውን ሁለት የ mongoose.connect ኮድ አጥፋና ይህንን ብቻ ተጠቀም
const ATLAS_URI = "mongodb+srv://myproject:%25TGBnhy6@cluster0.kzx9prr.mongodb.net/microfinance?retryWrites=true&w=majority&appName=Cluster0";

// በ .env ፋይል ውስጥ ካለ እሱን ይወስዳል፣ ካለበለዚያ Atlasን ይጠቀማል
const mongoURI = process.env.MONGO_URI || ATLAS_URI;

mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log("MongoDB Connected ✅");
  // የትኛው ዳታቤዝ እንደሆነ ለማወቅ
  const dbType = mongoURI.includes("mongodb.net") ? "Cloud (Atlas)" : "Local";
  console.log(`Connection Type: ${dbType}`);
})
.catch((err) => console.error("MongoDB Connection Error ❌:", err));

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

const Employee = mongoose.model(
  "Employee",
  employeeSchema
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

  employeeData: Object,

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
  principalAmount: Number,
  loanType: String,
  durationMonths: String,
  // እዚህ ጋር ወደ Array ቀይረነዋል
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
  remainingAmount: Number
}, { timestamps: true });

const Loan = mongoose.model("Loan", loanSchema);
// =======================
// LOAN PAYMENT SCHEMA
// =======================
const loanPaymentSchema = new mongoose.Schema({

  loanId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Loan",
    required: true
  },

  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Employee",
    required: true
  },

  amountPaid: Number,

  penalty: {
    type: Number,
    default: 0
  },

  totalPaid: Number

}, { timestamps: true });

const LoanPayment = mongoose.model(
  "LoanPayment",
  loanPaymentSchema
);

// =======================
// EMPLOYEE ROUTES
// =======================
app.get("/api/employees", async (req, res) => {

  const employees = await Employee.find();

  res.json(employees);
});

const bcrypt = require("bcryptjs");

app.post("/api/employees", async (req, res) => {
  try {
    const { password, ...otherData } = req.body;

    // ፓስወርዱን መደበቅ (Hashing)
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const emp = new Employee({
      ...otherData,
      password: hashedPassword // የተደበቀው ፓስወርድ ሴቭ ይሆናል
    });

    await emp.save();
    res.json({ message: "Employee registered successfully ✅", id: emp._id });
  } catch (err) {
    res.status(500).json({ message: "Registration failed ❌" });
  }
});
app.put("/api/employees/:id", async (req, res) => {

  const emp = await Employee.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true }
  );

  res.json(emp);
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

  const data = await Withdrawal.find()
    .populate("employeeId");

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
    const loan = new Loan({
      employeeId,
      guarantors: gap > 0 ? guarantors : [], 
      principalAmount: amount,
      loanType,
      durationMonths: String(durationMonths),
      status: "pending",
      remainingAmount: amount
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
      amountPaid,
      penalty
    } = req.body;

    const loan = await Loan.findById(loanId);

    if (!loan) {

      return res.status(404).json({
        message: "Loan not found ❌"
      });
    }

    loan.remainingAmount = Math.max(
      0,
      loan.remainingAmount - Number(amountPaid)
    );

    if (loan.remainingAmount === 0) {

      loan.status = "completed";
    }

    await loan.save();

    const payment = new LoanPayment({

      loanId,

      employeeId,

      amountPaid:
        Number(amountPaid),

      penalty:
        Number(penalty) || 0,

      totalPaid:
        Number(amountPaid) +
        Number(penalty || 0)

    });

    await payment.save();

    res.json({
      message: "Payment successful ✅"
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      message: err.message
    });
  }
});

// GET LOAN PAYMENTS
app.get("/api/loan-payments", async (req, res) => {
  const payments = await LoanPayment.find().populate("employeeId");
  res.json(payments);
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
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT} 🚀`);
});