import { useState, useRef } from 'react';
import {
  Card,
  Form,
  Input,
  DatePicker,
  Radio,
  Select,
  Button,
  Table,
  InputNumber,
  Space,
  Typography,
  Upload,
  Result,
  message,
} from 'antd';
import {
  ArrowLeftOutlined,
  PlusOutlined,
  DeleteOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useCreateASReport, useASDetail } from '../../api/as-service.api';
import { formatDateTime } from '../../utils/formatters';
import type {
  PartUsed,
  RepairType,
  ASRepairResult,
} from '../../types/as-service.types';

const { Title, Text } = Typography;
const { TextArea } = Input;

const REPAIR_TYPE_OPTIONS: { value: RepairType; label: string }[] = [
  { value: 'FILTER_REPLACE', label: '필터 교체' },
  { value: 'PART_REPLACE', label: '부품 교체' },
  { value: 'CLEANING', label: '청소' },
  { value: 'WIRING', label: '배선 작업' },
  { value: 'OTHER', label: '기타' },
];

const RESULT_OPTIONS: { value: ASRepairResult; label: string }[] = [
  { value: 'COMPLETED', label: '완료' },
  { value: 'PARTIAL', label: '부분완료' },
  { value: 'REVISIT_NEEDED', label: '재방문필요' },
];

interface ASReportFormPageProps {
  requestId: number;
  onBack: () => void;
  onSuccess?: () => void;
}

