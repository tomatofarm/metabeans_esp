import {
  Card,
  Tag,
  Badge,
  Space,
  Button,
  Typography,
  Tooltip,
  Spin,
  Empty,
  Popconfirm,
  message,
} from 'antd';
import {
  EditOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ApiOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useUiStore } from '../../stores/uiStore';
import { useEquipmentDetail, useDeleteEquipment } from '../../api/equipment.api';
import { useFeaturePermission } from '../../hooks/useFeaturePermission';
import StatusTag from '../../components/common/StatusTag';
import StatusBadge from '../../components/common/StatusBadge';
import { formatDateTime, formatDate, formatRelativeTime } from '../../utils/formatters';
import type { StatusLevel } from '../../utils/constants';

const { Title } = Typography;

// 장비 상태 → StatusLevel 매핑
function equipmentStatusToLevel(status: string): StatusLevel {
  switch (status) {
    case 'NORMAL':
      return 'green';
    case 'INSPECTION':
    case 'CLEANING':
      return 'yellow';
    case 'INACTIVE':
      return 'red';
    default:
      return 'green';
  }
}

const EQUIPMENT_STATUS_LABELS: Record<string, string> = {
  NORMAL: '정상',
  INSPECTION: '점검',
  CLEANING: '청소',
  INACTIVE: '비활성',
};

// Gateway status_flags 비트 해석
const GATEWAY_FLAG_LABELS = [
  'SEN55 (PM/온습도/VOC/NOx)',
  'SCD40 (CO2)',
  'O3 센서',
  'CO 센서',
  'HCHO 센서',
  '컨트롤러 연결',
  '페어링 모드',
];

