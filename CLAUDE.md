# MetaBeans ESP 관제시스템 관리툴

## 프로젝트 개요

음식점 주방 배기 장비(ESP 정전식 집진기)를 IoT 기반으로 원격 모니터링·제어하는 웹 관리 플랫폼.
약 200개 매장 대상, 4개 역할(ADMIN, DEALER, HQ, OWNER) 지원.

- **현재 Phase**: Phase 1 — 프론트엔드 목업 (Mock 데이터 기반)
- **산출물**: React 컴포넌트(.tsx), Mock 데이터, 공통 컴포넌트, 타입 정의
- **인수 대상**: 고블린게임즈 개발팀 (Phase 2에서 백엔드 연동)

## 기술 스택

| 구분 | 기술 | 버전 |
|------|------|------|
| 프레임워크 | React | 18.x |
| 빌드 | Vite | 5.x |
| 언어 | TypeScript | 5.x |
| 라우팅 | React Router | v6 |
| 상태관리 (클라이언트) | Zustand | 4.x |
| 상태관리 (서버) | TanStack Query | 5.x |
| UI 컴포넌트 | Ant Design | 5.x |
| 차트 | Apache ECharts + echarts-for-react | 5.x / 3.x |
| HTTP | Axios | 1.x |
| 날짜 | dayjs | 1.x |
| 지도 | Leaflet + react-leaflet | 4.x / 2.x |
| 아이콘 | @ant-design/icons | 5.x |

> Ant Design은 Table, Tree, Form, Steps, Tabs, DatePicker 등 관리툴에 최적화된 컴포넌트를 제공한다.
> ECharts는 마우스 스크롤 확대/축소(dataZoom), 실시간 스트리밍(appendData), 복합 차트를 네이티브 지원한다.

## 필수 참조 문서

**개발 전 반드시 해당 화면과 관련된 문서를 읽고 시작할 것.**

| 문서 | 경로 | 버전 | 용도 |
|------|------|------|------|
| 아키텍처/기술스택 정의서 | `docs/MetaBeans_ESP_프로젝트_아키텍처_기술스택_정의서_최신.md` | v1.1 | 전체 아키텍처, 폴더 구조, 기술 선택 근거, Mock→API 전환 패턴, 자동제어 동작 규칙 |
| 데이터구조 정의서 | `docs/MetaBeans_ESP_데이터구조_정의서_최신.md` | v3.2 | DB 스키마(테이블/컬럼), 엔티티 관계, MQTT 메시지 구조, 비즈니스 규칙 |
| REST API 설계서 | `docs/MetaBeans_ESP_REST_API_엔드포인트_설계서_최신.md` | v1.2 | 83개 API 엔드포인트 명세, 요청/응답 구조, 에러 코드 |
| MQTT 프로토콜 설계서 | `docs/MetaBeans_ESP_MQTT_통신_프로토콜_설계서_최신.md` | v2.1 | MQTT 토픽, 페이로드 파싱, 알람 판정, 30초 타임아웃, 제어 ACK, config 설정 |
| 최종 피드백 (PDF) | `docs/ESP_관리툴_최종피드백_260212.pdf` | - | UI 수정사항, 화면별 피드백 (최우선 반영) |
| MQTT Payload 규격 | `docs/MQTT_Payload_규격_260227_v2.pdf` | 260227_v2 | 최신 센서 필드(fan_running, fan_freq, fan_target_pct, damper_ctrl 추가), oil_level 타입 변경, pp_spark 범위 확대, status 토픽 wifi 추가 |
| MQTT 토픽 구조 변경 협의 | `docs/MQTT_토픽_구조_변경_및_협의_사항.pdf` | - | 시로코팬/댐퍼 자동제어 가능 확인, config 토픽 정의 |

## 시스템 아키텍처 개요

```
[CLIENT] React+Vite+TS (SPA)
    │ HTTPS (REST API)
    ▼
[SERVER] Node.js + Express + TypeScript
    ├── REST API (Auth, 장비, A/S, 시스템)
    ├── MQTT 브릿지 (mqtt.js → AWS IoT Core)
    │     ├── sensor 구독 → 파싱 → DB 저장
    │     ├── status 구독 → 게이트웨이 상태 갱신
    │     ├── control/ack 구독 → 제어 결과 업데이트
    │     ├── config/ack 구독 → 설정 변경 결과 업데이트
    │     └── 30초 타임아웃 감지 → 통신 오류 처리
    └── JWT 인증 (Access 15분 + Refresh 7일 HttpOnly Cookie)
    │
    ▼
[DATA] MySQL 8.0 (Amazon RDS) + AWS IoT Core (MQTT Broker)
    │
    ▼
[DEVICE] 파워팩(ESP32) → 게이트웨이(층별 1대) → AWS IoT Core
```

**데이터 흐름**:
- **Upstream** (센서→서버): 파워팩 → 게이트웨이 → MQTT(AWS IoT Core) → MQTT 브릿지 → MySQL + 인메모리 캐시
- **Downstream** (제어명령): 프론트엔드 → REST API → MQTT 브릿지 → AWS IoT Core → 게이트웨이 → 파워팩
- **Config** (설정변경): 프론트엔드 → REST API → MQTT 브릿지 → AWS IoT Core → 게이트웨이 ←config/ack

