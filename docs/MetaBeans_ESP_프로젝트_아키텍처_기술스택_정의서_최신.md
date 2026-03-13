# MetaBeans ESP 관제시스템 — 프로젝트 아키텍처 및 기술 스택 정의서

**버전**: v1.1  
**작성일**: 2026-02-13  
**최종 수정일**: 2026-02-13  
**작성자**: 한재혁 (MetaBeans)  
**대상**: 고블린게임즈 개발팀, 내부 기획팀

> **v1.1 변경 이력 (2026-02-13)**:  
> - MQTT Payload 규격 260213 반영: 댐퍼/시로코팬 자동 제어 명령 추가 (target=1 action 2,3 / target=2 action 4,5)  
> - sensor 메시지에 `fan_mode`, `damper_mode` 필드 추가  
> - config / config/ack 토픽 페이로드 완전 정의  
> - 자동 제어 동작 규칙 및 안전 오버라이드 규격 추가  
> - MQTT 토픽 구조 변경 협의 사항 (바이테리아 김나환 ↔ 메타빈스 이서현) 반영

---

## 1. 프로젝트 개요

### 1.1 시스템 목적

MetaBeans ESP(Electrostatic Precipitator) 관제시스템은 약 200개 음식점에 설치된 주방 배기 장비(집진기, 파워팩, 게이트웨이)를 실시간으로 모니터링하고 제어하는 IoT 기반 통합 관리 플랫폼이다.

### 1.2 핵심 기능 범위

- **회원관리**: 4개 역할(시스템관리자, 대리점, 매장본사, 매장점주)별 가입/승인/권한
- **대시보드**: 전체 매장 현황, 개별 매장별/장비별 모니터링, 긴급알람
- **장비관리**: 장비 등록/수정, 실시간 모니터링(센서 데이터), 제어(전원/댐퍼/팬 — 수동+자동), 원격 설정(config), 이력 조회
- **A/S관리**: 신청, 처리현황, 대리점 배정, 완료 보고서
- **고객현황**: 고객 목록/정보 수정
- **시스템관리**: 역할별 메뉴 접근 권한, 회원 승인, 사용자 관리, 기준수치 관리

### 1.3 사용자 유형 및 접근 환경

| 역할 | 코드 | 주요 사용 환경 | 비고 |
|------|------|-------------|------|
| 시스템 관리자 | ADMIN | PC (웹 브라우저) | 전체 시스템 관리 권한 |
| 대리점 | DEALER | PC / 태블릿 | 관할 매장 장비 관리, A/S 처리 |
| 매장 본사 | HQ | PC | 소속 매장 모니터링 |
| 매장 점주 | OWNER | PC / 태블릿 | 본인 매장 모니터링, A/S 신청 |

> **참고**: 관리툴은 PC/태블릿 우선 설계이며, 모바일 앱은 별도 프로젝트로 진행한다.

---

## 2. 개발 전략

### 2.1 개발 단계

```
[현재 단계]
Phase 1: 프론트엔드 목업 (Mock 데이터) — Claude 활용, 한재혁 기획
    ↓
Phase 2: 프론트엔드 통합 및 백엔드 개발 — 고블린게임즈 개발팀
    ↓
Phase 3: MQTT/IoT 연동 및 통합 테스트
    ↓
Phase 4: 운영 배포 및 안정화
```

### 2.2 Phase 1 (현재) 산출물

Phase 1에서 Claude를 활용하여 생산하는 산출물은 다음과 같다:

- React 컴포넌트 (페이지별 .tsx 파일)
- Mock 데이터 파일 (JSON 또는 TypeScript 상수)
- 공통 레이아웃/컴포넌트 라이브러리
- 라우팅 설정
- 타입 정의 파일 (.d.ts / interfaces)

개발팀은 이 산출물을 기반으로 실제 API 연동 및 백엔드 개발을 진행한다.

### 2.3 개발팀 인수 시 고려사항

- 모든 기술 스택은 **생태계가 넓고 레퍼런스가 풍부한 것**을 우선 선정
- Mock 데이터 인터페이스를 API 인터페이스와 동일한 구조로 설계하여 교체 용이
- 컴포넌트별 독립적 개발이 가능하도록 모듈화

---

## 3. 전체 시스템 아키텍처

