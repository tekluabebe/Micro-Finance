require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;

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

  // 🔥 ADD THESE SAVINGS FIELDS
  totalSaving: { type: Number, default: 0 },
  normalSaving: { type: Number, default: 0 },
  voluntarySaving: { type: Number, default: 0 },

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
  memberId: String,  // 🔥 Add this field for easier lookups
  month: String,
  year: String,
  normalSaving: { type: Number, default: 0 },
  voluntarySaving: { type: Number, default: 0 },
  sharedPurchase: { type: Number, default: 0 },
  registrationFee: { type: Number, default: 0 },
  latePenalty: { type: Number, default: 0 },
  depositForPurchase: { type: Number, default: 0 }
}, { timestamps: true });

const Deposit = mongoose.model("Deposit", depositSchema);

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
  category: String,

  firstName: String,
  lastName: String,
  fullName: String,

  gender: String,
  birthDate: Date,
  age: Number,

  phone: String,
  maritalStatus: String,
  role: String,
  password: String,

  // 🔥 ADD THESE SAVINGS FIELDS
  totalSaving: { type: Number, default: 0 },
  normalSaving: { type: Number, default: 0 },
  voluntarySaving: { type: Number, default: 0 },

  fatherName: String,
  motherName: String,

  wifeName: String,
  wifeFatherName: String,
  wifeMotherName: String,

  husbandName: String,
  husbandFatherName: String,
  husbandMotherName: String,

  brothers: [String],
  sisters: [String],
  children: [String],

  reason: String,
  terminatedAt: Date
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


const supportUserSchema = new mongoose.Schema(
  {
    name: String,
    email: { type: String, required: true, unique: true, lowercase: true },
    password: String,
    googleId: String,
    provider: {
      type: String,
      enum: ["local", "google"],
      default: "local",
    },
  },
  { timestamps: true }
);

const SupportUser = mongoose.model("SupportUser", supportUserSchema);

const supportRequestSchema = new mongoose.Schema(
  {
    supportUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SupportUser",
      required: true,
    },
    senderEmail: { type: String, required: true },
    recipientEmail: { type: String, required: true },
    question: { type: String, required: true },
    status: {
      type: String,
      enum: ["pending", "resolved"],
      default: "pending",
    },
  },
  { timestamps: true }
);

const SupportRequest = mongoose.model(
  "SupportRequest",
  supportRequestSchema
);

// Add this after supportRequestSchema

const supportResponseSchema = new mongoose.Schema(
  {
    supportRequestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SupportRequest",
      required: true,
    },
    supportUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SupportUser",
      required: true,
    },
    senderEmail: { type: String, required: true },
    recipientEmail: { type: String, required: true },
    originalQuestion: { type: String, required: true },
    response: { type: String, required: true },
    isRead: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ["pending", "resolved"],
      default: "pending",
    },
  },
  { timestamps: true }
);

const SupportResponse = mongoose.model(
  "SupportResponse",
  supportResponseSchema
);

