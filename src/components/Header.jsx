import { logout, getAccount } from '../lib/auth';
import { CLIENT_ID } from '../lib/auth';

export default function Header({ activeCount, completedCount }) {
  const authEnabled = CLIENT_ID && CLIENT_ID !== 'YOUR_CLIENT_ID';
  const account = authEnabled ? getAccount() : null;

  return (
    <header className="px-4 py-3 sm:py-4 sm:px-6" style={{ background: 'linear-gradient(135deg, #0D1B2A 0%, #1B3A5B 100%)' }}>
      <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="bg-white/10 rounded-xl w-10 h-10 flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-lg">R</span>
          </div>
          <div className="min-w-0">
            <h1 className="text-white font-semibold text-base sm:text-xl leading-tight truncate">Ravi's Action Items</h1>
            <p className="text-blue-200 text-xs sm:text-sm">{activeCount} active · {completedCount} completed</p>
          </div>
        </div>
        {account && (
          <button
            onClick={logout}
            className="text-blue-300 hover:text-white text-xs border border-white/20 px-2.5 py-1.5 rounded-lg flex-shrink-0 transition-colors"
          >
            Sign out
          </button>
        )}
      </div>
    </header>
  );
}
