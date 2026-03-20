# MetaBeans ESP — 프로젝트 용어·카테고리 사전

> **목적**: 수정/추가 요청 시 사용할 키워드와 해당 파일 매핑  
> 한 파일이 여러 카테고리에 속할 수 있음 (재사용 컴포넌트 등)  
> **경로 기준**: `esp-admin/src/` (예: `pages/auth/LoginPage.tsx` → `esp-admin/src/pages/auth/LoginPage.tsx`)


--- 노트

왼 쪽에 메뉴 -> 사이드바, 장비트리
위에 메뉴 -> 상단 메뉴

---

---

## 사용 방법

예: *"로그인 페이지에 비밀번호 표시/숨기기 토글 추가해줘"*  
→ `로그인 페이지` 카테고리 → `LoginPage.tsx` 수정

예: *"대시보드 이슈 패널 스타일 바꿔줘"*  
→ `대시보드` + `이슈 패널` → `IssuePanel.tsx` 수정

---

## 1. 로그인 페이지

**키워드**: `로그인`, `로그인 페이지`, `login`

| 파일 | 역할 |
|------|------|
| `pages/auth/LoginPage.tsx` | 로그인 폼, 좌우 분할 레이아웃 |
| `pages/auth/ForgotPasswordModal.tsx` | 비밀번호 찾기 모달 |
| `api/auth.api.ts` | login, logout API 훅 |
| `api/mock/auth.mock.ts` | 로그인 Mock (admin/admin123 등) |
| `stores/authStore.ts` | 로그인 상태, user, accessToken |
| `types/auth.types.ts` | LoginRequest, LoginUser, LoginResponse |

---

## 2. 비밀번호 찾기 / 변경

**키워드**: `비밀번호 찾기`, `비밀번호 변경`, `forgot password`, `change password`

| 파일 | 역할 |
|------|------|
| `pages/auth/ForgotPasswordPage.tsx` | 비밀번호 찾기 페이지 (현재 /login 리다이렉트) |
| `pages/auth/ForgotPasswordModal.tsx` | 비밀번호 찾기 모달 |
| `pages/auth/ChangePasswordPage.tsx` | 비밀번호 변경 폼 |
| `api/auth.api.ts` | passwordResetRequest, changePassword |

---

## 3. 회원가입

**키워드**: `회원가입`, `register`, `가입`

| 파일 | 역할 |
|------|------|
| `pages/auth/register/RegisterPage.tsx` | 회원가입 라우팅 컨테이너 |
| `pages/auth/register/RoleSelectPage.tsx` | 가입 유형 선택 (Owner/HQ/Admin/Dealer) |
| `pages/auth/register/OwnerRegisterPage.tsx` | 매장 점주 가입 |
| `pages/auth/register/HQRegisterPage.tsx` | 매장 본사 가입 |
| `pages/auth/register/AdminRegisterPage.tsx` | 본사 직원 가입 |
| `pages/auth/register/DealerRegisterPage.tsx` | 대리점 가입 |
| `pages/auth/register/RegisterCompletePage.tsx` | 가입 완료 페이지 |
| `components/common/StepIndicator.tsx` | 단계 표시 (1-2-3-4) |
| `api/auth.api.ts` | registerOwner, registerHQ 등 |
| `api/mock/auth.mock.ts` | 회원가입 Mock |

---

## 4. 대시보드

**키워드**: `대시보드`, `dashboard`

