import { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Modal,
  Input,
  Select,
  Form,
  message,
  Spin,
  Typography,
  Checkbox,
  Descriptions,
  Divider,
  Popconfirm,
} from 'antd';
import { EditOutlined, SearchOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { formatDateTimeShort, formatDate } from '../../utils/formatters';
import {
  useSystemUsers,
  useSystemUserDetail,
  useUpdateSystemUser,
  useSaveUserPermissionOverride,
  useDeleteUserPermissionOverride,
} from '../../api/system.api';
import type {
  SystemUserItem,
  UserListParams,
  FeatureCode,
} from '../../types/system.types';
import { FEATURE_CODE_LIST } from '../../types/system.types';
import type { UserRole, AccountStatus } from '../../types/auth.types';
import { ROLE_CONFIG, PRIMARY_COLOR } from '../../utils/constants';
import StatusBadge from '../../components/common/StatusBadge';
import type { BadgeStatus } from '../../components/common/StatusBadge';

const { Text } = Typography;

const ACCOUNT_STATUS_CONFIG: Record<
  AccountStatus,
  { label: string; status: BadgeStatus }
> = {
  PENDING: { label: '대기', status: 'warning' },
  ACTIVE: { label: '활성', status: 'success' },
  SUSPENDED: { label: '정지', status: 'danger' },
  DELETED: { label: '탈퇴', status: 'default' },
};

export default function SystemUserTab() {
  const [filters, setFilters] = useState<UserListParams>({});
  const [editUserId, setEditUserId] = useState<number | null>(null);
  const [editForm] = Form.useForm();

  const { data: usersResponse, isLoading } = useSystemUsers(filters);
  const { data: detailResponse, isLoading: detailLoading } =
    useSystemUserDetail(editUserId);
  const updateMutation = useUpdateSystemUser();
  const saveOverrideMutation = useSaveUserPermissionOverride();
  const deleteOverrideMutation = useDeleteUserPermissionOverride();

  const users = usersResponse?.data ?? [];
  const userDetail = detailResponse?.data ?? null;

  // Form 값을 userDetail이 변경될 때마다 동기화
  useEffect(() => {
    if (userDetail) {
      editForm.setFieldsValue({
        name: userDetail.name,
        role: userDetail.role,
        accountStatus: userDetail.accountStatus,
        email: userDetail.email,
        phone: userDetail.phone,
      });
    }
  }, [userDetail, editForm]);

  const handleSearch = (value: string) => {
    setFilters((prev) => ({ ...prev, search: value || undefined }));
  };

  const handleEditOpen = (userId: number) => {
    setEditUserId(userId);
  };

  const handleEditClose = () => {
    setEditUserId(null);
    editForm.resetFields();
  };

  const handleEditSave = async () => {
    if (!editUserId || !userDetail) return;
    try {
      const values = await editForm.validateFields();
      await updateMutation.mutateAsync({
        userId: editUserId,
        data: {
          role: values.role,
          accountStatus: values.accountStatus,
          name: values.name,
          email: values.email,
          phone: values.phone,
        },
      });
      message.success('사용자 정보가 수정되었습니다.');
      handleEditClose();
    } catch {
      message.error('사용자 정보 수정에 실패했습니다.');
    }
  };

  const handleOverrideToggle = async (
    featureCode: FeatureCode,
    currentOverride: boolean | null,
  ) => {
    if (!editUserId) return;
    try {
      if (currentOverride !== null) {
        // 오버라이드 삭제 (기본 역할 권한으로 복원)
        await deleteOverrideMutation.mutateAsync({
          userId: editUserId,
          featureCode,
        });
        message.success('권한 오버라이드가 삭제되었습니다.');
      } else {
        // 새 오버라이드 생성 (역할 기본 반대값으로)
        await saveOverrideMutation.mutateAsync({
          userId: editUserId,
          featureCode,
          isAllowed: true,
          reason: '관리자에 의한 권한 변경',
        });
        message.success('권한 오버라이드가 추가되었습니다.');
      }
    } catch {
      message.error('권한 변경에 실패했습니다.');
    }
  };

  const columns: ColumnsType<SystemUserItem> = [
    {
      title: '이름',
      dataIndex: 'name',
      key: 'name',
      width: 100,
    },
    {
      title: '아이디',
      dataIndex: 'loginId',
      key: 'loginId',
      width: 120,
    },
    {
      title: '역할',
      dataIndex: 'role',
      key: 'role',
      width: 110,
      render: (role: UserRole) => (
        <span className={`role-pill ${role}`}>
          {ROLE_CONFIG[role]?.label ?? role}
        </span>
      ),
    },
    {
      title: '이메일',
      dataIndex: 'email',
      key: 'email',
      width: 200,
      ellipsis: true,
      render: (text: string) => text || '-',
    },
    {
      title: '상태',
      dataIndex: 'accountStatus',
      key: 'accountStatus',
      width: 80,
      render: (status: AccountStatus) => (
        <StatusBadge status={ACCOUNT_STATUS_CONFIG[status]?.status ?? 'default'} label={ACCOUNT_STATUS_CONFIG[status]?.label ?? status} />
      ),
    },
    {
      title: '마지막 로그인',
      dataIndex: 'lastLoginAt',
      key: 'lastLoginAt',
      width: 160,
      render: (text: string) => formatDateTimeShort(text),
    },
    {
      title: '가입일',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      render: (text: string) => formatDate(text),
    },
    {
      title: '관리',
      key: 'action',
      width: 80,
      fixed: 'right',
      render: (_, record) => (
        <Button
          type="link"
          icon={<EditOutlined />}
          onClick={() => handleEditOpen(record.userId)}
        >
          편집
        </Button>
      ),
    },
  ];

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: 48 }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div>
      <div className="system-filter">
        <Select
          placeholder="역할 필터"
          allowClear
          style={{ width: 140 }}
          onChange={(value) => setFilters((prev) => ({ ...prev, role: value }))}
          options={[
            { value: 'ADMIN', label: '시스템 관리자' },
            { value: 'DEALER', label: '대리점' },
            { value: 'HQ', label: '매장 본사' },
            { value: 'OWNER', label: '매장 점주' },
          ]}
        />
        <Select
          placeholder="상태 필터"
          allowClear
          style={{ width: 120 }}
          onChange={(value) =>
            setFilters((prev) => ({ ...prev, accountStatus: value }))
          }
          options={[
            { value: 'ACTIVE', label: '활성' },
            { value: 'SUSPENDED', label: '정지' },
            { value: 'PENDING', label: '대기' },
            { value: 'DELETED', label: '탈퇴' },
          ]}
        />
        <Input.Search
          placeholder="이름 또는 아이디 검색"
          allowClear
          style={{ width: 240 }}
          enterButton={<SearchOutlined />}
          onSearch={handleSearch}
        />
      </div>

      <div className="system-table-wrap">
        <Table
          className="system-table"
          columns={columns}
          dataSource={users}
          rowKey="userId"
          size="middle"
          scroll={{ x: 1000 }}
          pagination={{
            total: usersResponse?.meta?.totalCount,
            pageSize: 20,
            showSizeChanger: false,
            showTotal: (total) => `총 ${total}명`,
          }}
        />
      </div>

      {/* 사용자 상세 편집 모달 */}
      <Modal
        className="system-modal"
        title="사용자 정보 편집"
        open={editUserId !== null}
        onCancel={handleEditClose}
        width={700}
        footer={[
          <Button key="cancel" onClick={handleEditClose}>
            취소
          </Button>,
          <Button
            key="save"
            type="primary"
            onClick={handleEditSave}
            loading={updateMutation.isPending}
          >
            저장
          </Button>,
        ]}
      >
        {detailLoading ? (
          <div style={{ textAlign: 'center', padding: 24 }}>
            <Spin />
          </div>
        ) : userDetail ? (
          <div>
            <Descriptions bordered size="small" column={2} style={{ marginBottom: 16 }}>
              <Descriptions.Item label="아이디">{userDetail.loginId}</Descriptions.Item>
              <Descriptions.Item label="가입일">
                {formatDate(userDetail.createdAt)}
              </Descriptions.Item>
              {userDetail.businessName && (
                <Descriptions.Item label="상호명">
                  {userDetail.businessName}
                </Descriptions.Item>
              )}
              {userDetail.businessNumber && (
                <Descriptions.Item label="사업자등록번호">
                  {userDetail.businessNumber}
                </Descriptions.Item>
              )}
            </Descriptions>

            <Form
              form={editForm}
              layout="vertical"
            >
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Form.Item label="이름" name="name" rules={[{ required: true }]}>
                  <Input />
                </Form.Item>
                <Form.Item label="역할" name="role" rules={[{ required: true }]}>
                  <Select
                    options={[
                      { value: 'ADMIN', label: '시스템 관리자' },
                      { value: 'DEALER', label: '대리점' },
                      { value: 'HQ', label: '매장 본사' },
                      { value: 'OWNER', label: '매장 점주' },
                    ]}
                  />
                </Form.Item>
                <Form.Item label="이메일" name="email">
                  <Input />
                </Form.Item>
                <Form.Item label="전화번호" name="phone" rules={[{ required: true }]}>
                  <Input />
                </Form.Item>
                <Form.Item label="계정 상태" name="accountStatus" rules={[{ required: true }]}>
                  <Select
                    options={[
                      { value: 'ACTIVE', label: '활성' },
                      { value: 'SUSPENDED', label: '정지' },
                      { value: 'DELETED', label: '탈퇴' },
                    ]}
                  />
                </Form.Item>
              </div>
            </Form>

            <Divider orientation="left">개별 권한 오버라이드</Divider>
            <Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>
              역할 기본 권한과 다른 권한을 부여할 수 있습니다. 체크 표시된 항목은 오버라이드가
              적용된 항목입니다.
            </Text>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '4px 16px',
                maxHeight: 300,
                overflow: 'auto',
              }}
            >
              {FEATURE_CODE_LIST.map((info) => {
                const override = userDetail.overrides.find(
                  (o) => o.featureCode === info.code,
                );
                return (
                  <Popconfirm
                    key={info.code}
                    title={
                      override
                        ? '오버라이드를 삭제하시겠습니까? (역할 기본 권한으로 복원)'
                        : '이 기능에 대한 권한 오버라이드를 추가하시겠습니까?'
                    }
                    onConfirm={() =>
                      handleOverrideToggle(
                        info.code,
                        override ? override.isAllowed : null,
                      )
                    }
                    okText="확인"
                    cancelText="취소"
                  >
                    <Checkbox
                      checked={override ? override.isAllowed : false}
                      style={{
                        padding: '4px 0',
                        fontWeight: override ? 600 : 400,
                        color: override ? PRIMARY_COLOR : undefined,
                      }}
                    >
                      <Text style={{ color: override ? PRIMARY_COLOR : undefined }}>
                        [{info.category}] {info.label}
                        {override && ' (오버라이드)'}
                      </Text>
                    </Checkbox>
                  </Popconfirm>
                );
              })}
            </div>
          </div>
        ) : (
          <Text type="secondary">사용자 정보를 찾을 수 없습니다.</Text>
        )}
      </Modal>
    </div>
  );
}
