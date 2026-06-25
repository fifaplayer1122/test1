import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { UserMinus, CalendarDays, Plane, X, ClipboardPaste, Users, Calendar } from 'lucide-react';
import { getWorkforceReport, saveWorkforceReport } from '../lib/storage';
import Spinner from './Spinner';

// ─── Parser: SmartDocs tab-separated workforce format ────────────────────────
//
// Expected format (tab-separated, copied from Outlook/Excel table):
//
//   Today's Report  - June 25th 2026
//   SN  Employee Name  Reason  Duration  Department
//   1   Dakshay        ...     Full Day  Services
//
//   Upcoming Report - June 26th till July 31st '26
//   SN  Employee Name  Reason  Duration  Department
//   1   ...
//
//   Holiday - June 26th till July 31st '26
//   SN  Location  Day  Date  Occasion
//   1   US        Fri  July 03rd  Independence Day
//   (or "No Holidays" — skipped automatically)

function parseWorkforceEmail(text) {
  // Normalise line endings; split on newlines; keep raw tabs within lines
  const lines = text.split(/\r?\n/);

  const result = {
    summary: '',
    report_date: '',
    on_leave: [],
    upcoming_leave: [],
    holidays: [],
    parsed_at: new Date().toISOString(),
  };

  // Section header patterns
  const isTodayHeader    = l => /Today'?s\s+Report/i.test(l);
  const isUpcomingHeader = l => /Upcoming\s+Report/i.test(l);
  const isHolidayHeader  = l => /^Holiday\s*[-–]/i.test(l.trim());
  const isColHeader      = l => /^\s*SN\b/i.test(l);
  const isNoHolidays     = l => /No\s+Holidays/i.test(l);
  const isBlank          = l => l.trim() === '' || /^[\t\s]+$/.test(l);

  // Extract today's date from section header
  const todayMatch = text.match(/Today'?s\s+Report\s*[-–]?\s*([A-Za-z]+\s+\d+(?:st|nd|rd|th)?\s+\d{4})/i);
  if (todayMatch) result.report_date = todayMatch[1].replace(/\s+/g, ' ').trim();

  // Extract intro summary
  for (const line of lines) {
    const t = line.trim();
    if (t.length > 40 && /workforce|availability|posted|leave/i.test(t)) { result.summary = t; break; }
  }

  let section      = null; // 'today' | 'upcoming' | 'holiday'
  let skipSection  = false; // true when "No Holidays" seen

  for (const rawLine of lines) {
    const trimmed = rawLine.trim();

    // Detect section headers (check trimmed line)
    if (isTodayHeader(trimmed))    { section = 'today';    skipSection = false; continue; }
    if (isUpcomingHeader(trimmed)) { section = 'upcoming'; skipSection = false; continue; }
    if (isHolidayHeader(trimmed))  { section = 'holiday';  skipSection = false; continue; }

    // Skip column header rows and blank rows
    if (isColHeader(trimmed) || isBlank(trimmed)) continue;

    // "No Holidays" — mark this holiday block to skip
    if (section === 'holiday' && isNoHolidays(trimmed)) { skipSection = true; continue; }

    if (!section || skipSection) continue;

    // Split by tab (primary) — the format is always TSV when copied from Outlook table
    const cols = rawLine.split('\t').map(c => c.trim());

    // First column must be a row number (SN); skip if not
    if (!cols[0] || !/^\d+$/.test(cols[0])) continue;

    // cols: [SN, col1, col2, col3, col4]
    if (section === 'today' || section === 'upcoming') {
      const key = section === 'today' ? 'on_leave' : 'upcoming_leave';
      result[key].push({
        name:     cols[1] || '',
        reason:   cols[2] || '',
        duration: cols[3] || '',
        dept:     cols[4] || '',
      });
    } else if (section === 'holiday') {
      result.holidays.push({
        location: cols[1] || '',
        day:      cols[2] || '',
        date:     cols[3] || '',
        occasion: cols[4] || '',
      });
    }
  }

  return result;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionHeader({ icon: Icon, title, count, color }) {
  return (
    <div className={`flex items-center justify-between mb-3`}>
      <div className="flex items-center gap-2">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}`}>
          <Icon size={16} className="text-white" />
        </div>
        <h3 className="font-semibold text-gray-800">{title}</h3>
      </div>
      {count > 0 && (
        <span className="text-xs font-medium bg-gray-100 text-gray-600 px-2.5 py-0.5 rounded-full">{count} {count === 1 ? 'person' : 'people'}</span>
      )}
    </div>
  );
}

function LeaveTable({ rows }) {
  if (!rows?.length) return <p className="text-gray-400 text-sm py-2">None</p>;
  return (
    <>
      {/* Desktop */}
      <div className="hidden md:block bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              {['Employee', 'Reason', 'Duration', 'Dept'].map(h => (
                <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((r, i) => (
              <tr key={i} className="hover:bg-blue-50/40 transition-colors">
                <td className="px-4 py-3 font-medium text-gray-900">{r.name}</td>
                <td className="px-4 py-3 text-gray-600 max-w-xs">{r.reason || '—'}</td>
                <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{r.duration || '—'}</td>
                <td className="px-4 py-3">
                  {r.dept ? (
                    <span className="text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 rounded-full">{r.dept}</span>
                  ) : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Mobile */}
      <div className="md:hidden space-y-2">
        {rows.map((r, i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-xl p-3.5">
            <div className="flex items-start justify-between gap-2">
              <p className="font-semibold text-gray-900 text-sm">{r.name}</p>
              {r.dept && <span className="text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 rounded-full shrink-0">{r.dept}</span>}
            </div>
            {r.reason && <p className="text-xs text-gray-500 mt-1">{r.reason}</p>}
            {r.duration && <p className="text-xs text-gray-400 mt-0.5">⏱ {r.duration}</p>}
          </div>
        ))}
      </div>
    </>
  );
}

function HolidayTable({ rows }) {
  if (!rows?.length) return <p className="text-gray-400 text-sm py-2">None</p>;
  return (
    <>
      <div className="hidden md:block bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              {['Location', 'Day', 'Date', 'Occasion'].map(h => (
                <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((h, i) => (
              <tr key={i} className="hover:bg-blue-50/40 transition-colors">
                <td className="px-4 py-3 font-medium text-gray-900">{h.location || '—'}</td>
                <td className="px-4 py-3 text-gray-600">{h.day || '—'}</td>
                <td className="px-4 py-3 text-gray-600">{h.date || '—'}</td>
                <td className="px-4 py-3 text-gray-700 font-medium">{h.occasion || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="md:hidden space-y-2">
        {rows.map((h, i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-xl p-3.5">
            <p className="font-semibold text-gray-900 text-sm">{h.occasion}</p>
            <p className="text-xs text-gray-500 mt-0.5">{[h.location, h.day, h.date].filter(Boolean).join(' · ')}</p>
          </div>
        ))}
      </div>
    </>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function WorkforceTab() {
  const { data: report, isLoading } = useQuery({ queryKey: ['workforce'], queryFn: getWorkforceReport });
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');

  const handleSave = () => {
    if (!text.trim()) return;
    saveWorkforceReport(parseWorkforceEmail(text));
    queryClient.invalidateQueries({ queryKey: ['workforce'] });
    setOpen(false);
    setText('');
  };

  if (isLoading) return <Spinner />;

  const onLeave   = report?.on_leave || [];
  const upcoming  = report?.upcoming_leave || [];
  const holidays  = report?.holidays || [];

  return (
    <div>
      {/* Paste Dialog */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl p-6 max-w-2xl w-full mx-4">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <ClipboardPaste size={18} className="text-blue-600" /> Paste Workforce Email
              </h2>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600 rounded-lg p-1 hover:bg-gray-100"><X size={20} /></button>
            </div>
            <p className="text-xs text-gray-400 mb-3">Paste the full workforce email — the app will extract today's leave, upcoming leave, and holidays automatically.</p>
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              rows={16}
              autoFocus
              className="w-full border border-gray-200 rounded-xl p-3 text-sm font-mono focus:outline-none focus:border-blue-400 resize-none bg-gray-50"
              placeholder="Paste the workforce email here..."
            />
            <div className="flex gap-3 justify-end mt-4">
              <button onClick={() => setOpen(false)} className="px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">Cancel</button>
              <button
                onClick={handleSave}
                disabled={!text.trim()}
                className="px-5 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
              >
                Save Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top bar */}
      <div className="flex items-center justify-between mb-5">
        <div>
          {report?.report_date && (
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Report Date</p>
          )}
          {report?.report_date && (
            <p className="text-sm font-semibold text-gray-700">{report.report_date}</p>
          )}
        </div>
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-1.5 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
        >
          <ClipboardPaste size={15} /> Paste New Report
        </button>
      </div>

      {!report ? (
        <div className="text-center text-gray-400 py-20">
          <ClipboardPaste size={36} className="mx-auto mb-3 text-gray-300" />
          <p className="font-medium text-gray-500 mb-1">No workforce report yet.</p>
          <p className="text-sm">Click "Paste New Report" and paste the weekly email.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Summary banner */}
          {report.summary && (
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-2xl p-4 shadow-sm">
              <p className="text-sm font-medium opacity-90 leading-relaxed">{report.summary}</p>
              <div className="flex gap-4 mt-3 text-xs opacity-75">
                <span className="flex items-center gap-1"><Users size={12} /> {onLeave.length} on leave today</span>
                <span className="flex items-center gap-1"><Calendar size={12} /> {upcoming.length} upcoming</span>
                <span className="flex items-center gap-1"><Plane size={12} /> {holidays.length} holiday{holidays.length !== 1 ? 's' : ''}</span>
              </div>
            </div>
          )}

          {/* Today's leave */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
            <SectionHeader icon={UserMinus} title="On Leave Today" count={onLeave.length} color="bg-red-500" />
            <LeaveTable rows={onLeave} />
          </div>

          {/* Upcoming leave */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
            <SectionHeader icon={CalendarDays} title="Upcoming Leave" count={upcoming.length} color="bg-orange-500" />
            <LeaveTable rows={upcoming} />
          </div>

          {/* Holidays */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
            <SectionHeader icon={Plane} title="Upcoming Holidays" count={holidays.length} color="bg-blue-500" />
            <HolidayTable rows={holidays} />
          </div>

          {report.parsed_at && (
            <p className="text-center text-xs text-gray-300">Last updated {new Date(report.parsed_at).toLocaleString()}</p>
          )}
        </div>
      )}
    </div>
  );
}
