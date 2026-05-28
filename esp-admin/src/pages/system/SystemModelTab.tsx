import { useState } from 'react';
import {
  Table,
  Button,
  Modal,
  Input,
  Form,
  Switch,
  Popconfirm,
  message,
  Badge,
  Space,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { formatDate } from '../../utils/formatters';
import {
  useAllEquipmentModels,
  useCreateModel,
  useUpdateModel,
  useDeleteModel,
} from '../../api/equipment.api';
import type { EquipmentModel } from '../../types/equipment.types';

type ModelFormValues = {
  modelName: string;
  manufacturer?: string;
  isActive?: boolean;
};

export default function SystemModelTab() {
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<EquipmentModel | null>(null);
  const [form] = Form.useForm<ModelFormValues>();

  const { data: modelsRes, isLoading } = useAllEquipmentModels();
  const createMutation = useCreateModel();
  const updateMutation = useUpdateModel();
  const deleteMutation = useDeleteModel();

  const models = modelsRes?.data ?? [];

  const openCreate = () => {
    setEditTarget(null);
    form.resetFields();
    form.setFieldsValue({ isActive: true });
    setModalOpen(true);
  };

  const openEdit = (record: EquipmentModel) => {
    setEditTarget(record);
    form.setFieldsValue({
      modelName: record.modelName,
      manufacturer: record.manufacturer ?? '',
      isActive: record.isActive,
    });
    setModalOpen(true);
  };

  const handleOk = async () => {
    const values = await form.validateFields();
    try {
      if (editTarget) {
        await updateMutation.mutateAsync({ modelId: editTarget.modelId, data: values });
        message.success('모델이 수정되었습니다.');
      } else {
        await createMutation.mutateAsync({
          modelName: values.modelName,
          manufacturer: values.manufacturer || undefined,
        });
        message.success('모델이 등록되었습니다.');
      }
      setModalOpen(false);
    } catch {
      message.error('저장에 실패했습니다.');
    }
  };

  const handleDelete = async (modelId: number) => {
    try {
      await deleteMutation.mutateAsync(modelId);
      message.success('모델이 삭제되었습니다.');
    } catch {
      message.error('삭제에 실패했습니다.');
    }
  };

  const columns: ColumnsType<EquipmentModel> = [
    {
      title: '모델명',
      dataIndex: 'modelName',
      key: 'modelName',
      width: 200,
    },
    {
      title: '제조사',
      dataIndex: 'manufacturer',
      key: 'manufacturer',
      width: 160,
      render: (v?: string) => v ?? '—',
    },
    {
      title: '상태',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 100,
      render: (v: boolean) =>
        v ? (
          <Badge status="success" text="활성" />
        ) : (
          <Badge status="default" text="비활성" />
        ),
    },
    {
      title: '등록일',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      render: (v: string) => formatDate(v),
    },
    {
      title: '작업',
      key: 'actions',
      width: 120,
      render: (_, record) => (
        <Space>
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => openEdit(record)}
          />
          <Popconfirm
            title="이 모델을 삭제하시겠습니까?"
            onConfirm={() => handleDelete(record.modelId)}
            okText="삭제"
            cancelText="취소"
            okButtonProps={{ danger: true }}
          >
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
          모델 등록
        </Button>
      </div>

      <Table
        rowKey="modelId"
        columns={columns}
        dataSource={models}
        loading={isLoading}
        pagination={{ pageSize: 20, showSizeChanger: false }}
        size="middle"
      />

      <Modal
        title={editTarget ? '모델 수정' : '모델 등록'}
        open={modalOpen}
        onOk={handleOk}
        onCancel={() => setModalOpen(false)}
        confirmLoading={isPending}
        okText={editTarget ? '저장' : '등록'}
        cancelText="취소"
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="modelName"
            label="모델명"
            rules={[{ required: true, message: '모델명을 입력하세요' }]}
          >
            <Input placeholder="예: MB-ESP-5000" />
          </Form.Item>
          <Form.Item name="manufacturer" label="제조사">
            <Input placeholder="예: MetaBeans" />
          </Form.Item>
          {editTarget && (
            <Form.Item name="isActive" label="활성화" valuePropName="checked">
              <Switch checkedChildren="활성" unCheckedChildren="비활성" />
            </Form.Item>
          )}
        </Form>
      </Modal>
    </div>
  );
}