## 프로젝트 디렉토리 구조

```
esp-admin/
├── src/
│   ├── api/                        # API 호출 레이어
│   │   ├── mock/                   # Mock 데이터 및 핸들러
│   │   │   ├── auth.mock.ts
│   │   │   ├── dashboard.mock.ts
│   │   │   ├── equipment.mock.ts
│   │   │   ├── monitoring.mock.ts
│   │   │   ├── control.mock.ts
│   │   │   ├── as-service.mock.ts
│   │   │   ├── customer.mock.ts
│   │   │   ├── system.mock.ts
│   │   │   └── common.mock.ts
│   │   ├── auth.api.ts             # TanStack Query 훅 (Phase 2에서 queryFn만 교체)
│   │   ├── dashboard.api.ts
│   │   ├── equipment.api.ts
│   │   ├── monitoring.api.ts
│   │   ├── control.api.ts
│   │   ├── as-service.api.ts
│   │   ├── customer.api.ts
│   │   └── system.api.ts
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AppLayout.tsx       # 전체 레이아웃 (헤더 + 사이드바 + 콘텐츠)
│   │   │   ├── Header.tsx          # 상단 네비게이션 (5개 메뉴)
│   │   │   ├── Sidebar.tsx         # 좌측 매장-장비-컨트롤러 트리 (3단계 평탄화)
│   │   │   └── RoleBadge.tsx       # 역할 배지
│   │   ├── common/
│   │   │   ├── StatusTag.tsx       # Green/Yellow/Red 상태 태그
│   │   │   ├── StoreTree.tsx       # 매장>집진기>컨트롤러 트리 (Ant Design Tree)
│   │   │   ├── AirQualityCard.tsx  # IAQ 카드
│   │   │   ├── SensorGauge.tsx     # 센서 게이지
│   │   │   └── ConfirmModal.tsx    # 확인 모달
│   │   └── charts/
│   │       ├── BoardTempChart.tsx  # 보드온도 라인차트
│   │       ├── SparkChart.tsx      # 스파크 산점도
│   │       └── TimeSeriesChart.tsx # 범용 시계열 (확대/축소)
│   │
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useRole.ts              # 역할 기반 권한 체크
│   │   ├── useSensorData.ts
│   │   └── useEquipmentTree.ts
│   │
│   ├── pages/
│   │   ├── auth/                   # 로그인 + 회원가입 4종
│   │   │   ├── LoginPage.tsx
│   │   │   ├── ForgotPasswordPage.tsx
│   │   │   ├── ChangePasswordPage.tsx
│   │   │   └── register/           # Owner/HQ/Admin/Dealer + 완료 페이지
│   │   ├── dashboard/              # 대시보드 (역할별 4종 + 개별매장 + 장비별 + 긴급알람)
│   │   ├── equipment/              # 장비관리 (정보/수정/등록/모니터링/제어3종/이력/알림)
│   │   ├── as-service/             # A/S관리 (알림현황/신청/처리현황/상세/보고서/보고서입력)
│   │   ├── customer/               # 고객현황 (목록/수정)
│   │   └── system/                 # 시스템관리 (권한/승인/사용자/기준수치)
│   │
│   ├── stores/                     # Zustand 스토어
│   │   ├── authStore.ts            # 로그인 상태, JWT 토큰, 역할
│   │   ├── uiStore.ts              # 사이드바, 선택된 매장/장비/컨트롤러
│   │   └── alertStore.ts           # 긴급알람 상태
│   │
│   ├── types/                      # TypeScript 타입 정의
│   │   ├── auth.types.ts
│   │   ├── store.types.ts
│   │   ├── equipment.types.ts
│   │   ├── sensor.types.ts
│   │   ├── as-service.types.ts
│   │   ├── control.types.ts
│   │   └── system.types.ts
│   │
│   ├── utils/
│   │   ├── constants.ts            # 상태 색상, IAQ 범위, 제어 코드
│   │   ├── statusHelper.ts         # Green/Yellow/Red 판정 로직
│   │   ├── roleHelper.ts           # 역할별 메뉴/권한 헬퍼
│   │   └── formatters.ts           # 날짜, 숫자 포맷
│   │
│   ├── routes/
│   │   └── AppRoutes.tsx           # 전체 라우팅 (역할별 가드 포함)
│   │
│   ├── App.tsx
│   └── main.tsx
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## 사용자 역할 및 접근 범위

| 역할 | 코드 | 사용 환경 | 접근 범위 |
|------|------|----------|----------|
| 시스템 관리자 | `ADMIN` | PC | 전체 매장, 모든 기능 |
| 대리점 | `DEALER` | PC/태블릿 | 관할 매장(`stores.dealer_id`), 장비등록/A/S |
| 매장 본사 | `HQ` | PC | 소속 매장(`stores.hq_id`), 모니터링 위주 |
| 매장 점주 | `OWNER` | PC/태블릿 | 본인 매장(`stores.owner_id`), 제어/A/S신청 |

**역할별 메뉴 접근**:
```
ADMIN:  대시보드, 장비관리, A/S관리, 고객현황, 시스템관리
DEALER: 대시보드, 장비관리, A/S관리
HQ:     대시보드, 장비관리, A/S관리
OWNER:  대시보드, 장비관리, A/S관리
```

**고객현황/시스템관리는 ADMIN 전용**. DEALER/HQ/OWNER는 접근 불가.

**역할별 데이터 접근**:
- `ADMIN`: 전체 매장, 전체 사용자, 전체 A/S, 시스템 관리
- `DEALER`: 관할 매장, 장비 등록/수정/삭제, A/S 접수/처리
- `HQ`: 소속 매장 모니터링, 읽기 위주 접근
- `OWNER`: 본인 매장, 장비 제어, A/S 신청

## 장비 계층 구조 (MQTT 기준)

```
Site(매장) → Floor(층) → Gateway(게이트웨이, 층당 1대)
                              → Equipment(집진기, 최대 5대/층)
                                    → Controller(파워팩, 1~3대/집진기, 최대 4대)
