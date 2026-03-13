# MetaBeans ESP 관제시스템 - 데이터 구조 정의서

**문서 버전**: v3.2  
**작성일**: 2026-02-27  
**근거 문서** (우선순위순):
1. MQTT Payload 규격_260227_v2.pdf (2026-02-27, **최우선**)
2. MQTT 토픽 구조 변경 및 협의 사항.pdf (2026-02-13, **최우선**)
3. ESP 관리툴_최종피드백_260212.pdf (2026-02-12)
4. MetaBeans_ESP_데이터구조_정의서_v3.0.md (기반)
5. MetaBeans_ESP_관리툴_전체구조_기획서.docx (참조용)

---

## 변경 이력

| 버전 | 날짜 | 주요 변경 사항 |
|------|------|--------------|
| v1.0 | 2025-02-04 | 초기 작성 |
| v2.0 | 2025-02-04 | Q&A 기반 20건 수정 반영 |
| v3.0 | 2026-02-13 | MQTT 규격 260212 + 최종피드백 260212 전면 반영 |
| v3.1 | 2026-02-13 | MQTT 규격 260213 + 토픽 구조 변경 협의사항 반영 (댐퍼/시로코팬 자동제어, config 토픽 정의) |
| v3.2 | 2026-02-27 | MQTT 규격 260227_v2 반영 — oil_level float→int, pp_spark 범위 0-9999, fan_running/fan_freq/fan_target_pct/damper_ctrl 신규 필드, status 토픽 wifi 추가, status_flags bit5 복합 판정 |

### v3.0 주요 변경 내역

| # | 변경 대상 | 변경 내용 | 근거 |
|---|----------|---------|------|
| 1 | MQTT 토픽 | 게이트웨이 단위 통합 센서 메시지 구조 도입 (controller별 토픽 제거) | MQTT 규격 |
| 2 | MQTT 토픽 | heartbeat 토픽 제거 → status 토픽으로 대체 (10초 주기) | MQTT 규격 |
| 3 | MQTT 토픽 | alarm 토픽 제거 → pp_alarm 필드로 대체 | MQTT 규격 |
| 4 | MQTT 토픽 | config 토픽 추가 (추후 정의) | MQTT 규격 |
| 5 | MQTT QoS | QoS 2 → QoS 1 (AWS IoT Core QoS 2 미지원) | MQTT 규격 |
| 6 | MQTT 타임스탬프 | ISO 8601 → Unix epoch (초 단위) | MQTT 규격 |
| 7 | sensor 메시지 | gateway IAQ + 모든 하위 equipment/controller를 하나의 메시지로 통합 | MQTT 규격 |
| 8 | controller 필드 | blade_angle 제거 → damper로 통합, pp_temp int 확정 | MQTT 규격 |
| 9 | controller 필드 | pp_alarm, inlet_temp, velocity, duct_dp 추가 | MQTT 규격 |
| 10 | controller 필드 | fan_rpm, error_code 제거 | MQTT 규격 |
| 11 | status_flags | Controller 6비트, Gateway 7비트 비트 정의 확정 | MQTT 규격 |
| 12 | 제어 명령 | controller_id 대신 equipment_id + controller_id 조합, 일괄 제어 지원 | MQTT 규격 |
| 13 | 제어 대상 | target 1 = 댐퍼(flo-OAC), target 2 = 시로코팬 (블레이드 제거) | MQTT 규격 |
| 14 | 계층 구조 | Equipment 최대 5대/층, Controller 최대 4대/Equipment | MQTT 규격 + 피드백 p.50 |
| 15 | equipment | powerpack_count 최대 16 → 최대 4 | 피드백 p.50 |
| 16 | cell_types | 드롭다운 참조 테이블 제거 → 수동 입력(VARCHAR) | 피드백 p.36 |
| 17 | stores | business_type에 '커피로스팅' 추가 | 피드백 p.14, p.19 |
| 18 | user_business_info | 업태/업종 필드 삭제 | 피드백 p.9, p.15, p.20 |
| 19 | owner_profiles | store_scale(매장 규모) 삭제 | 피드백 p.21 |
| 20 | dealer_profiles | service_regions에 서울 동부/서부, 경기 동부/서부 추가 | 피드백 p.11 |
| 21 | 제어 | 운영 시간 설정 삭제 (전원, 방화셔터, 송풍기 모두) | 피드백 p.43~47 |
| 22 | 방화셔터 | 8단계(0~7) 개도율 매핑 확정, 자동제어 목표 풍량 추가 | 피드백 p.44~45 |
| 23 | A/S | 방문 희망 일시 필드 추가, 교체 부품 상세(품명/가격/수량) 필수 | 피드백 p.56, p.59 |
| 24 | A/S | cost → total_parts_cost (총부품비) 변경 | 피드백 p.59 |
| 25 | 고객현황 | 고객 상태 활성/비활성 구분 추가 | 피드백 p.62 |
| 26 | 권한 | 역할별 메뉴 권한 세분화 (실시간 모니터링/제어 하위 항목) | 피드백 p.63 |
| 27 | 기준수치 | 스파크 기준 시간 튜닝 변수 추가 | 피드백 p.66 |
| 28 | 대시보드 | 시스템 상태 삭제, 문제 발생 이슈 항목 정의 | 피드백 p.24, p.33~34 |
| 29 | 대시보드 | 실내공기질 정보는 이슈/알림에 표시 안 함 | 피드백 p.33 |
| 30 | 장비관리 | 담당 기사 → 담당 대리점으로 수정 | 피드백 p.36 |
| 31 | 장비관리 | 압력 이력 삭제 | 피드백 p.49 |
| 32 | 모니터링 | 필터 점검 상태(차압), 먼지제거 성능(PM2.5/PM10) 지표 추가 | 피드백 p.38~39 |
| 33 | 모니터링 | 통신 연결 상태 30초 기준 오류 판정 | 피드백 p.38 |
| 34 | gateway | heartbeat 관련 필드 제거, status 기반 연결 판정으로 변경 | MQTT 규격 |
| 35 | 데이터 갱신 | 센서 데이터 10초 주기 확정 (v2.0의 1분 간격 오류 수정) | MQTT 규격 |

### v3.1 주요 변경 내역 (MQTT 규격 260213 + 토픽 구조 변경 협의)

| # | 변경 대상 | 변경 내용 | 근거 |
|---|----------|---------|------|
| 36 | controller 센서 필드 | `fan_mode` (팬 제어 모드, 0=수동/1=자동) 필드 추가 | MQTT 규격 260213 |
| 37 | controller 센서 필드 | `damper_mode` (댐퍼 제어 모드, 0=수동/1=자동) 필드 추가 | MQTT 규격 260213 |
| 38 | controller 센서 필드 | `fan_speed` 설명 보완: "수동 모드에서만 유의미" 추가 | MQTT 규격 260213 |
| 39 | 제어 명령 (target=1 댐퍼) | action=2 (자동/수동 모드 전환), action=3 (목표 풍량 CMH 설정) 추가 | MQTT 규격 260213 |
| 40 | 제어 명령 (target=2 시로코팬) | action=4 (자동/수동 모드 전환), action=5 (목표 풍속 m/s 설정) 추가 | MQTT 규격 260213 |
| 41 | 제어 명령 value 타입 | int → **number** (int 또는 float), 목표 풍량/풍속은 float | MQTT 규격 260213 |
| 42 | config 토픽 | 페이로드 정의 확정 (sensor_interval_ms, mqtt_interval_ms, ID 변경, WiFi 설정 등) | MQTT 규격 260213 |
| 43 | config/ack 토픽 | config 응답 토픽 추가 (cmd_id, result, reason, needs_reboot) | MQTT 규격 260213 |
| 44 | 토픽 구조 | config/ack 서브토픽 추가 | MQTT 규격 260213 |
| 45 | 안전 오버라이드 | ESTOP/스파크/과온도 알람 시 자동→수동 전환 동작 정의 | MQTT 규격 260213 |
| 46 | 시로코팬 자동 제어 | M100 인버터 내장 PID 활용, 목표 풍속 기반 가/감속 제어 확인 | 토픽 구조 변경 협의 |
| 47 | 댐퍼 자동 제어 | flo-OAC Internal SV 모드 활용, 목표 풍량 기반 자동 개도 조절 확인 | 토픽 구조 변경 협의 |
| 48 | damper_auto_settings | target_velocity 컬럼 추가 (시로코팬 목표 풍속) | MQTT 규격 260213 |
| 49 | 설계 결정 | 제어 모드: 수동 전용 → **자동/수동 전환 지원** | MQTT 규격 260213 |


### v3.2 주요 변경 내역 (MQTT 규격 260227_v2)

| # | 변경 대상 | 변경 내용 | 근거 |
|---|----------|---------|------|
| 50 | controller 센서 필드 | `oil_level` 타입 변경: FLOAT (0-100%) → **INT** (0=정상, 1=만수) — 디지털 센서 실제 동작 반영 | MQTT 규격 260227_v2 |
| 51 | controller 센서 필드 | `pp_spark` 범위 확대: 0-99 → **0-9999** (파워팩 rev2.1 대응) | MQTT 규격 260227_v2 |
| 52 | controller 센서 필드 | `fan_running` 신규 추가: INT (0=정지, 1=운전중) — M100 인버터 RUN_STATUS 레지스터 기반 | MQTT 규격 260227_v2 |
| 53 | controller 센서 필드 | `fan_freq` 신규 추가: FLOAT Hz (0~50.00) — 인버터 실제 출력 주파수, 자동 모드 PID 출력 확인용 | MQTT 규격 260227_v2 |
| 54 | controller 센서 필드 | `fan_target_pct` 신규 추가: FLOAT % (0.0~100.0) — PID 목표값, fan_mode=1(자동) 시만 유의미 | MQTT 규격 260227_v2 |
| 55 | controller 센서 필드 | `damper_ctrl` 신규 추가: FLOAT % (0-100) — 댐퍼 제어 명령값(Damper_CTRL), 기존 damper는 피드백값(Damper_FB)으로 구분 | MQTT 규격 260227_v2 |
| 56 | status 메시지 | `wifi` 객체 추가: {ssid, rssi, ip, mac, channel} — 게이트웨이 Wi-Fi 연결 정보 | MQTT 규격 260227_v2 |
| 57 | Controller status_flags | bit 5 판정 변경: 단순 인버터 정상 → **RS-485 통신 정상 AND Fault Trip 없음** (복합 판정) | MQTT 규격 260227_v2 |
| 58 | cleaning_thresholds | spark_threshold 범위 주석 수정: 0~99 → 0~9999 (pp_spark 스케일 변경 반영) | MQTT 규격 260227_v2 |
| 59 | monitoring_thresholds | pp_spark 비고 수정: 0-99 → 0-9999 | MQTT 규격 260227_v2 |
| 60 | MySQL DDL | controller_sensor_data 테이블 — oil_level TINYINT, 신규 필드 4개 추가, wifi 컬럼 추가 | MQTT 규격 260227_v2 |


