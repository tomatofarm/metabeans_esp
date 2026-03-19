import { useCallback } from 'react';
import { Upload, message } from 'antd';
import { FileImageOutlined } from '@ant-design/icons';
import type { UploadFile, UploadProps } from 'antd';
import type { RcFile, UploadChangeParam } from 'antd/es/upload/interface';

const ACCEPT_TYPES = '.jpg,.jpeg,.png,.pdf';
const MAX_SIZE_MB = 10;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;
const SUPPORT_EMAIL = 'support@metabean.net';

export interface BusinessCertUploadProps {
  value?: UploadFile[];
  fileList?: UploadFile[];
  onChange?: (fileList: UploadFile[]) => void;
}

export default function BusinessCertUpload({
  value,
  fileList,
  onChange,
}: BusinessCertUploadProps) {
  const files = fileList ?? value ?? [];

  const handleBeforeUpload: UploadProps['beforeUpload'] = useCallback((file: RcFile) => {
    const isValidType = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'].includes(
      file.type,
    );
    if (!isValidType) {
      message.error('JPG, PNG, PDF 형식만 업로드 가능합니다.');
      return Upload.LIST_IGNORE;
    }
    if (file.size > MAX_SIZE_BYTES) {
      message.error(`파일 크기는 ${MAX_SIZE_MB}MB 이하여야 합니다.`);
      return Upload.LIST_IGNORE;
    }
    return false; // Prevent auto upload, handle manually
  }, []);

  const handleChange: UploadProps['onChange'] = useCallback(
    (info: UploadChangeParam<UploadFile>) => {
      onChange?.(info.fileList);
    },
    [onChange],
  );

  return (
    <div>
      {/* 사업자등록증 제출 안내 배너 */}
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
            <strong>{SUPPORT_EMAIL}</strong>으로 이메일 제출하실 수 있습니다.
            <br />
            <strong>제출 기한:</strong> 신청 후 7일 이내
          </div>
        </div>
      </div>

      {/* 업로드 영역 */}
      <div style={{ marginBottom: 8 }}>
        <div
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: 'var(--color-dark)',
            marginBottom: 8,
          }}
        >
          사업자등록증 업로드
        </div>
        <Upload.Dragger
          name="businessCert"
          multiple={false}
          maxCount={1}
          accept={ACCEPT_TYPES}
          fileList={files}
          beforeUpload={handleBeforeUpload}
          onChange={handleChange}
          style={{
            border: '2px dashed #d9d9d9',
            borderRadius: 4,
            background: '#fafafa',
            padding: '32px 24px',
          }}
        >
          <p style={{ margin: 0, color: '#64748b', fontSize: 14 }}>
            <FileImageOutlined
              style={{ fontSize: 32, color: '#a78bfa', marginBottom: 12, display: 'block' }}
            />
            클릭하여 파일 선택 또는 드래그 앤 드롭
          </p>
          <p style={{ margin: '8px 0 0', color: '#94a3b8', fontSize: 12 }}>
            JPG, PNG, PDF 형식 (최대 {MAX_SIZE_MB}MB)
          </p>
        </Upload.Dragger>
        <div
          style={{
            marginTop: 10,
            fontSize: 12,
            color: 'var(--color-mid)',
          }}
        >
          또는 {SUPPORT_EMAIL}으로 이메일 제출 가능 (신청 후 7일 이내)
        </div>
      </div>
    </div>
  );
}
