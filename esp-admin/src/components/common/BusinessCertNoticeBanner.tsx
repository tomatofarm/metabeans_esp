/** 사업자등록증 제출 안내 (HQ/Owner/Dealer 등 공통) */
export const BUSINESS_CERT_SUPPORT_EMAIL = 'support@metabean.net';

export default function BusinessCertNoticeBanner() {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
        padding: '14px 16px',
        marginBottom: 16,
        background: '#f3e8ff',
        borderRadius: 4,
        borderLeft: '4px solid #7c3aed',
      }}
    >
      <span style={{ fontSize: 18, lineHeight: 1 }}>💡</span>
      <div>
        <div
          style={{
            fontWeight: 700,
            color: '#5b21b6',
            marginBottom: 6,
            fontSize: 14,
          }}
        >
          사업자등록증 제출 안내
        </div>
        <div
          style={{
            fontSize: 13,
            color: '#6b21a8',
            lineHeight: 1.6,
          }}
        >
          사업자등록증은 이미지 파일로 업로드하거나{' '}
          <strong>{BUSINESS_CERT_SUPPORT_EMAIL}</strong>으로 이메일 제출하실 수 있습니다.
          <br />
          <strong>제출 기한:</strong> 신청 후 7일 이내
        </div>
      </div>
    </div>
  );
}
