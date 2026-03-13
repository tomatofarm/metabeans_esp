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
} from '../../types/auth.types';
import { mockUsers, mockDelay } from './common.mock';

/**
 * Mock 로그인
 */
export async function mockLogin(request: LoginRequest): Promise<LoginResponse> {
  const mockUser = mockUsers[request.loginId];

  if (!mockUser || mockUser.password !== request.password) {
    throw new Error('아이디 또는 비밀번호가 올바르지 않습니다.');
  }

  return mockDelay({
    accessToken: `mock-token-${mockUser.user.role}-${Date.now()}`,
    user: mockUser.user,
  });
}

/**
 * Mock 로그아웃
 */
export async function mockLogout(): Promise<void> {
  return mockDelay(undefined, 200);
}

/**
 * Mock 비밀번호 초기화 요청
 * - 항상 성공 응답 (관리자 승인 후 처리 안내)
 */
export async function mockPasswordResetRequest(
  _request: PasswordResetRequest,
): Promise<{ message: string }> {
  return mockDelay({
    message: '관리자 승인 후 처리됩니다. 최대 24시간 소요됩니다.',
  });
}

/**
 * Mock 비밀번호 변경
 * - currentPassword가 'wrong'이면 실패, 그 외 성공
 */
export async function mockChangePassword(
  request: ChangePasswordRequest,
): Promise<void> {
  if (request.currentPassword === 'wrong') {
    throw new Error('현재 비밀번호가 올바르지 않습니다.');
  }
  return mockDelay(undefined, 300);
}

/**
 * Mock 아이디 중복 확인
 */
export async function mockCheckLoginId(loginId: string): Promise<{ available: boolean }> {
  const taken = Object.keys(mockUsers).includes(loginId);
  return mockDelay({ available: !taken }, 300);
}

/**
 * Mock 사업자등록번호 검증
 */
export async function mockCheckBusinessNumber(
  _number: string,
): Promise<{ isValid: boolean; isDuplicate: boolean }> {
  return mockDelay({ isValid: true, isDuplicate: false }, 300);
}

/**
 * Mock 대리점 목록 조회
 */
export async function mockGetDealerList(
  _region?: string,
): Promise<DealerListItem[]> {
  return mockDelay([
    { dealerId: 1, dealerName: '서울환경설비', serviceRegions: ['서울 동부', '서울 서부'] },
    { dealerId: 2, dealerName: '대경기계', serviceRegions: ['서울 동부', '경기 동부'] },
    { dealerId: 3, dealerName: '경기환경시스템', serviceRegions: ['경기 서부', '경기 동부', '인천'] },
    { dealerId: 4, dealerName: '부산클린에어', serviceRegions: ['부산', '경남'] },
    { dealerId: 5, dealerName: '대전환경서비스', serviceRegions: ['대전', '충남', '충북', '세종'] },
  ], 300);
}

/**
 * Mock 매장점주 회원가입
 */
export async function mockRegisterOwner(
  _request: RegisterOwnerRequest,
): Promise<RegisterResponse> {
  return mockDelay({
    userId: 100,
    accountStatus: 'ACTIVE' as const,
    message: '회원가입이 완료되었습니다.',
  }, 500);
}

/**
 * Mock 매장본사 회원가입
 */
export async function mockRegisterHQ(
  _request: RegisterHQRequest,
): Promise<RegisterResponse> {
  return mockDelay({
    userId: 101,
    accountStatus: 'ACTIVE' as const,
    message: '회원가입이 완료되었습니다.',
  }, 500);
}

/**
 * Mock 본사직원 회원가입
 */
export async function mockRegisterAdmin(
  _request: RegisterAdminRequest,
): Promise<RegisterResponse> {
  return mockDelay({
    userId: 102,
    accountStatus: 'PENDING' as const,
    message: '회원가입이 완료되었습니다. 관리자 승인 후 로그인 가능합니다.',
  }, 500);
}

/**
 * Mock 대리점 회원가입
 */
export async function mockRegisterDealer(
  _request: RegisterDealerRequest,
): Promise<RegisterResponse> {
  return mockDelay({
    userId: 103,
    accountStatus: 'PENDING' as const,
    message: '회원가입이 완료되었습니다. 관리자 승인 후 로그인 가능합니다.',
  }, 500);
}