```

| 계층 | 수량 제한 | ID 형식 | 예시 |
|------|---------|---------|------|
| Site | 무제한 (~200개 매장) | string | `"site-001"` |
| Floor | 매장당 N개 | string | `"1F"`, `"B1"` |
| Gateway | 층당 1대 | string | `"gw-001"` |
| Equipment | 게이트웨이당 최대 5대 | string | `"esp-001"` |
| Controller | 집진기당 1~3대 (최대 4) | string | `"ctrl-001"` |

- Gateway에 IAQ 센서 내장 (PM2.5, CO2, VOC, 온습도 등)
- Controller = 파워팩 (powerpacks 테이블은 v3.0에서 삭제, controller로 통합)
- ID는 펌웨어 설정값을 MQTT에서 그대로 사용 (별도 매칭 불필요)

## 핵심 설계 규칙

### 상태 색상 체계 (Green/Yellow/Red)

```typescript
const STATUS_COLORS = {
  GOOD:    { color: '#52c41a', label: '정상',  level: 'green'  },
  WARNING: { color: '#faad14', label: '주의',  level: 'yellow' },
  DANGER:  { color: '#ff4d4f', label: '위험',  level: 'red'    },
} as const;
```

### 상태 전파 규칙 (피드백 p.27)

하위 항목 중 가장 높은 위험도가 상위로 전파:
- Controller(파워팩) 상태 → Equipment(장비) 상태 → Site(매장) 상태
- 하위에 Yellow + Red → 상위는 Red
- 하위에 Green + Yellow → 상위는 Yellow
- 모두 Green → Green

### 사이드바 트리 구조 (UI)

데이터 계층은 Site→Floor→Gateway→Equipment→Controller 5단계이지만, 사이드바 트리 UI는 **업체명 > 집진기 > 컨트롤러** 3단계로 평탄화하여 표시 (Floor, Gateway는 내부적으로 순회하되 UI에 노출하지 않음).

- **장비(Equipment) 클릭**: `selectEquipment(id)` → 장비관리 페이지로 이동 (현재 탭 유지)
- **컨트롤러 클릭**: `selectEquipment(parentId)` + `selectController(id)` → 장비관리 페이지로 이동 (현재 탭 유지)
- **컨트롤러 선택 시 데이터 필터링**: 장비정보, 실시간모니터링, 장치제어(전원/댐퍼/팬) 페이지에서 선택된 컨트롤러의 데이터만 표시. 이력조회는 전체 컨트롤러 데이터를 표시
- **탭 유지**: 장비/컨트롤러 전환 시 현재 선택된 탭(장비정보/모니터링/제어/이력)이 유지됨

### 대시보드 이슈 항목 (피드백 p.33~34)

**문제 발생 이슈** (주의+위험 모두 표시):
1. 통신 연결 상태 점검 — Yellow: 끊김 1시간 이상, Red: 끊김 하루 이상
2. 유입 온도 이상 — Yellow: 70°C 이상, Red: 100°C 이상
3. 필터 청소 상태 점검 — Yellow: 점검 필요
4. 먼지제거 성능 점검 — Red: 점검 필요

**긴급 알람** (Red만, 이메일 발송): 통신 끊김 하루 이상, 유입 온도 100°C 이상

> ※ 실내공기질 정보는 이슈/알림에 표시하지 않음
> ※ 시스템 상태 항목은 삭제됨 (피드백 반영)

### 실시간 모니터링 표시 항목 (피드백 p.38~39)

장비(ESP)별 데이터로 표시:
- **연결 상태**: 연결(Green)/끊김(Red) — 30초 미수신 시 통신 오류
- **전원 상태**: ON(Green)/OFF(Red)
- **보드 온도**: 정상(Green)/주의(Yellow)/위험(Red)
- **스파크**: 정상(Green)/주의(Yellow)/위험(Red)
- **PM2.5, PM10**: 먼지 제거 성능 표시 — 좋음(Green)/보통(Yellow)/점검 필요(Red)
- **필터 점검 상태**: 정상(Green)/점검 필요(Yellow) + 차압 수치 표시
- **풍속/풍량/압력**: 수치만 표시 (상태 색상 없음)
- **유입 온도**: 정상(Green)/주의(Yellow, 70°C↑)/위험(Red, 100°C↑)
- 순서: 유입온도 → 풍량 → 풍속 → 압력
- **폐유 수집량**: 유증기 포집량 × 2 (임시 랜덤 데이터)

**필터 점검 상태 변경 알림 메시지** (정상→점검 필요 전환 시):
> "필터 점검 필요: 스파크 발생 부위 및 필터 오염 상태를 확인하십시오. 오염 확인 시 필터 세척과 장비 내부 청소가 필요합니다."

### Mock → API 전환 패턴

```typescript
// api/equipment.api.ts
import { useQuery } from '@tanstack/react-query';
import { mockGetEquipments } from './mock/equipment.mock';
// Phase 2: import { axiosGetEquipments } from './real/equipment.real';

