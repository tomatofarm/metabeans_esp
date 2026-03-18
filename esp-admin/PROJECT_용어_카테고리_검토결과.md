# docs/ + esp-admin/ 전체 검수 결과

> **검토일**: 2025-03-16  
> **대상**: `docs/` (12개 문서), `esp-admin/` (src 110개 + 설정 파일)

---

## 1. 전체 요약

| 구분 | docs/ | esp-admin/ |
|------|-------|------------|
| 검토 대상 | 12개 .md | 110개 .ts/.tsx + 설정 |
| 문서↔코드 불일치 | 5건 (파일명/참조) | 0건 |
| 누락 참조 | HTML 레퍼런스 10+개 없음 | - |
| PROJECT_용어_카테고리 | - | 110개 전부 존재 ✅ |

**결론**: esp-admin 코드는 문서와 일치. docs/ 내부에 파일명·참조 불일치 있음.

---

## 2. 파일별 검증 결과

### 2.1 문서 등록 파일 → 실제 존재 여부

모든 카테고리(1~26)에 등록된 파일 경로를 검증한 결과, **110개 전부 존재**합니다.

| 카테고리 | 검증 파일 수 | 결과 |
|----------|-------------|------|
| 1. 로그인 페이지 | 6 | ✅ |
| 2. 비밀번호 찾기/변경 | 4 | ✅ |
| 3. 회원가입 | 11 | ✅ |
| 4. 대시보드 | 17 | ✅ |
| 5. 장비관리 | 6 | ✅ |
| 6. 장비 정보 | 4 | ✅ |
| 7. 실시간 모니터링 | 7 | ✅ |
| 8. 장치 제어 | 7 | ✅ |
| 9. 이력 조회 | 7 | ✅ |
| 10. A/S 관리 | 10 | ✅ |
| 11. 고객현황 | 6 | ✅ |
| 12. 시스템관리 | 9 | ✅ |
| 13. 공통 레이아웃 | 4 | ✅ |
| 14. 공통 UI 컴포넌트 | 6 | ✅ |
| 15. 차트 | 3 | ✅ |
| 16. API 레이어 | 9 | ✅ |
| 17. Mock 데이터 | 10 | ✅ |
| 18. 타입 정의 | 9 | ✅ |
| 19. 유틸리티 | 4 | ✅ |
| 20. 스토어 | 3 | ✅ |
| 21. 훅 | 4 | ✅ |
| 22. 라우팅 | 1 | ✅ |
| 23. 진입점/설정 | 5 | ✅ |

---

## 3. 문서에 없는 파일 (기능 카테고리 불필요)

