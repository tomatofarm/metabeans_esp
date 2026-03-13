import { useEffect } from 'react';
import {
  Card,
  Form,
  Input,
  Select,
  Button,
  Space,
  Typography,
  message,
  Divider,
  Spin,
  Empty,
} from 'antd';
import { PlusOutlined, MinusCircleOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { STATUS_COLORS } from '../../utils/constants';
import {
  useEquipmentDetail,
  useUpdateEquipment,
  useEquipmentModels,
  useDealerOptions,
  useGatewayOptions,
} from '../../api/equipment.api';

const { Title } = Typography;

const MAX_CONTROLLERS = 4;

export default function EquipmentEditPage() {
  const navigate = useNavigate();
  const { equipmentId } = useParams<{ equipmentId: string }>();
  const numId = equipmentId ? parseInt(equipmentId, 10) : null;

  const [form] = Form.useForm();
  const { data, isLoading } = useEquipmentDetail(numId);
  const updateMutation = useUpdateEquipment();
  const { data: modelsData } = useEquipmentModels();
  const { data: dealerOptions } = useDealerOptions();

  const equipment = data?.data;
  const models = modelsData?.data ?? [];

  // 게이트웨이 옵션: 장비가 속한 층의 게이트웨이
  const { data: gatewayOptions } = useGatewayOptions(equipment?.floor.floorId ?? null);

  // 기존 데이터 로드
  useEffect(() => {
    if (equipment) {
      form.setFieldsValue({
        equipmentName: equipment.equipmentName,
        modelId: equipment.model.modelId,
        cellType: equipment.cellType,
        dealerId: equipment.dealer?.dealerId,
        controllers: equipment.controllers.map((c) => ({
          ctrlDeviceId: c.ctrlDeviceId,
          gatewayId: equipment.gateway.gatewayId,
        })),
      });
    }
  }, [equipment, form]);

  const handleSubmit = async (values: Record<string, unknown>) => {
    if (!numId) return;

    const controllers = values.controllers as { ctrlDeviceId: string; gatewayId: number }[];

    try {
      await updateMutation.mutateAsync({
        equipmentId: numId,
        data: {
          equipmentName: values.equipmentName as string,
          modelId: values.modelId as number,
          cellType: (values.cellType as string) || undefined,
          dealerId: (values.dealerId as number) || undefined,
          controllers: controllers?.map((c) => ({
            ctrlDeviceId: c.ctrlDeviceId,
            gatewayId: c.gatewayId,
          })),
        },
      });
      message.success('장비 정보가 수정되었습니다.');
      navigate('/equipment');
    } catch {
      message.error('장비 수정에 실패했습니다.');
    }
  };

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: 60 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!equipment) {
    return (
      <Card>
        <Empty description="장비 정보를 찾을 수 없습니다." />
      </Card>
    );
  }

  return (
    <div>
      <Title level={4}>장비 정보 수정</Title>

      <Card>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          style={{ maxWidth: 800 }}
        >
          {/* 읽기 전용 정보 */}
          <Divider orientation="left">장비 식별 정보 (수정 불가)</Divider>
          <Form.Item label="시리얼 번호">
            <Input value={equipment.equipmentSerial} disabled />
          </Form.Item>
          <Form.Item label="MQTT 장비 ID">
            <Input value={equipment.mqttEquipmentId} disabled />
          </Form.Item>
          <Form.Item label="설치 위치">
            <Input
              value={`${equipment.store.storeName} / ${equipment.floor.floorName} (${equipment.floor.floorCode})`}
              disabled
            />
          </Form.Item>

          {/* 수정 가능 필드 */}
          <Divider orientation="left">수정 가능 정보</Divider>
          <Form.Item
            name="equipmentName"
            label="장비명"
            rules={[{ required: true, message: '장비명을 입력하세요' }]}
          >
            <Input placeholder="예: ESP 집진기 #1" />
          </Form.Item>

          <Form.Item
            name="modelId"
            label="모델"
            rules={[{ required: true, message: '모델을 선택하세요' }]}
          >
            <Select
              placeholder="모델 선택"
              options={models.map((m) => ({
                value: m.modelId,
                label: `${m.modelName} (${m.manufacturer ?? ''})`,
              }))}
            />
          </Form.Item>

          <Form.Item name="cellType" label="셀 타입">
            <Input placeholder="예: SUS 316L (직접 입력)" />
          </Form.Item>

          <Form.Item name="dealerId" label="담당 대리점">
            <Select
              placeholder="대리점 선택"
              allowClear
              options={dealerOptions?.map((d) => ({
                value: d.dealerId,
                label: d.dealerName,
              }))}
            />
          </Form.Item>

          {/* 컨트롤러 수정 */}
          <Divider orientation="left">컨트롤러 (파워팩)</Divider>
          <Form.List name="controllers">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <Space key={key} align="baseline" style={{ display: 'flex', marginBottom: 8 }}>
                    <Form.Item
                      {...restField}
                      name={[name, 'ctrlDeviceId']}
                      rules={[{ required: true, message: '컨트롤러 ID 입력' }]}
                    >
                      <Input placeholder="컨트롤러 ID (예: ctrl-001)" style={{ width: 220 }} />
                    </Form.Item>
                    <Form.Item
                      {...restField}
                      name={[name, 'gatewayId']}
                      rules={[{ required: true, message: '게이트웨이 선택' }]}
                    >
                      <Select
                        placeholder="게이트웨이"
                        style={{ width: 200 }}
                        options={gatewayOptions?.map((g) => ({
                          value: g.gatewayId,
                          label: g.gwDeviceId,
                        }))}
                      />
                    </Form.Item>
                    {fields.length > 1 && (
                      <MinusCircleOutlined
                        onClick={() => remove(name)}
                        style={{ color: STATUS_COLORS.DANGER.color }}
                      />
                    )}
                  </Space>
                ))}
                {fields.length < MAX_CONTROLLERS && (
                  <Form.Item>
                    <Button
                      type="dashed"
                      onClick={() => add({ ctrlDeviceId: '', gatewayId: equipment.gateway.gatewayId })}
                      icon={<PlusOutlined />}
                      style={{ width: 420 }}
                    >
                      컨트롤러 추가 (최대 {MAX_CONTROLLERS}대)
                    </Button>
                  </Form.Item>
                )}
              </>
            )}
          </Form.List>

          {/* 버튼 */}
          <Divider />
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={updateMutation.isPending}>
                저장
              </Button>
              <Button onClick={() => navigate('/equipment')}>취소</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
