import type { ReactNode } from 'react';
import { Card, Badge, Collapse, Space, Typography, Empty } from 'antd';
import {
  WifiOutlined,
  FireOutlined,
  FilterOutlined,
  CloudOutlined,
} from '@ant-design/icons';
import type { DashboardIssueCategory, DashboardIssueItem, DashboardIssueType } from '../../../types/dashboard.types';
import StatusTag from '../../../components/common/StatusTag';
import { STATUS_COLORS } from '../../../utils/constants';
import { formatRelativeTime } from '../../../utils/formatters';

const { Text } = Typography;

interface IssuePanelProps {
  categories?: DashboardIssueCategory[];
  loading?: boolean;
  onEquipmentClick?: (equipmentId: number) => void;
}

const ISSUE_ICONS: Record<DashboardIssueType, ReactNode> = {
  COMM_ERROR: <WifiOutlined />,
  INLET_TEMP: <FireOutlined />,
  FILTER_CHECK: <FilterOutlined />,
  DUST_REMOVAL: <CloudOutlined />,
};

function CategoryHeader({ category }: { category: DashboardIssueCategory }) {
  const total = category.items.length;
  return (
    <Space>
      {ISSUE_ICONS[category.type]}
      <Text strong>{category.label}</Text>
      <Text type="secondary" style={{ fontSize: 12 }}>
        ({category.description})
      </Text>
      {category.redCount > 0 && (
        <Badge count={category.redCount} style={{ backgroundColor: STATUS_COLORS.DANGER.color }} />
      )}
      {category.yellowCount > 0 && (
        <Badge count={category.yellowCount} style={{ backgroundColor: STATUS_COLORS.WARNING.color }} />
      )}
      {total === 0 && (
        <StatusTag level="green" label="이상 없음" />
      )}
    </Space>
  );
}

function IssueItemCard({
  item,
  onEquipmentClick,
}: {
  item: DashboardIssueItem;
  onEquipmentClick?: (equipmentId: number) => void;
}) {
  return (
    <div className="issue-item">
      <span className={`issue-dot ${item.severity === 'red' ? 'issue-dot-red' : 'issue-dot-yellow'}`} />
      <div className="issue-info">
        <div className="issue-store">{item.storeName}</div>
        <div className="issue-equip">
          <a onClick={() => onEquipmentClick?.(item.equipmentId)}>{item.equipmentName}</a>
          {item.currentValue !== undefined && (
            <span style={{ color: 'var(--color-mid)', fontWeight: 400 }}>
              {' '}&middot; {item.currentValue}{item.unit ? ` ${item.unit}` : ''}
            </span>
          )}
        </div>
        <div className="issue-time">{formatRelativeTime(item.occurredAt)}</div>
      </div>
      <StatusTag level={item.severity} />
    </div>
  );
}

export default function IssuePanel({ categories, loading, onEquipmentClick }: IssuePanelProps) {
  if (!categories || categories.length === 0) {
    return (
      <Card title="문제 발생 이슈" loading={loading}>
        <Empty description="이슈 없음" />
      </Card>
    );
  }

  const totalCount = categories.reduce((sum, cat) => sum + cat.items.length, 0);

  const items = categories.map((cat) => ({
    key: cat.type,
    label: <CategoryHeader category={cat} />,
    children:
      cat.items.length > 0 ? (
        <div>
          {cat.items.map((item) => (
            <IssueItemCard
              key={item.issueId}
              item={item}
              onEquipmentClick={onEquipmentClick}
            />
          ))}
        </div>
      ) : (
        <Text type="secondary">해당 이슈가 없습니다.</Text>
      ),
  }));

  const cardTitle = (
    <Space>
      <span>문제 발생 이슈</span>
      {totalCount > 0 && (
        <Badge count={totalCount} style={{ backgroundColor: STATUS_COLORS.DANGER.color }} />
      )}
    </Space>
  );

  return (
    <Card
      title={cardTitle}
      loading={loading}
      styles={{ body: { padding: '0 0 8px' } }}
    >
      <Collapse
        items={items}
        defaultActiveKey={categories.filter((c) => c.items.length > 0).map((c) => c.type)}
        ghost
      />
    </Card>
  );
}
