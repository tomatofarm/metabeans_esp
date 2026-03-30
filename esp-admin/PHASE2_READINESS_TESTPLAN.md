# ESP Admin — Phase 2(백엔드 연동) 준비도 Test Plan

백엔드 담당자에게 인수 전 **문서 대비 코드**를 단계별로 검증하기 위한 플랜입니다.  
한 번에 전수하지 않고 **TP-xx 단위**로 진행하면 됩니다.

## 참조 문서 (우선순위)

| 구분 | 경로 |
|------|------|
| 공통·레이아웃·Mock→API 패턴 | `docs/UI_00_공통기반.md`, `docs/MetaBeans_ESP_프로젝트_아키텍처_기술스택_정의서_최신.md`, `CLAUDE.md` |
| REST 엔드포인트 단일 기준 | `docs/MetaBeans_ESP_REST_API_엔드포인트_설계서__최신.md` |
| 요청/응답 필드·DB | `docs/MetaBeans_ESP_데이터구조_정의서__최신.md` |
| 화면별 UI 스펙 | `docs/UI_01_` … `UI_07_` |
| MQTT (프론트 직접 연결 X, 스키마 이해용) | `docs/MetaBeans_ESP_MQTT_통신_프로토콜_설계서__최신.md` |

## 프론트 API 레이어 규칙 (현재)

- `esp-admin/src/api/*.api.ts`: TanStack Query 훅 + `mutationFn`/`queryFn`
- `esp-admin/src/api/mock/*.mock.ts`: Mock 구현
- Phase 2: 같은 파일에서 `mockXxx` → `axiosXxx` 교체 (또는 `api/real/*` 분리). **페이지 컴포넌트는 queryKey·타입 유지를 전제로 최소 변경.**

## 알려진 준비 미비 (백엔드 팀과 합의 필요)

- **기능 단위 권한(`featureCode`) 미연동**: 권한 매트릭스 UI·Mock은 있으나, 라우팅/화면은 **역할(`UserRole`) 하드코딩** 위주. JWT에 `permissions[]` 포함 시 프론트 가드 추가 작업 필요.
- **일부 시스템 API**: 설계서의 `GET /system/permissions/overrides/:userId` 등은 문서에 있으나, UI에서 제거한 기능과 불일치할 수 있음 — 연동 시 엔드포인트/스펙 재확인 권장.

---

## TP-01 — 인증·회원가입·공통 응답

**참조**: REST `§1 인증`, `§2 회원가입`, `UI_01_로그인_회원가입.md`  
**코드**: `api/auth.api.ts`, `api/mock/auth.mock.ts`, `pages/auth/*`, `stores/authStore.ts`

| # | 검증 항목 | 기대 |
|---|-----------|------|
| 1.1 | `POST /auth/login` ↔ `login()` | 필드명·역할·토큰 저장 흐름이 `LoginResponse` 타입과 맞는지 |
| 1.2 | `POST /auth/logout` | 쿠키/스토어 초기화 (Phase 2에서 axios + withCredentials 등 합의) |
| 1.3 | `POST /auth/password-reset-request`, 암호 변경 | 훅 존재, ChangePasswordPage 연결 |
| 1.4 | `GET /auth/check-login-id` | `useCheckLoginId` enabled 조건 |
| 1.5 | `GET /registration/check-business-number`, `GET /registration/dealer-list` | 회원가입 폼과 연결 |
| 1.6 | `POST /registration/*` 4종 | Owner/HQ/Admin/Dealer 각 `register*` |
| 1.7 | 빌드·린트 | `npm run build` / `npm run lint` 통과 |

**완료 기준**: Mock 기준 시나리오(로그인·로그아웃·비밀번호 변경·4종 가입 플로우) UI 오류 없음 + 빌드 green.

---

## TP-02 — 대시보드

**참조**: REST `§3`, `UI_02_대시보드.md`  
**코드**: `api/dashboard.api.ts`, `api/mock/dashboard.mock.ts`, `pages/dashboard/*`, `hooks/useEquipmentTree.ts`

| # | 검증 항목 |
|---|-----------|
| 2.1 | summary / issues / alarms / iaq / outdoor-air / store-tree / stores/:id 매핑 |
| 2.2 | 역할별 대시보드 분기(`DashboardPage` → Admin/Dealer/HQ/Owner) |