---

## 1. 시스템 개요

### 1.1 이해관계자 및 역할 정의

| 역할 코드 | 역할명 | 설명 |
|---------|-------|------|
| `ADMIN` | 본사 (시스템 관리자) | 시스템 전체 관리, 모든 매장 접근, 권한 설정 |
| `DEALER` | 지사/대리점 | 장비 설치/A/S, 관할 매장 관리 |
| `HQ` | 매장 본사 (프랜차이즈 관리자) | 관할 가맹점 모니터링, 운영 표준 점검 |
| `OWNER` | 매장 점주 | 본인 매장 모니터링, 장비 제어, A/S 요청 |

### 1.2 하드웨어 계층 구조 (MQTT 규격 260212 확정)

```
Site (매장)
  └── Floor (층)
       └── Gateway (게이트웨이, 층당 1대) ── IAQ 센서 내장
            └── Equipment (집진기, 층당 최대 5대)
                 └── Controller (파워팩, 집진기당 최대 4대)
```

**ID 형식** (MQTT 규격):
| 대상 | 타입 | 예시 | 설명 |
|------|------|------|------|
| site_id | string | "site-001" | 매장 식별자 |
| floor_id | string | "1F", "B1" | 층 식별자 |
| gateway_id | string | "gw-001" | 게이트웨이 식별자 |
| equipment_id | string | "esp-001" | 집진기(장비) 식별자 |
| controller_id | string | "ctrl-001" | 컨트롤러(파워팩) 식별자 |

> 모든 ID는 내부 고유번호를 사용하며, 설치 시 각 장비에 설정합니다.

### 1.3 주요 설계 결정 사항

| 항목 | v2.0 | v3.0/v3.1/v3.2 (변경) | 근거 |
|------|------|------------|------|
| MQTT 토픽 구조 | controller별 개별 토픽 | **게이트웨이 단위 통합** | MQTT 규격 260212 |
| 센서 전송 주기 | 1분 간격 | **10초 주기** | MQTT 규격 260212 |
| QoS | 2 | **1** (AWS IoT Core 제약) | MQTT 규격 260212 |
| 타임스탬프 | ISO 8601 | **Unix epoch (초)** | MQTT 규격 260212 |
| 알람 전달 방식 | 별도 alarm 토픽 | **pp_alarm 필드** | MQTT 규격 260212 |
| 통신 상태 판별 | Heartbeat ping/pong | **status 토픽 (10초 주기)** | MQTT 규격 260212 |
| 통신 오류 판정 | heartbeat_interval × 3 | **30초 미수신** | 피드백 p.38 |
| Controller 최대 수 | 16개/Equipment | **4개/Equipment** | 피드백 p.50 |
| Equipment 최대 수 | 미정의 | **5대/Floor** | MQTT 규격 260212 |
| 셀 타입 입력 | 드롭다운 (참조 테이블) | **수동 입력 (VARCHAR)** | 피드백 p.36 |
| 방화셔터 단계 | 1~8단계 | **0~7단계 (8단계)** | 피드백 p.44 |
| 제어 모드 | 수동 전용 | **자동/수동 전환 지원** (댐퍼: flo-OAC PID, 팬: M100 PID) | MQTT 규격 260213 |
| config 토픽 | 추후 정의 | **페이로드 정의 완료** (런타임 설정 원격 변경) | MQTT 규격 260213 |
| config/ack 토픽 | 미정의 | **응답 토픽 추가** (needs_reboot 포함) | MQTT 규격 260213 |
| pp_spark | 0~99 연속값 | **0~9999** (rev2.1 대응, MQTT 규격 260227_v2) | MQTT 규격 260227_v2 |
| 대리점↔매장 관계 | 1:N | 1:N (변경 없음) | |
| 권한 모델 | RBAC + 오버라이드 | RBAC + 오버라이드 (변경 없음) | |
| A/S 배정 | 대리점 단위 | 대리점 단위 (변경 없음) | |

---

## 2. 사용자/계정 관리

### 2.1 users (사용자 기본 정보)

| 컬럼명 | 타입 | 필수 | 설명 |
|--------|------|------|------|
| user_id | BIGINT (PK, AUTO) | ✅ | 사용자 고유 ID |
| login_id | VARCHAR(50) UNIQUE | ✅ | 로그인 아이디 |
| password_hash | VARCHAR(255) | ✅ | 비밀번호 해시 |
| role | ENUM('ADMIN','DEALER','HQ','OWNER') | ✅ | 사용자 역할 |
| name | VARCHAR(50) | ✅ | 담당자명 |
| phone | VARCHAR(20) | ✅ | 연락처 |
| email | VARCHAR(100) | | 이메일 (긴급알람 발송용) |
| account_status | ENUM('PENDING','ACTIVE','SUSPENDED','DELETED') | ✅ | 계정 상태 |
| approved_by | BIGINT (FK → users) | | 승인 처리자 |
| approved_at | DATETIME | | 승인 일시 |
| last_login_at | DATETIME | | 최근 로그인 일시 |
| created_at | DATETIME | ✅ | 생성 일시 |
| updated_at | DATETIME | ✅ | 수정 일시 |

**비즈니스 규칙**:
- 회원가입 시 account_status = 'PENDING' → 관리자 승인 후 'ACTIVE'
- ADMIN 계정은 일반 회원가입 경로와 완전 분리

### 2.2 user_business_info (사업자 정보)

| 컬럼명 | 타입 | 필수 | 설명 |
|--------|------|------|------|
| user_id | BIGINT (PK, FK → users) | ✅ | 사용자 ID |
| business_name | VARCHAR(100) | ✅ | 상호명 |
| business_number | VARCHAR(20) | ✅ | 사업자등록번호 |
| business_cert_file | VARCHAR(500) | | 사업자등록증 파일 경로 |
| business_cert_verified | BOOLEAN DEFAULT FALSE | | 사업자등록증 인증 여부 |
| address | VARCHAR(255) | ✅ | 사업장 주소 |

> **v3.0 변경**: 업태(business_category), 업종(business_sector) 필드 삭제 (피드백 p.9, p.15, p.20)

### 2.3 dealer_profiles (대리점 프로필)

| 컬럼명 | 타입 | 필수 | 설명 |
|--------|------|------|------|
| dealer_id | BIGINT (PK, FK → users.user_id) | ✅ | 대리점 사용자 ID |
| service_regions | JSON | ✅ | 서비스 가능 지역 |
| service_regions_detail | JSON | | 상세 서비스 가능 지역 설정 |
| specialties | JSON | ✅ | 전문 분야 |

**service_regions JSON 구조** (v3.0 확장):
```json
["서울 동부", "서울 서부", "경기 동부", "경기 서부", "전남", "충북", ...]
```
> v3.0 추가 지역: 서울 동부, 서울 서부, 경기 동부, 경기 서부 (피드백 p.11)

**specialties JSON 구조**:
```json
{
  "new_install": true,
  "repair": true,
  "cleaning": false,
  "transport": true,
  "inspection": false
}
```

### 2.4 hq_profiles (프랜차이즈 본사 프로필)

| 컬럼명 | 타입 | 필수 | 설명 |
|--------|------|------|------|
| hq_id | BIGINT (PK, FK → users.user_id) | ✅ | 본사 사용자 ID |
| brand_name | VARCHAR(100) | ✅ | 프랜차이즈 브랜드명 |
| hq_name | VARCHAR(100) | ✅ | 본사명 |
| business_type | VARCHAR(50) | | 업종 (선택) |

### 2.5 owner_profiles (매장 점주 프로필)

| 컬럼명 | 타입 | 필수 | 설명 |
|--------|------|------|------|
| owner_id | BIGINT (PK, FK → users.user_id) | ✅ | 점주 사용자 ID |
| store_id | BIGINT (FK → stores) | | 소유 매장 ID |

> **v3.0 변경**: store_scale(매장 규모) 삭제 (피드백 p.21)

---

## 3. 권한 관리 (RBAC + 개별 오버라이드)

### 3.1 role_permissions (역할별 기본 권한)

| 컬럼명 | 타입 | 필수 | 설명 |
|--------|------|------|------|
| role_permission_id | BIGINT (PK, AUTO) | ✅ | 권한 ID |
| role | ENUM('ADMIN','DEALER','HQ','OWNER') | ✅ | 대상 역할 |
| feature_code | VARCHAR(50) | ✅ | 기능 코드 |
| is_allowed | BOOLEAN | ✅ | 허용 여부 |

### 3.2 user_permission_overrides (개별 사용자 권한 오버라이드)

| 컬럼명 | 타입 | 필수 | 설명 |
|--------|------|------|------|
| override_id | BIGINT (PK, AUTO) | ✅ | 오버라이드 ID |
| user_id | BIGINT (FK → users) | ✅ | 대상 사용자 |
| feature_code | VARCHAR(50) | ✅ | 기능 코드 |
| is_allowed | BOOLEAN | ✅ | 허용 여부 |
| reason | VARCHAR(255) | | 변경 사유 |
| set_by | BIGINT (FK → users) | ✅ | 설정한 관리자 |
| created_at | DATETIME | ✅ | 설정 일시 |

### 3.3 feature_code 정의 (v3.0 세분화)

