# MetaBeans ESP 관제시스템 — REST API 엔드포인트 설계서

> 📋 [수정 이력](MetaBeans_ESP_REST_API_엔드포인트_설계서__최신_CHANGELOG.md)

**문서 버전**: v1.9  
**작성일**: 2026-02-13  
**최종 수정일**: 2026-03-16 (v1.9)  
**근거 문서** (우선순위순):
1. MQTT Payload 규격_260227_v2.pdf (2026-02-27, **최우선**)
2. MQTT 토픽 구조 변경 및 협의 사항.pdf (2026-02-13)
3. ESP 관리툴_최종피드백_260212.pdf (2026-02-12)
4. MetaBeans_ESP_데이터구조_정의서_v3_2.md
5. MetaBeans_ESP_프로젝트_아키텍처_기술스택_정의서.md
6. MetaBeans_ESP_관리툴_전체구조_기획서.docx

---

## 0. 공통 규칙

### 0.1 Base URL

```
Production : https://api.metabeans.co.kr/api/v1
Development: http://localhost:3000/api/v1
```

### 0.2 인증 방식

| 항목 | 규격 |
|------|------|
| Access Token | JWT, 15분 만료, `Authorization: Bearer {token}` 헤더 |
| Refresh Token | JWT, 7일 만료, HttpOnly Cookie (`esp_refresh`) |
| JWT Payload | `{ userId, loginId, role, storeIds[] }` |
| ì—­í• (role) | `ADMIN` \| `DEALER` \| `HQ` \| `OWNER` |

### 0.3 공통 응답 형식

**성공 응답**
```json
{
  "success": true,
  "data": { ... },
  "meta": {                    // 목록 조회 시에만
    "page": 1,
    "pageSize": 20,
    "totalCount": 152,
    "totalPages": 8
  }
}
```

**에러 응답**
```json
{
  "success": false,
  "error": {
    "code": "AUTH_TOKEN_EXPIRED",
    "message": "Access token이 만료되었습니다.",
    "details": null
  }
}
```

### 0.4 공통 에러 코드

| HTTP | 코드 | 설명 |
|------|------|------|
| 400 | `VALIDATION_ERROR` | 입력값 유효성 검증 실패 |
| 401 | `AUTH_TOKEN_EXPIRED` | Access Token 만료 |
| 401 | `AUTH_UNAUTHORIZED` | 인증 실패 |
| 403 | `AUTH_FORBIDDEN` | 권한 없음 (역할/데이터 접근) |
| 404 | `RESOURCE_NOT_FOUND` | 리소스 없음 |
| 409 | `DUPLICATE_RESOURCE` | 중복 리소스 (아이디, 사업자번호 등) |
| 500 | `INTERNAL_ERROR` | 서버 내부 오류 |

### 0.5 공통 쿼리 파라미터 (목록 조회)

| 파라미터 | 타입 | 기본값 | 설명 |
|---------|------|--------|------|
| `page` | number | 1 | 페이지 번호 |
| `pageSize` | number | 20 | 페이지당 항목 수 (max 100) |
| `sortBy` | string | `created_at` | 정렬 기준 컬럼 |
| `sortOrder` | string | `desc` | `asc` \| `desc` |
| `search` | string | - | 검색어 (대상 필드는 API별 정의) |

### 0.6 역할별 데이터 접근 범위 규칙

서버 미들웨어에서 JWT의 `role`과 `storeIds[]`를 기반으로 자동 필터링:

| 역할 | 매장 접근 범위 | 판별 기준 |
|------|-------------|----------|
| `ADMIN` | 전체 매장 | 제한 없음 |
| `DEALER` | 관할 매장 | `stores.dealer_id = currentUser.userId` |
| `HQ` | 소속 매장 | `stores.hq_id = currentUser.userId` |
| `OWNER` | 본인 매장 | `stores.owner_id = currentUser.userId` |

### 0.7 타임스탬프 규칙

- **DB 저장**: UTC (`DATETIME`)
- **API 응답**: ISO 8601 (`"2026-02-13T09:30:00Z"`)
- **MQTT 원본**: Unix epoch (초 단위) — MQTT 브릿지에서 변환

---

## 1. 인증 (Auth)

> **화면**: ESP_로그인.html, 각 회원가입 HTML

### 1.1 로그인

```
POST /auth/login
```

**Body**
```json
{
  "loginId": "store_owner_001",
  "password": "secureP@ss123"
}
```

**Response 200**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbG...",
    "user": {
      "userId": 1,
      "loginId": "store_owner_001",
      "name": "김점주",
      "role": "OWNER",
      "email": "kim@store.com",
      "phone": "010-1234-5678",
      "storeIds": [101],
      "permissions": ["DASHBOARD_AS_REQUEST", "DASHBOARD_REALTIME_ISSUE", "MONITOR_BASIC_STATUS", "CONTROL_POWER", "CONTROL_DAMPER", "CONTROL_FAN", "AS_REQUEST"]
    }
  }
}
```
- Refresh Token은 `Set-Cookie: esp_refresh=...; HttpOnly; Secure; SameSite=Strict; Path=/api/v1/auth; Max-Age=604800`로 전달
- `permissions[]`: 해당 사용자의 최종 허용 feature_code 목록 (RBAC + 오버라이드 반영)

**비즈니스 규칙**:
- `account_status`가 `ACTIVE`인 경우에만 로그인 허용
- 로그인 성공 시 `users.last_login_at` 업데이트

### 1.2 토큰 갱신

```
POST /auth/refresh
```
- Cookie에서 `esp_refresh` 자동 전달
- 새 Access Token + (선택적) 새 Refresh Token 발급

**Response 200**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbG..."
  }
}
```

### 1.3 로그아웃

```
POST /auth/logout
```
- Refresh Token Cookie 삭제
- (선택) 서버 측 토큰 블랙리스트 등록

### 1.4 아이디 중복 확인

```
GET /auth/check-login-id?loginId=new_user_01
```

**Response 200**
```json
{
  "success": true,
  "data": { "available": true }
}
```

### 1.5 비밀번호 초기화 요청

```
POST /auth/password-reset-request
```

**Body**
```json
{
  "loginId": "store_owner_001",
  "name": "김점주",
  "phone": "010-1234-5678"
}
```
- 관리자 승인 후 처리 (최대 24시간 소요)

### 1.6 비밀번호 변경

```
PUT /auth/password
🔒 인증 필요
```

**Body**
```json
{
  "currentPassword": "oldP@ss",
  "newPassword": "newP@ss123"
}
```

---

## 2. 회원가입 (Registration)

> **화면**: ESP_매장점주_회원가입.html, ESP_매장본사_회원가입.html, ESP_본사_회원가입.html, ESP_대리점_회원가입.html

### 2.0 사업자등록증 업로드 (OWNER / HQ / DEALER 공통)

**적용 대상**: `POST /registration/owner`, `POST /registration/hq`, `POST /registration/dealer`

| 항목 | 규격 |
|------|------|
| 폼 필드명 | `businessCertFile` (파일 1개) |
| Content-Type | **`multipart/form-data`** (위 세 가입 API는 **파일 첨부 시 반드시 multipart**; JSON 단독 바디로는 파일 전송 불가) |
| 허용 형식 | JPG, PNG, PDF |
| 최대 크기 | 10MB (파트당) |
| 저장 | 업로드 파일은 객체 스토리지(S3 등)에 저장 후 `user_business_info.business_cert_file`(또는 동등 컬럼)에 **경로/키** 저장 |

**역할별 `businessCertFile` 필수 여부**

| 가입 API | 필수 | 백엔드 처리 가이드 |
|----------|------|-------------------|
| `POST /registration/owner` | **필수** | 미첨부·0바이트·형식 불일치 시 `400` + `VALIDATION_ERROR`. 관리툴(프론트)도 동일 정책으로 수집. |
| `POST /registration/hq` | 선택 | 미제출 시: 신청 후 7일 이내 보완 또는 support@metabean.net 이메일 제출 등 **운영 정책**에 따름. |
| `POST /registration/dealer` | 선택 | 위와 동일. |

**multipart 요청 시 텍스트 필드**

- 본문의 JSON 예시 필드(`account`, `business`, `store` 등)는 **multipart 파트**로 각각 전달하는 방식을 권장한다.  
  - 구현 패턴 A: `account`, `business`, `store`… 를 **JSON 문자열 1개 파트**(`application/json` 또는 `text/plain`)로 넣고, `businessCertFile`은 **파일 파트**.  
  - 구현 패턴 B: 필드를 **평탄화**한 폼 키(`account.loginId`, `store.storeName` 등) + 파일 파트.  
- 팀 내에서 **하나의 패턴으로 통일**할 것(프론트 Phase 2 연동 시 동일 규격).

> **비고**: 프론트엔드는 드래그앤드롭/클릭 업로드 UI로 수집. 백엔드는 MIME/확장자/용량 검증 후 저장.