### 3.1 아키텍처 개요도

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                             │
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │           React + Vite + TypeScript (SPA)               │   │
│   │   ┌──────────┬──────────┬──────────┬──────────────┐     │   │
│   │   │ 대시보드  │ 장비관리  │ A/S관리  │ 시스템관리    │     │   │
│   │   └──────────┴──────────┴──────────┴──────────────┘     │   │
│   │   상태관리: Zustand (클라이언트) + TanStack Query (서버)  │   │
│   │   차트: Apache ECharts  │  UI: Ant Design 5             │   │
│   └─────────────────────────────────────────────────────────┘   │
└──────────────────────────────┬──────────────────────────────────┘
                               │ HTTPS (REST API)
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                        SERVER LAYER                             │
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │              Node.js + Express + TypeScript              │   │
│   │   ┌──────────┬──────────┬──────────┬──────────────┐     │   │
│   │   │ Auth API │ 장비 API  │ A/S API  │ 시스템 API    │     │   │
│   │   └──────────┴──────────┴──────────┴──────────────┘     │   │
│   │   인증: JWT (Access + Refresh Token)                     │   │
│   │   ORM: Prisma (또는 Sequelize)                           │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │              MQTT 브릿지 서비스                           │   │
│   │   AWS IoT Core ←→ mqtt.js ←→ 센서데이터 파싱/저장        │   │
│   └─────────────────────────────────────────────────────────┘   │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                        DATA LAYER                               │
│                                                                 │
│   ┌──────────────────┐    ┌──────────────────────────────────┐  │
│   │   MySQL 8.0      │    │   AWS IoT Core                   │  │
│   │   (Amazon RDS)   │    │   (MQTT Broker)                  │  │
│   │                  │    │                                  │  │
│   │ - 사용자/권한    │    │   QoS 1                          │  │
│   │ - 장비/센서      │    │   10초 주기 센서+상태 발행        │  │
│   │ - A/S            │    │   30초 미수신 시 통신 오류 판정   │  │
│   │ - 알림/이력      │    └──────────────────────────────────┘  │
│   │ - 기준수치       │                                          │
│   └──────────────────┘                                          │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                       DEVICE LAYER                              │
│                                                                 │
│   ┌──────────┐    ┌──────────┐    ┌──────────────────────────┐  │
│   │ 파워팩    │───→│ 게이트웨이│───→│ AWS IoT Core (MQTT)     │  │
│   │(ESP32 MCU)│    │(건물 층별)│    │                          │  │
│   └──────────┘    └──────────┘    └──────────────────────────┘  │
│                                                                 │
│   장비 계층: Site → Floor → Gateway → Equipment → Controller   │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 데이터 흐름

```
[센서 → 서버 (Upstream)]
파워팩(ESP32) → 게이트웨이 → MQTT(AWS IoT Core) → MQTT 브릿지 → MySQL 저장
                                                              → 프론트엔드 갱신

[제어 명령 (Downstream)]
프론트엔드 → REST API → MQTT 브릿지 → AWS IoT Core → 게이트웨이 → 파워팩
```

---

## 4. 기술 스택 상세

### 4.1 프론트엔드

| 구분 | 기술 | 버전 | 선정 사유 |
|------|------|------|----------|
| **프레임워크** | React | 18.x | 생태계, 컴포넌트 재사용, 개발팀 인수 용이 |
| **빌드 도구** | Vite | 5.x | 빠른 HMR, TypeScript 네이티브 지원 |
| **언어** | TypeScript | 5.x | 타입 안정성, API 인터페이스 명확화 |
| **라우팅** | React Router | v6 | 안정성, 레퍼런스 풍부, 중첩 라우팅 지원 |
| **상태관리 (클라이언트)** | Zustand | 4.x | 경량, 보일러플레이트 최소, 역할/UI 상태 관리 |
| **상태관리 (서버)** | TanStack Query | 5.x | API 데이터 캐싱, 자동 갱신, Mock→실제 API 전환 용이 |
| **UI 컴포넌트** | Ant Design | 5.x | 관리툴 최적화 (Table, Form, Tree, DatePicker 등), 한국어 지원 |
| **차트** | Apache ECharts | 5.x | 마우스 스크롤 확대/축소(dataZoom) 네이티브, 실시간 차트 |
| **차트 래퍼** | echarts-for-react | 3.x | React 통합 |
| **아이콘** | @ant-design/icons | 5.x | Ant Design 통합 |
| **HTTP 클라이언트** | Axios | 1.x | 인터셉터 지원, API 공통 처리 |
| **날짜 처리** | dayjs | 1.x | Ant Design 기본 날짜 라이브러리, 경량 |
| **지도** | Leaflet + react-leaflet | 4.x / 2.x | OpenStreetMap 기반, 무료, 매장 위치 표시 |

#### 4.1.1 상태관리 아키텍처 (Zustand + TanStack Query)

```
┌─────────────────────────────────────────┐
│              Zustand Store              │
│                                         │
│  • authStore: 로그인 상태, JWT 토큰, 역할 │
│  • uiStore: 사이드바 열림/닫힘, 선택 매장/장비/컨트롤러 │
│  • alertStore: 긴급알람 상태               │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│           TanStack Query                │
│                                         │
│  • useStores(): 매장 목록 조회            │
│  • useEquipments(): 장비 목록 조회        │
│  • useSensorData(): 실시간 센서 데이터     │
│  • useASRequests(): A/S 처리현황          │
│  • ... (API별 커스텀 훅)                  │
│                                         │
│  Phase 1: Mock 함수 → Phase 2: Axios    │
└─────────────────────────────────────────┘
```

**선정 사유**:
- **Zustand**: Redux 대비 보일러플레이트 80% 감소. 인증 상태, UI 상태 등 클라이언트 전용 상태에 적합. 학습 비용 최소.
- **TanStack Query**: 서버 데이터(매장, 장비, 센서 등)의 캐싱/갱신/에러처리를 자동화. `queryFn`만 Mock→Axios로 교체하면 백엔드 전환 완료.

#### 4.1.2 UI 라이브러리 선정 사유 (Ant Design 5)

ESP 관리툴에서 가장 빈번히 사용되는 UI 패턴과 Ant Design의 대응:

