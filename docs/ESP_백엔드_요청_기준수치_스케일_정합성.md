# ESP 백엔드 요청 — 기준수치 스케일 정합성 수정

> 작성일: 2026-05-29  
> 관련 화면: 시스템관리 > 기준수치 관리, 장비별 대시보드, 실시간 모니터링  

---

## 배경

v3.2에서 `pp_spark` 범위가 **0-99 → 0-9999**로 확대됐습니다 (파워팩 rev2.1 대응).  
그러나 DB의 `monitoring_thresholds` 테이블에 저장된 스파크 기준값이 구 스케일(0-99 기준)로 그대로 남아있어,  
프론트엔드에서 실제 센서값과 기준값을 비교할 때 **상태가 의도대로 변하지 않는 문제**가 발생합니다.

### 현상

```
기준수치 관리 화면: 스파크 주의 기준 = 30, 위험 기준 = 60  (구 스케일 값)
실제 pp_spark 센서값 = 40  (0-9999 스케일)
→ 40 >= 30 이므로 Yellow 표시됨 (우연히 동작)

그러나 의도한 기준이 "3000 이상이면 주의"라면 완전히 잘못된 기준으로 판정 중
```

---

## 요청 사항

### 1. DB 기준값 마이그레이션

#### 1-1. 스파크 스케일 수정

`monitoring_thresholds` 테이블의 스파크 행:

| 필드 | 구 값 (0-99 스케일) | 신 값 (0-9999 스케일) |
|------|---------------------|----------------------|
| `yellow_min` | 30 | **3000** |
| `red_min` | 60 | **7000** |

```sql
UPDATE monitoring_thresholds
SET yellow_min = 3000, red_min = 7000
WHERE metric_name IN ('스파크', 'pp_spark', 'spark');
```

#### 1-2. PM2.5 / PM10 기준값 확인 및 설정

먼지 제거 성능 화면 신규 추가에 따라, PM2.5/PM10 기준값이 아래 범위로 설정되어 있는지 확인 요청드립니다.

**PM2.5 권장 기준값 (WHO 기준 참고):**

| 상태 | 범위 | `yellow_min` / `red_min` 설정 |
|------|------|-------------------------------|
| 좋음 (Green) | PM2.5 < 26 µg/m³ | — |
| 보통 (Yellow) | 26 ≤ PM2.5 < 51 µg/m³ | `yellow_min = 26` |
| 점검 필요 (Red) | PM2.5 ≥ 51 µg/m³ | `red_min = 51` |

**PM10 권장 기준값:**

| 상태 | 범위 | `yellow_min` / `red_min` 설정 |
|------|------|-------------------------------|
| 좋음 (Green) | PM10 < 51 µg/m³ | — |
| 보통 (Yellow) | 51 ≤ PM10 < 101 µg/m³ | `yellow_min = 51` |
| 점검 필요 (Red) | PM10 ≥ 101 µg/m³ | `red_min = 101` |

```sql
UPDATE monitoring_thresholds
SET yellow_min = 26, red_min = 51
WHERE metric_name IN ('PM2.5', 'pm2_5');

UPDATE monitoring_thresholds
SET yellow_min = 51, red_min = 101
WHERE metric_name IN ('PM10', 'pm10');
```

> 실제 컬럼명·테이블명은 백엔드 스키마에 맞게 조정 필요.  
> 위 수치는 권장값이며, 현장 환경에 맞게 조정 가능합니다.

### 2. 기준수치 관리 UI 입력 범위 안내 수정

현재 기준수치 관리 화면의 스파크 입력 필드에 별도 안내 문구가 없어 구 스케일로 입력할 위험이 있습니다.  
API 응답에 `unit` 또는 `hint` 필드로 범위 안내를 추가해 주세요.

```json
{
  "metricName": "스파크",
  "unit": "(0-9999)",
  "yellowMin": 3000,
  "redMin": 7000
}
```

---

## 참고: 프론트엔드 수정 완료 사항

이번 이슈와 함께 프론트엔드에서 다음을 수정했습니다:

| 파일 | 수정 내용 |
|------|-----------|
| `esp-admin/src/pages/dashboard/EquipmentDashboardPage.tsx` | `getBoardTempLevel`, `getSparkLevel`, `getInletTempLevel` 호출 시 하드코딩 기본값 사용 → `GET /system/thresholds` 에서 가져온 설정값 사용으로 변경 |

기존에는 장비별 대시보드 페이지의 파워팩 상태 테이블과 센서 상세 카드에서 시스템 기준수치 설정이 완전히 무시되고 하드코딩된 기본값(보드온도 60/80°C, 스파크 3000/7000, 유입온도 70/100°C)만 사용됐습니다.

---

## 전수 조사 결과

전체 코드에서 상태 판정 함수가 기준수치 설정값을 무시하는 곳을 조사한 결과:

| 화면 | 기준수치 반영 여부 |
|------|------------------|
| 실시간 모니터링 (`RealtimeMonitorPage`) | ✅ 정상 반영 |
| 화재감지 센서 (`FireSensorSection`) | ✅ 정상 반영 |
| 장비별 대시보드 (`EquipmentDashboardPage`) | ✅ **이번 수정으로 정상 반영** |

PM2.5, PM10은 `DustRemovalSection`(먼지 제거 성능)에서 기준수치 설정값 반영 — 장비 기본 상태 카드에서 분리.

---

## 관련 파일

| 파일 | 역할 |
|------|------|
| `esp-admin/src/utils/statusHelper.ts` | `getSparkLevel`, `getBoardTempLevel`, `getInletTempLevel` 판정 함수 |
| `esp-admin/src/pages/dashboard/EquipmentDashboardPage.tsx` | 장비별 대시보드 — 이번 수정 파일 |
| `esp-admin/src/pages/equipment/components/ControllerBasicStatusSection.tsx` | 실시간 모니터링 — 장비 기본 상태 (PM2.5/PM10 제거됨) |
| `esp-admin/src/pages/equipment/components/DustRemovalSection.tsx` | 먼지 제거 성능 신규 섹션 (PM2.5 + PM10, 기준수치 반영) |