export const useEquipments = (storeId: string) => {
  return useQuery({
    queryKey: ['equipments', storeId],
    queryFn: () => mockGetEquipments(storeId),  // Phase 2: axiosGetEquipments
    staleTime: 30 * 1000,
  });
};
```

> 핵심: `queryFn`만 교체하면 컴포넌트 코드 변경 없이 실제 API 연동 완료.

### 역할별 라우팅

```typescript
const roleMenuMap = {
  ADMIN:  ['dashboard', 'equipment', 'as-service', 'customer', 'system'],
  DEALER: ['dashboard', 'equipment', 'as-service'],
  HQ:     ['dashboard', 'equipment', 'as-service'],
  OWNER:  ['dashboard', 'equipment', 'as-service'],
};

// ProtectedRoute로 역할별 접근 제어
<Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
  <Route path="/system/*" element={<SystemPages />} />
</Route>
```

## MQTT 통신 규격 요약 (v2.0)

| 항목 | 규격 |
|------|------|
| 프로토콜 | MQTT v3.1.1 (AWS IoT Core) |
| QoS | 1 (모든 토픽) |
| Retain | 0 (비활성) |
| 센서 데이터 주기 | **10초** (sensor + status 동시 발행) |
| 통신 오류 판정 | **30초** 미수신 시 OFFLINE (Red) |
| 타임스탬프 | Unix epoch (초), 서버 UTC 저장, 클라이언트 로컬 변환 |
| 페이로드 인코딩 | UTF-8 JSON |
| 최대 페이로드 | ~6KB (실측) |

**토픽 구조**:
```
metabeans/{site_id}/{floor_id}/gateway/{gw_id}/
├── sensor          # 통합 센서 데이터 (10초, GW→Cloud)
├── status          # GW 상태 (10초, GW→Cloud)
├── control         # 제어 명령 (Cloud→GW)
├── control/ack     # 제어 응답 (GW→Cloud)
├── config          # 원격 설정 변경 (Cloud→GW)
└── config/ack      # 설정 변경 응답 (GW→Cloud)
```

**sensor 메시지**: Gateway IAQ + 하위 equipment/controller 전체를 하나로 통합 발행.

### status 토픽 페이로드 (게이트웨이 상태)

| 필드 | 타입 | 설명 |
|------|------|------|
| gateway_id | string | 게이트웨이 ID |
| status_flags | int | 상태 플래그 (7비트 비트마스크, 아래 참조) |
| controller_count | int | 현재 연결된 컨트롤러 수 |
| wifi | object | Wi-Fi 연결 정보 — **v3.2 신규** |
| timestamp | int | 발행 시간 (Unix epoch, 초) |

**wifi 객체 필드** (status 토픽 내, v3.2 신규):

| 필드 | 타입 | 설명 |
|------|------|------|
| ssid | string | 연결된 AP의 SSID (미연결 시 누락될 수 있음) |
| rssi | int | 신호 강도 (dBm, 통상 -30 ~ -90, 미연결 시 0) |
| ip | string | 게이트웨이 IP 주소 (미연결 시 누락될 수 있음) |
| mac | string | 게이트웨이 MAC 주소 (AA:BB:CC:DD:EE:FF 형식) |
| channel | int | Wi-Fi 채널 (1-14, 미연결 시 0) |

> Wi-Fi 미연결 시: `rssi=0`, `channel=0`, `ssid`·`ip` 필드는 누락될 수 있음.

### 제어 명령 규격 (control 토픽)

**target=0 (파워팩)**:

| action | value | 설명 |
|--------|-------|------|
| 0 | - | 파워팩 OFF |
| 1 | - | 파워팩 ON |
| 2 | - | 파워팩 리셋 |

**target=1 (댐퍼, flo-OAC)**:

| action | value | 설명 |
|--------|-------|------|
| 1 | 0-100 (int) | 수동 모드 개도율 설정 (%) |
| 2 | 0 또는 1 (int) | 제어 모드 전환 (0=수동, 1=자동) |
| 3 | float (CMH) | 목표 풍량 설정 (자동 모드, 예: 850.0) |

**target=2 (시로코팬)**:

| action | value | 설명 |
|--------|-------|------|
| 0 | - | 팬 OFF (수동) |
| 1 | - | 팬 LOW (수동, 15Hz) |
| 2 | - | 팬 MID (수동, 30Hz) |
| 3 | - | 팬 HIGH (수동, 50Hz) |
| 4 | 0 또는 1 (int) | 제어 모드 전환 (0=수동, 1=자동) |
| 5 | float (m/s) | 목표 풍속 설정 (자동 모드, 예: 3.5) |

> **value 타입**: int 또는 float (`number`). 목표 풍량/풍속은 float.

**일괄 제어 범위 지정**:

| equipment_id | controller_id | 범위 |
|-------------|---------------|------|
| "all" | "all" | 게이트웨이 하위 전체 컨트롤러 |
| "esp-001" | "all" | 해당 집진기 하위 컨트롤러만 |
| "esp-001" | "ctrl-001" | 특정 컨트롤러 지정 |

### 자동 제어 동작 규칙

**댐퍼 자동 제어 (flo-OAC)**:
- flo-OAC 하드웨어 자체 PID로 댐퍼 개도 조절
- 서버에서 목표 풍량(CMH) 설정 → 펌웨어가 flo-OAC Internal SV 모드 전환 → 자동 개도 조절

**시로코팬 자동 제어 (M100 인버터)**:
- M100 인버터 내장 PID 활용
- 서버에서 목표 풍속(m/s) 설정 → 펌웨어가 M100 PID 기준값 레지스터(AP.19)에 기록
- 실측 풍속(flo-OAC V_act)을 PID 피드백 레지스터(AP.18)에 주기적 전달 → 인버터 자동 가/감속

**자동 → 수동 전환**:
- 모드 전환 명령(댐퍼 action=2/value=0, 팬 action=4/value=0) 또는 수동 명령 수신 시 자동 해제

**안전 오버라이드**:
- 비상정지(ESTOP), 스파크 감지, 과온도 알람 → 컨트롤러가 자동으로 팬/댐퍼 자동 모드 해제(수동 전환)
- 센서 데이터의 `fan_mode`, `damper_mode` 필드가 0으로 변경되어 대시보드에서 확인 가능

### config 명령 규격 (config 토픽)

부분 업데이트(partial update) 지원: 포함된 필드만 변경.

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| cmd_id | string | 필수 | 명령 ID (UUID, config/ack 매칭용) |
| site_id | string | 선택 | 매장 ID 변경 (NVS 저장, 재부팅 필요) |
| floor_id | string | 선택 | 층 ID 변경 (NVS 저장, 재부팅 필요) |
| gateway_id | string | 선택 | GW ID 변경 (NVS 저장, 재부팅 필요) |
| sensor_interval_ms | int | 선택 | 센서 폴링 주기 (1000~60000ms, 기본 5000) |
| mqtt_interval_ms | int | 선택 | MQTT 발행 주기 (5000~60000ms, 기본 10000) |
| mqtt_broker_uri | string | 선택 | MQTT 브로커 URI (NVS 저장, 재부팅 필요) |
| wifi_ssid | string | 선택 | Wi-Fi SSID (NVS 저장, 재부팅 필요) |
| wifi_password | string | 선택 | Wi-Fi 비밀번호 (NVS 저장, 재부팅 필요) |
| reboot | bool | 선택 | true 시 즉시 재부팅 |

- **즉시 적용**: `sensor_interval_ms`, `mqtt_interval_ms`
- **NVS 저장 + 재부팅 필요**: ID, 브로커 URI, Wi-Fi 설정
- 재부팅 필요 필드 변경 시 → NVS 저장 → config/ack(`needs_reboot: true`) → 1초 대기 → 자동 재부팅

**config/ack 응답**: `{ cmd_id, result, reason, needs_reboot }`

### 센서 데이터 필드 (controller)

| 필드 | 타입 | 단위 | 설명 |
|------|------|------|------|
| controller_id | string | - | 컨트롤러 ID |
| timestamp | int | epoch초 | 마지막 수신 시간 |
| pm2_5 | float | µg/m³ | 배출부 PM2.5 |
| pm10 | float | µg/m³ | 배출부 PM10 |
| diff_pressure | float | Pa | ESP 집진부 차압 |
| oil_level | int | - | 오일 만수 감지 (0=정상, 1=만수) — **v3.2: float→int 타입 변경** |
| pp_temp | int | °C | 파워팩 온도 (정수) |
| pp_spark | int | - | 스파크 수치 (0-9999, rev2.1 이전 0-99) — **v3.2: 범위 확대** |
| pp_power | int | - | 전원 상태 (0=OFF, 1=ON) |
| pp_alarm | int | - | 파워팩 알람 (0=정상, 1=알람) |
| fan_speed | int | - | 팬 속도 (0=OFF, 1=LOW, 2=MID, 3=HIGH), **수동 모드에서만 유의미** |
| fan_mode | int | - | 팬 제어 모드 (0=수동, 1=자동) |
| fan_running | int | - | 인버터 실제 운전 상태 (0=정지, 1=운전중) — **v3.2 신규** |
| fan_freq | float | Hz | M100 인버터 실제 출력 주파수 (0~50.00Hz) — **v3.2 신규** |
| fan_target_pct | float | % | PID 목표값 (0.0~100.0%), fan_mode=1 자동일 때만 유의미 — **v3.2 신규** |
| damper_mode | int | - | 댐퍼 제어 모드 (0=수동, 1=자동) |
| flow | float | CMH | 풍량 (flo-OAC Q_act) |
| damper_ctrl | float | % | 댐퍼 제어 명령값 (flo-OAC Damper_CTRL, 0-100) — **v3.2 신규** |
| damper | float | % | 댐퍼 개도율 피드백 (flo-OAC Damper_FB, 0-100) |
| inlet_temp | float | °C | 유입 온도 (flo-OAC T_act, -20~50) |
| velocity | float | m/s | 현재 풍속 (flo-OAC V_act, 0~20.0) |
| duct_dp | float | Pa | 덕트 차압 (flo-OAC DP_Pv, -49~980) |
| status_flags | int | - | 상태 플래그 (6비트 비트마스크) |

**status_flags 비트 정의 (Controller)**:
- bit 0: 파워팩 RS-485 통신 정상
- bit 1: SPS30 (PM2.5) 센서 정상
- bit 2: SDP810 (차압) 센서 정상
- bit 3: 수위 센서 정상
- bit 4: flo-OAC 댐퍼 컨트롤러 정상
- bit 5: LS M100 인버터 정상 (RS-485 통신 정상 **AND** Fault Trip 없음) — **v3.2: 복합 판정으로 변경**

**status_flags 비트 정의 (Gateway, 7비트)**:
- bit 0: SEN55 정상 (PM, 온습도, VOC, NOx)
- bit 1: SCD40 정상 (CO2)
- bit 2: O3 센서 정상
- bit 3: CO 센서 정상
- bit 4: HCHO 센서 정상
- bit 5: 1개 이상 컨트롤러 연결됨
- bit 6: 페어링 모드

### Mock 센서 데이터 범위

```typescript
const SENSOR_RANGES = {
  pm2_5:         { min: 5,   max: 80,   decimals: 1 },
  pm10:          { min: 10,  max: 100,  decimals: 1 },
  diffPressure:  { min: 5,   max: 50,   decimals: 1 },
  oilLevel:      { values: [0, 1] },              // v3.2: 0=정상, 1=만수 (float→int 변경)
  ppTemp:        { min: 30,  max: 70,   decimals: 0 },
  ppSpark:       { min: 0,   max: 9999, decimals: 0 },  // v3.2: 0-99→0-9999 (rev2.1 대응)
  ppPower:       { values: [0, 1] },
  ppAlarm:       { values: [0, 1] },
  fanSpeed:      { values: [0, 1, 2, 3] },   // 수동 모드
  fanMode:       { values: [0, 1] },           // 0=수동, 1=자동
  fanRunning:    { values: [0, 1] },           // v3.2 신규: 0=정지, 1=운전중
  fanFreq:       { min: 0,   max: 50,   decimals: 2 },  // v3.2 신규: Hz (0~50.00)
  fanTargetPct:  { min: 0,   max: 100,  decimals: 1 },  // v3.2 신규: % (자동 모드에서만 유의미)
  damperMode:    { values: [0, 1] },           // 0=수동, 1=자동
  flow:          { min: 300, max: 1200, decimals: 1 },
  damperCtrl:    { min: 0,   max: 100,  decimals: 1 },  // v3.2 신규: 댐퍼 명령값 (damper는 피드백값)
  damper:        { min: 0,   max: 100,  decimals: 1 },
  inletTemp:     { min: 15,  max: 50,   decimals: 1 },
  velocity:      { min: 2,   max: 15,   decimals: 1 },
  ductDp:        { min: 50,  max: 500,  decimals: 1 },
  statusFlags:   { default: 63 },   // 0b111111 = 모두 정상
};
```

## REST API 규격 요약 (v1.1)

- **Base URL**: `https://api.metabeans.co.kr/api/v1` (Dev: `localhost:3000/api/v1`)
- **인증**: JWT Access Token (15분) + Refresh Token (7일, HttpOnly Cookie)
- **JWT Payload**: `{ userId, loginId, role, storeIds[] }`
- **총 83개 엔드포인트**: Auth(6), Registration(7), Dashboard(6), Equipment(6), Monitoring(5), Control(7+2), A/S(7), Customer(10), System(21), Gateway(5), Files(2)

