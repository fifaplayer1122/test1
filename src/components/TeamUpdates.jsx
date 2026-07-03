import { useState } from 'react';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { Send, Bell, Zap, MessageSquare, Info, Clock, X } from 'lucide-react';
import { getUpdates, addUpdate, CATEGORIES } from '../lib/updatesStorage';
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

const CAT_ICONS = { update: Zap, blocker: Bell, question: MessageSquare, fyi: Info };

const CAT_ROW_STYLE = {
  update:   { pill: 'bg-blue-100 text-blue-700',   bar: 'bg-blue-500'   },
  blocker:  { pill: 'bg-red-100 text-red-700',     bar: 'bg-red-500'    },
  question: { pill: 'bg-purple-100 text-purple-700', bar: 'bg-purple-500' },
  fyi:      { pill: 'bg-gray-100 text-gray-600',   bar: 'bg-gray-400'   },
};

/* Compose modal */
function ComposeModal({ identity, onPost, onClose }) {
  const [text, setText] = useState('');
  const [category, setCategory] = useState('update');

  const post = () => {
    if (!text.trim()) return;
    onPost({ text: text.trim(), category });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-lg" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 text-white text-sm font-bold flex items-center justify-center">
              {identity[0]}
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">Post update</p>
              <p className="text-xs text-gray-400">{identity}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100"><X size={18} /></button>
        </div>

        <div className="px-5 py-4">
          <textarea
            rows={4}
            value={text}
            onChange={e => setText(e.target.value)}
            autoFocus
            placeholder="What's your current status? Any blockers or decisions needed?"
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:border-blue-400 mb-3"
            onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) post(); }}
          />

          <div className="flex gap-2 flex-wrap mb-1">
            {Object.entries(CATEGORIES).map(([key, cat]) => {
              const Icon = CAT_ICONS[key];
              const s = CAT_ROW_STYLE[key];
              return (
                <button key={key} onClick={() => setCategory(key)}
                  className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl border transition-all ${
                    category === key ? `${s.pill} border-current` : 'border-gray-200 text-gray-400 hover:border-gray-300'
                  }`}>
                  <Icon size={11} />{cat.label}
                </button>
              );
            })}
          </div>
          <p className="text-xs text-gray-400">Tip: ⌘+Enter to post</p>
        </div>

        <div className="flex gap-2.5 px-5 pb-5">
          <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-50">Cancel</button>
          <button onClick={post} disabled={!text.trim()}
            className="flex-1 flex items-center justify-center gap-1.5 bg-blue-600 text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-blue-700 disabled:opacity-40">
            <Send size={13} />Post Update
          </button>
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

  const [showCompose, setShowCompose] = useState(false);
  const [filter, setFilter] = useState('all');

  const post = ({ text, category }) => {
    if (!identity) return;
    const entry = { id: crypto.randomUUID(), author: identity, text, category, createdAt: new Date().toISOString() };
    addUpdate(entry).then(() => qc.invalidateQueries({ queryKey: ['updates'] }));
  };

  const filtered = updates.filter(u => {
    if (filter === 'blockers') return u.category === 'blocker';
    if (filter === 'mine') return u.author === identity;
    return true;
  });

  const blockerCount = updates.filter(u => u.category === 'blocker').length;

  /* Group by author for the summary strip */
  const byAuthor = {};
  for (const u of updates) {
    if (!byAuthor[u.author]) byAuthor[u.author] = [];
    byAuthor[u.author].push(u);
  }
  const authors = Object.keys(byAuthor);

  return (
    <div>
      {showCompose && identity && (
        <ComposeModal identity={identity} onPost={post} onClose={() => setShowCompose(false)} />
      )}

      {/* Header row */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-bold text-gray-900">Team Updates</h2>
          <p className="text-xs text-gray-400">{authors.length} member{authors.length !== 1 ? 's' : ''} · {updates.length} update{updates.length !== 1 ? 's' : ''}</p>
        </div>
        {identity && (
          <button onClick={() => setShowCompose(true)}
            className="flex items-center gap-1.5 bg-blue-600 text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-blue-700 transition-colors shadow-sm">
            <Send size={13} />Post Update
          </button>
        )}
      </div>

      {/* Member summary pills */}
      {authors.length > 0 && (
        <div className="flex gap-2 flex-wrap mb-4">
          {authors.map(author => {
            const authorUpdates = byAuthor[author];
            const hasBlocker = authorUpdates.some(u => u.category === 'blocker');
            return (
              <button key={author} onClick={() => setFilter(filter === 'mine' && identity === author ? 'all' : 'all')}
                className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border transition-all ${
                  hasBlocker
                    ? 'bg-red-50 border-red-200 text-red-700'
                    : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-gray-300'
                }`}>
                <span className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 text-white text-xs font-bold flex items-center justify-center">{author[0]}</span>
                {author}
                {hasBlocker && <Bell size={10} className="text-red-500" />}
                <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${hasBlocker ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-500'}`}>
                  {authorUpdates.length}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Filter bar */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xs text-gray-400 font-medium">Filter:</span>
        {[
          { id: 'all', label: 'All' },
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
        <span className="ml-auto text-xs text-gray-400">{filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <MessageSquare size={32} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm font-medium">No updates yet</p>
          <p className="text-xs mt-1 text-gray-300">Be the first to post a status update.</p>
          {identity && (
            <button onClick={() => setShowCompose(true)} className="mt-4 text-xs bg-blue-600 text-white px-4 py-2 rounded-xl font-semibold hover:bg-blue-700">Post Update</button>
          )}
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
          {/* Desktop table header */}
          <div className="hidden md:grid grid-cols-[140px_110px_1fr_90px] gap-4 items-center px-5 py-3 bg-gray-50 border-b border-gray-100">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Author</span>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Type</span>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Update</span>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider text-right">When</span>
          </div>

          <div className="divide-y divide-gray-100">
            {filtered.map(u => {
              const cat = CATEGORIES[u.category] || CATEGORIES.fyi;
              const Icon = CAT_ICONS[u.category] || Info;
              const s = CAT_ROW_STYLE[u.category] || CAT_ROW_STYLE.fyi;
              const isBlocker = u.category === 'blocker';

              return (
                <div key={u.id} className={`${isBlocker ? 'bg-red-50/20' : 'hover:bg-gray-50/40'} transition-colors`}>
                  {/* Desktop row */}
                  <div className="hidden md:grid grid-cols-[140px_110px_1fr_90px] gap-4 items-start px-5 py-3.5">
                    <div className="flex items-center gap-2 min-w-0">
                      {isBlocker && <span className="w-1 h-full absolute left-0 bg-red-400 rounded-r" />}
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                        {u.author[0]}
                      </div>
                      <span className="text-sm font-semibold text-gray-800 truncate">{u.author}</span>
                    </div>
                    <div className="flex items-center">
                      <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${s.pill}`}>
                        <Icon size={10} />{cat.label}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{u.text}</p>
                    <div className="flex items-center gap-1 justify-end text-xs text-gray-400 flex-shrink-0">
                      <Clock size={11} />{timeAgo(u.createdAt)}
                    </div>
                  </div>

                  {/* Mobile card */}
                  <div className="md:hidden px-4 py-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 text-white text-sm font-bold flex items-center justify-center flex-shrink-0">
                        {u.author[0]}
                      </div>
                      <span className="font-semibold text-sm text-gray-900 flex-1">{u.author}</span>
                      <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${s.pill}`}>
                        <Icon size={10} />{cat.label}
                      </span>
                      <span className="text-xs text-gray-400">{timeAgo(u.createdAt)}</span>
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed ml-10 whitespace-pre-wrap">{u.text}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
