const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

// MODELS


// =========================================
// INDIVIDUAL MONTHLY REPORT
// =========================================
router.get("api/individual-monthly", async (req, res) => {

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

module.exports = router;