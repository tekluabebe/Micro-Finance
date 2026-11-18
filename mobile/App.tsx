import { StatusBar } from 'expo-status-bar';
import * as SecureStore from 'expo-secure-store';
import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { useRouter } from 'expo-router';
import { Picker } from '@react-native-picker/picker';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  apiRequest,
  loadMobileDashboard,
  type MobileDashboard,
  type MemberLoan,
  type MemberSummary,
} from './src/api';
import { sectionPath, type AppSection } from './src/navigation';

type User = {
  firstName?: string;
  lastName?: string;
  fullName?: string;
  name?: string;
  role: string;
};

type LoginResponse = {
  token: string;
  user: User;
};

const memberSections = [
  'Overview',
  'Members',
  'Loans',
  'Withdrawals',
  'Reports',
  'Profile',
  'Edit Profile',
  'Change Password',
  'Dividend',
  'Income & Expense',
  'Balance Sheet',
  'Cash Flow',
  'Check Balance',
  'Help',
  'Settings',
] as const;
const staffSections = [
  'Overview',
  'Members',
  'Savings',
  'Loans',
  'Payments',
  'Withdrawals',
  'Reports',
  'Profile',
  'Edit Profile',
  'Change Password',
  'Dividend',
  'Profit',
  'Income & Expense',
  'Balance Sheet',
  'Cash Flow',
  'Check Balance',
  'Terminated',
  'Help',
  'Settings',
] as const;
const savingAmountFields = ['registrationFee', 'latePenalty'] as const;
const months = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];
const roles = [
  'member',
  'admin',
  'loan officer',
  'loan manager',
  'vice loan manager',
  'accountant',
  'treasurer',
];

const tokenStorageKey = 'microfinance-auth-token';
const userStorageKey = 'microfinance-auth-user';

export default function App({ initialSection = 'Overview' }: { initialSection?: AppSection }) {
  return (
    <SafeAreaProvider>
      <MobileApp initialSection={initialSection} />
    </SafeAreaProvider>
  );
}