| 코드 | 기능 | ADMIN | DEALER | HQ | OWNER |
|------|------|-------|--------|-----|-------|
| `DASHBOARD_STORE_COUNT` | 가맹점 수 조회 | ✅ | ✅ | ✅ | ❌ |
| `DASHBOARD_AS_REQUEST` | A/S 요청 현황 | ✅ | ✅ | ✅ | ✅ |
| `DASHBOARD_REALTIME_ISSUE` | 실시간 발생 이슈 | ✅ | ✅ | ✅ | ✅ |
| `DASHBOARD_IAQ` | 실내공기질 조회 | ✅ | ✅ | ✅ | ✅ |
| `DASHBOARD_OUTDOOR_AIR` | 실외 대기질 조회 | ✅ | ✅ | ✅ | ✅ |
| `DASHBOARD_STORE_SEARCH` | 매장 검색 및 이동 | ✅ | ✅ | ✅ | ❌ |
| `MONITOR_BASIC_STATUS` | 장비 기본 상태 모니터링 | ✅ | ✅ | ✅ | ✅ |
| `MONITOR_FILTER_STATUS` | 필터 점검 상태 | ✅ | ✅ | ✅ | ✅ |
| `MONITOR_FIRE_SENSOR` | 화재감지 센서 | ✅ | ✅ | ✅ | ✅ |
| `MONITOR_ESG` | ESG 지표 조회 | ✅ | ✅ | ✅ | ✅ |
| `MONITOR_BOARD_TEMP` | 보드 온도 | ✅ | ✅ | ✅ | ✅ |
| `MONITOR_SPARK` | 스파크 발생 | ✅ | ✅ | ✅ | ✅ |
| `CONTROL_POWER` | 전원 제어 | ✅ | 오버라이드 | 오버라이드 | ✅ |
| `CONTROL_DAMPER` | 방화셔터(댐퍼) 제어 | ✅ | 오버라이드 | 오버라이드 | ✅ |
| `CONTROL_FAN` | 송풍기 팬 모터 제어 | ✅ | 오버라이드 | 오버라이드 | ✅ |
| `CONTROL_FLOW_TARGET` | 목표 풍량(CMH) 입력 | ✅ | ❌ | ❌ | ❌ |
| `CONTROL_VELOCITY_TARGET` | **v3.1** 목표 풍속(m/s) 입력 | ✅ | ❌ | ❌ | ❌ |
| `EQUIP_REGISTER` | 장비 등록/수정/삭제 | ✅ | ✅ | ❌ | ❌ |
| `CUSTOMER_REGISTER` | 고객 관리 (개별매장) | ✅ | ✅(등록/수정) | ❌ | 수정만 |
| `CUSTOMER_FRANCHISE_REG` | 가맹점 관리 | ✅ | ✅(등록/수정) | 수정만 | ❌ |
| `AS_REQUEST` | A/S 접수 신청 | ✅ | ❌ | ❌ | ✅ |
| `AS_ACCEPT` | A/S 접수 처리 | ✅ | ✅ | ❌ | ❌ |
| `AS_REPORT` | A/S 완료 보고서 작성 | ✅ | ✅ | ❌ | ❌ |
| `USER_MANAGEMENT` | 사용자 계정 관리 | ✅ | ❌ | ❌ | ❌ |
| `APPROVAL_MANAGEMENT` | 가입 승인 관리 | ✅ | ❌ | ❌ | ❌ |
| `THRESHOLD_MANAGEMENT` | 기준 수치 관리 | ✅ | ❌ | ❌ | ❌ |

> **v3.0 변경**: `DASHBOARD_SYSTEM_STATUS`, `DASHBOARD_USER_STATS` 삭제 (피드백 p.24, p.63).
> 모니터링/제어 하위 항목 세분화 (`MONITOR_*`, `CONTROL_*`). 
> `CONTROL_FLOW_TARGET` 신규 추가 (목표 풍량 입력 권한, 시스템관리에서 설정, 피드백 p.44).

---

## 4. 매장(사이트) 관리

### 4.1 stores (매장 정보)

| 컬럼명 | 타입 | 필수 | 설명 |
|--------|------|------|------|
| store_id | BIGINT (PK, AUTO) | ✅ | 매장 고유 ID |
| site_id | VARCHAR(50) UNIQUE | ✅ | MQTT 토픽용 사이트 식별자 (예: "site-001") |
| store_name | VARCHAR(100) | ✅ | 매장명 |
| brand_name | VARCHAR(100) | | 프랜차이즈 브랜드명 |
| business_type | ENUM('튀김','굽기','볶음','복합','커피로스팅') | | 업종 |
| address | VARCHAR(255) | ✅ | 매장 주소 |
| latitude | DECIMAL(10,8) | | 위도 |
| longitude | DECIMAL(11,8) | | 경도 |
| region_code | VARCHAR(20) | | 지역 코드 (시/도) |
| district_code | VARCHAR(20) | | 상세 지역 코드 (구/동) |
| owner_id | BIGINT (FK → users) | | 매장 점주 사용자 ID |
| hq_id | BIGINT (FK → users) | | 소속 프랜차이즈 본사 ID |
| dealer_id | BIGINT (FK → users) | | 담당 대리점 ID |
| contact_name | VARCHAR(50) | | 매장 연락 담당자명 |
| contact_phone | VARCHAR(20) | | 매장 연락처 |
| floor_count | INT DEFAULT 1 | | 매장 층 수 |
| status | ENUM('ACTIVE','INACTIVE','PENDING') | ✅ | 매장 상태 |
| registered_by | ENUM('OWNER','DEALER','ADMIN') | ✅ | 등록 방법 |
| created_at | DATETIME | ✅ | 등록 일시 |
| updated_at | DATETIME | ✅ | 수정 일시 |

> **v3.0 변경**: business_type에 '커피로스팅' 추가 (피드백 p.14, p.19). cooking_volume(일일 조리량) 삭제.

**비즈니스 규칙**:
- HQ 소속 매장에는 dealer_id를 할당하지 않음 (hq_id가 있으면 dealer_id = NULL)
- 매장 등록: OWNER(직접등록), DEALER(설치시), ADMIN(점주 미가입시)

### 4.2 store_floors (매장 층 정보)

| 컬럼명 | 타입 | 필수 | 설명 |
|--------|------|------|------|
| floor_id | BIGINT (PK, AUTO) | ✅ | 층 고유 ID |
| store_id | BIGINT (FK → stores) | ✅ | 매장 ID |
| floor_code | VARCHAR(10) | ✅ | MQTT 토픽용 층 식별자 (예: "1F", "B1") |
| floor_name | VARCHAR(50) | | 층 명칭 (예: "1층 주방") |

---

## 5. 장비 관리

### 5.1 equipment (집진장비 - ESP Device)

| 컬럼명 | 타입 | 필수 | 설명 |
|--------|------|------|------|
| equipment_id | BIGINT (PK, AUTO) | ✅ | 장비 DB ID |
| equipment_serial | VARCHAR(50) UNIQUE | ✅ | 집진기 자체 고유번호 (수동 입력) |
| mqtt_equipment_id | VARCHAR(50) UNIQUE | ✅ | MQTT용 장비 식별자 (예: "esp-001") |
| store_id | BIGINT (FK → stores) | | 설치 매장 ID (선택) |
| floor_id | BIGINT (FK → store_floors) | | 설치 층 ID (선택) |
| equipment_name | VARCHAR(100) | | 장비명 (수동 입력) |
| model_id | BIGINT (FK → equipment_models) | | 모델 (드롭다운 선택) |
| cell_type | VARCHAR(100) | | 셀 타입 (수동 입력) |
| powerpack_count | INT DEFAULT 1 | | 파워팩 개수 (CHECK ≤ 4) |
| purchase_date | DATE | | 구매일 |
| warranty_end_date | DATE | | 보증 기간 만료일 |
| dealer_id | BIGINT (FK → users) | | 담당 대리점 |
| status | ENUM('NORMAL','INSPECTION','CLEANING','INACTIVE') | ✅ | 운용 상태 |
| connection_status | ENUM('ONLINE','OFFLINE') DEFAULT 'OFFLINE' | | 연결 상태 |
| last_seen_at | DATETIME | | 최근 통신 시각 |
| registered_by | BIGINT (FK → users) | ✅ | 등록자 |
| created_at | DATETIME | ✅ | 등록 일시 |
| updated_at | DATETIME | ✅ | 수정 일시 |

> **v3.0 변경**:
> - cell_type_id (FK → cell_types) → `cell_type` VARCHAR(100) 수동 입력 (피드백 p.36)
> - powerpack_count CHECK ≤ 16 → CHECK ≤ 4 (피드백 p.50)
> - registration_date → `purchase_date` 복원 (피드백 p.50: "구매일 필요")
> - `mqtt_equipment_id` 추가 (MQTT 규격의 equipment_id 매핑용)
> - `dealer_id` 추가 (담당 기사 → 담당 대리점, 피드백 p.36)

### 5.2 equipment_models (장비 모델 참조 테이블)

| 컬럼명 | 타입 | 필수 | 설명 |
|--------|------|------|------|
| model_id | BIGINT (PK, AUTO) | ✅ | 모델 ID |
| model_name | VARCHAR(100) | ✅ | 모델명 |
| manufacturer | VARCHAR(100) | | 제조사 |
| specifications | JSON | | 사양 정보 |
| is_active | BOOLEAN DEFAULT TRUE | | 활성 여부 |
| created_at | DATETIME | ✅ | 등록 일시 |

> **v3.0**: cell_types 참조 테이블 삭제됨 (수동 입력으로 변경)

### 5.3 gateways (게이트웨이)

| 컬럼명 | 타입 | 필수 | 설명 |
|--------|------|------|------|
| gateway_id | BIGINT (PK, AUTO) | ✅ | 게이트웨이 DB ID |
| gw_device_id | VARCHAR(50) UNIQUE | ✅ | MQTT 토픽용 게이트웨이 ID (예: "gw-001") |
| store_id | BIGINT (FK → stores) | ✅ | 설치 매장 ID |
| floor_id | BIGINT (FK → store_floors) | ✅ | 설치 층 ID |
| mac_address | VARCHAR(20) | | MAC 주소 |
| firmware_version | VARCHAR(20) | | 펌웨어 버전 |
| controller_count | INT DEFAULT 0 | | 연결된 컨트롤러 수 (status 메시지에서 갱신) |
| status_flags | INT DEFAULT 0 | | Gateway 상태 플래그 (7비트 비트마스크) |
| connection_status | ENUM('ONLINE','OFFLINE') DEFAULT 'OFFLINE' | | 연결 상태 |
| last_seen_at | DATETIME | | 최근 status 메시지 수신 시각 |
| created_at | DATETIME | ✅ | 등록 일시 |

> **v3.0 변경**:
> - heartbeat_interval, heartbeat_last_received 삭제 (heartbeat 토픽 없음)
> - error_code 삭제 (MQTT 규격에 없음)
> - 연결 상태 판별: last_seen_at 기준 **30초** 미수신 시 OFFLINE (피드백 p.38)
>
> **v3.2 변경**: status 메시지의 wifi 객체 수신 시 게이트웨이 Wi-Fi 정보를 gateways 테이블에 캐시. 아래 컬럼 추가 권장:
> `wifi_ssid VARCHAR(64)`, `wifi_rssi INT`, `wifi_ip VARCHAR(45)`, `wifi_mac VARCHAR(17)`, `wifi_channel TINYINT`

