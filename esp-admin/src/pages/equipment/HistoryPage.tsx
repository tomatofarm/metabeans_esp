import { useState } from 'react';
import { Tabs, Empty } from 'antd';
import {
  LineChartOutlined,
  ControlOutlined,
  AlertOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import { useUiStore } from '../../stores/uiStore';
import SensorHistoryTab from './history/SensorHistoryTab';
import ControlHistoryTab from './history/ControlHistoryTab';
import AlarmHistoryTab from './history/AlarmHistoryTab';
import EquipmentChangeHistoryTab from './history/EquipmentChangeHistoryTab';

export default function HistoryPage() {
  const selectedEquipmentId = useUiStore((s) => s.selectedEquipmentId);
  const [activeTab, setActiveTab] = useState('sensor');

  if (!selectedEquipmentId) {
    return <Empty description="좌측 트리에서 장비를 선택하세요" />;
  }

  const tabItems = [
    {
      key: 'sensor',
      label: (
        <span>
          <LineChartOutlined /> 센서 이력
        </span>
      ),
      children: <SensorHistoryTab equipmentId={selectedEquipmentId} />,
    },
    {
      key: 'control',
      label: (
        <span>
          <ControlOutlined /> 제어 이력
        </span>
      ),
      children: <ControlHistoryTab equipmentId={selectedEquipmentId} />,
    },
    {
      key: 'alarm',
      label: (
        <span>
          <AlertOutlined /> 알람 이력
        </span>
      ),
      children: <AlarmHistoryTab equipmentId={selectedEquipmentId} />,
    },
    {
      key: 'change',
      label: (
        <span>
          <FileTextOutlined /> 장비 변경 이력
        </span>
      ),
      children: <EquipmentChangeHistoryTab equipmentId={selectedEquipmentId} />,
    },
  ];

  return (
    <Tabs
      activeKey={activeTab}
      onChange={setActiveTab}
      items={tabItems}
      className="history-subtabs"
    />
  );
}
