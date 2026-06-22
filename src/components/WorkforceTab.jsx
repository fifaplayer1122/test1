import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { UserMinus, CalendarDays, Plane, X } from 'lucide-react';
import { getWorkforceReport, saveWorkforceReport } from '../lib/storage';
import Spinner from './Spinner';

function parseWorkforceText(text) {
  // Try JSON first
  try {
    const obj = JSON.parse(text);
    if (obj && (obj.on_leave || obj.upcoming_leave || obj.holidays)) {
      return { ...obj, parsed_at: new Date().toISOString() };
    }
  } catch {}

  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

  const result = {
    on_leave: [],
    upcoming_leave: [],
    holidays: [],
    raw_summary: text.slice(0, 500),
    parsed_at: new Date().toISOString(),
  };

  let section = null;

  for (const line of lines) {
    const lower = line.toLowerCase();
    if (lower.match(/on leave today|currently on leave|on leave:/)) { section = 'on_leave'; continue; }
    if (lower.match(/upcoming leave|future leave|planned leave/)) { section = 'upcoming_leave'; continue; }
    if (lower.match(/holiday|public holiday|bank holiday/)) { section = 'holidays'; continue; }
    // Skip header rows
    if (lower.match(/^(name|employee|staff)\b/) && lower.match(/(reason|leave|dept|department)/)) continue;

    if (section === 'on_leave' || section === 'upcoming_leave') {
      // Tab or pipe delimited
      const parts = line.split(/\t|\|/).map(s => s.trim()).filter(Boolean);
      if (parts.length >= 2) {
        result[section].push({ name: parts[0], reason: parts[1] || '', duration: parts[2] || '', dept: parts[3] || '' });
        continue;
      }
      // Comma separated
      const cparts = line.split(',').map(s => s.trim()).filter(Boolean);
      if (cparts.length >= 2) {
        result[section].push({ name: cparts[0], reason: cparts[1] || '', duration: cparts[2] || '', dept: cparts[3] || '' });
        continue;
      }
      // Bullet or plain
      const cleaned = line.replace(/^[-•*\d.]\s*/, '');
      if (cleaned) {
        result[section].push({ name: cleaned, reason: '', duration: '', dept: '' });
      }
    } else if (section === 'holidays') {
      const cleaned = line.replace(/^[-•*\d.]\s*/, '');
      const parts = cleaned.split(/\t|\|/).map(s => s.trim()).filter(Boolean);
      if (parts.length >= 2) {
        result.holidays.push({ name: parts[0], date: parts[1] || '', day: parts[2] || '' });
      } else {
        const cparts = cleaned.split(/\s*[-,]\s*/).map(s => s.trim()).filter(Boolean);
        if (cparts.length >= 2) {
          result.holidays.push({ name: cparts[0], date: cparts[1] || '', day: cparts[2] || '' });
        } else if (cleaned && !cleaned.match(/^(holiday|date|day)/i)) {
          result.holidays.push({ name: cleaned, date: '', day: '' });
        }
      }
    }
  }

  return result;
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

  const handleSave = () => {
    const parsed = parseWorkforceText(text);
    saveWorkforceReport(parsed);
    queryClient.invalidateQueries({ queryKey: ['workforce'] });
    setOpen(false);
    setText('');
  };

  if (isLoading) return <Spinner />;

  const totalOnLeave = report?.on_leave?.length || 0;
  const totalUpcoming = report?.upcoming_leave?.length || 0;

  return (
    <div>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="relative bg-white rounded-xl shadow-xl p-6 max-w-lg w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Paste Workforce Report</h2>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              rows={12}
              className="w-full border border-gray-200 rounded-lg p-3 text-sm font-mono focus:outline-none focus:border-blue-400 resize-none"
              placeholder={`Paste your workforce report here. Supported formats:

On Leave Today
John Smith | Sick Leave | 1 day | Engineering
Jane Doe | Vacation | 3 days | Marketing

Upcoming Leave
Bob Jones, Annual Leave, 5 days, Sales

Holidays
New Year's Day | Jan 1 | Wednesday
Republic Day - Jan 26 - Friday

Or paste JSON directly.`}
            />
            <div className="flex gap-3 justify-end mt-4">
              <button onClick={() => setOpen(false)} className="px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">Cancel</button>
              <button onClick={handleSave} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">Save Report</button>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-end mb-4">
        <button
          onClick={() => setOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          Update by Pasting
        </button>
      </div>

      {!report ? (
        <div className="text-center text-gray-400 py-16 text-sm">No workforce report yet. Paste one to get started.</div>
      ) : (
        <>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-blue-800 text-sm font-medium">
              {totalOnLeave} on leave today · {totalUpcoming} upcoming leaves
              {report.parsed_at && (
                <span className="text-blue-500 font-normal"> · Updated {new Date(report.parsed_at).toLocaleString()}</span>
              )}
            </p>
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
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Duration</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Dept</th>
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
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Duration</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Dept</th>
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
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Holiday</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Day</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {report.holidays.map((h, i) => (
                        <tr key={i} className="hover:bg-gray-50">
                          <td className="px-4 py-2 font-medium text-gray-900">{h.name}</td>
                          <td className="px-4 py-2 text-gray-600">{h.date || '—'}</td>
                          <td className="px-4 py-2 text-gray-600">{h.day || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="md:hidden space-y-2">
                  {report.holidays.map((h, i) => (
                    <div key={i} className="bg-white border border-gray-200 rounded-lg p-3">
                      <p className="font-medium text-gray-900 text-sm">{h.name}</p>
                      {(h.date || h.day) && <p className="text-xs text-gray-500">{h.date}{h.day ? ` · ${h.day}` : ''}</p>}
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
