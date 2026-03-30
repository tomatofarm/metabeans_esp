import { useState } from 'react';
import { Table, Button, Modal, Input, message, Spin, Typography } from 'antd';
import { CheckOutlined, CloseOutlined, KeyOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { formatDateTimeShort } from '../../utils/formatters';
import {
  usePendingApprovals,
  useApproveUser,
  useRejectUser,
  usePasswordResetRequests,
  useApprovePasswordReset,
} from '../../api/system.api';
import type { PasswordResetRequestItem } from '../../types/system.types';
import { ROLE_CONFIG } from '../../utils/constants';

const { Text } = Typography;
const { TextArea } = Input;

export default function SystemApprovalTab() {
  const { data: approvalResponse, isLoading: approvalsLoading } = usePendingApprovals();
  const { data: resetResponse, isLoading: resetsLoading } = usePasswordResetRequests();
  const approveMutation = useApproveUser();
  const rejectMutation = useRejectUser();
  const resetMutation = useApprovePasswordReset();

  const [rejectModal, setRejectModal] = useState<{ open: boolean; userId: number | null }>({
    open: false,
    userId: null,
  });
  const [rejectReason, setRejectReason] = useState('');

  const approvals = approvalResponse?.data ?? [];
  const resetRequests = resetResponse?.data ?? [];

  const handleApprove = async (userId: number) => {
    try {
      await approveMutation.mutateAsync(userId);
      message.success('승인이 완료되었습니다.');
    } catch {
      message.error('승인 처리에 실패했습니다.');
    }
  };

  const handleRejectConfirm = async () => {
    if (!rejectModal.userId) return;
    if (!rejectReason.trim()) {
      message.warning('반려 사유를 입력해주세요.');
      return;
    }
    try {
      await rejectMutation.mutateAsync({
        userId: rejectModal.userId,
        reason: rejectReason,
      });
      message.success('반려 처리가 완료되었습니다.');
      setRejectModal({ open: false, userId: null });
      setRejectReason('');
    } catch {
      message.error('반려 처리에 실패했습니다.');
    }
  };

  const handlePasswordReset = async (requestId: number) => {
    try {
      const result = await resetMutation.mutateAsync(requestId);
      Modal.success({
        title: '비밀번호 초기화 완료',
        content: (
          <div>
            <p>임시 비밀번호가 발급되었습니다.</p>
            <p>
              <Text strong copyable>
                {result.data.tempPassword}
              </Text>
            </p>
          </div>
        ),
      });
    } catch {
      message.error('비밀번호 초기화에 실패했습니다.');
    }
  };

  const resetColumns: ColumnsType<PasswordResetRequestItem> = [
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
      width: 130,
    },
    {
      title: '이메일',
      dataIndex: 'email',
      key: 'email',
      width: 200,
    },
    {
      title: '요청일시',
      dataIndex: 'requestedAt',
      key: 'requestedAt',
      width: 160,
      render: (text: string) => formatDateTimeShort(text),
    },
    {
      title: '액션',
      key: 'action',
      width: 140,
      render: (_, record) => (
        <Button
          type="primary"
          size="small"
          icon={<KeyOutlined />}
          onClick={() => handlePasswordReset(record.requestId)}
          loading={resetMutation.isPending}
        >
          초기화 승인
        </Button>
      ),
    },
  ];

  if (approvalsLoading || resetsLoading) {
    return (
      <div style={{ textAlign: 'center', padding: 48 }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div>
      {/* 가입 승인 대기 */}
      <div className="system-section-card">
        <div className="system-section-title">가입 승인 대기 ({approvals.length}건)</div>
        <div className="system-section-desc">
          회원가입 신청 후 승인 대기 중인 사용자 목록입니다.
        </div>

        {approvals.length === 0 ? (
          <Text type="secondary">승인 대기 중인 요청이 없습니다.</Text>
        ) : (
          approvals.map((item) => {
            const roleLabel = ROLE_CONFIG[item.role as keyof typeof ROLE_CONFIG]?.label ?? item.role;
            return (
              <div key={item.userId} className="approval-card">
                <div className={`approval-role-icon ${item.role}`}>
                  {roleLabel.slice(0, 2)}
                </div>
                <div className="approval-info">
                  <div className="approval-info-name">
                    {item.businessName || item.name}
                    {item.businessNumber && (
                      <span style={{ fontWeight: 400, fontSize: '0.85rem', color: 'var(--color-mid)', marginLeft: 8 }}>
                        {item.businessNumber}
                      </span>
                    )}
                  </div>
                  <div className="approval-info-sub">
                    {item.name} · {item.phone || item.email} · {formatDateTimeShort(item.createdAt)}
                  </div>
                </div>
                <div className="approval-actions">
                  <button
                    className="approval-btn-approve"
                    onClick={() => handleApprove(item.userId)}
                    disabled={approveMutation.isPending}
                  >
                    <CheckOutlined /> 승인
                  </button>
                  <button
                    className="approval-btn-reject"
                    onClick={() => setRejectModal({ open: true, userId: item.userId })}
                  >
                    <CloseOutlined /> 반려
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 비밀번호 초기화 요청 */}
      <div className="system-section-card">
        <div className="system-section-title">비밀번호 초기화 요청 ({resetRequests.length}건)</div>
        <div className="system-section-desc">
          비밀번호 초기화를 요청한 사용자 목록입니다. 승인 시 임시 비밀번호가 발급됩니다.
        </div>
        <Table
          className="system-table"
          columns={resetColumns}
          dataSource={resetRequests}
          rowKey="requestId"
          pagination={false}
          size="middle"
          scroll={{ x: 700 }}
          locale={{ emptyText: '비밀번호 초기화 요청이 없습니다.' }}
        />
      </div>

      <Modal
        className="system-modal"
        title="가입 반려"
        open={rejectModal.open}
        onOk={handleRejectConfirm}
        onCancel={() => {
          setRejectModal({ open: false, userId: null });
          setRejectReason('');
        }}
        okText="반려 확인"
        cancelText="취소"
        okButtonProps={{ danger: true, loading: rejectMutation.isPending }}
      >
        <p>반려 사유를 입력해주세요.</p>
        <TextArea
          rows={4}
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          placeholder="반려 사유를 입력하세요..."
        />
      </Modal>
    </div>
  );
}
