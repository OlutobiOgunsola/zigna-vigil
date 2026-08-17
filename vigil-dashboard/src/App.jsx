import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import './App.css';
import ProtectedRoute from './components/hoc/ProtectedRoute';
import { AuthProvider } from './context/auth.context';
import { ThemeProvider } from './context/theme.context';
import Login from './pages/auth/Login';
import Layout from './pages/dashboard/Layout';
import DashboardOverview from './pages/overview/index';
import SessionsList from './pages/sessions/index';
import ErrorsList from './pages/errors/index';
import ToolsList from './pages/tools/index';
import AIList from './pages/ai/index';
import HealthPage from './pages/health/index';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />

            <Route element={<ProtectedRoute />}>
              <Route element={<Layout />}>
                <Route path="/dashboard" element={<DashboardOverview />} />
                <Route path="/sessions" element={<SessionsList />} />
                <Route path="/tools" element={<ToolsList />} />
                <Route path="/ai" element={<AIList />} />
                <Route path="/errors" element={<ErrorsList />} />
                <Route path="/health" element={<HealthPage />} />
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
