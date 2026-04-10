import type {
  LoginRequest,
  LoginResponse,
  PasswordResetRequest,
  ChangePasswordRequest,
  RegisterOwnerRequest,
  RegisterHQRequest,
  RegisterAdminRequest,
  RegisterDealerRequest,
  RegisterResponse,
  DealerListItem,
  AccountStatus,
  LoginUser,
} from '../../types/auth.types';
import { apiRequest } from './apiHelpers';

function combineAddress(base: string, detail?: string): string {
  const d = detail?.trim();
  if (!d) return base.trim();
  return `${base.trim()} ${d}`.trim();
}

function mapApiUser(user: {
  userId: number;
  loginId: string;
  name: string;
  role: LoginUser['role'];
  email?: string;
  phone: string;
  storeIds: number[];
}): LoginUser {
  return {
    userId: user.userId,
    loginId: user.loginId,
    name: user.name,
    role: user.role,
    email: user.email,
    phone: user.phone,
    storeIds: user.storeIds.map(String),
  };
}

const DEFAULT_DEALER_SPECIALTIES: Record<string, boolean> = {
  newInstall: false,
  repair: false,
  cleaning: false,
  transport: false,
  inspection: false,
};

function mapRegisterResponse(
  data: { userId: number; accountStatus?: AccountStatus; message?: string },
  fallback: { accountStatus: AccountStatus; message: string },
): RegisterResponse {
  return {
    userId: data.userId,
    accountStatus: data.accountStatus ?? fallback.accountStatus,
    message: data.message ?? fallback.message,
  };
}

export async function login(credentials: LoginRequest): Promise<LoginResponse> {
  const data = await apiRequest<{ accessToken: string; user: Parameters<typeof mapApiUser>[0] }>({
    method: 'post',
    url: '/auth/login',
    data: { loginId: credentials.loginId, password: credentials.password },
  });
  return {
    accessToken: data.accessToken,
    user: mapApiUser(data.user),
  };
}

export async function logout(): Promise<void> {
  await apiRequest<Record<string, unknown>>({ method: 'post', url: '/auth/logout' });
}

export async function passwordResetRequest(body: PasswordResetRequest): Promise<{ message: string }> {
  return apiRequest<{ message: string }>({
    method: 'post',
    url: '/auth/password-reset-request',
    data: body,
  });
}

export async function changePassword(body: ChangePasswordRequest): Promise<void> {
  await apiRequest<Record<string, unknown>>({
    method: 'put',
    url: '/auth/password',
    data: {
      currentPassword: body.currentPassword,
      newPassword: body.newPassword,
    },
  });
}

export async function checkLoginId(loginId: string): Promise<{ available: boolean }> {
  return apiRequest<{ available: boolean }>({
    method: 'get',
    url: `/auth/check-login-id?loginId=${encodeURIComponent(loginId)}`,
  });
}

export async function checkBusinessNumber(
  number: string,
): Promise<{ isValid: boolean; isDuplicate: boolean }> {
  const data = await apiRequest<{ available: boolean }>({
    method: 'get',
    url: `/registration/check-business-number?number=${encodeURIComponent(number)}`,
  });
  return { isValid: true, isDuplicate: !data.available };
}

export async function getDealerList(region?: string): Promise<DealerListItem[]> {
  const q = region ? `?region=${encodeURIComponent(region)}` : '';
  const list = await apiRequest<{ dealerId: number; name: string; serviceRegions: string[] }[]>({
    method: 'get',
    url: `/registration/dealer-list${q}`,
  });
  return list.map((d) => ({
    dealerId: d.dealerId,
    dealerName: d.name,
    serviceRegions: d.serviceRegions,
  }));
}

export async function registerOwner(body: RegisterOwnerRequest): Promise<RegisterResponse> {
  const storeAddr = combineAddress(body.store.address, body.store.addressDetail);
  const businessAddr = storeAddr || body.store.address;
  const data = await apiRequest<{ userId: number; accountStatus: AccountStatus; message: string }>({
    method: 'post',
    url: '/registration/owner',
    data: {
      account: {
        loginId: body.account.loginId,
        password: body.account.password,
        name: body.account.name,
        phone: body.account.phone,
        email: body.account.email || undefined,
      },
      business: {
        businessName: body.business.businessName,
        businessNumber: body.business.businessNumber,
        address: businessAddr,
      },
      store: {
        storeName: body.store.storeName,
        address: storeAddr,
      },
      affiliation: {
        hqId: null,
        dealerId: Number.isFinite(body.dealerId) ? body.dealerId : null,
      },
      termsAgreed: true as const,
    },
  });
  return mapRegisterResponse(data, {
    accountStatus: data.accountStatus,
    message: data.message,
  });
}

export async function registerHQ(body: RegisterHQRequest): Promise<RegisterResponse> {
  const hqAddr = combineAddress(body.hqInfo.address, body.hqInfo.addressDetail);
  const data = await apiRequest<{ userId: number; accountStatus: AccountStatus }>({
    method: 'post',
    url: '/registration/hq',
    data: {
      account: {
        loginId: body.account.loginId,
        password: body.account.password,
        name: body.account.name,
        phone: body.account.phone,
        email: body.account.email || undefined,
      },
      business: {
        businessName: body.business.corporationName || body.business.brandName,
        businessNumber: body.business.businessNumber,
        address: hqAddr,
      },
      hqProfile: {
        brandName: body.business.brandName,
        hqName: body.business.corporationName || body.business.brandName,
      },
      termsAgreed: true as const,
    },
  });
  return mapRegisterResponse(data, {
    accountStatus: data.accountStatus,
    message: '회원가입이 완료되었습니다. 관리자 승인 후 로그인 가능합니다.',
  });
}

export async function registerAdmin(body: RegisterAdminRequest): Promise<RegisterResponse> {
  const data = await apiRequest<{ userId: number }>({
    method: 'post',
    url: '/registration/admin',
    data: {
      loginId: body.loginId,
      password: body.password,
      name: body.name,
      email: body.email,
    },
  });
  return mapRegisterResponse(data, {
    accountStatus: 'PENDING',
    message: '회원가입이 완료되었습니다. 관리자 승인 후 로그인 가능합니다.',
  });
}

export async function registerDealer(body: RegisterDealerRequest): Promise<RegisterResponse> {
  const locAddr = combineAddress(body.location.address, body.location.addressDetail);
  const data = await apiRequest<{ userId: number }>({
    method: 'post',
    url: '/registration/dealer',
    data: {
      account: {
        loginId: body.account.loginId,
        password: body.account.password,
        name: body.account.name,
        phone: body.account.phone,
        email: body.account.email || undefined,
      },
      business: {
        businessName: body.business.businessName,
        businessNumber: body.business.businessNumber,
        address: locAddr,
      },
      dealerProfile: {
        serviceRegions: body.serviceRegions,
        specialties: DEFAULT_DEALER_SPECIALTIES,
      },
      termsAgreed: true as const,
    },
  });
  return mapRegisterResponse(data, {
    accountStatus: 'PENDING',
    message: '회원가입이 완료되었습니다. 관리자 승인 후 로그인 가능합니다.',
  });
}