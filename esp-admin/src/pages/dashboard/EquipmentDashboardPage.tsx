import { Typography, Space, Row, Col, Card, Descriptions, Table, Spin, Empty } from 'antd';
import ReactECharts from 'echarts-for-react';
import { useEquipmentDashboard } from '../../api/dashboard.api';
import StatusTag from '../../components/common/StatusTag';
import StatusBadge from '../../components/common/StatusBadge';
import type { ControllerStatus, SensorHistoryPoint, EquipmentDashboard } from '../../types/dashboard.types';
import {
  getInletTempLevel,
  getBoardTempLevel,
  getSparkLevel,
  getPowerStatus,
  getStatusConfig,
  getOilLevelStatus,
} from '../../utils/statusHelper';
import { formatTemp, formatNumber, formatPressure, formatRelativeTime } from '../../utils/formatters';
import { FAN_SPEED_LABELS } from '../../utils/constants';

interface EquipmentDashboardPageProps {
  equipmentId: number;
}

function SensorValue({ label, value, level }: { label: string; value: string; level?: string }) {
  const color = level ? getStatusConfig(level as 'green' | 'yellow' | 'red').color : undefined;
  return (
    <div style={{ textAlign: 'center', padding: '4px 0' }}>
      <div style={{ fontSize: 12, color: '#8c8c8c' }}>{label}</div>
      <div style={{ fontSize: 16, fontWeight: 600, color }}>{value}</div>
    </div>
  );
}

const controllerColumns = [
  {
    title: '파워팩',
    dataIndex: 'controllerName',
    key: 'controllerName',
    width: 100,
  },
  {
    title: '연결',
    dataIndex: 'connectionStatus',
    key: 'connectionStatus',
    width: 70,
    render: (status: string) =>
      status === 'ONLINE' ? (
        <StatusBadge status="success" label="연결" />
      ) : (
        <StatusBadge status="danger" label="끊김" />
      ),
  },
  {
    title: '상태',
    dataIndex: 'status',
    key: 'status',
    width: 70,
    render: (level: ControllerStatus['status']) => <StatusTag level={level} />,
  },
  {
    title: '전원',
    key: 'ppPower',
    width: 70,
    render: (_: unknown, r: ControllerStatus) => {
      const level = getPowerStatus(r.sensorData.ppPower);
      return <StatusTag level={level} label={r.sensorData.ppPower === 1 ? 'ON' : 'OFF'} />;
    },
  },
  {
    title: '보드온도',
    key: 'ppTemp',
    width: 90,
    render: (_: unknown, r: ControllerStatus) => {
      const level = getBoardTempLevel(r.sensorData.ppTemp);
      const config = getStatusConfig(level);
      return <span style={{ color: config.color }}>{formatTemp(r.sensorData.ppTemp, 0)}</span>;
    },
  },
  {
    title: '스파크',
    key: 'ppSpark',
    width: 80,
    render: (_: unknown, r: ControllerStatus) => {
      const level = getSparkLevel(r.sensorData.ppSpark);
      const config = getStatusConfig(level);
      return <span style={{ color: config.color }}>{r.sensorData.ppSpark}</span>;
    },
  },
  {
    title: '유입온도',
    key: 'inletTemp',
    width: 90,
    render: (_: unknown, r: ControllerStatus) => {
      const level = getInletTempLevel(r.sensorData.inletTemp);
      const config = getStatusConfig(level);
      return <span style={{ color: config.color }}>{formatTemp(r.sensorData.inletTemp)}</span>;
    },
  },
  {
    title: 'PM2.5',
    key: 'pm25',
    width: 80,
    render: (_: unknown, r: ControllerStatus) => `${formatNumber(r.sensorData.pm25)} µg/m³`,
  },
  {
    title: '차압',
    key: 'diffPressure',
    width: 80,
    render: (_: unknown, r: ControllerStatus) => formatPressure(r.sensorData.diffPressure),
  },
  {
    title: '팬',
    key: 'fan',
    width: 80,
    render: (_: unknown, r: ControllerStatus) =>
      r.sensorData.fanMode === 1
        ? '자동'
        : FAN_SPEED_LABELS[r.sensorData.fanSpeed] ?? '-',
  },
  {
    title: '최근 통신',
    dataIndex: 'lastSeenAt',
    key: 'lastSeenAt',
    width: 100,
    render: (v: string) => formatRelativeTime(v),
  },
];

