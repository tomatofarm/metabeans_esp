import type { CSSProperties } from 'react';
import { Form, Input, Row, Col, DatePicker } from 'antd';
import BusinessCertNoticeBanner from './BusinessCertNoticeBanner';
import BusinessCertUpload from './BusinessCertUpload';

const sectionTitleStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  marginBottom: 16,
  fontSize: 15,
  fontWeight: 700,
  color: 'var(--color-dark)',
};

const sectionBarStyle: CSSProperties = {
  width: 4,
  height: 20,
  background: '#1677ff',
  borderRadius: 2,
};

/**
 * 매장 본사(HQ) 회원가입 — 사업자 정보 단계 전용 UI.
 * 법인등록번호·설립일자는 HQ에만 있으며, Owner/Dealer 사업자 단계와 분리한다.
 */
export default function HQBusinessInfoSection() {
  return (
    <>
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

      <div style={{ marginTop: 8, marginBottom: 4 }}>
        <div style={sectionTitleStyle}>
          <div style={sectionBarStyle} />
          사업자 정보
        </div>
        <BusinessCertNoticeBanner />
      </div>

      <Row gutter={[16, 0]}>
        <Col xs={24} md={12}>
          <Form.Item
            label="사업자등록번호"
            name="businessNumber"
            rules={[{ required: true, message: '사업자등록번호를 입력하세요' }]}
          >
            <Input placeholder="000-00-00000" />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item label="법인등록번호" name="corporateRegistrationNumber">
            <Input placeholder="000000-0000000" />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item
            label="대표자명"
            name="representativeName"
            rules={[{ required: true, message: '대표자명을 입력하세요' }]}
          >
            <Input placeholder="대표자 이름" />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item label="설립일자" name="establishmentDate">
            <DatePicker
              style={{ width: '100%' }}
              format="YYYY-MM-DD"
              placeholder="년-월-일"
            />
          </Form.Item>
        </Col>
      </Row>

      <Form.Item
        name="businessCertFile"
        valuePropName="fileList"
        getValueFromEvent={(e) => (Array.isArray(e) ? e : e?.fileList ?? [])}
      >
        <BusinessCertUpload showNoticeBanner={false} />
      </Form.Item>
    </>
  );
}