| 파일 | 설명 | 권장 |
|------|------|------|
| `vite-env.d.ts` | Vite 환경 타입 선언 (/// &lt;reference&gt;) | 카테고리 추가 불필요 |
| `tsconfig.app.json` | Vite용 tsconfig 확장 | 카테고리 추가 불필요 |

→ 설정/빌드용 파일로, 수정 요청 대상이 아니므로 문서에 넣지 않아도 됩니다.

---

## 4. 타입/역할 설명 보완 제안

### 4.1 control.types.ts (섹션 8)

**현재**: `ControlTarget, SendControlRequest, DAMPER_STEPS, FAN_ACTIONS`

**실제 export**: `POWERPACK_ACTIONS`, `DAMPER_ACTIONS`, `FAN_ACTIONS`, `DAMPER_STEPS`, `SendControlRequest`, `MqttControlPayload`, `ConfigCommand` 등

**제안**: `DAMPER_STEPS, FAN_ACTIONS` 외에 `POWERPACK_ACTIONS`, `DAMPER_ACTIONS` 추가

### 4.2 장비 트리 (섹션 5, 25)

**현재**: "장비 트리 | Sidebar.tsx (트리 구조)"

**확인**: `StoreTree.tsx`는 없고, 트리 UI는 `Sidebar.tsx`에 구현됨. 문서 내용이 맞음.

---

## 5. 경로 기준 명시 제안

문서의 파일 경로는 `esp-admin/src/` 기준 상대 경로입니다. 사용 방법에 다음 문장 추가를 권장합니다:

> 파일 경로는 `esp-admin/src/` 기준입니다. 예: `pages/auth/LoginPage.tsx` → `esp-admin/src/pages/auth/LoginPage.tsx`

---

## 6. 역할별 접근 요약(섹션 26) 검증

| 항목 | 문서 내용 | 코드 검증 |
|------|----------|----------|
| canRegister | ADMIN, DEALER | ✅ EquipmentPage.tsx `isAdmin \|\| isDealer` |
| canControl | ADMIN, DEALER, HQ (OWNER 403) | ✅ DeviceControlPage.tsx `isOwner` 시 403 |
| canEdit | ADMIN, DEALER | ✅ EquipmentInfoPage.tsx `isAdmin \|\| isDealer` |
| roleMenuMap | ADMIN 5개, 나머지 3개 | ✅ roleHelper.ts |

---

## 7. 최종 권장사항

1. **즉시 반영 불필요**: 현재 문서로 수정 요청 매핑에 문제 없음.
2. **선택 보완**: 
   - control.types.ts 설명에 `POWERPACK_ACTIONS`, `DAMPER_ACTIONS` 추가
   - 사용 방법에 경로 기준(`esp-admin/src/`) 명시

---

# Part 2. docs/ 폴더 검수

## 8. docs/ 파일 목록 (12개)

| 파일 | 용도 |
|------|------|
| UI_00_공통기반.md | CSS 변수, StatusBadge, Header, Sidebar |
| UI_01_로그인_회원가입.md | 로그인, 4종 회원가입 |
| UI_02_대시보드.md | 요약 카드, IAQ, 이슈, A/S 패널 |
| UI_03_장비관리_정보_모니터링.md | 장비정보, 실시간 모니터링 |
| UI_04_장비관리_제어_이력.md | 장치 제어, 이력 조회 |
| UI_05_AS관리.md | A/S 4탭 |
| UI_06_고객현황.md | 고객 목록, 지도 |
| UI_07_시스템관리.md | 권한, 승인, 사용자, 기준수치 |
| MetaBeans_ESP_프로젝트_아키텍처_기술스택_정의서_최신.md | 아키텍처 |
| MetaBeans_ESP_데이터구조_정의서__최신.md | DB, MQTT 스키마 |
| MetaBeans_ESP_REST_API_엔드포인트_설계서__최신.md | 83개 API |
| MetaBeans_ESP_MQTT_통신_프로토콜_설계서__최신.md | MQTT 토픽, 페이로드 |

**참고**: `auth-guide.md` (빈 파일) — docs/ glob에 미포함. 별도 확인 필요.

## 9. docs/ ↔ esp-admin 불일치

### 9.1 파일명 불일치 (docs가 잘못된 이름 사용)

| docs 문서 | 문서에 적힌 이름 | esp-admin 실제 파일 |
|-----------|-----------------|---------------------|
| UI_00_공통기반 | StoreTree | **없음** — Sidebar.tsx에 트리 포함 |
| UI_00_공통기반 | globals.css | index.css 사용 (문서에 "또는 index.css" 옵션 있음 ✅) |
| UI_04_장비관리_제어_이력 | ControlPage.tsx | **DeviceControlPage.tsx** |
| UI_07_시스템관리 | SystemManagementPage.tsx | **SystemPage.tsx** |
| 아키텍처 정의서 | StoreTree.tsx | **없음** — Sidebar.tsx |

### 9.2 참조 HTML 파일 없음

UI 문서들이 참조하는 HTML 레퍼런스가 **docs/에 없음**:

| 문서 | 참조 HTML | 존재 |
|------|-----------|------|
| UI_01 | ESP_로그인.html | ❌ |
| UI_01 | ESP_매장점주_회원가입.html 등 | ❌ |
| UI_02 | ESP_매장본사_대시보드__1_.html | ❌ |
| UI_03 | ESP_관리자_장비관리_8_.html | ❌ |
| UI_04 | ESP_관리자_장비관리_8_.html | ❌ |
| UI_05 | ESP_관리자_AS관리__1_.html | ❌ |
| UI_06 | ESP_관리자_고객현황__1_.html | ❌ |
| UI_07 | ESP_시스템관리__1_.html | ❌ |

→ 레퍼런스 HTML은 별도 디렉터리/외부에 있거나, 미제공 상태일 수 있음.

## 10. docs 권장 수정 (✅ 반영 완료)

| 우선순위 | 수정 내용 | 상태 |
|----------|----------|------|
| 중 | UI_04: ControlPage → DeviceControlPage | ✅ |
| 중 | UI_07: SystemManagementPage → SystemPage | ✅ |
| 하 | UI_00: StoreTree → Sidebar (트리 포함) 명시 | ✅ |
| 하 | 아키텍처 정의서: StoreTree.tsx 제거 (Sidebar에 포함) | ✅ |
| 하 | CLAUDE.md: Vite 5.x → 6.x | ✅ |

---

# Part 3. esp-admin/ 전체 검수

## 11. esp-admin 구조 (node_modules 제외)

- **src/**: 110개 .ts/.tsx (PROJECT_용어_카테고리.md에 전부 등록됨 ✅)
- **설정**: package.json, vite.config.ts, tsconfig.json, tsconfig.app.json, vite-env.d.ts, index.html
- **문서**: PROJECT_용어_카테고리.md, PROJECT_용어_카테고리_검토결과.md

## 12. CLAUDE.md vs package.json

| 항목 | CLAUDE.md | package.json |
|------|-----------|--------------|
| Vite | 5.x | **6.1.0** |
| React | 18.x | 18.3.1 ✅ |

→ Vite 버전 문서 업데이트 권장 (6.x).