**v1.1 추가 엔드포인트**:
- `GET/PUT /control/equipment/:id/fan-auto-settings` — 팬 자동제어 설정 조회/수정
- `POST /control/gateway/:id/config` — 게이트웨이 원격 설정 변경
- `GET /control/gateway-config/:id/status` — 설정 변경 결과 확인

**공통 응답 형식**:
```json
{ "success": true, "data": { ... }, "meta": { "page": 1, "pageSize": 20, "totalCount": 152 } }
```

**공통 에러 코드**: `VALIDATION_ERROR`(400), `AUTH_TOKEN_EXPIRED`(401), `AUTH_UNAUTHORIZED`(401), `AUTH_FORBIDDEN`(403), `RESOURCE_NOT_FOUND`(404), `DUPLICATE_RESOURCE`(409), `INTERNAL_ERROR`(500)

**역할별 자동 필터링**: 서버에서 JWT의 role + storeIds 기반으로 접근 가능 데이터만 반환.

**타임스탬프 규칙**: DB=UTC(DATETIME), API 응답=ISO 8601, MQTT 원본=Unix epoch(초)

## 주요 DB 테이블 요약 (v3.1)

**사용자 관리**: users, user_business_info, dealer_profiles, hq_profiles, owner_profiles
**권한**: role_permissions, user_permission_overrides (RBAC + 개별 오버라이드, 24개 feature_code)
**매장**: stores, store_floors
**장비**: equipment, equipment_models, gateways, controllers
**센서 데이터**: gateway_sensor_data(IAQ), controller_sensor_data(파워팩) — 일별 파티션, 원본 90일 보관 → 1시간 집계 5년
**A/S**: as_requests(7단계 상태), as_reports, as_attachments, as_report_attachments
**제어**: control_commands (영구 보관, cmd_id로 ACK 매칭)
**설정**: config_commands (영구 보관, cmd_id로 config/ack 매칭)
**알람**: alarm_events (영구 보관)
**기타**: cleaning_thresholds, damper_auto_settings, consumable_schedules, esg_metrics, outdoor_air_quality, equipment_history