| 파일 | 역할 |
|------|------|
| `pages/dashboard/DashboardPage.tsx` | 대시보드 라우팅 (역할별 분기) |
| `pages/dashboard/AdminDashboardPage.tsx` | ADMIN 전체 현황 |
| `pages/dashboard/DealerDashboardPage.tsx` | DEALER 대시보드 |
| `pages/dashboard/HQDashboardPage.tsx` | HQ 대시보드 |
| `pages/dashboard/OwnerDashboardPage.tsx` | OWNER 대시보드 |
| `pages/dashboard/StoreDashboardPage.tsx` | 개별 매장 대시보드 |
| `pages/dashboard/EquipmentDashboardPage.tsx` | 개별 장비 대시보드 |
| `pages/dashboard/components/SummaryCards.tsx` | 상단 요약 카드 (매장/장비/A/S/긴급알람) |
| `pages/dashboard/components/IssuePanel.tsx` | 문제 발생 이슈 패널 (4개 카테고리) |
| `pages/dashboard/components/ASRequestPanel.tsx` | 미처리 A/S 목록 패널 |
| `pages/dashboard/components/EmergencyAlarmPanel.tsx` | 긴급 알람 패널 (헤더 벨 아이콘) |
| `pages/dashboard/components/EsgSummaryCard.tsx` | ESG 지표 카드 |
| `pages/dashboard/components/StoreMap.tsx` | 매장 지도 (Leaflet) |
| `api/dashboard.api.ts` | 대시보드 API 훅 |
| `api/mock/dashboard.mock.ts` | 대시보드 Mock |
| `types/dashboard.types.ts` | DashboardSummary, IssueItem 등 |

---

## 5. 장비관리 (전체)

**키워드**: `장비관리`, `장비`, `equipment`

| 파일 | 역할 |
|------|------|
| `pages/equipment/EquipmentPage.tsx` | 장비관리 탭 컨테이너 (정보/모니터링/제어/이력) |
| `api/equipment.api.ts` | 장비 CRUD, 옵션 API |
| `api/mock/equipment.mock.ts` | 장비 Mock |
| `types/equipment.types.ts` | Equipment, EquipmentDetail, StoreTreeNode 등 |
| `hooks/useEquipmentTree.ts` | 장비 트리 데이터 |
| `utils/roleHelper.ts` | 장비 등록 권한 (ADMIN, DEALER) |

---

## 6. 장비 정보

**키워드**: `장비 정보`, `장비정보`, `equipment info`

| 파일 | 역할 |
|------|------|
| `pages/equipment/EquipmentInfoPage.tsx` | 장비 기본정보, 파워팩 목록, 수정/삭제 |
| `pages/equipment/EquipmentEditPage.tsx` | 장비 수정 페이지 |
| `pages/equipment/EquipmentRegisterPage.tsx` | 장비 등록 페이지 |
| `pages/equipment/components/EquipmentSensorSummary.tsx` | 장비정보 탭 내 센서 현황 요약 |

---

## 7. 실시간 모니터링

**키워드**: `실시간 모니터링`, `모니터링`, `모니터`, `realtime`

| 파일 | 역할 |
|------|------|
| `pages/equipment/RealtimeMonitorPage.tsx` | 실시간 센서 데이터, 차트 |
| `pages/equipment/components/ControllerSensorCard.tsx` | 컨트롤러별 센서 카드 |
| `components/charts/BoardTempChart.tsx` | 보드 온도 라인 차트 |
| `components/charts/SparkChart.tsx` | 스파크 산점도 |
| `components/charts/TimeSeriesChart.tsx` | 시계열 차트 (확대/축소) |
| `api/monitoring.api.ts` | useRealtimeSensorData, useSensorHistory |
| `api/mock/monitoring.mock.ts` | 센서 Mock, generateMockSensorData |
| `types/sensor.types.ts` | ControllerSensorData, RealtimeMonitoringData |

---

## 8. 장치 제어

**키워드**: `장치 제어`, `제어`, `control`

| 파일 | 역할 |
|------|------|
| `pages/equipment/DeviceControlPage.tsx` | 제어 탭 컨테이너 (전원/댐퍼/팬) |
| `pages/equipment/ControlPowerPage.tsx` | 전원 ON/OFF/리셋 |
| `pages/equipment/ControlDamperPage.tsx` | 방화셔터(댐퍼) 8단계, 자동/수동 |
| `pages/equipment/ControlFanPage.tsx` | 송풍기(팬) OFF/LOW/MID/HIGH, 자동/수동 |
| `api/control.api.ts` | useSendControlCommand, useControlHistory |
| `api/mock/control.mock.ts` | 제어 Mock |
| `types/control.types.ts` | ControlTarget, SendControlRequest, POWERPACK_ACTIONS, DAMPER_ACTIONS, FAN_ACTIONS, DAMPER_STEPS |
| `components/common/ConfirmModal.tsx` | 제어 확인 모달 |