function StatusFlagsDisplay({ flags, labels }: { flags: number; labels: string[] }) {
  return (
    <Space size={4} wrap>
      {labels.map((label, bit) => {
        const isOk = (flags >> bit) & 1;
        return (
          <Tooltip key={bit} title={label}>
            <Tag
              icon={isOk ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
              color={isOk ? 'success' : 'error'}
              style={{ marginBottom: 2 }}
            >
              {label}
            </Tag>
          </Tooltip>
        );
      })}
    </Space>
  );
}

interface ControllerRow {
  controllerId: number;
  ctrlDeviceId: string;
  connectionStatus: string;
  statusFlags: number;
  lastSeenAt?: string;
}

export default function EquipmentInfoPage() {
  const navigate = useNavigate();
  const selectedEquipmentId = useUiStore((s) => s.selectedEquipmentId);
  const selectedControllerId = useUiStore((s) => s.selectedControllerId);
  const { isAllowed: canEditEquip, isLoading: editPermLoading } = useFeaturePermission('equipment.edit');
  const { isAllowed: canDeleteEquip, isLoading: deletePermLoading } = useFeaturePermission('equipment.delete');
  const showEditActions = editPermLoading || canEditEquip;
  const showDeleteAction = deletePermLoading || canDeleteEquip;

  const { data, isLoading } = useEquipmentDetail(selectedEquipmentId);
  const deleteMutation = useDeleteEquipment();

  const equipment = data?.data;

  const handleDelete = () => {
    if (!selectedEquipmentId) return;
    deleteMutation.mutate(selectedEquipmentId, {
      onSuccess: () => {
        message.success('장비가 삭제되었습니다.');
        navigate('/equipment');
      },
      onError: () => {
        message.error('장비 삭제에 실패했습니다.');
      },
    });
  };

  if (!selectedEquipmentId) {
    return (
      <Card>
        <Empty description="좌측 트리에서 장비를 선택하세요." />
      </Card>
    );
  }

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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>
          장비 정보
        </Title>
        {(showEditActions || showDeleteAction) && (
          <Space>
            {showEditActions && (
              <Button
                type="primary"
                icon={<EditOutlined />}
                onClick={() => navigate(`/equipment/edit/${equipment.equipmentId}`)}
              >
                수정
              </Button>
            )}
            {showDeleteAction && (
              <Popconfirm
                title="장비 삭제"
                description="이 장비를 삭제하시겠습니까?"
                onConfirm={handleDelete}
                okText="삭제"
                cancelText="취소"
                okButtonProps={{ danger: true }}
              >
                <Button danger icon={<DeleteOutlined />} loading={deleteMutation.isPending}>
                  삭제
                </Button>
              </Popconfirm>
            )}
          </Space>
        )}
      </div>

      {/* 장비 기본 정보 */}
      <div className="equip-info-card">
        <div className="equip-info-card-title">
          <EditOutlined />
          장비 기본 정보
        </div>
        <div className="equip-info-grid">
          <div className="equip-info-item">
            <span className="equip-info-item-label">장비명</span>
            <div className="equip-info-item-value">{equipment.equipmentName}</div>
          </div>
          <div className="equip-info-item">
            <span className="equip-info-item-label">장비 ID</span>
            <div className="equip-info-item-value">{equipment.mqttEquipmentId}</div>
          </div>
          <div className="equip-info-item">
            <span className="equip-info-item-label">시리얼 번호</span>
            <div className="equip-info-item-value">{equipment.equipmentSerial}</div>
          </div>
          <div className="equip-info-item">
            <span className="equip-info-item-label">모델명</span>
            <div className="equip-info-item-value">{equipment.model.modelName} ({equipment.model.manufacturer})</div>
          </div>
          <div className="equip-info-item">
            <span className="equip-info-item-label">셀 타입</span>
            <div className="equip-info-item-value">{equipment.cellType ?? '-'}</div>
          </div>
          <div className="equip-info-item">
            <span className="equip-info-item-label">장비 상태</span>
            <div className="equip-info-item-value">
              <StatusTag
                level={equipmentStatusToLevel(equipment.status)}
                label={EQUIPMENT_STATUS_LABELS[equipment.status]}
              />
            </div>
          </div>
          <div className="equip-info-item">
            <span className="equip-info-item-label">연결 상태</span>
            <div className="equip-info-item-value">
              <Badge
                status={equipment.connectionStatus === 'ONLINE' ? 'success' : 'error'}
                text={equipment.connectionStatus === 'ONLINE' ? '연결' : '끊김'}
              />
            </div>
          </div>
          <div className="equip-info-item">
            <span className="equip-info-item-label">마지막 통신</span>
            <div className="equip-info-item-value">{equipment.lastSeenAt ? formatDateTime(equipment.lastSeenAt) : '-'}</div>
          </div>
          <div className="equip-info-item">
            <span className="equip-info-item-label">설치 위치</span>
            <div className="equip-info-item-value">{equipment.store.storeName} / {equipment.floor.floorName} ({equipment.floor.floorCode})</div>
          </div>
          <div className="equip-info-item">
            <span className="equip-info-item-label">설치일</span>
            <div className="equip-info-item-value">{formatDate(equipment.purchaseDate)}</div>
          </div>
          <div className="equip-info-item">
            <span className="equip-info-item-label">보증 만료일</span>
            <div className="equip-info-item-value">{formatDate(equipment.warrantyEndDate)}</div>
          </div>
          <div className="equip-info-item">
            <span className="equip-info-item-label">담당 대리점</span>
            <div className="equip-info-item-value">{equipment.dealer?.dealerName ?? '-'}</div>
          </div>
          <div className="equip-info-item">
            <span className="equip-info-item-label">등록자</span>
            <div className="equip-info-item-value">{equipment.registeredBy.name}</div>
          </div>
          <div className="equip-info-item">
            <span className="equip-info-item-label">등록일</span>
            <div className="equip-info-item-value">{formatDateTime(equipment.createdAt)}</div>
          </div>
        </div>
      </div>

      {/* 하위 컨트롤러(파워팩) 목록 */}
      <div className="equip-info-card">
        <div className="equip-info-card-title">
          <CheckCircleOutlined />
          컨트롤러 (파워팩) {selectedControllerId ? '정보' : '목록'}
          <Tag style={{ marginLeft: 'auto' }}>{equipment.controllers.length} / 4대</Tag>
        </div>
        {(() => {
          const filteredControllers = selectedControllerId
            ? equipment.controllers.filter((c: ControllerRow) => c.controllerId === selectedControllerId)
            : equipment.controllers;
          return filteredControllers.length > 0 ? (
          filteredControllers.map((ctrl: ControllerRow, index: number) => (
            <div className="controller-row" key={ctrl.controllerId}>
              <span className="controller-num">{index + 1}</span>
              <span className="controller-name">{ctrl.ctrlDeviceId}</span>
              {ctrl.connectionStatus === 'ONLINE' ? (
                <StatusBadge status="success" label="연결" />
              ) : (
                <StatusBadge status="danger" label="끊김" />
              )}
              <Tooltip title={ctrl.lastSeenAt ? formatDateTime(ctrl.lastSeenAt) : '없음'}>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-mid)' }}>
                  {ctrl.lastSeenAt ? formatRelativeTime(ctrl.lastSeenAt) : '-'}
                </span>
              </Tooltip>
            </div>
          ))
        ) : (
          <Empty description="등록된 컨트롤러가 없습니다." />
        );
        })()}
      </div>

      {/* 게이트웨이 정보 */}
      <div className="equip-info-card">
        <div className="equip-info-card-title">
          <ApiOutlined />
          게이트웨이 정보
        </div>
        <div className="equip-info-grid">
          <div className="equip-info-item">
            <span className="equip-info-item-label">게이트웨이 ID</span>
            <div className="equip-info-item-value">{equipment.gateway.gwDeviceId}</div>
          </div>
          <div className="equip-info-item">
            <span className="equip-info-item-label">연결 상태</span>
            <div className="equip-info-item-value">
              <Badge
                status={equipment.gateway.connectionStatus === 'ONLINE' ? 'success' : 'error'}
                text={equipment.gateway.connectionStatus === 'ONLINE' ? '연결' : '끊김'}
              />
            </div>
          </div>
          <div className="equip-info-item">
            <span className="equip-info-item-label">연결 컨트롤러 수</span>
            <div className="equip-info-item-value">{equipment.gateway.controllerCount}대</div>
          </div>
          <div className="equip-info-item" style={{ gridColumn: '1 / -1' }}>
            <span className="equip-info-item-label">IAQ 센서 상태</span>
            <div className="equip-info-item-value">
              <StatusFlagsDisplay
                flags={equipment.gateway.statusFlags}
                labels={GATEWAY_FLAG_LABELS}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
