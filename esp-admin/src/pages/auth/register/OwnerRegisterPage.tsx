import { useState, useEffect } from 'react';
import {
  Form,
  Input,
  Button,
  Select,
  InputNumber,
  Checkbox,
  Typography,
  message,
  Space,
  Divider,
} from 'antd';
import {
  UserOutlined,
  LockOutlined,
  MailOutlined,
  PhoneOutlined,
  ArrowLeftOutlined,
} from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import { registerOwner, checkLoginId, getDealerList } from '../../../api/auth.api';
import { BUSINESS_TYPES } from '../../../types/auth.types';
import type { DealerListItem } from '../../../types/auth.types';
import StepIndicator from '../../../components/common/StepIndicator';

const { Title, Text, Paragraph } = Typography;

const PASSWORD_REGEX =
  /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;

const STEPS = [
  { title: '유형 선택' },
  { title: '기본 정보' },
  { title: '사업자 정보' },
  { title: '매장 정보' },
  { title: '담당 대리점' },
  { title: '약관 동의' },
];

export default function OwnerRegisterPage() {
  const [current, setCurrent] = useState(1);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [dealers, setDealers] = useState<DealerListItem[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    getDealerList().then(setDealers);
  }, []);

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
      await registerOwner({
        account: {
          loginId: values.loginId,
          password: values.password,
          name: values.name,
          phone: values.phone,
          email: values.email,
        },
        business: {
          businessName: values.businessName,
          businessNumber: values.businessNumber,
        },
        store: {
          storeName: values.storeName,
          address: values.storeAddress,
          addressDetail: values.storeAddressDetail,
          phone: values.storePhone,
          businessType: values.businessType,
          floorCount: values.floorCount ?? 1,
        },
        dealerId: values.dealerId,
        termsAgreed: values.termsAgreed,
        marketingAgreed: values.marketingAgreed ?? false,
      });

      navigate('/register/complete', { state: { role: 'OWNER' } });
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
            매장 점주 회원가입
          </Title>
          <Text type="secondary">개별 매장을 운영하는 점주님</Text>
        </div>

        <StepIndicator steps={STEPS} current={current} />

        <Form
          form={form}
          layout="vertical"
          autoComplete="off"
          size="large"
          className="auth-form"
        >
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
            <Form.Item
              label="이메일"
              name="email"
              rules={[
                { required: true, message: '이메일을 입력하세요' },
                { type: 'email', message: '유효한 이메일을 입력하세요' },
              ]}
            >
              <Input prefix={<MailOutlined />} placeholder="이메일 입력" />
            </Form.Item>
            <Form.Item
              label="휴대전화"
              name="phone"
              rules={[{ required: true, message: '휴대전화를 입력하세요' }]}
            >
              <Input prefix={<PhoneOutlined />} placeholder="010-0000-0000" />
            </Form.Item>
          </div>

          {/* Step 2: 사업자 정보 */}
          <div style={{ display: current === 2 ? 'block' : 'none' }}>
            <Form.Item
              label="사업자등록번호"
              name="businessNumber"
              rules={[{ required: true, message: '사업자등록번호를 입력하세요' }]}
            >
              <Input placeholder="000-00-00000" />
            </Form.Item>
            <Form.Item
              label="상호명"
              name="businessName"
              rules={[{ required: true, message: '상호명을 입력하세요' }]}
            >
              <Input placeholder="상호명 입력" />
            </Form.Item>
          </div>

          {/* Step 3: 매장 정보 */}
          <div style={{ display: current === 3 ? 'block' : 'none' }}>
            <Form.Item
              label="매장명"
              name="storeName"
              rules={[{ required: true, message: '매장명을 입력하세요' }]}
            >
              <Input placeholder="매장명 입력" />
            </Form.Item>
            <Form.Item
              label="매장 주소"
              name="storeAddress"
              rules={[{ required: true, message: '매장 주소를 입력하세요' }]}
            >
              <Input placeholder="주소 검색" />
            </Form.Item>
            <Form.Item label="상세 주소" name="storeAddressDetail">
              <Input placeholder="상세 주소 입력" />
            </Form.Item>
            <Form.Item label="매장 전화번호" name="storePhone">
              <Input prefix={<PhoneOutlined />} placeholder="02-0000-0000" />
            </Form.Item>
            <Form.Item
              label="업종"
              name="businessType"
              rules={[{ required: true, message: '업종을 선택하세요' }]}
            >
              <Select placeholder="업종 선택">
                {BUSINESS_TYPES.map((type) => (
                  <Select.Option key={type} value={type}>
                    {type}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item
              label="층수"
              name="floorCount"
              rules={[{ required: true, message: '층수를 입력하세요' }]}
              initialValue={1}
            >
              <InputNumber min={1} max={10} style={{ width: '100%' }} />
            </Form.Item>
          </div>

          {/* Step 4: 담당 대리점 */}
          <div style={{ display: current === 4 ? 'block' : 'none' }}>
            <Paragraph type="secondary" style={{ marginBottom: 16 }}>
              장비 설치 및 유지보수를 담당할 대리점을 선택해주세요.
            </Paragraph>
            <Form.Item
              label="담당 대리점"
              name="dealerId"
              rules={[{ required: true, message: '담당 대리점을 선택하세요' }]}
            >
              <Select placeholder="대리점 선택">
                {dealers.map((d: DealerListItem) => (
                  <Select.Option key={d.dealerId} value={d.dealerId}>
                    {d.dealerName} ({d.serviceRegions.join(', ')})
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </div>

          {/* Step 5: 약관 동의 */}
          <div style={{ display: current === 5 ? 'block' : 'none' }}>
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
              수집하는 개인정보: 이름, 연락처, 이메일, 사업자등록번호, 매장 주소 등
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
          {current < 5 ? (
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
      return ['name', 'loginId', 'password', 'passwordConfirm', 'email', 'phone'];
    case 2:
      return ['businessNumber', 'businessName'];
    case 3:
      return ['storeName', 'storeAddress', 'businessType', 'floorCount'];
    case 4:
      return ['dealerId'];
    case 5:
      return ['termsAgreed', 'privacyAgreed'];
    default:
      return [];
  }
}
