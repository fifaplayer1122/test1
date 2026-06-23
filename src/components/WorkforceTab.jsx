import { useState, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { UserMinus, CalendarDays, Plane, X, Sparkles, Loader2, AlertCircle, ImagePlus, FileText } from 'lucide-react';
import { getWorkforceReport, saveWorkforceReport } from '../lib/storage';
import Spinner from './Spinner';

// ─── Smart Parser ────────────────────────────────────────────────────────────

function smartParse(text) {
  // Try JSON first
  try {
    const obj = JSON.parse(text);
    if (obj && (obj.on_leave || obj.upcoming_leave || obj.holidays)) {
      return { ...obj, parsed_at: new Date().toISOString() };
    }
  } catch {}

  const result = { on_leave: [], upcoming_leave: [], holidays: [], summary: '', parsed_at: new Date().toISOString() };

  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  let section = null;

  // Section detection patterns
  const isOnLeaveHeader = l => /on leave today|currently on leave|absent today|out today|on leave:/i.test(l);
  const isUpcomingHeader = l => /upcoming leave|future leave|planned leave|on leave this week|leave this week/i.test(l);
  const isHolidayHeader = l => /holiday|public holiday|bank holiday|upcoming holiday/i.test(l);
  const isTableHeader = l => /^(name|employee|staff)\b/i.test(l) && /(reason|leave|dept|department|duration)/i.test(l);

  // Try to extract a summary from first non-header paragraph
  const summaryLine = lines.find(l => l.length > 30 && !isOnLeaveHeader(l) && !isUpcomingHeader(l) && !isHolidayHeader(l));
  if (summaryLine) result.summary = summaryLine.slice(0, 200);

  for (const line of lines) {
    if (isOnLeaveHeader(line)) { section = 'on_leave'; continue; }
    if (isUpcomingHeader(line)) { section = 'upcoming_leave'; continue; }
    if (isHolidayHeader(line)) { section = 'holidays'; continue; }
    if (isTableHeader(line)) continue;

    // Skip section dividers
    if (/^[-=_]{3,}$/.test(line)) continue;

    const cleaned = line.replace(/^[-•*►✓\d]+[.)]\s*/, '').trim();
    if (!cleaned) continue;

    if (section === 'on_leave' || section === 'upcoming_leave') {
      const entry = parseLeaveEntry(cleaned);
      if (entry) result[section].push(entry);
    } else if (section === 'holidays') {
      const entry = parseHolidayEntry(cleaned);
      if (entry) result.holidays.push(entry);
    }
  }

  // Fallback: if no sections found, try to detect inline mentions
  if (!result.on_leave.length && !result.upcoming_leave.length) {
    const inlineLeave = extractInlineMentions(text);
    result.on_leave = inlineLeave.on_leave;
    result.upcoming_leave = inlineLeave.upcoming_leave;
  }

  return result;
}

function parseLeaveEntry(line) {
  // Pipe or tab delimited: Name | Reason | Duration | Dept
  const pipe = line.split(/\s*[|]\s*/);
  if (pipe.length >= 2) return { name: pipe[0], reason: pipe[1] || '', duration: pipe[2] || '', dept: pipe[3] || '' };

  // Tab delimited
  const tab = line.split(/\t/);
  if (tab.length >= 2) return { name: tab[0].trim(), reason: tab[1]?.trim() || '', duration: tab[2]?.trim() || '', dept: tab[3]?.trim() || '' };

  // Comma: Name, Reason, Duration, Dept
  const comma = line.split(/\s*,\s*/);
  if (comma.length >= 2 && comma[0].split(' ').length <= 4) {
    return { name: comma[0], reason: comma[1] || '', duration: comma[2] || '', dept: comma[3] || '' };
  }

  // Colon: Name: Reason
  const colon = line.match(/^([^:]+):\s*(.+)$/);
  if (colon && colon[1].split(' ').length <= 4) {
    return { name: colon[1].trim(), reason: colon[2].trim(), duration: '', dept: '' };
  }

  // Dash: Name - Reason
  const dash = line.match(/^([^-]+)\s+-\s+(.+)$/);
  if (dash && dash[1].split(' ').length <= 4) {
    return { name: dash[1].trim(), reason: dash[2].trim(), duration: '', dept: '' };
  }

  // Plain name (short line, looks like a name)
  if (line.split(' ').length <= 4 && /^[A-Z]/.test(line)) {
    return { name: line, reason: '', duration: '', dept: '' };
  }

  return null;
}

