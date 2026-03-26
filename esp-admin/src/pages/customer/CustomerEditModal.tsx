import { useEffect } from 'react';
import {
  Modal,
  Form,
  Input,
  Select,
  Switch,
  message,
  Spin,
} from 'antd';
import { useCustomerDetail, useUpdateCustomer, useCustomerDealerOptions } from '../../api/customer.api';
import { BUSINESS_TYPES } from '../../types/auth.types';

interface CustomerEditModalProps {
  storeId: number | null;
  open: boolean;
  onClose: () => void;
}

export default function CustomerEditModal({ storeId, open, onClose }: CustomerEditModalProps) {
  const [form] = Form.useForm();
  const { data: detailData, isLoading } = useCustomerDetail(open ? storeId : null);
  const { data: dealerOptions } = useCustomerDealerOptions();
  const updateMutation = useUpdateCustomer();

  const detail = detailData?.data;

  useEffect(() => {
    if (detail && open) {
      form.setFieldsValue({
        storeName: detail.storeName,
        address: detail.address,
        phone: detail.phone,
        businessType: detail.businessType,
        isActive: detail.status === 'ACTIVE',
        dealerId: detail.dealerId,
        memo: detail.memo ?? '',
      });
    }
  }, [detail, open, form]);

  const handleSave = async () => {
    if (!storeId || !detail) return;
    try {
      const values = await form.validateFields();
      await updateMutation.mutateAsync({
        storeId,
        data: {
          storeName: values.storeName,
          address: values.address,
          phone: values.phone,
          businessType: values.businessType,
          status: values.isActive ? 'ACTIVE' : 'INACTIVE',
          dealerId: values.dealerId,
          memo: values.memo,
        },
      });
      message.success('고객 정보가 수정되었습니다.');
      onClose();
    } catch {
      // validation error
    }
  };

  return (
    <Modal
      className="customer-modal"
      title="고객 정보 수정"
      open={open}
      onCancel={onClose}
      onOk={handleSave}
      okText="저장"
      cancelText="취소"
      confirmLoading={updateMutation.isPending}
      width={700}
      destroyOnClose
    >
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <Spin />
        </div>
      ) : detail ? (
        <>
          <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
            <Form.Item
              name="storeName"
              label="매장명"
              rules={[{ required: true, message: '매장명을 입력하세요' }]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              name="address"
              label="주소"
              rules={[{ required: true, message: '주소를 입력하세요' }]}
            >
              <Input />
            </Form.Item>
            <Form.Item name="phone" label="전화번호">
              <Input />
            </Form.Item>
            <Form.Item name="businessType" label="업종">
              <Select>
                {BUSINESS_TYPES.map((bt) => (
                  <Select.Option key={bt} value={bt}>
                    {bt}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item name="isActive" label="상태" valuePropName="checked">
              <Switch checkedChildren="활성" unCheckedChildren="비활성" />
            </Form.Item>
            <Form.Item name="dealerId" label="담당 대리점">
              <Select allowClear placeholder="대리점 선택">
                {dealerOptions?.map((d) => (
                  <Select.Option key={d.dealerId} value={d.dealerId}>
                    {d.dealerName}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item name="memo" label="메모">
              <Input.TextArea rows={3} />
            </Form.Item>
          </Form>
        </>
      ) : null}
    </Modal>
  );
}
