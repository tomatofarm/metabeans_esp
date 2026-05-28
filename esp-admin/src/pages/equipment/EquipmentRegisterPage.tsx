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
import { useNavigate, Navigate } from 'react-router-dom';
import { useFeaturePermission } from '../../hooks/useFeaturePermission';
import { STATUS_COLORS } from '../../utils/constants';
import dayjs from 'dayjs';
import {
  useCreateEquipment,
  useEquipmentModels,
  useStoreOptions,
  useDealerOptions,
} from '../../api/equipment.api';

const { Title } = Typography;

const MAX_CONTROLLERS = 4;

const FLOOR_CODE_RULES = [
  { required: true, message: '층 코드를 입력하세요' },
  {
    pattern: /^[!-~]{1,10}$/,
    message: '영문·숫자·특수문자(1~10자), 한글·공백 불가',
  },
  {
    validator: (_: unknown, value: string) => {
      if (value && /[/+#]/.test(value)) {
        return Promise.reject('/ + # 문자는 사용할 수 없습니다');
      }
      return Promise.resolve();
    },
  },
];

const GW_DEVICE_ID_RULES = [
  { required: true, message: '게이트웨이 ID를 입력하세요' },
  {
    pattern: /^[!-~]{1,50}$/,
    message: '영문·숫자·특수문자(1~50자), 한글·공백 불가',
  },
  {
    validator: (_: unknown, value: string) => {
      if (value && /[/+#]/.test(value)) {
        return Promise.reject('/ + # 문자는 사용할 수 없습니다');
      }
      return Promise.resolve();
    },
  },
];

export default function EquipmentRegisterPage() {
  const navigate = useNavigate();
  const { isAllowed: canCreate, isLoading: createPermLoading } = useFeaturePermission('equipment.create');
  const [form] = Form.useForm();
  const [selectedStoreId, setSelectedStoreId] = useState<number | null>(null);

  const createMutation = useCreateEquipment();
  const { data: modelsData } = useEquipmentModels();
  const { data: storeOptions } = useStoreOptions();
  const { data: dealerOptions } = useDealerOptions();

  const models = modelsData?.data ?? [];

  const handleStoreChange = (storeId: number) => {
    setSelectedStoreId(storeId);
    form.setFieldsValue({ floorCode: '', floorName: '', controllers: [{ ctrlDeviceId: '', gwDeviceId: '' }] });
  };

  const handleSubmit = async (values: Record<string, unknown>) => {
    const controllers = (values.controllers as { ctrlDeviceId: string; gwDeviceId: string }[]) ?? [];

    if (controllers.length === 0) {
      message.error('최소 1개의 컨트롤러를 등록해야 합니다.');
      return;
    }

    const req = {
      equipmentSerial: values.equipmentSerial as string,
      mqttEquipmentId: values.mqttEquipmentId as string,
      storeId: values.storeId as number,
      floorCode: values.floorCode as string,
      floorName: (values.floorName as string) || undefined,
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
        gwDeviceId: c.gwDeviceId,
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

  if (!createPermLoading && !canCreate) {
    return <Navigate to="/equipment" replace />;
  }

  return (
    <div>
      <Title level={4}>장비 등록</Title>

      <Card>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{ controllers: [{ ctrlDeviceId: '', gwDeviceId: '' }] }}
          style={{ maxWidth: 800 }}
        >
          {/* 매장/위치 */}
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
            name="floorCode"
            label="층 코드"
            rules={FLOOR_CODE_RULES}
            extra="게이트웨이 펌웨어 floor_id와 정확히 일치. 예: 1F, B1, Floor2"
          >
            <Input
              placeholder="예: 1F"
              disabled={!selectedStoreId}
              style={{ maxWidth: 200 }}
            />
          </Form.Item>

          <Form.Item
            name="floorName"
            label="층 이름 (선택)"
            extra="화면 표시용. 한글 가능. 예: 1층 주방"
          >
            <Input
              placeholder="예: 1층 주방"
              disabled={!selectedStoreId}
              style={{ maxWidth: 300 }}
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
                      name={[name, 'gwDeviceId']}
                      rules={GW_DEVICE_ID_RULES}
                    >
                      <Input placeholder="게이트웨이 ID (예: gw-001)" style={{ width: 220 }} />
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
                      onClick={() => add({ ctrlDeviceId: '', gwDeviceId: '' })}
                      icon={<PlusOutlined />}
                      style={{ width: 460 }}
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
