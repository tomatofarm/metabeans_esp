import { useState } from 'react';
import {
  Card,
  Form,
  Input,
  Select,
  DatePicker,
  Button,
  Space,
  Typography,
  message,
  Divider,
} from 'antd';
import { PlusOutlined, MinusCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { STATUS_COLORS } from '../../utils/constants';
import dayjs from 'dayjs';
import {
  useCreateEquipment,
  useEquipmentModels,
  useStoreOptions,
  useFloorOptions,
  useGatewayOptions,
  useDealerOptions,
} from '../../api/equipment.api';

const { Title } = Typography;

const MAX_CONTROLLERS = 4;

export default function EquipmentRegisterPage() {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [selectedStoreId, setSelectedStoreId] = useState<number | null>(null);
  const [selectedFloorId, setSelectedFloorId] = useState<number | null>(null);

  const createMutation = useCreateEquipment();
  const { data: modelsData } = useEquipmentModels();
  const { data: storeOptions } = useStoreOptions();
  const { data: floorOptions } = useFloorOptions(selectedStoreId);
  const { data: gatewayOptions } = useGatewayOptions(selectedFloorId);
  const { data: dealerOptions } = useDealerOptions();

  const models = modelsData?.data ?? [];

  const handleStoreChange = (storeId: number) => {
    setSelectedStoreId(storeId);
    setSelectedFloorId(null);
    form.setFieldsValue({ floorId: undefined, controllers: [{ ctrlDeviceId: '', gatewayId: undefined }] });
  };

  const handleFloorChange = (floorId: number) => {
    setSelectedFloorId(floorId);
    form.setFieldsValue({
      controllers: (form.getFieldValue('controllers') as { ctrlDeviceId: string; gatewayId?: number }[])?.map(
        (c) => ({ ...c, gatewayId: undefined }),
      ),
    });
  };

  const handleSubmit = async (values: Record<string, unknown>) => {
    const controllers = (values.controllers as { ctrlDeviceId: string; gatewayId: number }[]) ?? [];

    if (controllers.length === 0) {
      message.error('최소 1개의 컨트롤러를 등록해야 합니다.');
      return;
    }

    const req = {
      equipmentSerial: values.equipmentSerial as string,
      mqttEquipmentId: values.mqttEquipmentId as string,
      storeId: values.storeId as number,
      floorId: values.floorId as number,
      equipmentName: values.equipmentName as string,
      modelId: values.modelId as number,
      cellType: (values.cellType as string) || undefined,
      powerpackCount: controllers.length,
      purchaseDate: values.purchaseDate
        ? (values.purchaseDate as dayjs.Dayjs).format('YYYY-MM-DD')
        : undefined,
      warrantyEndDate: values.warrantyEndDate
        ? (values.warrantyEndDate as dayjs.Dayjs).format('YYYY-MM-DD')
        : undefined,
      dealerId: (values.dealerId as number) || undefined,
      controllers: controllers.map((c) => ({
        ctrlDeviceId: c.ctrlDeviceId,
        gatewayId: c.gatewayId,
      })),
    };

    try {
      await createMutation.mutateAsync(req);
      message.success('장비가 등록되었습니다.');
      navigate('/equipment');
    } catch {
      message.error('장비 등록에 실패했습니다.');
    }
  };

  return (
    <div>
      <Title level={4}>장비 등록</Title>

      <Card>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{ controllers: [{ ctrlDeviceId: '', gatewayId: undefined }] }}
          style={{ maxWidth: 800 }}
        >
          {/* 매장/위치 선택 */}
          <Divider orientation="left">설치 위치</Divider>
          <Form.Item
            name="storeId"
            label="매장"
            rules={[{ required: true, message: '매장을 선택하세요' }]}
          >
            <Select
              placeholder="매장 선택"
              onChange={handleStoreChange}
              options={storeOptions?.map((s) => ({
                value: s.storeId,
                label: s.storeName,
              }))}
            />
          </Form.Item>

          <Form.Item
            name="floorId"
            label="층"
            rules={[{ required: true, message: '층을 선택하세요' }]}
          >
            <Select
              placeholder="층 선택"
              disabled={!selectedStoreId}
              onChange={handleFloorChange}
              options={floorOptions?.map((f) => ({
                value: f.floorId,
                label: f.floorName ?? f.floorCode,
              }))}
            />
          </Form.Item>

          {/* 장비 기본 정보 */}
          <Divider orientation="left">장비 정보</Divider>
          <Form.Item
            name="equipmentSerial"
            label="시리얼 번호"
            rules={[{ required: true, message: '시리얼 번호를 입력하세요' }]}
          >
            <Input placeholder="예: MB-ESP-2024-00099" />
          </Form.Item>

          <Form.Item
            name="mqttEquipmentId"
            label="MQTT 장비 ID"
            rules={[{ required: true, message: 'MQTT 장비 ID를 입력하세요' }]}
          >
            <Input placeholder="예: esp-001" />
          </Form.Item>

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

          <Form.Item name="purchaseDate" label="설치일">
            <DatePicker style={{ width: '100%' }} placeholder="설치일 선택" />
          </Form.Item>

          <Form.Item name="warrantyEndDate" label="보증 만료일">
            <DatePicker style={{ width: '100%' }} placeholder="보증 만료일 선택" />
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

          {/* 컨트롤러 등록 */}
          <Divider orientation="left">컨트롤러 (파워팩) 등록</Divider>
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
                        disabled={!selectedFloorId}
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
                      onClick={() => add({ ctrlDeviceId: '', gatewayId: undefined })}
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
              <Button type="primary" htmlType="submit" loading={createMutation.isPending}>
                등록
              </Button>
              <Button onClick={() => navigate('/equipment')}>취소</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
