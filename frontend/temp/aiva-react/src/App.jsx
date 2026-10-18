import React, { useEffect } from 'react';
import SplashScreen from './components/SplashScreen.jsx';
import AppShell from './components/AppShell.jsx';
import ModalHost from './components/ModalHost.jsx';
import ToastHost from './components/ToastHost.jsx';
import { initialize } from './runtime/bridge.js';
export default function App() {
  useEffect(() => { initialize(); }, []);
  return <><SplashScreen /><AppShell /><ModalHost /><ToastHost /></>;
}
