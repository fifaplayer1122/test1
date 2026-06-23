import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { UserMinus, CalendarDays, Plane, X, Sparkles, Key, Loader2, AlertCircle } from 'lucide-react';
import { getWorkforceReport, saveWorkforceReport } from '../lib/storage';
import Spinner from './Spinner';

const API_KEY_STORAGE = 'ceo_anthropic_key';

function getApiKey() { return localStorage.getItem(API_KEY_STORAGE) || ''; }
function saveApiKey(key) { localStorage.setItem(API_KEY_STORAGE, key); }

async function parseWithAI(text, apiKey) {
  const prompt = `You are a data extraction assistant. Extract workforce leave and holiday information from the following text and return ONLY a valid JSON object with this exact structure:

{
  "on_leave": [{"name": "", "reason": "", "duration": "", "dept": ""}],
  "upcoming_leave": [{"name": "", "reason": "", "duration": "", "dept": ""}],
  "holidays": [{"location": "", "day": "", "date": "", "occasion": ""}],
  "summary": "brief summary of the report"
}

Rules:
- Extract ALL people on leave today into on_leave
- Extract ALL future/upcoming leave into upcoming_leave
- Extract ALL holidays into holidays
- If a field is unknown, use empty string ""
- Return ONLY the JSON, no explanation, no markdown

Text to parse:
${text}`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.error?.message || `API error ${response.status}`);
  }

  const data = await response.json();
  const content = data.content?.[0]?.text || '';
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('No JSON found in AI response');
  return { ...JSON.parse(jsonMatch[0]), parsed_at: new Date().toISOString() };
}

function Section({ icon: Icon, title, children }) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <Icon size={18} className="text-blue-600" />
        <h3 className="font-semibold text-gray-800">{title}</h3>
      </div>
      {children}
    </div>
  );
}

