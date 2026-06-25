import { useEffect, useState } from 'react';
import { initMsal, login, logout, isAllowed, getAccount } from '../lib/auth';

export default function AuthGate({ children }) {
  const [state, setState] = useState('loading'); // loading | allowed | denied | unauthenticated
  const [account, setAccount] = useState(null);

  useEffect(() => {
    initMsal().then(acc => {
      if (!acc) { setState('unauthenticated'); return; }
      setAccount(acc);
      setState(isAllowed(acc) ? 'allowed' : 'denied');
    }).catch(() => setState('unauthenticated'));
  }, []);

  if (state === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0D1B2A 0%, #1B3A5B 100%)' }}>
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white" />
      </div>
    );
  }

  if (state === 'unauthenticated') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'linear-gradient(135deg, #0D1B2A 0%, #1B3A5B 100%)' }}>
        <div className="bg-white rounded-2xl shadow-2xl p-10 max-w-sm w-full text-center">
          <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center mx-auto mb-6 text-white text-2xl font-bold">R</div>
          <h1 className="text-xl font-bold text-gray-900 mb-1">Ravi's Command Center</h1>
          <p className="text-gray-500 text-sm mb-8">Sign in with your SmartDocs Microsoft account to continue.</p>
          <button
            onClick={login}
            className="w-full flex items-center justify-center gap-3 border border-gray-300 rounded-xl px-5 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <MicrosoftIcon />
            Sign in with Microsoft
          </button>
        </div>
      </div>
    );
  }

  if (state === 'denied') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'linear-gradient(135deg, #0D1B2A 0%, #1B3A5B 100%)' }}>
        <div className="bg-white rounded-2xl shadow-2xl p-10 max-w-sm w-full text-center">
          <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4 text-red-500 text-2xl">✕</div>
          <h1 className="text-lg font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-500 text-sm mb-2">
            <span className="font-medium text-gray-700">{account?.username}</span> is not authorized to access this app.
          </p>
          <p className="text-gray-400 text-xs mb-6">Contact Ravi to request access.</p>
          <button onClick={logout} className="text-sm text-blue-600 hover:underline">Sign in with a different account</button>
        </div>
      </div>
    );
  }

  return children;
}

function MicrosoftIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="1" y="1" width="9" height="9" fill="#F25022"/>
      <rect x="11" y="1" width="9" height="9" fill="#7FBA00"/>
      <rect x="1" y="11" width="9" height="9" fill="#00A4EF"/>
      <rect x="11" y="11" width="9" height="9" fill="#FFB900"/>
    </svg>
  );
}
