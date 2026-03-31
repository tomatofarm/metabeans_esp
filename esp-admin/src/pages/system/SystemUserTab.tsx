import { useState, useEffect, useMemo } from 'react';
import {
  Table,
  Button,
  Modal,
  Select,
  Input,
  Form,
  message,
  Spin,
  Typography,
  Descriptions,
} from 'antd';
import { EditOutlined, SearchOutlined, TeamOutlined, UserAddOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { formatDateTimeShort, formatDate } from '../../utils/formatters';
import {
  useSystemUsers,
  useSystemUserDetail,
  useUpdateSystemUser,
} from '../../api/system.api';
import type { SystemUserItem, UserListParams } from '../../types/system.types';
import type { UserRole, AccountStatus } from '../../types/auth.types';
import { ROLE_CONFIG } from '../../utils/constants';
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
  const [searchValue, setSearchValue] = useState('');
  const [editUserId, setEditUserId] = useState<number | null>(null);
  const [editForm] = Form.useForm();

  const { data: usersResponse, isLoading } = useSystemUsers(filters);
  const { data: summaryUsersResponse } = useSystemUsers({ page: 1, pageSize: 1000 });
  const { data: detailResponse, isLoading: detailLoading } =
    useSystemUserDetail(editUserId);
  const updateMutation = useUpdateSystemUser();

  const users = usersResponse?.data ?? [];
  const summaryUsers = summaryUsersResponse?.data ?? users;
  const userDetail = detailResponse?.data ?? null;

  const summary = useMemo(() => {
    const roleOrder: UserRole[] = ['ADMIN', 'HQ', 'OWNER', 'DEALER'];
    const roleCounts = roleOrder.map((role) => ({
      role,
      count: summaryUsers.filter((u) => u.role === role).length,
    }));

    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const recentUsers = summaryUsers.filter(
      (u) => new Date(u.createdAt).getTime() >= sevenDaysAgo,
    );
    const recentByRole = roleOrder.map((role) => ({
      role,
      count: recentUsers.filter((u) => u.role === role).length,
    }));

    return {
      roleCounts,
      recentCount: recentUsers.length,
      recentByRole,
    };
  }, [summaryUsers]);

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
      <div className="system-user-summary-grid">
        <div className="system-user-summary-card">
          <div className="system-user-summary-header">
            <span>역할별 사용자 수</span>
            <TeamOutlined />
          </div>
          <div className="system-user-summary-list">
            {summary.roleCounts.map((item) => (
              <div key={item.role} className="system-user-summary-row">
                <div className="system-user-summary-role">
                  <span
                    className="system-user-summary-dot"
                    style={{ background: ROLE_CONFIG[item.role].color }}
                  />
                  <span>{ROLE_CONFIG[item.role].label}</span>
                </div>
                <strong>{item.count}명</strong>
              </div>
            ))}
          </div>
        </div>

        <div className="system-user-summary-card">
          <div className="system-user-summary-header">
            <span>신규 가입 현황</span>
            <UserAddOutlined />
          </div>
          <div className="system-user-summary-value">{summary.recentCount}명</div>
          <div className="system-user-summary-sub">최근 7일 기준</div>
          <div className="system-user-summary-list compact">
            {summary.recentByRole.map((item) => (
              <div key={item.role} className="system-user-summary-row">
                <span>{ROLE_CONFIG[item.role].label}</span>
                <strong>{item.count}명</strong>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="system-filter">
        <Select
          placeholder="역할 필터"
          allowClear
          style={{ width: 160 }}
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
          style={{ width: 140 }}
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
        <div className="sf-search">
          <SearchOutlined className="sf-search-icon" />
          <input
            className="sf-search-input"
            type="text"
            placeholder="이름 또는 아이디 검색"
            value={searchValue}
            onChange={(e) => {
              const v = e.target.value;
              setSearchValue(v);
              if (!v) handleSearch('');
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSearch(searchValue);
            }}
          />
          {searchValue && (
            <button
              className="sf-search-clear"
              onClick={() => { setSearchValue(''); handleSearch(''); }}
              aria-label="검색어 지우기"
            >
              ×
            </button>
          )}
          <button
            className="sf-search-btn"
            onClick={() => handleSearch(searchValue)}
          >
            검색
          </button>
        </div>
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
          </div>
        ) : (
          <Text type="secondary">사용자 정보를 찾을 수 없습니다.</Text>
        )}
      </Modal>
    </div>
  );
}