---

## 9. 이력 조회

**키워드**: `이력`, `이력 조회`, `history`

| 파일 | 역할 |
|------|------|
| `pages/equipment/HistoryPage.tsx` | 이력 탭 컨테이너 |
| `pages/equipment/history/SensorHistoryTab.tsx` | 센서 이력 |
| `pages/equipment/history/ControlHistoryTab.tsx` | 제어 이력 |
| `pages/equipment/history/AlarmHistoryTab.tsx` | 알람 이력 |
| `pages/equipment/history/EquipmentChangeHistoryTab.tsx` | 장비 변경 이력 |
| `api/history.api.ts` | useSensorHistoryRange, useControlHistoryRange 등 |
| `api/mock/history.mock.ts` | 이력 Mock |

---

## 10. A/S 관리

**키워드**: `A/S`, `AS`, `에이에스`

| 파일 | 역할 |
|------|------|
| `pages/as-service/ASServicePage.tsx` | A/S 탭 컨테이너 |
| `pages/as-service/ASAlertListPage.tsx` | 알림 현황 |
| `pages/as-service/ASRequestPage.tsx` | A/S 신청 |
| `pages/as-service/ASStatusPage.tsx` | 처리 현황 |
| `pages/as-service/ASDetailPage.tsx` | A/S 상세 |
| `pages/as-service/ASReportPage.tsx` | 완료 보고서 조회 |
| `pages/as-service/ASReportFormPage.tsx` | 보고서 작성 |
| `api/as-service.api.ts` | A/S API 훅 |
| `api/mock/as-service.mock.ts` | A/S Mock |
| `types/as-service.types.ts` | ASRequest, ASStatus, ASAlert 등 |

---

## 11. 고객현황

**키워드**: `고객`, `고객현황`, `customer`

| 파일 | 역할 |
|------|------|
| `pages/customer/CustomerPage.tsx` | 고객현황 컨테이너 |
| `pages/customer/CustomerListPage.tsx` | 고객 목록, 지도 뷰 |
| `pages/customer/CustomerEditModal.tsx` | 고객 수정 모달 |
| `api/customer.api.ts` | 고객 API |
| `api/mock/customer.mock.ts` | 고객 Mock |
| `types/customer.types.ts` | CustomerListItem, CustomerDetail, CustomerMapItem |

---

## 12. 시스템관리

**키워드**: `시스템`, `시스템관리`, `system`

| 파일 | 역할 |
|------|------|
| `pages/system/SystemPage.tsx` | 시스템 관리 탭 컨테이너 |
| `pages/system/SystemPermissionTab.tsx` | 권한 매트릭스 |
| `pages/system/SystemApprovalTab.tsx` | 가입 승인 |
| `pages/system/SystemUserTab.tsx` | 사용자 관리 |
| `pages/system/SystemThresholdTab.tsx` | 기준수치 관리 |
| `api/system.api.ts` | 시스템 API |
| `api/mock/system.mock.ts` | 시스템 Mock |
| `types/system.types.ts` | PermissionMatrix, FeatureCode, ThresholdSettings 등 |

---

## 13. 공통 레이아웃

**키워드**: `레이아웃`, `layout`, `헤더`, `사이드바`

| 파일 | 역할 |
|------|------|
| `components/layout/AppLayout.tsx` | 전체 레이아웃 (Header + Sidebar + main) |
| `components/layout/Header.tsx` | 상단 네비게이션, 메뉴, 알람, 사용자 |
| `components/layout/Sidebar.tsx` | 매장-장비-컨트롤러 트리 |
| `components/layout/RoleBadge.tsx` | 역할 배지 (ADMIN, DEALER 등) |

---

## 14. 공통 UI 컴포넌트

