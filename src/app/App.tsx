import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LandingPage } from './components/LandingPage';
import { LoginPage } from './components/LoginPage';
import { MoradorDashboard } from './components/MoradorDashboard';
import { ZeladorDashboard } from './components/ZeladorDashboard';
import { SindicoDashboard } from './components/SindicoDashboard';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard/morador" element={<MoradorDashboard />} />
        <Route path="/dashboard/zelador" element={<ZeladorDashboard />} />
        <Route path="/dashboard/sindico" element={<SindicoDashboard />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}