### TP-02 결과 (코드·문서 대조)

| REST §3 | 프론트 훅·경로 | 상태 |
|---------|----------------|------|
| `GET /dashboard/summary` | `useDashboardSummary`, 역할용 `useRoleDashboardSummary` | ✅ Mock 연결. 타입 필드가 REST 샘플(`storeCount` 등)과 **다름** → Phase 2 어댑터 또는 타입 정렬 |
| `GET /dashboard/issues` | `useDashboardIssues`, `useRoleDashboardIssues` | ✅ 이슈 카테고리 구조는 UI 전용(`DashboardIssueCategory`). **issueType** 코드가 REST(`INLET_TEMP_HIGH` 등)와 **불일치** 가능 → 매핑 테이블 합의 |
| `GET /dashboard/alarms` | `useEmergencyAlarms`, `useRoleEmergencyAlarms` | ✅ |
| `GET /dashboard/iaq` | 없음 (IAQ는 `useStoreDashboard` → `StoreDashboard`에 포함) | ⚠️ 분리 엔드포인트 연동 시 훅 추가 |
| `GET /dashboard/outdoor-air` | 없음 (동일) | ⚠️ |
| `GET /dashboard/store-tree` | **`useEquipmentTree` → `common.mock` 정적 트리** | ⚠️ Phase 2에서 본 API로 교체 권장 |
| `GET /dashboard/stores/:storeId` | `useStoreDashboard` | ✅ |
| 장비 단위 대시보드 | `useEquipmentDashboard` | ⚠️ REST §3 단일 엔드포인트 없음 — 백엔드 합의 |

**2.2 역할 분기**: `DashboardPage.tsx` — `selectedStoreId` 시 `StoreDashboardPage`, 장비 선택 시 장비 모니터링으로 이동, 그 외 `ADMIN`/`DEALER`/`HQ`/`OWNER` 각 전용 페이지. ✅

**인수인계 정리**: `RoleDashboardSummary` 타입을 `types/dashboard.types.ts`로 이동(이전에는 mock에서 import). `dashboard.api.ts` 상단에 REST 매핑 주석 추가.

---

## TP-03 — 장비·모니터링·제어·이력

**참조**: REST `§4~§6`, `UI_03_*`, `UI_04_*`  
**코드**: `equipment.api.ts`, `monitoring.api.ts`, `control.api.ts`, `history.api.ts` + `mock/equipment|monitoring|control|history.mock.ts`

| # | 검증 항목 |
|---|-----------|
| 3.1 | §4 장비 CRUD·모델·등록 폼 옵션(매장/층/GW) 훅 매핑 |
| 3.2 | §5 모니터링 latest / history / iaq-history / history-log / esg |
| 3.3 | §6 제어 command·상태 폴링·이력·댐퍼·팬 자동·게이트웨이 config |
| 3.4 | 이력 탭: 센서·제어·알람·장비변경 (`history.api`) vs §5.2·§5.4 중복 범위 합의 |

### TP-03 결과 (REST ↔ 프론트)

**§4 장비**

| REST | 훅 | 상태 |
|------|-----|------|
| `GET /equipment` | `useEquipments` | ✅ 쿼리 파라미터·`authorizedStoreIds`(Mock) |
| `GET /equipment/:id` | `useEquipmentDetail` | ✅ |
| `POST /equipment` | `useCreateEquipment` | ✅ |
| `PUT /equipment/:id` | `useUpdateEquipment` | ✅ |
| `DELETE /equipment/:id` | `useDeleteEquipment` | ✅ |
| `GET /equipment/models` | `useEquipmentModels` | ✅ |
| (폼 옵션) | `useStoreOptions`, `useFloorOptions`, `useGatewayOptions`, `useDealerOptions` | ✅ Phase 2에서 별도 BFF 엔드포인트일 수 있음 — 응답 스키마만 맞추면 됨 |

**§5 모니터링**