// ==========================================
// GET ALL SUPPORT REQUESTS (For Admin)
// ==========================================
// ==========================================
// GET ALL SUPPORT REQUESTS (For Admin) - SHOW ONLY PENDING
// ==========================================
// ==========================================
// GET ALL SUPPORT REQUESTS (For Admin)
// ==========================================
app.get("/api/support/requests/admin/all", async (req, res) => {
  try {
    // 🔥 Only fetch requests that haven't been responded to yet
    const requests = await SupportRequest.find({
      status: "pending"  // Only show requests without responses
    })
      .populate("supportUserId")
      .sort({ createdAt: -1 });

    console.log("Fetched pending requests:", requests.length);
    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ==========================================
// GET SUPPORT REQUEST COUNT (For Admin)
// ==========================================
app.get("/api/support/requests/unread-count", async (req, res) => {
  try {
    const count = await SupportRequest.countDocuments({
      status: "pending",
    });
    res.json({ count });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ==========================================
// SEND SUPPORT RESPONSE (Admin Response)
// ==========================================

app.post("/api/support/responses", async (req, res) => {
  try {
    const { supportRequestId, response } = req.body;

    const request = await SupportRequest.findById(supportRequestId);

    if (!request) {
      return res.status(404).json({
        message: "Support request not found",
      });
    }

    // Create response
    const supportResponse = await SupportResponse.create({
      supportRequestId,
      supportUserId: request.supportUserId,
      senderEmail: request.senderEmail,
      recipientEmail: request.recipientEmail,
      originalQuestion: request.question,
      response: response.trim(),
      status: "pending",
    });

    // 🔥 Update original request status to "resolved"
    request.status = "resolved";
    await request.save();

    console.log("✅ Request status updated to resolved:", request._id);

    // Try to send email response
    try {
      await mailTransporter.sendMail({
        from: `"Microfinance Support" <${process.env.SMTP_USER}>`,
        to: request.senderEmail,
        replyTo: request.recipientEmail,
        subject: "Response to Your Support Request",
        text: `Your Question:\n${request.question}\n\nResponse:\n${response.trim()}`,
      });
      console.log("Response email sent successfully ✅");
    } catch (emailErr) {
      console.error("Email sending failed:", emailErr.message);
    }

    res.status(201).json({
      success: true,
      message: "Response sent successfully ✅",
      response: supportResponse,
    });
  } catch (err) {
    console.error("Support response error:", err);
    res.status(500).json({
      message: "Unable to send response",
    });
  }
});

// ==========================================
// GET USER RESPONSES (For User/Member)
// ==========================================
app.get("/api/support/responses/:supportUserId", async (req, res) => {
  try {
    const responses = await SupportResponse.find({
      supportUserId: req.params.supportUserId,
      isRead: false,
    })
      .populate("supportRequestId")
      .sort({ createdAt: -1 });

    res.json(responses);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ==========================================
// MARK RESPONSE AS READ
// ==========================================
app.put("/api/support/responses/:id/read", async (req, res) => {
  try {
    const response = await SupportResponse.findByIdAndUpdate(
      req.params.id,
      { isRead: true },
      { new: true }
    );

    res.json({
      success: true,
      message: "Marked as read ✅",
      response,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ==========================================
// GET UNREAD RESPONSE COUNT
// ==========================================
app.get("/api/support/responses/unread-count/:supportUserId", async (req, res) => {
  try {
    const count = await SupportResponse.countDocuments({
      supportUserId: req.params.supportUserId,
      isRead: false,
    });
    res.json({ count });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.use(passport.initialize());

const createSupportToken = (user) =>
  jwt.sign(
    {
      id: user._id,
      email: user.email,
      type: "support",
    },
    process.env.JWT_SECRET,
    { expiresIn: "2h" }
  );

const requireSupportAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({ message: "Support login required" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.type !== "support") {
      return res.status(403).json({ message: "Invalid support account" });
    }

    req.supportUser = await SupportUser.findById(decoded.id);

    if (!req.supportUser) {
      return res.status(401).json({ message: "Support account not found" });
    }

    next();
  } catch {
    res.status(401).json({ message: "Invalid or expired login" });
  }
};

app.post("/api/support/auth/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password || password.length < 6) {
      return res.status(400).json({
        message: "Name, email, and a password of at least 6 characters are required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const exists = await SupportUser.findOne({ email: normalizedEmail });

    if (exists) {
      return res.status(409).json({
        message: "Support account already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await SupportUser.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      provider: "local",
    });

    res.status(201).json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
      token: createSupportToken(user),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post("/api/support/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await SupportUser.findOne({
      email: email.trim().toLowerCase(),
    });

    if (!user || !user.password) {
      return res.status(401).json({
        message: "Invalid support email or password",
      });
    }

    const valid = await bcrypt.compare(password, user.password);

    if (!valid) {
      return res.status(401).json({
        message: "Invalid support email or password",
      });
    }

    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
      token: createSupportToken(user),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value?.toLowerCase();

        const user = await SupportUser.findOneAndUpdate(
          { email },
          {
            name: profile.displayName,
            email,
            googleId: profile.id,
            provider: "google",
          },
          { new: true, upsert: true }
        );

        done(null, user);
      } catch (err) {
        done(err);
      }
    }
  )
);

app.get(
  "/api/support/auth/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
  })
);

// Find this section and update it:

app.get(
  "/api/support/auth/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: `${process.env.CLIENT_URL}/help?error=google`,
  }),
  (req, res) => {
    const token = jwt.sign(
      {
        id: req.user._id,
        email: req.user.email,
        type: "support",
      },
      process.env.JWT_SECRET,
      { expiresIn: "2h" }
    );

    res.redirect(
      `${process.env.CLIENT_URL}/help?supportToken=${encodeURIComponent(token)}`
    );
  }
);


const mailTransporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

app.post(
  "/api/support/requests",
  requireSupportAuth,
  async (req, res) => {
    try {
     const { recipientEmail, question } = req.body;

if (!recipientEmail?.trim() || !question?.trim()) {
  return res.status(400).json({
    message: "Recipient email and question are required",
  });
}

     const supportRequest = await SupportRequest.create({
  supportUserId: req.supportUser._id,
  senderEmail: req.supportUser.email,
  recipientEmail: recipientEmail.trim(),
  question: question.trim(),
});

     const senderEmail = req.supportUser.email;

// Try to send email, but don't fail if it doesn't work
try {
  await mailTransporter.sendMail({
    from: `"Microfinance Support" <${process.env.SMTP_USER}>`,
    to: recipientEmail.trim(),
    replyTo: senderEmail,
    subject: "Technical Support Request",
    text:
      `Sender: ${senderEmail}\n\n` +
      question.trim(),
  });
  console.log("Email sent successfully ✅");
} catch (emailErr) {
  console.error("Email sending failed (request still saved):", emailErr.message);
}

      res.status(201).json({
        success: true,
        message: "Support request sent successfully ✅",
        request: supportRequest,
      });
    } catch (err) {
      console.error("Support Error:", err);
      res.status(500).json({
        message: "Unable to send support request",
      });
    }
  }
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

    // 🔥 RETURN userRole in response
    res.json({
      success: true,
      user: {
        memberId: user.memberId,
        fullName: `${user.firstName} ${user.lastName}`,
        role: user.role,  // 🔥 Make sure role is returned
        userRole: user.role  // 🔥 Add this too
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
    // Get values sent from frontend
    const { totalSaving, reason } = req.body;

    // Find employee
    const employee = await Employee.findById(req.params.id);

    if (!employee) {
      return res.status(404).json({
        message: "Employee not found"
      });
    }

    // Save full employee information in Terminated collection
    const terminated = new Terminated({
      memberId: employee.memberId,

      category: employee.category,

      firstName: employee.firstName,
      lastName: employee.lastName,
      fullName: `${employee.firstName || ""} ${employee.lastName || ""}`.trim(),

      gender: employee.gender,
      birthDate: employee.birthDate,
      age: employee.age,

      phone: employee.phone,
      maritalStatus: employee.maritalStatus,
      role: employee.role,
      password: employee.password,

      fatherName: employee.fatherName,
      motherName: employee.motherName,

      wifeName: employee.wifeName,
      wifeFatherName: employee.wifeFatherName,
      wifeMotherName: employee.wifeMotherName,

      husbandName: employee.husbandName,
      husbandFatherName: employee.husbandFatherName,
      husbandMotherName: employee.husbandMotherName,

      brothers: employee.brothers || [],
      sisters: employee.sisters || [],
      children: employee.children || [],

      // termination information
      totalSaving: Number(totalSaving) || 0,
      reason: reason || "",

      terminatedAt: new Date()
    });

    await terminated.save();

    // Remove employee from Employee collection
    await Employee.findByIdAndDelete(employee._id);

    res.json({
      success: true,
      message: "Employee terminated successfully"
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
// CREATE DEPOSIT (Alternative - if frontend sends memberId)
// UPDATE EMPLOYEE TOTAL SAVING after deposit
app.post("/api/deposits", async (req, res) => {

  try {

    let memberId = req.body.memberId;

    // If memberId not provided, fetch from employee
    if (!memberId) {
      const employee = await Employee.findById(req.body.employeeId);
      if (!employee) {
        return res.status(400).json({
          message: "Employee not found"
        });
      }
      memberId = employee.memberId;
    }

    const d = new Deposit({

      employeeId: req.body.employeeId,
      memberId: memberId,

      month: req.body.month,
      year: req.body.year,

      normalSaving: Number(req.body.normalSaving) || 0,
      voluntarySaving: Number(req.body.voluntarySaving) || 0,
      sharedPurchase: Number(req.body.sharedPurchase) || 0,
      registrationFee: Number(req.body.registrationFee) || 0,
      latePenalty: Number(req.body.latePenalty) || 0,
      depositForPurchase: Number(req.body.depositForPurchase) || 0

    });

    await d.save();

    // 🔥 UPDATE employee totalSaving with normal + voluntary only
    const allDeposits = await Deposit.find({ employeeId: req.body.employeeId });
    const newTotal = allDeposits.reduce((sum, dep) => {
      return sum + (parseFloat(dep.normalSaving) || 0) + (parseFloat(dep.voluntarySaving) || 0);
    }, 0);

    await Employee.findByIdAndUpdate(
      req.body.employeeId,
      { 
        totalSaving: newTotal,
        normalSaving: allDeposits.reduce((s, d) => s + (parseFloat(d.normalSaving) || 0), 0),
        voluntarySaving: allDeposits.reduce((s, d) => s + (parseFloat(d.voluntarySaving) || 0), 0)
      }
    );

    // =======================
    // SAVE REGISTRATION FEE
    // =======================
    if (Number(req.body.registrationFee) > 0) {
      const registration = new RegistrationFee({
        employeeId: req.body.employeeId,
        amount: Number(req.body.registrationFee),
        month: req.body.month,
        year: req.body.year
      });
      await registration.save();
    }

    // =======================
    // SAVE LATE PENALTY
    // =======================
    if (Number(req.body.latePenalty) > 0) {
      const penalty = new LatePenalty({
        employeeId: req.body.employeeId,
        amount: Number(req.body.latePenalty),
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
      message: "Error saving deposit ❌",
      error: err.message
    });
  }
});

// GET /api/dividends - Get all dividends for a specific year
// GET /api/dividends - Updated to show remaining after distribution
// Replace the /api/dividends route

// GET DIVIDENDS
app.get("/api/dividends", async (req, res) => {
  try {
    const year = Number(req.query.year);

    const [deposits, employees, report, distributions] =
      await Promise.all([
        Deposit.find(),
        Employee.find(),
        FinancialReport.findOne({ year }),
        ProfitDistribution.find({ year }).sort({
          updatedAt: -1,
          createdAt: -1,
        }),
      ]);

    const yearDeposits = deposits.filter(
      (d) => String(d.year) === String(year)
    );

    const totalShares = yearDeposits.reduce(
      (sum, d) => sum + Number(d.sharedPurchase || 0),
      0
    );

    const netProfit = Number(report?.netProfit || 0);

    const result = employees.map((employee) => {
      const memberDeposits = yearDeposits.filter((deposit) => {
        const depositEmployeeId = String(
          deposit.employeeId?._id ||
            deposit.employeeId ||
            ""
        );

        const depositMemberId = String(
          deposit.memberId ||
            deposit.employeeId?.memberId ||
            ""
        );

        return (
          depositEmployeeId === String(employee._id) ||
          depositMemberId === String(employee.memberId)
        );
      });

      const shares = memberDeposits.reduce(
        (sum, d) => sum + Number(d.sharedPurchase || 0),
        0
      );

      // This is the dividend shown before distribution.
      const calculatedDividend =
        totalShares > 0
          ? (shares / totalShares) * netProfit
          : 0;

      const distribution = distributions.find(
        (item) =>
          String(item.memberId) === String(employee.memberId) ||
          String(item.employeeId) === String(employee._id)
      );

      // Logic 1:
      // Once distributed, keep the original dividend unchanged.
      const dividendAmount = distribution
        ? Number(distribution.dividendAmount || 0)
        : calculatedDividend;

      // Logic 2:
      // After distribution, show the database remaining amount.
      const remainingAmount = distribution
        ? Number(distribution.remainingAmount || 0)
        : dividendAmount;

return {
  employeeId: employee._id,
  memberId: employee.memberId,
  firstName: employee.firstName,
  lastName: employee.lastName,
  year, // Required by Profit.js

  shares,
  totalShares,
  netProfit,
  dividendAmount: Number(dividendAmount.toFixed(2)),
  remainingAmount: Number(remainingAmount.toFixed(2)),
  distributedAmount: Number(
    distribution?.distributedAmount || 0
  ),
  isDistributed: Boolean(distribution)
};
    });

    res.json(result);
  } catch (err) {
    console.error("Dividend error:", err);
    res.status(500).json({
      message: "Failed to load dividends",
      error: err.message,
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
        message: `ያልተከፈለ የ${loanType} ብድር ስላለብዎት፣ ተጨማሪ ዋስ ማስገባት ግዴታ ነው! ❌` 
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
          errorParts.push(`${overLimitNames.join(", ")} አስቀድሞ ለ 2 ብድሮች ዋስ ስለሆኑ/ስለሆኑ ተጨማሪ ዋስትና መስጠት አይችልም/አይችሉም! ❌`);
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
        message: "Employee not found",
      });
    }

    // ==========================================
    // DEPOSITS
    // ==========================================

// Monthly deposits
// ==========================================
// DEPOSITS
// ==========================================

const mongoose = require("mongoose");

const monthNames = {
  "01": "January",
  "02": "February",
  "03": "March",
  "04": "April",
  "05": "May",
  "06": "June",
  "07": "July",
  "08": "August",
  "09": "September",
  "10": "October",
  "11": "November",
  "12": "December",
};

// Convert month number (05) to month name (May)
const selectedMonth = monthNames[month] || month;

// Convert employeeId to ObjectId
const employeeObjectId = new mongoose.Types.ObjectId(employeeId);

// Get all deposits for this employee
const allDeposits = await Deposit.find({
  employeeId: employeeObjectId,
});

// Get deposits only for the selected month/year
const monthlyDeposits = allDeposits.filter(
  d =>
    d.month === selectedMonth &&
    String(d.year) === String(year)
);

console.log("Employee :", employeeId);
console.log("Month    :", selectedMonth);
console.log("Year     :", year);
console.log("Found    :", monthlyDeposits.length);

// Monthly Normal Saving
const totalNormalSaving = monthlyDeposits.reduce(
  (sum, d) => sum + Number(d.normalSaving || 0),
  0
);

// Monthly Voluntary Saving
const totalVoluntarySaving = monthlyDeposits.reduce(
  (sum, d) => sum + Number(d.voluntarySaving || 0),
  0
);

// Monthly Deposit
const monthlyDeposit =
  totalNormalSaving + totalVoluntarySaving;

// Total Registration Fee
const registrationFee = allDeposits.reduce(
  (sum, d) => sum + Number(d.registrationFee || 0),
  0
);

// Monthly Deposit Penalty
const depositPenalty = monthlyDeposits.reduce(
  (sum, d) => sum + Number(d.latePenalty || 0),
  0
);

// Total Shared Purchase
const sharesPurchased = allDeposits.reduce(
  (sum, d) => sum + Number(d.sharedPurchase || 0),
  0
);

    // ==========================================
    // GET LATEST LOAN
    // ==========================================
const loan = await Loan.findOne({
  employeeId: employeeObjectId,
  status: "approved",
}).sort({
  createdAt: -1,
});

    let activeLoanAmount = 0;
    let remainingLoanAmount = 0;
    let loanStartDate = "N/A";
    let loanEndDate = "N/A";
    let loanInterestAmount = 0;

    if (loan && loan.status !== "completed") {
      activeLoanAmount = Number(loan.principalAmount) || 0;

      remainingLoanAmount =
        Number(loan.remainingAmount) || 0;

      loanStartDate = loan.createdAt;

      if (loan.dueDate) {
        loanEndDate = loan.dueDate;
      } else if (loan.durationMonths) {
        const end = new Date(loan.createdAt);
        end.setMonth(
          end.getMonth() + Number(loan.durationMonths)
        );
        loanEndDate = end;
      }

      // Loan Interest = Total Amount - Principal Amount
      loanInterestAmount =
        (Number(loan.totalAmount) || 0) -
        (Number(loan.principalAmount) || 0);
    }

    // ==========================================
    // MONTHLY LOAN PAYMENTS

// ==========================================
// LOAN PAYMENTS (ALL PAYMENTS FOR THIS LOAN)
// ==========================================

let payments = [];

if (loan) {
  payments = await LoanPayment.find({
    employeeId,
    loanId: loan._id,
  });
}

// Total Principal Paid
const loanPaidAmount = payments.reduce(
  (sum, p) => sum + (Number(p.amountPaid) || 0),
  0
);

// Total Penalty Paid
const loanPenalty = payments.reduce(
  (sum, p) => sum + (Number(p.penalty) || 0),
  0
);

// Total Interest Paid (All Months)
const interestPaid = payments.reduce(
  (sum, p) => sum + (Number(p.interestPaid) || 0),
  0
);

// Remaining Interest
const remainingInterest = Math.max(
  0,
  loanInterestAmount - interestPaid
);

    // ==========================================
    // RESPONSE
    // ==========================================
res.json({
  employee: {
    id: employee._id,
    memberId: employee.memberId,
    fullName:
      employee.firstName + " " + employee.lastName,
  },

  month,
  year,

  monthlyDeposit,

  normalSaving: totalNormalSaving,

  voluntarySaving: totalVoluntarySaving,

  registrationFee,

  depositPenalty,

  sharesPurchased,

  activeLoanAmount,

  loanStartDate,

  loanEndDate,

  loanInterestAmount,

  loanPaidAmount,

  remainingLoanAmount,

  interestPaid,

  remainingInterest,

  loanPenalty,
});
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: "Monthly report generation failed",
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

// Annual Normal Saving
const annualNormalSaving = deposits.reduce(
  (sum, d) => sum + (d.normalSaving || 0),
  0
);

// Annual Voluntary Saving
const annualVoluntarySaving = deposits.reduce(
  (sum, d) => sum + (d.voluntarySaving || 0),
  0
);

// Total Annual Deposits
const totalAnnualDeposits =
  annualNormalSaving + annualVoluntarySaving;

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

    const remainingInterest = Math.max(
  0,
  loanInterestAmount - interestPaid
);
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
   annualNormalSaving,

  annualVoluntarySaving,

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


// POST /api/terminated/restore/:id
// POST /api/terminated/restore/:id
app.post("/api/terminated/restore/:id", async (req, res) => {
    try {
        const terminated = await Terminated.findById(req.params.id);

        if (!terminated) {
            return res.status(404).json({
                message: "Employee not found"
            });
        }

        // 🔥 FIND DEPOSITS BY memberId
        const deposits = await Deposit.find({ 
            employeeId: { $exists: true }
        }).populate("employeeId");

        // Filter deposits that belong to this member
        const memberDeposits = deposits.filter(d => 
            d.employeeId?.memberId === terminated.memberId || 
            d.memberId === terminated.memberId
        );

        console.log(`Found ${memberDeposits.length} deposits for member ${terminated.memberId}`);

        // 🔥 CALCULATE ONLY normal + voluntary savings
        const totalSaving = memberDeposits.reduce((sum, deposit) => {
            const normalSaving = parseFloat(deposit.normalSaving) || 0;
            const voluntarySaving = parseFloat(deposit.voluntarySaving) || 0;
            
            // Only sum normal and voluntary
            return sum + normalSaving + voluntarySaving;
        }, 0);

        // Calculate normal separately
        const normalSaving = memberDeposits.reduce((sum, d) => sum + (parseFloat(d.normalSaving) || 0), 0);
        const voluntarySaving = memberDeposits.reduce((sum, d) => sum + (parseFloat(d.voluntarySaving) || 0), 0);

        console.log(`Total Savings Calculated: ${totalSaving} ETB (Normal: ${normalSaving} + Voluntary: ${voluntarySaving})`);

        // Hash the password if it exists
        let hashedPassword = terminated.password;
        if (terminated.password && !terminated.password.startsWith("$2b$")) {
            const salt = await bcrypt.genSalt(10);
            hashedPassword = await bcrypt.hash(terminated.password, salt);
        } else {
            hashedPassword = terminated.password;
        }

        const restoredEmployee = new Employee({
            memberId: terminated.memberId,
            category: terminated.category,

            firstName: terminated.firstName,
            lastName: terminated.lastName,

            gender: terminated.gender,
            birthDate: terminated.birthDate,
            age: terminated.age,

            phone: terminated.phone,
            maritalStatus: terminated.maritalStatus || "",

            role: terminated.role,
            password: hashedPassword,

            fatherName: terminated.fatherName || "",
            motherName: terminated.motherName || "",

            wifeName: terminated.wifeName || "",
            wifeFatherName: terminated.wifeFatherName || "",
            wifeMotherName: terminated.wifeMotherName || "",

            husbandName: terminated.husbandName || "",
            husbandFatherName: terminated.husbandFatherName || "",
            husbandMotherName: terminated.husbandMotherName || "",

            brothers: terminated.brothers || [],
            sisters: terminated.sisters || [],
            children: terminated.children || [],

            // 🔥 ONLY normal + voluntary
            totalSaving: totalSaving,
            normalSaving: normalSaving,
            voluntarySaving: voluntarySaving
        });

        const savedEmployee = await restoredEmployee.save();

        // Update all deposits to reference the new employee ID
        const updateResult = await Deposit.updateMany(
            { 
                $or: [
                    { employeeId: { $exists: false } },
                    { "employeeId.memberId": terminated.memberId }
                ]
            },
            { employeeId: savedEmployee._id }
        );

        console.log(`Updated ${updateResult.modifiedCount} deposit records`);

        // Delete from terminated collection
        await Terminated.findByIdAndDelete(req.params.id);

        res.json({
            success: true,
            message: `Employee restored successfully! Total Savings: ${totalSaving} ETB ✅`,
            employee: {
                _id: savedEmployee._id,
                memberId: savedEmployee.memberId,
                firstName: savedEmployee.firstName,
                lastName: savedEmployee.lastName,
                totalSaving: savedEmployee.totalSaving,
                normalSaving: savedEmployee.normalSaving,
                voluntarySaving: savedEmployee.voluntarySaving,
                calculatedSavings: {
                    totalSaving: totalSaving,
                    normalSaving: normalSaving,
                    voluntarySaving: voluntarySaving,
                    depositCount: memberDeposits.length,
                    depositsUpdated: updateResult.modifiedCount
                }
            }
        });

    } catch (err) {
        console.error("Restore Error:", err);
        res.status(500).json({
            message: "Restore failed: " + err.message,
            error: err
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

const profitDistributionSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    memberId: {
      type: String,
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
    distributedAmount: {
      type: Number,
      default: 0,
    },
    remainingAmount: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      default: "approved",
    },
    distributedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

const ProfitDistribution = mongoose.model(
  "ProfitDistribution",
  profitDistributionSchema
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
// POST /api/profit-distributions
// SAVE OR UPDATE PROFIT DISTRIBUTION
app.post("/api/profit-distributions", async (req, res) => {
  try {
    const {
      employeeId,
      memberId,
      year,
      dividendAmount,
      savingAmount,
      shareAmount,
    } = req.body;

    const employee = await Employee.findById(employeeId);

    if (!employee) {
      return res.status(404).json({
        message: "Employee not found",
      });
    }

    const finalMemberId = memberId || employee.memberId;
    const finalYear = Number(year);

    const currentSaving = Number(savingAmount || 0);
    const currentShare = Number(shareAmount || 0);
    const currentDistribution =
      currentSaving + currentShare;

    const existing = await ProfitDistribution.findOne({
      memberId: finalMemberId,
      year: finalYear,
    }).sort({
      updatedAt: -1,
      createdAt: -1,
    });

    // Keep the first/original dividend forever.
    const originalDividend = existing
      ? Number(existing.dividendAmount || 0)
      : Number(dividendAmount || 0);

    const previousRemaining = existing
      ? Number(existing.remainingAmount || 0)
      : originalDividend;

    const previousDistributed = existing
      ? Number(existing.distributedAmount || 0)
      : 0;

    if (currentDistribution <= 0) {
      return res.status(400).json({
        message: "Distribution amount must be greater than zero",
      });
    }

    if (currentDistribution > previousRemaining) {
      return res.status(400).json({
        message: `Distribution cannot exceed remaining dividend (${previousRemaining.toFixed(
          2
        )} ETB)`,
      });
    }

    const newRemaining =
      previousRemaining - currentDistribution;

    const newDistributed =
      previousDistributed + currentDistribution;

    const distribution =
      await ProfitDistribution.findOneAndUpdate(
        {
          memberId: finalMemberId,
          year: finalYear,
        },
        {
          employeeId: employee._id,
          memberId: finalMemberId,
          year: finalYear,

          // Logic 1: never replace the original dividend.
          dividendAmount: originalDividend,

          savingAmount:
            Number(existing?.savingAmount || 0) +
            currentSaving,

          shareAmount:
            Number(existing?.shareAmount || 0) +
            currentShare,

          distributedAmount: newDistributed,
          remainingAmount: Math.max(0, newRemaining),
          status: "approved",
          distributedAt: new Date(),
        },
        {
          new: true,
          upsert: true,
          setDefaultsOnInsert: true,
        }
      );

    res.json({
      success: true,
      message: "Profit distribution saved successfully ✅",
      distribution,
    });
  } catch (err) {
    console.error("Profit distribution error:", err);

    res.status(500).json({
      success: false,
      message: err.message,
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