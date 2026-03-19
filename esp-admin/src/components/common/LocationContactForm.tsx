import { Form, Input, Button, Row, Col } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { useKakaoPostcodePopup } from 'react-daum-postcode';

export interface LocationContactFormProps {
  /** "본사" | "대리점" — 라벨/멘트 접두사 */
  prefix: '본사' | '대리점';
  /** HQ: hq*, Dealer: 빈 문자열(기본 필드명) */
  fieldPrefix: 'hq' | 'dealer';
  /**
   * 위치 정보 블록 내 「대표 전화번호」「대표 이메일」 표시 여부.
   * HQ 회원가입 매장 정보 단계에서는 false (담당자 연락처만 수집).
   */
  showOrgRepresentativeContact?: boolean;
}

interface DaumAddressData {
  zonecode: string;
  address: string;
  roadAddress?: string;
  jibunAddress?: string;
  addressType: 'R' | 'J';
  bname?: string;
  buildingName?: string;
}

const sectionStyle = {
  marginBottom: 24,
};

const sectionTitleStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  marginBottom: 16,
  fontSize: 15,
  fontWeight: 700,
  color: 'var(--color-dark)',
};

const sectionBarStyle = {
  width: 4,
  height: 20,
  background: '#7c3aed',
  borderRadius: 2,
};

const noticeBoxStyle = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: 12,
  padding: '14px 16px',
  marginBottom: 20,
  background: '#f3e8ff',
  borderRadius: 4,
  borderLeft: '4px solid #7c3aed',
};

export default function LocationContactForm({
  prefix,
  fieldPrefix,
  showOrgRepresentativeContact = true,
}: LocationContactFormProps) {
  const form = Form.useFormInstance();
  const openPostcode = useKakaoPostcodePopup();

  const p = fieldPrefix === 'hq' ? 'hq' : '';
  const zipName = p ? 'hqZipCode' : 'zipCode';
  const addressName = p ? 'hqAddress' : 'address';
  const addressDetailName = p ? 'hqAddressDetail' : 'addressDetail';
  const repPhoneName = p ? 'hqPhone' : 'phone';
  const repEmailName = p ? 'hqEmail' : 'email';
  const contactName = p ? 'hqContactName' : 'contactName';
  const contactPhone = p ? 'hqContactPhone' : 'contactPhone';
  const contactEmail = p ? 'hqContactEmail' : 'contactEmail';

  const handleComplete = (data: DaumAddressData) => {
    let fullAddress = data.address;
    if (data.addressType === 'R') {
      let extra = '';
      if (data.bname) extra += data.bname;
      if (data.buildingName) extra += extra ? `, ${data.buildingName}` : data.buildingName;
      if (extra) fullAddress += ` (${extra})`;
    }
    form?.setFieldsValue({
      [zipName]: data.zonecode,
      [addressName]: fullAddress,
    });
  };

  const handleAddressSearch = () => {
    openPostcode({ onComplete: handleComplete });
  };

  return (
    <>
      {/* 위치 정보 섹션 */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>
          <div style={sectionBarStyle} />
          {prefix} 위치 정보
        </div>

        <div style={noticeBoxStyle}>
          <span style={{ fontSize: 18, lineHeight: 1 }}>💡</span>
          <div>
            <div style={{ fontWeight: 700, color: '#5b21b6', marginBottom: 4, fontSize: 14 }}>
              {prefix} 주소 안내
            </div>
            <div style={{ fontSize: 13, color: '#6b21a8', lineHeight: 1.5 }}>
              {prefix}의 정확한 주소와 연락처를 입력해주세요.
            </div>
          </div>
        </div>

        <Form.Item label={`${prefix} 주소`} style={{ marginBottom: 16 }}>
          <Row gutter={8}>
            <Col flex="0 0 120px">
              <Form.Item name={zipName} noStyle>
                <Input placeholder="우편번호" />
              </Form.Item>
            </Col>
            <Col flex="0 0 120px">
              <Button
                htmlType="button"
                icon={<SearchOutlined />}
                onClick={handleAddressSearch}
                style={{ width: '100%' }}
              >
                주소 검색
              </Button>
            </Col>
          </Row>
        </Form.Item>

        <Form.Item
          label="기본 주소"
          name={addressName}
          rules={[{ required: true, message: `기본 주소를 입력하세요` }]}
        >
          <Input placeholder="기본 주소" />
        </Form.Item>

        <Form.Item
          label="상세 주소"
          name={addressDetailName}
        >
          <Input placeholder="상세 주소를 입력하세요 (층/호수 등)" />
        </Form.Item>

        {showOrgRepresentativeContact ? (
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                label="대표 전화번호"
                name={repPhoneName}
                rules={[{ required: true, message: '대표 전화번호를 입력하세요' }]}
              >
                <Input placeholder="02-0000-0000" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                label="대표 이메일"
                name={repEmailName}
                rules={[
                  { required: true, message: '대표 이메일을 입력하세요' },
                  { type: 'email', message: '유효한 이메일을 입력하세요' },
                ]}
              >
                <Input placeholder="info@company.com" />
              </Form.Item>
            </Col>
          </Row>
        ) : null}
      </div>

      {/* 담당자 정보 섹션 */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>
          <div style={sectionBarStyle} />
          담당자 정보
        </div>

        <Row gutter={12} wrap={false}>
          <Col flex="0 0 110px">
            <Form.Item
              label="담당자명"
              name={contactName}
              rules={[{ required: true, message: '담당자명을 입력하세요' }]}
            >
              <Input placeholder="홍길동" />
            </Form.Item>
          </Col>
          <Col flex="0 0 170px">
            <Form.Item
              label="담당자 연락처"
              name={contactPhone}
              rules={[{ required: true, message: '담당자 연락처를 입력하세요' }]}
            >
              <Input placeholder="010-0000-0000" />
            </Form.Item>
          </Col>
          <Col flex="1" style={{ minWidth: 0 }}>
            <Form.Item
              label="담당자 이메일"
              name={contactEmail}
              rules={[
                { required: true, message: '담당자 이메일을 입력하세요' },
                { type: 'email', message: '유효한 이메일을 입력하세요' },
              ]}
            >
              <Input placeholder="manager@company.com" />
            </Form.Item>
          </Col>
        </Row>
      </div>
    </>
  );
}
