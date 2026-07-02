import { useState } from 'react';
import { useQueryClient, useQuery, useMutation } from '@tanstack/react-query';
import { Send, Bell, Filter, Clock, Zap, MessageSquare, Info, ChevronDown } from 'lucide-react';
import { getUpdates, saveUpdates, addUpdate, CATEGORIES } from '../lib/updatesStorage';
import { ADMINS, getIdentity } from '../lib/teamStorage';
import { getAccount, CLIENT_ID } from '../lib/auth';

function resolveIdentity() {
  const authEnabled = CLIENT_ID && CLIENT_ID !== 'YOUR_CLIENT_ID';
  if (authEnabled) {
    const account = getAccount();
    if (account) return (account.name || account.username || '').split(' ')[0];
  }
  return getIdentity();
}

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return d === 1 ? 'yesterday' : `${d}d ago`;
}

const CAT_ICONS = {
  update:   Zap,
  blocker:  Bell,
  question: MessageSquare,
  fyi:      Info,
};

function UpdateCard({ update, isAdmin }) {
  const cat = CATEGORIES[update.category] || CATEGORIES.fyi;
  const Icon = CAT_ICONS[update.category] || Info;
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 text-white text-sm font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
          {update.author[0]}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1.5">
            <span className="font-semibold text-sm text-gray-900">{update.author}</span>
            <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${cat.color}`}>
              <Icon size={11} />{cat.label}
            </span>
            <span className="text-xs text-gray-400 ml-auto flex-shrink-0 flex items-center gap-1">
              <Clock size={11} />{timeAgo(update.createdAt)}
            </span>
          </div>
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{update.text}</p>
        </div>
      </div>
    </div>
  );
}

export default function TeamUpdates() {
  const identity = resolveIdentity();
  const isAdmin = ADMINS.includes(identity);
  const qc = useQueryClient();

  const { data: updates = [] } = useQuery({ queryKey: ['updates'], queryFn: getUpdates });

  const [text, setText]         = useState('');
  const [category, setCategory] = useState('update');
  const [filter, setFilter]     = useState('all'); // all | blockers | mine

  const post = () => {
    if (!text.trim() || !identity) return;
    addUpdate({ id: crypto.randomUUID(), author: identity, text: text.trim(), category, createdAt: new Date().toISOString() });
    qc.invalidateQueries({ queryKey: ['updates'] });
    setText('');
    setCategory('update');
  };

  const filtered = updates.filter(u => {
    if (filter === 'blockers') return u.category === 'blocker';
    if (filter === 'mine') return u.author === identity;
    return true;
  });

  const blockerCount = updates.filter(u => u.category === 'blocker').length;

  return (
    <div className="max-w-2xl mx-auto">

      {/* Compose box */}
      {identity && (
        <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm mb-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 text-white text-sm font-bold flex items-center justify-center flex-shrink-0">
              {identity[0]}
            </div>
            <span className="text-sm font-medium text-gray-700">Post an update, {identity}</span>
          </div>

          <textarea
            rows={3}
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="What's your current status? Any blockers or decisions needed?"
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:border-blue-400 mb-3"
            onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) post(); }}
          />

          <div className="flex items-center gap-2">
            <div className="flex gap-1.5 overflow-x-auto flex-1 pb-0.5 scrollbar-hide">
              {Object.entries(CATEGORIES).map(([key, cat]) => {
                const Icon = CAT_ICONS[key];
                return (
                  <button key={key} onClick={() => setCategory(key)}
                    className={`flex items-center gap-1 text-xs font-medium px-3 py-2 rounded-xl border transition-all flex-shrink-0 ${
                      category === key ? cat.color + ' border-current' : 'border-gray-200 text-gray-500 hover:border-gray-300'
                    }`}>
                    <Icon size={11} />{cat.label}
                  </button>
                );
              })}
            </div>
            <button
              onClick={post}
              disabled={!text.trim()}
              className="flex items-center gap-1.5 bg-blue-600 text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-blue-700 disabled:opacity-40 transition-colors flex-shrink-0"
            >
              <Send size={13} />Post
            </button>
          </div>
        </div>
      )}

      {/* Filter bar */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xs text-gray-400 font-medium mr-1">Show:</span>
        {[
          { id: 'all', label: 'All updates' },
          { id: 'blockers', label: `Blockers${blockerCount > 0 ? ` (${blockerCount})` : ''}` },
          { id: 'mine', label: 'Mine' },
        ].map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)}
            className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition-all ${
              filter === f.id
                ? f.id === 'blockers' ? 'bg-red-500 text-white border-red-500' : 'bg-blue-600 text-white border-blue-600'
                : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
            }`}>
            {f.label}
          </button>
        ))}
        <span className="ml-auto text-xs text-gray-400">{filtered.length} post{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Feed */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <MessageSquare size={32} className="mx-auto mb-3 opacity-40" />
          <p className="text-sm">No updates yet.</p>
          <p className="text-xs mt-1">Be the first to post a status update.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(u => <UpdateCard key={u.id} update={u} isAdmin={isAdmin} />)}
        </div>
      )}
    </div>
  );
}