**엔티티 관계 요약**:
```
users ─── user_business_info (1:1)
       ├── dealer_profiles (1:1, role=DEALER)
       ├── hq_profiles (1:1, role=HQ)
       ├── owner_profiles (1:1, role=OWNER)
       ├── role_permissions (N:1, role 기준)
       └── user_permission_overrides (1:N)

stores ─── store_floors (1:N)
        ├── equipment (1:N)
        ├── gateways (1:N)
        ├── alarm_events (1:N)
        ├── as_requests (1:N)
        └── esg_metrics (1:N)

equipment ─── controllers (1:N, 최대 4)
           ├── cleaning_thresholds (1:1)
           ├── damper_auto_settings (1:N)
           ├── equipment_history (1:N)
           ├── consumable_schedules (1:N)
           └── equipment_models (N:1, FK 참조)

gateways ─── controllers (1:N)
          └── gateway_sensor_data (1:N, 시계열)

controllers ─── controller_sensor_data (1:N, 시계열)

as_requests ─── as_attachments (1:N)
             └── as_reports (1:1)
                  └── as_report_attachments (1:N)
```

**v3.0/v3.1에서 삭제된 테이블/엔티티**:
- ~~cell_types~~ (수동 입력으로 변경)
- ~~powerpacks~~ (controller로 통합)
- ~~fire_control_history~~ (control_commands로 통합)
- ~~power_control_history~~ (control_commands로 통합)

