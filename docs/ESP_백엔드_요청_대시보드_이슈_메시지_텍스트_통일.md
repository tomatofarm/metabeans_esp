# ESP 백엔드 요청 — 대시보드 이슈 시각 표시 통일

> 작성일: 2026-05-21  
> 관련 화면: 전체 대시보드 이슈 테이블 (Admin/Dealer/HQ/Owner 공통)  
> 관련 API: `GET /dashboard/issues`, `GET /dashboard/stores/:storeId`

---

## `message` 필드 — "마지막 수신" → "발생 시각" 텍스트 변경

### 이유

프론트엔드 UI의 컬럼명이 **'발생시각'** 으로 통일되었습니다.  
`message` 필드에 포함된 `마지막 수신` 표현도 동일하게 맞춰 주시기 바랍니다.

### 요청

| 현재 | 변경 후 |
|------|---------|
| `마지막 수신: 2026-05-18 00:00:00` | `발생 시각: 2026-05-18 00:00:00` |
| `마지막 수신: 2026-05-19 14:32:00 (1일 이상 끊김)` | `발생 시각: 2026-05-19 14:32:00 (1일 이상 끊김)` |

### 적용 대상 API

| 엔드포인트 | 필드 |
|-----------|------|
| `GET /dashboard/issues` | 각 항목의 `message` 필드 |
| `GET /dashboard/stores/:storeId` | `issues[]` 각 항목의 `message` 필드 |

---

## 관련 프론트 파일

| 파일 | 변경 내용 |
|------|----------|
| `esp-admin/src/utils/formatters.ts` | `formatDateTime` — `dayjs.utc(v).local().format('YYYY-MM-DD HH:mm:ss')` |
| `esp-admin/src/pages/dashboard/OwnerDashboardPage.tsx` | 발생시각 컬럼 `formatDateTime` 적용 |
| `esp-admin/src/pages/dashboard/SelectedStoreDashboardPage.tsx` | 발생시각 컬럼 `formatDateTime` 적용 |
| `esp-admin/src/pages/dashboard/components/IssuePanel.tsx` | 발생시각 `formatDateTime` 적용 |
| `esp-admin/src/pages/dashboard/components/EmergencyAlarmPanel.tsx` | 발생시각 `formatDateTime` 적용 |
