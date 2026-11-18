import { StatusBar } from 'expo-status-bar';
import * as SecureStore from 'expo-secure-store';
import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
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
  type MemberSummary,
} from './src/api';

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

const memberSections = ['Overview', 'Members', 'Savings', 'Loans', 'Payments', 'Withdrawals', 'Reports', 'Profile'] as const;
const staffSections = ['Overview', 'Members', 'Savings', 'Loans', 'Payments', 'Withdrawals', 'Reports', 'Profile'] as const;
type AppSection = (typeof staffSections)[number];
const savingAmountFields = ['registrationFee', 'latePenalty'] as const;

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

export default function App() {
  return (
    <SafeAreaProvider>
      <MobileApp />
    </SafeAreaProvider>
  );
}

function MobileApp() {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isRestoring, setIsRestoring] = useState(true);
  const [memberId, setMemberId] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('member');
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [error, setError] = useState('');
  const [dashboard, setDashboard] = useState<MobileDashboard | null>(null);
  const [summaryError, setSummaryError] = useState('');
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeSection, setActiveSection] = useState<AppSection>('Overview');

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

  const signIn = async () => {
    setError('');
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
    } catch (signOutError) {
      console.error('Could not clear the saved mobile session:', signOutError);
      setError('Could not sign out. Please try again.');
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
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="light" />
        <ScrollView contentContainerStyle={styles.dashboardContent}>
          <View style={styles.hero}>
            <Text style={styles.brand}>MICRO-FINANCE</Text>
            <Text style={styles.welcome}>Welcome, {name}</Text>
            <Text style={styles.roleText}>{user.role}</Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => void signOut()}
              style={styles.signOutButton}
            >
              <Text style={styles.signOutText}>Sign out</Text>
            </Pressable>
          </View>

          <View style={styles.sectionHeading}>
            <Text style={styles.sectionTitle}>{activeSection}</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Refresh dashboard"
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
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.sectionTabs}
              >
                {visibleSections.map((section) => (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityState={{ selected: activeSection === section }}
                    key={section}
                    onPress={() => setActiveSection(section)}
                    style={[
                      styles.sectionTab,
                      activeSection === section && styles.sectionTabSelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.sectionTabText,
                        activeSection === section && styles.sectionTabTextSelected,
                      ]}
                    >
                      {section}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>

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

              {activeSection === 'Members' && (
                dashboard.members.length ? dashboard.members.map((member) => (
                  <RecordCard
                    key={member._id}
                    title={`${member.firstName || ''} ${member.lastName || ''}`.trim() || 'Member'}
                    subtitle={`Member ID: ${member.memberId}`}
                  >
                    <DetailRow label="Phone" value={member.phone} />
                    <DetailRow label="Total savings" value={formatMoney(member.totalSaving)} />
                    {!isMemberRole && <DetailRow label="Role" value={member.role} />}
                  </RecordCard>
                )) : <EmptyState message="No member records found." />
              )}

              {activeSection === 'Savings' && (
                dashboard.savings.length ? dashboard.savings.map((deposit) => (
                  <RecordCard
                    key={deposit._id}
                    title={`${deposit.month || ''} ${deposit.year || ''}`.trim() || 'Savings deposit'}
                    subtitle={`${memberName(deposit.employeeId)} · Regular ${formatMoney(deposit.normalSaving)} · Voluntary ${formatMoney(deposit.voluntarySaving)}`}
                  >
                    <DetailRow label="Shared purchase" value={formatMoney(deposit.sharedPurchase)} />
                    <DetailRow label="Registration fee" value={formatMoney(deposit.registrationFee)} />
                    <DetailRow label="Late penalty" value={formatMoney(deposit.latePenalty)} />
                  </RecordCard>
                )) : <EmptyState message="No savings records yet." />
              )}

              {activeSection === 'Loans' && (
                dashboard.loans.length ? dashboard.loans.map((loan) => (
                  <RecordCard
                    key={loan._id}
                    title={`${loan.loanType || 'Loan'} loan`}
                    subtitle={`${memberName(loan.employeeId)} · Status: ${loan.status || 'pending'}`}
                  >
                    <DetailRow label="Principal" value={formatMoney(loan.principalAmount)} />
                    <DetailRow label="Remaining balance" value={formatMoney(loan.remainingAmount)} />
                    <DetailRow label="Monthly installment" value={formatMoney(loan.monthlyInstallment)} />
                    <DetailRow label="Duration" value={loan.durationMonths ? `${loan.durationMonths} months` : '—'} />
                  </RecordCard>
                )) : <EmptyState message="No loan records yet." />
              )}

              {activeSection === 'Payments' && (
                dashboard.payments.length ? dashboard.payments.map((payment) => (
                  <RecordCard
                    key={payment._id}
                    title={payment.monthYear || 'Loan payment'}
                    subtitle={`${memberName(payment.employeeId)} · Paid ${formatMoney(payment.totalPaid ?? payment.amountPaid)}`}
                  >
                    <DetailRow label="Principal" value={formatMoney(payment.amountPaid)} />
                    <DetailRow label="Interest" value={formatMoney(payment.interestPaid)} />
                    <DetailRow label="Penalty" value={formatMoney(payment.penalty)} />
                  </RecordCard>
                )) : <EmptyState message="No loan payments yet." />
              )}

              {activeSection === 'Withdrawals' && (
                dashboard.withdrawals.length ? dashboard.withdrawals.map((withdrawal) => (
                  <RecordCard
                    key={withdrawal._id}
                    title={withdrawal.fullName || memberName(withdrawal.employeeId)}
                    subtitle={`Status: ${withdrawal.status || 'pending'}`}
                  >
                    <DetailRow label="Savings" value={formatMoney(withdrawal.totalSaving)} />
                    <DetailRow label="Reason" value={withdrawal.reason} />
                  </RecordCard>
                )) : <EmptyState message="No withdrawal requests." />
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

              {activeSection === 'Profile' && (
                <View style={styles.profileCard}>
                  <DetailRow label="Member ID" value={dashboard.profile.memberId} />
                  <DetailRow label="First name" value={dashboard.profile.firstName} />
                  <DetailRow label="Last name" value={dashboard.profile.lastName} />
                  <DetailRow label="Phone" value={dashboard.profile.phone} />
                  <DetailRow label="Gender" value={dashboard.profile.gender} />
                  <DetailRow label="Date of birth" value={formatDate(dashboard.profile.birthDate)} />
                  <DetailRow label="Marital status" value={dashboard.profile.maritalStatus} />
                </View>
              )}
            </>
          ) : null}
        </ScrollView>
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

          <Text style={styles.secureNote}>
            Your session is stored securely on this device.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
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
  sectionTabs: {
    gap: 8,
    paddingBottom: 8,
  },
  sectionTab: {
    minHeight: 40,
    justifyContent: 'center',
    paddingHorizontal: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#fff',
  },
  sectionTabSelected: {
    borderColor: colors.green,
    backgroundColor: colors.green,
  },
  sectionTabText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '700',
  },
  sectionTabTextSelected: {
    color: '#fff',
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
  dashboardContent: {
    flexGrow: 1,
    padding: 20,
    paddingBottom: 36,
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
});