function parseHolidayEntry(line) {
  const pipe = line.split(/\s*[|]\s*/);
  if (pipe.length >= 2) return { location: pipe[0], day: pipe[1] || '', date: pipe[2] || '', occasion: pipe[3] || pipe[0] };

  const tab = line.split(/\t/);
  if (tab.length >= 2) return { location: tab[0].trim(), day: tab[1]?.trim() || '', date: tab[2]?.trim() || '', occasion: tab[3]?.trim() || tab[0].trim() };

  const comma = line.split(/\s*,\s*/);
  if (comma.length >= 2) return { location: comma[0], day: comma[1] || '', date: comma[2] || '', occasion: comma[3] || comma[0] };

  const dash = line.match(/^(.+?)\s*[-–]\s*(.+)$/);
  if (dash) return { location: '', day: '', date: dash[2].trim(), occasion: dash[1].trim() };

  return { location: '', day: '', date: '', occasion: line };
}

function extractInlineMentions(text) {
  const on_leave = [], upcoming_leave = [];
  // Match patterns like "John Smith is out", "Jane is on leave", "Bob will be on leave"
  const todayPattern = /([A-Z][a-z]+ (?:[A-Z][a-z]+ )?)\b(?:is out|is absent|is on leave|is off today|is sick)/g;
  const upcomingPattern = /([A-Z][a-z]+ (?:[A-Z][a-z]+ )?)\b(?:will be|will take|is taking|has requested|has approved)\b.{0,40}leave/gi;
  let m;
  while ((m = todayPattern.exec(text)) !== null) on_leave.push({ name: m[1].trim(), reason: '', duration: '', dept: '' });
  while ((m = upcomingPattern.exec(text)) !== null) upcoming_leave.push({ name: m[1].trim(), reason: '', duration: '', dept: '' });
  return { on_leave, upcoming_leave };
}

