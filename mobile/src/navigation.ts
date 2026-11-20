export const sectionRoutes = {
  Overview: 'dashboard',
  Members: 'members',
  Savings: 'savings',
  Loans: 'loans',
  Payments: 'payments',
  Withdrawals: 'withdrawals',
  Reports: 'reports',
  'Activity History': 'activity-history',
  Profile: 'profile',
  'Edit Profile': 'profile-edit',
  'Change Password': 'change-password',
  Dividend: 'dividend',
  Profit: 'profit',
  'Income & Expense': 'income-expense',
  'Balance Sheet': 'balance-sheet',
  'Cash Flow': 'cash-flow',
  'Check Balance': 'check-balance',
  Terminated: 'terminated',
  Help: 'help',
  Settings: 'settings',
} as const;

export type AppSection = keyof typeof sectionRoutes;

export function sectionPath(section: AppSection): `/${string}` {
  return `/${sectionRoutes[section]}`;
}

export function sectionForRoute(route: string | undefined): AppSection {
  return (
    (Object.entries(sectionRoutes).find(([, path]) => path === route)?.[0] as AppSection | undefined) ||
    'Overview'
  );
}