**Gateway status_flags 비트 정의** (MQTT 규격 260212):

| 비트 | 의미 |
|------|------|
| 0 | SEN55 정상 (PM, 온습도, VOC, NOx) |
| 1 | SCD40 정상 (CO2) |
| 2 | O3 센서 정상 (SEN0321) |
| 3 | CO 센서 정상 (SEN0466) |
| 4 | HCHO 센서 정상 (SFA30) |
| 5 | 1개 이상 컨트롤러 연결됨 |
| 6 | 페어링 모드 |

### 5.4 controllers (컨트롤러 = 파워팩)

| 컬럼명 | 타입 | 필수 | 설명 |
|--------|------|------|------|
| controller_id | BIGINT (PK, AUTO) | ✅ | 컨트롤러 DB ID |
| ctrl_device_id | VARCHAR(50) UNIQUE | ✅ | MQTT용 컨트롤러 ID (예: "ctrl-001") |
| equipment_id | BIGINT (FK → equipment) | ✅ | 소속 장비 ID |
| gateway_id | BIGINT (FK → gateways) | ✅ | 연결 게이트웨이 ID |
| status_flags | INT DEFAULT 0 | | Controller 상태 플래그 (6비트 비트마스크) |
| connection_status | ENUM('ONLINE','OFFLINE') DEFAULT 'OFFLINE' | | 연결 상태 |
| last_seen_at | DATETIME | | 최근 데이터 수신 시각 |
| created_at | DATETIME | ✅ | 등록 일시 |

**Controller status_flags 비트 정의** (MQTT 규격 260212):

| 비트 | 의미 |
|------|------|
| 0 | 파워팩 RS-485 통신 정상 |
| 1 | SPS30 (PM2.5) 센서 정상 |
| 2 | SDP810 (차압) 센서 정상 |
| 3 | 수위 센서 정상 |
| 4 | flo-OAC 댐퍼 컨트롤러 정상 |
| 5 | LS M100 인버터 정상 (RS-485 통신 정상 **AND** Fault Trip 없음) — **v3.2: 복합 판정으로 변경** |

> **v3.0**: powerpacks 테이블 삭제. MQTT 규격에서 controller = 파워팩이므로 별도 테이블 불필요. equipment.powerpack_count로 관리.

---

## 6. 센서 데이터 (MQTT → DB 저장)

### 6.1 MQTT 토픽 구조 (v3.0 — MQTT 규격 260212 확정)

게이트웨이 단위로 토픽을 통합합니다. 모든 센서/상태/제어가 게이트웨이 토픽 하위에 위치합니다.

```
metabeans/{site_id}/{floor_id}/gateway/{gw_id}/
├── sensor          # 통합 센서 데이터 발행 (10초 주기)
├── status          # 게이트웨이 상태 발행 (10초 주기)
├── control         # 제어 명령 수신 (구독)
├── control/ack     # 제어 명령 응답 발행
└── config          # 설정 변경 수신 (구독)
└── config/ack      # 설정 변경 응답 발행
```

**MQTT 통신 설정**:

| 파라미터 | 값 | 비고 |
|---------|------|------|
| QoS | **1** (모든 토픽) | AWS IoT Core QoS 2 미지원 |
| Retain | **0** (비활성, 모든 토픽) | 10초 주기 발행으로 불필요 |
| 타임스탬프 | **Unix epoch (초 단위)** | 서버 UTC 저장, 클라이언트 로컬 변환 |
| 필드명 규칙 | 영문 소문자 + snake_case | |
| 인증 | Username/Password | AWS IoT Core |
| 센서값 스케일 | 변환 없이 그대로 사용 | 펌웨어가 내부 스케일을 실제값으로 변환 후 전송 |

**v3.0에서 삭제된 토픽**:
- ~~`metabeans/{site_id}/{floor_id}/controller/{ctrl_id}/sensor`~~ → 게이트웨이 sensor 메시지에 통합
- ~~`metabeans/{site_id}/{floor_id}/gateway/{gw_id}/alarm`~~ → pp_alarm 필드로 대체
- ~~`metabeans/{site_id}/{floor_id}/gateway/{gw_id}/heartbeat`~~ → status 토픽으로 대체
- ~~`metabeans/{site_id}/{floor_id}/gateway/{gw_id}/heartbeat/ack`~~ → 삭제

**구독 패턴 예시**:
- 특정 매장 전체: `metabeans/site-001/+/gateway/+/#`
- 특정 층: `metabeans/site-001/1F/gateway/+/sensor`

### 6.2 sensor 메시지 구조

**토픽**: `metabeans/{site_id}/{floor_id}/gateway/{gw_id}/sensor`  
**주기**: 10초  
**방향**: Gateway → Cloud

Gateway IAQ 데이터와 모든 하위 equipment/controller 데이터를 **하나의 메시지로 통합** 발행:

```json
{
  "gateway_id": "gw-001",
  "timestamp": 1234567890,
  "iaq": {
    "pm1_0": 12.5, "pm2_5": 25.0, "pm4_0": 30.0, "pm10": 35.0,
    "temperature": 24.5, "humidity": 65.0,
    "voc_index": 100, "nox_index": 50,
    "co2": 450, "o3": 25, "co": 1.2, "hcho": 30
  },
  "equipments": [
    {
      "equipment_id": "esp-001",
      "controllers": [
        {
          "controller_id": "ctrl-001",
          "timestamp": 1234567885,
          "pm2_5": 25.0, "pm10": 35.0,
          "diff_pressure": 12.0, "oil_level": 0,
          "pp_temp": 45, "pp_spark": 123, "pp_power": 1, "pp_alarm": 0,
          "fan_speed": 2, "fan_mode": 0, "fan_running": 1,
          "fan_freq": 42.50, "fan_target_pct": 0.0,
          "damper_mode": 0, "damper_ctrl": 80.0,
          "flow": 850.0, "damper": 75.0,
          "inlet_temp": 22.5, "velocity": 8.3, "duct_dp": 245.0,
          "status_flags": 63
        }
      ]
    }
  ]
}
```

**페이로드 크기 예상**:

| 구성 | 예상 크기 |
|------|---------|
| Gateway IAQ만 | ~300 bytes |
| Equipment 1대 × Controller 2대 | ~600 bytes |
| Equipment 3대 × Controller 4대 | ~3.5 KB |
| 최대 (Equipment 5대 × Controller 4대) | ~6 KB |

### 6.3 gateway_sensor_data (게이트웨이 IAQ 센서 데이터)

sensor 메시지의 최상위 + iaq 필드를 저장합니다.

| 컬럼명 | 타입 | 단위 | 설명 |
|--------|------|------|------|
| data_id | BIGINT (PK, AUTO) | - | 데이터 ID |
| gateway_id | BIGINT (FK → gateways) | - | 게이트웨이 ID |
| timestamp | INT UNSIGNED | epoch초 | 메시지 발행 시간 |
| received_at | DATETIME | - | 서버 수신 시각 |
| pm1_0 | FLOAT | µg/m³ | PM1.0 농도 |
| pm2_5 | FLOAT | µg/m³ | PM2.5 농도 |
| pm4_0 | FLOAT | µg/m³ | PM4.0 농도 |
| pm10 | FLOAT | µg/m³ | PM10 농도 |
| temperature | FLOAT | °C | 온도 |
| humidity | FLOAT | % | 습도 |
| voc_index | INT NULL | - | VOC 지수 (1-500, 워밍업 중 null) |
| nox_index | INT NULL | - | NOx 지수 (1-500, 워밍업 중 null) |
| co2 | INT | ppm | CO2 농도 |
| o3 | INT | ppb | 오존 농도 |
| co | FLOAT | ppm | 일산화탄소 농도 |
| hcho | INT | ppb | 포름알데히드 농도 |

**인덱스**: `(gateway_id, timestamp)` — 파티셔닝 키

### 6.4 controller_sensor_data (컨트롤러 센서 데이터)

sensor 메시지의 equipments[].controllers[] 필드를 저장합니다.

| 컬럼명 | 타입 | 단위 | 설명 |
|--------|------|------|------|
| data_id | BIGINT (PK, AUTO) | - | 데이터 ID |
| controller_id | BIGINT (FK → controllers) | - | 컨트롤러 DB ID |
| equipment_id | BIGINT (FK → equipment) | - | 소속 장비 DB ID |
| gateway_id | BIGINT (FK → gateways) | - | 게이트웨이 DB ID |
| timestamp | INT UNSIGNED | epoch초 | 컨트롤러 데이터 수신 시간 |
| received_at | DATETIME | - | 서버 수신 시각 |
| pm2_5 | FLOAT | µg/m³ | 배출부 PM2.5 농도 |
| pm10 | FLOAT | µg/m³ | 배출부 PM10 농도 |
| diff_pressure | FLOAT | Pa | ESP 집진부 차압 |
| oil_level | INT | - | 오일 만수 감지 (0=정상, 1=만수) — **v3.2: FLOAT→INT, 디지털 센서** |
| pp_temp | INT | °C | 파워팩 온도 (정수) |
| pp_spark | INT | - | 스파크 수치 (0-9999, rev2.1 이전 0-99) — **v3.2: 범위 확대** |
| pp_power | INT | - | 전원 상태 (0=OFF, 1=ON) |
| pp_alarm | INT | - | 파워팩 알람 (0=정상, 1=알람) |
| fan_speed | INT | - | 팬 속도 단계 (0=OFF, 1=LOW, 2=MID, 3=HIGH), **수동 모드에서만 유의미** |
| fan_mode | INT | - | **v3.1** 팬 제어 모드 (0=수동, 1=자동) |
| fan_running | INT | - | **v3.2 신규** 인버터 실제 운전 상태 (0=정지, 1=운전중) — M100 RUN_STATUS 레지스터 기반 |
| fan_freq | FLOAT | Hz | **v3.2 신규** M100 인버터 실제 출력 주파수 (0~50.00 Hz) |
| fan_target_pct | FLOAT | % | **v3.2 신규** PID 목표값 (0.0~100.0%), fan_mode=1(자동) 시만 유의미, 수동 시 0 |
| damper_mode | INT | - | **v3.1** 댐퍼 제어 모드 (0=수동, 1=자동) |
| damper_ctrl | FLOAT | % | **v3.2 신규** 댐퍼 제어 명령값 Damper_CTRL (0-100%) — damper(Damper_FB 피드백값)와 구분 |
| flow | FLOAT | CMH | 풍량 (flo-OAC 현재유량) |
| damper | FLOAT | % | 댐퍼 개도율 피드백 Damper_FB (0-100) |
| inlet_temp | FLOAT | °C | 유입 온도 (flo-OAC, -20~50) |
| velocity | FLOAT | m/s | 현재 풍속 (flo-OAC, 0~20.0) |
| duct_dp | FLOAT | Pa | 덕트 차압 (flo-OAC, -49~980) |
| status_flags | INT | - | 컨트롤러 상태 플래그 (6비트) |

