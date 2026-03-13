import { Routes, Route, Navigate } from 'react-router-dom';
import RoleSelectPage from './RoleSelectPage';
import OwnerRegisterPage from './OwnerRegisterPage';
import HQRegisterPage from './HQRegisterPage';
import AdminRegisterPage from './AdminRegisterPage';
import DealerRegisterPage from './DealerRegisterPage';
import RegisterCompletePage from './RegisterCompletePage';

export default function RegisterPage() {
  return (
    <Routes>
      <Route index element={<RoleSelectPage />} />
      <Route path="owner" element={<OwnerRegisterPage />} />
      <Route path="hq" element={<HQRegisterPage />} />
      <Route path="admin" element={<AdminRegisterPage />} />
      <Route path="dealer" element={<DealerRegisterPage />} />
      <Route path="complete" element={<RegisterCompletePage />} />
      <Route path="*" element={<Navigate to="/register" replace />} />
    </Routes>
  );
}