function MobileApp({ initialSection }: { initialSection: AppSection }) {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isRestoring, setIsRestoring] = useState(true);
  const [memberId, setMemberId] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('member');
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [error, setError] = useState('');
  const [loginMessage, setLoginMessage] = useState('');
  const [resetMode, setResetMode] = useState(false);
  const [resetPassword, setResetPassword] = useState('');
  const [confirmResetPassword, setConfirmResetPassword] = useState('');
  const [resetMemberId, setResetMemberId] = useState('');
  const [dashboard, setDashboard] = useState<MobileDashboard | null>(null);
  const [summaryError, setSummaryError] = useState('');
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeSection, setActiveSection] = useState<AppSection>(initialSection);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [formMode, setFormMode] = useState(false);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [selectedGuarantors, setSelectedGuarantors] = useState<string[]>([]);
  const [actionError, setActionError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [reportType, setReportType] = useState('individual-monthly');
  const [reportEmployeeId, setReportEmployeeId] = useState('');
  const [reportMonth, setReportMonth] = useState(months[new Date().getMonth()]);
  const [reportYear, setReportYear] = useState(String(new Date().getFullYear()));
  const [reportData, setReportData] = useState<unknown>(null);
  const [reportError, setReportError] = useState('');
  const [isLoadingReport, setIsLoadingReport] = useState(false);
  const [pageData, setPageData] = useState<unknown>(null);
  const [pageError, setPageError] = useState('');
  const [isLoadingPage, setIsLoadingPage] = useState(false);
  const [savedLanguage, setSavedLanguage] = useState('English');
  const [darkMode, setDarkMode] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [balanceSheetValues, setBalanceSheetValues] = useState<Record<string, string>>({
    cashOnHand: '',
    cashAtBank: '',
    accountsReceivable: '',
    otherReceivable: '',
    officeEquipment: '',
    furniture: '',
    vehicle: '',
    building: '',
    accountsPayable: '',
    taxPayable: '',
    otherLiability: '',
    capital: '',
    reserve: '',
    retainedEarnings: '',
  });

  useEffect(() => {
    setActiveSection(initialSection);
    setFormMode(false);
  }, [initialSection]);

  useEffect(() => {
    if (activeSection !== 'Balance Sheet') return;
    let active = true;
    SecureStore.getItemAsync(`microfinance-balance-sheet-${reportYear}`)
      .then((saved) => {
        if (!active || !saved) return;
        const parsed: unknown = JSON.parse(saved);
        if (
          typeof parsed === 'object' &&
          parsed !== null &&
          'values' in parsed &&
          typeof parsed.values === 'object' &&
          parsed.values !== null
        ) {
          setBalanceSheetValues(
            Object.fromEntries(
              Object.entries(parsed.values).map(([key, value]) => [key, String(value)]),
            ),
          );
        }
      })
      .catch((storageError: unknown) => {
        console.error('Could not load the saved balance sheet:', storageError);
        setActionError('Could not load the saved balance sheet.');
      });
    return () => {
      active = false;
    };
  }, [activeSection, reportYear]);

  useEffect(() => {
    const restoreSession = async () => {
      try {
        const [savedToken, savedUser] = await Promise.all([
          SecureStore.getItemAsync(tokenStorageKey),
          SecureStore.getItemAsync(userStorageKey),
        ]);
        if (savedToken && savedUser) {
          const restoredUser = JSON.parse(savedUser) as User;
          if (roles.includes(restoredUser.role?.toLowerCase())) {
            setToken(savedToken);
            setUser(restoredUser);
          } else {
            await Promise.all([
              SecureStore.deleteItemAsync(tokenStorageKey),
              SecureStore.deleteItemAsync(userStorageKey),
            ]);
          }
        }
      } catch (restoreError) {
        console.error('Could not restore the mobile session:', restoreError);
        setError('Could not restore your saved session. Please sign in again.');
      } finally {
        setIsRestoring(false);
      }
    };

    void restoreSession();
  }, []);

  useEffect(() => {
    if (!token) {
      setDashboard(null);
      return;
    }

    let active = true;
    setIsLoadingSummary(true);
    setSummaryError('');
    loadMobileDashboard(token)
      .then((data) => {
        if (active) setDashboard(data);
      })
      .catch((loadError: unknown) => {
        if (!active) return;
        setSummaryError(
          loadError instanceof Error
            ? loadError.message
            : 'Could not load dashboard data.',
        );
      })
      .finally(() => {
        if (active) setIsLoadingSummary(false);
      });

    return () => {
      active = false;
    };
  }, [token, refreshKey]);

  useEffect(() => {
    if (!token || !['Dividend', 'Profit', 'Terminated'].includes(activeSection)) {
      setPageData(null);
      setPageError('');
      return;
    }

    let active = true;
    setPageData(null);
    setPageError('');
    setIsLoadingPage(true);
    const request =
      activeSection === 'Dividend'
        ? apiRequest<unknown>(`/dividends?year=${reportYear}`, { token })
        : activeSection === 'Profit'
          ? apiRequest<unknown>(`/dividends?year=${reportYear}`, { token })
          : apiRequest<unknown>('/terminated', { token });
    request
      .then((data) => {
        if (active) setPageData(data);
      })
      .catch((loadError: unknown) => {
        if (!active) return;
        setPageError(loadError instanceof Error ? loadError.message : 'Could not load this page.');
      })
      .finally(() => {
        if (active) setIsLoadingPage(false);
      });

    return () => {
      active = false;
    };
  }, [token, activeSection, reportYear, refreshKey]);

  useEffect(() => {
    if (!token) return;
    Promise.all([
      SecureStore.getItemAsync('microfinance-mobile-language'),
      SecureStore.getItemAsync('microfinance-mobile-dark-mode'),
      SecureStore.getItemAsync('microfinance-mobile-notifications'),
    ])
      .then(([language, dark, notifications]) => {
        if (language) setSavedLanguage(language);
        if (dark) setDarkMode(dark === 'true');
        if (notifications) setNotificationsEnabled(notifications === 'true');
      })
      .catch((storageError: unknown) => {
        console.error('Could not load mobile preferences:', storageError);
      });
  }, [token]);

  const signIn = async () => {
    setError('');
    setLoginMessage('');
    setIsSigningIn(true);
    try {
      const response = await apiRequest<LoginResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          memberId: memberId.trim(),
          password,
          role,
        }),
      });

      await Promise.all([
        SecureStore.setItemAsync(tokenStorageKey, response.token),
        SecureStore.setItemAsync(userStorageKey, JSON.stringify(response.user)),
      ]);
      setUser(response.user);
      setToken(response.token);
      setActiveSection('Overview');
      setPassword('');
      router.replace(sectionPath('Overview'));
    } catch (signInError: unknown) {
      const message =
        signInError instanceof Error ? signInError.message : 'Sign in failed.';
      setError(
        message.toLowerCase().includes('wrong role')
          ? 'This account has a different role. Select the role assigned to this account and try again.'
          : message,
      );
    } finally {
      setIsSigningIn(false);
    }
  };

  const requestPasswordReset = async () => {
    setError('');
    setLoginMessage('');
    try {
      const result = await apiRequest<{ message?: string; isAdmin?: boolean }>('/password-reset-request', {
        method: 'POST',
        body: JSON.stringify({ memberId: memberId.trim() }),
      });
      if (result.isAdmin) {
        setResetMemberId(memberId.trim());
        setResetMode(true);
        setResetPassword('');
        setConfirmResetPassword('');
        return;
      }
      setLoginMessage(result.message || 'Password reset request submitted.');
    } catch (requestError: unknown) {
      setError(requestError instanceof Error ? requestError.message : 'Could not request a password reset.');
    }
  };

  const submitPasswordReset = async () => {
    setError('');
    setLoginMessage('');
    if (resetPassword.length < 6) {
      setError('Password should contain at least 6 characters.');
      return;
    }
    if (resetPassword !== confirmResetPassword) {
      setError('Passwords do not match.');
      return;
    }
    try {
      const result = await apiRequest<{ message?: string }>('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ memberId: resetMemberId, newPassword: resetPassword }),
      });
      setResetMode(false);
      setMemberId(resetMemberId);
      setRole('admin');
      setPassword('');
      setLoginMessage(result.message || 'Password reset successfully. Sign in with your new password.');
    } catch (resetError: unknown) {
      setError(resetError instanceof Error ? resetError.message : 'Could not reset the password.');
    }
  };

  const signOut = async () => {
    try {
      await Promise.all([
        SecureStore.deleteItemAsync(tokenStorageKey),
        SecureStore.deleteItemAsync(userStorageKey),
      ]);
      setToken(null);
      setUser(null);
      setDashboard(null);
      setError('');
      setMemberId('');
      setPassword('');
      setActiveSection('Overview');
      router.replace('/');
    } catch (signOutError) {
      console.error('Could not clear the saved mobile session:', signOutError);
      setError('Could not sign out. Please try again.');
    }
  };

  const navigateTo = (section: AppSection) => {
    setActiveSection(section);
    router.push(sectionPath(section));
    setIsDrawerOpen(false);
    setFormMode(false);
    setActionError('');
  };

  const startForm = (section: AppSection) => {
    setActiveSection(section);
    setFormMode(true);
    setActionError('');
    setSelectedGuarantors([]);
    const now = new Date();
    const defaults: Record<string, string> = {
      month: months[now.getMonth()],
      year: String(now.getFullYear()),
      monthYear: `${months[now.getMonth()]} ${now.getFullYear()}`,
      durationMonths: '6',
      loanType: 'normal',
      role: 'member',
      employeeId: dashboard?.members[0]?._id || '',
      normalSaving: '200',
      latePenalty: '0',
      voluntarySaving: '0',
      sharedPurchase: '0',
      registrationFee: '0',
      amountPaid: '',
      interestPaid: '',
      penalty: '0',
    };
    if (section === 'Edit Profile') defaults.phone = dashboard?.profile.phone || '';
    if (section === 'Payments') {
      const activeLoan = dashboard?.loans.find(
        (loan) => loan.status === 'approved' && amount(loan.remainingAmount) > 0,
      );
      defaults.loanId = activeLoan?._id || '';
      defaults.amountPaid = activeLoan ? String(monthlyLoanPayment(activeLoan)) : '';
    }
    if (section === 'Savings') {
      const selectedId = defaults.employeeId;
      const hasPreviousSavings = dashboard?.savings.some((record) => {
        const recordId = record.employeeId && typeof record.employeeId !== 'string'
          ? record.employeeId._id
          : record.employeeId;
        return String(recordId) === selectedId;
      });
      defaults.registrationFee = hasPreviousSavings ? '0' : '500';
    }
    setFormValues(defaults);
  };

  const updateFormValue = (field: string, value: string) => {
    setFormValues((current) => ({
      ...current,
      [field]: value,
      ...(field === 'loanId'
        ? {
          amountPaid: (() => {
            const loan = dashboard?.loans.find((item) => item._id === value);
            return loan ? String(monthlyLoanPayment(loan)) : '';
          })(),
          monthYear: `${months[new Date().getMonth()]} ${new Date().getFullYear()}`,
        }
        : {}),
      ...(field === 'employeeId' && activeSection === 'Savings'
        ? {
          registrationFee: dashboard?.savings.some((record) =>
            String(record.employeeId && typeof record.employeeId !== 'string'
              ? record.employeeId._id
              : record.employeeId) === value,
          ) ? '0' : '500',
        }
        : {}),
    }));
  };

  const submitForm = async () => {
    if (!token || !user) return;
    setActionError('');
    setIsSaving(true);
    try {
      const selectedMember = dashboard?.members.find(
        (member) => member._id === formValues.employeeId,
      );
      if (activeSection === 'Members') {
        await apiRequest('/employees', {
          token,
          method: 'POST',
          body: JSON.stringify({
            firstName: formValues.firstName?.trim(),
            lastName: formValues.lastName?.trim(),
            memberId: formValues.memberId?.trim(),
            phone: formValues.phone?.trim(),
            gender: formValues.gender,
            birthDate: formValues.birthDate || undefined,
            maritalStatus: formValues.maritalStatus,
            password: formValues.password,
            role: formValues.role || 'member',
          }),
        });
      } else if (activeSection === 'Savings') {
        if (!formValues.employeeId || !formValues.month || !formValues.year) {
          throw new Error('Select a member, month, and year.');
        }
        const memberId = selectedMember?.memberId || '';
        const memberDeposits = (dashboard?.savings || []).filter((record) => {
          const recordEmployeeId = record.employeeId && typeof record.employeeId !== 'string'
            ? record.employeeId._id
            : record.employeeId;
          const recordMemberId = record.memberId ||
            (record.employeeId && typeof record.employeeId !== 'string'
              ? record.employeeId.memberId
              : '');
          return String(recordEmployeeId) === formValues.employeeId ||
            (Boolean(memberId) && String(recordMemberId) === memberId);
        });
        const alreadyDeposited = memberDeposits.some(
          (record) => record.month === formValues.month && String(record.year) === formValues.year,
        );
        if (alreadyDeposited) throw new Error('A deposit already exists for this member and month.');
        const sortedDeposits = [...memberDeposits].sort(
          (first, second) =>
            new Date(Number(second.year), months.indexOf(second.month || '')).getTime() -
            new Date(Number(first.year), months.indexOf(first.month || '')).getTime(),
        );
        const lastDeposit = sortedDeposits[0];
        const lastDate = lastDeposit
          ? new Date(Number(lastDeposit.year), months.indexOf(lastDeposit.month || ''))
          : null;
        const targetDate = new Date(Number(formValues.year), months.indexOf(formValues.month));
        const monthGap = lastDate
          ? (targetDate.getFullYear() - lastDate.getFullYear()) * 12 +
            targetDate.getMonth() - lastDate.getMonth()
          : 1;
        if (monthGap <= 0) throw new Error('Choose a month after the member’s latest deposit.');
        const missedMonths = Math.max(0, monthGap - 1);
        const depositsDue = missedMonths + 1;
        const minSavings = depositsDue * 200;
        const minPenalty = missedMonths * 10;
        if (amount(formValues.normalSaving) < minSavings) {
          throw new Error(`Regular savings must be at least ${formatMoney(minSavings)} for ${depositsDue} due month(s).`);
        }
        if (amount(formValues.latePenalty) < minPenalty) {
          throw new Error(`Late penalty must be at least ${formatMoney(minPenalty)} for ${missedMonths} overdue month(s).`);
        }
        for (let index = 0; index < depositsDue; index += 1) {
          const depositDate = lastDate
            ? new Date(lastDate.getFullYear(), lastDate.getMonth() + index + 1)
            : targetDate;
          await apiRequest('/deposits', {
            token,
            method: 'POST',
            body: JSON.stringify({
              employeeId: formValues.employeeId,
              memberId: selectedMember?.memberId,
              month: months[depositDate.getMonth()],
              year: String(depositDate.getFullYear()),
              normalSaving: 200,
              voluntarySaving: index === depositsDue - 1 ? amount(formValues.voluntarySaving) : 0,
              sharedPurchase: index === depositsDue - 1 ? amount(formValues.sharedPurchase) : 0,
              depositForPurchase: index === depositsDue - 1 ? amount(formValues.sharedPurchase) * 500 : 0,
              registrationFee: index === 0 && memberDeposits.length === 0 ? amount(formValues.registrationFee) : 0,
              latePenalty: index < missedMonths ? 10 : 0,
            }),
          });
        }
      } else if (activeSection === 'Loans') {
        const employeeId = user.role.toLowerCase() === 'member'
          ? dashboard?.members[0]?._id
          : formValues.employeeId;
        const employee = dashboard?.members.find((member) => member._id === employeeId);
        if (!employeeId) throw new Error('Select the member applying for the loan.');
        await apiRequest('/loans', {
          token,
          method: 'POST',
          body: JSON.stringify({
            employeeId,
            guarantors: selectedGuarantors,
            principalAmount: amount(formValues.principalAmount),
            loanType: formValues.loanType,
            durationMonths: amount(formValues.durationMonths),
            totalSaving: amount(employee?.totalSaving),
            externalGuarantors:
              formValues.externalName || formValues.externalPhone || formValues.externalDigitalId
                ? [{
                  fullName: formValues.externalName?.trim(),
                  phone: formValues.externalPhone?.trim(),
                  digitalId: formValues.externalDigitalId?.trim(),
                }]
                : [],
          }),
        });
      } else if (activeSection === 'Payments') {
        if (!formValues.loanId) throw new Error('Select a loan to record a payment.');
        const loan = dashboard?.loans.find((item) => item._id === formValues.loanId);
        if (!loan) throw new Error('The selected loan was not found. Refresh and try again.');
        if (!formValues.monthYear?.trim()) throw new Error('Enter the month for this payment.');
        if (dashboard?.payments.some((payment) =>
          payment.loanId === loan._id && payment.monthYear === formValues.monthYear.trim()
        )) {
          throw new Error(`A payment is already recorded for ${formValues.monthYear}.`);
        }
        const principalAmount = amount(loan.principalAmount);
        const totalAmount = amount(loan.totalAmount);
        const duration = Math.max(1, amount(loan.durationMonths));
        const monthlyInstallment = monthlyLoanPayment(loan);
        const inputAmount = amount(formValues.amountPaid);
        if (inputAmount <= 0) throw new Error('Enter a payment amount greater than zero.');
        if (inputAmount > amount(loan.remainingAmount)) {
          throw new Error(`Payment cannot exceed the remaining balance (${formatMoney(loan.remainingAmount)}).`);
        }
        const calculatedTotal = loan.loanType === 'normal'
          ? principalAmount * Math.pow(1 + 0.15 / 12, duration)
          : principalAmount * 1.08;
        const interestPerMonth = Math.round((calculatedTotal - principalAmount) / duration);
        let interestPaid: number;
        let principalPaid: number;
        if (inputAmount >= totalAmount) {
          interestPaid = totalAmount - principalAmount;
          principalPaid = principalAmount;
        } else {
          const paidMonths = Math.max(1, Math.floor(inputAmount / monthlyInstallment));
          interestPaid = paidMonths * interestPerMonth;
          principalPaid = inputAmount - interestPaid;
        }
        const paymentStartDate = loan.paymentStartDate
          ? new Date(loan.paymentStartDate)
          : addMonthsClamped(new Date(loan.createdAt || Date.now()), 1);
        paymentStartDate.setHours(0, 0, 0, 0);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (today < paymentStartDate) {
          throw new Error(`Payments begin on ${paymentStartDate.toLocaleDateString()}.`);
        }
        let missedMonths = 0;
        let nextDueDate = paymentStartDate;
        while (nextDueDate < today && missedMonths < duration) {
          missedMonths += 1;
          nextDueDate = addMonthsClamped(paymentStartDate, missedMonths);
        }
        const penalty = missedMonths * 50;
        if (inputAmount + penalty > amount(loan.remainingAmount)) {
          throw new Error(`Payment and penalty cannot exceed the remaining balance (${formatMoney(loan.remainingAmount)}).`);
        }
        await apiRequest('/loan-payments', {
          token,
          method: 'POST',
          body: JSON.stringify({
            loanId: loan._id,
            employeeId: typeof loan.employeeId === 'string' ? loan.employeeId : loan.employeeId?._id,
            amountPaid: Math.round(principalPaid),
            interestPaid: Math.round(interestPaid),
            penalty: Math.round(penalty),
            monthYear: formValues.monthYear.trim(),
          }),
        });
      } else if (activeSection === 'Withdrawals') {
        const employeeId = user.role.toLowerCase() === 'member'
          ? dashboard?.members[0]?._id
          : formValues.employeeId;
        const employee = dashboard?.members.find((member) => member._id === employeeId);
        if (!employeeId || !formValues.reason?.trim()) {
          throw new Error('Select a member and enter a reason.');
        }
        if (dashboard?.loans.some((loan) =>
          String(loan.employeeId && typeof loan.employeeId !== 'string'
            ? loan.employeeId._id
            : loan.employeeId) === employeeId &&
          loan.status === 'approved' &&
          amount(loan.remainingAmount) > 0
        )) {
          throw new Error('The member must finish their active loan before requesting a withdrawal.');
        }
        await apiRequest('/withdrawals', {
          token,
          method: 'POST',
          body: JSON.stringify({
            employeeId,
            memberId: employee?.memberId,
            fullName: `${employee?.firstName || ''} ${employee?.lastName || ''}`.trim(),
            totalSaving: amount(employee?.totalSaving),
            reason: formValues.reason.trim(),
            status: 'pending',
            isRead: false,
          }),
        });
      } else if (activeSection === 'Profit') {
        const member = dashboard?.members.find((item) => item._id === formValues.employeeId);
        const rows = Array.isArray(pageData) ? pageData as Record<string, unknown>[] : [];
        const dividendRow = rows.find((item) => String(item.memberId) === String(member?.memberId));
        if (!member || !dividendRow) throw new Error('Select a member with a dividend record for this year.');
        const dividendAmount = amount(dividendRow.dividendAmount as string | number | undefined);
        const remainingAmount = amount(dividendRow.remainingAmount as string | number | undefined);
        const savingAmount = amount(formValues.savingAmount);
        const shareAmount = amount(formValues.shareAmount);
        const distributionAmount = savingAmount + shareAmount;
        if (distributionAmount <= 0) throw new Error('Enter a savings or share distribution amount.');
        if (distributionAmount > remainingAmount) {
          throw new Error(`Distribution exceeds the remaining dividend (${formatMoney(remainingAmount)}).`);
        }
        if (shareAmount % 500 !== 0) throw new Error('Share distribution must be in multiples of 500 ETB.');
        await apiRequest('/profit-distributions', {
          token,
          method: 'POST',
          body: JSON.stringify({
            employeeId: member._id,
            memberId: member.memberId,
            year: Number(reportYear),
            dividendAmount,
            savingAmount,
            shareAmount,
            distributedAmount: distributionAmount,
            remainingAmount: remainingAmount - distributionAmount,
            status: 'approved',
          }),
        });
        if (savingAmount > 0) {
          await apiRequest('/deposits', {
            token,
            method: 'POST',
            body: JSON.stringify({
              employeeId: member._id,
              memberId: member.memberId,
              month: `Dividend-${Date.now()}`,
              year: reportYear,
              normalSaving: savingAmount,
              voluntarySaving: 0,
              sharedPurchase: 0,
              registrationFee: 0,
              latePenalty: 0,
              depositForPurchase: 0,
            }),
          });
        }
        if (shareAmount > 0) {
          await apiRequest('/deposits', {
            token,
            method: 'POST',
            body: JSON.stringify({
              employeeId: member._id,
              memberId: member.memberId,
              month: `Dividend-Shares-${Date.now()}`,
              year: reportYear,
              normalSaving: 0,
              voluntarySaving: 0,
              sharedPurchase: shareAmount / 500,
              registrationFee: 0,
              latePenalty: 0,
              depositForPurchase: shareAmount,
            }),
          });
        }
      } else if (activeSection === 'Edit Profile') {
        await apiRequest(`/employees/profile/${dashboard?.profile.memberId}`, {
          token,
          method: 'PUT',
          body: JSON.stringify({ phone: formValues.phone?.trim() }),
        });
      }

      setFormMode(false);
      setFormValues({});
      setRefreshKey((current) => current + 1);
    } catch (saveError: unknown) {
      setActionError(saveError instanceof Error ? saveError.message : 'Could not save your changes.');
    } finally {
      setIsSaving(false);
    }
  };

  const updateRecordStatus = async (path: string, payload: Record<string, unknown> = {}) => {
    if (!token) return;
    try {
      await apiRequest(path, { token, method: 'PUT', body: JSON.stringify(payload) });
      setRefreshKey((current) => current + 1);
    } catch (updateError: unknown) {
      setActionError(updateError instanceof Error ? updateError.message : 'Could not update the record.');
    }
  };

  const generateReport = async () => {
    if (!token || !dashboard) return;
    setIsLoadingReport(true);
    setReportError('');
    setReportData(null);
    try {
      const member = user?.role.toLowerCase() === 'member'
        ? dashboard.members.find((item) => item.memberId === dashboard.profile.memberId)
        : dashboard.members.find((item) => item._id === (reportEmployeeId || dashboard.members[0]?._id));
      if (reportType.startsWith('individual-') && !member) {
        throw new Error('Select a member before generating this report.');
      }
      const url = reportType === 'individual-monthly'
        ? `/reports/individual-monthly?employeeId=${member?._id || ''}&month=${String(months.indexOf(reportMonth) + 1).padStart(2, '0')}&year=${reportYear}`
        : reportType === 'individual-annual'
          ? `/reports/individual-annual?employeeId=${member?._id || ''}&year=${reportYear}`
          : reportType === 'total-monthly'
            ? `/reports/total-members?month=${String(months.indexOf(reportMonth) + 1).padStart(2, '0')}&year=${reportYear}&type=monthly`
            : `/reports/total-members?year=${reportYear}&type=annual`;
      setReportData(await apiRequest<unknown>(url, { token }));
    } catch (loadError: unknown) {
      setReportError(loadError instanceof Error ? loadError.message : 'Could not generate the report.');
    } finally {
      setIsLoadingReport(false);
    }
  };

  const savePreference = async (key: string, value: string) => {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch (storageError: unknown) {
      console.error('Could not save mobile preference:', storageError);
      setActionError('Could not save this preference on your device.');
    }
  };

  const saveBalanceSheet = async () => {
    if (user?.role.toLowerCase() === 'member') {
      setActionError('Members cannot save balance sheet data.');
      return;
    }
    const values = Object.fromEntries(
      Object.entries(balanceSheetValues).map(([key, value]) => [key, amount(value)]),
    );
    const assets =
      values.cashOnHand + values.cashAtBank + values.accountsReceivable +
      values.otherReceivable + values.officeEquipment + values.furniture +
      values.vehicle + values.building;
    const liabilitiesAndEquity =
      values.accountsPayable + values.taxPayable + values.otherLiability +
      values.capital + values.reserve + values.retainedEarnings;
    if (Math.abs(assets - liabilitiesAndEquity) >= 0.01) {
      setActionError(`Balance sheet is out of balance by ${formatMoney(assets - liabilitiesAndEquity)}.`);
      return;
    }
    try {
      await SecureStore.setItemAsync(
        `microfinance-balance-sheet-${reportYear}`,
        JSON.stringify({ year: Number(reportYear), values, assets, liabilitiesAndEquity }),
      );
      setActionError('Balance sheet saved on this device.');
    } catch (storageError: unknown) {
      console.error('Could not save the mobile balance sheet:', storageError);
      setActionError('Could not save the balance sheet.');
    }
  };

  if (isRestoring) {
    return (
      <SafeAreaView style={styles.centered}>
        <StatusBar style="dark" />
        <ActivityIndicator size="large" color={colors.green} />
      </SafeAreaView>
    );
  }

  if (token && user) {
    const name =
      [user.firstName, user.lastName].filter(Boolean).join(' ') ||
      user.fullName ||
      user.name ||
      'Member';
    const isMemberRole = user.role.toLowerCase() === 'member';
    const visibleSections: readonly AppSection[] = isMemberRole
      ? memberSections
      : staffSections;
    const primarySections: AppSection[] = isMemberRole
      ? ['Overview', 'Loans', 'Withdrawals', 'Reports', 'Profile']
      : ['Overview', 'Members', 'Savings', 'Loans', 'Profile'];
    const savingsTotal =
      dashboard?.savings.reduce(
        (total, deposit) =>
          total + amount(deposit.normalSaving) + amount(deposit.voluntarySaving),
        0,
      ) ?? 0;
    const activeLoans =
      dashboard?.loans.filter(
        (loan) =>
          loan.status === 'approved' && amount(loan.remainingAmount) > 0,
      ).length ?? 0;
    const totalPaid =
      dashboard?.payments.reduce(
        (total, payment) =>
          total +
          amount(
            payment.totalPaid ??
              amount(payment.amountPaid) +
                amount(payment.interestPaid) +
                amount(payment.penalty),
          ),
        0,
      ) ?? 0;
    const currentMonthName = new Date().toLocaleString('en-US', { month: 'long' });
    const currentYear = String(new Date().getFullYear());
    const monthlySavingsTotal = dashboard?.savings
      .filter((record) => record.month === currentMonthName && String(record.year) === currentYear)
      .reduce(
        (total, record) => total + amount(record.normalSaving) + amount(record.voluntarySaving),
        0,
      ) ?? 0;

    return (
      <SafeAreaView style={[styles.safeArea, darkMode && styles.darkSafeArea]}>
        <StatusBar style={darkMode ? 'light' : 'dark'} />
        <View style={[styles.appHeader, darkMode && styles.darkSurface]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open navigation menu"
            onPress={() => setIsDrawerOpen(true)}
            style={styles.menuButton}
          >
            <Text style={styles.menuButtonText}>☰</Text>
          </Pressable>
          <View style={styles.headerTitles}>
            <Text numberOfLines={1} style={styles.headerTitle}>Micro-Finance</Text>
            <Text numberOfLines={1} style={styles.headerSubtitle}>{activeSection} · {name}</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Sign out"
            onPress={() => void signOut()}
            style={styles.headerSignOut}
          >
            <Text style={styles.headerSignOutText}>Exit</Text>
          </Pressable>
        </View>
        <ScrollView
          style={[styles.contentScroll, darkMode && styles.contentScrollDark]}
          contentContainerStyle={styles.dashboardContent}
          keyboardShouldPersistTaps="handled"
        >
          {activeSection === 'Overview' && (
            <View style={styles.hero}>
              <Text style={styles.brand}>ACCOUNT OVERVIEW</Text>
              <Text style={styles.welcome}>Welcome, {name}</Text>
              <Text style={styles.roleText}>{user.role}</Text>
            </View>
          )}

          <View style={styles.sectionHeading}>
            <Text style={styles.sectionTitle}>{activeSection}</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Refresh ${activeSection}`}
              onPress={() => setRefreshKey((current) => current + 1)}
              style={styles.refreshButton}
            >
              <Text style={styles.refreshText}>Refresh</Text>
            </Pressable>
          </View>

          {isLoadingSummary ? (
            <View style={styles.loadingPanel}>
              <ActivityIndicator color={colors.green} />
              <Text style={styles.mutedText}>Loading your account…</Text>
            </View>
          ) : summaryError ? (
            <View style={styles.errorPanel}>
              <Text style={styles.errorText}>{summaryError}</Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => setRefreshKey((current) => current + 1)}
                style={styles.retryButton}
              >
                <Text style={styles.refreshText}>Try again</Text>
              </Pressable>
            </View>
          ) : dashboard ? (
            <>
              {actionError && !formMode && activeSection !== 'Balance Sheet' && activeSection !== 'Settings' ? (
                <View style={styles.errorPanel}>
                  <Text style={styles.errorText}>{actionError}</Text>
                </View>
              ) : null}
              {activeSection === 'Overview' && (
                <>
                  <View style={styles.cards}>
                    <SummaryCard
                      label={isMemberRole ? 'Your savings' : 'Total savings'}
                      value={formatMoney(savingsTotal)}
                      icon="💰"
                    />
                    <SummaryCard
                      label={isMemberRole ? 'Your loans' : 'Members'}
                      value={isMemberRole ? activeLoans.toLocaleString() : dashboard.members.length.toLocaleString()}
                      icon={isMemberRole ? '🏦' : '👥'}
                    />
                    <SummaryCard
                      label={isMemberRole ? 'Payments made' : 'Active loans'}
                      value={isMemberRole ? formatMoney(totalPaid) : activeLoans.toLocaleString()}
                      icon={isMemberRole ? '✅' : '🏦'}
                    />
                    {!isMemberRole && (
                      <>
                        <SummaryCard label="Monthly deposits" value={formatMoney(monthlySavingsTotal)} icon="📈" />
                        <SummaryCard label="Registration fees" value={formatMoney(sumField(dashboard.savings, 'registrationFee'))} icon="📝" />
                        <SummaryCard label="Late penalties" value={formatMoney(sumField(dashboard.savings, 'latePenalty'))} icon="⚠️" />
                      </>
                    )}
                  </View>
                  {!isMemberRole && (
                    <>
                      <Text style={styles.listHeading}>Notifications</Text>
                      <RecordCard
                        title="Pending withdrawals"
                        subtitle={`${dashboard.withdrawals.filter((item) => item.status !== 'approved' && item.status !== 'rejected').length} requests`}
                      />
                      <RecordCard
                        title="Pending loan requests"
                        subtitle={`${dashboard.loans.filter((item) => item.status === 'pending').length} requests`}
                      />
                      <RecordCard
                        title="Password reset requests"
                        subtitle={`${dashboard.passwordRequests.length} requests`}
                      />
                    </>
                  )}
                  <Text style={styles.listHeading}>{isMemberRole ? 'Recent savings' : 'Savings analytics'}</Text>
                  {dashboard.savings.length ? (
                    <>
                      {dashboard.savings.slice(0, 3).map((deposit) => (
                        <RecordCard
                          key={deposit._id}
                          title={`${deposit.month || ''} ${deposit.year || ''}`.trim() || 'Savings deposit'}
                          subtitle={`Regular ${formatMoney(deposit.normalSaving)} · Voluntary ${formatMoney(deposit.voluntarySaving)}`}
                        />
                      ))}
                      {!isMemberRole && (
                        <RecordCard
                          title="Loan distribution"
                          subtitle={`Approved ${dashboard.loans.filter((loan) => loan.status === 'approved').length} · Pending ${dashboard.loans.filter((loan) => loan.status === 'pending').length} · Rejected ${dashboard.loans.filter((loan) => loan.status === 'rejected').length}`}
                        />
                      )}
                    </>
                  ) : (
                    <EmptyState message="No savings records yet." />
                  )}
                </>
              )}

              {activeSection === 'Members' && !formMode && (
                <>
                {!isMemberRole && (
                  <ActionButton label="Add member" onPress={() => startForm('Members')} />
                )}
                {dashboard.members.length ? dashboard.members.map((member) => (
                  <RecordCard
                    key={member._id}
                    title={`${member.firstName || ''} ${member.lastName || ''}`.trim() || 'Member'}
                    subtitle={`Member ID: ${member.memberId}`}
                  >
                    <DetailRow label="Phone" value={member.phone} />
                    <DetailRow label="Total savings" value={formatMoney(member.totalSaving)} />
                    {!isMemberRole && (
                      <>
                        <DetailRow label="Role" value={member.role} />
                        <ActionButton
                          label="Terminate member"
                          secondary
                          onPress={() => void updateRecordStatus(`/employees/${member._id}/terminate`, {
                            totalSaving: amount(member.totalSaving),
                            reason: 'Terminated by staff',
                          })}
                        />
                      </>
                    )}
                  </RecordCard>
                )) : <EmptyState message="No member records found." />}
                </>
              )}

              {activeSection === 'Savings' && !formMode && (
                <>
                <ActionButton label="Record deposit" onPress={() => startForm('Savings')} />
                {dashboard.savings.length ? dashboard.savings.map((deposit) => (
                  <RecordCard
                    key={deposit._id}
                    title={`${deposit.month || ''} ${deposit.year || ''}`.trim() || 'Savings deposit'}
                    subtitle={`${memberName(deposit.employeeId)} · Regular ${formatMoney(deposit.normalSaving)} · Voluntary ${formatMoney(deposit.voluntarySaving)}`}
                  >
                    <DetailRow label="Shared purchase" value={formatMoney(deposit.sharedPurchase)} />
                    <DetailRow label="Registration fee" value={formatMoney(deposit.registrationFee)} />
                    <DetailRow label="Late penalty" value={formatMoney(deposit.latePenalty)} />
                  </RecordCard>
                )) : <EmptyState message="No savings records yet." />}
                </>
              )}

              {activeSection === 'Loans' && !formMode && (
                <>
                <ActionButton label={isMemberRole ? 'Apply for a loan' : 'Create loan'} onPress={() => startForm('Loans')} />
                {dashboard.loans.length ? dashboard.loans.map((loan) => (
                  <RecordCard
                    key={loan._id}
                    title={`${loan.loanType || 'Loan'} loan`}
                    subtitle={`${memberName(loan.employeeId)} · Status: ${loan.status || 'pending'}`}
                  >
                    <DetailRow label="Principal" value={formatMoney(loan.principalAmount)} />
                    <DetailRow label="Remaining balance" value={formatMoney(loan.remainingAmount)} />
                    <DetailRow label="Monthly installment" value={formatMoney(loan.monthlyInstallment)} />
                    <DetailRow label="Duration" value={loan.durationMonths ? `${loan.durationMonths} months` : '—'} />
                    {loan.status === 'pending' && (
                      (user.role.toLowerCase() === 'loan officer' &&
                        (loan.loanOfficerStatus || 'pending') === 'pending') ||
                      (['loan manager', 'vice loan manager'].includes(user.role.toLowerCase()) &&
                        loan.loanOfficerStatus === 'approved' &&
                        (loan.loanManagerStatus || 'pending') === 'pending')
                    ) && (
                      <View style={styles.actionRow}>
                        <ActionButton
                          label="Approve"
                          onPress={() => void updateRecordStatus(`/loans/${loan._id}/approve`)}
                        />
                        <ActionButton
                          label="Reject"
                          onPress={() => void updateRecordStatus(`/loans/${loan._id}/reject`)}
                          secondary
                        />
                      </View>
                    )}
                  </RecordCard>
                )) : <EmptyState message="No loan records yet." />}
                </>
              )}

              {activeSection === 'Payments' && !formMode && (
                <>
                <ActionButton label="Record loan payment" onPress={() => startForm('Payments')} />
                {dashboard.payments.length ? dashboard.payments.map((payment) => (
                  <RecordCard
                    key={payment._id}
                    title={payment.monthYear || 'Loan payment'}
                    subtitle={`${memberName(payment.employeeId)} · Paid ${formatMoney(payment.totalPaid ?? payment.amountPaid)}`}
                  >
                    <DetailRow label="Principal" value={formatMoney(payment.amountPaid)} />
                    <DetailRow label="Interest" value={formatMoney(payment.interestPaid)} />
                    <DetailRow label="Penalty" value={formatMoney(payment.penalty)} />
                  </RecordCard>
                )) : <EmptyState message="No loan payments yet." />}
                </>
              )}

              {activeSection === 'Withdrawals' && !formMode && (
                <>
                <ActionButton
                  label={isMemberRole ? 'Request withdrawal' : 'Create withdrawal request'}
                  onPress={() => startForm('Withdrawals')}
                />
                {dashboard.withdrawals.length ? dashboard.withdrawals.map((withdrawal) => (
                  <RecordCard
                    key={withdrawal._id}
                    title={withdrawal.fullName || memberName(withdrawal.employeeId)}
                    subtitle={`Status: ${withdrawal.status || 'pending'}`}
                  >
                    <DetailRow label="Savings" value={formatMoney(withdrawal.totalSaving)} />
                    <DetailRow label="Reason" value={withdrawal.reason} />
                    {!isMemberRole && withdrawal.status === 'pending' && (
                      <View style={styles.actionRow}>
                        <ActionButton
                          label="Approve"
                          onPress={() => void updateRecordStatus(`/withdrawals/${withdrawal._id}/approve`)}
                        />
                        <ActionButton
                          label="Reject"
                          onPress={() => void updateRecordStatus(`/withdrawals/${withdrawal._id}/reject`)}
                          secondary
                        />
                      </View>
                    )}
                  </RecordCard>
                )) : <EmptyState message="No withdrawal requests." />}
                </>
              )}

              {activeSection === 'Reports' && (
                <>
                  <View style={styles.cards}>
                    <SummaryCard label="Total savings" value={formatMoney(savingsTotal)} icon="💰" />
                    <SummaryCard label="Registration fees" value={formatMoney(sumField(dashboard.savings, 'registrationFee'))} icon="📝" />
                    <SummaryCard label="Late penalties" value={formatMoney(sumField(dashboard.savings, 'latePenalty'))} icon="⚠️" />
                    <SummaryCard label="Loan payments" value={formatMoney(totalPaid)} icon="✅" />
                  </View>
                  <RecordCard
                    title="Loan distribution"
                    subtitle={`Approved ${dashboard.loans.filter((loan) => loan.status === 'approved').length} · Pending ${dashboard.loans.filter((loan) => loan.status === 'pending').length} · Rejected ${dashboard.loans.filter((loan) => loan.status === 'rejected').length}`}
                  />
                </>
              )}

              {activeSection === 'Profile' && !formMode && (
                <View style={styles.profileCard}>
                  <DetailRow label="Member ID" value={dashboard.profile.memberId} />
                  <DetailRow label="First name" value={dashboard.profile.firstName} />
                  <DetailRow label="Last name" value={dashboard.profile.lastName} />
                  <DetailRow label="Phone" value={dashboard.profile.phone} />
                  <DetailRow label="Gender" value={dashboard.profile.gender} />
                  <DetailRow label="Date of birth" value={formatDate(dashboard.profile.birthDate)} />
                  <DetailRow label="Marital status" value={dashboard.profile.maritalStatus} />
                  <View style={styles.actionRow}>
                    <ActionButton label="Edit profile" onPress={() => startForm('Edit Profile')} />
                    <ActionButton label="Change password" onPress={() => navigateTo('Change Password')} secondary />
                  </View>
                </View>
              )}

              {formMode && (
                <View style={styles.formCard}>
                  <Text style={styles.formTitle}>{formTitle(activeSection)}</Text>
                  {getFormFields(activeSection, isMemberRole, dashboard).map((field) => (
                    <InputField
                      key={field.name}
                      label={field.label}
                      options={field.options}
                      placeholder={field.placeholder}
                      secureTextEntry={field.secure}
                      keyboardType={field.keyboardType}
                      value={formValues[field.name] || ''}
                      onChangeText={(value) => updateFormValue(field.name, value)}
                    />
                  ))}
                  {activeSection === 'Loans' && (
                    <>
                      <Text style={styles.fieldLabel}>Member guarantors (if savings do not cover the loan)</Text>
                      {dashboard.members
                        .filter((member) => member.memberId !== dashboard.profile.memberId)
                        .map((member) => {
                          const selected = selectedGuarantors.includes(member._id);
                          return (
                            <Pressable
                              key={member._id}
                              accessibilityRole="button"
                              accessibilityState={{ selected }}
                              onPress={() =>
                                setSelectedGuarantors((current) =>
                                  selected
                                    ? current.filter((id) => id !== member._id)
                                    : [...current, member._id],
                                )
                              }
                              style={[styles.guarantorOption, selected && styles.guarantorOptionSelected]}
                            >
                              <Text style={[styles.guarantorOptionText, selected && styles.guarantorOptionTextSelected]}>
                                {selected ? '✓ ' : ''}{member.firstName} {member.lastName} · {formatMoney(member.totalSaving)}
                              </Text>
                            </Pressable>
                          );
                        })}
                    </>
                  )}
                  {actionError ? <Text style={styles.errorText}>{actionError}</Text> : null}
                  <View style={styles.actionRow}>
                    <ActionButton label={isSaving ? 'Saving…' : 'Save'} disabled={isSaving} onPress={() => void submitForm()} />
                    <ActionButton label="Cancel" secondary onPress={() => { setFormMode(false); setActionError(''); }} />
                  </View>
                </View>
              )}

              {activeSection === 'Reports' && !formMode && (
                <View style={styles.formCard}>
                  <Text style={styles.formTitle}>Generate a report</Text>
                  <InputField
                    label="Report type"
                    options={(isMemberRole
                      ? [['individual-monthly', 'My monthly report'], ['individual-annual', 'My annual report']]
                      : [
                        ['individual-monthly', 'Member monthly'],
                        ['individual-annual', 'Member annual'],
                        ['total-monthly', 'All members monthly'],
                        ['total-annual', 'All members annual'],
                      ]
                    ).map(([value, label]) => ({ value, label }))}
                    value={reportType}
                    onChangeText={setReportType}
                  />
                  {!isMemberRole && reportType.startsWith('individual-') && (
                    <InputField
                      label="Member"
                      options={dashboard.members.map((member) => ({
                        value: member._id,
                        label: `${member.firstName || ''} ${member.lastName || ''} (${member.memberId})`.trim(),
                      }))}
                      value={reportEmployeeId || dashboard.members[0]?._id || ''}
                      onChangeText={setReportEmployeeId}
                    />
                  )}
                  {reportType.endsWith('monthly') && (
                    <InputField
                      label="Month"
                      options={months.map((month) => ({ value: month, label: month }))}
                      value={reportMonth}
                      onChangeText={setReportMonth}
                    />
                  )}
                  <InputField label="Year" keyboardType="number-pad" value={reportYear} onChangeText={setReportYear} />
                  <ActionButton label={isLoadingReport ? 'Generating…' : 'Generate report'} disabled={isLoadingReport} onPress={() => void generateReport()} />
                  {reportError ? <Text style={styles.errorText}>{reportError}</Text> : null}
                  {reportData !== null && <JsonDisplay data={reportData} />}
                </View>
              )}

              {activeSection === 'Dividend' && (
                <View style={styles.formCard}>
                  <InputField label="Year" keyboardType="number-pad" value={reportYear} onChangeText={setReportYear} />
                  {pageError ? <Text style={styles.errorText}>{pageError}</Text> : null}
                  {isLoadingPage ? <ActivityIndicator color={colors.green} /> : <JsonDisplay data={pageData} />}
                </View>
              )}

              {activeSection === 'Profit' && !formMode && (
                <View style={styles.formCard}>
                  <InputField label="Year" keyboardType="number-pad" value={reportYear} onChangeText={setReportYear} />
                  <ActionButton label="Distribute dividend" onPress={() => startForm('Profit')} />
                  {pageError ? <Text style={styles.errorText}>{pageError}</Text> : null}
                  {isLoadingPage ? <ActivityIndicator color={colors.green} /> : <JsonDisplay data={pageData} />}
                </View>
              )}

              {activeSection === 'Income & Expense' && (
                <>
                  <SummaryCard label="Savings and deposit income" value={formatMoney(savingsTotal)} icon="📈" />
                  <SummaryCard label="Loan payments received" value={formatMoney(totalPaid)} icon="✅" />
                  <SummaryCard label="Registration fees" value={formatMoney(sumField(dashboard.savings, 'registrationFee'))} icon="📝" />
                  <SummaryCard label="Late penalties" value={formatMoney(sumField(dashboard.savings, 'latePenalty'))} icon="⚠️" />
                  <EmptyState message="Income and expense totals are based on the account records available to your role." />
                </>
              )}

              {activeSection === 'Balance Sheet' && (
                <View style={styles.formCard}>
                  <Text style={styles.formTitle}>Balance sheet · {reportYear}</Text>
                  {[
                    ['cashOnHand', 'Cash on hand'],
                    ['cashAtBank', 'Cash at bank'],
                    ['accountsReceivable', 'Accounts receivable'],
                    ['otherReceivable', 'Other receivable'],
                    ['officeEquipment', 'Office equipment'],
                    ['furniture', 'Furniture'],
                    ['vehicle', 'Vehicle'],
                    ['building', 'Building'],
                    ['accountsPayable', 'Accounts payable'],
                    ['taxPayable', 'Tax payable'],
                    ['otherLiability', 'Other liabilities'],
                    ['capital', 'Capital'],
                    ['reserve', 'Reserve'],
                    ['retainedEarnings', 'Retained earnings'],
                  ].map(([field, label]) => (
                    <InputField
                      key={field}
                      label={label}
                      keyboardType="decimal-pad"
                      value={balanceSheetValues[field]}
                      onChangeText={(value) => setBalanceSheetValues((current) => ({ ...current, [field]: value }))}
                    />
                  ))}
                  {actionError ? <Text style={styles.errorText}>{actionError}</Text> : null}
                  <ActionButton label="Save balanced sheet" onPress={() => void saveBalanceSheet()} />
                </View>
              )}

              {activeSection === 'Cash Flow' && (
                <View style={styles.formCard}>
                  <InputField label="Year" keyboardType="number-pad" value={reportYear} onChangeText={setReportYear} />
                  <Text style={styles.mutedText}>Cash movement summarized from account records for {reportYear}.</Text>
                  <SummaryCard
                    label="Savings recorded"
                    value={formatMoney(dashboard.savings.filter((record) => String(record.year) === reportYear).reduce((sum, record) => sum + amount(record.normalSaving) + amount(record.voluntarySaving), 0))}
                    icon="📥"
                  />
                  <SummaryCard
                    label="Loan repayments recorded"
                    value={formatMoney(dashboard.payments.filter((payment) => String(payment.createdAt || '').startsWith(reportYear)).reduce((sum, payment) => sum + amount(payment.totalPaid ?? payment.amountPaid), 0))}
                    icon="↩️"
                  />
                  <SummaryCard
                    label="Approved withdrawals"
                    value={formatMoney(dashboard.withdrawals.filter((item) => item.status === 'approved' && String(item.createdAt || '').startsWith(reportYear)).reduce((sum, item) => sum + amount(item.totalSaving), 0))}
                    icon="📤"
                  />
                </View>
              )}

              {activeSection === 'Check Balance' && (
                <View style={styles.formCard}>
                  <InputField
                    label="Month"
                    options={months.map((month) => ({ value: month, label: month }))}
                    value={reportMonth}
                    onChangeText={setReportMonth}
                  />
                  <InputField label="Year" keyboardType="number-pad" value={reportYear} onChangeText={setReportYear} />
                  <SummaryCard
                    label="Savings credits"
                    value={formatMoney(dashboard.savings.filter((record) => record.month === reportMonth && String(record.year) === reportYear).reduce((sum, record) => sum + amount(record.normalSaving) + amount(record.voluntarySaving), 0))}
                    icon="💰"
                  />
                  <SummaryCard
                    label="Loan payment credits"
                    value={formatMoney(dashboard.payments.filter((payment) => payment.monthYear === `${reportMonth} ${reportYear}`).reduce((sum, payment) => sum + amount(payment.totalPaid ?? payment.amountPaid), 0))}
                    icon="✅"
                  />
                  <SummaryCard
                    label="Approved withdrawal debits"
                    value={formatMoney(dashboard.withdrawals.filter((item) => item.status === 'approved' && String(item.createdAt || '').startsWith(reportYear) && new Date(item.createdAt || '').toLocaleString('en-US', { month: 'long' }) === reportMonth).reduce((sum, item) => sum + amount(item.totalSaving), 0))}
                    icon="📤"
                  />
                  <EmptyState message="These totals are calculated from the account activity visible to your role." />
                </View>
              )}
              {activeSection === 'Terminated' && (
                <>
                  {pageError ? <Text style={styles.errorText}>{pageError}</Text> : null}
                  {isLoadingPage ? <ActivityIndicator color={colors.green} /> : (
                    Array.isArray(pageData) && pageData.length
                      ? pageData.map((item) => {
                        const record = item as Record<string, unknown>;
                        const id = String(record._id || '');
                        return (
                          <RecordCard
                            key={id}
                            title={`${String(record.firstName || '')} ${String(record.lastName || '')}`.trim() || 'Former member'}
                            subtitle={`Member ID: ${String(record.memberId || '—')}`}
                          >
                            <DetailRow label="Phone" value={String(record.phone || '—')} />
                            <ActionButton label="Restore member" onPress={() => {
                              if (token) {
                                void apiRequest(`/terminated/restore/${id}`, { token, method: 'POST', body: JSON.stringify({}) })
                                  .then(() => setRefreshKey((current) => current + 1))
                                  .catch((restoreError: unknown) => setPageError(restoreError instanceof Error ? restoreError.message : 'Could not restore member.'));
                              }
                            }} />
                          </RecordCard>
                        );
                      })
                      : <EmptyState message="No terminated members found." />
                  )}
                </>
              )}

              {activeSection === 'Edit Profile' && !formMode && (
                <View style={styles.formCard}>
                  <Text style={styles.formTitle}>Edit profile</Text>
                  <Text style={styles.mutedText}>You can update your phone number. Name and member ID are managed by staff.</Text>
                  <ActionButton label="Edit phone number" onPress={() => startForm('Edit Profile')} />
                </View>
              )}

              {activeSection === 'Change Password' && (
                <View style={styles.formCard}>
                  <Text style={styles.formTitle}>Change password</Text>
                  <Text style={styles.mutedText}>
                    {user.role.toLowerCase() === 'admin'
                      ? 'For an admin password reset, sign out and use Forgot password on the sign-in screen.'
                      : 'Request a password reset. An administrator can review your request.'}
                  </Text>
                  {actionError ? <Text style={styles.errorText}>{actionError}</Text> : null}
                  {user.role.toLowerCase() === 'admin' ? (
                    <ActionButton label="Sign out to reset password" onPress={() => void signOut()} />
                  ) : (
                    <ActionButton label="Request password reset" onPress={() => {
                    void apiRequest<{ message?: string }>('/password-reset-request', {
                      token,
                      method: 'POST',
                      body: JSON.stringify({ memberId: dashboard.profile.memberId }),
                    }).then((result) => setActionError(result.message || 'Password reset request submitted.'))
                      .catch((requestError: unknown) => setActionError(requestError instanceof Error ? requestError.message : 'Could not submit the request.'));
                    }} />
                  )}
                </View>
              )}

              {activeSection === 'Help' && (
                <View style={styles.formCard}>
                  <Text style={styles.formTitle}>Help & support</Text>
                  <RecordCard title="Account access" subtitle="Contact your institution administrator if you cannot sign in or your role is incorrect." />
                  <RecordCard title="Savings and deposits" subtitle="Review your records in Savings. Staff can record monthly deposits and fees." />
                  <RecordCard title="Loans and repayments" subtitle="Loan requests are reviewed by staff. Payments cannot exceed the remaining loan balance." />
                  <RecordCard title="Withdrawals" subtitle="An active loan must be paid off before a withdrawal request can be submitted." />
                </View>
              )}

              {activeSection === 'Settings' && (
                <View style={styles.formCard}>
                  <Text style={styles.formTitle}>System settings</Text>
                  {actionError ? <Text style={styles.errorText}>{actionError}</Text> : null}
                  <InputField
                    label="Language preference"
                    options={['English', 'Amharic', 'Oromiffa', 'Tigrigna'].map((value) => ({ label: value, value }))}
                    value={savedLanguage}
                    onChangeText={(value) => {
                      setSavedLanguage(value);
                      void savePreference('microfinance-mobile-language', value);
                    }}
                  />
                  <SettingToggle
                    label="Dark appearance"
                    enabled={darkMode}
                    onToggle={() => {
                      const next = !darkMode;
                      setDarkMode(next);
                      void savePreference('microfinance-mobile-dark-mode', String(next));
                    }}
                  />
                  <SettingToggle
                    label="Notifications"
                    enabled={notificationsEnabled}
                    onToggle={() => {
                      const next = !notificationsEnabled;
                      setNotificationsEnabled(next);
                      void savePreference('microfinance-mobile-notifications', String(next));
                    }}
                  />
                  <ActionButton label="Sign out" secondary onPress={() => void signOut()} />
                </View>
              )}
            </>
          ) : null}
        </ScrollView>
        <View style={[styles.bottomNavigation, darkMode && styles.darkSurface]}>
          {primarySections.map((section) => (
            <Pressable
              key={section}
              accessibilityRole="button"
              accessibilityState={{ selected: activeSection === section }}
              onPress={() => navigateTo(section)}
              style={styles.bottomNavigationItem}
            >
              <Text style={[styles.bottomNavigationText, activeSection === section && styles.bottomNavigationTextSelected]}>
                {section}
              </Text>
            </Pressable>
          ))}
        </View>
        {isDrawerOpen && (
          <View style={styles.drawerLayer}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close navigation menu"
              onPress={() => setIsDrawerOpen(false)}
              style={styles.drawerBackdrop}
            />
            <View style={[styles.drawer, darkMode && styles.drawerDark]}>
              <View style={styles.drawerHeader}>
                <Text style={styles.drawerBrand}>MICRO-FINANCE</Text>
                <Pressable accessibilityRole="button" onPress={() => setIsDrawerOpen(false)}>
                  <Text style={styles.drawerClose}>×</Text>
                </Pressable>
              </View>
              <ScrollView contentContainerStyle={styles.drawerItems}>
                {visibleSections.map((section) => (
                  <Pressable
                    key={section}
                    accessibilityRole="button"
                    accessibilityState={{ selected: activeSection === section }}
                    onPress={() => navigateTo(section)}
                    style={[styles.drawerItem, activeSection === section && styles.drawerItemSelected]}
                  >
                    <Text style={[styles.drawerItemText, activeSection === section && styles.drawerItemTextSelected]}>
                      {section}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
              <Text style={styles.drawerRole}>{user.role}</Text>
            </View>
          </View>
        )}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={styles.loginContent}
        keyboardShouldPersistTaps="handled"
      >
        {resetMode ? (
          <View style={styles.loginCard}>
            <Text style={styles.loginTitle}>Reset password</Text>
            <Text style={styles.loginSubtitle}>Set a new password for {resetMemberId}.</Text>
            <InputField
              label="New password"
              secureTextEntry
              value={resetPassword}
              onChangeText={setResetPassword}
            />
            <InputField
              label="Confirm new password"
              secureTextEntry
              value={confirmResetPassword}
              onChangeText={setConfirmResetPassword}
            />
            {error ? <View style={styles.errorPanel}><Text style={styles.errorText}>{error}</Text></View> : null}
            <ActionButton label="Reset password" onPress={() => void submitPasswordReset()} />
            <ActionButton
              label="Back to sign in"
              secondary
              onPress={() => {
                setResetMode(false);
                setError('');
                setLoginMessage('');
              }}
            />
          </View>
        ) : (
        <View style={styles.loginCard}>
          <View style={styles.logoMark}>
            <Text style={styles.logoText}>₣</Text>
          </View>
          <Text style={styles.loginTitle}>Micro-Finance</Text>
          <Text style={styles.loginSubtitle}>Sign in to your account</Text>

          <Text style={styles.label}>Login as</Text>
          <View style={styles.pickerContainer}>
            <Picker
              accessibilityLabel="Login as"
              onValueChange={(selectedRole: string) => setRole(selectedRole)}
              selectedValue={role}
              style={styles.picker}
            >
              {roles.map((item) => (
                <Picker.Item
                  key={item}
                  label={item.replace(/\b\w/g, (letter) => letter.toUpperCase())}
                  value={item}
                />
              ))}
            </Picker>
          </View>

          <Text style={styles.label}>Member ID</Text>
          <TextInput
            autoCapitalize="none"
            autoCorrect={false}
            onChangeText={setMemberId}
            placeholder="Enter your member ID"
            placeholderTextColor={colors.placeholder}
            returnKeyType="next"
            style={styles.input}
            value={memberId}
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            onChangeText={setPassword}
            onSubmitEditing={() => void signIn()}
            placeholder="Enter your password"
            placeholderTextColor={colors.placeholder}
            returnKeyType="go"
            secureTextEntry
            style={styles.input}
            value={password}
          />

          {error ? (
            <View style={styles.errorPanel}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}
          {loginMessage ? (
            <View style={styles.successPanel}>
              <Text style={styles.successText}>{loginMessage}</Text>
            </View>
          ) : null}

          <Pressable
            accessibilityRole="button"
            disabled={isSigningIn || !memberId.trim() || !password}
            onPress={() => void signIn()}
            style={[
              styles.primaryButton,
              (isSigningIn || !memberId.trim() || !password) &&
                styles.primaryButtonDisabled,
            ]}
          >
            {isSigningIn ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryButtonText}>Sign in</Text>
            )}
          </Pressable>

          <Pressable
            accessibilityRole="button"
            disabled={!memberId.trim()}
            onPress={() => void requestPasswordReset()}
            style={[styles.forgotButton, !memberId.trim() && styles.primaryButtonDisabled]}
          >
            <Text style={styles.forgotButtonText}>Forgot password?</Text>
          </Pressable>

          <Text style={styles.secureNote}>
            Your session is stored securely on this device.
          </Text>
        </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

type FormFieldConfig = {
  name: string;
  label: string;
  placeholder?: string;
  secure?: boolean;
  keyboardType?: 'default' | 'number-pad' | 'decimal-pad' | 'phone-pad';
  options?: { label: string; value: string }[];
};

function formTitle(section: AppSection): string {
  if (section === 'Members') return 'Add member';
  if (section === 'Savings') return 'Record deposit';
  if (section === 'Loans') return 'Create loan request';
  if (section === 'Payments') return 'Record loan payment';
  if (section === 'Withdrawals') return 'Request withdrawal';
  if (section === 'Profit') return 'Distribute dividend';
  return 'Edit profile';
}

function addMonthsClamped(date: Date, monthsToAdd: number): Date {
  const result = new Date(date);
  const day = result.getDate();
  result.setDate(1);
  result.setMonth(result.getMonth() + monthsToAdd);
  const lastDay = new Date(result.getFullYear(), result.getMonth() + 1, 0).getDate();
  result.setDate(Math.min(day, lastDay));
  return result;
}

function monthlyLoanPayment(loan: MemberLoan): number {
  const principal = amount(loan.principalAmount);
  const duration = Math.max(1, amount(loan.durationMonths));
  const total = loan.loanType === 'normal'
    ? principal * Math.pow(1 + 0.15 / 12, duration)
    : principal * 1.08;
  return Math.round(total / duration);
}

function getFormFields(
  section: AppSection,
  isMember: boolean,
  dashboard: MobileDashboard,
): FormFieldConfig[] {
  const memberOptions = dashboard.members.map((member) => ({
    value: member._id,
    label: `${member.firstName || ''} ${member.lastName || ''} (${member.memberId})`.trim(),
  }));
  if (section === 'Members') {
    return [
      { name: 'firstName', label: 'First name', placeholder: 'First name' },
      { name: 'lastName', label: 'Last name', placeholder: 'Last name' },
      { name: 'memberId', label: 'Member ID', placeholder: 'Member ID' },
      { name: 'phone', label: 'Phone number', placeholder: 'Phone number', keyboardType: 'phone-pad' },
      { name: 'gender', label: 'Gender', options: ['Female', 'Male', 'Other'].map((value) => ({ label: value, value })) },
      { name: 'birthDate', label: 'Date of birth (YYYY-MM-DD)', placeholder: 'YYYY-MM-DD' },
      { name: 'maritalStatus', label: 'Marital status', options: ['Single', 'Married', 'Divorced', 'Widowed'].map((value) => ({ label: value, value })) },
      { name: 'password', label: 'Temporary password', secure: true },
      { name: 'role', label: 'Role', options: roles.map((value) => ({ label: value.replace(/\b\w/g, (letter) => letter.toUpperCase()), value })) },
    ];
  }
  if (section === 'Savings') {
    return [
      { name: 'employeeId', label: 'Member', options: memberOptions },
      { name: 'month', label: 'Month', options: months.map((value) => ({ label: value, value })) },
      { name: 'year', label: 'Year', keyboardType: 'number-pad' },
      { name: 'normalSaving', label: 'Regular savings (ETB)', keyboardType: 'decimal-pad' },
      { name: 'voluntarySaving', label: 'Voluntary savings (ETB)', keyboardType: 'decimal-pad' },
      { name: 'sharedPurchase', label: 'Shared purchase quantity', keyboardType: 'decimal-pad' },
      { name: 'registrationFee', label: 'Registration fee (ETB)', keyboardType: 'decimal-pad' },
      { name: 'latePenalty', label: 'Late penalty (ETB)', keyboardType: 'decimal-pad' },
    ];
  }
  if (section === 'Loans') {
    return [
      ...(!isMember ? [{ name: 'employeeId', label: 'Member', options: memberOptions }] : []),
      { name: 'principalAmount', label: 'Loan amount (ETB)', keyboardType: 'decimal-pad' },
      { name: 'loanType', label: 'Loan category', options: [{ label: 'Normal (15%)', value: 'normal' }, { label: 'Holiday (8%)', value: 'holiday' }] },
      { name: 'durationMonths', label: 'Duration (months)', keyboardType: 'number-pad' },
      { name: 'externalName', label: 'External guarantor name (optional)' },
      { name: 'externalPhone', label: 'External guarantor phone (+2519XXXXXXXX)', keyboardType: 'phone-pad' },
      { name: 'externalDigitalId', label: 'External guarantor digital ID (16 digits)', keyboardType: 'number-pad' },
    ];
  }
  if (section === 'Payments') {
    const loanOptions = dashboard.loans
      .filter((loan) => loan.status === 'approved' && amount(loan.remainingAmount) > 0)
      .map((loan) => ({
        value: loan._id,
        label: `${memberName(loan.employeeId)} · ${loan.loanType || 'Loan'} · remaining ${formatMoney(loan.remainingAmount)}`,
      }));
    return [
      { name: 'loanId', label: 'Active loan', options: loanOptions },
      { name: 'amountPaid', label: 'Payment amount (principal + interest, ETB)', keyboardType: 'decimal-pad' },
      {
        name: 'monthYear',
        label: 'Payment month',
        options: Array.from({ length: 24 }, (_, index) => {
          const date = new Date(new Date().getFullYear(), new Date().getMonth() - index, 1);
          const value = `${months[date.getMonth()]} ${date.getFullYear()}`;
          return { value, label: value };
        }),
      },
    ];
  }
  if (section === 'Withdrawals') {
    return [
      ...(!isMember ? [{ name: 'employeeId', label: 'Member', options: memberOptions }] : []),
      { name: 'reason', label: 'Reason for withdrawal', placeholder: 'Explain the reason' },
    ];
  }
  if (section === 'Profit') {
    return [
      { name: 'employeeId', label: 'Member', options: memberOptions },
      { name: 'savingAmount', label: 'Dividend to savings (ETB)', keyboardType: 'decimal-pad' },
      { name: 'shareAmount', label: 'Dividend to shares (ETB, multiples of 500)', keyboardType: 'decimal-pad' },
    ];
  }
  return [{ name: 'phone', label: 'Phone number', placeholder: 'Phone number' }];
}

function amount(value: number | string | undefined): number {
  const parsed = Number.parseFloat(String(value ?? 0));
  return Number.isFinite(parsed) ? parsed : 0;
}

function sumField(
  records: MobileDashboard['savings'],
  field: (typeof savingAmountFields)[number],
): number {
  return records.reduce((total, record) => total + amount(record[field]), 0);
}

function memberName(value: MemberSummary | string | undefined): string {
  if (!value || typeof value === 'string') return 'Member';
  return `${value.firstName || ''} ${value.lastName || ''}`.trim() || value.memberId;
}

function formatMoney(value: number | string | undefined): string {
  return `${amount(value).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} ETB`;
}

function formatDate(value: string | undefined): string {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString();
}

function SummaryCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: string;
}) {
  return (
    <View style={styles.summaryCard}>
      <View style={styles.summaryIcon}>
        <Text style={styles.summaryIconText}>{icon}</Text>
      </View>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text adjustsFontSizeToFit minimumFontScale={0.75} style={styles.summaryValue}>
        {value}
      </Text>
    </View>
  );
}

function RecordCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children?: ReactNode;
}) {
  return (
    <View style={styles.recordCard}>
      <Text style={styles.recordTitle}>{title}</Text>
      <Text style={styles.recordSubtitle}>{subtitle}</Text>
      {children ? <View style={styles.recordDetails}>{children}</View> : null}
    </View>
  );
}

function DetailRow({ label, value }: { label: string; value?: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value || '—'}</Text>
    </View>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateText}>{message}</Text>
    </View>
  );
}

function InputField({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  keyboardType = 'default',
  options,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'number-pad' | 'decimal-pad' | 'phone-pad';
  options?: { label: string; value: string }[];
}) {
  return (
    <View style={styles.fieldContainer}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {options ? (
        <View style={styles.pickerContainer}>
          <Picker selectedValue={value || options[0]?.value || ''} onValueChange={onChangeText} style={styles.picker}>
            {options.map((option) => (
              <Picker.Item key={option.value} label={option.label} value={option.value} />
            ))}
          </Picker>
        </View>
      ) : (
        <TextInput
          autoCapitalize="none"
          keyboardType={keyboardType}
          onChangeText={onChangeText}
          placeholder={placeholder || label}
          placeholderTextColor={colors.placeholder}
          secureTextEntry={secureTextEntry}
          style={styles.input}
          value={value}
        />
      )}
    </View>
  );
}

function ActionButton({
  label,
  onPress,
  secondary = false,
  disabled = false,
}: {
  label: string;
  onPress: () => void;
  secondary?: boolean;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={[styles.actionButton, secondary && styles.actionButtonSecondary, disabled && styles.primaryButtonDisabled]}
    >
      <Text style={[styles.actionButtonText, secondary && styles.actionButtonTextSecondary]}>{label}</Text>
    </Pressable>
  );
}

function SettingToggle({
  label,
  enabled,
  onToggle,
}: {
  label: string;
  enabled: boolean;
  onToggle: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: enabled }}
      onPress={onToggle}
      style={styles.settingToggle}
    >
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={[styles.settingToggleValue, enabled && styles.settingToggleValueActive]}>
        {enabled ? 'On' : 'Off'}
      </Text>
    </Pressable>
  );
}

function JsonDisplay({ data }: { data: unknown }) {
  if (data === null || data === undefined || (Array.isArray(data) && data.length === 0)) {
    return <EmptyState message="No data available." />;
  }
  if (Array.isArray(data)) {
    return (
      <View style={styles.jsonList}>
        {data.map((item, index) => (
          <View key={index} style={styles.jsonCard}>
            <JsonDisplay data={item} />
          </View>
        ))}
      </View>
    );
  }
  if (typeof data === 'object') {
    return (
      <View style={styles.jsonDetails}>
        {Object.entries(data as Record<string, unknown>)
          .filter(([key]) => !key.startsWith('_'))
          .map(([key, value]) => (
            <DetailRow
              key={key}
              label={key.replace(/([A-Z])/g, ' $1')}
              value={value !== null && typeof value === 'object'
                ? JSON.stringify(value)
                : String(value ?? '—')}
            />
          ))}
      </View>
    );
  }
  return <Text style={styles.detailValue}>{String(data)}</Text>;
}

const colors = {
  green: '#087f5b',
  darkGreen: '#075b44',
  ink: '#142033',
  muted: '#64748b',
  border: '#dbe4ee',
  background: '#f3f7f6',
  placeholder: '#94a3b8',
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  darkSafeArea: {
    backgroundColor: '#101827',
  },
  appHeader: {
    minHeight: 66,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 12,
    backgroundColor: colors.darkGreen,
  },
  darkSurface: {
    backgroundColor: '#142033',
  },
  contentScroll: {
    flex: 1,
  },
  contentScrollDark: {
    backgroundColor: '#101827',
  },
  menuButton: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  menuButtonText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
  },
  headerTitles: {
    flex: 1,
    minWidth: 0,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
  headerSubtitle: {
    color: '#d1fae5',
    fontSize: 12,
    marginTop: 3,
  },
  headerSignOut: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  headerSignOutText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  bottomNavigation: {
    minHeight: 60,
    flexDirection: 'row',
    alignItems: 'stretch',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: '#fff',
    paddingHorizontal: 4,
  },
  bottomNavigationItem: {
    minWidth: 56,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  bottomNavigationText: {
    color: colors.muted,
    fontSize: 10,
    textAlign: 'center',
    fontWeight: '700',
  },
  bottomNavigationTextSelected: {
    color: colors.green,
  },
  drawerLayer: {
    ...StyleSheet.absoluteFill,
    zIndex: 10,
    justifyContent: 'flex-start',
  },
  drawerBackdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(15,23,42,0.52)',
  },
  drawer: {
    width: '82%',
    maxWidth: 340,
    height: '100%',
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 16,
    backgroundColor: '#fff',
    elevation: 18,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 18,
    shadowOffset: { width: 5, height: 0 },
  },
  drawerDark: {
    backgroundColor: '#142033',
  },
  drawerHeader: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  drawerBrand: {
    color: colors.darkGreen,
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  drawerClose: {
    color: colors.ink,
    fontSize: 30,
    lineHeight: 34,
  },
  drawerItems: {
    gap: 6,
    paddingBottom: 12,
  },
  drawerItem: {
    minHeight: 46,
    justifyContent: 'center',
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  drawerItemSelected: {
    backgroundColor: '#e8f5f0',
  },
  drawerItemText: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '600',
  },
  drawerItemTextSelected: {
    color: colors.green,
    fontWeight: '800',
  },
  drawerRole: {
    paddingTop: 12,
    color: colors.muted,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    textTransform: 'capitalize',
  },
  listHeading: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: '800',
    marginTop: 24,
    marginBottom: 10,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  retryButton: {
    alignSelf: 'flex-start',
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 9,
    backgroundColor: '#fff',
  },
  loginContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 22,
  },
  loginCard: {
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    padding: 24,
    backgroundColor: '#fff',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#0f172a',
    shadowOpacity: 0.08,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 4,
  },
  logoMark: {
    width: 58,
    height: 58,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e8f5f0',
    borderRadius: 18,
    marginBottom: 18,
  },
  logoText: {
    color: colors.green,
    fontSize: 32,
    fontWeight: '800',
  },
  loginTitle: {
    color: colors.ink,
    fontSize: 28,
    fontWeight: '800',
  },
  loginSubtitle: {
    color: colors.muted,
    fontSize: 15,
    marginTop: 6,
    marginBottom: 28,
  },
  label: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 9,
    marginTop: 15,
  },
  input: {
    minHeight: 50,
    paddingHorizontal: 15,
    color: colors.ink,
    fontSize: 15,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: '#fbfdff',
  },
  pickerContainer: {
    minHeight: 52,
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: '#fbfdff',
  },
  picker: {
    color: colors.ink,
  },
  primaryButton: {
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 22,
    borderRadius: 13,
    backgroundColor: colors.green,
  },
  primaryButtonDisabled: {
    opacity: 0.55,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  forgotButton: {
    alignSelf: 'center',
    padding: 10,
    marginTop: 8,
  },
  forgotButtonText: {
    color: colors.green,
    fontSize: 13,
    fontWeight: '700',
  },
  secureNote: {
    color: colors.muted,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 18,
  },
  errorPanel: {
    padding: 12,
    marginTop: 16,
    backgroundColor: '#fff1f2',
    borderColor: '#fecdd3',
    borderWidth: 1,
    borderRadius: 12,
  },
  errorText: {
    color: '#be123c',
    fontSize: 13,
    lineHeight: 19,
  },
  successPanel: {
    padding: 12,
    marginTop: 16,
    backgroundColor: '#ecfdf5',
    borderColor: '#a7f3d0',
    borderWidth: 1,
    borderRadius: 12,
  },
  successText: {
    color: '#047857',
    fontSize: 13,
    lineHeight: 19,
  },
  dashboardContent: {
    flexGrow: 1,
    padding: 20,
    paddingBottom: 20,
  },
  hero: {
    minHeight: 210,
    padding: 24,
    justifyContent: 'center',
    backgroundColor: colors.darkGreen,
    borderRadius: 24,
    overflow: 'hidden',
  },
  brand: {
    color: '#a7f3d0',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  welcome: {
    color: '#fff',
    fontSize: 27,
    lineHeight: 34,
    fontWeight: '800',
    marginTop: 14,
  },
  roleText: {
    color: '#d1fae5',
    fontSize: 14,
    textTransform: 'capitalize',
    marginTop: 6,
  },
  signOutButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 9,
    marginTop: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  signOutText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  sectionHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 28,
    marginBottom: 14,
  },
  sectionTitle: {
    color: colors.ink,
    fontSize: 19,
    fontWeight: '800',
  },
  refreshButton: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#fff',
  },
  refreshText: {
    color: colors.green,
    fontWeight: '700',
    fontSize: 13,
  },
  cards: {
    gap: 13,
  },
  summaryCard: {
    minHeight: 104,
    justifyContent: 'center',
    padding: 18,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#fff',
    shadowColor: '#0f172a',
    shadowOpacity: 0.04,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 2,
  },
  summaryIcon: {
    position: 'absolute',
    right: 16,
    top: 16,
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 13,
    backgroundColor: '#e8f5f0',
  },
  summaryIconText: {
    fontSize: 21,
  },
  summaryLabel: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '600',
  },
  summaryValue: {
    color: colors.ink,
    fontSize: 24,
    fontWeight: '800',
    marginTop: 7,
    marginRight: 42,
  },
  loadingPanel: {
    minHeight: 120,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: '#fff',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
  },
  mutedText: {
    color: colors.muted,
    fontSize: 14,
  },
  recordCard: {
    padding: 16,
    marginBottom: 11,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#fff',
  },
  recordTitle: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: '800',
    textTransform: 'capitalize',
  },
  recordSubtitle: {
    color: colors.muted,
    fontSize: 13,
    marginTop: 5,
    textTransform: 'capitalize',
  },
  recordDetails: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 9,
  },
  profileCard: {
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#fff',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  detailLabel: {
    flex: 1,
    color: colors.muted,
    fontSize: 13,
  },
  detailValue: {
    flex: 1,
    color: colors.ink,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'right',
  },
  emptyState: {
    alignItems: 'center',
    padding: 22,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#fff',
  },
  emptyStateText: {
    color: colors.muted,
    fontSize: 13,
    textAlign: 'center',
  },
  formCard: {
    padding: 16,
    marginBottom: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#fff',
    gap: 12,
  },
  formTitle: {
    color: colors.ink,
    fontSize: 17,
    fontWeight: '800',
  },
  fieldContainer: {
    gap: 7,
  },
  fieldLabel: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '700',
  },
  actionButton: {
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: colors.green,
    marginVertical: 3,
  },
  actionButtonSecondary: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#fff',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
  },
  actionButtonTextSecondary: {
    color: colors.ink,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 9,
    flexWrap: 'wrap',
    marginTop: 8,
  },
  guarantorOption: {
    minHeight: 42,
    justifyContent: 'center',
    paddingHorizontal: 11,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
  },
  guarantorOptionSelected: {
    borderColor: colors.green,
    backgroundColor: '#e8f5f0',
  },
  guarantorOptionText: {
    color: colors.ink,
    fontSize: 12,
  },
  guarantorOptionTextSelected: {
    color: colors.green,
    fontWeight: '800',
  },
  settingToggle: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
  },
  settingToggleValue: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '800',
  },
  settingToggleValueActive: {
    color: colors.green,
  },
  jsonList: {
    gap: 10,
  },
  jsonCard: {
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: '#fbfdff',
  },
  jsonDetails: {
    gap: 11,
  },
});
