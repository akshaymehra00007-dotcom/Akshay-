/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { LoginPage } from './components/auth/LoginPage';
import { AdminLayout } from './components/admin/AdminLayout';
import { StudentPortal } from './components/student/StudentPortal';

const AppContent: React.FC = () => {
  const { currentUser } = useApp();

  if (!currentUser) {
    return <LoginPage />;
  }

  if (currentUser.role === 'customer') {
    return <StudentPortal />;
  }

  return <AdminLayout />;
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