| ESP 관리툴 요구사항 | Ant Design 컴포넌트 | 비고 |
|-------------------|-------------------|------|
| 매장/장비 트리 네비게이션 | `<Tree>` | 검색, 비동기 로딩 지원 |
| 고객/장비/A/S 목록 | `<Table>` | 정렬, 필터, 페이지네이션 내장 |
| 회원가입/장비등록 폼 | `<Form>`, `<Steps>` | 유효성 검증, 다단계 폼 |
| 역할별 접근 권한 설정 | `<Transfer>`, `<Checkbox.Group>` | 권한 이동/선택 |
| 날짜/기간 선택 | `<DatePicker>`, `<RangePicker>` | dayjs 통합 |
| 상태 표시 (Green/Yellow/Red) | `<Tag>`, `<Badge>` | 색상 커스텀 용이 |
| 알림/알람 | `<Notification>`, `<Modal>` | 긴급알람 팝업 |
| 탭 전환 (장비정보/모니터링/제어) | `<Tabs>` | 지연 로딩 지원 |

#### 4.1.3 차트 라이브러리 선정 사유 (Apache ECharts)

| 요구사항 (피드백 p.41) | ECharts 기능 | 대안 비교 |
|----------------------|-------------|----------|
| 마우스 스크롤 확대/축소 | `dataZoom` (type: 'inside') | Recharts: 미지원, Chart.js: 플러그인 필요 |
| 월/일/시간/분 단위 자동 전환 | `axisPointer` + 동적 포맷 | Recharts: 수동 구현 필요 |
| 실시간 데이터 스트리밍 | `appendData()` | Chart.js: 전체 리렌더 |
| 보드온도 라인차트 + 스파크 산점도 | 복합 차트 네이티브 지원 | Recharts: 제한적 |

### 4.2 백엔드 (Phase 2 — 개발팀 구현)

| 구분 | 기술 | 선정 사유 |
|------|------|----------|
| **런타임** | Node.js 20 LTS | 프론트엔드와 동일 언어(TypeScript), MQTT 비동기 처리 |
| **프레임워크** | Express | 가장 넓은 생태계, 미들웨어 풍부, 개발팀 학습비용 최소 |
| **언어** | TypeScript | 프론트엔드와 타입 정의 공유 가능 |
| **ORM** | Prisma | 타입 안전 쿼리, 마이그레이션 관리, MySQL 지원 |
| **인증** | JWT (Access + Refresh) | SPA 구조 적합, RBAC 구현 용이 |
| **MQTT 클라이언트** | mqtt.js | AWS IoT Core 연동 검증된 라이브러리 |
| **유효성 검증** | Zod | 프론트/백엔드 스키마 공유 가능 |
| **API 문서** | Swagger (swagger-jsdoc) | 개발팀 간 API 명세 공유 |

#### 4.2.1 인증 아키텍처 (JWT)

```
[로그인 플로우]
1. 사용자 → POST /api/auth/login (email, password)
2. 서버 → 비밀번호 검증 → JWT 발급
   - Access Token (15분, 메모리 저장)
     payload: { userId, role, storeIds[] }
   - Refresh Token (7일, HttpOnly Cookie)
3. 프론트엔드 → API 요청 시 Authorization: Bearer {accessToken}
4. Access Token 만료 → POST /api/auth/refresh → 새 Access Token 발급

[역할 기반 접근 제어 (RBAC)]
- 미들웨어에서 JWT의 role 확인
- 역할별 허용 API 엔드포인트 매핑
- 프론트엔드에서도 역할별 메뉴/버튼 표시 제어
```

**JWT 선정 사유**:
- SPA(React) + REST API 구조에 최적
- 토큰에 `role` 포함으로 매 요청마다 DB 조회 불필요
- 4개 역할(ADMIN/DEALER/HQ/OWNER)의 권한 분기 처리 간결

### 4.3 데이터베이스

| 구분 | 기술 | 비고 |
|------|------|------|
| **RDBMS** | MySQL 8.0 | Amazon RDS 호스팅 |
| **센서 데이터** | MySQL 파티셔닝 | 월별 파티션, 5년 보관 |
| **문자 인코딩** | utf8mb4 | 한국어 완전 지원 |

> **향후 확장 고려**: 센서 데이터 규모가 커지면 TimescaleDB(PostgreSQL) 또는 AWS Timestream 검토. 현재 200개 매장 규모에서는 MySQL 파티셔닝으로 충분.

### 4.4 인프라 / 클라우드

| 구분 | 서비스 | 용도 |
|------|-------|------|
| **MQTT Broker** | AWS IoT Core | 장비 ↔ 서버 통신, QoS 1 |
| **데이터베이스** | Amazon RDS (MySQL) | 운영 데이터 저장 |
| **파일 저장** | Amazon S3 | A/S 보고서 첨부파일, 사진 등 |
| **배포** | 미정 (Phase 2에서 결정) | Docker + ECS/Fargate 또는 EC2 |
| **도메인/SSL** | Route 53 + ACM | HTTPS 인증서 |

---

## 5. 프로젝트 디렉토리 구조

### 5.1 프론트엔드 (Phase 1 산출물)

