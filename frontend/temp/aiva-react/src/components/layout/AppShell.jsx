import React from 'react';
import { Sidebar } from './Sidebar.jsx';
import { Topbar } from './Topbar.jsx';

export function AppShell({ currentPage, onNavigate, children }) {
  return (
    <div className="shell" id="shell">
      <Topbar currentPage={currentPage} />
      <div className="body">
        <Sidebar currentPage={currentPage} onNavigate={onNavigate} />
        <main className="main" id="app">
          {children}
        </main>
      </div>
    </div>
  );
}

export default AppShell;
