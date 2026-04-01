import { useMemo } from 'react';
import { Row, Col, Spin, Empty, Typography, Tag } from 'antd';
import { SyncOutlined } from '@ant-design/icons';
import { useUiStore } from '../../stores/uiStore';
import { useRealtimeSensorData, useSensorHistory } from '../../api/monitoring.api';
import { SENSOR_INTERVAL_MS } from '../../utils/constants';
import ControllerBasicStatusSection from './components/ControllerBasicStatusSection';
import FilterCheckSection from './components/FilterCheckSection';
import FireSensorSection from './components/FireSensorSection';
import MonitoringEsgSection from './components/MonitoringEsgSection';
import BoardTempChart from '../../components/charts/BoardTempChart';
import SparkChart from '../../components/charts/SparkChart';

const { Text } = Typography;

export default function RealtimeMonitorPage() {
  const selectedEquipmentId = useUiStore((s) => s.selectedEquipmentId);
  const selectedControllerId = useUiStore((s) => s.selectedControllerId);

  const { data: realtimeData, isLoading, dataUpdatedAt } = useRealtimeSensorData(selectedEquipmentId);
  const { data: historyData } = useSensorHistory(selectedEquipmentId);

  // 선택된 컨트롤러로 섹션①②③ 필터링 (ESP 선택 시 전체, 컨트롤러 선택 시 해당만)
  const filteredControllers = useMemo(() => {
    if (!realtimeData) return [];
    if (selectedControllerId) {
      return realtimeData.controllers.filter((c) => c.controllerId === selectedControllerId);
    }
    return realtimeData.controllers;
  }, [realtimeData, selectedControllerId]);

  // 차트용 히스토리 데이터 필터 (선택된 컨트롤러만)
  const filteredHistory = useMemo(() => {
    if (!historyData) return [];
    if (!selectedControllerId) return historyData;
    const selectedCtrl = realtimeData?.controllers.find((c) => c.controllerId === selectedControllerId);
    if (!selectedCtrl) return historyData;
    return historyData.filter((p) => p.controllerName === selectedCtrl.controllerName);
  }, [historyData, selectedControllerId, realtimeData]);


  if (!selectedEquipmentId) {
    return <Empty description="좌측 트리에서 장비를 선택하세요" />;
  }

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: 60 }}>
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>
          <Text type="secondary">센서 데이터를 불러오는 중...</Text>
        </div>
      </div>
    );
  }

  if (!realtimeData) {
    return <Empty description="센서 데이터가 없습니다" />;
  }

  const lastUpdated = dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleTimeString('ko-KR') : '-';

  return (
    <div>
      {/* 갱신 주기 안내 */}
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 8 }}>
        <Tag icon={<SyncOutlined spin />} color="processing">
          {SENSOR_INTERVAL_MS / 1000}초 자동 갱신
        </Tag>
        <Text type="secondary" style={{ fontSize: 12 }}>
          마지막 갱신: {lastUpdated}
        </Text>
      </div>

      {/* 좌: 장비 기본 상태 + ESG 지표 / 우: 화재 감지 센서 + 필터 점검 상태 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        {/* 왼쪽: 장비 기본 상태 + ESG 지표 */}
        <Col xs={24} xl={12}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <ControllerBasicStatusSection controllers={filteredControllers} />
            <MonitoringEsgSection
              esgData={realtimeData.esgData}
              equipmentName={realtimeData.equipmentName}
            />
          </div>
        </Col>

        {/* 오른쪽: 화재 감지 센서 + 필터 점검 상태 */}
        <Col xs={24} xl={12}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <FireSensorSection controllers={filteredControllers} />
            <FilterCheckSection
              controllers={filteredControllers}
              historyData={filteredHistory}
            />
          </div>
        </Col>
      </Row>

      {/* 차트: 보드 온도 추이 + 스파크 추이 */}
      <Row gutter={[16, 16]}>
        <Col xs={24} xl={12}>
          <BoardTempChart historyData={filteredHistory} />
        </Col>
        <Col xs={24} xl={12}>
          <SparkChart historyData={filteredHistory} />
        </Col>
      </Row>
    </div>
  );
}
