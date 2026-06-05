import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { CadastroPage } from './components/CadastroPage';
import { LandingPage } from './components/LandingPage';
import { LoginPage } from './components/LoginPage';
import { MoradorDashboard } from './components/MoradorDashboard';
import { SindicoDashboard } from './components/SindicoDashboard';
import { ZeladorDashboard } from './components/ZeladorDashboard';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/cadastro" element={<CadastroPage />} />
        <Route path="/dashboard/morador" element={<MoradorDashboard />} />
        <Route path="/dashboard/zelador" element={<ZeladorDashboard />} />
        <Route path="/dashboard/sindico" element={<SindicoDashboard />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}