## v3.0/v3.1/v3.2 주요 변경사항 (피드백 + MQTT 260213/260227 반영)

개발 시 반드시 아래 변경사항을 확인하고 반영할 것:

### v3.0 변경사항 (피드백 260212 기반)
1. **Controller = 파워팩** (powerpacks 테이블 삭제, 최대 4대/장비)
2. **Equipment 최대 5대/층** (기존 무제한에서 변경)
3. **cell_type**: 드롭다운 → 수동 입력(VARCHAR)
4. **업태/업종 필드 삭제** (user_business_info에서 제거)
5. **매장 규모(store_scale) 삭제** (owner_profiles)
6. **업종에 '커피로스팅' 추가** (stores.business_type)
7. **서비스 가능 지역 확장**: 서울 동부/서부, 경기 동부/서부 추가
8. **센서 주기**: 1분 → **10초**
9. **통신 오류 판정**: heartbeat 기반 → **30초 미수신** (status 토픽)
10. **방화셔터**: 8단계(0~7) 개도율, 매핑 — 0(0%), 1(10%), 2(25%), 3(40%), 4(60%), 5(75%), 6(90%), 7(100%)
11. **운영 시간 설정 삭제** (전원, 방화셔터, 송풍기 모두)
12. **A/S 방문 희망 일시 필드 추가**, 교체 부품 상세(품명/가격/수량) 필수
13. **고객 상태**: 활성/비활성 구분 추가
14. **대시보드**: 시스템 상태 삭제, 이슈 항목 4가지로 재정의
15. **담당 기사 → 담당 대리점**으로 수정
16. **압력 이력 삭제**

