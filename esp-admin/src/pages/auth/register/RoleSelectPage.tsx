import React, { useState } from 'react';
import { Typography, Card, Button, Row, Col } from 'antd';
import {
  ShopOutlined,
  BankOutlined,
  SafetyCertificateOutlined,
  ToolOutlined,
} from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import { ROLE_CONFIG, PRIMARY_COLOR } from '../../../utils/constants';

const { Title, Text, Paragraph } = Typography;

interface RoleOption {
  key: string;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  description: string;
  path: string;
}

const ROLE_OPTIONS: RoleOption[] = [
  {
    key: 'owner',
    icon: <ShopOutlined style={{ fontSize: 36, color: ROLE_CONFIG.OWNER.color }} />,
    title: '매장 점주',
    subtitle: '개인 사업자',
    description:
      '개별 매장을 운영하는 점주님을 위한 가입입니다. 가입 후 매장 장비를 모니터링하고 제어할 수 있습니다.',
    path: '/register/owner',
  },
  {
    key: 'hq',
    icon: <BankOutlined style={{ fontSize: 36, color: ROLE_CONFIG.HQ.color }} />,
    title: '매장 본사',
    subtitle: '법인 사업자',
    description:
      '여러 지점을 관리하는 프랜차이즈 본사를 위한 가입입니다. 소속 매장을 통합 모니터링할 수 있습니다.',
    path: '/register/hq',
  },
  {
    key: 'admin',
    icon: <SafetyCertificateOutlined style={{ fontSize: 36, color: ROLE_CONFIG.ADMIN.color }} />,
    title: '본사 직원',
    subtitle: '내부 직원',
    description:
      '메타빈스 본사 운영 직원을 위한 가입입니다. 가입 후 관리자 승인이 필요합니다.',
    path: '/register/admin',
  },
  {
    key: 'dealer',
    icon: <ToolOutlined style={{ fontSize: 36, color: ROLE_CONFIG.DEALER.color }} />,
    title: '대리점',
    subtitle: '서비스 제공자',
    description:
      '대리점 회원은 ESP 장비의 설치, A/S, 유지보수 업무를 담당합니다. 가입 후 관리자 승인이 필요합니다.',
    path: '/register/dealer',
  },
];

export default function RoleSelectPage() {
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const navigate = useNavigate();

  const selected = ROLE_OPTIONS.find((r) => r.key === selectedKey);

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
          width: 800,
          maxWidth: '95vw',
          background: '#fff',
          borderRadius: 12,
          padding: '48px 40px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Title level={3} style={{ marginBottom: 4 }}>
            회원가입
          </Title>
          <Text type="secondary">가입 유형을 선택해주세요</Text>
        </div>

        <Row gutter={[16, 16]}>
          {ROLE_OPTIONS.map((role) => (
            <Col xs={24} sm={12} key={role.key}>
              <Card
                hoverable
                onClick={() => setSelectedKey(role.key)}
                style={{
                  border:
                    selectedKey === role.key
                      ? `2px solid ${PRIMARY_COLOR}`
                      : '2px solid transparent',
                  borderRadius: 8,
                  cursor: 'pointer',
                  height: '100%',
                }}
                bodyStyle={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  padding: '24px 16px',
                }}
              >
                <div style={{ marginBottom: 12 }}>{role.icon}</div>
                <Text strong style={{ fontSize: 16, display: 'block' }}>
                  {role.title}
                </Text>
                <Text type="secondary" style={{ fontSize: 13 }}>
                  {role.subtitle}
                </Text>
              </Card>
            </Col>
          ))}
        </Row>

        {selected && (
          <div
            style={{
              marginTop: 24,
              padding: '16px 20px',
              background: '#f0f5ff',
              borderRadius: 8,
              border: '1px solid #d6e4ff',
            }}
          >
            <Paragraph style={{ margin: 0, color: '#333', fontSize: 14 }}>
              {selected.description}
            </Paragraph>
          </div>
        )}

        <div
          style={{
            marginTop: 32,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Link to="/login">
            <Button>로그인으로 돌아가기</Button>
          </Link>
          <Button
            type="primary"
            size="large"
            disabled={!selectedKey}
            onClick={() => {
              if (selected) navigate(selected.path);
            }}
          >
            다음 단계
          </Button>
        </div>
      </div>
    </div>
  );
}