| REST | 훅 | 상태 |
|------|-----|------|
| `GET /monitoring/equipment/:id/latest` | `useRealtimeSensorData` | ✅ `refetchInterval` ≈ 센서 주기 |
| `GET /monitoring/equipment/:id/history` | `useSensorHistory`, `useSensorHistoryRange` | ⚠️ 설계서는 `controllerId`, `metrics`, `from`, `to`, `interval` **필수** — Mock/간이 훅은 일부 생략. Phase 2에 쿼리 인자·타입 확장 |
| `GET /monitoring/gateway/:gatewayId/iaq-history` | 없음 | ❌ 훅 미구현 (필요 시 추가) |
| `GET /monitoring/equipment/:id/history-log` | 없음 | ❌ 통합 타임라인 UI가 이 엔드포인트 기준이면 훅 추가 |
| `GET /monitoring/equipment/:id/esg` | 없음 | ❌ ESG 화면이 Mock 전용이면 백엔드 연동 시 추가 |

**§6 제어**

| REST | 훅 | 상태 |
|------|-----|------|
| `POST /control/command` | `useSendControlCommand` | ✅ |
| `GET /control/command/:cmdId/status` | 없음 | ❌ ACK 폴링용 훅 미구현 |
| `GET /control/history` | `useControlHistory`, `useControlHistoryRange` | ⚠️ REST는 쿼리 스트링 다수 — Mock은 `equipmentId` 중심 |
| `GET/PUT .../damper-auto-settings` | 없음 (댐퍼 UI는 MQTT 명령 + `FanAutoSettings` 등만 사용) | ⚠️ 설계서 §6.4와 UI 정렬 필요. 시스템 `SystemThresholdTab`의 `damperAutoSettings`와 역할 구분 합의 |
| `GET/PUT .../fan-auto-settings` | `useFanAutoSettings`, `useUpdateFanAutoSettings` | ✅ |
| `POST /control/gateway/:id/config` | `useSendGatewayConfig` | ✅ |
| `GET /control/gateway-config/:cmdId/status` | 없음 | ❌ config ACK 확인 훅 미구현 |

**history.api.ts (이력 탭)**

| 용도 | 훅 | 비고 |
|------|-----|------|
| 센서 구간 | `useSensorHistoryRange` | §5.2와 기능 겹침 — 연동 시 단일 소스 정하기 |
| 제어 구간 | `useControlHistoryRange` | §6.3과 매핑 |
| 알람 | `useAlarmHistory` | DB `alarm_events` 등 |
| 장비 변경 | `useEquipmentChangeHistory` | §5.4 `history-log` type과 다를 수 있음 |

**인수인계**: `equipment|monitoring|control|history.api.ts` 파일 상단에 REST 절 매핑 주석 추가됨.

---

## TP-04 — A/S

**참조**: REST `§7`, `UI_05_AS관리.md`  
**코드**: `as-service.api.ts`, `api/mock/as-service.mock.ts`, `pages/as-service/*`

| # | 검증 항목 |
|---|-----------|
| 4.1 | §7.1~7.7 엔드포인트 ↔ 훅 1:1 |
| 4.2 | `multipart/form-data`(신청·보고서 첨부) Phase 2 연동 시 `FormData` 처리 |
| 4.3 | `useASStatusList`(`reportOnly` 등) = 동일 `GET /as-service/requests` + 쿼리로 흡수 가능한지 백엔드와 합의 |

### TP-04 결과 (REST ↔ 프론트)

| REST §7 | 훅 | 상태 |
|---------|-----|------|
| `POST /as-service/requests` | `useCreateASRequest` | ✅ Phase 2: `multipart`·파일 필드 |
| `GET /as-service/requests` | `useASRequests`, `useASStatusList` | ✅ 후자는 UI 탭용 필터(`reportOnly` 등). **동일 엔드포인트 + 쿼리**로 통합 가능 |
| `GET /as-service/requests/:requestId` | `useASDetail` | ✅ |
| `PATCH /as-service/requests/:requestId/status` | `useUpdateASStatus` | ✅ |
| (대리점 배정) | `useAssignDealer` | ⚠️ 설계서에 전용 경로 없음 — `PATCH .../status` body 확장 또는 별도 API **합의** |
| `POST .../report` | `useCreateASReport` | ✅ Phase 2: multipart |
| `GET .../report` | `useASReport` | ✅ |
| `GET /as-service/alerts` | `useASAlerts` | ✅ |
| (폼 옵션) | `useASStoreOptions`, `useASEquipmentOptions`, `useDealerOptions` | ✅ `GET /equipment`, `GET /customers/...` 등과 조합 가능 — 응답만 맞추면 됨 |