### 2.1 매장 점주(OWNER) 가입 — 7단계

```
POST /registration/owner
```

**Content-Type**: `businessCertFile` 첨부 시 **`multipart/form-data`** (§2.0). 파일 없이 JSON만 받지 않는 것을 권장(점주는 파일 **필수**).

**Body (논리 구조 — 실제 전송은 multipart 권장)**

```json
{
  "account": {
    "loginId": "owner_kim",
    "password": "secureP@ss123",
    "name": "김점주",
    "phone": "02-1234-5678",
    "email": "kim@store.com"
  },
  "business": {
    "businessName": "김네식당",
    "businessNumber": "123-45-67890"
  },
  "businessCertFile": "(multipart file — §2.0, 점주 가입 시 필수)",
  "store": {
    "storeName": "김네식당 본점",
    "address": "서울시 강남구 역삼동 123-4",
    "addressDetail": "1층",
    "phone": "02-1234-5678",
    "businessType": "한식",
    "floorCount": 2
  },
  "dealerId": 5,
  "termsAgreed": true,
  "marketingAgreed": false
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| account | object | ✅ | 로그인 계정. **phone**·**email**은 UI상 「매장 정보」 단계에서 수집해도 되며, 이 경우 보통 **account.phone = store.phone**, **account.email**은 매장/운영 담당 이메일(별도 필드 수집)로 전달. |
| business | object | ✅ | 상호명·사업자등록번호 (`businessName`, `businessNumber`). |
| businessCertFile | file | ✅ | 사업자등록증. §2.0 규격. |
| store | object | ✅ | 최초 매장 정보. |
| store.storeName | string | ✅ | 매장명 |
| store.address | string | ✅ | 기본 주소 |
| store.addressDetail | string | | 상세 주소 |
| store.phone | string | ✅ | 매장 전화번호 (`account.phone`과 동일 값 허용) |
| store.businessType | string | ✅ | 업종 코드/명 (데이터구조 정의서 `stores.business_type` 준수) |
| store.floorCount | number | ✅ | 층수 (≥1) |
| dealerId | number | ✅ | 담당 대리점 ID (`GET /registration/dealer-list` 등에서 선택) |
| termsAgreed | boolean | ✅ | 이용약관 동의 |
| marketingAgreed | boolean | | 마케팅 수신 동의 (기본 false) |

> **account.phone / account.email**: 기본 정보 단계에서 수집하지 않는 화면 설계인 경우, **매장 정보 단계의 전화·이메일과 동일 값**을 `account`에 넣어 전달하면 된다 (HQ의 `hqInfo.contactPhone`/`contactEmail`과 `account` 정렬과 동일 개념).

**Response 201**
```json
{
  "success": true,
  "data": {
    "userId": 25,
    "accountStatus": "PENDING",
    "message": "회원가입이 완료되었습니다. 관리자 승인 후 로그인 가능합니다."
  }
}
```

### 2.2 매장 본사(HQ) 가입 — 4단계

```
POST /registration/hq
```

**Body**
```json
{
  "account": {
    "loginId": "hq_bbq",
    "password": "secureP@ss123",
    "name": "박본사",
    "phone": "010-5555-1234",
    "email": "manager@bbq.co.kr"
  },
  "business": {
    "brandName": "비비큐",
    "corporationName": "비비큐 본사",
    "businessNumber": "987-65-43210",
    "representativeName": "박대표"
  },
  "businessCertFile": "(multipart file — 2.0 참조)",
  "hqInfo": {
    "zipCode": "05836",
    "address": "서울시 송파구 문정동 50",
    "addressDetail": "3층",
    "phone": "02-1234-5678",
    "email": "info@bbq.co.kr",
    "contactName": "김담당",
    "contactPhone": "010-5555-1234",
    "contactEmail": "manager@bbq.co.kr"
  },
  "termsAgreed": true
}
```

| business 필드 | 타입 | 필수 | 설명 |
|-----------------|------|------|------|
| brandName | string | ✅ | 프랜차이즈 브랜드명 (DB `hq_profiles.brand_name` 매핑) |
| corporationName | string | ✅ | 법인명 |
| businessNumber | string | ✅ | 사업자등록번호 |
| representativeName | string | ✅ | 대표자명 |

| hqInfo 필드 | 타입 | 필수 | 설명 |
|-------------|------|------|------|
| zipCode | string | | 우편번호 |
| address | string | ✅ | 기본 주소 |
| addressDetail | string | | 상세 주소 (층/호수 등) |
| phone | string | ✅ | 대표 전화번호 |
| email | string | ✅ | 대표 이메일 |
| contactName | string | ✅ | 담당자명 |
| contactPhone | string | ✅ | 담당자 연락처 |
| contactEmail | string | ✅ | 담당자 이메일 |

> **account.phone / account.email**: 프론트 회원가입 UI에서 기본 정보 단계에 수집하지 않을 경우, `hqInfo.contactPhone`·`hqInfo.contactEmail`과 동일 값으로 전달 가능.  
> **dealerId**: 선택. HQ 회원가입 화면에서 담당 대리점을 선택하지 않는 경우 생략 가능(관리자 배정 등).

### 2.3 본사 직원(ADMIN) 가입 — 2단계

```
POST /registration/admin
```

**Body**
```json
{
  "loginId": "admin_lee",
  "password": "secureP@ss123",
  "name": "이관리",
  "email": "lee@metabeans.com",
  "termsAgreed": true,
  "marketingAgreed": false
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| loginId | string | ✅ | 로그인 아이디 |
| password | string | ✅ | 비밀번호 |
| name | string | ✅ | 이름 |
| email | string | ✅ | 이메일 |
| termsAgreed | boolean | ✅ | 이용약관 동의 |
| marketingAgreed | boolean | | 마케팅 수신 동의 (기본 false) |

> **가입 화면(UI)**: 기본 정보 단계에서 **사번·부서는 수집하지 않음**. 필요 시 승인 후 관리자/인사 시스템에서 별도 등록.

- ADMIN 계정은 별도 승인 프로세스 (기존 ADMIN이 직접 생성 또는 특수 초대코드)

### 2.4 대리점(DEALER) 가입 — 6단계

```
POST /registration/dealer
```

**Body**
```json
{
  "account": {
    "loginId": "dealer_park",
    "password": "secureP@ss123",
    "name": "박기사",
    "phone": "010-5555-1234",
    "email": "park@dealer.com"
  },
  "business": {
    "businessName": "서울환경설비",
    "businessNumber": "456-78-90123"
  },
  "businessCertFile": "(multipart file — 2.0 참조)",
  "location": {
    "zipCode": "07236",
    "address": "서울시 영등포구 당산동 100",
    "addressDetail": "1층",
    "phone": "02-9876-5432",
    "email": "info@dealer.com",
    "contactName": "김담당",
    "contactPhone": "010-5555-1234",
    "contactEmail": "manager@dealer.com"
  },
  "serviceRegions": ["서울 동부", "서울 서부", "경기 동부"],
  "termsAgreed": true
}
```

| location 필드 | 타입 | 필수 | 설명 |
|---------------|------|------|------|
| zipCode | string | | 우편번호 |
| address | string | ✅ | 기본 주소 |
| addressDetail | string | | 상세 주소 (층/호수 등) |
| phone | string | ✅ | 대표 전화번호 |
| email | string | ✅ | 대표 이메일 |
| contactName | string | ✅ | 담당자명 |
| contactPhone | string | ✅ | 담당자 연락처 |
| contactEmail | string | ✅ | 담당자 이메일 |

### 2.5 사업자등록번호 검증

```
GET /registration/check-business-number?number=123-45-67890
```

### 2.6 프랜차이즈 본사 목록 (가입 시 선택용)

```
GET /registration/hq-list
```

**Response 200**
```json
{
  "success": true,
  "data": [
    { "hqId": 3, "brandName": "BBQ", "hqName": "비비큐 본사" },
    { "hqId": 7, "brandName": "교촌", "hqName": "교촌에프앤비" }
  ]
}
```

### 2.7 대리점 목록 (가입 시 선택용)

```
GET /registration/dealer-list?region=서울 동부
```

---

## 3. 대시보드 (Dashboard)

> **화면**: ESP_매장본사_대시보드.html (역할별 공유 레이아웃)

### 3.1 대시보드 요약 통계

```
GET /dashboard/summary
🔒 인증 필요 | 역할: ALL
```

**Response 200** — 역할에 따라 자동 필터링
```json
{
  "success": true,
  "data": {
    "storeCount": 45,
    "activeEquipmentCount": 120,
    "offlineEquipmentCount": 3,
    "asRequestPending": 5,
    "asRequestInProgress": 2,
    "criticalAlarmCount": 1,
    "warningAlarmCount": 8
  }
}
```
- `OWNER`: 본인 매장만 (storeCount는 항상 1)
- `HQ`: 관할 가맹점만
- `DEALER`: 관할 매장만
- `ADMIN`: ì "ì²´

### 3.2 실시간 발생 이슈 목록

```
GET /dashboard/issues
🔒 인증 필요 | 역할: ALL
```

**Query Parameters**
| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `severity` | string | `WARNING` \| `CRITICAL` \| 미지정=전체 |
| `storeId` | number | 특정 매장 필터 |

**Response 200**
```json
{
  "success": true,
  "data": [
    {
      "issueId": 1001,
      "storeId": 101,
      "storeName": "김네식당 본점",
      "equipmentId": 201,
      "equipmentName": "ESP-001",
      "controllerId": 301,
      "controllerName": "PP-001",
      "issueType": "INLET_TEMP_HIGH",
      "severity": "CRITICAL",
      "currentValue": 105.2,
      "thresholdValue": 100,
      "unit": "°C",
      "message": "유입 온도 이상 — 100°C 이상",
      "occurredAt": "2026-02-13T09:25:00Z",
      "isResolved": false
    }
  ]
}
```

**이슈 타입 (피드백 p.33~34)**:

| issueType | 설명 | Yellow 조건 | Red 조건 |
|-----------|------|------------|---------|
| `COMM_DISCONNECTED` | 통신 연결 상태 점검 | 끊김 1시간 이상 | 끊김 하루 이상 |
| `INLET_TEMP_HIGH` | 유입 온도 이상 | 70°C 이상 | 100°C 이상 |
| `FILTER_CHECK_NEEDED` | 필터 청소 상태 점검 | 점검 필요 | — |
| `DUST_REMOVAL_LOW` | 먼지제거 성능 점검 | — | 점검 필요 |

### 3.3 긴급 알람 조회

```
GET /dashboard/alarms
🔒 인증 필요 | 역할: ALL
```
- Red(CRITICAL)만 반환 + 이메일 발송 여부 포함

**Response 200**
```json
{
  "success": true,
  "data": [
    {
      "alarmId": 5001,
      "storeId": 101,
      "storeName": "김네식당 본점",
      "issueType": "INLET_TEMP_HIGH",
      "severity": "CRITICAL",
      "currentValue": 105.2,
      "occurredAt": "2026-02-13T09:25:00Z",
      "emailSentAt": "2026-02-13T09:25:05Z",
      "emailRecipients": ["admin@metabeans.com"]
    }
  ]
}
```

### 3.4 실내 공기질(IAQ) 현황

```
GET /dashboard/iaq?storeId=101
🔒 인증 필요 | 역할: ALL
```

**Response 200** — 해당 매장의 최신 게이트웨이 IAQ 데이터
```json
{
  "success": true,
  "data": {
    "storeId": 101,
    "storeName": "김네식당 본점",
    "gateways": [
      {
        "gatewayId": 10,
        "gwDeviceId": "gw-001",
        "floorName": "1층 주방",
        "iaq": {
          "pm1_0": 12.5,
          "pm2_5": 25.0,
          "pm4_0": 30.0,
          "pm10": 35.0,
          "temperature": 24.5,
          "humidity": 65.0,
          "vocIndex": 100,
          "noxIndex": 50,
          "co2": 450,
          "o3": 25,
          "co": 1.2,
          "hcho": 30
        },
        "status": "GOOD",
        "updatedAt": "2026-02-13T09:30:00Z"
      }
    ]
  }
}
```

### 3.5 실외 대기질 조회

```
GET /dashboard/outdoor-air?storeId=101
🔒 인증 필요 | 역할: ALL
```
- Airkorea API 캐시 데이터 (1시간 간격 갱신)

**Response 200**
```json
{
  "success": true,
  "data": {
    "stationName": "강남구",
    "pm10": 45.0,
    "pm2_5": 22.0,
    "o3": 0.035,
    "co": 0.5,
    "no2": 0.025,
    "so2": 0.003,
    "overallIndex": 75,
    "grade": "보통",
    "measuredAt": "2026-02-13T09:00:00Z"
  }
}
```

### 3.6 매장 트리 데이터 (사이드바)

```
GET /dashboard/store-tree
🔒 인증 필요 | 역할: ALL
```

**Response 200** — 역할에 따라 자동 필터링
```json
{
  "success": true,
  "data": [
    {
      "storeId": 101,
      "storeName": "김네식당 본점",
      "status": "WARNING",
      "floors": [
        {
          "floorId": 1001,
          "floorCode": "1F",
          "floorName": "1층 주방",
          "gateway": {
            "gatewayId": 10,
            "gwDeviceId": "gw-001",
            "connectionStatus": "ONLINE",
            "status": "GOOD"
          },
          "equipments": [
            {
              "equipmentId": 201,
              "equipmentName": "ESP-001",
              "status": "WARNING",
              "connectionStatus": "ONLINE",
              "controllers": [
                {
                  "controllerId": 301,
                  "ctrlDeviceId": "ctrl-001",
                  "status": "WARNING",
                  "connectionStatus": "ONLINE"
                },
                {
                  "controllerId": 302,
                  "ctrlDeviceId": "ctrl-002",
                  "status": "GOOD",
                  "connectionStatus": "ONLINE"
                }
              ]
            }
          ]
        }
      ]
    }
  ]
}
```

**사이드바 트리 UI 표시**:
- API 응답은 Store → Floor → Gateway → Equipment → Controller 전체 계층을 포함하지만, 프론트엔드 사이드바에서는 **Store > Equipment > Controller** 3단계로 평탄화하여 표시한다 (Floor, Gateway 계층은 UI에서 생략)
- 컨트롤러 클릭 시 상위 Equipment가 자동 선택되며, 장비관리 페이지에서 해당 컨트롤러의 데이터만 필터링하여 표시 (이력조회 제외)

**상태 전파 규칙** (피드백 p.27):
- Controller → Equipment → Floor/Gateway → Store 순으로 하위 중 최고 위험도 전파
- 문제 없으면 `GOOD` + "정상 운영", 문제 있으면 해당 색상 + "문제 발생"

---

## 4. 장비 관리 (Equipment)

> **화면**: ESP_관리자_장비관리.html (5개 탭)

### 4.1 장비 목록 조회

```
GET /equipment
🔒 인증 필요 | 역할: ALL (범위 자동 필터)
```

**Query Parameters**
| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `storeId` | number | 매장 필터 |
| `floorId` | number | 층 필터 |
| `status` | string | `NORMAL` \| `INSPECTION` \| `CLEANING` \| `INACTIVE` |
| `connectionStatus` | string | `ONLINE` \| `OFFLINE` |
| `search` | string | 장비명, 시리얼 검색 |

**Response 200**
```json
{
  "success": true,
  "data": [
    {
      "equipmentId": 201,
      "equipmentSerial": "MB-ESP-2024-00001",
      "mqttEquipmentId": "esp-001",
      "storeName": "김네식당 본점",
      "floorName": "1층 주방",
      "equipmentName": "ESP-001",
      "modelName": "MB-ESP-5000",
      "cellType": "SUS304 평판형",
      "powerpackCount": 2,
      "purchaseDate": "2025-06-15",
      "warrantyEndDate": "2027-06-14",
      "dealerName": "서울환경설비",
      "status": "NORMAL",
      "connectionStatus": "ONLINE",
      "lastSeenAt": "2026-02-13T09:30:00Z"
    }
  ],
  "meta": { "page": 1, "pageSize": 20, "totalCount": 45, "totalPages": 3 }
}
```

### 4.2 장비 상세 조회

```
GET /equipment/:equipmentId
🔒 인증 필요 | 역할: ALL
```

**Response 200**
```json
{
  "success": true,
  "data": {
    "equipmentId": 201,
    "equipmentSerial": "MB-ESP-2024-00001",
    "mqttEquipmentId": "esp-001",
    "store": { "storeId": 101, "storeName": "김네식당 본점", "siteId": "site-001" },
    "floor": { "floorId": 1001, "floorCode": "1F", "floorName": "1층 주방" },
    "equipmentName": "ESP-001",
    "model": { "modelId": 1, "modelName": "MB-ESP-5000", "manufacturer": "MetaBeans" },
    "cellType": "SUS304 평판형",
    "powerpackCount": 2,
    "purchaseDate": "2025-06-15",
    "warrantyEndDate": "2027-06-14",
    "dealer": { "dealerId": 5, "dealerName": "서울환경설비" },
    "status": "NORMAL",
    "connectionStatus": "ONLINE",
    "lastSeenAt": "2026-02-13T09:30:00Z",
    "gateway": {
      "gatewayId": 10,
      "gwDeviceId": "gw-001",
      "connectionStatus": "ONLINE",
      "statusFlags": 63,
      "controllerCount": 2
    },
    "controllers": [
      {
        "controllerId": 301,
        "ctrlDeviceId": "ctrl-001",
        "connectionStatus": "ONLINE",
        "statusFlags": 63,
        "lastSeenAt": "2026-02-13T09:30:00Z"
      },
      {
        "controllerId": 302,
        "ctrlDeviceId": "ctrl-002",
        "connectionStatus": "ONLINE",
        "statusFlags": 63,
        "lastSeenAt": "2026-02-13T09:30:00Z"
      }
    ],
    "cleaningThreshold": {
      "sparkThreshold": 30,
      "sparkTimeWindow": 60,
      "pressureBase": 200,
      "pressureRate": 1.5
    },
    "consumableSchedules": [
      { "partName": "SUS í•"í"°", "intervalDays": 90, "lastReplacedAt": "2025-12-01", "nextDueAt": "2026-03-01" }
    ],
    "registeredBy": { "userId": 5, "name": "박기사" },
    "createdAt": "2025-06-15T10:00:00Z",
    "updatedAt": "2026-01-20T14:30:00Z"
  }
}
```

### 4.3 장비 등록

```
POST /equipment
🔒 인증 필요 | 역할: ADMIN, DEALER
```

**Body**
```json
{
  "equipmentSerial": "MB-ESP-2024-00099",
  "mqttEquipmentId": "esp-099",
  "storeId": 101,
  "floorId": 1001,
  "equipmentName": "ESP-099",
  "modelId": 1,
  "cellType": "SUS304 평판형",
  "powerpackCount": 2,
  "purchaseDate": "2026-02-13",
  "warrantyEndDate": "2028-02-12",
  "dealerId": 5,
  "controllers": [
    { "ctrlDeviceId": "ctrl-001", "gatewayId": 10 },
    { "ctrlDeviceId": "ctrl-002", "gatewayId": 10 }
  ]
}
```

**비즈니스 규칙**:
- `powerpackCount` ≤ 4 (피드백 p.50)
- 장비당 Equipment는 층당 최대 5대 (MQTT 규격)
- `cellType`은 자유 입력 (피드백 p.36 — 드롭다운 제거)

### 4.4 장비 정보 수정

```
PUT /equipment/:equipmentId
🔒 인증 필요 | 역할: ADMIN, DEALER
```

### 4.5 장비 삭제

```
DELETE /equipment/:equipmentId
🔒 인증 필요 | 역할: ADMIN, DEALER
```

### 4.6 장비 모델 목록 (드롭다운용)

```
GET /equipment/models
🔒 인증 필요 | 역할: ALL
```

**Response 200**
```json
{
  "success": true,
  "data": [
    { "modelId": 1, "modelName": "MB-ESP-5000", "manufacturer": "MetaBeans", "isActive": true },
    { "modelId": 2, "modelName": "MB-ESP-3000", "manufacturer": "MetaBeans", "isActive": true }
  ]
}
```

---

## 5. 실시간 모니터링 (Monitoring)

> **화면**: ESP_관리자_장비관리.html — 탭2: 실시간 모니터링

### 5.1 장비 최신 센서 데이터 조회

```
GET /monitoring/equipment/:equipmentId/latest
🔒 인증 필요 | 역할: ALL
```

**Response 200** — MQTT sensor 메시지에서 파싱하여 DB에 저장된 최신 데이터
```json
{
  "success": true,
  "data": {
    "equipmentId": 201,
    "equipmentName": "ESP-001",
    "connectionStatus": "ONLINE",
    "lastSeenAt": "2026-02-13T09:30:00Z",
    "controllers": [
      {
        "controllerId": 301,
        "ctrlDeviceId": "ctrl-001",
        "timestamp": "2026-02-13T09:29:55Z",
        "connectionStatus": "ONLINE",
        "sensorData": {
          "pm2_5": 25.0,
          "pm10": 35.0,
          "diffPressure": 12.0,
          "oilLevel": 0,
          "ppTemp": 45,
          "ppSpark": 123,
          "ppPower": 1,
          "ppAlarm": 0,
          "fanSpeed": 2,
          "fanMode": 0,
          "fanRunning": 1,
          "fanFreq": 42.50,
          "fanTargetPct": 0.0,
          "damperMode": 0,
          "damperCtrl": 80.0,
          "flow": 850.0,
          "damper": 75.0,
          "inletTemp": 22.5,
          "velocity": 8.3,
          "ductDp": 245.0,
          "statusFlags": 63
        },
        "statusDetails": {
          "powerpackComm": true,
          "pm25Sensor": true,
          "pressureSensor": true,
          "levelSensor": true,
          "damperController": true,
          "inverter": true
        },
        "sensorDataNotes": {
          "oilLevel": "v1.2: 0=정상, 1=만수 (int 이진값, 디지털 센서)",
          "ppSpark": "v1.2: 0~9999 범위 (rev2.1 파워팩, 구버전 0~99)",
          "fanRunning": "v1.2 신규: 인버터 실제 운전 상태 (0=정지, 1=운전중)",
          "fanFreq": "v1.2 신규: 인버터 실제 출력 주파수 Hz (0~50.00)",
          "fanTargetPct": "v1.2 신규: PID 목표값 % (자동 모드 시만 유의미)",
          "damperCtrl": "v1.2 신규: 댐퍼 명령값 %, damper=Damper_FB 피드백값과 구분"
        },
        "alerts": {
          "filterCheckStatus": "GOOD",
          "dustRemovalPerformance": "GOOD",
          "inletTempStatus": "GOOD",
          "commStatus": "GOOD"
        }
      }
    ]
  }
}
```

### 5.2 센서 이력 데이터 (차트용)

```
GET /monitoring/equipment/:equipmentId/history
🔒 인증 필요 | 역할: ALL
```

**Query Parameters**
| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| `controllerId` | number | ✅ | 컨트롤러 ID |
| `metrics` | string | ✅ | 조회할 지표 (쉼표 구분). 예: `ppTemp,ppSpark,pm2_5` |
| `from` | string | ✅ | 시작 시간 (ISO 8601) |
| `to` | string | ✅ | 종료 시간 (ISO 8601) |
| `interval` | string | - | 집계 간격: `raw` (10초, 기본) \| `1m` \| `5m` \| `1h` \| `1d` |

**Response 200**
```json
{
  "success": true,
  "data": {
    "controllerId": 301,
    "interval": "1m",
    "metrics": ["ppTemp", "ppSpark"],
    "dataPoints": [
      { "timestamp": "2026-02-13T09:00:00Z", "ppTemp": 44, "ppSpark": 0 },
      { "timestamp": "2026-02-13T09:01:00Z", "ppTemp": 45, "ppSpark": 2 },
      { "timestamp": "2026-02-13T09:02:00Z", "ppTemp": 45, "ppSpark": 0 }
    ]
  }
}
```

**비즈니스 규칙**:
- `raw` (10초 원본): 최근 90일까지만 조회 가능
- 90일 이전 데이터: 1시간 집계본만 제공 (5년 보관)
- ECharts의 `dataZoom` (확대/축소) 지원을 위해 충분한 데이터포인트 반환

### 5.3 게이트웨이 IAQ 이력 데이터

```
GET /monitoring/gateway/:gatewayId/iaq-history
🔒 인증 필요 | 역할: ALL
```

**Query Parameters**: 5.2와 동일 구조 (`metrics` 예: `pm2_5,co2,temperature,humidity`)

### 5.4 장비 이력 (A/S + 청소 + 제어 통합)

```
GET /monitoring/equipment/:equipmentId/history-log
🔒 인증 필요 | 역할: ALL
```

**Query Parameters**
| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `type` | string | `ALL` \| `AS` \| `CLEANING` \| `CONTROL` \| `ALARM` |
| `from` | string | 시작일 |
| `to` | string | 종료일 |

**Response 200**
```json
{
  "success": true,
  "data": [
    {
      "historyId": 8001,
      "type": "ALARM",
      "title": "스파크 감지 알람",
      "description": "pp_spark 값 45 — 기준값 30 초과",
      "controllerId": 301,
      "controllerName": "PP-001",
      "occurredAt": "2026-02-10T15:30:00Z",
      "resolvedAt": "2026-02-10T15:35:00Z"
    },
    {
      "historyId": 8002,
      "type": "CONTROL",
      "title": "파워팩 리셋",
      "description": "관리자 원격 제어 — 파워팩 리셋 실행",
      "performedBy": "이관리",
      "occurredAt": "2026-02-10T15:36:00Z"
    }
  ],
  "meta": { "page": 1, "pageSize": 20, "totalCount": 15, "totalPages": 1 }
}
```

### 5.5 ESG 지표 조회

```
GET /monitoring/equipment/:equipmentId/esg
🔒 인증 필요 | 역할: ALL
```

**Query Parameters**: `from`, `to` (기간)

**Response 200**
```json
{
  "success": true,
  "data": {
    "equipmentId": 201,
    "period": { "from": "2026-01-01", "to": "2026-02-13" },
    "oilCollected": 12.5,
    "oilCollectedUnit": "L",
    "dustReduced": 45.2,
    "dustReducedUnit": "kg",
    "co2Reduced": 120.0,
    "co2ReducedUnit": "kg",
    "operatingHours": 1560,
    "dailyMetrics": [
      { "date": "2026-02-12", "oilCollected": 0.3, "dustReduced": 1.2, "operatingHours": 12 }
    ]
  }
}
```

---

## 6. 장비 제어 (Control)

> **화면**: ESP_관리자_장비관리.html — 탭4: 장치 제어

### 6.1 제어 명령 실행

```
POST /control/command
🔒 인증 필요 | 역할: ADMIN(전체), DEALER(오버라이드), HQ(오버라이드), OWNER(본인)
```

**Body**
```json
{
  "gatewayId": 10,
  "equipmentId": "esp-001",
  "controllerId": "ctrl-001",
  "target": 0,
  "action": 1,
  "value": 0
}
```

**target/action/value 정의** (MQTT 규격 260227_v2 — 변경 없음, 260213 이후 유지):

| target | action | value | 설명 |
|--------|--------|-------|------|
| `0` (파워팩) | `0` | — | 파워팩 OFF |
| `0` (파워팩) | `1` | — | 파워팩 ON |
| `0` (파워팩) | `2` | — | 파워팩 리셋 |
| `1` (댐퍼) | `1` | 0-100 (int) | 댐퍼 개도율 설정 (%, 수동 모드) |
| `1` (댐퍼) | `2` | 0 또는 1 (int) | 🆕 제어 모드 전환 (0=수동, 1=자동) |
| `1` (댐퍼) | `3` | float (CMH) | 🆕 목표 풍량 설정 (자동 모드, 예: 850.0) |
| `2` (시로코팬) | `0` | — | 팬 OFF (수동) |
| `2` (시로코팬) | `1` | — | 팬 LOW (수동, 15Hz) |
| `2` (시로코팬) | `2` | — | 팬 MID (수동, 30Hz) |
| `2` (시로코팬) | `3` | — | 팬 HIGH (수동, 50Hz) |
| `2` (시로코팬) | `4` | 0 또는 1 (int) | 🆕 제어 모드 전환 (0=수동, 1=자동) |
| `2` (시로코팬) | `5` | float (m/s) | 🆕 목표 풍속 설정 (자동 모드, 예: 3.5) |

**일괄 제어**:
- `equipmentId: "all"`, `controllerId: "all"` → 게이트웨이 하위 전체
- `equipmentId: "esp-001"`, `controllerId: "all"` → 해당 집진기 하위 전체

**자동 제어 동작 참고** (MQTT 규격 260213, 260227_v2 변경 없음):
- **댐퍼 자동 제어**: target=1, action=2로 자동 모드 전환 후 action=3으로 목표 풍량(CMH) 설정. flo-OAC 하드웨어가 자체 PID로 댐퍼 개도를 자동 조절
- **팬 자동 제어**: target=2, action=4로 자동 모드 전환 후 action=5로 목표 풍속(m/s) 설정. M100 인버터 내장 PID가 자동으로 주파수를 가/감속
- **자동→수동 전환**: 모드 전환 명령(value=0) 또는 수동 명령(댐퍼 action=1, 팬 action=0~3) 전송 시 자동 모드 해제
- **안전 오버라이드**: 비상정지(ESTOP), 스파크 감지, 과온도 알람 발생 시 자동으로 수동 모드 전환 (센서 데이터의 `fanMode`, `damperMode` 필드가 0으로 변경)


**Response 200**
```json
{
  "success": true,
  "data": {
    "cmdId": "550e8400-e29b-41d4-a716-446655440000",
    "status": "SENT",
    "message": "제어 명령이 전송되었습니다."
  }
}
```

**서버 내부 동작**:
1. REST API 수신 → UUID cmd_id 생성
2. MQTT 브릿지 → `metabeans/{site_id}/{floor_id}/gateway/{gw_id}/control` 발행
3. Gateway ACK 수신 → DB 저장 + (선택) WebSocket/Polling으로 프론트엔드 알림

### 6.2 제어 명령 결과 확인

```
GET /control/command/:cmdId/status
🔒 인증 필요 | 역할: ALL
```

**Response 200**
```json
{
  "success": true,
  "data": {
    "cmdId": "550e8400-e29b-41d4-a716-446655440000",
    "status": "SUCCESS",
    "result": "success",
    "reason": "",
    "sentAt": "2026-02-13T09:30:00Z",
    "ackedAt": "2026-02-13T09:30:02Z"
  }
}
```

**status 값**: `SENT` → `SUCCESS` \| `FAILED` \| `TIMEOUT` (30초 내 ACK 미수신)

### 6.3 제어 이력 조회

```
GET /control/history
🔒 인증 필요 | 역할: ALL
```

**Query Parameters**
| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `equipmentId` | number | 장비 필터 |
| `controllerId` | number | 컨트롤러 필터 |
| `target` | number | 0=파워팩, 1=댐퍼, 2=팬 |
| `from` | string | 시작일 |
| `to` | string | 종료일 |

### 6.4 댐퍼 자동제어 설정 조회/수정

```
GET /control/equipment/:equipmentId/damper-auto-settings
PUT /control/equipment/:equipmentId/damper-auto-settings
🔒 인증 필요 | 역할: ADMIN
```

**PUT Body**
```json
{
  "settings": [
    { "step": 0, "openRate": 0,   "description": "완전 폐쇄" },
    { "step": 1, "openRate": 14,  "description": "단계 1" },
    { "step": 2, "openRate": 28,  "description": "단계 2" },
    { "step": 3, "openRate": 42,  "description": "단계 3" },
    { "step": 4, "openRate": 57,  "description": "단계 4" },
    { "step": 5, "openRate": 71,  "description": "단계 5" },
    { "step": 6, "openRate": 85,  "description": "단계 6" },
    { "step": 7, "openRate": 100, "description": "완전 개방" }
  ],
  "targetFlowCmh": 1200
}
```
- 8단계(0~7) 개도율 매핑 (피드백 p.44~45)
- `targetFlowCmh`: 목표 풍량 (ADMIN만 설정 가능, `CONTROL_FLOW_TARGET` 권한)

### 6.5 팬 자동제어 설정 조회/수정

```
GET /control/equipment/:equipmentId/fan-auto-settings
PUT /control/equipment/:equipmentId/fan-auto-settings
🔒 인증 필요 | 역할: ADMIN
```

**PUT Body**
```json
{
  "targetVelocityMs": 8.5,
  "controllerId": "ctrl-001"
}
```
- `targetVelocityMs`: 목표 풍속 (m/s) — M100 인버터 내장 PID가 이 값을 기준으로 팬 속도 자동 조절
- `controllerId`: 대상 컨트롤러 ID (개별 설정)

### 6.6 게이트웨이 원격 설정 (Config)

> **MQTT config 토픽 기반** (260213 신규, 260227_v2 변경 없음)

```
POST /control/gateway/:gatewayId/config
🔒 인증 필요 | 역할: ADMIN
```

**Body**
```json
{
  "sensorIntervalMs": 5000,
  "mqttIntervalMs": 10000,
  "siteId": "site-001",
  "floorId": "1F",
  "gatewayId": "gw-002",
  "mqttBrokerUri": "mqtts://new-broker.example.com:8883",
  "wifiSsid": "NewNetwork",
  "wifiPassword": "newpass123",
  "reboot": false
}
```

| 필드 | 타입 | 필수 | 설명 | 재부팅 |
|------|------|------|------|--------|
| `sensorIntervalMs` | int | 선택 | 센서 폴링 주기 (ms, 1000~60000, 기본 5000) | 불필요 |
| `mqttIntervalMs` | int | 선택 | MQTT 발행 주기 (ms, 5000~60000, 기본 10000) | 불필요 |
| `siteId` | string | 선택 | 매장 ID 변경 | 필요 |
| `floorId` | string | 선택 | 층 ID 변경 | 필요 |
| `gatewayId` | string | 선택 | 게이트웨이 ID 변경 | 필요 |
| `mqttBrokerUri` | string | 선택 | MQTT 브로커 URI | 필요 |
| `wifiSsid` | string | 선택 | Wi-Fi SSID | 필요 |
| `wifiPassword` | string | 선택 | Wi-Fi 비밀번호 | 필요 |
| `reboot` | bool | 선택 | true 시 즉시 재부팅 | — |

**Response 200**
```json
{
  "success": true,
  "data": {
    "cmdId": "550e8400-e29b-41d4-a716-446655440002",
    "status": "SENT",
    "message": "설정 변경 명령이 전송되었습니다."
  }
}
```

**서버 내부 동작**:
1. REST API 수신 → UUID cmd_id 생성
2. MQTT 브릿지 → `metabeans/{site_id}/{floor_id}/gateway/{gw_id}/config` 발행
3. Gateway config/ack 수신 → DB 저장 + 프론트엔드 알림
4. `needs_reboot: true`인 경우 게이트웨이가 자동 재부팅 수행

**비즈니스 규칙**:
- 부분 업데이트(partial update) 지원: 포함된 필드만 변경
- 재부팅 필요 필드 변경 시 ACK 후 1초 대기 → 자동 재부팅
- `sensorIntervalMs`, `mqttIntervalMs`는 유효성 검증 실패 시 에러 반환

### 6.7 게이트웨이 설정 변경 결과 확인

```
GET /control/gateway-config/:cmdId/status
🔒 인증 필요 | 역할: ADMIN
```

**Response 200**
```json
{
  "success": true,
  "data": {
    "cmdId": "550e8400-e29b-41d4-a716-446655440002",
    "status": "SUCCESS",
    "result": "success",
    "reason": "",
    "needsReboot": true,
    "sentAt": "2026-02-13T09:30:00Z",
    "ackedAt": "2026-02-13T09:30:02Z"
  }
}
```

---

## 7. A/S 관리 (After-Service)

> **화면**: ESP_관리자_AS관리.html (4개 탭: 알림현황, 접수/신청, 처리현황, 완료보고서)

### 7.1 A/S 접수 신청

```
POST /as-service/requests
🔒 인증 필요 | 역할: ADMIN, OWNER
```

**Body** (multipart/form-data)
```json
{
  "storeId": 101,
  "equipmentId": 201,
  "urgency": "HIGH",
  "faultType": "NOISE",
  "symptom": "집진기 가동 시 비정상 소음 발생",
  "requestedVisitDate": "2026-02-15",
  "requestedVisitTime": "14:00",
  "contactName": "김점주",
  "contactPhone": "010-1234-5678",
  "attachments": ["(file1)", "(file2)"]
}
```

**urgency**: `HIGH`(긴급) \| `NORMAL`(일반)  
**faultType**: `NOISE`(소음) \| `POWER`(전원) \| `DUST`(먼지배출) \| `OIL`(오일누출) \| `SPARK`(스파크) \| `OTHER`(기타)

**Response 201**
```json
{
  "success": true,
  "data": {
    "requestId": 9001,
    "status": "PENDING",
    "assignedDealerId": 5,
    "assignedDealerName": "서울환경설비",
    "message": "A/S 접수가 완료되었습니다."
  }
}
```

**비즈니스 규칙**: 매장의 `dealer_id` 기반 자동 대리점 배정

### 7.2 A/S 요청 목록 조회

```
GET /as-service/requests
🔒 인증 필요 | 역할: ALL
```

**Query Parameters**
| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `status` | string | `PENDING` \| `ASSIGNED` \| `IN_PROGRESS` \| `COMPLETED` \| `CANCELLED` |
| `urgency` | string | `HIGH` \| `NORMAL` |
| `storeId` | number | 매장 필터 |
| `from`, `to` | string | 날짜 범위 |

### 7.3 A/S 요청 상세 조회

```
GET /as-service/requests/:requestId
🔒 인증 필요 | 역할: ALL
```

**Response 200**
```json
{
  "success": true,
  "data": {
    "requestId": 9001,
    "store": { "storeId": 101, "storeName": "김네식당 본점" },
    "equipment": { "equipmentId": 201, "equipmentName": "ESP-001" },
    "urgency": "HIGH",
    "faultType": "NOISE",
    "symptom": "집진기 가동 시 비정상 소음 발생",
    "requestedVisitDate": "2026-02-15",
    "requestedVisitTime": "14:00",
    "contactName": "김점주",
    "contactPhone": "010-1234-5678",
    "status": "IN_PROGRESS",
    "assignedDealer": { "dealerId": 5, "dealerName": "서울환경설비" },
    "attachments": [
      { "attachmentId": 1, "fileName": "photo1.jpg", "fileUrl": "/files/as/9001/photo1.jpg" }
    ],
    "report": null,
    "createdAt": "2026-02-13T10:00:00Z",
    "updatedAt": "2026-02-14T09:00:00Z"
  }
}
```

### 7.4 A/S 상태 변경 (대리점 접수/처리)

```
PATCH /as-service/requests/:requestId/status
🔒 인증 필요 | 역할: ADMIN, DEALER
```

**Body**
```json
{
  "status": "IN_PROGRESS",
  "memo": "현장 방문 예정"
}
```

### 7.5 A/S 완료 보고서 작성

```
POST /as-service/requests/:requestId/report
🔒 인증 필요 | 역할: ADMIN, DEALER
```

**Body** (multipart/form-data)
```json
{
  "visitDate": "2026-02-15",
  "repairType": "REPAIR",
  "repairDetail": "팬 모터 베어링 교체, 진동 제거 확인",
  "replacedParts": [
    { "partName": "팬 모터 베어링", "unitPrice": 25000, "quantity": 2 }
  ],
  "totalPartsCost": 50000,
  "laborCost": 80000,
  "totalCost": 130000,
  "result": "COMPLETED",
  "remarks": "3개월 후 재점검 권장",
  "attachments": ["(before_photo)", "(after_photo)"]
}
```

**비즈니스 규칙** (피드백 p.56, p.59):
- `replacedParts` — 교체 부품 상세 (품명/가격/수량) 필수
- `totalPartsCost` — 이전 `cost` 필드에서 변경 (피드백 p.59)
- 보고서 작성 시 자동으로 요청 상태 `COMPLETED`로 변경

### 7.6 A/S 완료 보고서 조회

```
GET /as-service/requests/:requestId/report
🔒 인증 필요 | 역할: ALL
```

### 7.7 알림 현황 (A/S 관련 알람 이벤트)

```
GET /as-service/alerts
🔒 인증 필요 | 역할: ALL
```

**Query Parameters**
| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `severity` | string | `WARNING` \| `CRITICAL` |
| `isResolved` | boolean | 해결 여부 |
| `storeId` | number | 매장 필터 |

---

## 8. 고객 현황 (Customer)

> **화면**: ESP_관리자_고객현황.html (지도 + 목록 + 편집 팝업)

### 8.1 매장(고객) 목록 조회

```
GET /customers/stores
🔒 인증 필요 | 역할: ADMIN, DEALER, HQ
```

**Query Parameters**
| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `status` | string | `ACTIVE` \| `INACTIVE` \| `PENDING` |
| `region` | string | 지역 필터 (예: "서울", "경기") |
| `hqId` | number | 프랜차이즈 본사 필터 |
| `dealerId` | number | 대리점 필터 |
| `search` | string | 매장명, 주소 검색 |

**Response 200**
```json
{
  "success": true,
  "data": [
    {
      "storeId": 101,
      "siteId": "site-001",
      "storeName": "김네식당 본점",
      "brandName": "BBQ",
      "businessType": "튀김",
      "address": "서울시 강남구 역삼동 123-4",
      "latitude": 37.5012,
      "longitude": 127.0396,
      "ownerName": "김점주",
      "dealerName": "서울환경설비",
      "hqName": "비비큐 본사",
      "status": "ACTIVE",
      "equipmentCount": 2,
      "floorCount": 1,
      "createdAt": "2025-06-15T10:00:00Z"
    }
  ],
  "meta": { "page": 1, "pageSize": 20, "totalCount": 45, "totalPages": 3 }
}
```

### 8.2 매장(고객) 상세 조회

```
GET /customers/stores/:storeId
🔒 인증 필요 | 역할: ADMIN, DEALER, HQ
```

### 8.3 매장 정보 수정

```
PUT /customers/stores/:storeId
🔒 인증 필요 | 역할: ADMIN, DEALER(관할), OWNER(본인 — 수정만)
```

**Body**
```json
{
  "storeName": "김네식당 역삼점",
  "businessType": "튀김",
  "address": "서울시 강남구 역삼동 123-4",
  "latitude": 37.5012,
  "longitude": 127.0396,
  "contactName": "김점주",
  "contactPhone": "010-1234-5678",
  "dealerId": 5,
  "hqId": 3,
  "status": "ACTIVE"
}
```

**비즈니스 규칙**: HQ 소속 매장에는 `dealerId` 미할당 (hqId가 있으면 dealerId = null)

### 8.4 매장 등록 (신규)

```
POST /customers/stores
🔒 인증 필요 | 역할: ADMIN, DEALER, OWNER
```

### 8.5 매장 지도용 전체 좌표 조회

```
GET /customers/stores/map
🔒 인증 필요 | 역할: ADMIN, DEALER, HQ
```
- 지도 마커용 경량 데이터 (storeId, storeName, latitude, longitude, status)

### 8.6 매장 층(Floor) 관리

```
GET    /customers/stores/:storeId/floors
POST   /customers/stores/:storeId/floors
PUT    /customers/stores/:storeId/floors/:floorId
DELETE /customers/stores/:storeId/floors/:floorId
🔒 인증 필요 | 역할: ADMIN, DEALER
```

---

## 9. 시스템 관리 (System)

> **화면**: ESP_시스템관리.html (4개 탭: 권한관리, 가입승인, 사용자관리, 기준수치관리)  
> **ì—­í• **: ADMIN ì "ìš©

### 9.1 권한 관리

#### 9.1.1 역할별 권한 매트릭스 조회

```
GET /system/permissions
🔒 인증 필요 | 역할: ADMIN
```

**Response 200**
```json
{
  "success": true,
  "data": {
    "featureCodes": [
      {
        "featureCode": "DASHBOARD_STORE_COUNT",
        "featureName": "가맹점 수 조회",
        "category": "대시보드",
        "permissions": {
          "ADMIN": true,
          "DEALER": true,
          "HQ": true,
          "OWNER": false
        }
      },
      {
        "featureCode": "CONTROL_POWER",
        "featureName": "전원 제어",
        "category": "장비 제어",
        "permissions": {
          "ADMIN": true,
          "DEALER": "OVERRIDE",
          "HQ": "OVERRIDE",
          "OWNER": true
        }
      }
    ]
  }
}
```

#### 9.1.2 역할별 권한 수정

```
PUT /system/permissions
🔒 인증 필요 | 역할: ADMIN
```

**Body**
```json
{
  "changes": [
    { "role": "DEALER", "featureCode": "CONTROL_POWER", "isAllowed": true },
    { "role": "HQ", "featureCode": "CONTROL_FAN", "isAllowed": false }
  ]
}
```

#### 9.1.3 개별 사용자 권한 오버라이드

```
GET /system/permissions/overrides/:userId
POST /system/permissions/overrides/:userId
DELETE /system/permissions/overrides/:userId/:featureCode
🔒 인증 필요 | 역할: ADMIN
```

**POST Body**
```json
{
  "featureCode": "CONTROL_POWER",
  "isAllowed": true,
  "reason": "A/S 처리를 위한 임시 제어 권한 부여"
}
```

### 9.2 가입 승인 관리

#### 9.2.1 대기 중 가입 요청 목록

```
GET /system/approvals
🔒 인증 필요 | 역할: ADMIN
```

**Query Parameters**
| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `role` | string | ì—­í•  í•"í"° |
| `status` | string | `PENDING` (기본) \| `ALL` |

**Response 200**
```json
{
  "success": true,
  "data": [
    {
      "userId": 25,
      "loginId": "owner_kim",
      "name": "김점주",
      "role": "OWNER",
      "phone": "010-1234-5678",
      "businessName": "김네식당",
      "businessNumber": "123-45-67890",
      "accountStatus": "PENDING",
      "createdAt": "2026-02-12T14:00:00Z"
    }
  ]
}
```

#### 9.2.2 승인/거부 처리

```
PATCH /system/approvals/:userId
🔒 인증 필요 | 역할: ADMIN
```

**Body**
```json
{
  "action": "APPROVE",
  "reason": ""
}
```
- `action`: `APPROVE` → status를 `ACTIVE`로 변경 \| `REJECT` → status를 `DELETED`로 변경
- `REJECT` 시 `reason` 필수

### 9.3 사용자 관리

#### 9.3.1 사용자 목록 조회

```
GET /system/users
🔒 인증 필요 | 역할: ADMIN
```

**Query Parameters**
| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `role` | string | ì—­í•  í•"í"° |
| `accountStatus` | string | `ACTIVE` \| `SUSPENDED` \| `PENDING` \| `DELETED` |
| `search` | string | 이름, 아이디, 전화번호 검색 |

#### 9.3.2 사용자 상세 조회

```
GET /system/users/:userId
🔒 인증 필요 | 역할: ADMIN
```
- 기본정보 + 역할별 프로필(dealer_profiles/hq_profiles/owner_profiles) + 사업자정보 + 권한 오버라이드 목록 포함

#### 9.3.3 사용자 추가 (관리자가 직접)

```
POST /system/users
🔒 인증 필요 | 역할: ADMIN
```

#### 9.3.4 사용자 정보 수정

```
PUT /system/users/:userId
🔒 인증 필요 | 역할: ADMIN
```

#### 9.3.5 계정 상태 변경

```
PATCH /system/users/:userId/status
🔒 인증 필요 | 역할: ADMIN
```

**Body**
```json
{
  "accountStatus": "SUSPENDED",
  "reason": "장기 미사용"
}
```

#### 9.3.6 사용자 삭제

```
DELETE /system/users/:userId
🔒 인증 필요 | 역할: ADMIN
```
- Soft delete (`account_status` → `DELETED`)

### 9.4 기준 수치 관리

#### 9.4.1 청소 판단 기준값 조회/수정

```
GET /system/thresholds/cleaning
PUT /system/thresholds/cleaning
🔒 인증 필요 | 역할: ADMIN
```

**PUT Body**
```json
{
  "equipmentId": 201,
  "sparkThreshold": 30,
  "sparkTimeWindow": 60,
  "pressureBase": 200,
  "pressureRate": 1.5
}
```
- `sparkThreshold`: 스파크 기준값 (0-99)
- `sparkTimeWindow`: 스파크 기준 시간(분) 튜닝 변수 (피드백 p.66)
- `pressureBase`: 차압 기준값 (Pa)
- `pressureRate`: 차압 변화율 기준

#### 9.4.2 IAQ 상태 기준값 조회/수정

```
GET /system/thresholds/iaq
PUT /system/thresholds/iaq
🔒 인증 필요 | 역할: ADMIN
```

**PUT Body** — 5단계 기준
```json
{
  "thresholds": [
    {
      "metric": "pm2_5",
      "unit": "µg/m³",
      "levels": {
        "GOOD": { "min": 0, "max": 15 },
        "MODERATE": { "min": 15, "max": 35 },
        "BAD": { "min": 35, "max": 75 },
        "VERY_BAD": { "min": 75, "max": 150 },
        "HAZARDOUS": { "min": 150, "max": null }
      }
    }
  ]
}
```

#### 9.4.3 장비 모델 관리

```
GET    /system/equipment-models
POST   /system/equipment-models
PUT    /system/equipment-models/:modelId
DELETE /system/equipment-models/:modelId
🔒 인증 필요 | 역할: ADMIN
```

---

## 10. 게이트웨이 (Gateway)

### 10.1 게이트웨이 목록 조회

```
GET /gateways
🔒 인증 필요 | 역할: ALL (범위 자동 필터)
```

**Query Parameters**: `storeId`, `connectionStatus`

### 10.2 게이트웨이 상세 조회

```
GET /gateways/:gatewayId
🔒 인증 필요 | 역할: ALL
```

**Response 200**
```json
{
  "success": true,
  "data": {
    "gatewayId": 10,
    "gwDeviceId": "gw-001",
    "store": { "storeId": 101, "storeName": "김네식당 본점", "siteId": "site-001" },
    "floor": { "floorId": 1001, "floorCode": "1F", "floorName": "1층 주방" },
    "macAddress": "AA:BB:CC:DD:EE:FF",
    "firmwareVersion": "1.2.3",
    "controllerCount": 3,
    "statusFlags": 63,
    "statusDetails": {
      "sen55": true,
      "scd40": true,
      "o3Sensor": true,
      "coSensor": true,
      "hchoSensor": true,
      "controllerConnected": true,
      "pairingMode": false
    },
    "connectionStatus": "ONLINE",
    "lastSeenAt": "2026-02-13T09:30:00Z",
    "wifi": {
      "ssid": "MetaBeans_AP",
      "rssi": -62,
      "ip": "192.168.1.105",
      "mac": "AA:BB:CC:DD:EE:FF",
      "channel": 6
    }
  }
}
```

> **v1.2 신규**: `wifi` 객체 — status 메시지에서 수신한 게이트웨이 Wi-Fi 연결 정보를 캐시하여 반환합니다. 미연결 시 `rssi: 0, channel: 0`.

### 10.3 게이트웨이 등록

```
POST /gateways
🔒 인증 필요 | 역할: ADMIN, DEALER
```

### 10.4 게이트웨이 수정/삭제

```
PUT    /gateways/:gatewayId
DELETE /gateways/:gatewayId
🔒 인증 필요 | 역할: ADMIN, DEALER
```

---

## 11. 파일 업로드 (Files)

### 11.1 파일 업로드 (범용)

```
POST /files/upload
🔒 인증 필요 | 역할: ALL
Content-Type: multipart/form-data
```

**Body**
| 필드 | 타입 | 설명 |
|------|------|------|
| `file` | File | 업로드 파일 |
| `category` | string | `BUSINESS_CERT` \| `AS_REQUEST` \| `AS_REPORT` |

**Response 200**
```json
{
  "success": true,
  "data": {
    "fileId": "f-20260213-abc123",
    "fileName": "사업자등록증.jpg",
    "fileUrl": "/files/business-cert/f-20260213-abc123.jpg",
    "fileSize": 245000,
    "mimeType": "image/jpeg"
  }
}
```
- S3 업로드 후 URL 반환
- 이미지: 최대 10MB, 문서: 최대 20MB

### 11.2 파일 다운로드

```
GET /files/:fileId
🔒 인증 필요 | 역할: ALL (접근 권한 검증)
```

---

## 12. API 엔드포인트 요약표

### 화면 → API 매핑

| # | 화면 | 주요 API 엔드포인트 |
|---|------|------------------|
| 1 | 로그인 | `POST /auth/login`, `POST /auth/refresh`, `POST /auth/password-reset-request` |
| 2 | 매장점주 회원가입 | `POST /registration/owner`, `GET /auth/check-login-id`, `GET /registration/hq-list`, `GET /registration/dealer-list` |
| 3 | 매장본사 회원가입 | `POST /registration/hq`, `GET /auth/check-login-id` |
| 4 | 본사직원 회원가입 | `POST /registration/admin` |
| 5 | 대리점 회원가입 | `POST /registration/dealer`, `GET /auth/check-login-id` |
| 6 | 대시보드 | `GET /dashboard/summary`, `GET /dashboard/issues`, `GET /dashboard/alarms`, `GET /dashboard/iaq`, `GET /dashboard/outdoor-air`, `GET /dashboard/store-tree` |
| 7 | 장비관리 — 장비정보 | `GET /equipment`, `GET /equipment/:id`, `POST /equipment`, `PUT /equipment/:id`, `DELETE /equipment/:id` |
| 8 | 장비관리 — 실시간모니터링 | `GET /monitoring/equipment/:id/latest`, `GET /monitoring/equipment/:id/history`, `GET /monitoring/gateway/:id/iaq-history` |
| 9 | 장비관리 — ESG | `GET /monitoring/equipment/:id/esg` |
| 10 | 장비관리 — 장치제어 | `POST /control/command`, `GET /control/command/:id/status`, `GET /control/history`, `GET/PUT /control/equipment/:id/damper-auto-settings`, `GET/PUT /control/equipment/:id/fan-auto-settings` |
| 10-2 | 장비관리 — 게이트웨이 설정 | `POST /control/gateway/:id/config`, `GET /control/gateway-config/:id/status` |
| 11 | 장비관리 — 이력조회 | `GET /monitoring/equipment/:id/history-log` |
| 12 | A/S관리 — 알림현황 | `GET /as-service/alerts` |
| 13 | A/S관리 — 접수신청 | `POST /as-service/requests` |
| 14 | A/S관리 — 처리현황 | `GET /as-service/requests`, `GET /as-service/requests/:id`, `PATCH /as-service/requests/:id/status` |
| 15 | A/S관리 — 완료보고서 | `POST /as-service/requests/:id/report`, `GET /as-service/requests/:id/report` |
| 16 | 고객현황 | `GET /customers/stores`, `GET /customers/stores/map`, `GET/PUT /customers/stores/:id`, `POST /customers/stores` |
| 17 | 시스템관리 — 권한관리 | `GET/PUT /system/permissions`, `GET/POST/DELETE /system/permissions/overrides/:userId` |
| 18 | 시스템관리 — 가입승인 | `GET /system/approvals`, `PATCH /system/approvals/:userId` |
| 19 | 시스템관리 — 사용자관리 | `GET /system/users`, `GET/PUT/DELETE /system/users/:id`, `PATCH /system/users/:id/status` |
| 20 | 시스템관리 — 기준수치 | `GET/PUT /system/thresholds/cleaning`, `GET/PUT /system/thresholds/iaq`, `CRUD /system/equipment-models` |

### 전체 엔드포인트 수

| 도메인 | GET | POST | PUT | PATCH | DELETE | 합계 |
|--------|-----|------|-----|-------|--------|------|
| Auth | 2 | 4 | 1 | 0 | 0 | **7** |
| Registration | 3 | 4 | 0 | 0 | 0 | **7** |
| Dashboard | 6 | 0 | 0 | 0 | 0 | **6** |
| Equipment | 3 | 1 | 1 | 0 | 1 | **6** |
| Monitoring | 5 | 0 | 0 | 0 | 0 | **5** |
| Control | 5 | 2 | 2 | 0 | 0 | **9** |
| A/S Service | 4 | 2 | 0 | 1 | 0 | **7** |
| Customer | 5 | 2 | 2 | 0 | 1 | **10** |
| System | 8 | 4 | 4 | 2 | 3 | **21** |
| Gateway | 2 | 1 | 1 | 0 | 1 | **5** |
| Files | 1 | 1 | 0 | 0 | 0 | **2** |
| **합계** | **44** | **21** | **11** | **3** | **6** | **85** |

---

## 13. Mock 데이터 전략 (Phase 1)

### 13.1 Mock → API 전환 패턴

```typescript
// api/equipment.api.ts
import { useQuery } from '@tanstack/react-query';
import { mockGetEquipments } from './mock/equipment.mock';
// Phase 2: import { axiosGetEquipments } from './real/equipment.real';

export const useEquipments = (storeId: string) => {
  return useQuery({
    queryKey: ['equipments', storeId],
    queryFn: () => mockGetEquipments(storeId), // Phase 2: axiosGetEquipments
    staleTime: 30 * 1000,
  });
};
```

### 13.2 Mock 데이터 파일 구조

```
src/api/mock/
├── auth.mock.ts           # 로그인/토큰 Mock
├── dashboard.mock.ts      # 대시보드 요약/이슈/IAQ
├── equipment.mock.ts      # 장비 CRUD Mock
├── monitoring.mock.ts     # 센서 데이터/이력 Mock
├── control.mock.ts        # 제어 명령 Mock
├── as-service.mock.ts     # A/S 접수/처리/보고서 Mock
├── customer.mock.ts       # 고객 목록/편집 Mock
├── system.mock.ts         # 권한/승인/사용자/기준수치 Mock
└── common.mock.ts         # 공통 지연, 페이지네이션 헬퍼
```

### 13.3 Mock 센서 데이터 생성 규칙

Mock 데이터는 MQTT Payload 규격에 정확히 맞춰 생성:

```typescript
// mock/monitoring.mock.ts — 센서 값 범위
const SENSOR_RANGES = {
  pm2_5:         { min: 5,   max: 80,   decimals: 1 },
  pm10:          { min: 10,  max: 100,  decimals: 1 },
  diffPressure:  { min: 5,   max: 50,   decimals: 1 },
  oilLevel:      { values: [0, 1] },                     // v1.2: 0=정상, 1=만수 (int 이진값)
  ppTemp:        { min: 30,  max: 70,   decimals: 0 },  // 정수
  ppSpark:       { min: 0,   max: 9999, decimals: 0 },  // v1.2: 0-9999 (rev2.1 파워팩)
  ppPower:       { values: [0, 1] },                     // OFF/ON
  ppAlarm:       { values: [0, 1] },                     // 정상/알람
  fanSpeed:      { values: [0, 1, 2, 3] },               // OFF/LOW/MID/HIGH (수동 모드)
  fanMode:       { values: [0, 1] },                     // 0=수동, 1=자동
  fanRunning:    { values: [0, 1] },                     // v1.2 신규: 인버터 운전 상태
  fanFreq:       { min: 0,   max: 50,   decimals: 2 },  // v1.2 신규: Hz (0~50.00)
  fanTargetPct:  { min: 0,   max: 100,  decimals: 1 },  // v1.2 신규: % (자동 모드 시만 유의미)
  damperMode:    { values: [0, 1] },                     // 0=수동, 1=자동
  damperCtrl:    { min: 0,   max: 100,  decimals: 1 },  // v1.2 신규: 댐퍼 명령값 %
  flow:          { min: 300, max: 1200, decimals: 1 },  // CMH
  damper:        { min: 0,   max: 100,  decimals: 1 },  // % — Damper_FB 피드백값
  inletTemp:     { min: 15,  max: 50,   decimals: 1 },  // °C
  velocity:      { min: 2,   max: 15,   decimals: 1 },  // m/s
  ductDp:        { min: 50,  max: 500,  decimals: 1 },  // Pa
  statusFlags:   { default: 63 },                        // 0b111111 = 모두 정상
};
```

---

*본 문서는 MQTT Payload 규격_260227_v2.pdf, ESP 관리툴_최종피드백_260212.pdf, MetaBeans_ESP_데이터구조_정의서_v3_2.md, MetaBeans_ESP_프로젝트_아키텍처_기술스택_정의서.md를 근거로 작성되었습니다. 개발 진행에 따라 변경될 수 있습니다.*
