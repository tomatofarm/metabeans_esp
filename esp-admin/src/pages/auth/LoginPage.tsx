import { useState } from 'react';
import { Form, Input, Button, message, Typography, Divider } from 'antd';
import { UserOutlined, LockOutlined, DashboardOutlined, ControlOutlined, AlertOutlined } from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import { login } from '../../api/auth.api';
import { useAuthStore } from '../../stores/authStore';
import type { UserRole } from '../../types/auth.types';
import ForgotPasswordModal from './ForgotPasswordModal';

const { Text } = Typography;

const ROLE_DASHBOARD_MAP: Record<UserRole, string> = {
  ADMIN: '/dashboard/admin',
  DEALER: '/dashboard/dealer',
  HQ: '/dashboard/hq',
  OWNER: '/dashboard/owner',
};

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const navigate = useNavigate();
  const authLogin = useAuthStore((s) => s.login);

  const onFinish = async (values: { loginId: string; password: string }) => {
    setLoading(true);
    try {
      const response = await login(values);
      authLogin(response.user, response.accessToken);
      message.success(`${response.user.name}님 환영합니다.`);
      const dashboardPath = ROLE_DASHBOARD_MAP[response.user.role];
      navigate(dashboardPath);
    } catch {
      message.error('아이디 또는 비밀번호가 올바르지 않습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      }}
    >
      <div
        style={{
          display: 'flex',
          width: 1200,
          maxWidth: '95vw',
          aspectRatio: '4 / 3',
          maxHeight: '90vh',
          borderRadius: 24,
          overflow: 'hidden',
          boxShadow: '0 25px 80px rgba(0, 0, 0, 0.3)',
          background: '#fff',
        }}
      >
        {/* 좌측 브랜드 패널 (45%) */}
        <div
          style={{
            flex: '0 0 45%',
            background: 'linear-gradient(160deg, #667eea 0%, #5a3f9e 50%, #764ba2 100%)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '60px 40px',
            color: '#fff',
          }}
        >
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              background: '#e74c3c',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              fontSize: 32,
              fontWeight: 700,
              marginBottom: 24,
              color: '#fff',
              boxShadow: '0 0 30px rgba(231, 76, 60, 0.5)',
            }}
          >
            MB
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: '#fff', marginBottom: 4 }}>
            MetaBeans
          </div>
          <div
            style={{
              fontSize: '1rem',
              color: 'rgba(255,255,255,0.8)',
              marginBottom: 40,
            }}
          >
            ESP 관제시스템
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 280 }}>
            {[
              { icon: <DashboardOutlined />, text: '실시간 장비 모니터링' },
              { icon: <ControlOutlined />, text: '원격 제어 및 자동화' },
              { icon: <AlertOutlined />, text: '긴급 알람 및 A/S 관리' },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, color: 'rgba(255,255,255,0.7)' }}>
                <span style={{ fontSize: 18 }}>{item.icon}</span>
                <span style={{ fontSize: 14 }}>{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 우측 로그인 패널 (55%) */}
        <div
          style={{
            flex: '0 0 55%',
            background: '#fff',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            padding: '60px 48px',
          }}
        >
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-dark)', marginBottom: 4 }}>
            로그인
          </div>
          <Text type="secondary" style={{ marginBottom: 32, display: 'block', fontSize: '0.9rem' }}>
            계정 정보를 입력하세요
          </Text>

          <Form
            name="login"
            onFinish={onFinish}
            autoComplete="off"
            layout="vertical"
            size="large"
            className="auth-form"
          >
            <Form.Item
              label="아이디"
              name="loginId"
              rules={[{ required: true, message: '아이디를 입력하세요' }]}
            >
              <Input prefix={<UserOutlined />} placeholder="아이디 입력" />
            </Form.Item>
            <Form.Item
              label="비밀번호"
              name="password"
              rules={[{ required: true, message: '비밀번호를 입력하세요' }]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="비밀번호 입력"
              />
            </Form.Item>

            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                marginBottom: 16,
                marginTop: -8,
              }}
            >
              <Button
                type="link"
                size="small"
                style={{ padding: 0, fontSize: 13 }}
                onClick={() => setForgotModalOpen(true)}
              >
                비밀번호를 잊으셨나요?
              </Button>
            </div>

            <Form.Item style={{ marginBottom: 16 }}>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                block
                className="auth-login-btn"
              >
                로그인
              </Button>
            </Form.Item>
          </Form>

          <Divider style={{ margin: '8px 0 16px' }}>또는</Divider>

          <div style={{ textAlign: 'center' }}>
            <Text type="secondary" style={{ fontSize: 13 }}>
              아직 계정이 없으신가요?{' '}
              <Link to="/register">회원가입</Link>
            </Text>
          </div>

          <div
            style={{
              textAlign: 'center',
              marginTop: 24,
              padding: '12px 16px',
              background: '#f5f5f5',
              borderRadius: 8,
            }}
          >
            <Text type="secondary" style={{ fontSize: 12 }}>
              테스트 계정: admin / admin123 · dealer / dealer123 · hq / hq123 · owner / owner123
            </Text>
          </div>
        </div>
      </div>

      <ForgotPasswordModal
        open={forgotModalOpen}
        onClose={() => setForgotModalOpen(false)}
      />
    </div>
  );
}
