import { Menu, Space, Button, Dropdown } from 'antd';
import {
  LogoutOutlined,
  UserOutlined,
  KeyOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useUiStore } from '../../stores/uiStore';
import { MENU_ITEMS } from '../../utils/roleHelper';
import { useTopMenuSectionVisibility } from '../../hooks/useTopMenuSectionVisibility';
import RoleBadge from './RoleBadge';
import EmergencyAlarmPanel from '../../pages/dashboard/components/EmergencyAlarmPanel';

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const selectEquipment = useUiStore((s) => s.selectEquipment);
  const clearSelection = useUiStore((s) => s.clearSelection);

  const role = user?.role;
  const { showMenuKey } = useTopMenuSectionVisibility();

  const menuItems = MENU_ITEMS.filter((item) => showMenuKey(item.key)).map((item) => ({
    key: item.key,
    label: item.label,
  }));

  const currentMenuKey =
    MENU_ITEMS.find((item) => location.pathname.startsWith(item.path))?.key ?? 'dashboard';

  const handleMenuClick = ({ key }: { key: string }) => {
    const item = MENU_ITEMS.find((m) => m.key === key);
    if (item) {
      if (key === 'dashboard') clearSelection();
      navigate(item.path);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleAlarmClick = (equipmentId: number) => {
    selectEquipment(equipmentId);
    navigate('/dashboard');
  };

  const userMenuItems = [
    {
      key: 'profile',
      label: (
        <Space>
          <UserOutlined />
          {user?.name ?? '사용자'}
          {role && <RoleBadge role={role} />}
        </Space>
      ),
      disabled: true,
    },
    { type: 'divider' as const },
    {
      key: 'change-password',
      label: (
        <Space>
          <KeyOutlined />
          암호 변경
        </Space>
      ),
      onClick: () => navigate('/change-password'),
    },
    {
      key: 'logout',
      label: (
        <Space>
          <LogoutOutlined />
          로그아웃
        </Space>
      ),
      onClick: handleLogout,
    },
  ];

  return (
    <header
      style={{
        height: 64,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'var(--color-white)',
        padding: '0 24px',
        borderBottom: '1px solid var(--color-border)',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 24, minWidth: 0, flex: 1 }}>
        <span
          style={{
            fontSize: '1.25rem',
            fontWeight: 700,
            color: 'var(--color-primary)',
            whiteSpace: 'nowrap',
          }}
        >
          MetaBeans ESP
        </span>
        <Menu
          mode="horizontal"
          selectedKeys={[currentMenuKey]}
          items={menuItems}
          onClick={handleMenuClick}
          overflowedIndicator={null}
          style={{ border: 'none', flex: 1, minWidth: 0, background: 'transparent' }}
        />
      </div>

      <Space size="middle">
        <EmergencyAlarmPanel onAlarmClick={handleAlarmClick} />
        <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
          <Button type="text" icon={<UserOutlined />}>
            {user?.name}
          </Button>
        </Dropdown>
      </Space>
    </header>
  );
}
