// 사용자 역할
export type UserRole = 'ADMIN' | 'DEALER' | 'HQ' | 'OWNER';

// 계정 상태
export type AccountStatus = 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'DELETED';

// JWT 페이로드
export interface JwtPayload {
  userId: number;
  loginId: string;
  role: UserRole;
  storeIds: number[];
}

// 사용자 기본 정보 (users 테이블)
export interface User {
  userId: number;
  loginId: string;
  role: UserRole;
  name: string;
  phone: string;
  email?: string;
  accountStatus: AccountStatus;
  approvedBy?: number;
  approvedAt?: string;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

// 사업자 정보 (user_business_info 테이블)
export interface UserBusinessInfo {
  userId: number;
  businessName: string;
  businessNumber: string;
  businessCertFile?: string;
  businessCertVerified: boolean;
  address: string;
}

// 대리점 프로필 (dealer_profiles 테이블)
export interface DealerProfile {
  dealerId: number;
  serviceRegions: string[];
  serviceRegionsDetail?: Record<string, string[]>;
  specialties: DealerSpecialties;
}

export interface DealerSpecialties {
  newInstall: boolean;
  repair: boolean;
  cleaning: boolean;
  transport: boolean;
  inspection: boolean;
}

// 프랜차이즈 본사 프로필 (hq_profiles 테이블)
export interface HqProfile {
  hqId: number;
  brandName: string;
  hqName: string;
  businessType?: string;
}

// 매장 점주 프로필 (owner_profiles 테이블)
export interface OwnerProfile {
  ownerId: number;
  storeId?: number;
}

// 로그인 요청/응답
export interface LoginRequest {
  loginId: string;
  password: string;
}

// 로그인 응답용 사용자 정보 (JWT payload + 프로필)
export interface LoginUser {
  userId: number;
  loginId: string;
  role: UserRole;
  name: string;
  phone: string;
  email?: string;
  storeIds: string[];
}

export interface LoginResponse {
  accessToken: string;
  user: LoginUser;
}

// 비밀번호 초기화 요청
export interface PasswordResetRequest {
  loginId: string;
  name: string;
  email: string;
}

// 비밀번호 변경 요청
export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

// 회원가입 공통 계정 정보
export interface RegisterAccountInfo {
  loginId: string;
  password: string;
  name: string;
  phone: string;
  email: string;
}

// 사업자 정보 (Owner, HQ, Dealer 공통)
export interface RegisterBusinessInfo {
  businessName: string;
  businessNumber: string;
}

// 매장점주 매장 정보
export interface RegisterStoreInfo {
  storeName: string;
  address: string;
  addressDetail?: string;
  phone?: string;
  businessType: string;
  floorCount: number;
}

// 매장점주 회원가입 요청
export interface RegisterOwnerRequest {
  account: RegisterAccountInfo;
  business: RegisterBusinessInfo;
  store: RegisterStoreInfo;
  dealerId: number;
  termsAgreed: boolean;
  marketingAgreed: boolean;
}

// 매장본사 회원가입 요청
export interface RegisterHQRequest {
  account: RegisterAccountInfo;
  business: {
    corporationName: string;
    businessNumber: string;
    representativeName: string;
  };
  hqInfo: {
    address: string;
    addressDetail?: string;
    phone?: string;
    businessType: string;
  };
  dealerId?: number;
  termsAgreed: boolean;
  marketingAgreed: boolean;
}

// 본사직원 회원가입 요청
export interface RegisterAdminRequest {
  loginId: string;
  password: string;
  name: string;
  employeeId: string;
  email: string;
  department: string;
  termsAgreed: boolean;
  marketingAgreed: boolean;
}

// 대리점 회원가입 요청
export interface RegisterDealerRequest {
  account: RegisterAccountInfo;
  business: RegisterBusinessInfo;
  location: {
    address: string;
    addressDetail?: string;
  };
  serviceRegions: string[];
  termsAgreed: boolean;
  marketingAgreed: boolean;
}

// 회원가입 응답
export interface RegisterResponse {
  userId: number;
  accountStatus: AccountStatus;
  message: string;
}

// 대리점 목록 (회원가입 시 선택용)
export interface DealerListItem {
  dealerId: number;
  dealerName: string;
  serviceRegions: string[];
}

// 업종 목록
export const BUSINESS_TYPES = [
  '한식',
  '중식',
  '일식',
  '양식',
  '분식',
  '카페',
  '커피로스팅',
  '패스트푸드',
  '뷔페',
  '기타',
] as const;

export type BusinessType = (typeof BUSINESS_TYPES)[number];
