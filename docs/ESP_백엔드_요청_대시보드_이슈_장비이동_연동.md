# ESP 백엔드 요청 — 대시보드 이슈 클릭 시 장비관리 이동 연동

> 작성일: 2026-05-21  
> 관련 화면: 전체 대시보드 이슈 패널 (Admin/Dealer/HQ/Owner 공통)  
> 관련 프론트 변경: `DashboardPage.tsx`, `IssuePanel.tsx`, `OwnerDashboardPage.tsx`, `SelectedStoreDashboardPage.tsx`

---

## 배경

대시보드 이슈 패널에서 장비명을 클릭하면 해당 장비의 **장비 정보 탭**으로 직접 이동하도록 프론트엔드가 수정되었습니다.

이동 시 동작:
1. `selectStore(storeId)` — 사이드바에 해당 매장 자동 펼침
2. `selectEquipment(equipmentId)` — 해당 장비 선택
3. `navigate('/equipment')` — 장비 정보 탭으로 이동

이 기능이 정상 동작하려면 **이슈 응답의 각 항목에 `storeId`와 `equipmentId`가 반드시 포함**되어야 합니다.

---

## 요약

| # | 엔드포인트 | 변경 유형 | 내용 |
|---|------------|-----------|------|
| 1 | `GET /dashboard/issues` | 필드 확인 필수 | 각 항목에 `storeId`, `equipmentId` 반드시 포함 |
| 2 | `GET /dashboard/issues` | 타입 정렬 | `issueType` 열거값 및 `severity` 형식 프론트와 통일 |
| 3 | `GET /dashboard/issues` | 구조 변경 | 평탄 배열 → 카테고리별 그룹 반환 (권장) |
| 4 | `GET /dashboard/stores/:storeId` | 필드 확인 필수 | `issues[]` 배열 각 항목에도 `storeId`, `equipmentId` 포함 |

---

## 1. `storeId` · `equipmentId` 필수 포함 확인

### 이유

`selectStore(storeId)` 호출 없이는 사이드바가 올바른 매장으로 펼쳐지지 않고, `selectEquipment(equipmentId)` 없이는 장비 데이터를 로드할 수 없습니다.

### 현재 API 설계서 명세 (§3.2)

```json
{
  "issueId": 1001,
  "storeId": 101,
  "storeName": "김네식당 본점",
  "equipmentId": 201,
  "equipmentName": "ESP-001",
  ...
}
```

설계서에는 두 필드가 있으나, **실제 구현에서 누락되지 않도록 확인 바랍니다.**

### 프론트 타입 (`DashboardIssueItem`)

```typescript
export interface DashboardIssueItem {
  issueId: number;
  storeId: number;       // ← 장비 이동 시 selectStore()에 사용
  storeName: string;
  equipmentId: number;   // ← 장비 이동 시 selectEquipment()에 사용
  equipmentName: string;
  issueType: DashboardIssueType;
  severity: StatusLevel; // 'red' | 'yellow' | 'green'
  currentValue?: number;
  unit?: string;
  message: string;
  occurredAt: string;
}
```

---

## 2. `issueType` 열거값 통일 요청

### 현재 불일치

| 설계서 값 | 프론트 기대값 | 표시 레이블 |
|-----------|--------------|------------|
| `INLET_TEMP_HIGH` | `INLET_TEMP` | 유입 온도 이상 |
| `COMM_DISCONNECTED` | `COMM_ERROR` | 통신 연결 상태 점검 |
| `FILTER_CHECK_NEEDED` | `FILTER_CHECK` | 필터 청소 상태 점검 |
| `DUST_REMOVAL_LOW` | `DUST_REMOVAL` | 먼지제거 성능 점검 |

### 요청

백엔드가 아래 값으로 응답하거나, 프론트 실제 API 레이어(`dashboard.real.ts`)에서 매핑 처리합니다.  
**백엔드 응답 값을 확정해 주시면** 프론트 매핑 코드를 이에 맞게 작성하겠습니다.

---

## 3. `severity` 형식 통일 요청

### 현재 불일치

| 설계서 값 | 프론트 기대값 |
|-----------|--------------|
| `CRITICAL` | `'red'` |
| `WARNING` | `'yellow'` |

### 요청 (두 가지 방안 중 선택)

**방안 A (권장)**: 백엔드가 `'red'` / `'yellow'` 로 응답  
**방안 B**: 백엔드는 `CRITICAL` / `WARNING` 유지, 프론트 실제 API 레이어에서 변환

> 두 방안 모두 프론트 구현 가능. 방안 확정 시 알려주세요.

---