> **v3.0 변경**:
> - blade_angle 삭제 → damper로 통합
> - fan_rpm 삭제 (MQTT 규격에 없음)
> - scale_weight 삭제 (MQTT 규격에 없음, 별도 연동 필요시 추가)
> - **pp_alarm 추가** (MQTT 규격: 별도 alarm 토픽 대체)
> - **inlet_temp, velocity, duct_dp 추가** (flo-OAC 데이터)
> - pp_temp 타입: FLOAT → **INT** 확정
>
> **v3.2 변경** (MQTT 규격 260227_v2):
> - **oil_level 타입 변경**: FLOAT (0-100%) → **INT** (0=정상, 1=만수) — 디지털 수위 센서 실제 동작 반영. UI에서 수치 표시 대신 정상/만수 태그로 표시
> - **pp_spark 범위 확대**: 0-99 → **0-9999** (파워팩 rev2.1 대응). 알람 임계값도 9999 스케일 기준으로 재설정 필요
> - **fan_running 추가**: INT, M100 인버터 실제 운전 여부 (RUN_STATUS 레지스터)
> - **fan_freq 추가**: FLOAT Hz, 인버터 실제 출력 주파수 (0~50.00 Hz)
> - **fan_target_pct 추가**: FLOAT %, PID 목표값, 자동 모드에서만 유의미
> - **damper_ctrl 추가**: FLOAT %, 댐퍼 명령값 (Damper_CTRL). 기존 damper 필드는 피드백값(Damper_FB)으로 역할 명확화

**인덱스**: `(controller_id, timestamp)` — 파티셔닝 키

### 6.5 status 메시지 구조

**토픽**: `metabeans/{site_id}/{floor_id}/gateway/{gw_id}/status`  
**주기**: 10초 (sensor와 동시)  
**방향**: Gateway → Cloud

```json
{
  "gateway_id": "gw-001",
  "status_flags": 63,
  "controller_count": 3,
  "timestamp": 1234567890,
  "wifi": {
    "ssid": "MetaBeans_AP",
    "rssi": -62,
    "ip": "192.168.1.105",
    "mac": "AA:BB:CC:DD:EE:FF",
    "channel": 6
  }
}
```

**wifi 객체 필드** (v3.2 신규):

| 필드 | 타입 | 설명 |
|------|------|------|
| ssid | string | 연결된 Wi-Fi SSID |
| rssi | int | 수신 신호 강도 (dBm, 미연결 시 0) |
| ip | string | 게이트웨이 IP 주소 |
| mac | string | 게이트웨이 MAC 주소 |
| channel | int | Wi-Fi 채널 (미연결 시 0) |

> 서버는 status 메시지를 수신할 때마다 gateways.last_seen_at을 갱신합니다. 30초 이상 미수신 시 connection_status = 'OFFLINE'으로 전환합니다 (피드백 p.38).

### 6.6 IAQ 상태 판단 기준 (소프트웨어 연산)

| 측정 항목 | 단위 | 좋음 (Green) | 보통 (Yellow) | 나쁨 (Red) | 환경부 기준 |
|----------|------|-------------|-------------|------------|-----------|
| PM10 | µg/m³ | 0~30 | 31~75 | 76+ | 유지기준: 75~100 |
| PM2.5 | µg/m³ | 0~15 | 16~35 | 36+ | 유지기준: 35~50 |
| CO2 | ppm | 0~700 | 701~1,000 | 1,001+ | 유지기준: 1,000 |
| HCHO | ppb | 0~30 | 31~81 | 82+ | 유지기준: 82 |
| CO | ppm | 0~4 | 5~10 | 11+ | 유지기준: 10 |
| VOC Index | - | 수치만 출력 | | | 상대 변화 지수 |
| O3 | ppb | 수치만 출력 | | | |

> **v3.0**: 실내공기질 정보는 이슈/알림에 표시하지 않음 (피드백 p.33). 대시보드 참고 데이터로만 활용.

### 6.7 장비 모니터링 지표 (v3.0 — 피드백 p.38~42)

**파워팩(컨트롤러)별 데이터**:

| 지표 | 필드 | 정상 (Green) | 주의 (Yellow) | 위험 (Red) |
|------|------|-------------|-------------|------------|
| 장비 연결 상태 | last_seen_at | 연결 | - | 끊김 (30초 미수신) |
| 전원 상태 | pp_power | On (1) | - | Off (0) |
| 보드 온도 | pp_temp | 정상 | 주의 | 위험 |
| 스파크 | pp_spark | 정상 | 주의 | 위험 |
| PM2.5 | pm2_5 | 표시 | - | - |
| PM10 | pm10 | 표시 | - | - |

**장비(ESP)별 데이터**:

| 지표 | 필드 | 정상 (Green) | 주의 (Yellow) | 위험 (Red) |
|------|------|-------------|-------------|------------|
| 유입온도 | inlet_temp | 정상 | 70°C 이상 | 100°C 이상 |
| 풍량 | flow | 수치 표시 | - | - |
| 풍속 | velocity | 수치 표시 | - | - |
| 덕트 차압 | duct_dp | 수치 표시 | - | - |

**필터 점검 상태**: 정상(Green) / 점검 필요(Yellow)
- 차압(diff_pressure) 수치 표시
- 상태 변경 알림 메시지: "필터 점검 필요: 스파크 발생 부위 및 필터 오염 상태를 확인하십시오."

**먼지제거 성능**: 좋음(Green) / 보통(Yellow) / 점검 필요(Red)
- PM2.5, PM10 기준 (구체적 기준수치는 표시하지 않음, 피드백 p.38)

**폐유 수집량**: 랜덤 데이터(임시) — 유증 포집량 × 2 (피드백 p.39)

> **v3.0**: 지표 범위가 없는 값(풍량, 풍속, 압력)은 수치만 표시 (피드백 p.42)

---

## 7. 알람/알림 시스템

### 7.1 alarm_events (알람 이벤트)

> **v3.0 변경**: MQTT alarm 토픽 삭제됨. 알람은 pp_alarm 필드 + 서버측 연산으로 생성.

| 컬럼명 | 타입 | 필수 | 설명 |
|--------|------|------|------|
| alarm_id | BIGINT (PK, AUTO) | ✅ | 알람 ID |
| store_id | BIGINT (FK → stores) | ✅ | 발생 매장 |
| gateway_id | BIGINT (FK → gateways) | | 발생 게이트웨이 |
| equipment_id | BIGINT (FK → equipment) | | 발생 장비 |
| controller_id | BIGINT (FK → controllers) | | 발생 컨트롤러 |
| alarm_type | VARCHAR(50) | ✅ | 알람 타입 |
| severity | ENUM('YELLOW','RED') | ✅ | 심각도 |
| message | VARCHAR(500) | | 알람 메시지 |
| occurred_at | DATETIME | ✅ | 발생 시각 |
| acknowledged_at | DATETIME | | 확인 시각 |
| acknowledged_by | BIGINT (FK → users) | | 확인자 |
| resolved_at | DATETIME | | 해소 시각 |
| status | ENUM('ACTIVE','ACKNOWLEDGED','RESOLVED') DEFAULT 'ACTIVE' | ✅ | 알람 상태 |

**alarm_type 정의 (v3.0 — 피드백 p.33~34)**:

| alarm_type | 지표 | YELLOW 조건 | RED 조건 |
|-----------|------|------------|---------|
| `COMM_ERROR` | 장비 연결 상태 | 끊김 30초 이상 지속 | 끊김 1시간 이상 지속 |
| `INLET_TEMP_ABNORMAL` | 유입온도 | 70°C 이상 | 100°C 이상 |
| `FILTER_CHECK` | 필터 점검 상태 | 점검 필요 | - |
| `DUST_REMOVAL_CHECK` | 먼지제거 성능 | - | 점검 필요 |
| `PP_ALARM` | pp_alarm 필드 | - | pp_alarm = 1 |

**대시보드 표시 규칙**:
- **문제 발생 이슈**: YELLOW + RED 모두 표시 (피드백 p.33)
- **긴급 알람**: RED만 표시 + 관리자 이메일 발송 (피드백 p.34)
- **실내공기질**: 이슈/알림에 표시하지 않음 (피드백 p.33)
- **이슈 표시 단위**: **집진기(equipment) 단위**로 집계. 컨트롤러 개별 수치는 대시보드에 표시하지 않음. 하위 컨트롤러 중 최고 위험도가 집진기 상태로 전파됨 (상태 전파 규칙 참조)
- **A/S 현황**: 대시보드에서 건수 카드가 아닌 미처리 A/S 목록 패널(`GET /dashboard/as-requests`)로 표시

### 7.2 alarm_deletions (알람 삭제 이력)

| 컬럼명 | 타입 | 필수 | 설명 |
|--------|------|------|------|
| deletion_id | BIGINT (PK, AUTO) | ✅ | 삭제 ID |
| alarm_id | BIGINT (FK → alarm_events) | ✅ | 대상 알람 |
| deleted_by | BIGINT (FK → users) | ✅ | 삭제한 사용자 |
| deleted_at | DATETIME | ✅ | 삭제 일시 |

### 7.3 notification_settings (알림 설정)

| 컬럼명 | 타입 | 필수 | 설명 |
|--------|------|------|------|
| setting_id | BIGINT (PK, AUTO) | ✅ | 설정 ID |
| user_id | BIGINT (FK → users) | ✅ | 사용자 ID |
| alarm_type | VARCHAR(50) | ✅ | 알람 타입 |
| push_enabled | BOOLEAN DEFAULT TRUE | | 푸시 알림 |
| sms_enabled | BOOLEAN DEFAULT FALSE | | SMS 알림 |
| email_enabled | BOOLEAN DEFAULT FALSE | | 이메일 알림 |

---

## 8. 제어 명령 및 이력

### 8.1 MQTT 제어 명령 (v3.0 — MQTT 규격 260212)

