import { Modal } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';

interface ConfirmModalProps {
  title: string;
  content: string;
  onOk: () => void;
  onCancel?: () => void;
}

/**
 * 확인 모달 유틸리티
 */
export function showConfirmModal({ title, content, onOk, onCancel }: ConfirmModalProps) {
  Modal.confirm({
    title,
    icon: <ExclamationCircleOutlined />,
    content,
    okText: '확인',
    cancelText: '취소',
    onOk,
    onCancel,
  });
}
