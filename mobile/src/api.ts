const configuredApiUrl = process.env.EXPO_PUBLIC_API_URL?.trim();
const defaultApiUrl = 'https://micro-finance-90cq.onrender.com/api';
const apiBaseUrl = (configuredApiUrl || defaultApiUrl).replace(/\/+$/, '');

type ApiRequestOptions = RequestInit & {
  token?: string;
};

export type MemberProfile = {
  memberId: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  gender?: string;
  birthDate?: string;
  maritalStatus?: string;
  totalSaving?: number | string;
  normalSaving?: number | string;
  voluntarySaving?: number | string;
  role: string;
  createdAt?: string;
};

export type SavingsRecord = {
  _id: string;
  employeeId?: MemberSummary | string;
  month?: string;
  year?: string;
  normalSaving?: number | string;
  voluntarySaving?: number | string;
  sharedPurchase?: number | string;
  registrationFee?: number | string;
  latePenalty?: number | string;
  depositForPurchase?: number | string;
  createdAt?: string;
};

export type MemberLoan = {
  _id: string;
  employeeId?: MemberSummary | string;
  principalAmount?: number | string;
  totalAmount?: number | string;
  remainingAmount?: number | string;
  loanType?: string;
  status?: string;
  monthlyInstallment?: number | string;
  durationMonths?: number | string;
  loanStartDate?: string;
  paymentStartDate?: string;
  loanEndDate?: string;
  createdAt?: string;
};

export type MemberPayment = {
  _id: string;
  employeeId?: MemberSummary | string;
  loanId?: string;
  monthYear?: string;
  amountPaid?: number | string;
  interestPaid?: number | string;
  penalty?: number | string;
  totalPaid?: number | string;
  createdAt?: string;
};

export type MemberSummary = {
  _id: string;
  memberId: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  role?: string;
  totalSaving?: number | string;
  createdAt?: string;
};

export type WithdrawalRecord = {
  _id: string;
  employeeId?: MemberSummary | string;
  fullName?: string;
  totalSaving?: number | string;
  reason?: string;
  status?: string;
  isRead?: boolean;
  createdAt?: string;
};

export type PasswordResetNotification = {
  _id: string;
  memberId: string;
  fullName?: string;
  status?: string;
  isRead?: boolean;
  requestedAt?: string;
};

export type MobileDashboard = {
  profile: MemberProfile;
  members: MemberSummary[];
  savings: SavingsRecord[];
  loans: MemberLoan[];
  payments: MemberPayment[];
  withdrawals: WithdrawalRecord[];
  passwordRequests: PasswordResetNotification[];
};

export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const { token, headers, ...requestOptions } = options;
  const requestHeaders = new Headers(headers);
  requestHeaders.set('Accept', 'application/json');
  requestHeaders.set('Content-Type', 'application/json');
  if (token) requestHeaders.set('Authorization', `Bearer ${token}`);

  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...requestOptions,
    headers: requestHeaders,
  });

  const contentType = response.headers.get('content-type') || '';
  const responseText = await response.text();
  if (!contentType.toLowerCase().includes('application/json')) {
    if (response.ok && contentType.toLowerCase().includes('text/html')) {
      throw new Error(
        'The server is missing the mobile API update. Deploy the latest backend, then refresh.',
      );
    }
    throw new Error(`The server returned an unexpected response (${response.status}).`);
  }

  let responseData: unknown;
  try {
    responseData = responseText ? JSON.parse(responseText) : null;
  } catch (parseError) {
    console.error('Could not parse API response JSON:', parseError);
    throw new Error('The server returned invalid API data.');
  }

  if (!response.ok) {
    const message =
      typeof responseData === 'object' &&
      responseData !== null &&
      'message' in responseData &&
      typeof responseData.message === 'string'
        ? responseData.message
        : `Request failed (${response.status}).`;
    throw new Error(message);
  }

  return responseData as T;
}

export function loadMobileDashboard(token: string): Promise<MobileDashboard> {
  return apiRequest<MobileDashboard>('/mobile/dashboard', { token });
}
