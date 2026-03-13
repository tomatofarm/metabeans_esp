# UI 개선 프롬프트 #05 — A/S 관리

## ⚠️ 선행 조건
UI_00_공통기반 프롬프트 실행 완료 후 진행.

## 작업 범위
- `ASAlertListPage.tsx` (탭 1: 알림 현황)
- `ASRequestPage.tsx` (탭 2: A/S 접수)
- `ASStatusPage.tsx` (탭 3: 처리 현황)
- `ASReportPage.tsx` (탭 4: 완료 보고서)
- A/S 신청 모달, 대리점 배정 모달

## 레퍼런스
`docs/ESP_관리자_AS관리__1_.html` 읽고 참고할 것.

---

## 1. 탭 메뉴 (A/S 관리 4탭)

```
탭 컨테이너:
  display flex, gap 4px
  background white, padding 6px
  border-radius 10px, box-shadow var(--card-shadow), margin-bottom 20px

각 탭:
  padding 10px 20px, border-radius 6px
  font-weight 500, color var(--color-mid), cursor pointer
  transition all 0.2s

  hover:  background #F1F5F9
  active: background var(--color-primary), color white
```

---

## 2. 필터 바 (공통)

```
display flex, align-items center, gap 12px, flex-wrap wrap
background white, padding 16px 20px
border-radius 12px, box-shadow var(--card-shadow), margin-bottom 20px

검색 박스:
  position relative
  input: padding 10px 14px 10px 36px
         border 1.5px solid var(--color-border), border-radius 8px
         focus: border-color var(--color-primary), 파란 글로우
  아이콘: position absolute, left 12px, color var(--color-light)

필터 드롭다운 (상태/기간/대리점):
  padding 10px 14px, border 1.5px solid var(--color-border)
  border-radius 8px, background white, color var(--color-dark)
  appearance none (커스텀 화살표)
  focus: border-color var(--color-primary)
```

---

## 3. A/S 목록 테이블 (공통)

```
테이블 컨테이너:
  background white, border-radius 12px
  padding 20px, box-shadow var(--card-shadow)

테이블 헤더:
  background var(--color-bg), padding 14px 16px
  font-size 0.85rem, color var(--color-mid), font-weight 600
  border-bottom 2px solid var(--color-border)
  정렬 가능 컬럼: cursor pointer
  hover: background var(--color-bg-hover)

테이블 행:
  padding 14px 16px, border-bottom 1px solid #F1F5F9
  font-size 0.9rem, color #475569
  hover: background var(--color-bg), cursor pointer
  transition background 0.15s
```

### 상태 배지 (A/S 처리 단계)
StatusBadge 컴포넌트 적용, 각 단계 매핑:
```
PENDING     → info    "접수"
ACCEPTED    → info    "확인"
ASSIGNED    → warning "배정"
VISIT_SCHEDULED → warning "방문예정"
IN_PROGRESS → warning "처리중"
COMPLETED   → success "완료"
```

### 우선순위 배지 (긴급/일반)
```
긴급: background var(--color-danger-bg), color var(--color-danger-text)
일반: background var(--color-success-bg), color var(--color-success-text)
pill 형태 (border-radius 20px)
```

---

## 4. 알림 현황 탭 (ASAlertListPage)

알람 이벤트 목록 (테이블 대신 카드 리스트):
```
각 알람 카드:
  display flex, align-items flex-start, gap 12px
  padding 14px, border-radius 10px, margin-bottom 8px
  border-left 4px solid (Yellow/Red 기준)

  CRITICAL: border-left-color var(--color-danger), background #FFF5F5
  WARNING:  border-left-color var(--color-warning), background #FFFBEB
  BAD:      border-left-color #94A3B8, background var(--color-bg)

  내용:
    [좌] 상태 아이콘 원형 (32x32)
    [중] 알람 유형 (font-weight 600) + 매장/집진기명 + 발생 시각
    [우] 확인/해소 버튼
```

---

## 5. A/S 신청 모달

```
오버레이: position fixed, background rgba(0,0,0,0.5), z-index 2000
          display flex, align-items center, justify-content center

모달:
  background white, border-radius 16px
  width 520px, max-width 90%
  max-height 80vh, overflow hidden
  box-shadow 0 20px 40px rgba(0,0,0,0.2)
  animation: slideUp 0.3s ease

모달 헤더:
  background linear-gradient(135deg, var(--color-primary), var(--color-secondary))
  color white, padding 20px 24px
  display flex, justify-content space-between, align-items center
  제목: font-size 1.1rem, font-weight 700

모달 본문:
  padding 24px, overflow-y auto

폼 그룹 (모달 내부):
  margin-bottom 20px
  라벨: font-size 0.85rem, font-weight 600, color var(--color-dark), margin-bottom 8px
  인풋/셀렉트: 로그인 인풋과 동일 스타일
  필수 *: color var(--color-danger)

모달 하단 버튼:
  padding 16px 24px, border-top 1px solid var(--color-border)
  display flex, justify-content flex-end, gap 12px
  취소: secondary 버튼 스타일, 확인: primary 버튼 스타일
```

---

## 6. 버튼 스타일 공통

```
primary 버튼:
  background var(--color-primary), color white
  border none, padding 10px 20px, border-radius 8px
  font-weight 600, cursor pointer, transition all 0.2s
  hover: background var(--color-secondary)

secondary 버튼:
  background #E2E8F0, color var(--color-mid)
  border none, padding 10px 20px, border-radius 8px
  hover: background #CBD5E1

danger 버튼:
  background var(--color-danger), color white
  hover: background #DC2626

버튼 아이콘 + 텍스트: display inline-flex, align-items center, gap 6px
```

---

## 완료 기준
- [ ] 탭 버튼 active/hover 상태 명확 구분
- [ ] 필터 바 (검색 + 드롭다운) 가로 정렬
- [ ] A/S 테이블 헤더 회색 배경 / 행 hover
- [ ] 상태 배지 7단계 색상 pill 형태
- [ ] 알람 카드 좌측 컬러 보더 (CRITICAL/WARNING/BAD)
- [ ] 모달 헤더 그라데이션 + slideUp 애니메이션
- [ ] 기능(A/S 접수, 배정, 보고서 작성)에 영향 없음