```
esp-admin/
├── public/
│   └── favicon.ico
├── src/
│   ├── api/                        # API 호출 레이어
│   │   ├── mock/                   # Mock 데이터 및 핸들러
│   │   │   ├── auth.mock.ts
│   │   │   ├── dashboard.mock.ts
│   │   │   ├── equipment.mock.ts
│   │   │   ├── as-service.mock.ts
│   │   │   └── system.mock.ts
│   │   ├── auth.api.ts             # Phase 2에서 실제 API로 교체
│   │   ├── dashboard.api.ts
│   │   ├── equipment.api.ts
│   │   ├── as-service.api.ts
│   │   └── system.api.ts
│   │
│   ├── components/                 # 공통 컴포넌트
│   │   ├── layout/
│   │   │   ├── AppLayout.tsx       # 전체 레이아웃 (헤더 + 사이드바 + 콘텐츠)
│   │   │   ├── Header.tsx          # 상단 네비게이션
│   │   │   ├── Sidebar.tsx         # 좌측 매장-장비-컨트롤러 트리 (3단계)
│   │   │   └── RoleBadge.tsx       # 역할 배지
│   │   ├── common/
│   │   │   ├── StatusTag.tsx       # Green/Yellow/Red 상태 태그
│   │   │   ├── StoreTree.tsx       # 매장-장비-컨트롤러 트리 컴포넌트
│   │   │   ├── AirQualityCard.tsx  # 실내공기질 카드
│   │   │   ├── SensorGauge.tsx     # 센서 게이지 컴포넌트
│   │   │   └── ConfirmModal.tsx    # 확인 모달
│   │   └── charts/
│   │       ├── BoardTempChart.tsx  # 보드온도 라인차트 (ECharts)
│   │       ├── SparkChart.tsx      # 스파크 산점도 (ECharts)
│   │       └── TimeSeriesChart.tsx # 범용 시계열 차트 (확대/축소)
│   │
│   ├── hooks/                      # 커스텀 훅
│   │   ├── useAuth.ts              # 인증 관련 훅
│   │   ├── useRole.ts              # 역할 기반 권한 체크
│   │   ├── useSensorData.ts        # 센서 데이터 폴링/갱신
│   │   └── useEquipmentTree.ts     # 장비 트리 데이터
│   │
│   ├── pages/                      # 페이지 컴포넌트
│   │   ├── auth/
│   │   │   ├── LoginPage.tsx
│   │   │   ├── ForgotPasswordPage.tsx
│   │   │   ├── ChangePasswordPage.tsx
│   │   │   └── register/
│   │   │       ├── HQRegisterPage.tsx          # 본사 회원가입
│   │   │       ├── DealerRegisterPage.tsx       # 대리점 회원가입
│   │   │       ├── StoreHQRegisterPage.tsx      # 매장본사 회원가입
│   │   │       ├── StoreOwnerRegisterPage.tsx   # 매장점주 회원가입
│   │   │       └── RegisterCompletePage.tsx     # 가입 완료
│   │   │
│   │   ├── dashboard/
│   │   │   ├── AdminDashboard.tsx       # 관리자 대시보드
│   │   │   ├── StoreDetailDashboard.tsx # 개별 매장별
│   │   │   ├── EquipmentDashboard.tsx   # 장비별 (실내공기질)
│   │   │   ├── EmergencyAlarmPage.tsx   # 긴급알람
│   │   │   ├── DealerDashboard.tsx      # 대리점 대시보드
│   │   │   ├── StoreHQDashboard.tsx     # 매장본사 대시보드
│   │   │   └── OwnerDashboard.tsx       # 매장점주 대시보드
│   │   │
│   │   ├── equipment/
│   │   │   ├── EquipmentInfoPage.tsx       # 장비 정보
│   │   │   ├── EquipmentEditPage.tsx       # 장비 정보 수정
│   │   │   ├── EquipmentRegisterPage.tsx   # 신규 장비 등록
│   │   │   ├── RealtimeMonitorPage.tsx     # 실시간 모니터링
│   │   │   ├── ControlPowerPage.tsx        # 전원 제어
│   │   │   ├── ControlShutterPage.tsx      # 방화셔터 제어
│   │   │   ├── ControlFanPage.tsx          # 송풍기 팬 제어
│   │   │   ├── HistoryPage.tsx             # 이력 조회
│   │   │   └── AlertPage.tsx               # 알림
│   │   │
│   │   ├── as-service/
│   │   │   ├── ASAlertListPage.tsx         # 알림 현황
│   │   │   ├── ASRequestPage.tsx           # A/S 신청
│   │   │   ├── ASStatusPage.tsx            # 처리 현황
│   │   │   ├── ASStatusDetailPage.tsx      # 처리 현황 상세
│   │   │   ├── ASReportPage.tsx            # 완료 보고서
│   │   │   └── ASReportEditPage.tsx        # 보고서 입력
│   │   │
│   │   ├── customer/
│   │   │   ├── CustomerListPage.tsx        # 고객 목록
│   │   │   └── CustomerEditPage.tsx        # 고객 정보 수정
│   │   │
│   │   └── system/
│   │       ├── RolePermissionPage.tsx      # 역할별 메뉴 접근 권한
│   │       ├── MemberApprovalPage.tsx      # 회원가입 승인
│   │       ├── UserManagementPage.tsx      # 사용자 관리
│   │       └── ThresholdSettingPage.tsx    # 기준 수치 관리
│   │
│   ├── stores/                     # Zustand 스토어
│   │   ├── authStore.ts            # 인증 상태
│   │   ├── uiStore.ts              # UI 상태 (사이드바, 선택 매장/장비/컨트롤러)
│   │   └── alertStore.ts           # 긴급알람 상태
│   │
│   ├── types/                      # TypeScript 타입 정의
│   │   ├── auth.types.ts           # 사용자, 역할, 토큰
│   │   ├── store.types.ts          # 매장, 층, 구역
│   │   ├── equipment.types.ts      # 장비, 게이트웨이, 파워팩
│   │   ├── sensor.types.ts         # 센서 데이터, 공기질 지표
│   │   ├── as-service.types.ts     # A/S 관련
│   │   ├── control.types.ts        # 제어 명령
│   │   └── system.types.ts         # 시스템 관리, 권한
│   │
│   ├── utils/                      # 유틸리티
│   │   ├── constants.ts            # 상수 (상태 색상, 지표 범위 등)
│   │   ├── statusHelper.ts         # Green/Yellow/Red 판정 로직
│   │   ├── roleHelper.ts           # 역할별 메뉴/권한 헬퍼
│   │   └── formatters.ts           # 날짜, 숫자 포맷
│   │
│   ├── routes/
│   │   └── AppRoutes.tsx           # 전체 라우팅 설정 (역할별 가드 포함)
│   │
│   ├── App.tsx
│   ├── main.tsx
│   └── vite-env.d.ts
│
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

### 5.2 백엔드 (Phase 2 — 개발팀 참고용 구조)

```
esp-api/
├── src/
│   ├── config/
│   │   ├── database.ts          # MySQL 연결 설정
│   │   ├── mqtt.ts              # AWS IoT Core MQTT 설정
│   │   └── jwt.ts               # JWT 시크릿, 만료시간
│   ├── middleware/
│   │   ├── auth.middleware.ts    # JWT 검증
│   │   ├── role.middleware.ts    # RBAC 권한 체크
│   │   └── error.middleware.ts   # 공통 에러 처리
│   ├── routes/
│   │   ├── auth.routes.ts
│   │   ├── dashboard.routes.ts
│   │   ├── equipment.routes.ts
│   │   ├── as-service.routes.ts
│   │   ├── customer.routes.ts
│   │   └── system.routes.ts
│   ├── services/
│   │   ├── auth.service.ts
│   │   ├── mqtt.service.ts      # MQTT 메시지 처리
│   │   ├── sensor.service.ts    # 센서 데이터 저장/조회
│   │   ├── control.service.ts   # 장비 제어 명령 발행
│   │   └── alert.service.ts     # 알림/알람 처리
│   ├── prisma/
│   │   └── schema.prisma        # DB 스키마 정의
│   └── app.ts
├── package.json
└── tsconfig.json
```

---

## 6. 핵심 설계 규칙

### 6.1 역할별 라우팅 및 메뉴 제어

```typescript
// routes/AppRoutes.tsx 예시 구조
const roleMenuMap = {
  ADMIN:  ['dashboard', 'equipment', 'as-service', 'customer', 'system'],
  DEALER: ['dashboard', 'equipment', 'as-service'],
  HQ:     ['dashboard', 'equipment', 'as-service'],
  OWNER:  ['dashboard', 'equipment', 'as-service'],
};