// ─── Components ──────────────────────────────────────────────────────────────

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
  const [mode, setMode] = useState('text'); // 'text' | 'image'
  const [text, setText] = useState('');
  const [imagePreview, setImagePreview] = useState(null);
  const [parsing, setParsing] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef();

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setError('');
    setParsing(true);
    try {
      let parsed;
      if (mode === 'image' && imagePreview) {
        // For image mode: extract visible text from the image name/alt and show a note
        // Since we have no API key, we can't do OCR — prompt user to copy text from screenshot
        setError('Image OCR requires an API key. Please switch to Text mode and paste the text from your screenshot.');
        setParsing(false);
        return;
      }
      if (!text.trim()) { setError('Please paste some text.'); setParsing(false); return; }
      parsed = smartParse(text);
      saveWorkforceReport(parsed);
      queryClient.invalidateQueries({ queryKey: ['workforce'] });
      setOpen(false);
      setText('');
      setImagePreview(null);
    } catch (e) {
      setError(e.message || 'Parsing failed.');
    } finally {
      setParsing(false);
    }
  };

  const handleClose = () => { if (!parsing) { setOpen(false); setText(''); setImagePreview(null); setError(''); } };

  if (isLoading) return <Spinner />;

  const totalOnLeave = report?.on_leave?.length || 0;
  const totalUpcoming = report?.upcoming_leave?.length || 0;

  return (
    <div>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={handleClose} />
          <div className="relative bg-white rounded-xl shadow-xl p-6 max-w-lg w-full mx-4">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Sparkles size={18} className="text-blue-500" /> Smart Paste
              </h2>
              <button onClick={handleClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>

            {/* Mode toggle */}
            <div className="flex gap-2 mb-4 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setMode('text')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-sm font-medium transition-colors ${mode === 'text' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <FileText size={15} /> Paste Text
              </button>
              <button
                onClick={() => setMode('image')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-sm font-medium transition-colors ${mode === 'image' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <ImagePlus size={15} /> Upload Screenshot
              </button>
            </div>

            {error && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3 mb-3 text-sm text-red-700">
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                {error}
              </div>
            )}

            {mode === 'text' ? (
              <textarea
                value={text}
                onChange={e => setText(e.target.value)}
                rows={12}
                disabled={parsing}
                className="w-full border border-gray-200 rounded-lg p-3 text-sm font-mono focus:outline-none focus:border-blue-400 resize-none disabled:opacity-60"
                placeholder={`Paste your workforce report in any format:

On Leave Today
John Smith | Sick Leave | 1 day | Engineering
Jane Doe | Vacation | 3 days | Marketing

Upcoming Leave
Bob Jones, Annual Leave, 5 days, Sales

Holidays
Independence Day | Thursday | July 4 | USA

Or plain sentences, emails, Slack messages — anything works.`}
              />
            ) : (
              <div>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
                {imagePreview ? (
                  <div className="relative rounded-lg overflow-hidden border border-gray-200 mb-2">
                    <img src={imagePreview} alt="Screenshot preview" className="w-full max-h-64 object-contain bg-gray-50" />
                    <button
                      onClick={() => { setImagePreview(null); fileRef.current.value = ''; }}
                      className="absolute top-2 right-2 bg-white border border-gray-200 rounded-full p-1 shadow hover:bg-red-50"
                    >
                      <X size={14} className="text-gray-500" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => fileRef.current.click()}
                    className="w-full h-40 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center gap-2 text-gray-400 hover:border-blue-400 hover:text-blue-500 transition-colors"
                  >
                    <ImagePlus size={32} />
                    <span className="text-sm font-medium">Click to upload screenshot</span>
                    <span className="text-xs">PNG, JPG, WEBP supported</span>
                  </button>
                )}
                <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg p-2 mt-2">
                  Screenshot reading requires an Anthropic API key (not configured). Use <strong>Paste Text</strong> mode instead — copy the text from your screenshot and paste it there.
                </p>
              </div>
            )}

            <div className="flex gap-3 justify-end mt-4">
              <button onClick={handleClose} disabled={parsing} className="px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50">Cancel</button>
              <button
                onClick={handleSave}
                disabled={parsing || (mode === 'text' ? !text.trim() : !imagePreview)}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 min-w-[120px] justify-center"
              >
                {parsing ? <><Loader2 size={15} className="animate-spin" /> Parsing...</> : <><Sparkles size={15} /> Parse & Save</>}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-end mb-4">
        <button
          onClick={() => { setOpen(true); setError(''); }}
          className="flex items-center gap-1.5 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <Sparkles size={15} /> Smart Paste
        </button>
      </div>

      {!report ? (
        <div className="text-center text-gray-400 py-16 text-sm">
          <Sparkles size={32} className="mx-auto mb-3 text-gray-300" />
          <p className="font-medium text-gray-500 mb-1">No workforce report yet.</p>
          <p>Click "Smart Paste" and paste any email, table, or report text.</p>
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
                      <tr>{['Employee', 'Reason', 'Duration', 'Dept'].map(h => (
                        <th key={h} className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                      ))}</tr>
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
                      <tr>{['Employee', 'Reason', 'Duration', 'Dept'].map(h => (
                        <th key={h} className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                      ))}</tr>
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
                      <tr>{['Location', 'Day', 'Date', 'Occasion'].map(h => (
                        <th key={h} className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                      ))}</tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {report.holidays.map((h, i) => (
                        <tr key={i} className="hover:bg-gray-50">
                          <td className="px-4 py-2 font-medium text-gray-900">{h.location || '—'}</td>
                          <td className="px-4 py-2 text-gray-600">{h.day || '—'}</td>
                          <td className="px-4 py-2 text-gray-600">{h.date || '—'}</td>
                          <td className="px-4 py-2 text-gray-600">{h.occasion || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="md:hidden space-y-2">
                  {report.holidays.map((h, i) => (
                    <div key={i} className="bg-white border border-gray-200 rounded-lg p-3">
                      <p className="font-medium text-gray-900 text-sm">{h.occasion}</p>
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
