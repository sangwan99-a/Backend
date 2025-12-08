import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppShell } from '@/layout/AppShell';
import { Dashboard } from '@/components/Dashboard';
import { Chat } from '@/components/Chat';
import { Email } from '@/components/Email';
import { Calendar } from '@/components/Calendar';
import { Tasks } from '@/components/Tasks';
import { Documents } from '@/components/Documents';
import { Knowledge } from '@/components/Knowledge';
import { Admin } from '@/components/Admin';
import useAuthStore from '@/store/authStore';
import { useAppStore } from '@/store/appStore';
import { UserRole } from '@/types/auth';
import './App.css';

export const App: React.FC = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);
  const theme = useAppStore((state) => state.theme);

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <Router>
      <AppShell>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/chat/:threadId" element={<Chat />} />
          <Route path="/email" element={<Email />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/tasks" element={<Tasks />} />
          <Route path="/documents" element={<Documents />} />
          <Route path="/knowledge" element={user ? <Knowledge currentUser={{ id: user.id, name: `${user.firstName} ${user.lastName}`, email: user.email, avatar: user.avatar }} /> : <Navigate to="/" replace />} />
          <Route path="/admin" element={user ? <Admin currentUser={{ id: user.id, name: `${user.firstName} ${user.lastName}`, email: user.email, role: user.role === UserRole.ADMIN ? 'super_admin' : 'tenant_admin' }} /> : <Navigate to="/" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppShell>
    </Router>
  );
};

const Login: React.FC = () => {
  return (
    <div className="login-container">
      <div className="login-box">
        <h1>FusionDesk</h1>
        <p>Sign in to your account</p>
        {/* Login form will go here */}
      </div>
    </div>
  );
};

export default App;