// ProtectedRoute 컴포넌트로 역할별 접근 제어
<Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
  <Route path="/system/*" element={<SystemPages />} />
</Route>
```

### 6.2 상태 색상 체계 (Green/Yellow/Red)

피드백 문서 p.42 기준, 모든 센서 지표에 대해 통일된 3단계 상태를 적용:

```typescript
// utils/constants.ts
export const STATUS_COLORS = {
  GOOD:    { color: '#52c41a', label: '정상',     level: 'green'  },
  WARNING: { color: '#faad14', label: '주의',     level: 'yellow' },
  DANGER:  { color: '#ff4d4f', label: '위험',     level: 'red'    },
} as const;
```

### 6.3 장비 계층 구조

```
Site (매장) → Floor (층/구역) → Gateway (게이트웨이)
                                    → Equipment (집진기, ESP) 
                                        → Controller (파워팩, 최대 4개)
```

> **사이드바 트리 UI**: 데이터 구조는 Site→Floor→Gateway→Equipment→Controller 5단계이지만, 사이드바에서는 **업체명 > 집진기 > 컨트롤러** 3단계로 평탄화하여 표시한다 (Floor, Gateway는 UI에서 생략). 컨트롤러 클릭 시 해당 컨트롤러의 상위 장비가 자동 선택되며, 장비관리 페이지(장비정보, 실시간모니터링, 장치제어)에서 선택된 컨트롤러의 데이터만 필터링하여 표시한다. 이력조회는 전체 컨트롤러 데이터를 표시한다. 장비/컨트롤러 전환 시 현재 선택된 탭(장비정보/모니터링/제어/이력)이 유지된다.

### 6.4 상태 전파 규칙 (피드백 p.27)

```
Controller(파워팩) 상태 → Equipment(장비) 상태 → Site(매장) 상태

규칙: 하위 항목 중 가장 높은 위험도가 상위로 전파
  - 하위에 Yellow + Red → 상위는 Red (위험)
  - 하위에 Green + Yellow → 상위는 Yellow (주의)  
  - 모두 Green → 상위는 Green (정상)
```

### 6.5 Mock → API 전환 패턴

Phase 1(Mock)에서 Phase 2(실제 API)로의 전환을 최소화하기 위한 패턴:

```typescript
// api/equipment.api.ts
import { useQuery } from '@tanstack/react-query';
import { mockGetEquipments } from './mock/equipment.mock';
// import { axiosGetEquipments } from './real/equipment.real'; // Phase 2

