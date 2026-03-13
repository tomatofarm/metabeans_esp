import { Card, Row, Col, Statistic } from 'antd';
import {
  ExperimentOutlined,
  ThunderboltOutlined,
  CloudOutlined,
} from '@ant-design/icons';
import type { EsgSummary } from '../../../types/dashboard.types';
import { ROLE_CONFIG, STATUS_COLORS } from '../../../utils/constants';

interface EsgSummaryCardProps {
  data?: EsgSummary;
  loading?: boolean;
}

export default function EsgSummaryCard({ data, loading }: EsgSummaryCardProps) {
  return (
    <Card title="ESG 지표 요약" loading={loading}>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={8}>
          <Statistic
            title="유증기 포집량"
            value={data?.totalOilCollected ?? 0}
            suffix="L"
            prefix={<ExperimentOutlined />}
            precision={1}
            valueStyle={{ color: ROLE_CONFIG.DEALER.color }}
          />
        </Col>
        <Col xs={24} sm={8}>
          <Statistic
            title="에너지 절감률"
            value={data?.energySavingRate ?? 0}
            suffix="%"
            prefix={<ThunderboltOutlined />}
            precision={1}
            valueStyle={{ color: STATUS_COLORS.GOOD.color }}
          />
        </Col>
        <Col xs={24} sm={8}>
          <Statistic
            title="CO2 저감량"
            value={data?.co2Reduction ?? 0}
            suffix="kg"
            prefix={<CloudOutlined />}
            precision={1}
            valueStyle={{ color: ROLE_CONFIG.ADMIN.color }}
          />
        </Col>
      </Row>
    </Card>
  );
}
