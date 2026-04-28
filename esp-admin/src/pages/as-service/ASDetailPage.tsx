import { useState } from 'react';
import {
  Card,
  Descriptions,
  Button,
  Space,
  Select,
  DatePicker,
  Input,
  Alert,
  Divider,
  Typography,
  Modal,
  message,
  Image,
  Spin,
} from 'antd';
import {
  ArrowLeftOutlined,
  FileTextOutlined,
  EditOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import {
  useASDetail,
  useUpdateASStatus,
  useAssignDealer,
  useDealerOptions,
} from '../../api/as-service.api';
import { formatDateTime, formatDateCompact } from '../../utils/formatters';
import { AS_STATUS_LABELS, FAULT_TYPE_LABELS } from '../../utils/constants';
import { useAuthStore } from '../../stores/authStore';
import StatusBadge from '../../components/common/StatusBadge';
import type { BadgeStatus } from '../../components/common/StatusBadge';
import type { ASStatus } from '../../types/as-service.types';

const { Title, Text } = Typography;
const { TextArea } = Input;

const URGENCY_LABELS: Record<string, string> = {
  HIGH: '긴급',
  NORMAL: '일반',
};

const AS_STATUS_BADGE: Record<string, BadgeStatus> = {
  PENDING: 'default', ACCEPTED: 'info', ASSIGNED: 'warning', VISIT_SCHEDULED: 'info',
  IN_PROGRESS: 'warning', COMPLETED: 'success', CLOSED: 'default', CANCELLED: 'default',
};

// 상태 전이 규칙(보고서 제출·종결은 `POST .../report` 로만)
const STATUS_TRANSITIONS: Record<string, Record<string, ASStatus[]>> = {
  ADMIN: {
    PENDING: ['ACCEPTED'],
    ACCEPTED: ['ASSIGNED'],
    ASSIGNED: ['IN_PROGRESS'],
    IN_PROGRESS: ['COMPLETED'],
  },
  DEALER: {
    PENDING: ['ACCEPTED'],
    ACCEPTED: ['ASSIGNED'],
    ASSIGNED: ['IN_PROGRESS'],
    IN_PROGRESS: ['COMPLETED'],
  },
};

interface ASDetailPageProps {
  requestId: number;
  onBack: () => void;
  onViewReport?: (requestId: number) => void;
  onWriteReport?: (requestId: number) => void;
}

export default function ASDetailPage({
  requestId,
  onBack,
  onViewReport,
  onWriteReport,
}: ASDetailPageProps) {
  const user = useAuthStore((s) => s.user);
  const role = user?.role ?? 'OWNER';

  const { data, isLoading } = useASDetail(requestId);
  const { data: dealerData } = useDealerOptions();
  const updateStatus = useUpdateASStatus();
  const assignDealer = useAssignDealer();

  const [selectedDealer, setSelectedDealer] = useState<number | undefined>();
  const [visitDate, setVisitDate] = useState<dayjs.Dayjs | null>(null);
  const [memo, setMemo] = useState('');

  const detail = data?.data;
  const dealerOptions = dealerData ?? [];

  if (isLoading) {
    return (
      <Card>
        <Spin />
      </Card>
    );
  }

  if (!detail) {
    return (
      <Card>
        <Text type="secondary">A/S 상세 정보를 찾을 수 없습니다.</Text>
        <br />
        <Button icon={<ArrowLeftOutlined />} onClick={onBack} style={{ marginTop: 16 }}>
          목록으로
        </Button>
      </Card>
    );
  }

  const allowedTransitions = STATUS_TRANSITIONS[role]?.[detail.status] ?? [];

  const handleStatusChange = (newStatus: ASStatus) => {
    Modal.confirm({
      className: 'as-modal',
      title: '상태 변경',
      content: `상태를 "${AS_STATUS_LABELS[newStatus]}"(으)로 변경하시겠습니까?`,
      onOk: async () => {
        await updateStatus.mutateAsync({
          requestId,
          update: {
            status: newStatus,
            memo: memo || undefined,
            visitScheduledDatetime: visitDate?.toISOString(),
            dealerId: selectedDealer,
          },
        });
        message.success('상태가 변경되었습니다.');
        setMemo('');
      },
    });
  };

  const handleAssignDealer = () => {
    if (!selectedDealer) {
      message.warning('대리점을 선택해주세요.');
      return;
    }
    Modal.confirm({
      className: 'as-modal',
      title: '대리점 배정',
      content: '선택한 대리점을 배정하시겠습니까?',
      onOk: async () => {
        await assignDealer.mutateAsync({ requestId, dealerId: selectedDealer });
        message.success('대리점이 배정되었습니다.');
      },
    });
  };

  const dateStr = formatDateCompact(detail.createdAt);
  const requestNumber = `AS-${dateStr}-${String(detail.requestId).slice(-3).padStart(3, '0')}`;

  const isProcessingLocked = detail.status === 'CLOSED' || detail.status === 'CANCELLED';
  const canWriteReport = detail.status === 'COMPLETED' && (role === 'DEALER' || role === 'ADMIN');

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={onBack}>
          목록으로
        </Button>
      </Space>

      {/* A/S 신청 정보 */}
      <div className="as-detail-card">
        <div className="as-detail-card-title">A/S 신청 정보</div>
        <Descriptions column={{ xs: 1, sm: 2 }} bordered size="small">
          <Descriptions.Item label="접수번호">{requestNumber}</Descriptions.Item>
          <Descriptions.Item label="상태">
            <StatusBadge status={AS_STATUS_BADGE[detail.status] ?? 'default'} label={AS_STATUS_LABELS[detail.status] ?? detail.status} />
          </Descriptions.Item>
          <Descriptions.Item label="매장명">{detail.store.storeName}</Descriptions.Item>
          <Descriptions.Item label="장비명">{detail.equipment.equipmentName}</Descriptions.Item>
          <Descriptions.Item label="고장 유형">
            {FAULT_TYPE_LABELS[detail.faultType] ?? detail.faultType}
          </Descriptions.Item>
          <Descriptions.Item label="긴급도">
            <StatusBadge status={detail.urgency === 'HIGH' ? 'danger' : 'info'} label={URGENCY_LABELS[detail.urgency] ?? detail.urgency} />
          </Descriptions.Item>
          <Descriptions.Item label="증상" span={2}>
            {detail.description}
          </Descriptions.Item>
          <Descriptions.Item label="담당자명">{detail.contactName}</Descriptions.Item>
          <Descriptions.Item label="연락처">{detail.contactPhone}</Descriptions.Item>
        </Descriptions>

        {/* 첨부파일 */}
        {detail.attachments.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <Text strong>첨부파일</Text>
            <div style={{ marginTop: 8 }}>
              <Image.PreviewGroup>
                <Space>
                  {detail.attachments.map((att) => (
                    <Image
                      key={att.attachmentId}
                      width={100}
                      height={100}
                      style={{ objectFit: 'cover', borderRadius: 4 }}
                      src={att.filePath}
                      fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAABmJLR0QA/wD/AP+gvaeTAAAAb0lEQVR4nO3BAQ0AAADCoPd/aLMAQIgBAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAGBuEfAAASEaU3QAAAAASUVORK5CYII="
                      alt={att.fileName}
                    />
                  ))}
                </Space>
              </Image.PreviewGroup>
            </div>
          </div>
        )}
      </div>

      {/* 방문 희망 일시 */}
      {detail.preferredVisitDatetime && (
        <div className="as-detail-card">
          <Title level={5} style={{ marginTop: 0 }}>방문 희망 일시</Title>
          <Text strong style={{ fontSize: 16 }}>
            {formatDateTime(detail.preferredVisitDatetime)}
          </Text>
          <Alert
            message="본 요청서에 기재된 고객 방문 희망 일시를 준수하여 방문해 주시기 바랍니다."
            type="info"
            showIcon
            style={{ marginTop: 12 }}
          />
        </div>
      )}

      {/* 접수 일시 정보 */}
      <div className="as-detail-card">
        <Title level={5} style={{ marginTop: 0 }}>접수 일시</Title>
        <Text strong style={{ fontSize: 16 }}>
          {formatDateTime(detail.createdAt)}
        </Text>
        <Alert
          message="원활한 서비스를 위해 접수일로부터 3일~7일 이내에 고객 방문 및 AS처리를 진행해 주시기 바랍니다."
          type="warning"
          showIcon
          style={{ marginTop: 12 }}
        />
      </div>

      {/* 종결(보고서 있음): 처리 정보 없이 보고서 조회만 (ADMIN/DEALER) */}
      {(role === 'ADMIN' || role === 'DEALER') && isProcessingLocked && detail.status === 'CLOSED' && detail.report && (
        <div className="as-detail-card">
          <div className="as-detail-card-title">완료 보고서</div>
          <Button type="primary" icon={<FileTextOutlined />} onClick={() => onViewReport?.(requestId)}>
            보고서 조회
          </Button>
        </div>
      )}

      {/* 처리 정보 (진행 중 — ADMIN/DEALER) */}
      {(role === 'ADMIN' || role === 'DEALER') && !isProcessingLocked && (
        <div className="as-detail-card">
          <div className="as-detail-card-title">처리 정보</div>
          <div style={{ marginBottom: 16 }}>
            <Text strong style={{ display: 'block', marginBottom: 8 }}>
              담당 대리점 배정
            </Text>
            <Space>
              <Select
                placeholder="대리점 선택"
                style={{ width: 200 }}
                value={selectedDealer ?? detail.assignedDealer?.dealerId}
                onChange={setSelectedDealer}
                options={dealerOptions.map((d) => ({
                  value: d.dealerId,
                  label: d.dealerName,
                }))}
              />
              <Button
                type="primary"
                onClick={handleAssignDealer}
                loading={assignDealer.isPending}
                disabled={detail.status === 'COMPLETED' || detail.status === 'CLOSED'}
              >
                배정
              </Button>
            </Space>
          </div>

          <div style={{ marginBottom: 16 }}>
            <Text strong style={{ display: 'block', marginBottom: 8 }}>
              방문 예정 일시
            </Text>
            <DatePicker
              showTime
              format="YYYY-MM-DD HH:mm"
              value={visitDate ?? (detail.visitScheduledDatetime ? dayjs(detail.visitScheduledDatetime) : null)}
              onChange={setVisitDate}
              disabledDate={(current) => current && current < dayjs().startOf('day')}
              style={{ width: 250 }}
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <Text strong style={{ display: 'block', marginBottom: 8 }}>
              처리 메모
            </Text>
            <TextArea
              placeholder="처리 관련 메모를 입력하세요"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              rows={3}
              maxLength={500}
            />
          </div>

          {allowedTransitions.length > 0 && (
            <div>
              <Divider />
              <Text strong style={{ display: 'block', marginBottom: 12 }}>
                상태 변경
              </Text>
              <Space wrap>
                {allowedTransitions.map((nextStatus) => (
                  <Button
                    key={nextStatus}
                    type="primary"
                    onClick={() => handleStatusChange(nextStatus)}
                    loading={updateStatus.isPending}
                  >
                    {AS_STATUS_LABELS[nextStatus]}(으)로 변경
                  </Button>
                ))}
              </Space>
            </div>
          )}

          {canWriteReport && !detail.report && (
            <>
              <Divider />
              <Button
                type="primary"
                icon={<EditOutlined />}
                onClick={() => onWriteReport?.(requestId)}
              >
                완료 보고서 작성
              </Button>
            </>
          )}
          {detail.report && (
            <>
              <Divider />
              <Button type="primary" icon={<FileTextOutlined />} onClick={() => onViewReport?.(requestId)}>
                보고서 조회
              </Button>
            </>
          )}
        </div>
      )}

      {/* HQ/OWNER: 읽기 전용 보고서 링크 */}
      {(role === 'HQ' || role === 'OWNER') && detail.report && (
        <div className="as-detail-card">
          <Button
            type="primary"
            icon={<FileTextOutlined />}
            onClick={() => onViewReport?.(requestId)}
          >
            완료 보고서 조회
          </Button>
        </div>
      )}

      {detail.memo && (
        <div className="as-detail-card">
          <div className="as-detail-card-title">처리 메모</div>
          <Text>{detail.memo}</Text>
        </div>
      )}
    </div>
  );
}
