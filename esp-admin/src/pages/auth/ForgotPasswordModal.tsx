import { useState } from 'react';
import { Modal, Form, Input, Button, Result, message } from 'antd';
import { UserOutlined, MailOutlined, IdcardOutlined } from '@ant-design/icons';
import { passwordResetRequest } from '../../api/auth.api';

interface ForgotPasswordModalProps {
  open: boolean;
  onClose: () => void;
}

export default function ForgotPasswordModal({
  open,
  onClose,
}: ForgotPasswordModalProps) {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form] = Form.useForm();

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      await passwordResetRequest(values);
      setSubmitted(true);
    } catch (err) {
      if (err instanceof Error) {
        message.error(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    form.resetFields();
    setSubmitted(false);
    onClose();
  };

  return (
    <Modal
      title="비밀번호 초기화 요청"
      open={open}
      onCancel={handleClose}
      footer={null}
      destroyOnClose
      width={440}
    >
      {submitted ? (
        <Result
          status="success"
          title="요청이 접수되었습니다"
          subTitle="관리자 승인 후 처리됩니다. 최대 24시간 소요됩니다."
          extra={
            <Button type="primary" onClick={handleClose}>
              확인
            </Button>
          }
        />
      ) : (
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            label="아이디"
            name="loginId"
            rules={[{ required: true, message: '아이디를 입력하세요' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="가입한 아이디" />
          </Form.Item>
          <Form.Item
            label="이름"
            name="name"
            rules={[{ required: true, message: '이름을 입력하세요' }]}
          >
            <Input prefix={<IdcardOutlined />} placeholder="가입 시 등록한 이름" />
          </Form.Item>
          <Form.Item
            label="이메일"
            name="email"
            rules={[
              { required: true, message: '이메일을 입력하세요' },
              { type: 'email', message: '올바른 이메일 형식을 입력하세요' },
            ]}
          >
            <Input prefix={<MailOutlined />} placeholder="가입 시 등록한 이메일" />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Button onClick={handleClose} style={{ marginRight: 8 }}>
              취소
            </Button>
            <Button type="primary" loading={loading} onClick={handleSubmit}>
              초기화 요청
            </Button>
          </Form.Item>
        </Form>
      )}
    </Modal>
  );
}
