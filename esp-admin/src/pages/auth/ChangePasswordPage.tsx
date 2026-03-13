import { useState } from 'react';
import { Form, Input, Button, Card, Typography, message, Space } from 'antd';
import { LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { changePassword } from '../../api/auth.api';
import { useAuthStore } from '../../stores/authStore';

const { Title, Text } = Typography;

const PASSWORD_REGEX = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;

export default function ChangePasswordPage() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const onFinish = async (values: {
    currentPassword: string;
    newPassword: string;
  }) => {
    setLoading(true);
    try {
      await changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      message.success('비밀번호가 변경되었습니다. 다시 로그인해 주세요.');
      navigate('/login');
    } catch (err) {
      if (err instanceof Error) {
        message.error(err.message);
      } else {
        message.error('비밀번호 변경에 실패했습니다.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    navigate('/login');
    return null;
  }

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: '#f0f2f5',
      }}
    >
      <Card style={{ width: 440 }}>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <div>
            <Title level={4} style={{ marginBottom: 4 }}>
              비밀번호 변경
            </Title>
            <Text type="secondary">
              새로운 비밀번호를 설정하세요
            </Text>
          </div>

          <Form
            name="changePassword"
            onFinish={onFinish}
            autoComplete="off"
            layout="vertical"
            size="large"
          >
            <Form.Item
              label="현재 비밀번호"
              name="currentPassword"
              rules={[
                { required: true, message: '현재 비밀번호를 입력하세요' },
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="현재 비밀번호"
              />
            </Form.Item>

            <Form.Item
              label="새 비밀번호"
              name="newPassword"
              rules={[
                { required: true, message: '새 비밀번호를 입력하세요' },
                {
                  pattern: PASSWORD_REGEX,
                  message:
                    '영문, 숫자, 특수문자를 포함하여 8자 이상 입력하세요',
                },
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="영문+숫자+특수문자 8자 이상"
              />
            </Form.Item>

            <Form.Item
              label="새 비밀번호 확인"
              name="confirmPassword"
              dependencies={['newPassword']}
              rules={[
                { required: true, message: '새 비밀번호를 다시 입력하세요' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('newPassword') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(
                      new Error('비밀번호가 일치하지 않습니다'),
                    );
                  },
                }),
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="새 비밀번호 확인"
              />
            </Form.Item>

            <Form.Item style={{ marginBottom: 8 }}>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                block
              >
                비밀번호 변경
              </Button>
            </Form.Item>

            <Button
              type="link"
              block
              onClick={() => navigate(-1)}
              style={{ padding: 0 }}
            >
              취소
            </Button>
          </Form>
        </Space>
      </Card>
    </div>
  );
}