**키워드**: `공통 컴포넌트`, `StatusBadge`, `StatusTag`, `IAQ`, `센서 게이지`

| 파일 | 역할 |
|------|------|
| `components/common/StatusTag.tsx` | Green/Yellow/Red 상태 태그 |
| `components/common/StatusBadge.tsx` | success/warning/danger 배지 (pill) |
| `components/common/AirQualityCard.tsx` | IAQ 그리드 (PM2.5, CO2, 온습도 등) |
| `components/common/SensorGauge.tsx` | 센서 값 + 단위 + 상태 색상 |
| `components/common/ConfirmModal.tsx` | 확인 모달 (showConfirmModal) |
| `components/common/StepIndicator.tsx` | 단계 표시 (회원가입 등) |

---

## 15. 차트

**키워드**: `차트`, `chart`, `ECharts`

| 파일 | 역할 |
|------|------|
| `components/charts/BoardTempChart.tsx` | 보드 온도 라인 차트 |
| `components/charts/SparkChart.tsx` | 스파크 산점도 |
| `components/charts/TimeSeriesChart.tsx` | 범용 시계열 차트 (dataZoom) |

---

## 16. API 레이어

**키워드**: `API`, `api`

| 파일 | 역할 |
|------|------|
| `api/auth.api.ts` | 인증 |
| `api/dashboard.api.ts` | 대시보드 |
| `api/equipment.api.ts` | 장비 |
| `api/monitoring.api.ts` | 모니터링 |
| `api/control.api.ts` | 제어 |
| `api/history.api.ts` | 이력 |
| `api/as-service.api.ts` | A/S |
| `api/customer.api.ts` | 고객 |
| `api/system.api.ts` | 시스템 |

---

## 17. Mock 데이터

**키워드**: `Mock`, `mock`

| 파일 | 역할 |
|------|------|
| `api/mock/common.mock.ts` | mockStoreTree, mockUsers, STORE_ID_MAP |
| `api/mock/auth.mock.ts` | 로그인, 회원가입 Mock |
| `api/mock/dashboard.mock.ts` | 대시보드 Mock |
| `api/mock/equipment.mock.ts` | 장비 Mock |
| `api/mock/monitoring.mock.ts` | 센서 Mock, generateMockSensorData |
| `api/mock/control.mock.ts` | 제어 Mock |
| `api/mock/history.mock.ts` | 이력 Mock |
| `api/mock/as-service.mock.ts` | A/S Mock |
| `api/mock/customer.mock.ts` | 고객 Mock |
| `api/mock/system.mock.ts` | 시스템 Mock |

---

## 18. 타입 정의

**키워드**: `타입`, `types`

| 파일 | 역할 |
|------|------|
| `types/auth.types.ts` | UserRole, LoginUser, RegisterRequest 등 |
| `types/store.types.ts` | Store, StoreFloor, BusinessType |
| `types/equipment.types.ts` | Equipment, Controller, StoreTreeNode, AlarmEvent |
| `types/sensor.types.ts` | ControllerSensorData, GatewaySensorData, MqttSensorMessage |
| `types/control.types.ts` | ControlTarget, SendControlRequest, POWERPACK_ACTIONS, DAMPER_ACTIONS, FAN_ACTIONS, DAMPER_STEPS |
| `types/dashboard.types.ts` | DashboardSummary, DashboardIssueItem, EmergencyAlarm |
| `types/as-service.types.ts` | ASRequest, ASStatus, ASAlert, ASCreateRequest |
| `types/customer.types.ts` | CustomerListItem, CustomerDetail, CustomerMapItem |
| `types/system.types.ts` | FeatureCode, PermissionMatrix, ThresholdSettings |

---

## 19. 유틸리티

**키워드**: `유틸`, `utils`, `상수`, `포맷터`

