import { Button, Typography, Result } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import type { UserRole } from '../../../types/auth.types';

const { Text } = Typography;

const ROLE_LABELS: Record<UserRole, string> = {
  OWNER: '매장 점주',
  HQ: '매장 본사',
  ADMIN: '본사 직원',
  DEALER: '대리점',
};

const NEEDS_APPROVAL: UserRole[] = ['ADMIN', 'DEALER'];

export default function RegisterCompletePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const role = (location.state as { role?: UserRole })?.role ?? 'OWNER';

  const needsApproval = NEEDS_APPROVAL.includes(role);
  const roleLabel = ROLE_LABELS[role] || role;

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: 24,
      }}
    >
      <div
        style={{
          width: 560,
          maxWidth: '95vw',
          background: '#fff',
          borderRadius: 12,
          padding: '48px 40px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
          textAlign: 'center',
        }}
      >
        <Result
          status="success"
          title="회원가입이 완료되었습니다"
          subTitle={
            <>
              <Text style={{ display: 'block', marginBottom: 8 }}>
                <Text strong>{roleLabel}</Text> 계정으로 가입되었습니다.
              </Text>
              {needsApproval ? (
                <Text type="secondary">
                  관리자 승인 후 이용 가능합니다. 승인 완료 시 등록된 이메일로 안내됩니다.
                </Text>
              ) : (
                <Text type="secondary">
                  즉시 이용 가능합니다. 로그인 페이지에서 로그인해주세요.
                </Text>
              )}
            </>
          }
          extra={[
            <Button
              type="primary"
              size="large"
              key="login"
              onClick={() => navigate('/login')}
            >
              로그인 페이지로 이동
            </Button>,
          ]}
        />
      </div>
    </div>
  );
}
