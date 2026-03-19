import { useState } from 'react';
import {
  Form,
  Input,
  Button,
  Checkbox,
  Typography,
  message,
  Space,
  Divider,
} from 'antd';
import {
  UserOutlined,
  LockOutlined,
  ArrowLeftOutlined,
} from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import { registerHQ, checkLoginId } from '../../../api/auth.api';
import StepIndicator from '../../../components/common/StepIndicator';
import BusinessCertUpload from '../../../components/common/BusinessCertUpload';
import LocationContactForm from '../../../components/common/LocationContactForm';

const { Title, Text } = Typography;

const PASSWORD_REGEX =
  /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;

const STEPS = [
  { title: '유형 선택' },
  { title: '기본 정보' },
  { title: '사업자 정보' },
  { title: '매장 정보' },
  { title: '약관 동의' },
];

export default function HQRegisterPage() {
  const [current, setCurrent] = useState(1);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleNext = async () => {
    try {
      await form.validateFields(getFieldsForStep(current));
      setCurrent(current + 1);
    } catch {
      // validation errors shown by form
    }
  };

  const handlePrev = () => {
    if (current === 1) {
      navigate('/register');
    } else {
      setCurrent(current - 1);
    }
  };

  const handleSubmit = async () => {
    try {
      await form.validateFields(getFieldsForStep(current));
      const values = form.getFieldsValue(true);

      if (!values.termsAgreed || !values.privacyAgreed) {
        message.error('필수 약관에 동의해주세요.');
        return;
      }

      setLoading(true);
      await registerHQ({
        account: {
          loginId: values.loginId,
          password: values.password,
          name: values.name,
          phone: values.hqContactPhone,
          email: values.hqContactEmail,
        },
        business: {
          brandName: values.brandName,
          corporationName: values.corporationName,
          businessNumber: values.businessNumber,
          representativeName: values.representativeName,
        },
        hqInfo: {
          zipCode: values.hqZipCode,
          address: values.hqAddress,
          addressDetail: values.hqAddressDetail,
          phone: values.hqPhone,
          email: values.hqEmail,
          contactName: values.hqContactName,
          contactPhone: values.hqContactPhone,
          contactEmail: values.hqContactEmail,
        },
        termsAgreed: values.termsAgreed,
        marketingAgreed: values.marketingAgreed ?? false,
      });

      navigate('/register/complete', { state: { role: 'HQ' } });
    } catch {
      message.error('회원가입 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckLoginId = async () => {
    const loginId = form.getFieldValue('loginId');
    if (!loginId || loginId.length < 4) {
      message.warning('아이디는 4자 이상 입력해주세요.');
      return;
    }
    try {
      const result = await checkLoginId(loginId);
      if (result.available) {
        message.success('사용 가능한 아이디입니다.');
      } else {
        message.error('이미 사용 중인 아이디입니다.');
      }
    } catch {
      message.error('중복 확인 중 오류가 발생했습니다.');
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '48px 24px',
      }}
    >
      <div
        style={{
          width: 640,
          maxWidth: '95vw',
          background: '#fff',
          borderRadius: 16,
          padding: 32,
          boxShadow: 'var(--card-shadow)',
        }}
      >
        <div style={{ marginBottom: 8 }}>
          <Link to="/register">
            <Button type="text" icon={<ArrowLeftOutlined />} style={{ padding: 0 }}>
              유형 선택으로 돌아가기
            </Button>
          </Link>
        </div>

        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Title level={4} style={{ marginBottom: 4 }}>
            매장 본사 회원가입
          </Title>
          <Text type="secondary">여러 지점을 관리하는 프랜차이즈 본사</Text>
        </div>

        <StepIndicator steps={STEPS} current={current} />

        <Form form={form} layout="vertical" autoComplete="off" size="large" className="auth-form">
          {/* Step 1: 기본 정보 */}
          <div style={{ display: current === 1 ? 'block' : 'none' }}>
            <Form.Item
              label="이름"
              name="name"
              rules={[{ required: true, message: '이름을 입력하세요' }]}
            >
              <Input prefix={<UserOutlined />} placeholder="이름 입력" />
            </Form.Item>
            <Form.Item
              label="아이디"
              name="loginId"
              rules={[
                { required: true, message: '아이디를 입력하세요' },
                { min: 4, message: '4자 이상 입력하세요' },
              ]}
            >
              <Space.Compact style={{ width: '100%' }}>
                <Input prefix={<UserOutlined />} placeholder="아이디 입력" />
                <Button onClick={handleCheckLoginId}>중복확인</Button>
              </Space.Compact>
            </Form.Item>
            <Form.Item
              label="비밀번호"
              name="password"
              rules={[
                { required: true, message: '비밀번호를 입력하세요' },
                {
                  pattern: PASSWORD_REGEX,
                  message: '영문, 숫자, 특수문자 포함 8자 이상',
                },
              ]}
            >
              <Input.Password prefix={<LockOutlined />} placeholder="비밀번호 입력" />
            </Form.Item>
            <Form.Item
              label="비밀번호 확인"
              name="passwordConfirm"
              dependencies={['password']}
              rules={[
                { required: true, message: '비밀번호를 다시 입력하세요' },
                ({ getFieldValue }: { getFieldValue: (name: string) => string }) => ({
                  validator(_: unknown, value: string) {
                    if (!value || getFieldValue('password') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('비밀번호가 일치하지 않습니다'));
                  },
                }),
              ]}
            >
              <Input.Password prefix={<LockOutlined />} placeholder="비밀번호 확인" />
            </Form.Item>
          </div>

          {/* Step 2: 사업자 정보 */}
          <div style={{ display: current === 2 ? 'block' : 'none' }}>
            <Form.Item
              label="브랜드명"
              name="brandName"
              rules={[{ required: true, message: '브랜드명을 입력하세요' }]}
            >
              <Input placeholder="프랜차이즈 브랜드명 입력" />
            </Form.Item>
            <Form.Item
              label="법인명"
              name="corporationName"
              rules={[{ required: true, message: '법인명을 입력하세요' }]}
            >
              <Input placeholder="법인명 입력" />
            </Form.Item>
            <Form.Item
              label="사업자등록번호"
              name="businessNumber"
              rules={[{ required: true, message: '사업자등록번호를 입력하세요' }]}
            >
              <Input placeholder="000-00-00000" />
            </Form.Item>
            <Form.Item
              label="대표자명"
              name="representativeName"
              rules={[{ required: true, message: '대표자명을 입력하세요' }]}
            >
              <Input placeholder="대표자명 입력" />
            </Form.Item>
            <Form.Item
              name="businessCertFile"
              valuePropName="fileList"
              getValueFromEvent={(e) => (Array.isArray(e) ? e : e?.fileList ?? [])}
            >
              <BusinessCertUpload />
            </Form.Item>
          </div>

          {/* Step 3: 매장 정보 (본사 위치 + 담당자) */}
          <div style={{ display: current === 3 ? 'block' : 'none' }}>
            <LocationContactForm prefix="본사" fieldPrefix="hq" />
          </div>

          {/* Step 4: 약관 동의 */}
          <div style={{ display: current === 4 ? 'block' : 'none' }}>
            <div
              style={{
                maxHeight: 160,
                overflow: 'auto',
                border: '1px solid #d9d9d9',
                borderRadius: 6,
                padding: '12px 16px',
                marginBottom: 16,
                background: '#fafafa',
                fontSize: 13,
                lineHeight: 1.8,
              }}
            >
              [이용약관]
              <br />
              본 서비스는 MetaBeans ESP 관제시스템의 원격 모니터링 및 제어 서비스입니다.
              이용자는 본 약관에 동의함으로써 서비스 이용에 필요한 개인정보 수집 및 활용에 동의하게 됩니다.
              서비스 이용 중 발생하는 장비 제어는 이용자의 책임 하에 이루어지며,
              비정상적인 사용으로 인한 장비 손상에 대해서는 책임을 지지 않습니다.
            </div>
            <Form.Item
              name="termsAgreed"
              valuePropName="checked"
              rules={[
                {
                  validator: (_: unknown, value: boolean) =>
                    value ? Promise.resolve() : Promise.reject(new Error('이용약관에 동의해주세요')),
                },
              ]}
            >
              <Checkbox>
                <Text strong>[필수]</Text> 이용약관에 동의합니다
              </Checkbox>
            </Form.Item>

            <div
              style={{
                maxHeight: 160,
                overflow: 'auto',
                border: '1px solid #d9d9d9',
                borderRadius: 6,
                padding: '12px 16px',
                marginBottom: 16,
                background: '#fafafa',
                fontSize: 13,
                lineHeight: 1.8,
              }}
            >
              [개인정보처리방침]
              <br />
              MetaBeans는 이용자의 개인정보를 안전하게 보호하기 위해 최선을 다합니다.
              수집하는 개인정보: 이름, 연락처, 이메일, 사업자등록번호, 법인 주소 등
              수집 목적: 서비스 제공, 장비 관리, A/S 접수 및 처리, 긴급 알람 전송
              보유 기간: 회원 탈퇴 시까지 (법정 보관 기간 별도 적용)
            </div>
            <Form.Item
              name="privacyAgreed"
              valuePropName="checked"
              rules={[
                {
                  validator: (_: unknown, value: boolean) =>
                    value
                      ? Promise.resolve()
                      : Promise.reject(new Error('개인정보처리방침에 동의해주세요')),
                },
              ]}
            >
              <Checkbox>
                <Text strong>[필수]</Text> 개인정보처리방침에 동의합니다
              </Checkbox>
            </Form.Item>

            <Divider style={{ margin: '12px 0' }} />

            <Form.Item name="marketingAgreed" valuePropName="checked">
              <Checkbox>[선택] 마케팅 정보 수신에 동의합니다</Checkbox>
            </Form.Item>

            <div
              style={{
                padding: '12px 16px',
                background: '#fff7e6',
                borderRadius: 6,
                border: '1px solid #ffe58f',
              }}
            >
              <Text style={{ fontSize: 13, color: '#ad6800' }}>
                선택 항목 미동의 시, 일부 맞춤형 기능 및 서비스 이용에 제한이 있을 수 있습니다.
              </Text>
            </div>
          </div>
        </Form>

        {/* Navigation buttons */}
        <div className="register-nav">
          <Button onClick={handlePrev}>이전</Button>
          {current < 4 ? (
            <Button type="primary" onClick={handleNext}>
              다음 단계
            </Button>
          ) : (
            <Button type="primary" loading={loading} onClick={handleSubmit}>
              가입 완료
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function getFieldsForStep(step: number): string[] {
  switch (step) {
    case 1:
      return ['name', 'loginId', 'password', 'passwordConfirm'];
    case 2:
      return ['brandName', 'corporationName', 'businessNumber', 'representativeName'];
    case 3:
      return ['hqAddress', 'hqPhone', 'hqEmail', 'hqContactName', 'hqContactPhone', 'hqContactEmail'];
    case 4:
      return ['termsAgreed', 'privacyAgreed'];
    default:
      return [];
  }
}