export const useEquipments = (storeId: string) => {
  return useQuery({
    queryKey: ['equipments', storeId],
    queryFn: () => mockGetEquipments(storeId),  // Phase 2: axiosGetEquipments(storeId)
    staleTime: 30 * 1000,
  });
};
```

> **핵심**: `queryFn`만 교체하면 컴포넌트 코드는 변경 없이 실제 API와 연동된다.

---

## 7. MQTT 통신 규격 (MQTT_Payload_규격_260213.pdf 기준)

Phase 2에서 백엔드 팀이 구현. 프론트엔드 Mock 데이터 구조도 이 규격에 맞춰 설계한다.

> **참조 문서**: MQTT_Payload_규격_260213.pdf, MQTT_토픽_구조_변경_및_협의_사항.pdf

### 7.1 기본 설정

| 항목 | 규격 |
|------|------|
| 프로토콜 | MQTT v3.1.1 (AWS IoT Core) |
| QoS | 1 (모든 토픽 — sensor/status/control/control/ack/config/config/ack, AWS IoT Core는 QoS 2 미지원) |
| Retain | 0 (비활성, 모든 토픽 — 상태 정보는 주기적 10초 발행이므로 Retain 불필요) |
| 센서 데이터 주기 | **10초** (sensor + status 동시 발행) |
| 통신 오류 판정 | 30초간 데이터 미수신 시 연결 끊김(Red) — 피드백 p.38 기준 |
| 타임스탬프 | Unix epoch (초 단위), 서버는 UTC 저장, 클라이언트에서 로컬 변환 |
| 페이로드 크기 | 최대 ~6KB (Equipment 5대 x Controller 4대), MQTT 128KB 한도 내 |

### 7.2 장비 계층 및 수량 제한

```
Site (매장) ─── 1:N ──→ Floor (층)
Floor (층) ─── 1:1 ──→ Gateway (게이트웨이, 층당 1대)
Gateway ─── 1:N ──→ Equipment (집진기, 최대 5대/게이트웨이)
Equipment ─── 1:N ──→ Controller (파워팩, 최대 4대/집진기)
```

### 7.3 토픽 구조

```
metabeans/{site_id}/{floor_id}/gateway/{gw_id}/
├── sensor          # 통합 센서 데이터 발행 (10초 주기, Gateway → Cloud)
├── status          # 게이트웨이 상태 발행 (10초 주기, Gateway → Cloud)
├── control         # 제어 명령 수신 (Cloud → Gateway)
├── control/ack     # 제어 명령 응답 발행 (Gateway → Cloud)
├── config          # 설정 변경 수신 (Cloud → Gateway)
└── config/ack      # 설정 변경 응답 발행 (Gateway → Cloud)
```

구독 패턴 예시:
- 특정 매장 전체: `metabeans/site-001/+/gateway/+/#`
- 특정 층 센서: `metabeans/site-001/1F/gateway/+/sensor`

### 7.4 sensor 메시지 구조

게이트웨이 IAQ 데이터 + 모든 하위 equipment/controller 데이터를 **하나의 메시지로 통합** 발행.

**iaq 필드 (게이트웨이 레벨 — 실내공기질)**

| 필드 | 타입 | 단위 | 설명 |
|------|------|------|------|
| pm1_0 | float | µg/m³ | PM1.0 농도 |
| pm2_5 | float | µg/m³ | PM2.5 농도 |
| pm4_0 | float | µg/m³ | PM4.0 농도 |
| pm10 | float | µg/m³ | PM10 농도 |
| temperature | float | °C | 온도 |
| humidity | float | % | 습도 |
| voc_index | int \| null | - | VOC 지수 (1-500), 워밍업 중 null |
| nox_index | int \| null | - | NOx 지수 (1-500), 워밍업 중 null |
| co2 | int | ppm | CO2 농도 |
| o3 | int | ppb | 오존 농도 |
| co | float | ppm | 일산화탄소 농도 |
| hcho | int | ppb | 포름알데히드 농도 |

**controllers[] 필드 (파워팩 레벨)**

| 필드 | 타입 | 단위 | 설명 |
|------|------|------|------|
| controller_id | string | - | 컨트롤러 ID |
| timestamp | int | epoch초 | 게이트웨이가 마지막 수신한 시간 |
| pm2_5 | float | µg/m³ | 배출부 PM2.5 |
| pm10 | float | µg/m³ | 배출부 PM10 |
| diff_pressure | float | Pa | ESP 집진부 차압 |
| oil_level | float | % | 오일 수위 (0-100) |
| pp_temp | int | °C | 파워팩 온도 (정수) |
| pp_spark | int | - | 스파크 수치 (0-99) |
| pp_power | int | - | 전원 상태 (0=OFF, 1=ON) |
| pp_alarm | int | - | 파워팩 알람 (0=정상, 1=알람) |
| fan_speed | int | - | 팬 속도 (0=OFF, 1=LOW, 2=MID, 3=HIGH), 수동 모드에서만 유의미 |
| fan_mode | int | - | 팬 제어 모드 (0=수동, 1=자동) |
| damper_mode | int | - | 댐퍼 제어 모드 (0=수동, 1=자동) |
| flow | float | CMH | 풍량 (flo-OAC Q_act, 현재유량) |
| damper | float | % | 댐퍼 개도율 (flo-OAC Damper_FB 피드백, 0-100) |
| inlet_temp | float | °C | 유입 온도 (flo-OAC T_act, -20~50) |
| velocity | float | m/s | 현재 풍속 (flo-OAC V_act, 0~20.0) |
| duct_dp | float | Pa | 덕트 차압 (flo-OAC DP_Pv, -49~980) |
| status_flags | int | - | 상태 플래그 (비트마스크, 6비트) |

**status_flags 비트 정의 (Controller)**