**인수인계**: `as-service.api.ts` 상단에 REST 매핑 주석 추가.

---

## TP-05 — 고객 현황

**참조**: REST `§8`, `UI_06_고객현황.md`  
**코드**: `customer.api.ts`, `pages/customer/*`

| # | 검증 항목 |
|---|-----------|
| 5.1 | §8.1~8.5 목록·상세·수정·지도 |
| 5.2 | §8.4 신규 매장 등록, §8.6 층 관리 API 유무 |

### TP-05 결과 (REST ↔ 프론트)

| REST §8 | 훅 | 상태 |
|---------|-----|------|
| `GET /customers/stores` | `useCustomerList` | ✅ 쿼리 파라미터·페이지는 `CustomerListParams` |
| `GET /customers/stores/:storeId` | `useCustomerDetail` | ✅ |
| `PUT /customers/stores/:storeId` | `useUpdateCustomer` | ✅ (모달에서 점주/장비 목록 제거된 현재 UI 기준) |
| `GET /customers/stores/map` | `useCustomerMapData` | ✅ |
| `POST /customers/stores` | 없음 | ❌ 신규 매장 등록 화면·훅 미구현 시 추가 |
| `GET/POST/PUT/DELETE .../floors` | 없음 | ❌ 층 CRUD 훅 미구현 (고객현황에서 미사용이면 백엔드만 준비 가능) |
| 대리점 드롭다운 | `useCustomerDealerOptions` | ⚠️ REST에 단일 경로 없을 수 있음 — `GET /registration/dealer-list` 등과 **동일 데이터**면 연동 시 통일 |

**인수인계**: `customer.api.ts` 상단에 REST 매핑 주석 추가.

---

## TP-06 — 시스템 관리

**참조**: REST `§9`, `UI_07_시스템관리.md`  
**코드**: `system.api.ts`, `pages/system/*`, `api/mock/system.mock.ts`

| # | 검증 항목 |
|---|-----------|
| 6.1 | §9.1 권한 매트릭스·오버라이드 API vs UI |
| 6.2 | §9.2 가입 승인 (비밀번호 재설정 요청은 설계서 §9 외 확장일 수 있음) |
| 6.3 | §9.3 사용자 CRUD·상태 |
| 6.4 | §9.4 기준수치·장비 모델 관리 |

### TP-06 결과 (REST ↔ 프론트)

| REST §9 | 훅 | 상태 |
|---------|-----|------|
| `GET/PUT /system/permissions` | `usePermissionMatrix`, `useUpdatePermissions` | ✅ 응답의 `featureCode` 문자열은 설계서 예시와 **프론트 타입(`dashboard.view` 등) 불일치** 가능 → 연동 시 스키마 통일 |
| `GET/POST/DELETE .../permissions/overrides...` | `useUserPermissionOverrides`, `useSaveUserPermissionOverride`, `useDeleteUserPermissionOverride` | ⚠️ **API 훅은 존재**. 사용자 편집 모달에서는 **오버라이드 UI 제거됨** — 백엔드 유지 여부 합의 |
| `GET /system/approvals` | `usePendingApprovals` | ✅ |
| `PATCH /system/approvals/:userId` | `useApproveUser`, `useRejectUser` | ✅ (Mock 시그니처는 REST body와 맞출 것) |
| (비밀번호 재설정 대기 목록) | `usePasswordResetRequests`, `useApprovePasswordReset` | ⚠️ REST §9 본문에 없음 — **별도 스펙**이면 문서에 추가 권장 |
| `GET /system/users` | `useSystemUsers` | ✅ |
| `GET /system/users/:userId` | `useSystemUserDetail` | ✅ |
| `POST /system/users` | 없음 | ❌ 훅 미구현 |
| `PUT /system/users/:userId` | `useUpdateSystemUser` | ✅ |
| `PATCH .../status`, `DELETE ...` | 없음 | ❌ 훅 미구현 |
| `GET/PUT` thresholds (`/cleaning`, `/iaq` 분리) | `useThresholdSettings`, `useUpdateThresholds` | ⚠️ Mock은 **단일 `ThresholdSettings`** — Phase 2에서 분리 엔드포인트 또는 병합 유지 합의 |
| `GET/POST/PUT/DELETE /system/equipment-models` | `useEquipmentModels`만 (`equipment.api`) | ⚠️ **조회만** — 모델 CRUD는 시스템 탭 또는 별도 화면 미구현 |