export default function WorkforceTab() {
  const { data: report, isLoading } = useQuery({ queryKey: ['workforce'], queryFn: getWorkforceReport });
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [parsing, setParsing] = useState(false);
  const [error, setError] = useState('');
  const [apiKey, setApiKey] = useState(getApiKey);
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [keyDraft, setKeyDraft] = useState('');

  const handleSave = async () => {
    if (!text.trim()) return;
    setError('');
    const key = getApiKey();
    if (!key) {
      setError('Please add your Anthropic API key first (click the key icon).');
      return;
    }
    setParsing(true);
    try {
      const parsed = await parseWithAI(text, key);
      saveWorkforceReport(parsed);
      queryClient.invalidateQueries({ queryKey: ['workforce'] });
      setOpen(false);
      setText('');
    } catch (e) {
      setError(e.message || 'Parsing failed. Check your API key and try again.');
    } finally {
      setParsing(false);
    }
  };

  const handleSaveKey = () => {
    saveApiKey(keyDraft.trim());
    setApiKey(keyDraft.trim());
    setShowKeyInput(false);
    setKeyDraft('');
    setError('');
  };

  if (isLoading) return <Spinner />;

  const totalOnLeave = report?.on_leave?.length || 0;
  const totalUpcoming = report?.upcoming_leave?.length || 0;

  return (
    <div>
      {/* API Key Dialog */}
      {showKeyInput && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowKeyInput(false)} />
          <div className="relative bg-white rounded-xl shadow-xl p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2"><Key size={18} /> Anthropic API Key</h2>
              <button onClick={() => setShowKeyInput(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              Your key is stored only in your browser (localStorage). Get one at{' '}
              <a href="https://console.anthropic.com" target="_blank" rel="noreferrer" className="text-blue-600 underline">console.anthropic.com</a>.
            </p>
            <input
              type="password"
              value={keyDraft}
              onChange={e => setKeyDraft(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSaveKey()}
              placeholder="sk-ant-..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 mb-4"
            />
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowKeyInput(false)} className="px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">Cancel</button>
              <button onClick={handleSaveKey} disabled={!keyDraft.trim()} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">Save Key</button>
            </div>
          </div>
        </div>
      )}

      {/* Paste Dialog */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => { if (!parsing) setOpen(false); }} />
          <div className="relative bg-white rounded-xl shadow-xl p-6 max-w-lg w-full mx-4">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Sparkles size={18} className="text-blue-500" /> AI Smart Paste
              </h2>
              <button onClick={() => { if (!parsing) setOpen(false); }} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <p className="text-xs text-gray-400 mb-3">Paste anything — emails, tables, bullet points, plain text. AI will extract the data.</p>

            {error && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3 mb-3 text-sm text-red-700">
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                {error}
              </div>
            )}

            {!apiKey && (
              <div className="flex items-center gap-2 bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-3 text-sm text-yellow-800">
                <Key size={15} className="shrink-0" />
                No API key set.{' '}
                <button onClick={() => { setOpen(false); setShowKeyInput(true); }} className="underline font-medium">Add your Anthropic key</button>
              </div>
            )}

            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              rows={12}
              disabled={parsing}
              className="w-full border border-gray-200 rounded-lg p-3 text-sm font-mono focus:outline-none focus:border-blue-400 resize-none disabled:opacity-60"
              placeholder={`Paste any workforce report here. Examples:

"John is out sick today, Jane has vacation this Friday through Monday in Engineering..."

Or a forwarded email, a Slack message, a table, a CSV — anything works.`}
            />
            <div className="flex gap-3 justify-between mt-4 items-center">
              <button
                onClick={() => { setOpen(false); setShowKeyInput(true); }}
                className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1"
              >
                <Key size={13} /> {apiKey ? 'Change API key' : 'Add API key'}
              </button>
              <div className="flex gap-3">
                <button onClick={() => setOpen(false)} disabled={parsing} className="px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50">Cancel</button>
                <button
                  onClick={handleSave}
                  disabled={parsing || !text.trim()}
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 min-w-[110px] justify-center"
                >
                  {parsing ? <><Loader2 size={15} className="animate-spin" /> Parsing...</> : <><Sparkles size={15} /> Parse & Save</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-end gap-2 mb-4">
        <button
          onClick={() => { setShowKeyInput(true); setKeyDraft(apiKey); }}
          className="flex items-center gap-1.5 border border-gray-300 text-gray-600 px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
          title="Set Anthropic API key"
        >
          <Key size={15} />
          {apiKey ? 'API Key ✓' : 'Add API Key'}
        </button>
        <button
          onClick={() => { setOpen(true); setError(''); }}
          className="flex items-center gap-1.5 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <Sparkles size={15} /> AI Smart Paste
        </button>
      </div>

      {!report ? (
        <div className="text-center text-gray-400 py-16 text-sm">
          <Sparkles size={32} className="mx-auto mb-3 text-gray-300" />
          <p className="font-medium text-gray-500 mb-1">No workforce report yet.</p>
          <p>Click "AI Smart Paste" and paste any email or report — AI will extract the data.</p>
        </div>
      ) : (
        <>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-blue-800 text-sm font-medium">
              {totalOnLeave} on leave today · {totalUpcoming} upcoming leaves
              {report.parsed_at && (
                <span className="text-blue-500 font-normal"> · Updated {new Date(report.parsed_at).toLocaleString()}</span>
              )}
            </p>
            {report.summary && <p className="text-blue-700 text-sm mt-1">{report.summary}</p>}
          </div>

          <Section icon={UserMinus} title="On Leave Today">
            {!report.on_leave?.length ? (
              <p className="text-gray-400 text-sm">No one on leave today.</p>
            ) : (
              <>
                <div className="hidden md:block bg-white border border-gray-200 rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        {['Employee', 'Reason', 'Duration', 'Dept'].map(h => (
                          <th key={h} className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {report.on_leave.map((r, i) => (
                        <tr key={i} className="hover:bg-gray-50">
                          <td className="px-4 py-2 font-medium text-gray-900">{r.name}</td>
                          <td className="px-4 py-2 text-gray-600">{r.reason || '—'}</td>
                          <td className="px-4 py-2 text-gray-600">{r.duration || '—'}</td>
                          <td className="px-4 py-2 text-gray-600">{r.dept || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="md:hidden space-y-2">
                  {report.on_leave.map((r, i) => (
                    <div key={i} className="bg-white border border-gray-200 rounded-lg p-3">
                      <p className="font-medium text-gray-900 text-sm">{r.name}</p>
                      {r.reason && <p className="text-xs text-gray-500">{r.reason}</p>}
                      {(r.duration || r.dept) && <p className="text-xs text-gray-400">{r.duration}{r.dept ? ` · ${r.dept}` : ''}</p>}
                    </div>
                  ))}
                </div>
              </>
            )}
          </Section>

          <Section icon={CalendarDays} title="Upcoming Leave">
            {!report.upcoming_leave?.length ? (
              <p className="text-gray-400 text-sm">No upcoming leaves.</p>
            ) : (
              <>
                <div className="hidden md:block bg-white border border-gray-200 rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        {['Employee', 'Reason', 'Duration', 'Dept'].map(h => (
                          <th key={h} className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {report.upcoming_leave.map((r, i) => (
                        <tr key={i} className="hover:bg-gray-50">
                          <td className="px-4 py-2 font-medium text-gray-900">{r.name}</td>
                          <td className="px-4 py-2 text-gray-600">{r.reason || '—'}</td>
                          <td className="px-4 py-2 text-gray-600">{r.duration || '—'}</td>
                          <td className="px-4 py-2 text-gray-600">{r.dept || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="md:hidden space-y-2">
                  {report.upcoming_leave.map((r, i) => (
                    <div key={i} className="bg-white border border-gray-200 rounded-lg p-3">
                      <p className="font-medium text-gray-900 text-sm">{r.name}</p>
                      {r.reason && <p className="text-xs text-gray-500">{r.reason}</p>}
                      {(r.duration || r.dept) && <p className="text-xs text-gray-400">{r.duration}{r.dept ? ` · ${r.dept}` : ''}</p>}
                    </div>
                  ))}
                </div>
              </>
            )}
          </Section>

          <Section icon={Plane} title="Upcoming Holidays">
            {!report.holidays?.length ? (
              <p className="text-gray-400 text-sm">No holidays listed.</p>
            ) : (
              <>
                <div className="hidden md:block bg-white border border-gray-200 rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        {['Location', 'Day', 'Date', 'Occasion'].map(h => (
                          <th key={h} className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {report.holidays.map((h, i) => (
                        <tr key={i} className="hover:bg-gray-50">
                          <td className="px-4 py-2 font-medium text-gray-900">{h.location || '—'}</td>
                          <td className="px-4 py-2 text-gray-600">{h.day || '—'}</td>
                          <td className="px-4 py-2 text-gray-600">{h.date || '—'}</td>
                          <td className="px-4 py-2 text-gray-600">{h.occasion || h.name || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="md:hidden space-y-2">
                  {report.holidays.map((h, i) => (
                    <div key={i} className="bg-white border border-gray-200 rounded-lg p-3">
                      <p className="font-medium text-gray-900 text-sm">{h.occasion || h.name}</p>
                      {(h.date || h.day) && <p className="text-xs text-gray-500">{h.date}{h.day ? ` · ${h.day}` : ''}</p>}
                      {h.location && <p className="text-xs text-gray-400">{h.location}</p>}
                    </div>
                  ))}
                </div>
              </>
            )}
          </Section>
        </>
      )}
    </div>
  );
}