### v3.1 변경사항 (MQTT 260213 + 토픽 구조 변경 협의)
17. **fan_mode 필드 추가** (팬 제어 모드, 0=수동/1=자동) — controller 센서 데이터
18. **damper_mode 필드 추가** (댐퍼 제어 모드, 0=수동/1=자동) — controller 센서 데이터
19. **댐퍼 자동제어**: action=2 (모드 전환), action=3 (목표 풍량 CMH 설정) 추가
20. **시로코팬 자동제어**: action=4 (모드 전환), action=5 (목표 풍속 m/s 설정) 추가
21. **value 타입 변경**: int → number (int 또는 float), 목표 풍량/풍속은 float
22. **config 토픽 페이로드 완전 정의** (sensor_interval_ms, mqtt_interval_ms, ID 변경, WiFi 등)
23. **config/ack 토픽 추가** (cmd_id, result, reason, needs_reboot)
24. **안전 오버라이드**: ESTOP/스파크/과온도 알람 시 자동→수동 전환 동작 정의
25. **damper_auto_settings에 target_velocity 컬럼 추가** (시로코팬 목표 풍속)
26. **제어 모드**: 수동 전용 → **자동/수동 전환 지원**

### v3.2 변경사항 (MQTT 260227_v2 반영)
27. **oil_level 타입 변경**: `float` (0-100%) → `int` (0=정상, 1=만수) — 디지털 센서 실제 동작에 맞게 수정. UI에서 수치 표시 대신 정상/만수 상태 태그로 표시
28. **pp_spark 범위 확대**: 0-99 → **0-9999** (파워팩 rev2.1 대응). 알람 임계값도 9999 스케일 기준으로 조정 필요
29. **fan_running 필드 추가**: `int` (0=정지, 1=운전중) — M100 인버터 RUN_STATUS 레지스터 기반 실제 운전 여부
30. **fan_freq 필드 추가**: `float` (0~50.00 Hz) — M100 인버터 실제 출력 주파수. 자동 모드에서 PID 출력 확인용
31. **fan_target_pct 필드 추가**: `float` (0.0~100.0%) — PID 목표값. fan_mode=1(자동)일 때만 유의미, 수동 모드에서는 0
32. **damper_ctrl 필드 추가**: `float` (0-100%) — 댐퍼 제어 명령값(flo-OAC Damper_CTRL). 기존 `damper`는 피드백값(Damper_FB)이므로 구분 필요
33. **status 토픽에 wifi 객체 추가**: `{ ssid, rssi, ip, mac, channel }` — 게이트웨이 Wi-Fi 연결 정보. 미연결 시 rssi=0, channel=0
34. **status_flags bit 5 판정 로직 변경**: 단순 인버터 정상 → **RS-485 통신 정상 AND Fault Trip 없음** (복합 판정)

## 명령어

```bash
npm run dev       # 개발 서버 (Vite HMR)
npm run build     # 프로덕션 빌드
npm run lint      # ESLint 검사
npm run preview   # 빌드 미리보기
```

## 개발 진행 순서

| 순서 | 작업 | 산출물 |
|:---:|------|--------|
| 0 | 프로젝트 초기 세팅 + 공통 컴포넌트 | AppLayout, Header, Sidebar, StatusTag, StoreTree |
| 1 | 로그인 | LoginPage.tsx + authStore |
| 2 | 회원가입 4종 | Owner/HQ/Admin/Dealer RegisterPage |
| 3 | 대시보드 (ADMIN) | 전체/개별매장/장비별 + 긴급알람 |
| 4 | 대시보드 (DEALER/HQ/OWNER) | 역할별 대시보드 |
| 5 | 장비관리 — 장비정보 | EquipmentInfoPage + 등록/수정 |
| 6 | 장비관리 — 실시간 모니터링 | RealtimeMonitorPage (ECharts) |
| 7 | 장비관리 — 장치 제어 | ControlPower/Damper/Fan Page (수동+자동) |
| 8 | 장비관리 — 이력 조회 | HistoryPage |
| 9 | A/S관리 — 알림/접수 | ASAlertListPage, ASRequestPage |
| 10 | A/S관리 — 처리/보고서 | ASStatusPage, ASReportPage |
| 11 | 고객 현황 | CustomerListPage + 지도 + 편집 |
| 12 | 시스템관리 4탭 | 권한/승인/사용자/기준수치 |

## 중요 주의사항

- PC/태블릿 우선 설계 (모바일 앱은 별도 프로젝트)
- 한국어 UI, 한국 비즈니스 용어 사용 (업종, 사업자등록번호, 대리점 등)
- 타입 정의는 데이터구조 정의서의 테이블/컬럼명을 그대로 반영 (camelCase 변환)
- API 설계서의 엔드포인트를 Mock 서비스 함수명으로 1:1 매핑
- Mock 데이터는 MQTT Payload 규격의 필드명/타입/범위에 정확히 맞춰 생성
- 피드백 PDF의 수정사항을 UI에 빠짐없이 반영
- 새 화면 개발 시 반드시 `docs/` 폴더의 관련 문서를 먼저 읽고 시작
- 컴포넌트 크기가 300줄 이상이면 하위 컴포넌트로 분리
- 기존에 만든 컴포넌트/타입/유틸이 있으면 반드시 재사용 (중복 생성 금지)
- 제어 UI에서는 수동/자동 모드 전환 기능을 반드시 포함 (댐퍼, 시로코팬)
- 자동 모드 시 목표값(풍량 CMH, 풍속 m/s) 입력 필드 제공
- 안전 오버라이드로 인한 모드 변경은 센서 데이터의 fan_mode/damper_mode로 UI에 실시간 반영
