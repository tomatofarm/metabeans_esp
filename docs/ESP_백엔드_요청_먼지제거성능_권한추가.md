# ESP 백엔드 요청 — 먼지 제거 성능 권한 코드 추가

> 작성일: 2026-05-29  
> 관련 화면: 장비관리 > 실시간 모니터링 > 먼지 제거 성능  

---

## 배경

실시간 모니터링 페이지에 **먼지 제거 성능** 섹션을 신규 추가했습니다.  
이 섹션은 기존 "장비 기본 상태" 카드에서 PM2.5/PM10 항목을 분리하여 독립 섹션으로 구성합니다.  
권한 관리 시스템에 아래 feature code가 새로 추가되었으므로, 백엔드 권한 테이블에도 반영이 필요합니다.

---

## 요청 사항

### `monitoring.dust_removal` feature code 추가

| 항목 | 값 |
|------|-----|
| feature code | `monitoring.dust_removal` |
| 라벨 | 먼지 제거 성능 |
| 카테고리 | 장비관리 |

### 역할별 기본 권한

| 역할 | 기본 허용 여부 |
|------|--------------|
| ADMIN | ✅ 허용 |
| DEALER | ✅ 허용 |
| HQ | ✅ 허용 |
| OWNER | ✅ 허용 |

기존 `monitoring.filter_status`(필터 점검 상태)와 동일한 기본 권한으로 설정 부탁드립니다.

### DB 반영 예시

```sql
-- feature_code 등록 (테이블명은 실제 스키마에 맞게 조정)
INSERT INTO feature_codes (code, label, category)
VALUES ('monitoring.dust_removal', '먼지 제거 성능', '장비관리');

-- 역할별 기본 권한 등록
INSERT INTO role_permissions (role, feature_code, is_allowed)
VALUES
  ('ADMIN',  'monitoring.dust_removal', true),
  ('DEALER', 'monitoring.dust_removal', true),
  ('HQ',     'monitoring.dust_removal', true),
  ('OWNER',  'monitoring.dust_removal', true);
```

---

## 관련 파일 (프론트 완료)

| 파일 | 내용 |
|------|------|
| `esp-admin/src/types/system.types.ts` | `FeatureCode` union 및 `FEATURE_CODE_LIST`에 `monitoring.dust_removal` 추가 |
| `esp-admin/src/pages/equipment/components/DustRemovalSection.tsx` | 신규 — PM2.5/PM10 상태 카드 (좋음/보통/점검 필요) |
| `esp-admin/src/pages/equipment/RealtimeMonitorPage.tsx` | `monitoring.dust_removal` 권한 체크 연결 |
