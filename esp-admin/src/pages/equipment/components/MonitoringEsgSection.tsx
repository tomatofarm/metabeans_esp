import { Card, Row, Col, Statistic, Divider } from 'antd';
import { ExperimentOutlined } from '@ant-design/icons';
import type { RealtimeControllerData } from '../../../types/sensor.types';
import { computeEsgFromOilLevel, ESG_OIL_LEVEL_FULL_KG } from '../../../utils/esgMetrics';

interface Props {
  controllers: RealtimeControllerData[];
  equipmentName: string;
}

export default function MonitoringEsgSection({ controllers, equipmentName }: Props) {
  if (controllers.length === 0) return null;

  return (
    <Card
      title="ESG 지표"
      size="small"
      extra={<span style={{ fontSize: 12, color: '#888' }}>파워팩별 데이터</span>}
    >
      <div style={{ marginBottom: 12, fontSize: 13, color: '#888' }}>
        {equipmentName}
      </div>
      {controllers.map((ctrl, idx) => {
        const metrics = computeEsgFromOilLevel(ctrl.sensorData.oilLevel);
        return (
          <div key={ctrl.controllerId}>
            {idx > 0 && <Divider style={{ margin: '16px 0' }} />}
            <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 12, color: '#555' }}>
              {ctrl.controllerName}
            </div>
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={8}>
                <Statistic
                  title="유증 포집량"
                  value={metrics.oilCollectedKg}
                  suffix="kg"
                  prefix={<ExperimentOutlined />}
                  precision={0}
                  valueStyle={{ color: '#52c41a', fontWeight: 700 }}
                />
              </Col>
              <Col xs={24} sm={8}>
                <Statistic
                  title="폐유 수집량"
                  value={metrics.wasteOilCollectedKg}
                  suffix="kg"
                  prefix={<ExperimentOutlined />}
                  precision={0}
                  valueStyle={{ color: '#1890ff', fontWeight: 700 }}
                />
                <div style={{ fontSize: 11, color: '#aaa', marginTop: 4 }}>유증 포집량 × 2</div>
              </Col>
              <Col xs={24} sm={8}>
                <Statistic
                  title="총 포집량"
                  value={metrics.totalCollectedKg}
                  suffix="kg"
                  prefix={<ExperimentOutlined />}
                  precision={0}
                  valueStyle={{ color: '#722ed1', fontWeight: 700 }}
                />
              </Col>
            </Row>
          </div>
        );
      })}
      <div style={{ marginTop: 16, fontSize: 11, color: '#bbb', borderTop: '1px solid #f0f0f0', paddingTop: 10 }}>
        ※ 유증 포집량: oil_level 0 → 0kg, 1 → {ESG_OIL_LEVEL_FULL_KG}kg
      </div>
    </Card>
  );
}
