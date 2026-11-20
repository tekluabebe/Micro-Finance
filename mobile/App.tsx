import { StatusBar } from 'expo-status-bar';
import * as SecureStore from 'expo-secure-store';
import * as FileSystem from 'expo-file-system/legacy';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as XLSX from 'xlsx';
import { useEffect, useRef, useState } from 'react';
import type { ElementRef, ReactNode } from 'react';
import { useRouter } from 'expo-router';
import { Picker } from '@react-native-picker/picker';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import {
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
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

type SupportAccount = { id: string; name?: string; email: string };
type ExternalGuarantor = { fullName: string; phone: string; digitalId: string };
type SupportRequest = {
  _id: string;
  supportUserId?: SupportAccount | string;
  senderEmail: string;
  recipientEmail: string;
  question: string;
  status: string;
};
type SupportResponse = {
  _id: string;
  originalQuestion: string;
  response: string;
};
type ActivityLogEntry = {
  _id: string;
  actorMemberId?: string;
  actorRole: string;
  method: string;
  path: string;
  statusCode: number;
  createdAt: string;
};

function getActivityLogs(data: unknown): ActivityLogEntry[] {
  if (typeof data !== 'object' || data === null || !('logs' in data) || !Array.isArray(data.logs)) {
    return [];
  }

  return data.logs.filter((entry): entry is ActivityLogEntry =>
    typeof entry === 'object' &&
    entry !== null &&
    '_id' in entry &&
    typeof entry._id === 'string' &&
    'actorRole' in entry &&
    typeof entry.actorRole === 'string' &&
    'method' in entry &&
    typeof entry.method === 'string' &&
    'path' in entry &&
    typeof entry.path === 'string' &&
    'statusCode' in entry &&
    typeof entry.statusCode === 'number' &&
    'createdAt' in entry &&
    typeof entry.createdAt === 'string' &&
    (!('actorMemberId' in entry) || typeof entry.actorMemberId === 'string')
  );
}

function getActivityHistoryTotal(data: unknown): number {
  if (typeof data !== 'object' || data === null || !('total' in data)) return 0;
  return typeof data.total === 'number' && Number.isFinite(data.total) ? data.total : 0;
}

const memberSections = [
  'Overview',
  'Members',
  'Loans',
  'Withdrawals',
  'Reports',
  'Activity History',
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
  'Activity History',
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
const defaultBankIncomeRows = [
  { name: 'yebank weled9858/የባንክ ወለድ9858', amount: '0' },
  { name: 'yebank weled3001/የባንክ ወለድ3001', amount: '0' },
];
const defaultExpenseRows = [
  { title: 'Bank Service9858/የባንክ አገልግሎት9858', amount: '0' },
  { title: 'Savings Interest Expense/የቁጠባ ወለድ ወጪ', amount: '0' },
  { title: 'Bank Service 3001/የባንክ አገልግሎት 3001', amount: '0' },
  { title: 'Commission Fees and Tax/የኮሚሽን ክፍያና ታክስ', amount: '0' },
];
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
const helpTopics = [
  {
    question: 'Why is an overdue amount not showing?',
    answer: 'The loan has a two-month grace period, so overdue amounts do not appear until it ends.',
  },
  {
    question: 'Can increasing my monthly savings help me qualify for a loan?',
    answer: 'The system allows a loan up to three times current savings, subject to guarantor eligibility and the maximum limit.',
  },
  {
    question: 'What should I do if I forget my password?',
    answer: 'Submit a password reset request or use Change Password after signing in.',
  },
  {
    question: 'How can I download a report?',
    answer: 'Open Reports, select a report type, month, and year, then generate it.',
  },
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
  const passwordInputRef = useRef<ElementRef<typeof TextInput>>(null);
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
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [memberSearch, setMemberSearch] = useState('');
  const [guarantorType, setGuarantorType] = useState<'member' | 'external'>('member');
  const [externalGuarantors, setExternalGuarantors] = useState<ExternalGuarantor[]>([
    { fullName: '', phone: '', digitalId: '' },
  ]);
  const [notificationFilter, setNotificationFilter] = useState('pending');
  const [activityPage, setActivityPage] = useState(1);
  const [resetPasswords, setResetPasswords] = useState<Record<string, string>>({});
  const [selectedGuarantors, setSelectedGuarantors] = useState<string[]>([]);
  const [multiplePayment, setMultiplePayment] = useState(false);
  const [selectedPaymentMonths, setSelectedPaymentMonths] = useState<string[]>([]);
  const [actionError, setActionError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [reportType, setReportType] = useState('individual-monthly');
  const [reportEmployeeId, setReportEmployeeId] = useState('');
  const [reportMonth, setReportMonth] = useState(months[new Date().getMonth()]);
  const [reportYear, setReportYear] = useState(String(new Date().getFullYear()));
  const [previousYear, setPreviousYear] = useState(String(new Date().getFullYear() - 1));
  const [reportData, setReportData] = useState<unknown>(null);
  const [reportError, setReportError] = useState('');
  const [isLoadingReport, setIsLoadingReport] = useState(false);
  const [pageData, setPageData] = useState<unknown>(null);
  const [pageError, setPageError] = useState('');
  const [balanceSheetStatus, setBalanceSheetStatus] = useState('');
  const [bankIncomeRows, setBankIncomeRows] = useState(defaultBankIncomeRows);
  const [otherIncomeRows, setOtherIncomeRows] = useState([{ name: '', amount: '0' }]);
  const [expenseRows, setExpenseRows] = useState(defaultExpenseRows);
  const [incomeExpenseStatus, setIncomeExpenseStatus] = useState('');
  const [helpSearch, setHelpSearch] = useState('');
  const [supportToken, setSupportToken] = useState('');
  const [supportUser, setSupportUser] = useState<SupportAccount | null>(null);
  const [supportMode, setSupportMode] = useState<'login' | 'register'>('login');
  const [supportName, setSupportName] = useState('');
  const [supportEmail, setSupportEmail] = useState('');
  const [supportPassword, setSupportPassword] = useState('');
  const [supportRecipientEmail, setSupportRecipientEmail] = useState('');
  const [supportQuestion, setSupportQuestion] = useState('');
  const [supportRequests, setSupportRequests] = useState<SupportRequest[]>([]);
  const [supportResponses, setSupportResponses] = useState<SupportResponse[]>([]);
  const [supportReplyDrafts, setSupportReplyDrafts] = useState<Record<string, string>>({});
  const [isLoadingPage, setIsLoadingPage] = useState(false);
  const [savedLanguage, setSavedLanguage] = useState('English');
  const [darkMode, setDarkMode] = useState(false);
  const [monthlyPenalty, setMonthlyPenalty] = useState('50');
  const [emailNotification, setEmailNotification] = useState(true);
  const [loanNotification, setLoanNotification] = useState(true);
  const [passwordNotification, setPasswordNotification] = useState(true);
  const [withdrawalNotification, setWithdrawalNotification] = useState(true);
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
    Promise.all([
      SecureStore.getItemAsync('microfinance-support-token'),
      SecureStore.getItemAsync('microfinance-support-user'),
    ])
      .then(([savedToken, savedUser]) => {
        if (savedToken && savedUser) {
          setSupportToken(savedToken);
          setSupportUser(JSON.parse(savedUser) as SupportAccount);
        }
      })
      .catch((storageError: unknown) => {
        console.error('Could not restore support session:', storageError);
        setActionError('Could not restore the saved support session.');
      });
  }, []);

  useEffect(() => {
    if (activeSection !== 'Help' || !user) return;
    let active = true;
    const request = user.role.toLowerCase() === 'admin'
      ? apiRequest<SupportRequest[]>('/support/requests/admin/all', { token: token || undefined })
      : supportUser
        ? apiRequest<SupportResponse[]>(`/support/responses/${supportUser.id}`)
        : Promise.resolve([]);
    request
      .then((items) => {
        if (!active) return;
        if (user.role.toLowerCase() === 'admin') setSupportRequests(items as SupportRequest[]);
        else setSupportResponses(items as SupportResponse[]);
      })
      .catch((loadError: unknown) => {
        if (!active) return;
        setPageError(loadError instanceof Error ? loadError.message : 'Could not load support messages.');
      });
    return () => {
      active = false;
    };
  }, [activeSection, user, supportUser, token, refreshKey]);

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
    if (!token || !['Balance Sheet', 'Dividend', 'Profit', 'Terminated', 'Income & Expense', 'Activity History'].includes(activeSection)) {
      setPageData(null);
      setPageError('');
      return;
    }

    let active = true;
    setPageData(null);
    setPageError('');
    setIsLoadingPage(true);
    const request =
      activeSection === 'Balance Sheet'
        ? apiRequest<unknown>(`/balance-sheets/${reportYear}`, { token })
        : activeSection === 'Income & Expense'
        ? apiRequest<unknown>(`/financial-reports?year=${reportYear}`, { token })
        : activeSection === 'Dividend'
        ? apiRequest<unknown>(`/dividends?year=${reportYear}`, { token })
        : activeSection === 'Profit'
          ? apiRequest<unknown>(`/dividends?year=${reportYear}`, { token })
          : activeSection === 'Activity History'
              ? apiRequest<unknown>(`/audit-logs?page=${activityPage}&limit=50`, { token })
            : apiRequest<unknown>('/terminated', { token });
    request
      .then(async (data) => {
        if (!active) return;
        if (activeSection === 'Balance Sheet' && data === null && user?.role.toLowerCase() !== 'member') {
          const legacy = await SecureStore.getItemAsync(`microfinance-balance-sheet-${reportYear}`);
          if (legacy) {
            const parsed: unknown = JSON.parse(legacy);
            if (
              typeof parsed === 'object' &&
              parsed !== null &&
              'values' in parsed &&
              typeof parsed.values === 'object' &&
              parsed.values !== null
            ) {
              const migrated = await apiRequest<{ report?: unknown }>(
                `/balance-sheets/${reportYear}`,
                {
                  token,
                  method: 'PUT',
                  body: JSON.stringify({
                    previousYear: Number(reportYear) - 1,
                    formData: parsed.values,
                  }),
                },
              );
              if (active) setPageData(migrated.report || null);
              return;
            }
          }
        }
        setPageData(data);
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
  }, [token, activeSection, reportYear, refreshKey, activityPage]);

  useEffect(() => {
    if (activeSection !== 'Income & Expense') return;
    const reports = Array.isArray(pageData) ? pageData as Record<string, unknown>[] : [];
    const report = reports.find((item) => Number(item.year) === Number(reportYear));
    setBankIncomeRows(
      Array.isArray(report?.bankIncomes)
        ? (report.bankIncomes as { name?: string; amount?: number | string }[])
          .map((item) => ({ name: item.name || '', amount: String(item.amount ?? 0) }))
        : defaultBankIncomeRows,
    );
    setOtherIncomeRows(
      Array.isArray(report?.otherIncomes)
        ? (report.otherIncomes as { name?: string; amount?: number | string }[])
          .map((item) => ({ name: item.name || '', amount: String(item.amount ?? 0) }))
        : [{ name: '', amount: '0' }],
    );
    setExpenseRows(
      Array.isArray(report?.expenses)
        ? (report.expenses as { title?: string; amount?: number | string }[])
          .map((item) => ({ title: item.title || '', amount: String(item.amount ?? 0) }))
        : defaultExpenseRows,
    );
    setIncomeExpenseStatus('');
  }, [activeSection, pageData, reportYear]);

  useEffect(() => {
    if (activeSection !== 'Balance Sheet') return;
    if (typeof pageData === 'object' && pageData !== null && 'formData' in pageData) {
      const saved = pageData as { formData?: Record<string, unknown>; previousYear?: number };
      if (saved.formData) {
        setBalanceSheetValues(
          Object.fromEntries(
            Object.entries(saved.formData).map(([key, value]) => [key, String(value ?? '')]),
          ),
        );
      }
      if (saved.previousYear) setPreviousYear(String(saved.previousYear));
    } else if (pageData === null && !isLoadingPage && !pageError) {
      setBalanceSheetValues({
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
    }
  }, [activeSection, pageData, isLoadingPage, pageError]);

  useEffect(() => {
    if (!token) return;
    let active = true;
    apiRequest<{
      preferences?: {
        language?: string;
        darkMode?: boolean;
        emailNotification?: boolean;
        loanNotification?: boolean;
        passwordNotification?: boolean;
        withdrawalNotification?: boolean;
      };
      system?: { monthlyLatePenalty?: number };
    }>('/settings', { token })
      .then(async ({ preferences, system }) => {
        if (!active) return;
        let resolvedPreferences = preferences;
        if (!resolvedPreferences) {
          const [
            cachedLanguage,
            cachedDarkMode,
            cachedEmail,
            cachedLoan,
            cachedPassword,
            cachedWithdrawal,
          ] = await Promise.all([
            SecureStore.getItemAsync('microfinance-mobile-language'),
            SecureStore.getItemAsync('microfinance-mobile-dark-mode'),
            SecureStore.getItemAsync('emailNotification'),
            SecureStore.getItemAsync('loanNotification'),
            SecureStore.getItemAsync('passwordNotification'),
            SecureStore.getItemAsync('withdrawalNotification'),
          ]);
          resolvedPreferences = {
            language: cachedLanguage || 'English',
            darkMode: cachedDarkMode === 'true',
            emailNotification: cachedEmail === null || cachedEmail === 'true',
            loanNotification: cachedLoan === null || cachedLoan === 'true',
            passwordNotification: cachedPassword === null || cachedPassword === 'true',
            withdrawalNotification: cachedWithdrawal === null || cachedWithdrawal === 'true',
          };
          await apiRequest('/settings/preferences', {
            token,
            method: 'PUT',
            body: JSON.stringify(resolvedPreferences),
          });
        }
        if (!active) return;
        if (resolvedPreferences.language) setSavedLanguage(resolvedPreferences.language);
        if (typeof resolvedPreferences.darkMode === 'boolean') setDarkMode(resolvedPreferences.darkMode);
        if (typeof resolvedPreferences.emailNotification === 'boolean') setEmailNotification(resolvedPreferences.emailNotification);
        if (typeof resolvedPreferences.loanNotification === 'boolean') setLoanNotification(resolvedPreferences.loanNotification);
        if (typeof resolvedPreferences.passwordNotification === 'boolean') setPasswordNotification(resolvedPreferences.passwordNotification);
        if (typeof resolvedPreferences.withdrawalNotification === 'boolean') setWithdrawalNotification(resolvedPreferences.withdrawalNotification);
        setMonthlyPenalty(String(system?.monthlyLatePenalty ?? 50));
      })
      .catch((storageError: unknown) => {
        if (!active) return;
        console.error('Could not load shared preferences:', storageError);
        setActionError(storageError instanceof Error ? storageError.message : 'Could not load shared settings.');
      });
    return () => {
      active = false;
    };
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

  const startForm = (section: AppSection, member?: MemberSummary) => {
    setActiveSection(section);
    setFormMode(true);
    setActionError('');
    setFormSuccess('');
    setEditingMemberId(section === 'Members' ? member?._id || null : null);
    setSelectedGuarantors([]);
    setGuarantorType('member');
    setExternalGuarantors([{ fullName: '', phone: '', digitalId: '' }]);
    setMultiplePayment(false);
    setSelectedPaymentMonths([]);
    const now = new Date();
    const defaults: Record<string, string> = {
      month: months[now.getMonth()],
      year: String(now.getFullYear()),
      monthYear: `${months[now.getMonth()]} ${now.getFullYear()}`,
      durationMonths: '6',
      loanType: 'normal',
      role: 'member',
      employeeId: dashboard?.members.find((member) => member.role === 'member')?._id || '',
      normalSaving: '200',
      latePenalty: '0',
      voluntarySaving: '0',
      sharedPurchase: '0',
      registrationFee: '0',
      amountPaid: '',
      interestPaid: '',
      penalty: '0',
    };
    if (member) {
      Object.assign(defaults, {
        firstName: member.firstName || '',
        lastName: member.lastName || '',
        memberId: member.memberId || '',
        phone: member.phone || '',
        gender: member.gender || '',
        birthDate: member.birthDate ? String(member.birthDate).slice(0, 10) : '',
        maritalStatus: member.maritalStatus || '',
        role: member.role || 'member',
        fatherName: member.fatherName || '',
        motherName: member.motherName || '',
        wifeName: member.wifeName || '',
        wifeFatherName: member.wifeFatherName || '',
        wifeMotherName: member.wifeMotherName || '',
        husbandName: member.husbandName || '',
        husbandFatherName: member.husbandFatherName || '',
        husbandMotherName: member.husbandMotherName || '',
        brothers: (member.brothers || []).join(', '),
        sisters: (member.sisters || []).join(', '),
        children: (member.children || []).join(', '),
      });
    }
    if (section === 'Edit Profile') defaults.phone = dashboard?.profile.phone || '';
    if (section === 'Change Password') {
      defaults.currentPassword = '';
      defaults.newPassword = '';
      defaults.confirmPassword = '';
    }
    if (section === 'Payments') {
      const activeLoan = dashboard?.loans.find(
        (loan) => loan.status === 'approved' && amount(loan.remainingAmount) > 0,
      );
      defaults.loanId = activeLoan?._id || '';
      defaults.amountPaid = activeLoan ? String(monthlyLoanPayment(activeLoan)) : '';
      defaults.monthYear = activeLoan
        ? getLoanPaymentMonths(activeLoan).find((monthYear) =>
          !dashboard?.payments.some((payment) =>
            payment.loanId === activeLoan._id && payment.monthYear === monthYear
          ),
        ) || ''
        : '';
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
    if (field === 'loanId') setSelectedPaymentMonths([]);
    setFormValues((current) => ({
      ...current,
      [field]: value,
      ...(field === 'loanId'
        ? {
          amountPaid: (() => {
            const loan = dashboard?.loans.find((item) => item._id === value);
            return loan ? String(monthlyLoanPayment(loan)) : '';
          })(),
          monthYear: (() => {
            const loan = dashboard?.loans.find((item) => item._id === value);
            return loan
              ? getLoanPaymentMonths(loan).find((monthYear) =>
                !dashboard?.payments.some((payment) =>
                  payment.loanId === loan._id && payment.monthYear === monthYear
                ),
              ) || ''
              : '';
          })(),
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
        const memberBody = {
          firstName: formValues.firstName?.trim(),
          lastName: formValues.lastName?.trim(),
          memberId: formValues.memberId?.trim(),
          phone: formValues.phone?.trim(),
          gender: formValues.gender,
          birthDate: formValues.birthDate || undefined,
          maritalStatus: formValues.maritalStatus,
          role: formValues.role || 'member',
          fatherName: formValues.fatherName?.trim(),
          motherName: formValues.motherName?.trim(),
          wifeName: formValues.wifeName?.trim(),
          wifeFatherName: formValues.wifeFatherName?.trim(),
          wifeMotherName: formValues.wifeMotherName?.trim(),
          husbandName: formValues.husbandName?.trim(),
          husbandFatherName: formValues.husbandFatherName?.trim(),
          husbandMotherName: formValues.husbandMotherName?.trim(),
          brothers: formValues.brothers?.split(',').map((item) => item.trim()).filter(Boolean),
          sisters: formValues.sisters?.split(',').map((item) => item.trim()).filter(Boolean),
          children: formValues.children?.split(',').map((item) => item.trim()).filter(Boolean),
        };
        await apiRequest(editingMemberId ? `/employees/${editingMemberId}` : '/employees', {
          token,
          method: editingMemberId ? 'PUT' : 'POST',
          body: JSON.stringify({
            ...memberBody,
            ...(!editingMemberId ? { password: formValues.password } : {}),
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
        const principalAmount = amount(formValues.principalAmount);
        const durationMonths = amount(formValues.durationMonths);
        const getMemberSavings = (member: MemberSummary & { hasActiveLoan?: boolean; activeGuarantees?: number }) =>
          dashboard?.savings
            .filter((deposit) => {
              const depositEmployeeId = deposit.employeeId && typeof deposit.employeeId !== 'string'
                ? deposit.employeeId._id
                : deposit.employeeId;
              return String(depositEmployeeId) === member._id || deposit.memberId === member.memberId;
            })
            .reduce((total, deposit) =>
              total + amount(deposit.normalSaving) + amount(deposit.voluntarySaving), 0) || 0;
        const borrowerSaving = employee ? getMemberSavings(employee) : 0;
        const maximumLoan = Math.min(borrowerSaving * 3, 300000);
        if (principalAmount <= 0) {
          throw new Error('Enter a loan amount greater than zero.');
        }
        if (principalAmount > maximumLoan) {
          throw new Error(`The maximum loan for this member is ${formatMoney(maximumLoan)}.`);
        }
        if (!Number.isInteger(durationMonths) || durationMonths < 1 || durationMonths > 12) {
          throw new Error('Choose a loan duration from 1 to 12 months.');
        }
        const unfinishedLoan = dashboard?.loans.find((loan) => {
          const loanEmployeeId = loan.employeeId && typeof loan.employeeId !== 'string'
            ? loan.employeeId._id
            : loan.employeeId;
          return String(loanEmployeeId) === employeeId &&
            loan.loanType === formValues.loanType &&
            !['rejected', 'completed'].includes(String(loan.status)) &&
            amount(loan.remainingAmount) > 0;
        });
        if (unfinishedLoan) {
          throw new Error('The member must finish their existing loan of this type before applying again.');
        }
        const guaranteeGap = Math.max(0, principalAmount - borrowerSaving);
        const guarantorMembers = user.role.toLowerCase() === 'member'
          ? dashboard?.guarantorCandidates
          : dashboard?.members;
        const selectedGuarantorMembers = guarantorMembers?.filter((member) =>
          selectedGuarantors.includes(member._id),
        ) || [];
        if (guaranteeGap > 0 && guarantorType === 'member') {
          const guarantorSavings = selectedGuarantorMembers.reduce((total, member) =>
            total + getMemberSavings(member), 0);
          if (selectedGuarantorMembers.length === 0 || guarantorSavings < guaranteeGap) {
            throw new Error(`Select member guarantors with at least ${formatMoney(guaranteeGap)} in savings.`);
          }
          const ineligibleGuarantor = selectedGuarantorMembers.find((member) => {
            const isMemberApplicant = user.role.toLowerCase() === 'member';
            const hasActiveLoan = isMemberApplicant
              ? member.hasActiveLoan
              : dashboard?.loans.some((loan) => {
                const loanEmployeeId = loan.employeeId && typeof loan.employeeId !== 'string'
                  ? loan.employeeId._id
                  : loan.employeeId;
                return String(loanEmployeeId) === member._id &&
                  loan.status === 'approved' && amount(loan.remainingAmount) > 0;
              });
            const activeGuarantees = isMemberApplicant
              ? amount(member.activeGuarantees)
              : dashboard?.loans.filter((loan) =>
                loan.status === 'approved' && amount(loan.remainingAmount) > 0 &&
                loan.guarantors?.some((guarantor) =>
                  String(typeof guarantor === 'string' ? guarantor : guarantor._id) === member._id,
                ),
              ).length || 0;
            return hasActiveLoan || activeGuarantees >= 2;
          });
          if (ineligibleGuarantor) {
            throw new Error(`${ineligibleGuarantor.firstName || 'A selected guarantor'} has an active loan or already guarantees two active loans.`);
          }
        }
        const normalizedExternalGuarantors = externalGuarantors.map((guarantor) => ({
          fullName: guarantor.fullName.trim(),
          phone: guarantor.phone.trim(),
          digitalId: guarantor.digitalId.trim(),
        }));
        if (guaranteeGap > 0 && guarantorType === 'external') {
          if (!normalizedExternalGuarantors.length || normalizedExternalGuarantors.some((guarantor) =>
            !guarantor.fullName || !/^\+2519\d{8}$/.test(guarantor.phone) || !/^\d{16}$/.test(guarantor.digitalId)
          )) {
            throw new Error('Each external guarantor needs a name, a valid +2519XXXXXXXX phone, and a 16-digit digital ID.');
          }
        }
        await apiRequest('/loans', {
          token,
          method: 'POST',
          body: JSON.stringify({
            employeeId,
            guarantors: guaranteeGap > 0 && guarantorType === 'member'
              ? selectedGuarantors
              : [],
            principalAmount,
            loanType: formValues.loanType,
            durationMonths,
            totalSaving: borrowerSaving,
            externalGuarantors: guaranteeGap > 0 && guarantorType === 'external'
              ? normalizedExternalGuarantors
              : [],
          }),
        });
      } else if (activeSection === 'Payments') {
        if (!formValues.loanId) throw new Error('Select a loan to record a payment.');
        const loan = dashboard?.loans.find((item) => item._id === formValues.loanId);
        if (!loan) throw new Error('The selected loan was not found. Refresh and try again.');
        const paymentMonths = multiplePayment
          ? selectedPaymentMonths
          : formValues.monthYear?.trim()
            ? [formValues.monthYear.trim()]
            : [];
        if (!paymentMonths.length) {
          throw new Error(multiplePayment ? 'Select at least one month for this payment.' : 'Enter the month for this payment.');
        }
        const alreadyPaidMonth = paymentMonths.find((monthYear) =>
          dashboard?.payments.some((payment) =>
            payment.loanId === loan._id && payment.monthYear === monthYear
          ),
        );
        if (alreadyPaidMonth) {
          throw new Error(`A payment is already recorded for ${alreadyPaidMonth}.`);
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
        const penalty = missedMonths * amount(monthlyPenalty);
        const totalCharge =
          (Math.round(principalPaid) + Math.round(interestPaid) + Math.round(penalty)) *
          paymentMonths.length;
        if (totalCharge > amount(loan.remainingAmount)) {
          throw new Error(`Payment and penalty cannot exceed the remaining balance (${formatMoney(loan.remainingAmount)}).`);
        }
        const employeeId = typeof loan.employeeId === 'string' ? loan.employeeId : loan.employeeId?._id;
        const paymentValues = paymentMonths.map((monthYear) => ({
          amountPaid: Math.round(principalPaid),
          interestPaid: Math.round(interestPaid),
          penalty: Math.round(penalty),
          monthYear,
        }));
        await apiRequest(multiplePayment ? '/loan-payments/batch' : '/loan-payments', {
          token,
          method: 'POST',
          body: JSON.stringify(multiplePayment
            ? { loanId: loan._id, employeeId, payments: paymentValues }
            : { loanId: loan._id, employeeId, ...paymentValues[0] }),
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
      } else if (activeSection === 'Change Password') {
        if (formValues.newPassword !== formValues.confirmPassword) {
          throw new Error('New passwords do not match.');
        }
        if ((formValues.newPassword || '').length < 6) {
          throw new Error('New password must contain at least 6 characters.');
        }
        const result = await apiRequest<{ message?: string }>('/auth/change-password', {
          token,
          method: 'PUT',
          body: JSON.stringify({
            currentPassword: formValues.currentPassword,
            newPassword: formValues.newPassword,
          }),
        });
        setFormSuccess(result.message || 'Password updated successfully.');
      }

      setFormMode(false);
      setFormValues({});
      setEditingMemberId(null);
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

  const deleteMember = async (id: string) => {
    if (!token) return;
    try {
      await apiRequest(`/employees/${id}`, { token, method: 'DELETE' });
      setRefreshKey((current) => current + 1);
    } catch (deleteError: unknown) {
      setActionError(deleteError instanceof Error ? deleteError.message : 'Could not delete the member.');
    }
  };

  const approveWithdrawal = async (withdrawal: MobileDashboard['withdrawals'][number]) => {
    if (!token) return;
    const employeeId = typeof withdrawal.employeeId === 'string'
      ? withdrawal.employeeId
      : withdrawal.employeeId?._id;
    if (!employeeId) {
      setActionError('The withdrawal request has no associated member account.');
      return;
    }
    try {
      await apiRequest(`/withdrawals/${withdrawal._id}/approve`, { token, method: 'PUT' });
      await apiRequest(`/employees/${employeeId}/terminate`, {
        token,
        method: 'PUT',
        body: JSON.stringify({
          totalSaving: amount(withdrawal.totalSaving),
          reason: withdrawal.reason || 'Withdrawal approved',
        }),
      });
      setRefreshKey((current) => current + 1);
    } catch (approveError: unknown) {
      setActionError(approveError instanceof Error
        ? `Withdrawal approval/termination failed: ${approveError.message}`
        : 'Withdrawal approval/termination failed.');
    }
  };

  const approvePasswordReset = async (requestId: string) => {
    if (!token) return;
    const newPassword = resetPasswords[requestId] || '';
    if (newPassword.length < 6) {
      setActionError('Temporary password must contain at least 6 characters.');
      return;
    }
    try {
      await apiRequest(`/password-reset-request/${requestId}/approve`, {
        token,
        method: 'PUT',
        body: JSON.stringify({ newPassword }),
      });
      setResetPasswords((current) => ({ ...current, [requestId]: '' }));
      setRefreshKey((current) => current + 1);
    } catch (approveError: unknown) {
      setActionError(approveError instanceof Error ? approveError.message : 'Could not approve password reset.');
    }
  };

  const markAllNotificationsRead = async () => {
    if (!token || !dashboard) return;
    const pendingReads = [
      ...dashboard.withdrawals
        .filter((item) => !item.isRead)
        .map((item) => `/withdrawals/${item._id}/read`),
      ...dashboard.loans
        .filter((item) => !item.isRead)
        .map((item) => `/loans/${item._id}/read`),
      ...dashboard.passwordRequests
        .filter((item) => !item.isRead)
        .map((item) => `/password-reset-request/${item._id}/read`),
    ];
    try {
      await Promise.all(pendingReads.map((path) =>
        apiRequest(path, { token, method: 'PUT', body: JSON.stringify({}) }),
      ));
      setActionError('');
      setRefreshKey((current) => current + 1);
    } catch (readError: unknown) {
      setActionError(readError instanceof Error
        ? `Some notifications could not be marked read: ${readError.message}`
        : 'Some notifications could not be marked read.');
    }
  };

  const authenticateSupport = async () => {
    setPageError('');
    if (!supportEmail.trim() || !supportPassword || (supportMode === 'register' && !supportName.trim())) {
      setPageError('Enter the required support account details.');
      return;
    }
    try {
      const result = await apiRequest<{ token: string; user: SupportAccount }>(
        `/support/auth/${supportMode}`,
        {
          method: 'POST',
          body: JSON.stringify({
            name: supportName.trim(),
            email: supportEmail.trim(),
            password: supportPassword,
          }),
        },
      );
      await Promise.all([
        SecureStore.setItemAsync('microfinance-support-token', result.token),
        SecureStore.setItemAsync('microfinance-support-user', JSON.stringify(result.user)),
      ]);
      setSupportToken(result.token);
      setSupportUser(result.user);
      setSupportPassword('');
      setPageError('');
    } catch (authError: unknown) {
      setPageError(authError instanceof Error ? authError.message : 'Support sign-in failed.');
    }
  };

  const sendSupportRequest = async () => {
    if (!supportToken) {
      setPageError('Sign in to your support account first.');
      return;
    }
    if (!supportRecipientEmail.trim() || !supportQuestion.trim()) {
      setPageError('Enter the support recipient email and your question.');
      return;
    }
    try {
      await apiRequest('/support/requests', {
        token: supportToken,
        method: 'POST',
        body: JSON.stringify({
          recipientEmail: supportRecipientEmail.trim(),
          question: supportQuestion.trim(),
        }),
      });
      setSupportQuestion('');
      setPageError('');
      setActionError('');
      setRefreshKey((current) => current + 1);
    } catch (sendError: unknown) {
      setPageError(sendError instanceof Error ? sendError.message : 'Could not send support request.');
    }
  };

  const sendSupportResponse = async (requestId: string) => {
    const response = supportReplyDrafts[requestId]?.trim();
    if (!response) {
      setPageError('Enter a response before sending.');
      return;
    }
    try {
      await apiRequest('/support/responses', {
        token: token || undefined,
        method: 'POST',
        body: JSON.stringify({ supportRequestId: requestId, response }),
      });
      setSupportReplyDrafts((current) => ({ ...current, [requestId]: '' }));
      setRefreshKey((current) => current + 1);
    } catch (sendError: unknown) {
      setPageError(sendError instanceof Error ? sendError.message : 'Could not send support response.');
    }
  };

  const markSupportResponseRead = async (responseId: string) => {
    try {
      await apiRequest(`/support/responses/${responseId}/read`, {
        method: 'PUT',
        body: JSON.stringify({}),
      });
      setRefreshKey((current) => current + 1);
    } catch (readError: unknown) {
      setPageError(readError instanceof Error ? readError.message : 'Could not mark response as read.');
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

  const exportReport = async (format: 'pdf' | 'xlsx', title: string, data: unknown) => {
    if (data === null || data === undefined) {
      setActionError('Generate or load report data before exporting.');
      return;
    }
    setActionError('');
    setIsExporting(true);
    try {
      const rows = toReportRows(data);
      const safeName = title.replace(/[^a-z0-9]+/gi, '_').replace(/^_|_$/g, '');
      if (format === 'pdf') {
        const tableRows = rows.map((row) =>
          `<tr>${Object.values(row).map((value) => `<td>${escapeHtml(String(value ?? ''))}</td>`).join('')}</tr>`,
        ).join('');
        const headers = rows.length
          ? Object.keys(rows[0]).map((key) => `<th>${escapeHtml(key)}</th>`).join('')
          : '<th>Report</th>';
        const html = `<html><head><meta name="viewport" content="width=device-width, initial-scale=1" /><style>body{font-family:Arial,sans-serif;padding:24px;color:#142033}h1{color:#075b44}table{border-collapse:collapse;width:100%}th,td{border:1px solid #dbe4ee;padding:8px;text-align:left}th{background:#e8f5f0}</style></head><body><h1>${escapeHtml(title)}</h1><p>Generated ${new Date().toLocaleString()}</p><table><thead><tr>${headers}</tr></thead><tbody>${tableRows}</tbody></table></body></html>`;
        const file = await Print.printToFileAsync({ html });
        if (!(await Sharing.isAvailableAsync())) {
          throw new Error('File sharing is not available on this device.');
        }
        await Sharing.shareAsync(file.uri, { UTI: '.pdf', mimeType: 'application/pdf', dialogTitle: title });
      } else {
        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.json_to_sheet(rows);
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Report');
        const base64 = XLSX.write(workbook, { bookType: 'xlsx', type: 'base64' });
        const uri = `${FileSystem.cacheDirectory}${safeName}_${reportYear}.xlsx`;
        await FileSystem.writeAsStringAsync(uri, base64, {
          encoding: FileSystem.EncodingType.Base64,
        });
        if (!(await Sharing.isAvailableAsync())) {
          throw new Error('File sharing is not available on this device.');
        }
        await Sharing.shareAsync(uri, {
          UTI: 'org.openxmlformats.spreadsheetml.sheet',
          mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          dialogTitle: title,
        });
      }
    } catch (exportError: unknown) {
      console.error(`Could not export ${format.toUpperCase()} report:`, exportError);
      setActionError(exportError instanceof Error ? exportError.message : `Could not export ${format.toUpperCase()} report.`);
    } finally {
      setIsExporting(false);
    }
  };

  const savePreference = async (key: string, value: string): Promise<boolean> => {
    try {
      if (!token) throw new Error('Sign in before saving preferences.');
      const preferenceKey: Record<string, string> = {
        'microfinance-mobile-language': 'language',
        'microfinance-mobile-dark-mode': 'darkMode',
        emailNotification: 'emailNotification',
        loanNotification: 'loanNotification',
        passwordNotification: 'passwordNotification',
        withdrawalNotification: 'withdrawalNotification',
      };
      const mappedKey = preferenceKey[key];
      if (!mappedKey) throw new Error('Unsupported preference.');
      const preferenceValue = mappedKey === 'language' ? value : value === 'true';
      await apiRequest('/settings/preferences', {
        token,
        method: 'PUT',
        body: JSON.stringify({ [mappedKey]: preferenceValue }),
      });
      setActionError('');
      setFormSuccess('Preference saved and synchronized.');
      return true;
    } catch (preferenceError: unknown) {
      console.error('Could not save shared preference:', preferenceError);
      setActionError(preferenceError instanceof Error ? preferenceError.message : 'Could not save this preference.');
      return false;
    }
  };

  const saveMonthlyPenalty = async () => {
    const value = Number(monthlyPenalty);
    if (!token || user?.role.toLowerCase() !== 'admin') {
      setActionError('Only an administrator can change the monthly late penalty.');
      return;
    }
    if (!Number.isFinite(value) || value < 0) {
      setActionError('Monthly late penalty must be a non-negative number.');
      return;
    }
    try {
      await apiRequest('/settings/system', {
        token,
        method: 'PUT',
        body: JSON.stringify({ monthlyLatePenalty: value }),
      });
      setActionError('');
      setFormSuccess('System setting saved and synchronized.');
    } catch (settingsError: unknown) {
      setActionError(settingsError instanceof Error ? settingsError.message : 'Could not save system settings.');
    }
  };

  const saveBalanceSheet = async () => {
    setBalanceSheetStatus('');
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
      await apiRequest(`/balance-sheets/${reportYear}`, {
        token: token || undefined,
        method: 'PUT',
        body: JSON.stringify({
          previousYear: Number(previousYear),
          formData: values,
        }),
      });
      setActionError('');
      setBalanceSheetStatus(`Balance sheet for ${reportYear} saved and synced.`);
      setRefreshKey((current) => current + 1);
    } catch (saveError: unknown) {
      console.error('Could not save the shared balance sheet:', saveError);
      setActionError(saveError instanceof Error ? saveError.message : 'Could not save the balance sheet.');
    }
  };

  const saveIncomeExpense = async () => {
    if (!token || !dashboard) return;
    if (user?.role.toLowerCase() === 'member') {
      setActionError('Members cannot save financial reports.');
      return;
    }

    const report = calculateIncomeExpenseReport(
      dashboard,
      reportYear,
      bankIncomeRows,
      otherIncomeRows,
      expenseRows,
    );

    setActionError('');
    setIncomeExpenseStatus('');
    try {
      await apiRequest('/financial-reports', {
        token,
        method: 'POST',
        body: JSON.stringify(report),
      });
      setIncomeExpenseStatus(`Financial report for ${reportYear} saved.`);
      setRefreshKey((current) => current + 1);
    } catch (saveError: unknown) {
      setActionError(saveError instanceof Error ? saveError.message : 'Could not save the financial report.');
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
    const isLoanManagerRole = ['loan manager', 'vice loan manager'].includes(user.role.toLowerCase());
    const visibleLoans = (dashboard?.loans ?? []).filter(
      (loan) => !isLoanManagerRole || isOfficerApprovedLoan(loan),
    );
    const loanApplicantId = isMemberRole
      ? dashboard?.members[0]?._id
      : formValues.employeeId;
    const loanApplicant = dashboard?.members.find((member) => member._id === loanApplicantId);
    const loanApplicantSavings = loanApplicant
      ? (dashboard?.savings ?? [])
        .filter((deposit) => {
          const depositEmployeeId = deposit.employeeId && typeof deposit.employeeId !== 'string'
            ? deposit.employeeId._id
            : deposit.employeeId;
          return String(depositEmployeeId) === loanApplicant._id ||
            deposit.memberId === loanApplicant.memberId;
        })
        .reduce((total, deposit) =>
          total + amount(deposit.normalSaving) + amount(deposit.voluntarySaving), 0)
      : 0;
    const loanPrincipal = amount(formValues.principalAmount);
    const loanDuration = Math.max(1, amount(formValues.durationMonths));
    const calculatedLoanTotal = formValues.loanType === 'normal'
      ? loanPrincipal * Math.pow(1 + 0.15 / 12, loanDuration)
      : loanPrincipal * 1.08;
    const roundedLoanTotal = Math.ceil(calculatedLoanTotal);
    const loanGuaranteeGap = Math.max(0, loanPrincipal - loanApplicantSavings);
    const loanMaximum = Math.min(loanApplicantSavings * 3, 300000);
    const selectedPaymentLoan = dashboard?.loans.find((loan) => loan._id === formValues.loanId);
    const paidPaymentMonths = new Set(
      dashboard?.payments
        .filter((payment) => payment.loanId === formValues.loanId)
        .map((payment) => payment.monthYear) ?? [],
    );
    const availablePaymentMonths = selectedPaymentLoan
      ? getLoanPaymentMonths(selectedPaymentLoan).filter((monthYear) => !paidPaymentMonths.has(monthYear))
      : [];
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
    const incomeExpenseReport = dashboard
      ? calculateIncomeExpenseReport(
        dashboard,
        reportYear,
        bankIncomeRows,
        otherIncomeRows,
        expenseRows,
      )
      : null;
    const balanceSheetAmounts = Object.fromEntries(
      Object.entries(balanceSheetValues).map(([field, value]) => [field, amount(value)]),
    ) as Record<string, number>;
    const totalBalanceSheetAssets =
      balanceSheetAmounts.cashOnHand + balanceSheetAmounts.cashAtBank +
      balanceSheetAmounts.accountsReceivable + balanceSheetAmounts.otherReceivable +
      balanceSheetAmounts.officeEquipment + balanceSheetAmounts.furniture +
      balanceSheetAmounts.vehicle + balanceSheetAmounts.building;
    const totalBalanceSheetLiabilitiesAndEquity =
      balanceSheetAmounts.accountsPayable + balanceSheetAmounts.taxPayable +
      balanceSheetAmounts.otherLiability + balanceSheetAmounts.capital +
      balanceSheetAmounts.reserve + balanceSheetAmounts.retainedEarnings;
    const balanceSheetExport = {
      year: Number(reportYear),
      previousYear: Number(previousYear),
      ...balanceSheetAmounts,
      totalAssets: totalBalanceSheetAssets,
      totalLiabilitiesAndEquity: totalBalanceSheetLiabilitiesAndEquity,
    };

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
                      <InputField
                        label="Notification filter"
                        options={[
                          { value: 'pending', label: 'Pending' },
                          { value: 'unread', label: 'Unread' },
                          { value: 'all', label: 'All' },
                        ]}
                        value={notificationFilter}
                        onChangeText={setNotificationFilter}
                      />
                      <ActionButton
                        label="Mark all notifications read"
                        secondary
                        onPress={() => void markAllNotificationsRead()}
                      />
                      {dashboard.withdrawals
                        .filter((item) => notificationFilter === 'all' ||
                          (notificationFilter === 'unread' ? !item.isRead : item.status === 'pending'))
                        .map((item) => (
                          <RecordCard
                            key={`withdrawal-${item._id}`}
                            title={`Withdrawal · ${item.fullName || memberName(item.employeeId)}`}
                            subtitle={`Status: ${item.status || 'pending'}${item.isRead ? '' : ' · unread'}`}
                          >
                            <DetailRow label="Savings" value={formatMoney(item.totalSaving)} />
                            <DetailRow label="Reason" value={item.reason} />
                            <View style={styles.actionRow}>
                              {!item.isRead && (
                                <ActionButton
                                  label="Mark read"
                                  secondary
                                  onPress={() => void updateRecordStatus(`/withdrawals/${item._id}/read`)}
                                />
                              )}
                              {item.status === 'pending' && (
                                <>
                                  <ActionButton label="Approve & terminate" onPress={() => void approveWithdrawal(item)} />
                                  <ActionButton
                                    label="Reject"
                                    secondary
                                    onPress={() => void updateRecordStatus(`/withdrawals/${item._id}/reject`)}
                                  />
                                </>
                              )}
                            </View>
                          </RecordCard>
                        ))}
                      {dashboard.loans
                        .filter((item) => item.status === 'pending' &&
                          (!isLoanManagerRole || isOfficerApprovedLoan(item)) &&
                          (notificationFilter === 'all' || (notificationFilter === 'unread' ? !item.isRead : true)))
                        .map((loan) => {
                          return (
                            <RecordCard
                              key={`loan-${loan._id}`}
                              title={`Loan request · ${memberName(loan.employeeId)}`}
                              subtitle={`Status: ${loan.approvalStage || loan.status}${loan.isRead ? '' : ' · unread'}`}
                            >
                              <DetailRow label="Requested" value={formatMoney(loan.principalAmount)} />
                              <View style={styles.actionRow}>
                                {!loan.isRead && (
                                  <ActionButton
                                    label="Mark read"
                                    secondary
                                    onPress={() => void updateRecordStatus(`/loans/${loan._id}/read`)}
                                  />
                                )}
                                {canReviewLoan(loan, user.role) && (
                                  <>
                                    <ActionButton label="Approve" onPress={() => void updateRecordStatus(`/loans/${loan._id}/approve`)} />
                                    <ActionButton
                                      label="Reject"
                                      secondary
                                      onPress={() => void updateRecordStatus(`/loans/${loan._id}/reject`)}
                                    />
                                  </>
                                )}
                              </View>
                            </RecordCard>
                          );
                        })}
                      {dashboard.passwordRequests
                        .filter((item) => notificationFilter === 'all' ||
                          (notificationFilter === 'unread' ? !item.isRead : item.status === 'pending'))
                        .map((item) => (
                          <RecordCard
                            key={`password-${item._id}`}
                            title={`Password reset · ${item.fullName || item.memberId}`}
                            subtitle={`Member ID: ${item.memberId}${item.isRead ? '' : ' · unread'}`}
                          >
                            <InputField
                              label="Temporary password"
                              secureTextEntry
                              value={resetPasswords[item._id] || ''}
                              onChangeText={(value) => setResetPasswords((current) => ({ ...current, [item._id]: value }))}
                            />
                            <View style={styles.actionRow}>
                              {!item.isRead && (
                                <ActionButton
                                  label="Mark read"
                                  secondary
                                  onPress={() => void updateRecordStatus(`/password-reset-request/${item._id}/read`)}
                                />
                              )}
                              {item.status === 'pending' && (
                                <>
                                  <ActionButton label="Approve reset" onPress={() => void approvePasswordReset(item._id)} />
                                  <ActionButton
                                    label="Reject"
                                    secondary
                                    onPress={() => void updateRecordStatus(`/password-reset-request/${item._id}/reject`)}
                                  />
                                </>
                              )}
                            </View>
                          </RecordCard>
                        ))}
                      {dashboard.withdrawals.length + dashboard.loans.filter((loan) => loan.status === 'pending').length +
                        dashboard.passwordRequests.length === 0 && <EmptyState message="No notifications." />}
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
                  <>
                    <ActionButton label="Add member" onPress={() => startForm('Members')} />
                    <InputField
                      label="Search members"
                      placeholder="Name or member ID"
                      value={memberSearch}
                      onChangeText={setMemberSearch}
                    />
                  </>
                )}
                {dashboard.members.length ? dashboard.members
                  .filter((member) => {
                    if (isMemberRole || !memberSearch.trim()) return true;
                    const query = memberSearch.trim().toLowerCase();
                    return `${member.memberId} ${member.firstName || ''} ${member.lastName || ''}`
                      .toLowerCase().includes(query);
                  })
                  .map((member) => (
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
                        <DetailRow label="Age / category" value={`${member.age ?? '—'} / ${member.category || '—'}`} />
                        <View style={styles.actionRow}>
                        <ActionButton
                          label="Edit member"
                          secondary
                          onPress={() => startForm('Members', member)}
                        />
                        <ActionButton
                          label="Delete member"
                          secondary
                          onPress={() => Alert.alert(
                            'Delete member?',
                            'This permanently deletes the member and associated savings, loans, and withdrawals.',
                            [
                              { text: 'Cancel', style: 'cancel' },
                              { text: 'Delete', style: 'destructive', onPress: () => void deleteMember(member._id) },
                            ],
                          )}
                        />
                        </View>
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
                {visibleLoans.length ? visibleLoans.map((loan) => (
                  <RecordCard
                    key={loan._id}
                    title={`${loan.loanType || 'Loan'} loan`}
                    subtitle={`${memberName(loan.employeeId)} · Status: ${loan.status || 'pending'}`}
                  >
                    <DetailRow label="Principal" value={formatMoney(loan.principalAmount)} />
                    <DetailRow label="Remaining balance" value={formatMoney(loan.remainingAmount)} />
                    <DetailRow label="Monthly installment" value={formatMoney(loan.monthlyInstallment)} />
                    <DetailRow label="Duration" value={loan.durationMonths ? `${loan.durationMonths} months` : '—'} />
                    {canReviewLoan(loan, user.role) && (
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

              {activeSection === 'Activity History' && (
                <View style={styles.formCard}>
                  <Text style={styles.formTitle}>Activity history</Text>
                  <Text style={styles.mutedText}>
                    Showing recent activity. Administrators can view all users; other accounts see their own activity.
                  </Text>
                  {pageError ? <Text style={styles.errorText}>{pageError}</Text> : null}
                  {isLoadingPage ? <ActivityIndicator color={colors.green} /> : null}
                  {!isLoadingPage && getActivityLogs(pageData).map((entry) => (
                    <RecordCard
                      key={entry._id}
                      title={`${entry.method} ${entry.path}`}
                      subtitle={`${entry.actorRole}${entry.actorMemberId ? ` · ${entry.actorMemberId}` : ''} · ${formatDate(entry.createdAt)}`}
                    >
                      <DetailRow label="Result" value={String(entry.statusCode)} />
                    </RecordCard>
                  ))}
                  {!isLoadingPage && !pageError && getActivityLogs(pageData).length === 0 && (
                    <EmptyState message="No activity recorded yet." />
                  )}
                  <View style={styles.actionRow}>
                    <ActionButton
                      label="Previous"
                      secondary
                      disabled={activityPage <= 1 || isLoadingPage}
                      onPress={() => setActivityPage((current) => Math.max(1, current - 1))}
                    />
                    <Text style={styles.mutedText}>
                      Page {activityPage} of {Math.max(1, Math.ceil(getActivityHistoryTotal(pageData) / 50))}
                    </Text>
                    <ActionButton
                      label="Next"
                      secondary
                      disabled={activityPage * 50 >= getActivityHistoryTotal(pageData) || isLoadingPage}
                      onPress={() => setActivityPage((current) => current + 1)}
                    />
                  </View>
                  <ActionButton label="Refresh history" secondary onPress={() => setRefreshKey((current) => current + 1)} />
                </View>
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
                  <Text style={styles.formTitle}>
                    {activeSection === 'Members' && editingMemberId ? 'Edit member' : formTitle(activeSection)}
                  </Text>
                  {activeSection === 'Loans' && loanGuaranteeGap > 0 && (
                    <InputField
                      label="Guarantor type"
                      options={[
                        { label: 'Member guarantors', value: 'member' },
                        { label: 'External guarantor', value: 'external' },
                      ]}
                      value={guarantorType}
                      onChangeText={(value) => {
                        if (value === 'member' || value === 'external') {
                          setGuarantorType(value);
                          setSelectedGuarantors([]);
                        }
                      }}
                    />
                  )}
                  {activeSection === 'Payments' && (
                    <SettingToggle
                      label="Pay multiple months"
                      enabled={multiplePayment}
                      onToggle={() => {
                        setMultiplePayment((current) => !current);
                        setSelectedPaymentMonths([]);
                      }}
                    />
                  )}
                  {getFormFields(activeSection, isMemberRole, dashboard, Boolean(editingMemberId), formValues.loanId)
                    .filter((field) => !(activeSection === 'Payments' && multiplePayment && field.name === 'monthYear'))
                    .map((field) => (
                    <InputField
                      key={field.name}
                      label={field.label}
                      options={field.options}
                      placeholder={field.placeholder}
                      secureTextEntry={field.secure}
                      keyboardType={field.keyboardType}
                      disabled={field.disabled}
                      value={formValues[field.name] || ''}
                      onChangeText={(value) => updateFormValue(field.name, value)}
                    />
                  ))}
                  {activeSection === 'Payments' && multiplePayment && (
                    <View style={styles.formCard}>
                      <Text style={styles.fieldLabel}>Select months for payment</Text>
                      {availablePaymentMonths.map((monthYear) => {
                        const selected = selectedPaymentMonths.includes(monthYear);
                        return (
                          <Pressable
                            key={monthYear}
                            accessibilityRole="checkbox"
                            accessibilityState={{ checked: selected }}
                            onPress={() => setSelectedPaymentMonths((current) =>
                              selected
                                ? current.filter((value) => value !== monthYear)
                                : [...current, monthYear])}
                            style={[styles.guarantorOption, selected && styles.guarantorOptionSelected]}
                          >
                            <Text style={[styles.guarantorOptionText, selected && styles.guarantorOptionTextSelected]}>
                              {selected ? '☑ ' : '□ '}{monthYear}
                            </Text>
                          </Pressable>
                        );
                      })}
                      {!availablePaymentMonths.length && (
                        <Text style={styles.mutedText}>Select an active loan to view its payment months.</Text>
                      )}
                    </View>
                  )}
                  {activeSection === 'Loans' && loanGuaranteeGap > 0 && guarantorType === 'external' && (
                    <View style={styles.formCard}>
                      {externalGuarantors.map((guarantor, index) => (
                        <View key={`external-guarantor-${index}`}>
                          <Text style={styles.listHeading}>External guarantor {index + 1}</Text>
                          <InputField
                            label="Full name"
                            value={guarantor.fullName}
                            onChangeText={(value) => setExternalGuarantors((current) =>
                              current.map((item, itemIndex) => itemIndex === index ? { ...item, fullName: value } : item))}
                          />
                          <InputField
                            label="Phone (+2519XXXXXXXX)"
                            keyboardType="phone-pad"
                            value={guarantor.phone}
                            onChangeText={(value) => setExternalGuarantors((current) =>
                              current.map((item, itemIndex) => itemIndex === index ? { ...item, phone: value } : item))}
                          />
                          <InputField
                            label="Digital ID (16 digits)"
                            keyboardType="number-pad"
                            value={guarantor.digitalId}
                            onChangeText={(value) => setExternalGuarantors((current) =>
                              current.map((item, itemIndex) => itemIndex === index ? { ...item, digitalId: value } : item))}
                          />
                          <ActionButton
                            label="Remove external guarantor"
                            secondary
                            onPress={() => setExternalGuarantors((current) =>
                              current.filter((_, itemIndex) => itemIndex !== index))}
                          />
                        </View>
                      ))}
                      <ActionButton
                        label="Add external guarantor"
                        onPress={() => setExternalGuarantors((current) => [
                          ...current,
                          { fullName: '', phone: '', digitalId: '' },
                        ])}
                      />
                    </View>
                  )}
                  {activeSection === 'Loans' && loanApplicant && (
                    <View style={styles.profileCard}>
                      <Text style={styles.listHeading}>Loan estimate</Text>
                      <DetailRow label="Member savings" value={formatMoney(loanApplicantSavings)} />
                      <DetailRow label="Maximum eligible loan" value={formatMoney(loanMaximum)} />
                      <DetailRow label="Amount requiring guarantors" value={formatMoney(loanGuaranteeGap)} />
                      <DetailRow label="Total repayment" value={formatMoney(roundedLoanTotal)} />
                      <DetailRow label="Monthly installment" value={formatMoney(Math.ceil(roundedLoanTotal / loanDuration))} />
                      <DetailRow label="Estimated final payment" value={addMonthsClamped(new Date(), loanDuration).toLocaleDateString()} />
                    </View>
                  )}
                  {activeSection === 'Loans' && loanGuaranteeGap > 0 && guarantorType === 'member' && (
                    <>
                      <Text style={styles.fieldLabel}>Member guarantors (if savings do not cover the loan)</Text>
                      {(isMemberRole
                        ? (dashboard.guarantorCandidates ?? [])
                        : dashboard.members
                      )
                        .filter((member) =>
                          member.role === 'member' &&
                          (isMemberRole || member._id !== formValues.employeeId),
                        )
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
                      {isMemberRole && !dashboard.guarantorCandidates?.length ? (
                        <Text style={styles.mutedText}>
                          No other member guarantors are available. Please refresh or contact staff for help.
                        </Text>
                      ) : null}
                    </>
                  )}
                  {actionError ? <Text style={styles.errorText}>{actionError}</Text> : null}
                  {formSuccess ? <Text style={styles.successText}>{formSuccess}</Text> : null}
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
                      options={dashboard.members.filter((member) => member.role === 'member').map((member) => ({
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
                  {reportData !== null && (
                    <View style={styles.actionRow}>
                      <ActionButton
                        label={isExporting ? 'Exporting…' : 'Export PDF'}
                        disabled={isExporting}
                        onPress={() => void exportReport('pdf', `Report ${reportYear}`, reportData)}
                      />
                      <ActionButton
                        label={isExporting ? 'Exporting…' : 'Export Excel'}
                        secondary
                        disabled={isExporting}
                        onPress={() => void exportReport('xlsx', `Report ${reportYear}`, reportData)}
                      />
                    </View>
                  )}
                  {actionError ? <Text style={styles.errorText}>{actionError}</Text> : null}
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
                <View style={styles.formCard}>
                  <Text style={styles.formTitle}>Income & Expense · {reportYear}</Text>
                  <InputField label="Year" keyboardType="number-pad" value={reportYear} onChangeText={setReportYear} />
                  {pageError ? <Text style={styles.errorText}>{pageError}</Text> : null}
                  {isLoadingPage ? <ActivityIndicator color={colors.green} /> : null}
                  <Text style={styles.listHeading}>Income</Text>
                  <DetailRow
                    label="Registration fees"
                    value={formatMoney(dashboard.savings
                      .filter((record) => String(record.year) === reportYear)
                      .reduce((sum, record) => sum + amount(record.registrationFee), 0))}
                  />
                  <DetailRow
                    label="Late deposit penalty"
                    value={formatMoney(dashboard.savings
                      .filter((record) => String(record.year) === reportYear)
                      .reduce((sum, record) => sum + amount(record.latePenalty), 0))}
                  />
                  <DetailRow
                    label="Loan interest paid"
                    value={formatMoney(dashboard.payments
                      .filter((payment) => payment.monthYear?.split(' ')[1] === reportYear)
                      .reduce((sum, payment) => sum + amount(payment.interestPaid), 0))}
                  />
                  <DetailRow
                    label="Late loan penalty"
                    value={formatMoney(dashboard.payments
                      .filter((payment) => payment.monthYear?.split(' ')[1] === reportYear)
                      .reduce((sum, payment) => sum + amount(payment.penalty), 0))}
                  />
                  <Text style={styles.fieldLabel}>Bank income</Text>
                  {bankIncomeRows.map((row, index) => (
                    <InputField
                      key={`${row.name}-${index}`}
                      label={row.name}
                      keyboardType="decimal-pad"
                      disabled={isMemberRole}
                      value={row.amount}
                      onChangeText={(value) => setBankIncomeRows((current) =>
                        current.map((item, rowIndex) => rowIndex === index ? { ...item, amount: value } : item))}
                    />
                  ))}
                  <Text style={styles.fieldLabel}>Other income</Text>
                  {otherIncomeRows.map((row, index) => (
                    <View key={`other-${index}`}>
                      <InputField
                        label="Income name"
                        disabled={isMemberRole}
                        value={row.name}
                        onChangeText={(value) => setOtherIncomeRows((current) =>
                          current.map((item, rowIndex) => rowIndex === index ? { ...item, name: value } : item))}
                      />
                      <InputField
                        label="Amount (ETB)"
                        keyboardType="decimal-pad"
                        disabled={isMemberRole}
                        value={row.amount}
                        onChangeText={(value) => setOtherIncomeRows((current) =>
                          current.map((item, rowIndex) => rowIndex === index ? { ...item, amount: value } : item))}
                      />
                      {!isMemberRole && (
                        <ActionButton
                          label="Remove income row"
                          secondary
                          onPress={() => setOtherIncomeRows((current) => current.filter((_, rowIndex) => rowIndex !== index))}
                        />
                      )}
                    </View>
                  ))}
                  {!isMemberRole && (
                    <ActionButton
                      label="Add other income"
                      secondary
                      onPress={() => setOtherIncomeRows((current) => [...current, { name: '', amount: '0' }])}
                    />
                  )}
                  <Text style={styles.listHeading}>Expenses</Text>
                  {expenseRows.map((row, index) => (
                    <InputField
                      key={`${row.title}-${index}`}
                      label={row.title}
                      keyboardType="decimal-pad"
                      disabled={isMemberRole}
                      value={row.amount}
                      onChangeText={(value) => setExpenseRows((current) =>
                        current.map((item, rowIndex) => rowIndex === index ? { ...item, amount: value } : item))}
                    />
                  ))}
                  <SummaryCard label="Total income" value={formatMoney(incomeExpenseReport?.totalIncome)} icon="📈" />
                  <SummaryCard label="Total expense" value={formatMoney(incomeExpenseReport?.totalExpense)} icon="📉" />
                  <SummaryCard label="Net profit" value={formatMoney(incomeExpenseReport?.netProfit)} icon="📊" />
                  {actionError ? <Text style={styles.errorText}>{actionError}</Text> : null}
                  {incomeExpenseStatus ? <Text style={styles.successText}>{incomeExpenseStatus}</Text> : null}
                  {incomeExpenseReport && (
                    <View style={styles.actionRow}>
                      <ActionButton
                        label={isExporting ? 'Exporting…' : 'Export PDF'}
                        disabled={isExporting}
                        onPress={() => void exportReport('pdf', `Financial Report ${reportYear}`, incomeExpenseReport)}
                      />
                      <ActionButton
                        label={isExporting ? 'Exporting…' : 'Export Excel'}
                        secondary
                        disabled={isExporting}
                        onPress={() => void exportReport('xlsx', `Financial Report ${reportYear}`, incomeExpenseReport)}
                      />
                    </View>
                  )}
                  {!isMemberRole && (
                    <ActionButton label="Save financial report" onPress={() => void saveIncomeExpense()} />
                  )}
                </View>
              )}

              {activeSection === 'Balance Sheet' && (
                <View style={styles.formCard}>
                  <Text style={styles.formTitle}>Balance sheet · {reportYear}</Text>
                  <InputField label="Year" keyboardType="number-pad" disabled={isMemberRole} value={reportYear} onChangeText={setReportYear} />
                  <InputField label="Previous year" keyboardType="number-pad" disabled={isMemberRole} value={previousYear} onChangeText={setPreviousYear} />
                  {pageError ? <Text style={styles.errorText}>{pageError}</Text> : null}
                  {isLoadingPage ? <ActivityIndicator color={colors.green} /> : null}
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
                      disabled={isMemberRole}
                      value={balanceSheetValues[field]}
                      onChangeText={(value) => setBalanceSheetValues((current) => ({ ...current, [field]: value }))}
                    />
                  ))}
                  <SummaryCard label="Total assets" value={formatMoney(totalBalanceSheetAssets)} icon="🏦" />
                  <SummaryCard label="Total liabilities & equity" value={formatMoney(totalBalanceSheetLiabilitiesAndEquity)} icon="📊" />
                  {Math.abs(totalBalanceSheetAssets - totalBalanceSheetLiabilitiesAndEquity) < 0.01 ? (
                    <Text style={styles.successText}>Balance sheet balanced.</Text>
                  ) : (
                    <Text style={styles.errorText}>
                      Difference: {formatMoney(totalBalanceSheetAssets - totalBalanceSheetLiabilitiesAndEquity)}
                    </Text>
                  )}
                  {balanceSheetStatus ? <Text style={styles.successText}>{balanceSheetStatus}</Text> : null}
                  {actionError ? <Text style={styles.errorText}>{actionError}</Text> : null}
                  <View style={styles.actionRow}>
                    <ActionButton
                      label={isExporting ? 'Exporting…' : 'Export PDF'}
                      disabled={isExporting}
                      onPress={() => void exportReport('pdf', `Balance Sheet ${reportYear}`, balanceSheetExport)}
                    />
                    <ActionButton
                      label={isExporting ? 'Exporting…' : 'Export Excel'}
                      secondary
                      disabled={isExporting}
                      onPress={() => void exportReport('xlsx', `Balance Sheet ${reportYear}`, balanceSheetExport)}
                    />
                  </View>
                  {!isMemberRole && (
                    <ActionButton label="Save balanced sheet" onPress={() => void saveBalanceSheet()} />
                  )}
                </View>
              )}

              {activeSection === 'Cash Flow' && (
                <View style={styles.formCard}>
                  <InputField label="Year" keyboardType="number-pad" value={reportYear} onChangeText={setReportYear} />
                  <View style={styles.errorPanel}>
                    <Text style={styles.errorText}>
                      Cash Flow is unavailable until a general ledger and account mappings are defined.
                    </Text>
                  </View>
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
                  <View style={styles.errorPanel}>
                    <Text style={styles.errorText}>
                      Check Balance is unavailable until a general ledger and debit/credit mappings are defined.
                    </Text>
                  </View>
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
                  {actionError ? <Text style={styles.errorText}>{actionError}</Text> : null}
                  {formSuccess ? <Text style={styles.successText}>{formSuccess}</Text> : null}
                  <ActionButton label="Update password" onPress={() => startForm('Change Password')} />
                </View>
              )}

              {activeSection === 'Help' && (
                <View style={styles.formCard}>
                  <Text style={styles.formTitle}>Help & support</Text>
                  <InputField
                    label="Search help guides"
                    placeholder="Search loans, savings, passwords..."
                    value={helpSearch}
                    onChangeText={setHelpSearch}
                  />
                  {helpTopics
                    .filter((topic) => `${topic.question} ${topic.answer}`.toLowerCase().includes(helpSearch.trim().toLowerCase()))
                    .map((topic) => (
                      <RecordCard key={topic.question} title={topic.question} subtitle={topic.answer} />
                    ))}
                  {helpTopics.every((topic) => !`${topic.question} ${topic.answer}`.toLowerCase().includes(helpSearch.trim().toLowerCase())) && (
                    <EmptyState message="No help topics match your search." />
                  )}
                  {pageError ? <Text style={styles.errorText}>{pageError}</Text> : null}
                  {user.role.toLowerCase() === 'admin' ? (
                    <>
                      <Text style={styles.listHeading}>Pending support requests</Text>
                      {supportRequests.map((request) => (
                        <RecordCard
                          key={request._id}
                          title={request.senderEmail}
                          subtitle={`To: ${request.recipientEmail} · ${request.status}`}
                        >
                          <Text style={styles.mutedText}>{request.question}</Text>
                          <InputField
                            label="Response"
                            value={supportReplyDrafts[request._id] || ''}
                            onChangeText={(value) => setSupportReplyDrafts((current) => ({ ...current, [request._id]: value }))}
                          />
                          <ActionButton label="Send response" onPress={() => void sendSupportResponse(request._id)} />
                        </RecordCard>
                      ))}
                      {!supportRequests.length && <EmptyState message="No pending support requests." />}
                    </>
                  ) : supportUser && supportToken ? (
                    <>
                      <Text style={styles.mutedText}>Support account: {supportUser.email}</Text>
                      <InputField
                        label="Support recipient email"
                        keyboardType="default"
                        value={supportRecipientEmail}
                        onChangeText={setSupportRecipientEmail}
                      />
                      <InputField
                        label="Your question"
                        value={supportQuestion}
                        onChangeText={setSupportQuestion}
                      />
                      <ActionButton label="Send support request" onPress={() => void sendSupportRequest()} />
                      <ActionButton
                        label="Sign out of support"
                        secondary
                        onPress={() => {
                          Promise.all([
                            SecureStore.deleteItemAsync('microfinance-support-token'),
                            SecureStore.deleteItemAsync('microfinance-support-user'),
                          ])
                            .then(() => {
                              setSupportToken('');
                              setSupportUser(null);
                              setSupportResponses([]);
                            })
                            .catch((storageError: unknown) => {
                              console.error('Could not sign out of support:', storageError);
                              setPageError('Could not sign out of the support account.');
                            });
                        }}
                      />
                      <Text style={styles.listHeading}>Support responses</Text>
                      {supportResponses.map((response) => (
                        <RecordCard
                          key={response._id}
                          title={response.originalQuestion}
                          subtitle={response.response}
                        >
                          <ActionButton label="Mark response read" secondary onPress={() => void markSupportResponseRead(response._id)} />
                        </RecordCard>
                      ))}
                      {!supportResponses.length && <EmptyState message="No unread support responses." />}
                    </>
                  ) : (
                    <>
                      <Text style={styles.mutedText}>
                        {supportMode === 'login' ? 'Sign in to ask a support question.' : 'Create a support account to contact the team.'}
                      </Text>
                      {supportMode === 'register' && (
                        <InputField label="Name" value={supportName} onChangeText={setSupportName} />
                      )}
                      <InputField label="Email" value={supportEmail} onChangeText={setSupportEmail} />
                      <InputField label="Password" secureTextEntry value={supportPassword} onChangeText={setSupportPassword} />
                      <ActionButton
                        label={supportMode === 'login' ? 'Sign in to support' : 'Create support account'}
                        onPress={() => void authenticateSupport()}
                      />
                      <ActionButton
                        label={supportMode === 'login' ? 'Create account instead' : 'Sign in instead'}
                        secondary
                        onPress={() => setSupportMode((current) => current === 'login' ? 'register' : 'login')}
                      />
                    </>
                  )}
                </View>
              )}

              {activeSection === 'Settings' && (
                <View style={styles.formCard}>
                  <Text style={styles.formTitle}>System settings</Text>
                  {actionError ? <Text style={styles.errorText}>{actionError}</Text> : null}
                  {formSuccess ? <Text style={styles.successText}>{formSuccess}</Text> : null}
                  <InputField
                    label="Language preference"
                    options={['English', 'Amharic', 'Oromiffa', 'Tigrigna'].map((value) => ({ label: value, value }))}
                    value={savedLanguage}
                    onChangeText={(value) => {
                      void savePreference('microfinance-mobile-language', value).then((saved) => {
                        if (saved) setSavedLanguage(value);
                      });
                    }}
                  />
                  <InputField
                    label="Monthly late penalty (ETB)"
                    keyboardType="decimal-pad"
                    disabled={user.role.toLowerCase() !== 'admin'}
                    value={monthlyPenalty}
                    onChangeText={setMonthlyPenalty}
                  />
                  {user.role.toLowerCase() === 'admin' && (
                    <ActionButton label="Save monthly late penalty" onPress={() => void saveMonthlyPenalty()} />
                  )}
                  <SettingToggle
                    label="Dark appearance"
                    enabled={darkMode}
                    onToggle={() => {
                      const next = !darkMode;
                      void savePreference('microfinance-mobile-dark-mode', String(next)).then((saved) => {
                        if (saved) setDarkMode(next);
                      });
                    }}
                  />
                  <SettingToggle
                    label="Email alerts"
                    enabled={emailNotification}
                    onToggle={() => {
                      const next = !emailNotification;
                      void savePreference('emailNotification', String(next)).then((saved) => {
                        if (saved) setEmailNotification(next);
                      });
                    }}
                  />
                  <SettingToggle
                    label="Loan request notifications"
                    enabled={loanNotification}
                    onToggle={() => {
                      const next = !loanNotification;
                      void savePreference('loanNotification', String(next)).then((saved) => {
                        if (saved) setLoanNotification(next);
                      });
                    }}
                  />
                  <SettingToggle
                    label="Password reset notifications"
                    enabled={passwordNotification}
                    onToggle={() => {
                      const next = !passwordNotification;
                      void savePreference('passwordNotification', String(next)).then((saved) => {
                        if (saved) setPasswordNotification(next);
                      });
                    }}
                  />
                  <SettingToggle
                    label="Withdrawal notifications"
                    enabled={withdrawalNotification}
                    onToggle={() => {
                      const next = !withdrawalNotification;
                      void savePreference('withdrawalNotification', String(next)).then((saved) => {
                        if (saved) setWithdrawalNotification(next);
                      });
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
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.loginKeyboardAvoider}
      >
        <ScrollView
          style={styles.loginScroll}
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
            onSubmitEditing={() => passwordInputRef.current?.focus()}
            placeholder="Enter your member ID"
            placeholderTextColor={colors.placeholder}
            returnKeyType="next"
            style={styles.input}
            value={memberId}
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            ref={passwordInputRef}
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
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

type FormFieldConfig = {
  name: string;
  label: string;
  placeholder?: string;
  secure?: boolean;
  disabled?: boolean;
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
  if (section === 'Change Password') return 'Change password';
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

function getLoanPaymentMonths(loan: MemberLoan): string[] {
  const firstPaymentDate = loan.paymentStartDate
    ? new Date(loan.paymentStartDate)
    : addMonthsClamped(new Date(loan.createdAt || Date.now()), 1);
  if (!Number.isFinite(firstPaymentDate.getTime())) return [];

  return Array.from({ length: 24 }, (_, index) => {
    const date = addMonthsClamped(firstPaymentDate, index);
    return `${months[date.getMonth()]} ${date.getFullYear()}`;
  });
}

function getFormFields(
  section: AppSection,
  isMember: boolean,
  dashboard: MobileDashboard,
  isEditingMember = false,
  selectedLoanId = '',
): FormFieldConfig[] {
  const memberOptions = dashboard.members.filter((member) => member.role === 'member').map((member) => ({
    value: member._id,
    label: `${member.firstName || ''} ${member.lastName || ''} (${member.memberId})`.trim(),
  }));
  if (section === 'Members') {
    return [
      { name: 'firstName', label: 'First name', placeholder: 'First name' },
      { name: 'lastName', label: 'Last name', placeholder: 'Last name' },
      { name: 'memberId', label: 'Member ID', placeholder: 'Member ID', disabled: isEditingMember },
      { name: 'phone', label: 'Phone number', placeholder: 'Phone number', keyboardType: 'phone-pad' },
      { name: 'gender', label: 'Gender', options: ['Female', 'Male', 'Other'].map((value) => ({ label: value, value })) },
      { name: 'birthDate', label: 'Date of birth (YYYY-MM-DD)', placeholder: 'YYYY-MM-DD' },
      { name: 'maritalStatus', label: 'Marital status', options: ['Single', 'Married', 'Divorced', 'Widowed'].map((value) => ({ label: value, value })) },
      ...(!isEditingMember ? [{ name: 'password', label: 'Temporary password', secure: true }] : []),
      { name: 'role', label: 'Role', options: roles.map((value) => ({ label: value.replace(/\b\w/g, (letter) => letter.toUpperCase()), value })) },
      { name: 'fatherName', label: 'Father name' },
      { name: 'motherName', label: 'Mother name' },
      { name: 'wifeName', label: 'Wife name' },
      { name: 'wifeFatherName', label: 'Wife’s father name' },
      { name: 'wifeMotherName', label: 'Wife’s mother name' },
      { name: 'husbandName', label: 'Husband name' },
      { name: 'husbandFatherName', label: 'Husband’s father name' },
      { name: 'husbandMotherName', label: 'Husband’s mother name' },
      { name: 'brothers', label: 'Brothers (comma-separated)' },
      { name: 'sisters', label: 'Sisters (comma-separated)' },
      { name: 'children', label: 'Children (comma-separated)' },
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
    ];
  }
  if (section === 'Payments') {
    const loanOptions = dashboard.loans
      .filter((loan) => loan.status === 'approved' && amount(loan.remainingAmount) > 0)
      .map((loan) => ({
        value: loan._id,
        label: `${memberName(loan.employeeId)} · ${loan.loanType || 'Loan'} · remaining ${formatMoney(loan.remainingAmount)}`,
      }));
    const selectedLoan = dashboard.loans.find((loan) => loan._id === selectedLoanId);
    const paidMonths = new Set(
      dashboard.payments
        .filter((payment) => payment.loanId === selectedLoanId)
        .map((payment) => payment.monthYear),
    );
    return [
      { name: 'loanId', label: 'Active loan', options: loanOptions },
      { name: 'amountPaid', label: 'Payment amount per month (principal + interest, ETB)', keyboardType: 'decimal-pad' },
      {
        name: 'monthYear',
        label: 'Payment month',
        options: (selectedLoan ? getLoanPaymentMonths(selectedLoan) : [])
          .filter((monthYear) => !paidMonths.has(monthYear))
          .map((value) => ({ value, label: value })),
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
  if (section === 'Change Password') {
    return [
      { name: 'currentPassword', label: 'Current password', secure: true },
      { name: 'newPassword', label: 'New password', secure: true },
      { name: 'confirmPassword', label: 'Confirm new password', secure: true },
    ];
  }
  return [{ name: 'phone', label: 'Phone number', placeholder: 'Phone number' }];
}

function amount(value: number | string | undefined): number {
  const parsed = Number.parseFloat(String(value ?? 0));
  return Number.isFinite(parsed) ? parsed : 0;
}

function isOfficerApprovedLoan(loan: MemberLoan): boolean {
  return loan.loanOfficerStatus === 'approved' || loan.approvalStage === 'awaiting_loan_manager';
}

function canReviewLoan(loan: MemberLoan, role: string): boolean {
  if (loan.status !== 'pending') return false;
  const normalizedRole = role.toLowerCase();

  if (normalizedRole === 'loan officer') {
    return (loan.loanOfficerStatus || 'pending') === 'pending';
  }

  return ['loan manager', 'vice loan manager'].includes(normalizedRole) &&
    isOfficerApprovedLoan(loan) &&
    (loan.loanManagerStatus || 'pending') === 'pending';
}

function toReportRows(data: unknown): Record<string, string>[] {
  const entries = Array.isArray(data) ? data : [data];
  return entries.map((item, index) => {
    if (typeof item !== 'object' || item === null || Array.isArray(item)) {
      return { Row: String(index + 1), Value: String(item ?? '') };
    }
    return Object.fromEntries(
      Object.entries(item as Record<string, unknown>)
        .filter(([key]) => !key.startsWith('_'))
        .map(([key, value]) => [
          key,
          value !== null && typeof value === 'object' ? JSON.stringify(value) : String(value ?? ''),
        ]),
    );
  });
}

function calculateIncomeExpenseReport(
  dashboard: MobileDashboard,
  year: string,
  bankIncomes: { name: string; amount: string }[],
  otherIncomes: { name: string; amount: string }[],
  expenses: { title: string; amount: string }[],
) {
  const yearDeposits = dashboard.savings.filter((record) => String(record.year) === year);
  const yearPayments = dashboard.payments.filter(
    (payment) => payment.monthYear?.split(' ')[1] === year,
  );
  const registrationFees = yearDeposits.reduce((sum, record) => sum + amount(record.registrationFee), 0);
  const lateDepositPenalty = yearDeposits.reduce((sum, record) => sum + amount(record.latePenalty), 0);
  const loanInterestPaid = yearPayments.reduce((sum, payment) => sum + amount(payment.interestPaid), 0);
  const lateLoanPenalty = yearPayments.reduce((sum, payment) => sum + amount(payment.penalty), 0);
  const bankIncomeTotal = bankIncomes.reduce((sum, row) => sum + amount(row.amount), 0);
  const otherIncomeTotal = otherIncomes.reduce((sum, row) => sum + amount(row.amount), 0);
  const totalIncome =
    registrationFees + lateDepositPenalty + loanInterestPaid + lateLoanPenalty +
    bankIncomeTotal + otherIncomeTotal;
  const totalExpense = expenses.reduce((sum, row) => sum + amount(row.amount), 0);

  return {
    year: Number(year),
    registrationFees,
    lateDepositPenalty,
    loanInterestPaid,
    lateLoanPenalty,
    bankIncomes: bankIncomes.map((row) => ({ ...row, amount: amount(row.amount) })),
    otherIncomes: otherIncomes.map((row) => ({ ...row, amount: amount(row.amount) })),
    expenses: expenses.map((row) => ({ ...row, amount: amount(row.amount) })),
    totalIncome,
    totalExpense,
    netProfit: totalIncome - totalExpense,
  };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
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
  disabled = false,
  keyboardType = 'default',
  options,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  disabled?: boolean;
  keyboardType?: 'default' | 'number-pad' | 'decimal-pad' | 'phone-pad';
  options?: { label: string; value: string }[];
}) {
  return (
    <View style={styles.fieldContainer}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {options ? (
        <View style={styles.pickerContainer}>
          <Picker enabled={!disabled} selectedValue={value || options[0]?.value || ''} onValueChange={onChangeText} style={styles.picker}>
            {options.map((option) => (
              <Picker.Item key={option.value} label={option.label} value={option.value} />
            ))}
          </Picker>
        </View>
      ) : (
        <TextInput
          autoCapitalize="none"
          editable={!disabled}
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
  loginKeyboardAvoider: {
    flex: 1,
  },
  loginScroll: {
    flex: 1,
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
