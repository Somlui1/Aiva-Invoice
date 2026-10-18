import React, { createContext, useContext, useState } from 'react';
import { MOCK_USERS } from '../mock/users.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(MOCK_USERS[0]); // default ACC

  const switchUser = (userId) => {
    const user = MOCK_USERS.find(u => u.id === userId);
    if (user) setCurrentUser(user);
  };

  const switchRole = (role) => {
    const user = MOCK_USERS.find(u => u.role === role);
    if (user) setCurrentUser(user);
    else setCurrentUser(prev => ({ ...prev, role }));
  };

  const can = (action) => {
    const role = currentUser?.role;
    if (role === 'ADM') return true;
    if (role === 'SA') return action === 'AUDIT' || action === 'VIEW_LOGS';
    if (role === 'ACC') return action === 'VIEW_QUEUE' || action === 'VERIFY' || action === 'EDIT_DOC';
    if (role === 'FIN') return action === 'VIEW_QUEUE' || action === 'APPROVE' || action === 'VIEW_AP';
    if (role === 'EU') return action === 'VIEW_MINE' || action === 'CONFIRM_RECEIPT';
    return false;
  };

  return (
    <AuthContext.Provider value={{ currentUser, switchUser, switchRole, can, users: MOCK_USERS }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