| 파일 | 역할 |
|------|------|
| `utils/constants.ts` | STATUS_COLORS, IAQ_THRESHOLDS, SENSOR_RANGES, DAMPER_STEP_MAP |
| `utils/statusHelper.ts` | getConnectionStatus, getInletTempLevel, getBoardTempLevel 등 |
| `utils/roleHelper.ts` | roleMenuMap, hasMenuAccess, MENU_ITEMS |
| `utils/formatters.ts` | formatDateTime, formatDate, formatTemp, formatFlow 등 |

---

## 20. 스토어 (상태관리)

**키워드**: `스토어`, `store`, `zustand`

| 파일 | 역할 |
|------|------|
| `stores/authStore.ts` | 로그인 상태, user, accessToken, login, logout |
| `stores/uiStore.ts` | selectedStoreId, selectedEquipmentId, selectedControllerId |
| `stores/alertStore.ts` | 긴급 알람 목록, unreadCount |

---

## 21. 훅

**키워드**: `훅`, `hook`

| 파일 | 역할 |
|------|------|
| `hooks/useAuth.ts` | 인증 상태, login, logout |
| `hooks/useRole.ts` | isAdmin, isDealer, isOwner, checkMenuAccess |
| `hooks/useEquipmentTree.ts` | 장비 트리 데이터 |
| `hooks/useSensorData.ts` | 센서 데이터 (스켈레톤) |

---

## 22. 라우팅

**키워드**: `라우팅`, `라우트`, `route`

| 파일 | 역할 |
|------|------|
| `routes/AppRoutes.tsx` | 전체 라우트, ProtectedRoute, 역할별 대시보드 리다이렉트 |

---

## 23. 진입점 / 설정

**키워드**: `진입점`, `앱`, `설정`

| 파일 | 역할 |
|------|------|
| `main.tsx` | React 진입점 |
| `App.tsx` | QueryClient, ConfigProvider, Router |
| `index.css` | 전역 CSS, CSS 변수 |
| `vite.config.ts` | Vite 설정 |
| `tsconfig.json` | TypeScript 설정 |

---

## 24. 빠른 참조 — 키워드 → 카테고리

| 말하면 | 카테고리 |
|--------|----------|
| 로그인 | 1. 로그인 페이지 |
| 비밀번호 찾기/변경 | 2. 비밀번호 찾기/변경 |
| 회원가입 | 3. 회원가입 |
| 대시보드 | 4. 대시보드 |
| 장비관리 | 5. 장비관리 |
| 장비 정보 | 6. 장비 정보 |
| 모니터링 | 7. 실시간 모니터링 |
| 제어 | 8. 장치 제어 |
| 이력 | 9. 이력 조회 |
| A/S | 10. A/S 관리 |
| 고객 | 11. 고객현황 |
| 시스템 | 12. 시스템관리 |
| 헤더/사이드바 | 13. 공통 레이아웃 |
| StatusBadge, IAQ | 14. 공통 UI 컴포넌트 |
| 차트 | 15. 차트 |
| API | 16. API 레이어 |
| Mock | 17. Mock 데이터 |
| 타입 | 18. 타입 정의 |
| 유틸 | 19. 유틸리티 |
| 스토어 | 20. 스토어 |
| 훅 | 21. 훅 |
| 라우팅 | 22. 라우팅 |
| 역할/권한/점주/대리점/본사/관리자 | 26. 역할별 접근 요약 |

---

## 25. 세부 키워드 (예시)

| 말하면 | 해당 파일 |
|--------|--------|
| 이슈 패널 | IssuePanel.tsx |
| 긴급 알람 패널 | EmergencyAlarmPanel.tsx |
| 요약 카드 | SummaryCards.tsx |
| 매장 지도 | StoreMap.tsx |
| ESG 카드 | EsgSummaryCard.tsx |
| 전원 제어 | ControlPowerPage.tsx |
| 댐퍼 제어 | ControlDamperPage.tsx |
| 팬 제어 | ControlFanPage.tsx |
| 보드 온도 차트 | BoardTempChart.tsx |
| 스파크 차트 | SparkChart.tsx |
| 컨트롤러 센서 카드 | ControllerSensorCard.tsx |
| 장비 트리 | Sidebar.tsx (트리 구조) |
| 점주 대시보드 | OwnerDashboardPage.tsx |
| 대리점 대시보드 | DealerDashboardPage.tsx |
| 본사 대시보드 | HQDashboardPage.tsx |
| 관리자 대시보드 | AdminDashboardPage.tsx |
| 장치 제어 권한 | DeviceControlPage.tsx, EquipmentPage.tsx |