export default function EquipmentDashboardPage({ equipmentId }: EquipmentDashboardPageProps) {
  const { data, isLoading } = useEquipmentDashboard(equipmentId);

  if (isLoading) {
    return <Spin tip="장비 데이터 로딩 중..." style={{ display: 'block', marginTop: 100 }} />;
  }

  if (!data) {
    return <Empty description="장비 데이터가 없습니다." />;
  }

  // Group sensor history by controller
  const history: SensorHistoryPoint[] = data.sensorHistory;
  const controllerIds = [...new Set(history.map((p) => p.controllerId))];

  const tempChartOption = {
    tooltip: { trigger: 'axis' as const },
    legend: { data: controllerIds.map((id) => `${id} 온도`) },
    xAxis: {
      type: 'time' as const,
      axisLabel: { formatter: '{HH}:{mm}' },
    },
    yAxis: {
      type: 'value' as const,
      name: '°C',
    },
    dataZoom: [{ type: 'inside' as const, start: 0, end: 100 }],
    series: controllerIds.map((ctrlId) => ({
      name: `${ctrlId} 온도`,
      type: 'line' as const,
      smooth: true,
      data: history
        .filter((p: SensorHistoryPoint) => p.controllerId === ctrlId)
        .map((p: SensorHistoryPoint) => [p.timestamp * 1000, p.ppTemp]),
    })),
    grid: { left: 50, right: 20, top: 40, bottom: 30 },
  };

  const sparkChartOption = {
    tooltip: { trigger: 'axis' as const },
    legend: { data: controllerIds.map((id) => `${id} 스파크`) },
    xAxis: {
      type: 'time' as const,
      axisLabel: { formatter: '{HH}:{mm}' },
    },
    yAxis: {
      type: 'value' as const,
      name: '횟수',
    },
    dataZoom: [{ type: 'inside' as const, start: 0, end: 100 }],
    series: controllerIds.map((ctrlId) => ({
      name: `${ctrlId} 스파크`,
      type: 'scatter' as const,
      data: history
        .filter((p: SensorHistoryPoint) => p.controllerId === ctrlId)
        .map((p: SensorHistoryPoint) => [p.timestamp * 1000, p.ppSpark]),
    })),
    grid: { left: 50, right: 20, top: 40, bottom: 30 },
  };

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <div>
        <Typography.Title level={4} style={{ margin: 0 }}>
          {data.equipmentName}
          <StatusTag level={data.status} />
        </Typography.Title>
        <Typography.Text type="secondary">{data.storeName}</Typography.Text>
      </div>

      <Card size="small">
        <Descriptions size="small" column={{ xs: 1, sm: 2, lg: 4 }}>
          <Descriptions.Item label="모델">{data.modelName}</Descriptions.Item>
          <Descriptions.Item label="설치일">{data.installDate}</Descriptions.Item>
          <Descriptions.Item label="담당 대리점">{data.dealerName}</Descriptions.Item>
          <Descriptions.Item label="매장">{data.storeName}</Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title="파워팩(컨트롤러) 상태" size="small">
        <Table
          dataSource={data.controllers}
          columns={controllerColumns}
          rowKey="controllerId"
          size="small"
          pagination={false}
          scroll={{ x: 900 }}
        />
      </Card>

      {(data.controllers as ControllerStatus[]).map((ctrl) => (
        <Card
          key={ctrl.controllerId}
          title={`${ctrl.controllerName} 센서 상세`}
          size="small"
          extra={<StatusTag level={ctrl.status} />}
        >
          <Row gutter={[8, 8]}>
            <Col span={4}>
              <SensorValue
                label="유입온도"
                value={formatTemp(ctrl.sensorData.inletTemp)}
                level={getInletTempLevel(ctrl.sensorData.inletTemp)}
              />
            </Col>
            <Col span={4}>
              <SensorValue
                label="풍량"
                value={`${formatNumber(ctrl.sensorData.flow)} CMH`}
              />
            </Col>
            <Col span={4}>
              <SensorValue
                label="풍속"
                value={`${formatNumber(ctrl.sensorData.velocity)} m/s`}
              />
            </Col>
            <Col span={4}>
              <SensorValue
                label="압력"
                value={formatPressure(ctrl.sensorData.ductDp)}
              />
            </Col>
            <Col span={4}>
              <SensorValue
                label="댐퍼"
                value={`${formatNumber(ctrl.sensorData.damper)}%`}
              />
            </Col>
            <Col span={4}>
              <SensorValue
                label="오일 만수"
                value={getOilLevelStatus(ctrl.sensorData.oilLevel).label}
                level={getOilLevelStatus(ctrl.sensorData.oilLevel).level}
              />
            </Col>
          </Row>
        </Card>
      ))}

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="보드 온도 추이 (최근 1시간)" size="small">
            <ReactECharts option={tempChartOption} style={{ height: 250 }} />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="스파크 추이 (최근 1시간)" size="small">
            <ReactECharts option={sparkChartOption} style={{ height: 250 }} />
          </Card>
        </Col>
      </Row>
    </Space>
  );
}