| 비트 | 의미 |
|------|------|
| 0 | 파워팩 RS-485 통신 정상 |
| 1 | SPS30 (PM2.5) 센서 정상 |
| 2 | SDP810 (차압) 센서 정상 |
| 3 | 수위 센서 정상 |
| 4 | flo-OAC 댐퍼 컨트롤러 정상 |
| 5 | LS M100 인버터 정상 |

### 7.5 status 메시지 구조 (게이트웨이)

| 필드 | 타입 | 설명 |
|------|------|------|
| gateway_id | string | 게이트웨이 ID |
| status_flags | int | 상태 플래그 (7비트, 비트마스크) |
| controller_count | int | 현재 연결된 컨트롤러 수 |
| timestamp | int | 발행 시간 (Unix epoch, 초) |

**status_flags 비트 정의 (Gateway)**

| 비트 | 의미 |
|------|------|
| 0 | SEN55 정상 (PM, 온습도, VOC, NOx) |
| 1 | SCD40 정상 (CO2) |
| 2 | O3 센서 정상 (SEN0321) |
| 3 | CO 센서 정상 (SEN0466) |
| 4 | HCHO 센서 정상 (SFA30) |
| 5 | 1개 이상 컨트롤러 연결됨 |
| 6 | 페어링 모드 |

### 7.6 control 명령 구조

**제어 대상 (target)**

| target | action | value | 설명 |
|--------|--------|-------|------|
| 0 (파워팩) | 0 | - | 파워팩 OFF |
| 0 (파워팩) | 1 | - | 파워팩 ON |
| 0 (파워팩) | 2 | - | 파워팩 리셋 |
| 1 (댐퍼) | 1 | 0-100 (int) | 댐퍼 개도율 설정 (%, 수동 모드) |
| 1 (댐퍼) | 2 | 0 또는 1 (int) | 제어 모드 전환 (0=수동, 1=자동) |
| 1 (댐퍼) | 3 | float (CMH) | 목표 풍량 설정 (자동 모드, 예: 850.0) |
| 2 (시로코팬) | 0 | - | 팬 OFF (수동) |
| 2 (시로코팬) | 1 | - | 팬 LOW (수동, 15Hz) |
| 2 (시로코팬) | 2 | - | 팬 MID (수동, 30Hz) |
| 2 (시로코팬) | 3 | - | 팬 HIGH (수동, 50Hz) |
| 2 (시로코팬) | 4 | 0 또는 1 (int) | 제어 모드 전환 (0=수동, 1=자동) |
| 2 (시로코팬) | 5 | float (m/s) | 목표 풍속 설정 (자동 모드, 예: 3.5) |

**댐퍼 제어 상세 (target=1)**

- `action=1`: flo-OAC를 Manual 모드로 전환 후 개도율(%)을 직접 설정. MQTT에서는 정수(0-100)로 전달, 컨트롤러에서 float로 변환.
- `action=2`: 댐퍼 제어 모드 전환. 자동 모드(1) 전환 시 flo-OAC Internal SV 모드 활성화 → 목표 풍량 기준으로 flo-OAC 자체 PID가 댐퍼 개도를 자동 조절.
- `action=3`: 자동 모드의 목표 풍량(CMH) 설정. 자동 모드가 아닌 경우 자동 모드로 자동 전환.

**시로코팬 제어 상세 (target=2)**

- `action=0~3`: 수동 속도 단계 제어. 자동 모드 중 수신 시 자동으로 수동 모드로 전환.
- `action=4`: 팬 제어 모드 전환. 자동 모드(1) 전환 시 M100 인버터 내장 PID 활성화 → 목표 풍속 기준으로 주파수(팬 속도)를 자동 가/감속. 피드백은 flo-OAC 실측 풍속(V_act) 사용.
- `action=5`: 자동 모드의 목표 풍속(m/s) 설정. 자동 모드가 아닌 경우 자동 모드로 자동 전환.

**일괄 제어 범위 지정**

| equipment_id | controller_id | 범위 |
|-------------|---------------|------|
| "all" | "all" | 게이트웨이 하위 전체 컨트롤러 |
| "esp-001" | "all" | 해당 집진기 하위 컨트롤러만 |
| "esp-001" | "ctrl-001" | 특정 컨트롤러 지정 |

### 7.7 control/ack 응답 구조

| 필드 | 타입 | 설명 |
|------|------|------|
| cmd_id | string | 명령 ID (요청과 매칭, UUID) |
| result | string | "success" 또는 "fail" |
| reason | string | 실패 시 사유 (성공 시 빈 문자열) |

### 7.8 config 명령 구조 (Cloud → Gateway)

게이트웨이의 런타임 설정을 원격으로 변경한다. **부분 업데이트(partial update)** 지원: 포함된 필드만 변경됨.

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| cmd_id | string | 필수 | 명령 ID (config/ack 매칭용, UUID 권장) |
| site_id | string | 선택 | 매장 ID 변경 (NVS 저장, 재부팅 필요) |
| floor_id | string | 선택 | 층 ID 변경 (NVS 저장, 재부팅 필요) |
| gateway_id | string | 선택 | 게이트웨이 ID 변경 (NVS 저장, 재부팅 필요) |
| sensor_interval_ms | int | 선택 | 센서 폴링 주기 (ms, 1000~60000, 기본 5000) |
| mqtt_interval_ms | int | 선택 | MQTT 발행 주기 (ms, 5000~60000, 기본 10000) |
| mqtt_broker_uri | string | 선택 | MQTT 브로커 URI (NVS 저장, 재부팅 필요) |
| wifi_ssid | string | 선택 | Wi-Fi SSID (NVS 저장, 재부팅 필요) |
| wifi_password | string | 선택 | Wi-Fi 비밀번호 (NVS 저장, 재부팅 필요) |
| reboot | bool | 선택 | true 시 즉시 재부팅 수행 |

