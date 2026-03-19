# MetaBeans ESP — MQTT 통신 프로토콜 설계서 v2.1

> 📋 [수정 이력](MetaBeans_ESP_MQTT_통신_프로토콜_설계서__최신_CHANGELOG.md)

> **프롬프트 D-1**: MQTT Payload 처리 및 백엔드 연동  
> **작성일**: 2026-02-13  
> **최종 업데이트**: 2026-02-27 (v2.1)  
> **근거 문서**: MQTT_Payload_규격_260227_v2.pdf, MQTT_토픽_구조_변경_및_협의_사항.pdf, ESP_관리툴_최종피드백_260212.pdf, MetaBeans_ESP_데이터구조_정의서_v3_0.md, MetaBeans_ESP_프로젝트_아키텍처_기술스택_정의서.md

---

## 목차

1. [개요 및 아키텍처](#1-개요-및-아키텍처)
2. [MQTT 기본 설정](#2-mqtt-기본-설정)
3. [토픽 구조 설계](#3-토픽-구조-설계)
4. [Payload 구조 및 파싱 로직](#4-payload-구조-및-파싱-로직)
5. [AWS IoT Core → 백엔드 데이터 파이프라인](#5-aws-iot-core--백엔드-데이터-파이프라인)
6. [센서 데이터 → DB 저장 로직](#6-센서-데이터--db-저장-로직)
7. [통신 오류 감지 로직 (30초 타임아웃)](#7-통신-오류-감지-로직-30초-타임아웃)
8. [제어 명령 발행 및 ACK 처리](#8-제어-명령-발행-및-ack-처리)
9. [설정 변경 (config) 토픽](#9-설정-변경-config-토픽)
10. [알람 이벤트 생성 로직](#10-알람-이벤트-생성-로직)
11. [데이터 보존 및 집계 정책](#11-데이터-보존-및-집계-정책)
12. [구현 파일 구조 및 모듈 명세](#12-구현-파일-구조-및-모듈-명세)
13. [테스트 전략](#13-테스트-전략)

---

## 1. 개요 및 아키텍처

### 1.1 시스템 구성

```
┌─────────────────────────────────────────────────────────────┐
│                      DEVICE LAYER                           │
│                                                             │
│   파워팩(ESP32)  ──WiFi──▶  게이트웨이(층별 1대)            │
│   (컨트롤러)                 (IAQ 센서 내장)                │
│                                                             │
│   장비 계층:                                                │
│   Site(매장) → Floor(층) → Gateway → Equipment → Controller│
└─────────────────────────────────────────────────────┬───────┘
                               │ MQTT v3.1.1 (WiFi → Internet)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                   AWS IoT Core (MQTT Broker)                │
│                                                             │
│   - QoS 1 (모든 토픽)                                      │
│   - Retain 0 (비활성)                                      │
│   - 10초 주기 센서+상태 발행                                │
│   - IoT Rule Engine → Lambda/직접 연동                     │
└─────────────────────────────────────────────────────┬───────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND SERVER                            │
│                                                             │
│   ┌─────────────────────────────────────────────────────┐   │
│   │           MQTT 브릿지 서비스 (mqtt.service.ts)       │   │
│   │                                                     │   │
│   │   mqtt.js 클라이언트                                │   │
│   │   ├── sensor 토픽 구독 → 파싱 → DB 저장             │   │
│   │   ├── status 토픽 구독 → 게이트웨이 상태 갱신        │   │
│   │   ├── control/ack 구독 → 제어 결과 업데이트          │   │
│   │   ├── config/ack 구독 → 설정 변경 결과 업데이트      │   │
│   │   └── 30초 타임아웃 감지 → 통신 오류 처리            │   │
│   └─────────────────────────────────────────────────────┘   │
│                                                             │
│   ┌─────────────────────────────────────────────────────┐   │
│   │           REST API (Express)                         │   │
│   │                                                     │   │
│   │   POST /control/command → MQTT publish              │   │
│   │   POST /config/update → MQTT publish (config)       │   │
│   │   GET  /monitoring/*/latest → latest sensor cache   │   │
│   │   GET  /monitoring/*/history → DB 조회              │   │
│   └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┬───────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│   MySQL 8.0 (Amazon RDS)                                    │
│   - gateway_sensor_data (IAQ, 월별 파티션)                  │
│   - controller_sensor_data (파워팩, 일별 파티션)            │
│   - alarm_events (영구 보관)                                │
│   - control_commands (영구 보관)                            │
│   - config_commands (영구 보관)                             │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 데이터 흐름

```
[Upstream — 센서 → 서버]
파워팩(ESP32) ─WiFi→ 게이트웨이 ─WiFi→ AWS IoT Core ─→ MQTT 브릿지 ─→ MySQL
                                                                      ─→ 인메모리 캐시 (latest)
                                                                      ─→ 알람 판정 로직

[Downstream — 제어 명령]
프론트엔드 ─REST→ Express API ─→ MQTT 브릿지 ─→ AWS IoT Core ─→ 게이트웨이 ─→ 파워팩
                               ←── control/ack ←──────────────────────────────────────┘

[Downstream — 설정 변경]
프론트엔드 ─REST→ Express API ─→ MQTT 브릿지 ─→ AWS IoT Core ─→ 게이트웨이
                               ←── config/ack ←──────────────────────────┘
```

### 1.3 장비 계층 및 수량 제한

```
Site (매장)
└── Floor (층)                    — 매장당 N개 층
    └── Gateway (게이트웨이)      — 층당 1대 (IAQ 센서 내장)
        └── Equipment (집진기)    — 게이트웨이당 최대 5대
            └── Controller (파워팩) — 집진기당 1~3대
```

| 계층 | 수량 제한 | ID 형식 | 예시 |
|------|---------|---------|------|
| Site | 무제한 (~200개 매장) | string | `"site-001"` |
| Floor | 매장당 N개 | string | `"1F"`, `"B1"` |
| Gateway | 층당 1대 | string | `"gw-001"` |
| Equipment | 게이트웨이당 최대 5대 | string | `"esp-001"` |
| Controller | 집진기당 1~3대 | string | `"ctrl-001"` |

> **ID 할당 방식**: 모든 ID는 내부 고유번호를 사용하며, 설치 시 각 장비에 펌웨어 설정. MQTT로 수신되는 ID를 그대로 DB에서 사용 (별도 매칭 불필요).
>
> - **Controller**: 컨트롤러 펌웨어에 `controller_id` + `equipment_id` 설정. 페어링 시 게이트웨이에 전달.
> - **Gateway**: 게이트웨이 펌웨어에 `gateway_id`, `site_id`, `floor_id` 설정.
> - 게이트웨이는 컨트롤러로부터 수신한 `equipment_id`로 자동 그룹핑하여 MQTT에 발행.

---

## 2. MQTT 기본 설정

### 2.1 프로토콜 설정

| 항목 | 설정값 | 비고 |
|------|-------|------|
| **프로토콜** | MQTT v3.1.1 | AWS IoT Core 지원 버전 |
| **QoS** | 1 (모든 토픽) | AWS IoT Core는 QoS 2 미지원 |
| **Retain** | 0 (비활성) | 10초 주기 발행으로 Retain 불필요 |
| **센서 발행 주기** | 10초 | sensor + status 동시 발행 |
| **통신 오류 판정** | 30초 미수신 | 피드백 p.38 기준 |
| **타임스탬프** | Unix epoch (초 단위) | 서버 UTC 저장, 클라이언트 로컬 변환 |
| **페이로드 인코딩** | UTF-8 JSON | |
| **최대 페이로드** | ~6KB (실측) | MQTT 128KB 한도 대비 충분 |

#### QoS 토픽별 설정

| 토픽 | QoS | 설명 |
|------|-----|------|
| sensor | 1 | 센서 데이터 누락 방지 |
| status | 1 | 상태 정보 누락 방지 |
| control | 1 | 제어 명령 전달 보장 |
| control/ack | 1 | 응답 전달 보장 |
| config | 1 | 설정 변경 전달 보장 |
| config/ack | 1 | 설정 응답 전달 보장 |

### 2.2 페이로드 크기 예상

| 구성 | 예상 크기 |
|------|---------|
| Gateway IAQ만 | ~300 bytes |
| Equipment 1대 × Controller 2대 | ~600 bytes |
| Equipment 3대 × Controller 4대 | ~3.5 KB |
| **최대 (Equipment 5대 × Controller 4대)** | **~6 KB** |

### 2.3 AWS IoT Core 연결 설정

```typescript
// src/config/mqtt.ts

export const mqttConfig = {
  // AWS IoT Core 엔드포인트
  endpoint: process.env.AWS_IOT_ENDPOINT,  // e.g., "a1b2c3d4e5f6g7-ats.iot.ap-northeast-2.amazonaws.com"
  region: 'ap-northeast-2',                // 서울 리전
  
  // 인증: X.509 클라이언트 인증서 (AWS IoT Thing)
  certPath: process.env.AWS_IOT_CERT_PATH,
  keyPath: process.env.AWS_IOT_KEY_PATH,
  caPath: process.env.AWS_IOT_CA_PATH,
  
  // 클라이언트 설정
  clientId: `esp-backend-${process.env.NODE_ENV}-${process.env.INSTANCE_ID || '001'}`,
  keepalive: 60,            // 초
  reconnectPeriod: 5000,    // 5초 후 재연결
  connectTimeout: 30000,    // 30초 연결 타임아웃
  
  // QoS 설정
  defaultQoS: 1 as const,
  
  // 구독 토픽 패턴
  subscribeTopics: [
    'metabeans/+/+/gateway/+/sensor',       // 모든 매장 센서 데이터
    'metabeans/+/+/gateway/+/status',       // 모든 게이트웨이 상태
    'metabeans/+/+/gateway/+/control/ack',  // 제어 명령 응답
    'metabeans/+/+/gateway/+/config/ack',   // 설정 변경 응답
  ],
};
```

### 2.4 센서 값 스케일 규칙

```
모든 MQTT 페이로드 값은 변환 없이 그대로 사용.
펌웨어가 내부 스케일을 실제 값으로 변환한 뒤 전송.
서버/클라이언트에서 별도 스케일 연산 불필요.
```

---

## 3. 토픽 구조 설계

### 3.1 토픽 트리

```
metabeans/{site_id}/{floor_id}/gateway/{gw_id}/
├── sensor          # 통합 센서 데이터 발행 (10초 주기)
│                   # 방향: Gateway → Cloud
│                   # IAQ + 모든 equipment/controller 데이터 통합
│
├── status          # 게이트웨이 상태 발행 (10초 주기, sensor와 동시)
│                   # 방향: Gateway → Cloud
│                   # status_flags(7비트) + controller_count
│
├── control         # 제어 명령 수신
│                   # 방향: Cloud → Gateway
│                   # 파워팩 전원, 댐퍼 개도율/자동제어, 시로코팬 속도/자동제어
│
├── control/ack     # 제어 명령 응답 발행
│                   # 방향: Gateway → Cloud
│                   # cmd_id 매칭으로 성공/실패 확인
│
├── config          # 설정 변경 수신
│                   # 방향: Cloud → Gateway
│                   # 게이트웨이 런타임 설정 변경 (부분 업데이트 지원)
│
└── config/ack      # 설정 변경 응답 발행
                    # 방향: Gateway → Cloud
                    # 결과 + 재부팅 필요 여부
```

### 3.2 토픽 예시

```
# 센서 데이터 발행
metabeans/site-001/1F/gateway/gw-001/sensor

# 제어 명령 수신
metabeans/site-001/1F/gateway/gw-001/control

# 제어 응답 발행
metabeans/site-001/1F/gateway/gw-001/control/ack

# 설정 변경 수신
metabeans/site-001/1F/gateway/gw-001/config

# 설정 변경 응답 발행
metabeans/site-001/1F/gateway/gw-001/config/ack
```

### 3.3 구독 패턴

| 패턴 | 설명 | 사용처 |
|------|------|--------|
| `metabeans/+/+/gateway/+/sensor` | 모든 매장 센서 데이터 | 백엔드 브릿지 서비스 |
| `metabeans/+/+/gateway/+/status` | 모든 게이트웨이 상태 | 백엔드 브릿지 서비스 |
| `metabeans/+/+/gateway/+/control/ack` | 모든 제어 응답 | 백엔드 브릿지 서비스 |
| `metabeans/+/+/gateway/+/config/ack` | 모든 설정 변경 응답 | 백엔드 브릿지 서비스 |
| `metabeans/site-001/+/gateway/+/#` | 특정 매장 전체 | 디버깅/모니터링 |
| `metabeans/site-001/1F/gateway/+/sensor` | 특정 층 센서 | 디버깅/모니터링 |

### 3.4 토픽에서 메타데이터 추출

```typescript
// src/utils/topicParser.ts

interface TopicMeta {
  siteId: string;
  floorId: string;
  gatewayId: string;
  messageType: 'sensor' | 'status' | 'control_ack' | 'config_ack';
}

/**
 * MQTT 토픽 문자열에서 메타데이터 추출
 * 
 * 토픽 형식: metabeans/{site_id}/{floor_id}/gateway/{gw_id}/{type}
 * 예: "metabeans/site-001/1F/gateway/gw-001/sensor"
 */
export function parseTopic(topic: string): TopicMeta | null {
  const parts = topic.split('/');
  
  // 최소 6 세그먼트: metabeans / site_id / floor_id / gateway / gw_id / type
  if (parts.length < 6 || parts[0] !== 'metabeans' || parts[3] !== 'gateway') {
    return null;
  }
  
  const typeSegment = parts.slice(5).join('/');  // "control/ack", "config/ack" 대응
  let messageType: TopicMeta['messageType'];
  
  switch (typeSegment) {
    case 'sensor':      messageType = 'sensor'; break;
    case 'status':      messageType = 'status'; break;
    case 'control/ack': messageType = 'control_ack'; break;
    case 'config/ack':  messageType = 'config_ack'; break;
    default: return null;
  }
  
  return {
    siteId: parts[1],
    floorId: parts[2],
    gatewayId: parts[4],
    messageType,
  };
}
```

---

## 4. Payload 구조 및 파싱 로직

### 4.1 sensor 메시지 — 통합 센서 데이터

**토픽**: `metabeans/{site_id}/{floor_id}/gateway/{gw_id}/sensor`  
**주기**: 10초  
**방향**: Gateway → Cloud

게이트웨이 IAQ 데이터 + 모든 하위 equipment/controller 데이터를 **하나의 메시지로 통합** 발행.

```json
{
  "gateway_id": "gw-001",
  "timestamp": 1234567890,
  "iaq": {
    "pm1_0": 12.5,
    "pm2_5": 25.0,
    "pm4_0": 30.0,
    "pm10": 35.0,
    "temperature": 24.5,
    "humidity": 65.0,
    "voc_index": 100,
    "nox_index": 50,
    "co2": 450,
    "o3": 25,
    "co": 1.2,
    "hcho": 30
  },
  "equipments": [
    {
      "equipment_id": "esp-001",
      "controllers": [
        {
          "controller_id": "ctrl-001",
          "timestamp": 1234567885,
          "pm2_5": 25.0,
          "pm10": 35.0,
          "diff_pressure": 12.0,
          "oil_level": 0,
          "pp_temp": 45,
          "pp_spark": 123,
          "pp_power": 1,
          "pp_alarm": 0,
          "fan_speed": 2,
          "fan_mode": 0,
          "fan_running": 1,
          "fan_freq": 42.50,
          "fan_target_pct": 0.0,
          "damper_mode": 0,
          "damper_ctrl": 80.0,
          "flow": 850.0,
          "damper": 75.0,
          "inlet_temp": 22.5,
          "velocity": 8.3,
          "duct_dp": 245.0,
          "status_flags": 63
        }
      ]
    }
  ]
}
```

#### 4.1.1 iaq 필드 (게이트웨이 IAQ)

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

#### 4.1.2 controllers[] 필드 (파워팩 센서)

| 필드 | 타입 | 단위 | 설명 |
|------|------|------|------|
| controller_id | string | - | 컨트롤러 ID |
| timestamp | int | epoch초 | 게이트웨이가 해당 컨트롤러 데이터를 마지막으로 수신한 시간 |
| pm2_5 | float | µg/m³ | 배출부 PM2.5 농도 |
| pm10 | float | µg/m³ | 배출부 PM10 농도 |
| diff_pressure | float | Pa | ESP 집진부 차압 |
| oil_level | **int** | - | 오일 만수 감지 (0=정상, 1=만수) — **v2.1: float→int, 디지털 센서** |
| pp_temp | int | °C | 파워팩 온도 (**정수**, x10 스케일 아님) |
| pp_spark | int | - | 스파크 수치 **(0-9999**, rev2.1 이전 0-99) — **v2.1: 범위 확대** |
| pp_power | int | - | 전원 상태 (0=OFF, 1=ON) |
| pp_alarm | int | - | 파워팩 알람 (0=정상, 1=알람) |
| fan_speed | int | - | 팬 속도 단계 (0=OFF, 1=LOW, 2=MID, 3=HIGH), **수동 모드에서만 유의미** |
| **fan_mode** | **int** | **-** | **팬 제어 모드 (0=수동, 1=자동)** |
| **fan_running** | **int** | **-** | **v2.1 신규** 인버터 실제 운전 상태 (0=정지, 1=운전중) — M100 RUN_STATUS 레지스터 |
| **fan_freq** | **float** | **Hz** | **v2.1 신규** M100 인버터 실제 출력 주파수 (0~50.00 Hz) |
| **fan_target_pct** | **float** | **%** | **v2.1 신규** PID 목표값 (0.0~100.0%), fan_mode=1(자동) 시만 유의미, 수동 시 0 |
| **damper_mode** | **int** | **-** | **댐퍼 제어 모드 (0=수동, 1=자동)** |
| **damper_ctrl** | **float** | **%** | **v2.1 신규** 댐퍼 제어 명령값 Damper_CTRL (0-100%) — damper는 피드백값 Damper_FB와 구분 |
| flow | float | CMH | 풍량 (flo-OAC Q_act, 현재유량) |
| damper | float | % | 댐퍼 개도율 (flo-OAC Damper_FB 피드백, 0-100) |
| inlet_temp | float | °C | 유입 온도 (flo-OAC T_act, -20~50) |
| velocity | float | m/s | 현재 풍속 (flo-OAC V_act, 0~20.0) |
| duct_dp | float | Pa | 덕트 차압 (flo-OAC DP_Pv, -49~980) |
| status_flags | int | - | 상태 플래그 (비트마스크, 6비트) |

> **v2.0 변경**: `fan_mode`, `damper_mode` 필드 추가. 자동/수동 제어 모드를 센서 데이터로 실시간 모니터링 가능.
>
> **v2.1 변경**: `oil_level` float→int (0=정상, 1=만수), `pp_spark` 범위 0-9999 확대, `fan_running` / `fan_freq` / `fan_target_pct` / `damper_ctrl` 신규 필드 추가.

#### 4.1.3 Controller status_flags 비트 정의 (6비트)

| 비트 | 의미 | 0 = 이상 | 1 = 정상 |
|------|------|---------|---------|
| 0 | 파워팩 RS-485 통신 | RS-485 통신 실패 | RS-485 통신 정상 |
| 1 | SPS30 (PM2.5) 센서 | PM2.5 센서 이상 | PM2.5 센서 정상 |
| 2 | SDP810 (차압) 센서 | 차압 센서 이상 | 차압 센서 정상 |
| 3 | 수위 센서 | 수위 센서 이상 | 수위 센서 정상 |
| 4 | flo-OAC 댐퍼 컨트롤러 | 댐퍼 컨트롤러 이상 | 댐퍼 컨트롤러 정상 |
| 5 | LS M100 인버터 (RS-485 통신 정상 **AND** Fault Trip 없음) | 인버터 이상 또는 Fault Trip | 통신 정상 + 정상 운전 — **v2.1: 복합 판정** |

> **63 = 0b111111 = 모든 센서 정상**

```typescript
// status_flags 파싱 유틸리티
export function parseControllerStatusFlags(flags: number) {
  return {
    rs485Ok:       Boolean(flags & 0b000001),  // bit 0
    sps30Ok:       Boolean(flags & 0b000010),  // bit 1
    sdp810Ok:      Boolean(flags & 0b000100),  // bit 2
    waterLevelOk:  Boolean(flags & 0b001000),  // bit 3
    floOacOk:      Boolean(flags & 0b010000),  // bit 4
    inverterOk:    Boolean(flags & 0b100000),  // bit 5: RS-485 통신 정상 AND Fault Trip 없음 (v2.1: 복합 판정)
    allOk:         flags === 63,
  };
}
```

### 4.2 status 메시지 — 게이트웨이 상태

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

| 필드 | 타입 | 설명 |
|------|------|------|
| gateway_id | string | 게이트웨이 ID |
| status_flags | int | 상태 플래그 (7비트 비트마스크) |
| controller_count | int | 현재 연결된 컨트롤러 수 |
| timestamp | int | 발행 시간 (Unix epoch, 초) |
| wifi | object | **v2.1 신규** 게이트웨이 Wi-Fi 연결 정보 (미연결 시 rssi=0, channel=0) |

**wifi 객체 필드** (v2.1 신규):

| 필드 | 타입 | 설명 |
|------|------|------|
| ssid | string | 연결된 Wi-Fi SSID |
| rssi | int | 수신 신호 강도 (dBm) |
| ip | string | 게이트웨이 IP 주소 |
| mac | string | 게이트웨이 MAC 주소 |
| channel | int | Wi-Fi 채널 번호 |

#### Gateway status_flags 비트 정의 (7비트)

| 비트 | 의미 | 0 = 이상 | 1 = 정상 |
|------|------|---------|---------|
| 0 | SEN55 정상 (PM, 온습도, VOC, NOx) | 센서 이상 | 정상 |
| 1 | SCD40 정상 (CO2) | 센서 이상 | 정상 |
| 2 | O3 센서 정상 (SEN0321) | 센서 이상 | 정상 |
| 3 | CO 센서 정상 (SEN0466) | 센서 이상 | 정상 |
| 4 | HCHO 센서 정상 (SFA30) | 센서 이상 | 정상 |
| 5 | 1개 이상 컨트롤러 연결됨 | 연결된 컨트롤러 없음 | 1개 이상 연결됨 |
| 6 | 페어링 모드 | 일반 모드 | 페어링 모드 진입 |

> **63 = 0b0111111 = 모든 센서 정상 + 컨트롤러 연결됨 + 일반 모드**

```typescript
export function parseGatewayStatusFlags(flags: number) {
  return {
    sen55Ok:            Boolean(flags & 0b0000001),  // bit 0
    scd40Ok:            Boolean(flags & 0b0000010),  // bit 1
    o3Ok:               Boolean(flags & 0b0000100),  // bit 2
    coOk:               Boolean(flags & 0b0001000),  // bit 3
    hchoOk:             Boolean(flags & 0b0010000),  // bit 4
    controllerConnected: Boolean(flags & 0b0100000),  // bit 5
    pairingMode:         Boolean(flags & 0b1000000),  // bit 6
  };
}
```

### 4.3 control 메시지 — 제어 명령

**토픽**: `metabeans/{site_id}/{floor_id}/gateway/{gw_id}/control`  
**방향**: Cloud → Gateway

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

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| cmd_id | string | ✅ | UUID, ACK 매칭용 |
| equipment_id | string | ✅ | 대상 집진기 (`"all"` = 전체) |
| controller_id | string | ✅ | 대상 컨트롤러 (`"all"` = 전체) |
| target | int | ✅ | 제어 대상 (0=파워팩, 1=댐퍼, 2=시로코팬) |
| action | int | ✅ | 액션 코드 |
| value | number | | 설정값 (타겟/액션에 따라 int 또는 float) |

### 4.4 control/ack 메시지 — 제어 응답

**토픽**: `metabeans/{site_id}/{floor_id}/gateway/{gw_id}/control/ack`  
**방향**: Gateway → Cloud

```json
{
  "cmd_id": "550e8400-e29b-41d4-a716-446655440000",
  "result": "success",
  "reason": ""
}
```

| 필드 | 타입 | 설명 |
|------|------|------|
| cmd_id | string | 명령 ID (요청 cmd_id와 매칭) |
| result | string | `"success"` 또는 `"fail"` |
| reason | string | 실패 시 사유 (성공 시 빈 문자열) |

### 4.5 config 메시지 — 설정 변경

**토픽**: `metabeans/{site_id}/{floor_id}/gateway/{gw_id}/config`  
**방향**: Cloud → Gateway

게이트웨이의 런타임 설정을 원격으로 변경합니다. **부분 업데이트(partial update)**를 지원하며, 포함된 필드만 변경됩니다.

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
| cmd_id | string | 필수 | 명령 ID (config/ack 매칭용, UUID 권장) |
| site_id | string | 선택 | 매장 ID 변경 (NVS 저장, 재부팅 필요) |
| floor_id | string | 선택 | 층 ID 변경 (NVS 저장, 재부팅 필요) |
| gateway_id | string | 선택 | 게이트웨이 ID 변경 (NVS 저장, 재부팅 필요) |
| sensor_interval_ms | int | 선택 | 센서 폴링 주기 (ms, 1000~60000, 기본 5000) |
| mqtt_interval_ms | int | 선택 | MQTT 발행 주기 (ms, 5000~60000, 기본 10000) |
| mqtt_broker_uri | string | 선택 | MQTT 브로커 URI (NVS 저장, 재부팅 필요) |
| wifi_ssid | string | 선택 | Wi-Fi SSID (NVS 저장, 재부팅 필요) |
| wifi_password | string | 선택 | Wi-Fi 비밀번호 (NVS 저장, 재부팅 필요) |
| reboot | bool | 선택 | `true` 시 즉시 재부팅 수행 |

**필드 분류**:

- **즉시 적용 (재부팅 불필요)**: `sensor_interval_ms`, `mqtt_interval_ms`
- **NVS 저장 + 재부팅 필요**: `site_id`, `floor_id`, `gateway_id`, `mqtt_broker_uri`, `wifi_ssid`, `wifi_password`

**자동 재부팅 동작**: 재부팅이 필요한 필드가 변경되면 → NVS에 새 값 저장 → config/ack 응답 발행 (`needs_reboot: true`) → 1초 대기 후 자동 재부팅 수행. `reboot: true`가 명시적으로 포함된 경우에도 동일하게 ACK 후 1초 대기 재부팅.

**유효성 검증**:

| 필드 | 검증 규칙 | 실패 시 |
|------|---------|--------|
| sensor_interval_ms | 1000 ≤ value ≤ 60000 | `"fail"` + 사유 |
| mqtt_interval_ms | 5000 ≤ value ≤ 60000 | `"fail"` + 사유 |
| 문자열 필드 | 빈 문자열 불가 | `"fail"` + 사유 |
| cmd_id | 누락 시 | 메시지 무시 (ACK 불가) |

### 4.6 config/ack 메시지 — 설정 변경 응답

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
| result | string | `"success"` 또는 `"fail"` |
| reason | string | 실패 시 사유 (성공 시 빈 문자열) |
| needs_reboot | bool | `true`이면 ACK 발행 후 자동 재부팅 예정 |

### 4.7 Zod 검증 스키마

```typescript
// src/validators/mqtt.validator.ts
import { z } from 'zod';

// ── IAQ 필드 ──
const IaqSchema = z.object({
  pm1_0: z.number(),
  pm2_5: z.number(),
  pm4_0: z.number(),
  pm10: z.number(),
  temperature: z.number(),
  humidity: z.number(),
  voc_index: z.number().int().min(1).max(500).nullable(),
  nox_index: z.number().int().min(1).max(500).nullable(),
  co2: z.number().int(),
  o3: z.number().int(),
  co: z.number(),
  hcho: z.number().int(),
});

// ── 컨트롤러 센서 데이터 ──
const ControllerDataSchema = z.object({
  controller_id: z.string(),
  timestamp: z.number().int(),
  pm2_5: z.number(),
  pm10: z.number(),
  diff_pressure: z.number(),
  oil_level: z.literal(0).or(z.literal(1)),       // v2.1: float→int (0=정상, 1=만수)
  pp_temp: z.number().int(),
  pp_spark: z.number().int().min(0).max(9999),     // v2.1: 0-99→0-9999 (rev2.1 파워팩)
  pp_power: z.literal(0).or(z.literal(1)),
  pp_alarm: z.literal(0).or(z.literal(1)),
  fan_speed: z.number().int().min(0).max(3),
  fan_mode: z.number().int().min(0).max(1),
  fan_running: z.literal(0).or(z.literal(1)),      // v2.1 신규: 인버터 운전 상태
  fan_freq: z.number().min(0).max(50),             // v2.1 신규: Hz (0~50.00)
  fan_target_pct: z.number().min(0).max(100),      // v2.1 신규: PID 목표값 %
  damper_mode: z.number().int().min(0).max(1),
  damper_ctrl: z.number().min(0).max(100),         // v2.1 신규: 댐퍼 명령값 (damper=피드백)
  flow: z.number(),
  damper: z.number().min(0).max(100),              // Damper_FB (피드백값, damper_ctrl과 구분)
  inlet_temp: z.number(),
  velocity: z.number(),
  duct_dp: z.number(),
  status_flags: z.number().int().min(0).max(63),
});

// ── Equipment 컨테이너 ──
const EquipmentDataSchema = z.object({
  equipment_id: z.string(),
  controllers: z.array(ControllerDataSchema).min(1).max(4),
});

// ── 통합 sensor 메시지 ──
export const SensorMessageSchema = z.object({
  gateway_id: z.string(),
  timestamp: z.number().int(),
  iaq: IaqSchema,
  equipments: z.array(EquipmentDataSchema).min(0).max(5),
});

// ── status 메시지 ──
export const StatusMessageSchema = z.object({
  gateway_id: z.string(),
  status_flags: z.number().int().min(0).max(127),  // 7비트
  controller_count: z.number().int().min(0),
  timestamp: z.number().int(),
  wifi: z.object({                                   // v2.1 신규: Wi-Fi 연결 정보
    ssid: z.string(),
    rssi: z.number().int(),
    ip: z.string(),
    mac: z.string(),
    channel: z.number().int(),
  }).optional(),
});

// ── control/ack 메시지 ──
export const ControlAckSchema = z.object({
  cmd_id: z.string().uuid(),
  result: z.enum(['success', 'fail']),
  reason: z.string(),
});

// ── config/ack 메시지 ── (v2.0 추가)
export const ConfigAckSchema = z.object({
  cmd_id: z.string().uuid(),
  result: z.enum(['success', 'fail']),
  reason: z.string(),
  needs_reboot: z.boolean(),
});

// 타입 추출
export type SensorMessage = z.infer<typeof SensorMessageSchema>;
export type StatusMessage = z.infer<typeof StatusMessageSchema>;
export type ControlAck = z.infer<typeof ControlAckSchema>;
export type ConfigAck = z.infer<typeof ConfigAckSchema>;
```

---

## 5. AWS IoT Core → 백엔드 데이터 파이프라인

### 5.1 연결 방식: 직접 MQTT 클라이언트

```
AWS IoT Core ←── mqtt.js (Node.js) ──→ Express 백엔드 (동일 프로세스)
```

> **선정 사유**: 200개 매장 규모에서 Lambda 비용 대비 직접 연결이 경제적. mqtt.js는 AWS IoT Core 연동 검증된 라이브러리.

### 5.2 MQTT 브릿지 서비스 구현

```typescript
// src/services/mqtt.service.ts

import * as mqtt from 'mqtt';
import { mqttConfig } from '../config/mqtt';
import { parseTopic } from '../utils/topicParser';
import { SensorMessageSchema, StatusMessageSchema, ControlAckSchema, ConfigAckSchema } from '../validators/mqtt.validator';
import { sensorService } from './sensor.service';
import { connectionMonitor } from './connection-monitor.service';
import { controlService } from './control.service';
import { configService } from './config.service';
import { logger } from '../utils/logger';

class MqttBridgeService {
  private client: mqtt.MqttClient | null = null;

  /**
   * MQTT 브릿지 시작
   * - AWS IoT Core 연결
   * - 토픽 구독
   * - 메시지 핸들러 등록
   */
  async start(): Promise<void> {
    this.client = mqtt.connect(mqttConfig.endpoint, {
      cert: fs.readFileSync(mqttConfig.certPath),
      key: fs.readFileSync(mqttConfig.keyPath),
      ca: fs.readFileSync(mqttConfig.caPath),
      clientId: mqttConfig.clientId,
      keepalive: mqttConfig.keepalive,
      reconnectPeriod: mqttConfig.reconnectPeriod,
      connectTimeout: mqttConfig.connectTimeout,
      protocol: 'mqtts',
    });

    this.client.on('connect', () => {
      logger.info('[MQTT] Connected to AWS IoT Core');
      
      // 토픽 구독
      for (const topic of mqttConfig.subscribeTopics) {
        this.client!.subscribe(topic, { qos: mqttConfig.defaultQoS }, (err) => {
          if (err) logger.error(`[MQTT] Subscribe failed: ${topic}`, err);
          else logger.info(`[MQTT] Subscribed: ${topic}`);
        });
      }
    });

    this.client.on('message', this.handleMessage.bind(this));
    this.client.on('error', (err) => logger.error('[MQTT] Error:', err));
    this.client.on('reconnect', () => logger.warn('[MQTT] Reconnecting...'));
    this.client.on('offline', () => logger.warn('[MQTT] Client offline'));
  }

  /**
   * 메시지 라우터
   * 토픽에서 메시지 타입을 판별하여 적절한 핸들러로 분배
   */
  private async handleMessage(topic: string, payload: Buffer): Promise<void> {
    const meta = parseTopic(topic);
    if (!meta) {
      logger.warn(`[MQTT] Unknown topic: ${topic}`);
      return;
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(payload.toString('utf-8'));
    } catch (e) {
      logger.error(`[MQTT] Invalid JSON on ${topic}`);
      return;
    }

    try {
      switch (meta.messageType) {
        case 'sensor':
          await this.handleSensorMessage(meta, parsed);
          break;
        case 'status':
          await this.handleStatusMessage(meta, parsed);
          break;
        case 'control_ack':
          await this.handleControlAck(parsed);
          break;
        case 'config_ack':
          await this.handleConfigAck(parsed);
          break;
      }
    } catch (err) {
      logger.error(`[MQTT] Handler error on ${topic}:`, err);
    }
  }

  // ... sensor, status, control_ack 핸들러는 v1.0과 동일 ...

  /**
   * config/ack 메시지 처리 (v2.0 추가)
   * 1. Zod 검증
   * 2. config_commands 테이블에서 cmd_id로 조회
   * 3. result → SUCCESS/FAIL 업데이트
   * 4. needs_reboot 기록
   */
  private async handleConfigAck(raw: unknown): Promise<void> {
    const result = ConfigAckSchema.safeParse(raw);
    if (!result.success) {
      logger.warn('[MQTT] Invalid config/ack payload');
      return;
    }
    
    await configService.processAck(result.data);
  }

  /**
   * 제어 명령 MQTT 발행
   */
  async publishControl(
    siteId: string, floorId: string, gatewayId: string, payload: object,
  ): Promise<void> {
    const topic = `metabeans/${siteId}/${floorId}/gateway/${gatewayId}/control`;
    return new Promise((resolve, reject) => {
      this.client!.publish(topic, JSON.stringify(payload), { qos: mqttConfig.defaultQoS },
        (err) => { if (err) reject(err); else resolve(); });
    });
  }

  /**
   * 설정 변경 MQTT 발행 (v2.0 추가)
   */
  async publishConfig(
    siteId: string, floorId: string, gatewayId: string, payload: object,
  ): Promise<void> {
    const topic = `metabeans/${siteId}/${floorId}/gateway/${gatewayId}/config`;
    return new Promise((resolve, reject) => {
      this.client!.publish(topic, JSON.stringify(payload), { qos: mqttConfig.defaultQoS },
        (err) => { if (err) reject(err); else resolve(); });
    });
  }

  async stop(): Promise<void> {
    if (this.client) {
      this.client.end(true);
      logger.info('[MQTT] Disconnected');
    }
  }
}

export const mqttBridge = new MqttBridgeService();
```

### 5.3 메시지 처리 흐름도

```
sensor 메시지 수신
    │
    ├── 1. JSON 파싱
    ├── 2. Zod 스키마 검증
    ├── 3. 토픽 ↔ payload gateway_id 일치 확인
    │
    ├── 4. [병렬] gateway_sensor_data INSERT (IAQ)
    ├── 5. [병렬] controller_sensor_data INSERT (each controller)
    ├── 6. [병렬] 인메모리 latest 캐시 갱신
    ├── 7. [병렬] 알람 판정 (pp_alarm, pp_temp, inlet_temp, diff_pressure)
    │
    └── 8. 통신 타임아웃 타이머 리셋 (해당 gateway)

status 메시지 수신
    │
    ├── 1. JSON 파싱 + Zod 검증
    ├── 2. gateways 테이블 UPDATE (status_flags, controller_count, last_seen_at)
    └── 3. 통신 타임아웃 타이머 리셋

control/ack 메시지 수신
    │
    ├── 1. JSON 파싱 + Zod 검증
    ├── 2. control_commands에서 cmd_id로 조회
    ├── 3. result → PENDING → SUCCESS/FAIL 업데이트
    └── 4. responded_at = NOW() 기록

config/ack 메시지 수신 (v2.0 추가)
    │
    ├── 1. JSON 파싱 + Zod 검증
    ├── 2. config_commands에서 cmd_id로 조회
    ├── 3. result → PENDING → SUCCESS/FAIL 업데이트
    ├── 4. needs_reboot 기록
    └── 5. responded_at = NOW() 기록
```

---

## 6. 센서 데이터 → DB 저장 로직

### 6.1 저장 대상 테이블

| 메시지 부분 | 저장 테이블 | 파티션 | 인덱스 |
|-----------|-----------|--------|--------|
| iaq (게이트웨이 IAQ) | `gateway_sensor_data` | 월별 (received_at) | `(gateway_id, timestamp)` |
| controllers[] (파워팩) | `controller_sensor_data` | **일별** (received_at) | `(controller_id, timestamp)` |

### 6.2 MySQL DDL (파티셔닝)

```sql
-- controller_sensor_data: 일별 파티션 (10초 주기, 고빈도)
CREATE TABLE controller_sensor_data (
    data_id BIGINT AUTO_INCREMENT,
    controller_id BIGINT NOT NULL,
    equipment_id BIGINT NOT NULL,
    gateway_id BIGINT NOT NULL,
    timestamp INT UNSIGNED NOT NULL,
    received_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    pm2_5 FLOAT, pm10 FLOAT,
    diff_pressure FLOAT, oil_level TINYINT DEFAULT 0,  -- v2.1: FLOAT→TINYINT (0=정상, 1=만수)
    pp_temp INT, pp_spark INT,                          -- v2.1: pp_spark 범위 0-9999
    pp_power INT, pp_alarm INT,
    fan_speed INT,
    fan_mode INT DEFAULT 0,
    fan_running TINYINT DEFAULT 0,                      -- v2.1 신규: 인버터 운전 상태
    fan_freq FLOAT DEFAULT 0.0,                         -- v2.1 신규: 인버터 출력 주파수 Hz
    fan_target_pct FLOAT DEFAULT 0.0,                   -- v2.1 신규: PID 목표값 %
    damper_mode INT DEFAULT 0,
    damper_ctrl FLOAT DEFAULT 0.0,                      -- v2.1 신규: 댐퍼 명령값 Damper_CTRL
    flow FLOAT, damper FLOAT,                           -- damper = Damper_FB 피드백값
    inlet_temp FLOAT, velocity FLOAT, duct_dp FLOAT,
    status_flags INT DEFAULT 0,
    PRIMARY KEY (data_id, received_at),
    INDEX idx_ctrl_ts (controller_id, timestamp)
) PARTITION BY RANGE (TO_DAYS(received_at)) (
    -- 파티션 자동 생성 스크립트로 관리 (일별)
    -- 예: p_20260213 VALUES LESS THAN (TO_DAYS('2026-02-14'))
);

-- gateway_sensor_data: 월별 파티션 (매장당 1건/10초, 중빈도)
CREATE TABLE gateway_sensor_data (
    data_id BIGINT AUTO_INCREMENT,
    gateway_id BIGINT NOT NULL,
    timestamp INT UNSIGNED NOT NULL,
    received_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    pm1_0 FLOAT, pm2_5 FLOAT, pm4_0 FLOAT, pm10 FLOAT,
    temperature FLOAT, humidity FLOAT,
    voc_index INT NULL, nox_index INT NULL,
    co2 INT, o3 INT, co FLOAT, hcho INT,
    PRIMARY KEY (data_id, received_at),
    INDEX idx_gw_ts (gateway_id, timestamp)
) PARTITION BY RANGE (TO_DAYS(received_at)) (
    -- 월별 파티션
    -- 예: p_202602 VALUES LESS THAN (TO_DAYS('2026-03-01'))
);

-- config_commands: 설정 변경 이력 (v2.0 추가)
CREATE TABLE config_commands (
    cmd_id VARCHAR(36) PRIMARY KEY,
    gateway_id BIGINT NOT NULL,
    payload JSON NOT NULL,
    result ENUM('PENDING', 'SUCCESS', 'FAIL') DEFAULT 'PENDING',
    fail_reason VARCHAR(500) NULL,
    needs_reboot BOOLEAN DEFAULT FALSE,
    requested_by BIGINT NULL,
    requested_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    responded_at DATETIME NULL,
    INDEX idx_gw_result (gateway_id, result)
);
```

### 6.3 저장 볼륨 예상 (200매장 기준)

| 항목 | 계산 | 일간 건수 | 일간 용량 |
|------|------|---------|---------|
| gateway_sensor_data | 200매장 × 평균 1.5층 × 8,640건/일(10초) | ~259만 건 | ~800MB |
| controller_sensor_data | 200매장 × 1.5층 × 3장비 × 2파워팩 × 8,640건/일 | ~1,555만 건 | ~6GB |

> 90일 원본 보관 시 controller_sensor_data ~540GB → 파티션 DROP으로 관리. 1시간 집계본은 5년 보관.

---

## 7. 통신 오류 감지 로직 (30초 타임아웃)

> v1.0과 동일. 섹션 내용 생략 없이 유지.

### 7.1 요구사항 (피드백 p.38)

```
- 데이터 전송 주기: 10초 간격
- 30초 동안 서버로 데이터가 전달되지 않았을 때 통신 오류로 판단
- 마지막 통신 시간 및 연결 상태 표시
- 연결(Green) / 끊김(Red) 2단계
```

### 7.2 통신 상태 전파 규칙 (피드백 p.38)

```
게이트웨이 OFFLINE 발생 시:
  Gateway: connection_status = 'OFFLINE'
    └── 하위 Equipment 전체: connection_status = 'OFFLINE'
        └── (Controller는 DB에 별도 connection_status 없음,
             controller.timestamp으로 개별 판단)

게이트웨이 ONLINE 복구 시:
  Gateway: connection_status = 'ONLINE'
    └── 하위 Equipment 전체: connection_status = 'ONLINE'

개별 컨트롤러 통신 이상 판단:
  sensor 메시지 내 controller.timestamp과 gateway.timestamp 비교
  차이 > 30초 → 해당 컨트롤러 개별 통신 이상 (프론트엔드 판정)
```

---

## 8. 제어 명령 발행 및 ACK 처리

### 8.1 제어 대상 및 액션 정의

#### target=0: 파워팩 (Powerpack)

| action | value | 설명 | 권한 |
|--------|-------|------|------|
| 0 | - | 파워팩 OFF | ADMIN, OWNER (본인매장) |
| 1 | - | 파워팩 ON | ADMIN, OWNER (본인매장) |
| 2 | - | 파워팩 리셋 | ADMIN |

#### target=1: 댐퍼 (Damper / flo-OAC)

| action | value | 설명 | 권한 |
|--------|-------|------|------|
| 1 | 0-100 (int) | 댐퍼 개도율 설정 (%, 수동 모드) | ADMIN, OWNER |
| 2 | 0 또는 1 (int) | 제어 모드 전환 (0=수동, 1=자동) | ADMIN, OWNER |
| 3 | float (CMH) | 목표 풍량 설정 (자동 모드, 예: 850.0) | ADMIN, OWNER |

> - **action=1**: flo-OAC를 Manual 모드로 전환 후 개도율(%)을 직접 설정합니다. flo-OAC 하드웨어는 Float 0~100% 연속 제어를 지원하며, MQTT에서는 정수(0-100)로 전달하고 컨트롤러에서 float으로 변환합니다.
> - **action=2**: 댐퍼 제어 모드를 전환합니다. 자동 모드(1)로 전환하면 flo-OAC의 Internal SV 모드가 활성화되어, 설정된 목표 풍량을 기준으로 flo-OAC가 자체 PID로 댐퍼 개도를 자동 조절합니다.
> - **action=3**: 자동 모드의 목표 풍량(CMH)을 설정합니다. 자동 모드가 아닌 경우 자동 모드로 자동 전환됩니다.

**8단계 매핑** (피드백 p.45 — 수동 모드, 애플리케이션 레벨 처리):

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

#### target=2: 시로코팬 (Fan / LS M100 인버터)

| action | value | 설명 | 권한 |
|--------|-------|------|------|
| 0 | - | 팬 OFF (수동) | ADMIN, OWNER |
| 1 | - | 팬 LOW (수동, 15Hz) | ADMIN, OWNER |
| 2 | - | 팬 MID (수동, 30Hz) | ADMIN, OWNER |
| 3 | - | 팬 HIGH (수동, 50Hz) | ADMIN, OWNER |
| 4 | 0 또는 1 (int) | 제어 모드 전환 (0=수동, 1=자동) | ADMIN, OWNER |
| 5 | float (m/s) | 목표 풍속 설정 (자동 모드, 예: 3.5) | ADMIN, OWNER |

> - **action=0~3**: 기존 수동 속도 단계 제어입니다. 자동 모드 중 이 명령을 수신하면 자동으로 수동 모드로 전환됩니다.
> - **action=4**: 팬 제어 모드를 전환합니다. 자동 모드(1)로 전환하면 M100 인버터의 내장 PID가 활성화되어, 설정된 목표 풍속을 기준으로 인버터가 자동으로 주파수(팬 속도)를 가/감속합니다. 피드백은 flo-OAC의 실측 풍속(V_act)을 사용합니다.
> - **action=5**: 자동 모드의 목표 풍속(m/s)을 설정합니다. 자동 모드가 아닌 경우 자동 모드로 자동 전환됩니다.

### 8.2 자동 제어 동작 참고

| 항목 | 설명 |
|------|------|
| **댐퍼 자동 제어** | flo-OAC 하드웨어가 자체 PID로 댐퍼 개도를 조절합니다. 컨트롤러 펌웨어는 목표 풍량 전달만 수행합니다. |
| **팬 자동 제어** | M100 인버터 내장 PID를 활용합니다. 컨트롤러 펌웨어가 flo-OAC에서 읽은 실측 풍속을 인버터 PID 피드백 레지스터에 주기적으로 전달하고, 인버터가 목표 풍속과의 오차를 기반으로 주파수를 자동 조절합니다. |
| **자동→수동 전환** | 모드 전환 명령(action=2 또는 4, value=0) 또는 수동 명령(댐퍼 action=1, 팬 action=0~3)을 보내면 자동 모드가 해제됩니다. |
| **안전 오버라이드** | 비상정지(ESTOP), 스파크 감지, 과온도 알람 발생 시 컨트롤러가 자동으로 팬/댐퍼 자동 모드를 해제(수동 전환)합니다. 이후 센서 데이터의 `fan_mode`, `damper_mode` 필드가 0으로 변경되어 대시보드에서 확인할 수 있습니다. |
| **PID 튜닝** | 팬의 PID 게인(P/I/D)은 M100 인버터 파라미터(AP.22~AP.24)로 설정하며, 현장 환경에 따라 시운전 시 조정합니다. |

### 8.3 일괄 제어 범위

| equipment_id | controller_id | 범위 |
|-------------|---------------|------|
| `"all"` | `"all"` | 게이트웨이 하위 전체 컨트롤러 |
| `"esp-001"` | `"all"` | 해당 집진기 하위 컨트롤러만 |
| `"esp-001"` | `"ctrl-001"` | 특정 컨트롤러 지정 |

### 8.4 제어 명령 시퀀스

```
클라이언트                 REST API              MQTT 브릿지           AWS IoT Core          게이트웨이
    │                        │                      │                     │                     │
    │ POST /control/command  │                      │                     │                     │
    │ ─────────────────────► │                      │                     │                     │
    │                        │ control_commands      │                     │                     │
    │                        │ INSERT (PENDING)     │                     │                     │
    │                        │ ─────────────────►   │                     │                     │
    │                        │                      │ MQTT publish        │                     │
    │                        │                      │ .../control         │                     │
    │                        │                      │ ────────────────►   │ ──────────────────► │
    │                        │                      │                     │                     │
    │                        │                      │                     │ ◄────────────────── │
    │                        │                      │ ◄────────────────── │ control/ack         │
    │                        │                      │ processAck()        │                     │
    │                        │ ◄─────────────────── │                     │                     │
    │                        │ UPDATE (SUCCESS)     │                     │                     │
    │ ◄───────────────────── │                      │                     │                     │
    │ { cmdId, result }      │                      │                     │                     │
```

---

## 9. 설정 변경 (config) 토픽

> **v2.0 신규 섹션**. 게이트웨이 런타임 설정의 원격 변경을 위한 config/config/ack 토픽 처리.

### 9.1 설정 변경 서비스

```typescript
// src/services/config.service.ts

import { v4 as uuidv4 } from 'uuid';
import { PrismaClient } from '@prisma/client';
import { mqttBridge } from './mqtt.service';
import { ConfigAck } from '../validators/mqtt.validator';

const prisma = new PrismaClient();
const CONFIG_ACK_TIMEOUT_MS = 15_000;  // 15초 ACK 대기 (재부팅 포함)

class ConfigService {
  
  /**
   * 설정 변경 명령 발행
   */
  async sendConfigUpdate(params: {
    gatewayDbId: number;
    siteId: string;
    floorId: string;
    gatewayMqttId: string;
    configPayload: Record<string, unknown>;  // 변경할 설정 필드들
    requestedBy: number | null;
  }): Promise<{ cmdId: string; result: 'SUCCESS' | 'FAIL' | 'TIMEOUT'; needsReboot?: boolean }> {
    
    const cmdId = uuidv4();

    // DB 기록 (PENDING)
    await prisma.config_commands.create({
      data: {
        cmd_id: cmdId,
        gateway_id: params.gatewayDbId,
        payload: { cmd_id: cmdId, ...params.configPayload },
        result: 'PENDING',
        requested_by: params.requestedBy,
        requested_at: new Date(),
      },
    });

    // MQTT 발행
    const mqttPayload = { cmd_id: cmdId, ...params.configPayload };
    await mqttBridge.publishConfig(
      params.siteId, params.floorId, params.gatewayMqttId, mqttPayload,
    );

    // ACK 대기
    try {
      const ack = await this.waitForAck(cmdId);
      await prisma.config_commands.update({
        where: { cmd_id: cmdId },
        data: {
          result: ack.result === 'success' ? 'SUCCESS' : 'FAIL',
          fail_reason: ack.reason || null,
          needs_reboot: ack.needs_reboot,
          responded_at: new Date(),
        },
      });
      return {
        cmdId,
        result: ack.result === 'success' ? 'SUCCESS' : 'FAIL',
        needsReboot: ack.needs_reboot,
      };
    } catch {
      await prisma.config_commands.update({
        where: { cmd_id: cmdId },
        data: { result: 'FAIL', fail_reason: 'ACK_TIMEOUT', responded_at: new Date() },
      });
      return { cmdId, result: 'TIMEOUT' };
    }
  }

  /**
   * config/ack 수신 처리
   */
  async processAck(ack: ConfigAck): Promise<void> {
    // control/ack과 동일한 pending ACK 패턴 사용
    // ... (pendingConfigAcks Map에서 resolve)
  }

  private waitForAck(cmdId: string): Promise<ConfigAck> {
    // control 서비스와 동일한 패턴
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error('CONFIG_ACK_TIMEOUT'));
      }, CONFIG_ACK_TIMEOUT_MS);
      // pendingConfigAcks.set(cmdId, { resolve, reject, timeoutId });
    });
  }
}

export const configService = new ConfigService();
```

### 9.2 설정 변경 시퀀스

```
[즉시 적용 필드 (sensor_interval_ms 등)]
클라이언트 → REST API → MQTT config → 게이트웨이
                                         ├── 즉시 적용
                                         └── config/ack (needs_reboot: false)

[재부팅 필요 필드 (site_id, wifi_ssid 등)]
클라이언트 → REST API → MQTT config → 게이트웨이
                                         ├── NVS에 새 값 저장
                                         ├── config/ack (needs_reboot: true) 발행
                                         └── 1초 대기 후 자동 재부팅
```

---

## 10. 알람 이벤트 생성 로직

### 10.1 알람 소스 (v3.0 — 피드백 p.33~34)

> MQTT alarm 토픽은 삭제됨. 알람은 `pp_alarm` 필드 + **서버측 연산**으로 생성.

| alarm_type | 감지 소스 | YELLOW 조건 | RED 조건 |
|-----------|---------|------------|---------|
| `COMM_ERROR` | 30초 미수신 | 끊김 30초 이상 | 끊김 1시간 이상 |
| `INLET_TEMP_ABNORMAL` | controller.inlet_temp | 70°C 이상 | 100°C 이상 |
| `FILTER_CHECK` | 서버측 차압 연산 | diff_pressure > 기준 | - |
| `DUST_REMOVAL_CHECK` | 서버측 PM 연산 | - | 점검 필요 |
| `PP_ALARM` | controller.pp_alarm | - | pp_alarm = 1 |

---

## 11. 데이터 보존 및 집계 정책

> v1.0과 동일. 원본 데이터 90일 보관, 1시간 집계본 5년 보관.

### 11.1 파티션 관리 스크립트

```sql
-- 일별 파티션 추가 (매일 자동 실행)
-- cron: "0 0 * * *"
ALTER TABLE controller_sensor_data 
  ADD PARTITION (PARTITION p_20260214 VALUES LESS THAN (TO_DAYS('2026-02-15')));

-- 90일 이상 원본 파티션 삭제 (매일 자동 실행)
ALTER TABLE controller_sensor_data 
  DROP PARTITION p_20251116;
```

---

## 12. 구현 파일 구조 및 모듈 명세

```
esp-api/src/
├── config/
│   ├── mqtt.ts                    # AWS IoT Core 연결 설정
│   ├── database.ts                # MySQL/Prisma 설정
│   └── jwt.ts                     # JWT 설정
│
├── services/
│   ├── mqtt.service.ts            # MQTT 브릿지 (연결/구독/발행/라우팅)
│   ├── sensor.service.ts          # 센서 데이터 파싱/저장/캐시
│   ├── control.service.ts         # 제어 명령 발행/ACK 처리
│   ├── config.service.ts          # 설정 변경 발행/ACK 처리 (v2.0 추가)
│   ├── alert.service.ts           # 알람 판정/생성/해소/이메일
│   ├── connection-monitor.service.ts  # 30초 타임아웃 감지
│   └── latest-cache.service.ts    # 인메모리 최신 데이터 캐시
│
├── validators/
│   └── mqtt.validator.ts          # Zod 스키마 (sensor/status/ack/config_ack)
│
├── utils/
│   ├── topicParser.ts             # 토픽 문자열 파싱
│   ├── statusFlags.ts             # status_flags 비트 파싱 유틸리티
│   └── logger.ts                  # 로깅
│
├── jobs/
│   ├── aggregate-sensor-data.ts   # 1시간 집계 배치
│   ├── partition-manager.ts       # 파티션 생성/삭제
│   └── comm-error-escalation.ts   # COMM_ERROR YELLOW→RED 에스컬레이션 (1시간)
│
└── prisma/
    └── schema.prisma              # DB 스키마
```

### 모듈 의존성 관계

```
mqtt.service.ts (진입점)
  ├── topicParser.ts
  ├── mqtt.validator.ts
  │
  ├── sensor.service.ts
  │   ├── latest-cache.service.ts
  │   └── alert.service.ts
  │
  ├── control.service.ts
  │
  ├── config.service.ts            # v2.0 추가
  │
  └── connection-monitor.service.ts
      └── alert.service.ts
```

---

## 13. 테스트 전략

### 13.1 단위 테스트

| 모듈 | 테스트 항목 |
|------|-----------|
| `topicParser.ts` | 정상 토픽 파싱, 비정상 토픽 null 반환, control/ack·config/ack 복합 세그먼트 |
| `mqtt.validator.ts` | 정상 payload 통과, 필드 누락 거부, voc_index null 허용, status_flags 범위, fan_mode/damper_mode 범위 검증 |
| `statusFlags.ts` | 63 = 모든 정상, 0 = 모든 이상, 개별 비트 확인 |
| `alert.service.ts` | pp_alarm=1 → RED 알람 생성, 중복 알람 방지, severity 상승 |
| `connection-monitor.service.ts` | 30초 타임아웃 → OFFLINE, resetTimer → ONLINE 복구 |
| `config.service.ts` | config 발행 → ACK 수신, 타임아웃 처리, needs_reboot 기록 |

### 13.2 통합 테스트

| 시나리오 | 검증 항목 |
|---------|---------|
| sensor 메시지 수신 → DB 저장 | gateway_sensor_data + controller_sensor_data 각각 INSERT 확인, fan_mode/damper_mode 저장 확인 |
| control 명령 → ACK 수신 | control_commands PENDING → SUCCESS 전이 |
| ACK 미수신 (10초) | control_commands PENDING → FAIL (ACK_TIMEOUT) |
| 30초 미수신 → 통신 오류 | gateways.connection_status = OFFLINE, COMM_ERROR 알람 생성 |
| 통신 복구 | ONLINE 전환, COMM_ERROR 알람 RESOLVED |
| 일괄 제어 ("all") | MQTT payload에 equipment_id="all" 포함 확인 |
| config 변경 → ACK 수신 | config_commands PENDING → SUCCESS, needs_reboot 기록 |
| 댐퍼 자동 모드 전환 | target=1, action=2, value=1 → ACK 수신, 이후 sensor에서 damper_mode=1 확인 |
| 팬 자동 모드 전환 | target=2, action=4, value=1 → ACK 수신, 이후 sensor에서 fan_mode=1 확인 |
| 안전 오버라이드 | pp_alarm=1 발생 시 fan_mode=0, damper_mode=0으로 자동 전환 확인 |

### 13.3 Mock 센서 데이터 범위 (프론트엔드 Phase 1 호환)

| 필드 | 범위 | 타입 |
|------|------|------|
| pp_temp | 30-70 | int |
| pp_spark | **0-9999** | int — **v2.1: 범위 확대** |
| pp_power | 0 \| 1 | int |
| pp_alarm | 0 \| 1 | int |
| pm2_5 | 5-80 | float |
| diff_pressure | 5-50 | float |
| oil_level | **0 \| 1** | **int** — **v2.1: 0=정상, 1=만수** |
| flow | 300-1200 | float (CMH) |
| damper | 0-100 | float (%) |
| fan_speed | 0 \| 1 \| 2 \| 3 | int |
| fan_mode | 0 \| 1 | int |
| fan_running | 0 \| 1 | int — **v2.1 신규** |
| fan_freq | 0.0~50.0 | float Hz — **v2.1 신규** |
| fan_target_pct | 0.0~100.0 | float % — **v2.1 신규** |
| damper_mode | 0 \| 1 | int |
| damper_ctrl | 0~100 | float % — **v2.1 신규** |
| inlet_temp | 15-50 | float (°C) |
| velocity | 2-15 | float (m/s) |
| duct_dp | 50-500 | float (Pa) |
| damper | 0-100 | float % (Damper_FB 피드백) |
| status_flags | 0-63 | int (6비트) |

---

## 부록 A. 변경 이력 대응표

| MQTT 규격 변경 | 본 문서 반영 위치 | 버전 |
|-------------|-----------------|------|
| **fan_mode, damper_mode 센서 필드 추가** | **섹션 4.1.2, 4.7, 6.2 DDL, 13.3** | **v2.0** |
| **oil_level float→int (0=정상/1=만수)** | **섹션 4.1.2 테이블, JSON 예시, 4.7 Zod, 6.2 DDL, 13.3** | **v2.1** |
| **pp_spark 범위 0-9999로 확대 (rev2.1)** | **섹션 4.1.2 테이블, JSON 예시, 4.7 Zod, 6.2 DDL, 13.3** | **v2.1** |
| **fan_running, fan_freq, fan_target_pct 신규 필드** | **섹션 4.1.2 테이블+주석, JSON 예시, 4.7 Zod, 6.2 DDL, 13.3** | **v2.1** |
| **damper_ctrl 신규 필드 (명령값, damper=피드백값)** | **섹션 4.1.2 테이블+주석, JSON 예시, 4.7 Zod, 6.2 DDL, 13.3** | **v2.1** |
| **status 메시지 wifi 객체 추가** | **섹션 4.2 JSON 예시+테이블, 4.7 Zod StatusMessageSchema** | **v2.1** |
| **Controller status_flags bit 5: RS-485 AND Fault Trip 복합 판정** | **섹션 4.1.3 비트 정의 테이블, parseControllerStatusFlags** | **v2.1** |
| **댐퍼/시로코팬 자동 제어 명령 추가 (모드 전환, 목표 풍량/풍속 설정)** | **섹션 8.1 (target=1 action 2,3 / target=2 action 4,5), 8.2** | **v2.0** |
| **config 토픽 페이로드 정의, config/ack 응답 추가** | **섹션 4.5, 4.6, 9 (신규)** | **v2.0** |
| **config/ack 구독 추가** | **섹션 2.3, 3.1, 3.3, 5.2** | **v2.0** |
| **Controller 수량 1~3대로 변경** | **섹션 1.3** | **v2.0** |
| **control value 타입 number(int/float)로 확장** | **섹션 4.3, 8.1** | **v2.0** |
| controller 필드에 flo-OAC inlet_temp, velocity, duct_dp 추가 | 섹션 4.1.2, 6.2, DDL | v1.0 |
| 통합 센서 메시지 구조 도입 | 섹션 4.1 전체 | v1.0 |
| blade_angle 제거 → damper 통합 | 섹션 4.1.2 (damper 필드) | v1.0 |
| 알람 토픽 제거 → pp_alarm 필드로 전달 | 섹션 10.1 (서버측 알람 생성) | v1.0 |
| status_flags 재설계 (GW 7비트/Ctrl 6비트) | 섹션 4.1.3, 4.2 | v1.0 |
| ID 문자열 통일, 일괄 제어 "all" 보완 | 섹션 8.3 | v1.0 |
| pp_temp 타입 int 명확화 | 섹션 4.1.2 (int, x10 스케일 아님) | v1.0 |
| QoS 1 / Retain 0 확정 | 섹션 2.1 | v1.0 |

## 부록 B. REST API ↔ MQTT 연동 포인트

| REST API 엔드포인트 | MQTT 연동 | 설명 |
|--------------------|----------|------|
| `POST /control/command` | → MQTT publish `.../control` | 제어 명령 발행 |
| `GET /control/command/:cmdId/status` | control/ack 수신 결과 조회 | ACK 상태 폴링 |
| `POST /config/update` | → MQTT publish `.../config` | 설정 변경 발행 (v2.0) |
| `GET /config/command/:cmdId/status` | config/ack 수신 결과 조회 | 설정 ACK 폴링 (v2.0) |
| `GET /monitoring/equipment/:id/latest` | 인메모리 latest 캐시 | 실시간 센서값 |
| `GET /monitoring/equipment/:id/history` | controller_sensor_data 조회 | 이력 차트 데이터 |
| `GET /monitoring/gateway/:id/iaq-history` | gateway_sensor_data 조회 | IAQ 이력 |
| `GET /dashboard/issues` | alarm_events 조회 | MQTT 기반 알람 목록 |
| `GET /dashboard/store-tree` | connection_status 포함 | 통신 상태 반영 트리 |

---

*본 문서는 MQTT_Payload_규격_260227_v2.pdf, MQTT_토픽_구조_변경_및_협의_사항.pdf, ESP_관리툴_최종피드백_260212.pdf, MetaBeans_ESP_데이터구조_정의서_v3_0.md, MetaBeans_ESP_프로젝트_아키텍처_기술스택_정의서.md를 기반으로 작성되었습니다.*