---

## 26. 역할별 접근 요약

**키워드**: `역할`, `ADMIN`, `DEALER`, `HQ`, `OWNER`, `점주`, `대리점`, `본사`, `관리자`, `권한`

역할에 따라 메뉴·기능 접근이 달라집니다. 역할 관련 수정 요청 시 아래 표를 참고하세요.

### 26.1 역할별 메뉴 접근

| 역할 | 메뉴 | 비고 |
|------|------|------|
| ADMIN (시스템 관리자) | 대시보드, 장비관리, A/S관리, **고객현황**, **시스템관리** | 전체 권한 |
| DEALER (대리점) | 대시보드, 장비관리, A/S관리 | 고객/시스템 접근 불가 |
| HQ (매장 본사) | 대시보드, 장비관리, A/S관리 | 모니터링 위주 |
| OWNER (매장 점주) | 대시보드, 장비관리, A/S관리 | 본인 매장만 |

**고객현황·시스템관리**: ADMIN 전용 (`utils/roleHelper.ts` → `isAdminOnlyMenu`)

### 26.2 대시보드 역할별 차이

| 구분 | ADMIN | DEALER | HQ | OWNER |
|------|-------|--------|-----|-------|
| 요약 카드 열 수 | 4열 (매장/장비/A/S/긴급알람) | 2열 (관할 매장, 장비) | 2열 (관할 매장, 장비) | 2열 (본인 매장, 장비) |
| 데이터 범위 | 전체 | 관할 매장 | 소속 매장 | 본인 매장 |
| ESG 카드 | 표시 | - | - | - |
| 대응 파일 | AdminDashboardPage | DealerDashboardPage | HQDashboardPage | OwnerDashboardPage |

### 26.3 장비관리 역할별 차이

| 기능 | ADMIN | DEALER | HQ | OWNER |
|------|-------|--------|-----|-------|
| 장비 등록 | O | O | X | X |
| 장비 수정 | O | O | X | X |
| 장치 제어 (전원/댐퍼/팬) | O | O | O | **X (403)** |
| 실시간 모니터링 | O | O | O | O |
| 이력 조회 | O | O | O | O |

**관련 파일**: `EquipmentPage.tsx` (canRegister), `DeviceControlPage.tsx` (isOwner 403), `EquipmentInfoPage.tsx` (canEdit)

### 26.4 A/S 관리 역할별 차이

| 기능 | ADMIN | DEALER | HQ | OWNER |
|------|-------|--------|-----|-------|
| A/S 신청 | O | X | X | O |
| A/S 접수/처리 | O | O | X | X |
| A/S 보고서 작성 | O | O | X | X |

**관련 파일**: `ASRequestPage.tsx` (신청), `ASStatusPage.tsx` (처리), `ASReportFormPage.tsx` (보고서)

### 26.5 역할별 키워드 → 파일 매핑

| 말하면 | 해당 파일 |
|--------|--------|
| 점주 대시보드 | OwnerDashboardPage.tsx |
| 대리점 대시보드 | DealerDashboardPage.tsx |
| 본사 대시보드 | HQDashboardPage.tsx |
| 관리자 대시보드 | AdminDashboardPage.tsx |
| 장치 제어 권한 | DeviceControlPage.tsx, EquipmentPage.tsx (canControl) |
| 장비 등록 권한 | EquipmentPage.tsx, EquipmentRegisterPage.tsx (canRegister) |
| 역할별 메뉴 | roleHelper.ts, AppRoutes.tsx, Header.tsx |

---

*이 문서는 `esp-admin` 폴더 기준으로 작성되었습니다. 수정 시 이 파일을 함께 업데이트하세요.*