**필드 분류**:
- **즉시 적용** (재부팅 불필요): `sensor_interval_ms`, `mqtt_interval_ms`
- **NVS 저장 + 재부팅 필요**: `site_id`, `floor_id`, `gateway_id`, `mqtt_broker_uri`, `wifi_ssid`, `wifi_password`

**자동 재부팅 동작**: 재부팅 필요 필드 변경 시 → NVS 저장 → config/ack(`needs_reboot: true`) → 1초 대기 → 자동 재부팅

**유효성 검증**:

| 필드 | 검증 규칙 | 실패 시 |
|------|----------|---------|
| sensor_interval_ms | 1000 ≤ value ≤ 60000 | "fail" + 사유 |
| mqtt_interval_ms | 5000 ≤ value ≤ 60000 | "fail" + 사유 |
| 문자열 필드 | 빈 문자열 불가 | "fail" + 사유 |
| cmd_id | 누락 시 | 메시지 무시 (ACK 불가) |

### 7.9 config/ack 응답 구조 (Gateway → Cloud)

| 필드 | 타입 | 설명 |
|------|------|------|
| cmd_id | string | 명령 ID (요청과 매칭) |
| result | string | "success" 또는 "fail" |
| reason | string | 실패 시 사유 (성공 시 빈 문자열) |
| needs_reboot | bool | true이면 ACK 발행 후 자동 재부팅 예정 |

### 7.10 자동 제어 동작 규칙

**댐퍼 자동 제어 (flo-OAC)**:
- flo-OAC 하드웨어가 자체 PID로 댐퍼 개도를 조절. 컨트롤러 펌웨어는 모드 전환과 목표 풍량 전달만 수행.
- 서버에서 목표 풍량(CMH) 설정 → 펌웨어가 flo-OAC Internal SV 모드 전환 → flo-OAC 자체 풍량 센서 피드백 기반 댐퍼 개도 자동 조절.

**시로코팬 자동 제어 (M100 인버터)**:
- M100 인버터 내장 PID를 활용. 컨트롤러 펌웨어가 flo-OAC에서 읽은 실측 풍속(V_act)을 인버터 PID 피드백 레지스터에 주기적으로 전달.
- 서버에서 목표 풍속(m/s) 설정 → 펌웨어가 M100 PID 기준값 레지스터(AP.19)에 기록 → 실측 풍속을 PID 피드백 레지스터(AP.18)에 기록 → 인버터가 주파수 자동 가/감속.
- PID 게인(P/I/D)은 인버터 파라미터(AP.22~AP.24)로 설정, 현장 시운전 시 조정.

**자동 → 수동 전환**:
- 모드 전환 명령(댐퍼 action=2/value=0, 팬 action=4/value=0) 또는 수동 명령(댐퍼 action=1, 팬 action=0~3) 수신 시 자동 모드 해제.

**안전 오버라이드**:
- 비상정지(ESTOP), 스파크 감지, 과온도 알람 발생 시 → 컨트롤러가 자동으로 팬/댐퍼 자동 모드를 해제(수동 전환).
- 이후 센서 데이터의 `fan_mode`, `damper_mode` 필드가 0으로 변경되어 대시보드에서 확인 가능.

---

## 8. 개발 환경 설정

### 8.1 필수 도구

| 도구 | 버전 | 용도 |
|------|------|------|
| Node.js | 20.x LTS | 런타임 |
| npm 또는 yarn | 최신 | 패키지 관리 |
| VS Code | 최신 | IDE (권장) |
| Git | 최신 | 버전 관리 |

### 8.2 프론트엔드 프로젝트 초기화

```bash
# 프로젝트 생성
npm create vite@latest esp-admin -- --template react-ts

# 핵심 의존성 설치
cd esp-admin
npm install react-router-dom                   # 라우팅
npm install zustand                             # 클라이언트 상태관리
npm install @tanstack/react-query               # 서버 상태관리
npm install antd @ant-design/icons              # UI 컴포넌트
npm install echarts echarts-for-react           # 차트
npm install axios                               # HTTP 클라이언트
npm install dayjs                               # 날짜 처리
npm install leaflet react-leaflet @types/leaflet # 지도

# 개발 의존성
npm install -D @types/react @types/react-dom
npm install -D eslint prettier
```

### 8.3 VS Code 권장 확장

- ESLint, Prettier
- TypeScript Importer
- Tailwind CSS IntelliSense (Ant Design과 혼용 시)

---

## 9. 다음 단계 (프롬프트 순서)

이 아키텍처 문서가 확정되면, 다음 순서로 프롬프트를 진행한다:

| 순서 | 프롬프트 | 산출물 |
|:---:|---------|--------|
| 1 | **B-1. DB 스키마 설계** | Prisma schema 또는 SQL DDL |
| 2 | **C-1. REST API 설계** | API 엔드포인트 명세 (Swagger 기반) |
| 3 | **D-1. MQTT 통신 연동 설계** | 토픽 구조, Payload 파싱 로직 |
| 4 | **0. 공통 레이아웃/컴포넌트** | AppLayout, Header, Sidebar, StatusTag 등 |
| 5~18 | **1~14. 화면별 구현** | 각 페이지 .tsx 파일 + Mock 데이터 |

---

*끝.*
