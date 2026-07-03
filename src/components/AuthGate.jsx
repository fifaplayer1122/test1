import { useEffect, useState } from 'react';
import { initMsal, login, logout, isAllowed, getAccount } from '../lib/auth';
import AppIcon from './AppIcon';

function MicrosoftIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 21 21" fill="none">
      <rect x="1"  y="1"  width="9" height="9" fill="#F25022"/>
      <rect x="11" y="1"  width="9" height="9" fill="#7FBA00"/>
      <rect x="1"  y="11" width="9" height="9" fill="#00A4EF"/>
      <rect x="11" y="11" width="9" height="9" fill="#FFB900"/>
    </svg>
  );
}

/* ── Decorative blobs for the left panel ── */
function Blobs() {
  return (
    <>
      <div className="absolute top-[-80px] right-[-80px] w-[340px] h-[340px] rounded-full bg-white/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-[60px] left-[-60px] w-[280px] h-[280px] rounded-full bg-blue-300/20 blur-3xl pointer-events-none" />
      <div className="absolute top-[45%] right-[5%] w-[180px] h-[180px] rounded-full bg-white/5 blur-2xl pointer-events-none" />
    </>
  );
}

/* ── Left branding panel ── */
function BrandPanel() {
  const features = [
    'Track team priorities across all members',
    'Weekend availability at a glance',
    'Real-time updates from your entire team',
  ];
  return (
    <div className="hidden lg:flex flex-col justify-between relative overflow-hidden flex-1 p-12"
      style={{ background: 'linear-gradient(145deg, #1a3faa 0%, #1d4ed8 40%, #2563eb 100%)' }}>
      <Blobs />

      {/* Top logo */}
      <div className="relative z-10 flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center backdrop-blur-sm border border-white/20">
          <AppIcon size={32} />
        </div>
        <div>
          <p className="text-white font-bold text-lg leading-tight">SmartDocs</p>
          <p className="text-blue-200 text-xs font-medium">Command Center</p>
        </div>
      </div>

      {/* Hero text */}
      <div className="relative z-10">
        <h1 className="text-white font-bold text-4xl leading-tight mb-4">
          SmartDocs<br />Command Center
        </h1>
        <p className="text-blue-200 text-base mb-10 leading-relaxed max-w-xs">
          One place for Ravi to see what the whole team is working on, instantly.
        </p>

        <div className="space-y-3.5">
          {features.map((f, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-white/15 border border-white/20 flex items-center justify-center flex-shrink-0 backdrop-blur-sm">
                <svg width="14" height="14" fill="none" viewBox="0 0 14 14">
                  <path d="M2.5 7l3 3 6-6" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <span className="text-blue-100 text-sm font-medium">{f}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <p className="relative z-10 text-blue-300/60 text-xs">SmartDocs · Internal Platform</p>
    </div>
  );
}

/* ── Shared right panel wrapper ── */
function RightPanel({ children }) {
  return (
    <div className="flex items-center justify-center min-h-screen lg:min-h-0 w-full lg:w-[440px] flex-shrink-0 bg-gray-50 px-6 py-12">
      <div className="w-full max-w-sm">
        {/* Logo for mobile / top of right panel */}
        <div className="flex items-center gap-2 mb-10">
          <AppIcon size={28} />
          <span className="text-sm font-bold text-gray-900">SmartDocs</span>
          <span className="text-gray-300 text-sm">|</span>
          <span className="text-sm font-medium text-gray-500">Command Center</span>
        </div>
        {children}
      </div>
    </div>
  );
}

/* ── Login screen ── */
function LoginScreen() {
  return (
    <div className="flex flex-col lg:flex-row min-h-screen">
      <BrandPanel />
      <RightPanel>
        <h2 className="text-2xl font-bold text-gray-900 mb-1">Hi there,</h2>
        <p className="text-gray-500 text-sm mb-8">Sign in with your SmartDocs Microsoft account to continue.</p>

        <button
          onClick={login}
          className="w-full flex items-center justify-center gap-3 bg-gray-900 hover:bg-gray-800 text-white font-semibold text-sm py-3.5 rounded-xl transition-colors shadow-sm mb-4"
        >
          <MicrosoftIcon />
          Login with Office 365
        </button>

        <p className="text-center text-xs text-gray-400 mt-6">
          Only SmartDocs team members have access.<br />Contact Ravi if you need help signing in.
        </p>
      </RightPanel>
    </div>
  );
}

/* ── Loading screen ── */
function LoadingScreen() {
  return (
    <div className="flex flex-col lg:flex-row min-h-screen">
      <BrandPanel />
      <RightPanel>
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-10 h-10 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-sm text-gray-500 font-medium">Signing you in…</p>
        </div>
      </RightPanel>
    </div>
  );
}

/* ── Access denied screen ── */
function DeniedScreen({ account }) {
  return (
    <div className="flex flex-col lg:flex-row min-h-screen">
      <BrandPanel />
      <RightPanel>
        <div className="text-center">
          <div className="w-14 h-14 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center mx-auto mb-5">
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
              <path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
                stroke="#ef4444" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-500 text-sm mb-1">
            <span className="font-medium text-gray-700">{account?.username}</span>
          </p>
          <p className="text-gray-400 text-sm mb-8">is not authorised to access this platform. Contact Ravi to request access.</p>
          <button onClick={logout}
            className="w-full py-3 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-100 transition-colors">
            Sign in with a different account
          </button>
        </div>
      </RightPanel>
    </div>
  );
}

/* ── Main gate ── */
export default function AuthGate({ children }) {
  const [state, setState]   = useState('loading');
  const [account, setAccount] = useState(null);

  useEffect(() => {
    initMsal().then(acc => {
      if (!acc) { setState('unauthenticated'); return; }
      setAccount(acc);
      setState(isAllowed(acc) ? 'allowed' : 'denied');
    }).catch(() => setState('unauthenticated'));
  }, []);

  if (state === 'loading')         return <LoadingScreen />;
  if (state === 'unauthenticated') return <LoginScreen />;
  if (state === 'denied')          return <DeniedScreen account={account} />;
  return children;
}
