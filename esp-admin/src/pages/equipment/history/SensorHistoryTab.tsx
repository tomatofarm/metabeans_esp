import { useState, useMemo } from 'react';
import { DatePicker, Select, Table, Space, Spin, Empty, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import TimeSeriesChart from '../../../components/charts/TimeSeriesChart';
import type { TimeSeriesLine } from '../../../components/charts/TimeSeriesChart';
import { useSensorHistoryRange } from '../../../api/history.api';
import type { SensorHistoryDataPoint } from '../../../types/sensor.types';
import { formatEpoch, formatNumber } from '../../../utils/formatters';

const { RangePicker } = DatePicker;
const { Text } = Typography;

// 센서 항목 정의 (압력 이력 삭제됨 — CLAUDE.md v3.0 변경사항)
const SENSOR_OPTIONS = [
  { value: 'ppTemp', label: '보드온도', unit: '°C' },
  { value: 'ppSpark', label: '스파크', unit: '' },
  { value: 'pm25', label: 'PM2.5', unit: 'µg/m³' },
  { value: 'pm10', label: 'PM10', unit: 'µg/m³' },
  { value: 'diffPressure', label: '차압', unit: 'Pa' },
  { value: 'inletTemp', label: '유입온도', unit: '°C' },
  { value: 'flow', label: '풍량', unit: 'CMH' },
  { value: 'velocity', label: '풍속', unit: 'm/s' },
] as const;

type SensorField = typeof SENSOR_OPTIONS[number]['value'];

// 빠른 기간 선택 프리셋
const RANGE_PRESETS: { label: string; value: [Dayjs, Dayjs] }[] = [
  { label: '최근 1일', value: [dayjs().subtract(1, 'day'), dayjs()] },
  { label: '최근 7일', value: [dayjs().subtract(7, 'day'), dayjs()] },
  { label: '최근 30일', value: [dayjs().subtract(30, 'day'), dayjs()] },
];

// 컨트롤러별 차트 색상 — CHART_COLORS 참조
import { CHART_COLORS } from '../../../utils/constants';

// 센서 필드별 경고 구간
const WARNING_ZONES: Partial<Record<SensorField, { min: number; max: number; color: string }[]>> = {
  ppTemp: [
    { min: 60, max: 80, color: 'rgba(250,173,20,0.08)' },
    { min: 80, max: 120, color: 'rgba(255,77,79,0.08)' },
  ],
  ppSpark: [
    { min: 3000, max: 7000, color: 'rgba(250,173,20,0.08)' },
    { min: 7000, max: 10000, color: 'rgba(255,77,79,0.08)' },
  ],
  pm25: [
    { min: 35, max: 50, color: 'rgba(250,173,20,0.08)' },
    { min: 50, max: 100, color: 'rgba(255,77,79,0.08)' },
  ],
  inletTemp: [
    { min: 70, max: 100, color: 'rgba(250,173,20,0.08)' },
    { min: 100, max: 150, color: 'rgba(255,77,79,0.08)' },
  ],
};

interface SensorHistoryTabProps {
  equipmentId: number;
}

export default function SensorHistoryTab({ equipmentId }: SensorHistoryTabProps) {
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>([
    dayjs().subtract(1, 'day'),
    dayjs(),
  ]);
  const [selectedSensor, setSelectedSensor] = useState<SensorField>('ppTemp');

  const from = dateRange[0].unix();
  const to = dateRange[1].unix();

  const { data, isLoading } = useSensorHistoryRange(equipmentId, from, to);

  // 컨트롤러별로 그룹화
  const controllerIds = useMemo(() => {
    if (!data) return [];
    const ids = new Set<string>();
    data.forEach((d) => ids.add(d.controllerId));
    return Array.from(ids);
  }, [data]);

  // 차트 데이터 변환
  const chartLines: TimeSeriesLine[] = useMemo(() => {
    if (!data) return [];
    return controllerIds.map((cid, idx) => ({
      name: cid,
      color: CHART_COLORS[idx % CHART_COLORS.length],
      data: data
        .filter((d) => d.controllerId === cid)
        .map((d) => ({ timestamp: d.timestamp, value: d[selectedSensor] })),
    }));
  }, [data, controllerIds, selectedSensor]);

  const sensorConfig = SENSOR_OPTIONS.find((s) => s.value === selectedSensor)!;

  // 테이블 데이터 (최신순)
  const tableData = useMemo(() => {
    if (!data) return [];
    return [...data].sort((a, b) => b.timestamp - a.timestamp);
  }, [data]);

  const columns: ColumnsType<SensorHistoryDataPoint> = [
    {
      title: '시간',
      dataIndex: 'timestamp',
      key: 'timestamp',
      width: 170,
      render: (v: number) => formatEpoch(v),
    },
    {
      title: '파워팩 ID',
      dataIndex: 'controllerId',
      key: 'controllerId',
      width: 110,
    },
    {
      title: '보드온도 (°C)',
      dataIndex: 'ppTemp',
      key: 'ppTemp',
      width: 110,
      render: (v: number) => formatNumber(v, 0),
    },
    {
      title: '스파크',
      dataIndex: 'ppSpark',
      key: 'ppSpark',
      width: 80,
      render: (v: number) => formatNumber(v, 0),
    },
    {
      title: 'PM2.5 (µg/m³)',
      dataIndex: 'pm25',
      key: 'pm25',
      width: 110,
      render: (v: number) => formatNumber(v, 1),
    },
    {
      title: 'PM10 (µg/m³)',
      dataIndex: 'pm10',
      key: 'pm10',
      width: 110,
      render: (v: number) => formatNumber(v, 1),
    },
    {
      title: '차압 (Pa)',
      dataIndex: 'diffPressure',
      key: 'diffPressure',
      width: 100,
      render: (v: number) => formatNumber(v, 1),
    },
    {
      title: '유입온도 (°C)',
      dataIndex: 'inletTemp',
      key: 'inletTemp',
      width: 110,
      render: (v: number) => formatNumber(v, 1),
    },
    {
      title: '풍량 (CMH)',
      dataIndex: 'flow',
      key: 'flow',
      width: 110,
      render: (v: number) => formatNumber(v, 1),
    },
    {
      title: '풍속 (m/s)',
      dataIndex: 'velocity',
      key: 'velocity',
      width: 100,
      render: (v: number) => formatNumber(v, 1),
    },
  ];

  return (
    <div>
      {/* 필터 */}
      <div className="period-filter">
        <Space wrap>
          <Text strong>기간:</Text>
          <RangePicker
            value={dateRange}
            onChange={(dates) => {
              if (dates && dates[0] && dates[1]) {
                setDateRange([dates[0], dates[1]]);
              }
            }}
            presets={RANGE_PRESETS}
            allowClear={false}
          />
          <Text strong>센서 항목:</Text>
          <Select
            value={selectedSensor}
            onChange={setSelectedSensor}
            style={{ width: 140 }}
            options={SENSOR_OPTIONS.map((s) => ({ value: s.value, label: s.label }))}
          />
        </Space>
      </div>

      {/* 차트 */}
      <div className="chart-container" style={{ marginBottom: 16 }}>
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <Spin />
          </div>
        ) : chartLines.length === 0 ? (
          <Empty description="데이터가 없습니다" />
        ) : (
          <TimeSeriesChart
            title={`${sensorConfig.label} 추이`}
            lines={chartLines}
            yAxisName={sensorConfig.unit}
            height={350}
            warningZones={WARNING_ZONES[selectedSensor]}
          />
        )}
      </div>

      {/* 테이블 */}
      <div className="control-card">
        <div style={{ fontWeight: 600, marginBottom: 12 }}>센서 데이터 상세</div>
        <Table
          className="equip-table"
          columns={columns}
          dataSource={tableData}
          rowKey={(r) => `${r.timestamp}-${r.controllerId}`}
          size="small"
          scroll={{ x: 1100 }}
          pagination={{ pageSize: 20, showSizeChanger: true, pageSizeOptions: ['10', '20', '50'] }}
          loading={isLoading}
        />
      </div>
    </div>
  );
}