**토픽**: `metabeans/{site_id}/{floor_id}/gateway/{gw_id}/control`  
**방향**: Cloud → Gateway

**개별 제어**:
```json
{
  "cmd_id": "550e8400-e29b-41d4-a716-446655440000",
  "equipment_id": "esp-001",
  "controller_id": "ctrl-001",
  "target": 0,
  "action": 1,
  "value": 0
}
```

**일괄 제어** (MQTT 규격):

| equipment_id | controller_id | 범위 |
|-------------|--------------|------|
| "all" | "all" | 게이트웨이 하위 전체 컨트롤러 |
| "esp-001" | "all" | 해당 집진기 하위 컨트롤러만 |
| "esp-001" | "ctrl-001" | 특정 컨트롤러 지정 |

**제어 대상 (target) 및 액션 (action)**:

**target=0: 파워팩 (Powerpack)**

| action | value | 설명 |
|--------|-------|------|
| 0 | - | 파워팩 OFF |
| 1 | - | 파워팩 ON |
| 2 | - | 파워팩 리셋 |

**target=1: 댐퍼 (Damper / flo-OAC)**

| action | value | 설명 |
|--------|-------|------|
| 1 | 0-100 (int) | 댐퍼 개도율 설정 (%, 수동 모드) |
| 2 | 0 또는 1 (int) | **v3.1** 제어 모드 전환 (0=수동, 1=자동) |
| 3 | float (CMH) | **v3.1** 목표 풍량 설정 (자동 모드, 예: 850.0) |

> flo-OAC 하드웨어는 Float 0~100% 연속 제어를 지원. MQTT에서는 정수(0-100)로 전달, 컨트롤러에서 float 변환.
> **v3.1**: action=2로 자동 모드 전환 시 flo-OAC Internal SV 모드 활성화. action=3으로 목표 풍량(CMH) 설정 시 자동 모드가 아니면 자동 전환됨.

**8단계 매핑** (피드백 p.45 — 애플리케이션 레벨에서 처리):

| 단계 | 개도율 | MQTT value |
|------|-------|-----------|
| 0단계 | 0% | 0 |
| 1단계 | 10% | 10 |
| 2단계 | 25% | 25 |
| 3단계 | 40% | 40 |
| 4단계 | 60% | 60 |
| 5단계 | 75% | 75 |
| 6단계 | 90% | 90 |
| 7단계 | 100% | 100 |

**target=2: 시로코팬 (Fan)**

| action | value | 설명 |
|--------|-------|------|
| 0 | - | 팬 OFF |
| 1 | - | 팬 LOW (하) |
| 2 | - | 팬 MID (중) |
| 3 | - | 팬 HIGH (상, 50Hz) |
| 4 | 0 또는 1 (int) | **v3.1** 제어 모드 전환 (0=수동, 1=자동) |
| 5 | float (m/s) | **v3.1** 목표 풍속 설정 (자동 모드, 예: 3.5) |

> **v3.0 변경**: target=1 "블레이드" → "댐퍼(flo-OAC)"로 변경, 운영 시간 설정 삭제 (피드백 p.43~47)

> **v3.1 변경**: 
> - target=1 댐퍼: action=2(자동/수동 모드 전환), action=3(목표 풍량 CMH 설정) 추가
> - target=2 시로코팬: action=4(자동/수동 모드 전환), action=5(목표 풍속 m/s 설정) 추가
> - value 타입: int → **number** (int 또는 float, 목표 풍량/풍속은 float)
> - 안전 오버라이드: ESTOP/스파크 감지/과온도 알람 시 자동→수동 전환, fan_mode/damper_mode가 0으로 변경됨

### 8.2 MQTT 제어 응답

**토픽**: `metabeans/{site_id}/{floor_id}/gateway/{gw_id}/control/ack`  
**방향**: Gateway → Cloud

```json
{
  "cmd_id": "550e8400-e29b-41d4-a716-446655440000",
  "result": "success",
  "reason": ""
}
```

### 8.2.1 config 메시지 구조 (v3.1 — MQTT 규격 260213)

**토픽**: `metabeans/{site_id}/{floor_id}/gateway/{gw_id}/config`  
**방향**: Cloud → Gateway  
게이트웨이의 런타임 설정을 원격으로 변경합니다. **부분 업데이트(partial update)** 지원 — 포함된 필드만 변경됩니다.