## 4. 응답 구조 — 카테고리별 그룹 반환 (권장)

### 현재 설계서 구조 (평탄 배열)

```json
{
  "data": [
    { "issueType": "INLET_TEMP", "equipmentId": 201, ... },
    { "issueType": "COMM_ERROR", "equipmentId": 202, ... },
    { "issueType": "INLET_TEMP", "equipmentId": 203, ... }
  ]
}
```

### 프론트 기대 구조 (`DashboardIssueCategory[]`)

```json
{
  "data": [
    {
      "type": "COMM_ERROR",
      "label": "통신 연결 상태 점검",
      "description": "끊김 1시간 이상 주의 / 하루 이상 위험",
      "yellowCount": 1,
      "redCount": 2,
      "items": [
        { "issueId": 1001, "storeId": 101, "equipmentId": 201, "equipmentName": "ESP-001", "severity": "red", ... },
        { "issueId": 1002, "storeId": 101, "equipmentId": 202, "equipmentName": "ESP-002", "severity": "yellow", ... }
      ]
    },
    {
      "type": "INLET_TEMP",
      "label": "유입 온도 이상",
      "description": "70°C 이상 주의 / 100°C 이상 위험",
      "yellowCount": 0,
      "redCount": 1,
      "items": [
        { "issueId": 1003, "storeId": 102, "equipmentId": 203, "equipmentName": "ESP-001", "severity": "red", ... }
      ]
    }
  ]
}
```

### 카테고리 순서 및 고정 항목

카테고리는 항상 아래 4개를 순서대로 반환 (이슈 없어도 `items: []`로 포함):

| 순번 | `type` | `label` | `description` |
|------|--------|---------|--------------|
| 1 | `COMM_ERROR` | 통신 연결 상태 점검 | 끊김 1시간 이상 주의 / 하루 이상 위험 |
| 2 | `INLET_TEMP` | 유입 온도 이상 | 70°C 이상 주의 / 100°C 이상 위험 |
| 3 | `FILTER_CHECK` | 필터 청소 상태 점검 | 스파크·차압 기준 초과 시 주의 |
| 4 | `DUST_REMOVAL` | 먼지제거 성능 점검 | PM2.5·PM10 기준 초과 시 위험 |

> **백엔드 그룹핑이 어려운 경우**: 평탄 배열로 응답하고 `dashboard.real.ts`에서 클라이언트 측 그룹핑 처리 가능. 단, `2번(issueType 열거값)`과 `3번(severity 형식)`이 먼저 확정되어야 합니다.

---

## 5. `GET /dashboard/stores/:storeId` — 매장 내 이슈에도 동일 필드 필요

SelectedStoreDashboard(매장 선택 시 표시되는 단일 매장 대시보드)도 이슈 테이블에서 장비 클릭 이동을 지원합니다.  
이 화면은 `GET /dashboard/stores/:storeId` 응답의 `issues[]`를 사용하므로, 해당 배열 항목에도 `storeId`와 `equipmentId`가 포함되어야 합니다.

```json
{
  "storeId": 101,
  "storeName": "...",
  "equipments": [...],
  "issues": [
    {
      "issueId": 1001,
      "storeId": 101,      // ← 반드시 포함
      "equipmentId": 201,  // ← 반드시 포함
      "equipmentName": "ESP-001",
      ...
    }
  ],
  "recentAsRequests": [...]
}
```

---

## 우선순위

| 우선순위 | 항목 | 이유 |
|----------|------|------|
| **필수** | `storeId`, `equipmentId` 포함 (§1, §5) | 없으면 클릭 이동 자체가 동작 안 함 |
| **필수** | `issueType` 열거값 확정 (§2) | 프론트 타입 캐스팅 전 확정 필요 |
| **선택** | `severity` 형식 (§3) | 프론트 변환 처리 가능 |
| **선택** | 카테고리 그룹 구조 (§4) | 프론트 클라이언트 측 그룹핑 가능 |

---

## 관련 파일

| 파일 | 역할 |
|------|------|
| `esp-admin/src/types/dashboard.types.ts` | `DashboardIssueItem`, `DashboardIssueCategory` 타입 정의 |
| `esp-admin/src/pages/dashboard/DashboardPage.tsx` | `handleNavigateToEquipment(equipmentId, storeId)` — 이동 핸들러 |
| `esp-admin/src/pages/dashboard/components/IssuePanel.tsx` | 이슈 클릭 시 `storeId` 함께 전달 |
| `esp-admin/src/api/real/dashboard.real.ts` | Phase 2 연동 시 응답 변환 담당 (미생성) |
