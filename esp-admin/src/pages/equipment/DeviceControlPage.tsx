import { useState, useEffect, useMemo, type ReactNode } from 'react';
import { Tabs, Empty } from 'antd';
import { PoweroffOutlined, ControlOutlined, SwapOutlined } from '@ant-design/icons';
import { useUiStore } from '../../stores/uiStore';
import { useFeaturePermission } from '../../hooks/useFeaturePermission';
import ControlPowerPage from './ControlPowerPage';
import ControlDamperPage from './ControlDamperPage';
import ControlFanPage from './ControlFanPage';

export default function DeviceControlPage() {
  const selectedEquipmentId = useUiStore((s) => s.selectedEquipmentId);
  const [activeTab, setActiveTab] = useState('power');

  const { isAllowed: canPower, isLoading: powerLoading } = useFeaturePermission('control.power');
  const { isAllowed: canDamper, isLoading: damperLoading } = useFeaturePermission('control.damper');
  const { isAllowed: canFan, isLoading: fanLoading } = useFeaturePermission('control.fan');

  const showPowerTab = powerLoading || canPower;
  const showDamperTab = damperLoading || canDamper;
  const showFanTab = fanLoading || canFan;

  const permLoading = powerLoading || damperLoading || fanLoading;

  const tabItems = useMemo(() => {
    const items: { key: string; label: ReactNode; children: ReactNode }[] = [];
    if (showPowerTab) {
      items.push({
        key: 'power',
        label: (
          <span>
            <PoweroffOutlined /> 전원 제어
          </span>
        ),
        children: <ControlPowerPage />,
      });
    }
    if (showDamperTab) {
      items.push({
        key: 'damper',
        label: (
          <span>
            <ControlOutlined /> 방화셔터(댐퍼)
          </span>
        ),
        children: <ControlDamperPage />,
      });
    }
    if (showFanTab) {
      items.push({
        key: 'fan',
        label: (
          <span>
            <SwapOutlined /> 송풍기(팬)
          </span>
        ),
        children: <ControlFanPage />,
      });
    }
    return items;
  }, [showPowerTab, showDamperTab, showFanTab]);

  const visibleKeys = useMemo(() => tabItems.map((t) => t.key), [tabItems]);

  useEffect(() => {
    if (permLoading) return;
    if (visibleKeys.length === 0) return;
    if (!visibleKeys.includes(activeTab)) {
      setActiveTab(visibleKeys[0]!);
    }
  }, [permLoading, visibleKeys, activeTab]);

  if (!selectedEquipmentId) {
    return <Empty description="좌측 트리에서 장비를 선택하세요" />;
  }

  if (!permLoading && visibleKeys.length === 0) {
    return <Empty description="이용 가능한 제어 항목이 없습니다." />;
  }

  return (
    <Tabs
      activeKey={visibleKeys.includes(activeTab) ? activeTab : visibleKeys[0]}
      onChange={setActiveTab}
      items={tabItems}
      className="equip-tabs"
    />
  );
}
