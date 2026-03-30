import { useEffect } from 'react';
import {
  Form,
  Select,
  Input,
  DatePicker,
  Radio,
  Upload,
  Button,
  message,
  Result,
  Typography,
} from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import { useSearchParams, useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { useCreateASRequest, useASStoreOptions, useASEquipmentOptions } from '../../api/as-service.api';
import { useAuthStore } from '../../stores/authStore';
import type { FaultType, Urgency, AlertType } from '../../types/as-service.types';

const { TextArea } = Input;
const { Text } = Typography;

const FAULT_TYPE_OPTIONS: { value: FaultType; label: string }[] = [
  { value: 'POWER', label: '전원불량' },
  { value: 'SPARK', label: '스파크' },
  { value: 'TEMPERATURE', label: '온도이상' },
  { value: 'COMM_ERROR', label: '통신오류' },
  { value: 'NOISE', label: '소음' },
  { value: 'OTHER', label: '기타' },
];

// 알림 유형 → 고장 유형 매핑
const ALERT_TO_FAULT_MAP: Partial<Record<AlertType, FaultType>> = {
  COMM_ERROR: 'COMM_ERROR',
  INLET_TEMP: 'TEMPERATURE',
  SPARK: 'SPARK',
  FILTER_CHECK: 'OTHER',
  DUST_REMOVAL: 'OTHER',
};

interface FormValues {
  storeId: number;
  equipmentId?: number;
  faultType: FaultType;
  description: string;
  preferredVisitDatetime: dayjs.Dayjs;
  urgency: Urgency;
  contactName: string;
  contactPhone: string;
}

export default function ASRequestPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [form] = Form.useForm<FormValues>();
  const user = useAuthStore((s) => s.user);

  const createMutation = useCreateASRequest();

  // 매장 옵션
  const { data: storeOptions = [] } = useASStoreOptions();

  // 선택된 매장의 장비 옵션
  const selectedStoreId = Form.useWatch('storeId', form);
  const { data: equipmentOptions = [] } = useASEquipmentOptions(selectedStoreId ?? null);

  // 매장 옵션은 mock/API에서 storeIds 기준으로 이미 필터됨

  // URL 파라미터에서 알림 정보 자동 채움
  useEffect(() => {
    const storeIdParam = searchParams.get('storeId');
    const equipmentIdParam = searchParams.get('equipmentId');
    const alertTypeParam = searchParams.get('alertType') as AlertType | null;

    if (storeIdParam) {
      const sid = Number(storeIdParam);
      form.setFieldsValue({ storeId: sid });

      if (equipmentIdParam) {
        form.setFieldsValue({ equipmentId: Number(equipmentIdParam) });
      }

      if (alertTypeParam && ALERT_TO_FAULT_MAP[alertTypeParam]) {
        form.setFieldsValue({ faultType: ALERT_TO_FAULT_MAP[alertTypeParam] });
      }
    }
  }, [searchParams, form]);

  // 매장 변경 시 장비 선택 초기화
  const handleStoreChange = () => {
    form.setFieldsValue({ equipmentId: undefined });
  };

  const handleSubmit = async (values: FormValues) => {
    try {
      const result = await createMutation.mutateAsync({
        storeId: values.storeId,
        equipmentId: values.equipmentId,
        faultType: values.faultType,
        description: values.description,
        preferredVisitDatetime: values.preferredVisitDatetime.toISOString(),
        urgency: values.urgency,
        contactName: values.contactName,
        contactPhone: values.contactPhone,
      });

      message.success(
        `A/S 접수가 완료되었습니다. (접수번호: ${result.data.requestId})`,
      );

      // 접수 완료 후 처리현황으로 이동
      navigate('/as-service/status');
    } catch {
      message.error('A/S 접수 중 오류가 발생했습니다.');
    }
  };

  if (createMutation.isSuccess) {
    const resultData = createMutation.data.data;
    return (
      <div className="as-form-card">
        <Result
          status="success"
          title="A/S 접수가 완료되었습니다"
          subTitle={
            <>
              <p>접수번호: <strong>{resultData.requestId}</strong></p>
              {resultData.assignedDealerName && (
                <p>담당 대리점: {resultData.assignedDealerName}</p>
              )}
              <Text type="secondary">
                원활한 서비스를 위해 접수일로부터 3일~7일 이내에 고객 방문 및 A/S 처리를 진행해 드립니다.
              </Text>
            </>
          }
          extra={[
            <Button
              key="list"
              type="primary"
              onClick={() => navigate('/as-service/status')}
            >
              처리현황 보기
            </Button>,
            <Button
              key="new"
              onClick={() => {
                createMutation.reset();
                form.resetFields();
              }}
            >
              추가 신청
            </Button>,
          ]}
        />
      </div>
    );
  }

  return (
    <div className="as-form-card">
      <Form<FormValues>
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          urgency: 'NORMAL',
          contactName: user?.name ?? '',
          contactPhone: user?.phone ?? '',
        }}
        style={{ maxWidth: 640 }}
      >
        <Form.Item
          name="storeId"
          label="매장 선택"
          rules={[{ required: true, message: '매장을 선택해 주세요' }]}
        >
          <Select
            placeholder="매장을 선택하세요"
            options={storeOptions.map((s) => ({
              value: s.storeId,
              label: s.storeName,
            }))}
            onChange={handleStoreChange}
          />
        </Form.Item>

        <Form.Item
          name="equipmentId"
          label="장비 선택"
          rules={[{ required: true, message: '장비를 선택해 주세요' }]}
        >
          <Select
            placeholder={selectedStoreId ? '장비를 선택하세요' : '매장을 먼저 선택하세요'}
            disabled={!selectedStoreId}
            options={equipmentOptions.map((e) => ({
              value: e.equipmentId,
              label: e.equipmentName,
            }))}
          />
        </Form.Item>

        <Form.Item
          name="faultType"
          label="고장 유형"
          rules={[{ required: true, message: '고장 유형을 선택해 주세요' }]}
        >
          <Select placeholder="고장 유형을 선택하세요" options={FAULT_TYPE_OPTIONS} />
        </Form.Item>

        <Form.Item
          name="description"
          label="증상 설명"
          rules={[{ required: true, message: '증상을 설명해 주세요' }]}
        >
          <TextArea
            rows={4}
            placeholder="장비의 이상 증상을 상세히 기술해 주세요"
            maxLength={500}
            showCount
          />
        </Form.Item>

        <Form.Item
          name="preferredVisitDatetime"
          label="방문 희망 일시"
          rules={[{ required: true, message: '방문 희망 일시를 선택해 주세요' }]}
        >
          <DatePicker
            showTime={{ format: 'HH:mm' }}
            format="YYYY-MM-DD HH:mm"
            placeholder="방문 희망 날짜와 시간을 선택하세요"
            style={{ width: '100%' }}
            disabledDate={(current) => current && current < dayjs().startOf('day')}
          />
        </Form.Item>

        <Form.Item
          name="urgency"
          label="긴급도"
          rules={[{ required: true, message: '긴급도를 선택해 주세요' }]}
        >
          <Radio.Group>
            <Radio value="HIGH">긴급</Radio>
            <Radio value="NORMAL">일반</Radio>
          </Radio.Group>
        </Form.Item>

        <Form.Item
          name="contactName"
          label="담당자명"
          rules={[{ required: true, message: '담당자명을 입력해 주세요' }]}
        >
          <Input placeholder="연락 가능한 담당자명" />
        </Form.Item>

        <Form.Item
          name="contactPhone"
          label="연락처"
          rules={[{ required: true, message: '연락처를 입력해 주세요' }]}
        >
          <Input placeholder="010-0000-0000" />
        </Form.Item>

        <Form.Item label="첨부파일 (선택)">
          <Upload
            beforeUpload={() => false}
            maxCount={5}
            accept="image/*,video/*"
            listType="picture"
          >
            <Button icon={<UploadOutlined />}>파일 선택 (최대 5개)</Button>
          </Upload>
        </Form.Item>

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            loading={createMutation.isPending}
            size="large"
          >
            A/S 신청
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
}
