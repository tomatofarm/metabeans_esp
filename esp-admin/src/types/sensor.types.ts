// 컨트롤러 센서 데이터 (controller_sensor_data 테이블 + MQTT 필드)
export interface ControllerSensorData {
  dataId?: number;
  controllerId: string;
  equipmentId?: number;
  gatewayId?: number;
  timestamp: number;
  receivedAt?: string;
  pm25: number;
  pm10: number;
  diffPressure: number;
  oilLevel: number;            // v3.2: int (0=정상, 1=만수)
  ppTemp: number;
  ppSpark: number;             // v3.2: 0-9999 (rev2.1 대응)
  ppPower: number;
  ppAlarm: number;
  fanSpeed: number;
  fanMode: number;
  fanRunning: number;          // v3.2 신규: 인버터 실제 운전 상태 (0=정지, 1=운전중)
  fanFreq: number;             // v3.2 신규: 인버터 실제 출력 주파수 (0~50.00 Hz)
  fanTargetPct: number;        // v3.2 신규: PID 목표값 (0.0~100.0%), 자동 모드에서만 유의미
  damperMode: number;
  flow: number;
  damperCtrl: number;          // v3.2 신규: 댐퍼 제어 명령값 (0-100%)
  damper: number;
  inletTemp: number;
  velocity: number;
  ductDp: number;
  statusFlags: number;
}

// 게이트웨이 IAQ 센서 데이터 (gateway_sensor_data 테이블)
export interface GatewaySensorData {
  dataId?: number;
  gatewayId: number;
  timestamp: number;
  receivedAt?: string;
  pm1_0: number;
  pm2_5: number;
  pm4_0: number;
  pm10: number;
  temperature: number;
  humidity: number;
  vocIndex: number | null;
  noxIndex: number | null;
  co2: number;
  o3: number;
  co: number;
  hcho: number;
}

// MQTT sensor 메시지 구조 (통합)
export interface MqttSensorMessage {
  gatewayId: string;
  timestamp: number;
  iaq: {
    pm1_0: number;
    pm2_5: number;
    pm4_0: number;
    pm10: number;
    temperature: number;
    humidity: number;
    voc_index: number | null;
    nox_index: number | null;
    co2: number;
    o3: number;
    co: number;
    hcho: number;
  };
  equipments: Array<{
    equipment_id: string;
    controllers: Array<{
      controller_id: string;
      timestamp: number;
      pm2_5: number;
      pm10: number;
      diff_pressure: number;
      oil_level: number;       // v3.2: int (0=정상, 1=만수)
      pp_temp: number;
      pp_spark: number;        // v3.2: 0-9999
      pp_power: number;
      pp_alarm: number;
      fan_speed: number;
      fan_mode: number;
      fan_running: number;     // v3.2 신규
      fan_freq: number;        // v3.2 신규
      fan_target_pct: number;  // v3.2 신규
      damper_mode: number;
      flow: number;
      damper_ctrl: number;     // v3.2 신규
      damper: number;
      inlet_temp: number;
      velocity: number;
      duct_dp: number;
      status_flags: number;
    }>;
  }>;
}

// MQTT status 메시지 구조
export interface MqttStatusMessage {
  gateway_id: string;
  status_flags: number;
  controller_count: number;
  wifi: MqttWifiInfo;          // v3.2 신규: Wi-Fi 연결 정보
  timestamp: number;
}

// v3.2 신규: Wi-Fi 연결 정보 (status 토픽 내)
export interface MqttWifiInfo {
  ssid?: string;               // 연결된 AP의 SSID (미연결 시 누락 가능)
  rssi: number;                // 신호 강도 (dBm, 미연결 시 0)
  ip?: string;                 // 게이트웨이 IP 주소 (미연결 시 누락 가능)
  mac: string;                 // MAC 주소 (AA:BB:CC:DD:EE:FF)
  channel: number;             // Wi-Fi 채널 (1-14, 미연결 시 0)
}

// Mock 센서 데이터 범위
export interface SensorRange {
  min: number;
  max: number;
  decimals: number;
}

export interface SensorDiscreteRange {
  values: number[];
}

// 실시간 모니터링용 컨트롤러 상태
export interface RealtimeControllerData {
  controllerId: number;
  controllerName: string;
  connectionStatus: 'ONLINE' | 'OFFLINE';
  lastSeenAt: string;
  sensorData: ControllerSensorData;
}

// 실시간 모니터링 장비 데이터 (equipment 단위)
export interface RealtimeMonitoringData {
  equipmentId: number;
  /** MQTT equipment_id (제어 명령 payload용) */
  mqttEquipmentId?: string;
  /** 선택 장비가 연결된 gateway PK (제어 명령 전송용) */
  gatewayId?: number;
  equipmentName: string;
  modelName: string;
  storeName: string;
  connectionStatus: 'ONLINE' | 'OFFLINE';
  controllers: RealtimeControllerData[];
}

// 센서 이력 차트 데이터 포인트 (확장)
export interface SensorHistoryDataPoint {
  timestamp: number;
  controllerId: string;
  controllerName: string;
  ppTemp: number;
  ppSpark: number;
  pm25: number;
  pm10: number;
  diffPressure: number;
  inletTemp: number;
  flow: number;
  velocity: number;
  ductDp: number;
}

// IAQ 상태 판단 기준
export type IAQLevel = 'good' | 'moderate' | 'bad';

export interface IAQThreshold {
  unit: string;
  good: { max: number };
  moderate: { max: number };
  bad: { min: number };
}