```json
{
  "cmd_id": "550e8400-e29b-41d4-a716-446655440002",
  "site_id": "site-001",
  "floor_id": "1F",
  "gateway_id": "gw-002",
  "sensor_interval_ms": 5000,
  "mqtt_interval_ms": 10000,
  "mqtt_broker_uri": "mqtts://new-broker.example.com:8883",
  "wifi_ssid": "NewNetwork",
  "wifi_password": "newpass123",
  "reboot": true
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| cmd_id | string | ✅ | 명령 ID (config/ack 매칭용, UUID 권장) |
| site_id | string | | 매장 ID 변경 (NVS 저장, 재부팅 필요) |
| floor_id | string | | 층 ID 변경 (NVS 저장, 재부팅 필요) |
| gateway_id | string | | 게이트웨이 ID 변경 (NVS 저장, 재부팅 필요) |
| sensor_interval_ms | int | | 센서 폴링 주기 (ms, 1000~60000, 기본 5000) |
| mqtt_interval_ms | int | | MQTT 발행 주기 (ms, 5000~60000, 기본 10000) |
| mqtt_broker_uri | string | | MQTT 브로커 URI (NVS 저장, 재부팅 필요) |
| wifi_ssid | string | | Wi-Fi SSID (NVS 저장, 재부팅 필요) |
| wifi_password | string | | Wi-Fi 비밀번호 (NVS 저장, 재부팅 필요) |
| reboot | bool | | true 시 즉시 재부팅 수행 |

**필드 분류**:
- **즉시 적용** (재부팅 불필요): sensor_interval_ms, mqtt_interval_ms
- **NVS 저장 + 재부팅 필요**: site_id, floor_id, gateway_id, mqtt_broker_uri, wifi_ssid, wifi_password

**유효성 검증**:

| 필드 | 검증 규칙 | 실패 시 |
|------|---------|---------|
| sensor_interval_ms | 1000 ≤ value ≤ 60000 | "fail" + 사유 |
| mqtt_interval_ms | 5000 ≤ value ≤ 60000 | "fail" + 사유 |
| 문자열 필드 | 빈 문자열 불가 | "fail" + 사유 |
| cmd_id 누락 | - | 메시지 무시 (ACK 불가) |

> 재부팅이 필요한 필드가 변경되면: NVS 저장 → config/ack 발행 (needs_reboot: true) → 1초 대기 후 자동 재부팅

### 8.2.2 config/ack 응답 (v3.1 — MQTT 규격 260213)

**토픽**: `metabeans/{site_id}/{floor_id}/gateway/{gw_id}/config/ack`  
**방향**: Gateway → Cloud

```json
{
  "cmd_id": "550e8400-e29b-41d4-a716-446655440002",
  "result": "success",
  "reason": "",
  "needs_reboot": true
}
```

| 필드 | 타입 | 설명 |
|------|------|------|
| cmd_id | string | 명령 ID (요청과 매칭) |
| result | string | "success" 또는 "fail" |
| reason | string | 실패 시 사유 (성공 시 빈 문자열) |
| needs_reboot | bool | true이면 ACK 발행 후 자동 재부팅 예정 |

### 8.3 control_commands (제어 명령 이력)

| 컬럼명 | 타입 | 필수 | 설명 |
|--------|------|------|------|
| command_id | BIGINT (PK, AUTO) | ✅ | 명령 DB ID |
| cmd_id | VARCHAR(50) UNIQUE | ✅ | MQTT 명령 ID (UUID) |
| store_id | BIGINT (FK → stores) | ✅ | 대상 매장 |
| gateway_id | BIGINT (FK → gateways) | ✅ | 대상 게이트웨이 |
| equipment_id_mqtt | VARCHAR(50) | ✅ | MQTT equipment_id ("all" 가능) |
| controller_id_mqtt | VARCHAR(50) | ✅ | MQTT controller_id ("all" 가능) |
| target | INT | ✅ | 제어 대상 (0=파워팩, 1=댐퍼, 2=시로코팬) |
| action | INT | ✅ | 액션 코드 |
| value | INT | | 설정값 |
| control_mode | ENUM('AUTO','MANUAL') | ✅ | 제어 방식 |
| requested_by | BIGINT (FK → users) | | 요청자 (자동일 경우 NULL) |
| result | ENUM('PENDING','SUCCESS','FAIL') DEFAULT 'PENDING' | | 처리 결과 |
| fail_reason | VARCHAR(255) | | 실패 사유 |
| requested_at | DATETIME | ✅ | 요청 시각 |
| responded_at | DATETIME | | 응답 시각 |

> **v3.0 변경**: controller_id FK → `equipment_id_mqtt`, `controller_id_mqtt` VARCHAR로 변경 (일괄 제어 "all" 지원)

### 8.4 damper_auto_settings (댐퍼 자동제어 설정)

| 컬럼명 | 타입 | 필수 | 설명 |
|--------|------|------|------|
| setting_id | BIGINT (PK, AUTO) | ✅ | 설정 ID |
| equipment_id | BIGINT (FK → equipment) | ✅ | 대상 장비 |
| controller_id | BIGINT (FK → controllers) | | 대상 컨트롤러 (NULL=장비 전체) |
| control_mode | ENUM('AUTO','MANUAL') DEFAULT 'AUTO' | ✅ | 제어 모드 |
| target_flow | FLOAT | | 수동 목표 풍량 (CMH, 댐퍼 자동 제어) |
| target_velocity | FLOAT | | **v3.1** 목표 풍속 (m/s, 시로코팬 자동 제어) |
| fan_control_mode | ENUM('AUTO','MANUAL') DEFAULT 'MANUAL' | | **v3.1** 팬 제어 모드 |
| damper_control_mode | ENUM('AUTO','MANUAL') DEFAULT 'MANUAL' | | **v3.1** 댐퍼 제어 모드 |
| set_by | BIGINT (FK → users) | ✅ | 설정자 |
| updated_at | DATETIME | ✅ | 설정 변경 일시 |

> **v3.0 신규** (피드백 p.44): 방화셔터 자동 제어 시 목표 풍량(CMH) 입력. 풍량 입력 권한은 `CONTROL_FLOW_TARGET`으로 관리.
> **v3.1 추가**: `target_velocity` 컬럼 추가 (시로코팬 자동 제어 목표 풍속). `fan_control_mode`, `damper_control_mode` 컬럼 추가.

---

### 8.5 자동 제어 안전 오버라이드 (v3.1 — MQTT 규격 260213)

**안전 오버라이드 동작**:
비상정지(ESTOP), 스파크 감지, 과온도 알람 발생 시 컨트롤러가 자동으로 팬/댐퍼 자동 모드를 해제(수동 전환)합니다.

| 트리거 | 동작 | 확인 방법 |
|--------|------|---------|
| ESTOP (비상정지) | 팬/댐퍼 자동→수동 전환 | fan_mode=0, damper_mode=0 |
| 스파크 감지 | 팬/댐퍼 자동→수동 전환 | fan_mode=0, damper_mode=0 |
| 과온도 알람 | 팬/댐퍼 자동→수동 전환 | fan_mode=0, damper_mode=0 |

**자동→수동 전환 규칙**:
- 모드 전환 명령(댐퍼 action=2 value=0, 팬 action=4 value=0) 전송 시 자동 해제
- 수동 명령(댐퍼 action=1, 팬 action=0~3) 전송 시 자동 모드가 자동 해제
- 안전 오버라이드 발생 시 센서 데이터의 fan_mode, damper_mode 필드가 0으로 변경되어 대시보드에서 확인 가능

**자동 제어 동작 원리**:
- **댐퍼 자동 제어**: flo-OAC 하드웨어가 자체 PID로 댐퍼 개도를 조절. 컨트롤러 펌웨어는 모드 전환(Internal SV 모드 4)과 목표 풍량 전달만 수행.
- **팬 자동 제어**: M100 인버터 내장 PID를 활용. 컨트롤러 펌웨어가 flo-OAC에서 읽은 실측 풍속을 인버터 PID 피드백 레지스터에 주기적으로 전달, 인버터가 목표 풍속과의 오차를 기반으로 주파수를 자동 조절.
- **PID 튜닝**: 팬 PID 게인(P/I/D)은 M100 인버터 파라미터(AP.22~AP.24)로 설정, 현장 환경에 따라 시운전 시 조정 필요.

---

## 9. A/S 관리

### 9.1 as_requests (A/S 접수)

| 컬럼명 | 타입 | 필수 | 설명 |
|--------|------|------|------|
| request_id | BIGINT (PK, AUTO) | ✅ | 접수 ID |
| store_id | BIGINT (FK → stores) | ✅ | 대상 매장 |
| equipment_id | BIGINT (FK → equipment) | | 대상 장비 |
| requested_by | BIGINT (FK → users) | ✅ | 접수자 (매장 점주) |
| issue_type | ENUM('MALFUNCTION','CLEANING','REPLACEMENT','INSPECTION','OTHER') | ✅ | 고장 유형 |
| description | TEXT | ✅ | 고장 내용/증상 |
| preferred_visit_datetime | DATETIME | | 방문 희망 일시 |
| status | ENUM('PENDING','ACCEPTED','ASSIGNED','VISIT_SCHEDULED','IN_PROGRESS','COMPLETED','CANCELLED') | ✅ | 처리 상태 |
| dealer_id | BIGINT (FK → users) | | 배정 대리점 |
| accepted_at | DATETIME | | 접수 시각 |
| visit_scheduled_datetime | DATETIME | | 방문 예정 일시 |
| completed_at | DATETIME | | 완료 시각 |
| created_at | DATETIME | ✅ | 생성 일시 |
| updated_at | DATETIME | ✅ | 수정 일시 |

> **v3.0 변경**: 
> - `preferred_visit_datetime` DATETIME으로 변경 (날짜+시간 통합, 피드백 p.56)
> - `visit_scheduled_datetime` DATETIME으로 변경
> - 방문 예정 일시 위에 고객 방문 희망 일시 표시 (UI)
> - 접수일 멘트: "원활한 서비스를 위해 접수일로부터 3일~7일 이내에 고객 방문 및 AS처리를 진행해 주시기 바랍니다." (피드백 p.56)

### 9.2 as_attachments (A/S 첨부파일)

| 컬럼명 | 타입 | 필수 | 설명 |
|--------|------|------|------|
| attachment_id | BIGINT (PK, AUTO) | ✅ | 첨부파일 ID |
| request_id | BIGINT (FK → as_requests) | ✅ | A/S 접수 ID |
| file_type | ENUM('IMAGE','VIDEO','DOCUMENT') | ✅ | 파일 유형 |
| file_path | VARCHAR(500) | ✅ | 파일 저장 경로 |
| file_name | VARCHAR(255) | ✅ | 원본 파일명 |
| uploaded_at | DATETIME | ✅ | 업로드 일시 |

### 9.3 as_reports (A/S 완료 보고서)

| 컬럼명 | 타입 | 필수 | 설명 |
|--------|------|------|------|
| report_id | BIGINT (PK, AUTO) | ✅ | 보고서 ID |
| request_id | BIGINT (FK → as_requests) | ✅ | A/S 접수 ID |
| dealer_id | BIGINT (FK → users) | ✅ | 처리 대리점 |
| repair_type | ENUM('FILTER_REPLACE','PART_REPLACE','CLEANING','WIRING','OTHER') | ✅ | 수리 유형 |
| repair_description | TEXT | | 수리 내역 |
| parts_used | JSON | ✅ | 교체 부품 상세 (필수 입력) |
| total_parts_cost | DECIMAL(10,2) | | 총부품비 (원) |
| created_at | DATETIME | ✅ | 작성 일시 |

**parts_used JSON 구조** (v3.0 변경 — 피드백 p.59):
```json
[
  {"part_name": "활성탄 필터", "unit_price": 30000, "quantity": 2},
  {"part_name": "전극판", "unit_price": 50000, "quantity": 1}
]
```
> **v3.0 변경**: 
> - parts_used 필수 입력으로 변경, 품명/가격/수량 모두 기재 필수 (피드백 p.59)
> - cost → `total_parts_cost` (총부품비) 변경 (피드백 p.59)

### 9.4 as_report_attachments (보고서 첨부파일)

| 컬럼명 | 타입 | 필수 | 설명 |
|--------|------|------|------|
| attachment_id | BIGINT (PK, AUTO) | ✅ | 첨부파일 ID |
| report_id | BIGINT (FK → as_reports) | ✅ | 보고서 ID |
| file_type | ENUM('IMAGE','VIDEO') | ✅ | 파일 유형 |
| file_path | VARCHAR(500) | ✅ | 파일 경로 |
| file_name | VARCHAR(255) | ✅ | 원본 파일명 |
| uploaded_at | DATETIME | ✅ | 업로드 일시 |

---

## 10. 장비 이력 관리

### 10.1 equipment_history (장비 상세 이력)

| 컬럼명 | 타입 | 필수 | 설명 |
|--------|------|------|------|
| history_id | BIGINT (PK, AUTO) | ✅ | 이력 ID |
| equipment_id | BIGINT (FK → equipment) | ✅ | 장비 ID |
| description | VARCHAR(500) | ✅ | 내용 |
| cost | DECIMAL(10,2) | | 비용 |
| as_request_id | BIGINT (FK → as_requests) | | 연관 A/S 접수 ID |
| spark_value | INT | | 감지 시 스파크 평균값 |
| pressure_value | FLOAT | | 감지 시 차압값 |
| occurred_at | DATETIME | ✅ | 발생 일시 |

### 10.2 consumable_schedules (소모품 교체 주기 설정)

| 컬럼명 | 타입 | 필수 | 설명 |
|--------|------|------|------|
| schedule_id | BIGINT (PK, AUTO) | ✅ | 스케줄 ID |
| equipment_id | BIGINT (FK → equipment) | ✅ | 장비 ID |
| consumable_type | VARCHAR(50) | ✅ | 소모품 종류 |
| replacement_cycle_days | INT | ✅ | 교체 주기 (일) |
| last_replaced_at | DATE | | 최근 교체일 |
| next_due_date | DATE | | 다음 교체 예정일 |
| alert_days_before | INT DEFAULT 7 | | 만료 전 알림 일수 |
| created_at | DATETIME | ✅ | 설정 일시 |

---

## 11. 기준 수치 관리

### 11.1 cleaning_thresholds (청소/필터 판단 기준값)

| 컬럼명 | 타입 | 필수 | 설명 |
|--------|------|------|------|
| threshold_id | BIGINT (PK, AUTO) | ✅ | 설정 ID |
| equipment_id | BIGINT (FK → equipment) | ✅ | 대상 장비 |
| spark_threshold | INT DEFAULT 700 | | 스파크 기준값 (0~9999, **v3.2: rev2.1 스케일 반영** — 기존 70 → 700 권장) |
| spark_time_window | INT DEFAULT 600 | | 스파크 기준 시간 (초, 기본 10분) |
| pressure_base | FLOAT | | 차압 기준값 (Pa) |
| pressure_rate | FLOAT DEFAULT 10.0 | | 차압 증가율 기준 (%) |
| set_by | BIGINT (FK → users) | ✅ | 설정자 (관리자) |
| updated_at | DATETIME | ✅ | 설정 변경 일시 |

> **v3.0 변경**: `spark_time_window` 추가 (스파크 기준 시간 튜닝 변수, 피드백 p.66)  
> **v3.2 변경**: `spark_threshold` 기본값 70 → 700 (pp_spark 범위 0-99 → 0-9999 변경 반영. 기존 설정값은 ×10 환산 필요)

**청소 필요 판단 수식**:
```
청소필요 = (최근 spark_time_window 초 동안 스파크 평균 ≥ spark_threshold)
         AND (현재 차압 ≥ pressure_base × (1 + pressure_rate / 100))