export default function ASReportFormPage({ requestId, onBack, onSuccess }: ASReportFormPageProps) {
  const [form] = Form.useForm();
  const { data: detailData } = useASDetail(requestId);
  const createReport = useCreateASReport();
  const [submitted, setSubmitted] = useState(false);

  const [parts, setParts] = useState<(PartUsed & { key: number })[]>([
    { key: 1, partName: '', unitPrice: 0, quantity: 1 },
  ]);
  /** 렌더마다 초기화되면 key가 중복되어 행이 일체화됨 → ref로 유지 */
  const nextPartKeyRef = useRef(2);

  const detail = detailData?.data;

  const addPart = () => {
    const key = nextPartKeyRef.current++;
    setParts((prev) => [
      ...prev,
      { key, partName: '', unitPrice: 0, quantity: 1 },
    ]);
  };

  const removePart = (key: number) => {
    setParts((prev) => {
      if (prev.length <= 1) {
        message.warning('최소 1개의 부품 항목이 필요합니다.');
        return prev;
      }
      return prev.filter((p) => p.key !== key);
    });
  };

  const updatePart = (key: number, field: keyof PartUsed, value: string | number) => {
    setParts((prev) =>
      prev.map((p) => (p.key === key ? { ...p, [field]: value } : p)),
    );
  };

  const totalPartsCost = parts.reduce((sum, p) => sum + p.unitPrice * p.quantity, 0);

  const handleSubmit = async (values: {
    visitDate: dayjs.Dayjs;
    repairType: RepairType;
    repairDescription: string;
    result: ASRepairResult;
    remarks?: string;
  }) => {
    // Validate parts
    const invalidParts = parts.filter((p) => !p.partName.trim());
    if (invalidParts.length > 0) {
      message.error('모든 교체 부품의 품명을 입력해주세요.');
      return;
    }

    try {
      await createReport.mutateAsync({
        requestId,
        data: {
          visitDate: values.visitDate.toISOString(),
          repairType: values.repairType,
          repairDescription: values.repairDescription,
          result: values.result,
          partsUsed: parts.map(({ partName, unitPrice, quantity }) => ({
            partName,
            unitPrice,
            quantity,
          })),
          totalPartsCost,
          remarks: values.remarks,
        },
      });
      setSubmitted(true);
    } catch {
      message.error('보고서 작성에 실패했습니다.');
    }
  };

  if (submitted) {
    return (
      <div className="as-form-card">
        <Result
          status="success"
          title="보고서가 제출되었습니다"
          subTitle={`A/S 요청 #${requestId}에 대한 완료 보고서가 성공적으로 제출되었습니다.`}
          extra={[
            <Button key="back" onClick={() => onSuccess?.()}>
              처리 현황으로
            </Button>,
          ]}
        />
      </div>
    );
  }

  const partsColumns = [
    {
      title: '품명',
      dataIndex: 'partName',
      key: 'partName',
      render: (_: unknown, record: PartUsed & { key: number }) => (
        <Input
          placeholder="부품명 입력"
          value={record.partName}
          onChange={(e) => updatePart(record.key, 'partName', e.target.value)}
        />
      ),
    },
    {
      title: '가격 (원)',
      dataIndex: 'unitPrice',
      key: 'unitPrice',
      width: 160,
      render: (_: unknown, record: PartUsed & { key: number }) => (
        <InputNumber
          min={0}
          step={1000}
          value={record.unitPrice}
          onChange={(val) => updatePart(record.key, 'unitPrice', val ?? 0)}
          formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
          parser={(value) => Number(value?.replace(/,/g, '') ?? 0)}
          style={{ width: '100%' }}
        />
      ),
    },
    {
      title: '수량',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 100,
      render: (_: unknown, record: PartUsed & { key: number }) => (
        <InputNumber
          min={1}
          max={99}
          value={record.quantity}
          onChange={(val) => updatePart(record.key, 'quantity', val ?? 1)}
          style={{ width: '100%' }}
        />
      ),
    },
    {
      title: '소계',
      key: 'subtotal',
      width: 140,
      render: (_: unknown, record: PartUsed & { key: number }) =>
        (record.unitPrice * record.quantity).toLocaleString() + '원',
    },
    {
      title: '',
      key: 'action',
      width: 60,
      render: (_: unknown, record: PartUsed & { key: number }) => (
        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          onClick={() => removePart(record.key)}
        />
      ),
    },
  ];

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={onBack}>
          돌아가기
        </Button>
      </Space>

      {/* A/S 신청 정보 요약 */}
      {detail && (
        <div className="as-detail-card">
          <Space split={<span style={{ color: '#d9d9d9' }}>|</span>}>
            <Text>
              <Text strong>매장:</Text> {detail.store.storeName}
            </Text>
            <Text>
              <Text strong>장비:</Text> {detail.equipment.equipmentName}
            </Text>
            <Text>
              <Text strong>접수일:</Text> {formatDateTime(detail.createdAt)}
            </Text>
          </Space>
        </div>
      )}

      <div className="as-form-card">
        <div className="as-detail-card-title">A/S 완료 보고서 작성</div>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            visitDate: dayjs(),
            result: 'COMPLETED',
          }}
        >
          <Form.Item
            name="visitDate"
            label="방문 일시"
            rules={[{ required: true, message: '방문 일시를 선택해주세요' }]}
          >
            <DatePicker
              showTime
              format="YYYY-MM-DD HH:mm"
              style={{ width: 280 }}
              disabledDate={(current) => current && current > dayjs().endOf('day')}
            />
          </Form.Item>

          <Form.Item
            name="repairType"
            label="수리 유형"
            rules={[{ required: true, message: '수리 유형을 선택해주세요' }]}
          >
            <Select
              placeholder="수리 유형 선택"
              options={REPAIR_TYPE_OPTIONS}
              style={{ width: 280 }}
            />
          </Form.Item>

          <Form.Item
            name="repairDescription"
            label="처리 내용"
            rules={[{ required: true, message: '처리 내용을 입력해주세요' }]}
          >
            <TextArea
              placeholder="상세 처리 내역을 입력하세요"
              rows={4}
              maxLength={1000}
              showCount
            />
          </Form.Item>

          <Form.Item
            name="result"
            label="처리 결과"
            rules={[{ required: true, message: '처리 결과를 선택해주세요' }]}
          >
            <Radio.Group options={RESULT_OPTIONS} />
          </Form.Item>

          {/* 교체 부품 동적 테이블 */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <Text strong>교체 부품 <Text type="danger">*</Text></Text>
              <Button
                type="dashed"
                icon={<PlusOutlined />}
                onClick={addPart}
                size="small"
              >
                부품 추가
              </Button>
            </div>
            <Table
              className="as-table"
              rowKey="key"
              columns={partsColumns}
              dataSource={parts}
              pagination={false}
              size="small"
              summary={() => (
                <Table.Summary fixed>
                  <Table.Summary.Row>
                    <Table.Summary.Cell index={0} colSpan={3}>
                      <Text strong>합계</Text>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={1} colSpan={2}>
                      <Text strong type="danger">
                        {totalPartsCost.toLocaleString()}원
                      </Text>
                    </Table.Summary.Cell>
                  </Table.Summary.Row>
                </Table.Summary>
              )}
            />
          </div>

          {/* 첨부 사진 */}
          <Form.Item name="attachments" label="첨부 사진 (처리 전/후)">
            <Upload
              listType="picture-card"
              maxCount={10}
              accept="image/*"
              beforeUpload={() => false}
            >
              <div>
                <UploadOutlined />
                <div style={{ marginTop: 8 }}>사진 업로드</div>
              </div>
            </Upload>
          </Form.Item>

          <Form.Item name="remarks" label="비고">
            <TextArea
              placeholder="추가 메모 사항을 입력하세요"
              rows={3}
              maxLength={500}
            />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button onClick={onBack}>취소</Button>
              <Button type="primary" htmlType="submit" loading={createReport.isPending}>
                보고서 제출
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </div>
    </div>
  );
}
