import { Card, Row, Col, Statistic } from 'antd';
import { ExperimentOutlined } from '@ant-design/icons';
import type { EquipmentEsgData } from '../../../types/sensor.types';

interface Props {
  esgData: EquipmentEsgData;
  equipmentName: string;
}

export default function MonitoringEsgSection({ esgData, equipmentName }: Props) {
  return (
    <Card
      title="ESG 지표"
      size="small"
      extra={<span style={{ fontSize: 12, color: '#888' }}>장비별 데이터</span>}
    >
      <div style={{ marginBottom: 10, fontSize: 13, color: '#888' }}>
        {equipmentName}
      </div>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={8}>
          <Statistic
            title="유증 포집량"
            value={esgData.oilCollectedKg}
            suffix="kg"
            prefix={<ExperimentOutlined />}
            precision={1}
            valueStyle={{ color: '#52c41a', fontWeight: 700 }}
          />
        </Col>
        <Col xs={24} sm={8}>
          <Statistic
            title="폐유 수집량"
            value={esgData.wasteOilCollectedKg}
            suffix="kg"
            prefix={<ExperimentOutlined />}
            precision={1}
            valueStyle={{ color: '#1890ff', fontWeight: 700 }}
          />
          <div style={{ fontSize: 11, color: '#aaa', marginTop: 4 }}>유증 포집량 × 2</div>
        </Col>
        <Col xs={24} sm={8}>
          <Statistic
            title="총 포집량"
            value={esgData.totalCollectedKg}
            suffix="kg"
            prefix={<ExperimentOutlined />}
            precision={1}
            valueStyle={{ color: '#722ed1', fontWeight: 700 }}
          />
        </Col>
      </Row>
      <div style={{ marginTop: 16, fontSize: 11, color: '#bbb', borderTop: '1px solid #f0f0f0', paddingTop: 10 }}>
        ※ 임시 랜덤 데이터 · 추후 연동을 위해 dataset 구축 필요
      </div>
    </Card>
  );
}
