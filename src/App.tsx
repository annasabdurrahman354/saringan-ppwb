import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoginPage } from './pages/LoginPage';
import { GuruLayout } from './layouts/GuruLayout';
import { AdminLayout } from './layouts/AdminLayout';
import { DaftarPesertaPage } from './pages/guru/DaftarPesertaPage';
import { DetailPesertaPage } from './pages/guru/DetailPesertaPage';
import { NilaiPenyampaianPage } from './pages/guru/NilaiPenyampaianPage';
import { NilaiBacaanPage } from './pages/guru/NilaiBacaanPage';
import { AdminPeriodePage } from './pages/admin/AdminPeriodePage';
import { AdminPesertaPage } from './pages/admin/AdminPesertaPage';
import { AdminNilaiBacaanPage } from './pages/admin/AdminNilaiBacaanPage';
import { AdminNilaiPenyampaianPage } from './pages/admin/AdminNilaiPenyampaianPage';
import { AdminUserPage } from './pages/admin/AdminUserPage';
import { Toaster } from './components/ui/toaster';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LoginPage />} />

          <Route element={<ProtectedRoute allowedRoles={['guru', 'admin']} />}>
            <Route path="/guru" element={<GuruLayout />}>
              <Route index element={<Navigate to="/guru/daftar-peserta?action=detail" replace />} />
              <Route path="daftar-peserta" element={<DaftarPesertaPage />} />
              <Route path="detail/:pesertaId" element={<DetailPesertaPage />} />
              <Route path="nilai-penyampaian/:pesertaId" element={<NilaiPenyampaianPage />} />
              <Route path="nilai-bacaan/:pesertaId" element={<NilaiBacaanPage />} />
            </Route>
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Navigate to="/admin/periode" replace />} />
              <Route path="periode" element={<AdminPeriodePage />} />
              <Route path="peserta" element={<AdminPesertaPage />} />
              <Route path="nilai-bacaan" element={<AdminNilaiBacaanPage />} />
              <Route path="nilai-penyampaian" element={<AdminNilaiPenyampaianPage />} />
              <Route path="user" element={<AdminUserPage />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Toaster />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