**인수인계**: `system.api.ts` 상단에 REST 매핑 주석 추가.

---

## TP-07 — 통합·비기능

| # | 검증 항목 |
|---|-----------|
| 7.1 | `AppRoutes.tsx` 역할 가드 vs REST `storeIds` 필터링 설명 일치 |
| 7.2 | Base URL·버전 prefix (`/api/v1`) 환경변수화 설계 |
| 7.3 | 에러 코드 `AUTH_TOKEN_EXPIRED` 등 공통 핸들러(토큰 갱신) 추가 여부 합의 |

### TP-07 결과

| 항목 | 현재 상태 | Phase 2 권장 |
|------|-----------|--------------|
| **7.1 라우트 가드** | `ProtectedRoute` — 미인증 → `/login`, `allowedRoles={['ADMIN']}` → 고객/시스템 외 접근 시 `/dashboard` | 서버는 JWT의 `role` + `storeIds`로 데이터 범위 제한. 프론트는 **역할 메뉴**(`roleHelper.ts`) + Mock의 `mockAccess`로 동일 의도 시뮬레이션. `featureCode` 가드는 미연동. |
| **7.2 Base URL** | Mock만 사용, **axios 인스턴스 미사용** | `VITE_API_BASE_URL`(예: `https://api.metabeans.co.kr/api/v1`) — `.env` 로컬 복사, `src/api/httpClient.ts`에서 사용(스캐폴드 추가됨). |
| **7.3 401 / 토큰** | `authStore.accessToken` 저장만, API 요청에 미부착 | `httpClient` 요청 인터셉터에 `Authorization: Bearer` 예시 포함. **Refresh 쿠키** 사용 시 `withCredentials: true` 및 CORS 합의. 응답 인터셉터에서 `AUTH_TOKEN_EXPIRED` 처리·재로그인은 추후 구현. |

**산출물**: `esp-admin/.env.example`, `esp-admin/src/api/httpClient.ts`(Phase 2에서 `api/real/*` 또는 `queryFn`이 이 인스턴스 사용).

---

## 진행 방법 (권장)

1. **TP-01**부터 순서대로: 이 문서 체크리스트를 복사해 Notion/이슈에 두고 항목 체크.
2. 각 TP 완료 시: **REST 설계서 엔드포인트 목록**과 `api/*.api.ts`의 함수/훅 이름을 1:1 대조해 누락 표기.
3. 누락·불일치 발견 시: 우선 REST 설계서·데이터구조 정의서 기준으로 이슈화 후 프론트 또는 백엔드 수정 합의.

---

## 실행 로그 (채움)

| TP | 날짜 | 담당 | 결과 / 비고 |
|----|------|------|-------------|
| TP-01 | 2026-03-27 | 에이전트 | `npm run build` 통과. `eslint.config.js`(flat) 추가 후 `npm run lint` 통과하도록 미사용 import·데드 코드 정리. |
| TP-02 | 2026-03-27 | 에이전트 | §3 대조표·갭 문서화. `RoleDashboardSummary` → `dashboard.types.ts`. `dashboard.api.ts` REST 매핑 주석. `npm run lint`·`npm run build` 통과 |
| TP-03 | 2026-03-27 | 에이전트 | §4~§6 대조표·갭 정리. API 파일 REST 매핑 주석. `npm run lint`·`build` 통과 |
| TP-04 | 2026-03-27 | 에이전트 | §7 대조표·갭 정리. `as-service.api.ts` REST 매핑 주석. `npm run lint`·`build` 통과 |
| TP-05 | 2026-03-27 | 에이전트 | §8 대조표·갭 정리. `customer.api.ts` REST 매핑 주석. `npm run lint`·`build` 통과 |
| TP-06 | 2026-03-27 | 에이전트 | §9 대조표·갭 정리. `system.api.ts` REST 매핑 주석. `npm run lint`·`build` 통과 |
| TP-07 | 2026-03-27 | 에이전트 | 통합·비기능 정리. `.env.example`, `api/httpClient.ts` 추가. `npm run lint`·`build` 통과 |
