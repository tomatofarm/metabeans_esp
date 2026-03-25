import { Card, Tabs } from 'antd';
import {
  DashboardOutlined,
  CloudOutlined,
  ExperimentOutlined,
} from '@ant-design/icons';
import type { GatewaySensorData } from '../../types/sensor.types';
import type { FloorIaqData } from '../../types/dashboard.types';
import { getIAQLevel, getStatusConfig } from '../../utils/statusHelper';
import type { StatusLevel } from '../../utils/constants';
import StatusBadge from './StatusBadge';
import type { BadgeStatus } from './StatusBadge';
import type { ReactNode } from 'react';

interface AirQualityCardProps {
  data?: GatewaySensorData | null;
  floorIaqList?: FloorIaqData[];
  storeName?: string;
  /** 카드 타이틀을 원하는 값으로 오버라이드 (예: "근처 대기질 정보") */
  cardTitle?: string;
}

interface IAQItemDef {
  label: string;
  value: number | null;
  unit: string;
  levelKey?: keyof typeof import('../../utils/constants').IAQ_THRESHOLDS;
  icon: ReactNode;
  gradient: string;
}

function levelToBadge(level: StatusLevel): { status: BadgeStatus; label: string } {
  switch (level) {
    case 'green':
      return { status: 'success', label: '좋음' };
    case 'yellow':
      return { status: 'warning', label: '보통' };
    case 'red':
      return { status: 'danger', label: '나쁨' };
    default:
      return { status: 'default', label: '—' };
  }
}

function IAQGrid({ data }: { data: GatewaySensorData }) {
  const items: IAQItemDef[] = [
    {
      label: '온도',
      value: data.temperature,
      unit: '°C',
      icon: <DashboardOutlined />,
      gradient: 'linear-gradient(135deg, #FF6B6B, #FF8E8E)',
    },
    {
      label: '습도',
      value: data.humidity,
      unit: '%',
      icon: <CloudOutlined />,
      gradient: 'linear-gradient(135deg, #4ECDC4, #6EE7DE)',
    },
    {
      label: 'PM2.5',
      value: data.pm2_5,
      unit: 'µg/m³',
      levelKey: 'pm2_5',
      icon: <ExperimentOutlined />,
      gradient: 'linear-gradient(135deg, #F59E0B, #FBBF24)',
    },
    {
      label: 'PM10',
      value: data.pm10,
      unit: 'µg/m³',
      levelKey: 'pm10',
      icon: <ExperimentOutlined />,
      gradient: 'linear-gradient(135deg, #F97316, #FB923C)',
    },
    {
      label: 'CO2',
      value: data.co2,
      unit: 'ppm',
      levelKey: 'co2',
      icon: <CloudOutlined />,
      gradient: 'linear-gradient(135deg, #6366F1, #818CF8)',
    },
    {
      label: 'TVOC',
      value: data.vocIndex,
      unit: '',
      icon: <ExperimentOutlined />,
      gradient: 'linear-gradient(135deg, #A78BFA, #C4B5FD)',
    },
    {
      label: 'CO',
      value: data.co,
      unit: 'ppm',
      levelKey: 'co',
      icon: <ExperimentOutlined />,
      gradient: 'linear-gradient(135deg, #EF4444, #F87171)',
    },
    {
      label: 'HCHO',
      value: data.hcho,
      unit: 'ppb',
      levelKey: 'hcho',
      icon: <ExperimentOutlined />,
      gradient: 'linear-gradient(135deg, #EC4899, #F472B6)',
    },
    {
      label: 'O3',
      value: data.o3,
      unit: 'ppm',
      icon: <ExperimentOutlined />,
      gradient: 'linear-gradient(135deg, #14B8A6, #2DD4BF)',
    },
    {
      label: 'NOx',
      value: data.noxIndex,
      unit: '',
      icon: <ExperimentOutlined />,
      gradient: 'linear-gradient(135deg, #8B5CF6, #A78BFA)',
    },
  ];

  return (
    <div className="iaq-grid-scroll">
      <div className="iaq-grid">
      {items.map((item) => {
        let color: string | undefined;
        let badge: { status: BadgeStatus; label: string };

        if (item.levelKey && item.value !== null) {
          const level = getIAQLevel(item.levelKey, item.value);
          color = getStatusConfig(level).color;
          badge = levelToBadge(level);
        } else {
          badge = { status: 'default', label: '—' };
        }

        return (
          <div className="iaq-item" key={item.label}>
            <div className="iaq-item-icon" style={{ background: item.gradient }}>
              {item.icon}
            </div>
            <div className="iaq-item-label">{item.label}</div>
            <div>
              <span className="iaq-item-value" style={{ color }}>
                {item.value ?? '-'}
              </span>
              {item.unit && <span className="iaq-item-unit">{item.unit}</span>}
            </div>
            <div className="iaq-item-badge">
              <StatusBadge status={badge.status} label={badge.label} />
            </div>
          </div>
        );
      })}
      </div>
    </div>
  );
}

const liveBadge = <span className="live-badge">● LIVE</span>;

export default function AirQualityCard({
  data,
  floorIaqList,
  storeName,
  cardTitle,
}: AirQualityCardProps) {
  // 층별 탭이 있는 경우
  if (floorIaqList && floorIaqList.length > 0) {
    const tabItems = floorIaqList.map((floor) => ({
      key: String(floor.floorId),
      label: `${floor.floorCode} ${floor.floorName ?? ''}`.trim(),
      children: <IAQGrid data={floor.iaqData} />,
    }));

    return (
      <Card
        className="air-quality-card"
        title={cardTitle ?? (storeName ? `${storeName} 실내 공기질 현황` : '실내공기질 (IAQ)')}
        extra={liveBadge}
        size="small"
      >
        <Tabs items={tabItems} size="small" className="air-quality-tabs" />
      </Card>
    );
  }

  // 단일 데이터 (하위 호환)
  if (!data) {
    return <Card title={cardTitle ?? '실내공기질 (IAQ)'}>데이터 없음</Card>;
  }

  return (
    <Card
      className="air-quality-card"
      title={cardTitle ?? (storeName ? `${storeName} 실내 공기질 현황` : '실내공기질 (IAQ)')}
      extra={liveBadge}
      size="small"
    >
      <IAQGrid data={data} />
    </Card>
  );
}