```

### 11.2 monitoring_thresholds (모니터링 지표 기준값)

| 컬럼명 | 타입 | 필수 | 설명 |
|--------|------|------|------|
| threshold_id | BIGINT (PK, AUTO) | ✅ | 설정 ID |
| metric_name | VARCHAR(50) | ✅ | 지표명 (예: "pp_temp", "inlet_temp") |
| yellow_min | FLOAT | | 주의(Yellow) 최소값 |
| red_min | FLOAT | | 위험(Red) 최소값 |
| description | VARCHAR(255) | | 설명 |
| set_by | BIGINT (FK → users) | ✅ | 설정자 |
| updated_at | DATETIME | ✅ | 설정 일시 |

**기본값** (피드백 p.38~42):

| metric_name | yellow_min | red_min | 비고 |
|------------|-----------|---------|------|
| inlet_temp | 70.0 | 100.0 | 유입온도 (°C) |
| pp_temp | TBD | TBD | 보드온도 (°C) |
| pp_spark | TBD | TBD | 스파크 (0-9999, **v3.2: 범위 확대**) — 임계값 재설정 필요 |

---

## 12. ESG 지표

### 12.1 esg_metrics (ESG 지표 데이터)

| 컬럼명 | 타입 | 필수 | 설명 |
|--------|------|------|------|
| metric_id | BIGINT (PK, AUTO) | ✅ | 지표 ID |
| store_id | BIGINT (FK → stores) | ✅ | 매장 ID |
| equipment_id | BIGINT (FK → equipment) | ✅ | 장비 ID |
| date | DATE | ✅ | 측정 날짜 |
| oil_collected_volume | FLOAT | | 유증 포집량 (L) |
| waste_oil_collected | FLOAT | | 폐유 수집량 (L) — 임시: 유증 포집량 × 2 |
| total_collected | FLOAT | | 합계 (L) |
| created_at | DATETIME | ✅ | 생성 일시 |

> **v3.0**: 폐유 수집량은 임시로 유증 포집량 × 2 (피드백 p.39). 추후 실제 IoT 저울 연동 시 데이터셋 구축 필요.

---

## 13. 외부 API 연동

### 13.1 outdoor_air_quality (실외 공기질 캐시)

| 컬럼명 | 타입 | 필수 | 설명 |
|--------|------|------|------|
| record_id | BIGINT (PK, AUTO) | ✅ | 레코드 ID |
| station_name | VARCHAR(100) | ✅ | 측정소명 |
| region_code | VARCHAR(20) | ✅ | 지역 코드 |
| pm10 | FLOAT | | PM10 (µg/m³) |
| pm2_5 | FLOAT | | PM2.5 (µg/m³) |
| o3 | FLOAT | | 오존 (ppm) |
| co | FLOAT | | 일산화탄소 (ppm) |
| no2 | FLOAT | | 이산화질소 (ppm) |
| so2 | FLOAT | | 이산화황 (ppm) |
| overall_index | INT | | 통합대기환경지수 |
| measured_at | DATETIME | ✅ | 측정 시각 |
| fetched_at | DATETIME | ✅ | API 조회 시각 |

---

## 14. 대시보드 이슈/알림 규칙 (v3.0 — 피드백 p.33~34)

### 14.1 문제 발생 이슈 (주의+위험 모두 표시)

| # | 이슈 항목 | 지표 | Yellow 조건 | Red 조건 |
|---|---------|------|------------|---------|
| 1 | 통신 연결 상태 점검 | 장비 연결 상태 | 끊김 1시간 이상 지속 | 끊김 하루 이상 지속 |
| 2 | 유입 온도 이상 | 유입온도 (inlet_temp) | 70°C 이상 | 100°C 이상 |
| 3 | 필터 청소 상태 점검 | 필터 점검 상태 | 점검 필요 | - |
| 4 | 먼지제거 성능 점검 | 먼지제거 성능 (PM2.5/PM10) | - | 점검 필요 |

> ※ 실내공기질 정보는 이슈/알림에 표시하지 않음

### 14.2 긴급 알람 (Red만 표시 + 이메일 발송)

| # | 이슈 항목 | Red 조건 |
|---|---------|---------|
| 1 | 통신 연결 상태 | 끊김 하루 이상 지속 |
| 2 | 유입 온도 이상 | 100°C 이상 |

> 긴급 알람 시 관리자에게 이메일 발송 (피드백 p.34)

### 14.3 장비 색상 표시 규칙 (피드백 p.27)

- **파워팩(컨트롤러)**: 주의(Yellow)/위험(Red) 범주면 해당 색 표시
- **장비(Equipment)**: 하위 파워팩 중 가장 높은 상태색 표시 (주의+위험 공존시 Red)
- **게이트웨이/층**: 하위 장비들 중 가장 높은 상태색 표시
  - 문제 없으면 Green + "정상 운영"
  - 문제 있으면 해당 색 + "문제 발생"

---

## 15. 데이터 갱신 정책

| 데이터 유형 | 갱신 방식 | 갱신 주기 | 비고 |
|-----------|---------|---------|------|
| sensor (IAQ + Controller) | 실시간 | **10초** | MQTT 규격 확정 |
| status (게이트웨이 상태) | 실시간 | **10초** (sensor와 동시) | MQTT 규격 확정 |
| 실외 공기질 | 주기적 배치 | Airkorea API 제공 주기 (1시간) | 외부 API |
| 제어 명령/응답 | 실시간 | 즉시 | |
| 알람 판정 | 서버 연산 | 센서 데이터 수신 시 | pp_alarm + 서버 로직 |
| ESG 지표 | 일간 배치 | 1일 1회 집계 | |

---

## 16. 데이터 보존 정책

| 데이터 유형 | 보존 기간 | 비고 |
|-----------|---------|------|
| gateway_sensor_data | 원본 90일, 집계 5년 | 10초 원본 → 1시간 집계 |
| controller_sensor_data | 원본 90일, 집계 5년 | 10초 원본 → 1시간 집계 |
| alarm_events | 영구 | 이력 관리 필수 |
| control_commands | 영구 | 감사 추적 필수 |
| as_requests / as_reports | 영구 | 장비 이력 관리 |
| equipment_history | 영구 | A/S + 청소상태 이력 |

> **v3.0**: 센서 데이터 원본 주기 1분 → **10초** 변경에 따라 저장량 6배 증가. 원본 90일 보존 후 1시간 집계로 전환.

---

## 17. 엔티티 관계 요약

```
users ─┬─ user_business_info (1:1)
       ├─ dealer_profiles (1:1, role=DEALER)
       ├─ hq_profiles (1:1, role=HQ)
       ├─ owner_profiles (1:1, role=OWNER)
       ├─ role_permissions (N:1, role 기준)
       └─ user_permission_overrides (1:N)

stores ─┬─ store_floors (1:N)
        ├─ equipment (1:N, 선택적)
        ├─ gateways (1:N)
        ├─ alarm_events (1:N)
        ├─ as_requests (1:N)
        └─ esg_metrics (1:N)

equipment ─┬─ controllers (1:N, 최대 4)
           ├─ cleaning_thresholds (1:1)
           ├─ damper_auto_settings (1:N)
           ├─ equipment_history (1:N)
           ├─ consumable_schedules (1:N)
           └─ equipment_models (N:1, FK 참조)

gateways ─┬─ controllers (1:N)
          └─ gateway_sensor_data (1:N, 시계열)

controllers ─── controller_sensor_data (1:N, 시계열)

as_requests ─┬─ as_attachments (1:N)
             └─ as_reports (1:1)
                  └─ as_report_attachments (1:N)
```

**v3.0 삭제된 테이블/엔티티**:
- ~~cell_types~~ (수동 입력으로 변경)
- ~~powerpacks~~ (controller = 파워팩으로 통합)
- ~~fire_control_history~~ (control_commands로 통합)
- ~~power_control_history~~ (control_commands로 통합)

---

## 18. MySQL DDL 요약 (주요 테이블)

```sql
-- 센서 데이터 파티셔닝 (10초 주기 대응)
CREATE TABLE controller_sensor_data (
    data_id BIGINT AUTO_INCREMENT,
    controller_id BIGINT NOT NULL,
    equipment_id BIGINT NOT NULL,
    gateway_id BIGINT NOT NULL,
    timestamp INT UNSIGNED NOT NULL,
    received_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    pm2_5 FLOAT, pm10 FLOAT,
    diff_pressure FLOAT, oil_level TINYINT DEFAULT 0,  -- v3.2: FLOAT→TINYINT (0=정상, 1=만수)
    pp_temp INT, pp_spark INT,                          -- v3.2: pp_spark 범위 0-9999
    pp_power INT, pp_alarm INT,
    fan_speed INT, fan_mode INT DEFAULT 0,
    fan_running TINYINT DEFAULT 0,                      -- v3.2 신규: 인버터 실제 운전 상태
    fan_freq FLOAT DEFAULT 0.0,                         -- v3.2 신규: 인버터 실제 출력 주파수 (Hz)
    fan_target_pct FLOAT DEFAULT 0.0,                   -- v3.2 신규: PID 목표값 (%, 자동 모드)
    damper_mode INT DEFAULT 0,
    damper_ctrl FLOAT DEFAULT 0.0,                      -- v3.2 신규: 댐퍼 제어 명령값 Damper_CTRL (%)
    flow FLOAT, damper FLOAT,
    inlet_temp FLOAT, velocity FLOAT, duct_dp FLOAT,
    status_flags INT DEFAULT 0,
    PRIMARY KEY (data_id, received_at),
    INDEX idx_ctrl_ts (controller_id, timestamp)
) PARTITION BY RANGE (TO_DAYS(received_at)) (
    -- 일별 파티션 자동 생성 (운영 스크립트)
);

-- 장비 테이블 (v3.0 반영)
CREATE TABLE equipment (
    equipment_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    equipment_serial VARCHAR(50) UNIQUE NOT NULL,
    mqtt_equipment_id VARCHAR(50) UNIQUE NOT NULL,
    store_id BIGINT,
    floor_id BIGINT,
    equipment_name VARCHAR(100),
    model_id BIGINT,
    cell_type VARCHAR(100),
    powerpack_count INT DEFAULT 1 CHECK (powerpack_count <= 4),
    purchase_date DATE,
    warranty_end_date DATE,
    dealer_id BIGINT,
    status ENUM('NORMAL','INSPECTION','CLEANING','INACTIVE') NOT NULL DEFAULT 'NORMAL',
    connection_status ENUM('ONLINE','OFFLINE') DEFAULT 'OFFLINE',
    last_seen_at DATETIME,
    registered_by BIGINT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (store_id) REFERENCES stores(store_id),
    FOREIGN KEY (floor_id) REFERENCES store_floors(floor_id),
    FOREIGN KEY (model_id) REFERENCES equipment_models(model_id),
    FOREIGN KEY (dealer_id) REFERENCES users(user_id),
    FOREIGN KEY (registered_by) REFERENCES users(user_id)
);
```

---

*본 문서는 MQTT Payload 규격_260227_v2.pdf, MQTT 토픽 구조 변경 및 협의 사항.pdf, ESP 관리툴_최종피드백_260212.pdf를 최우선 근거로 작성되었습니다. 개발 진행에 따라 변경될 수 있습니다.*
