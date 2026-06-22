const TABS = [
  { id: 'active', label: 'Active' },
  { id: 'done', label: 'Done' },
  { id: 'skipped', label: 'Skipped' },
  { id: 'photos', label: 'Photos' },
  { id: 'workforce', label: 'Workforce' },
];

export default function TabBar({ activeTab, onTabChange, counts }) {
  return (
    <div className="bg-white border-b border-gray-200 overflow-x-auto">
      <div className="max-w-5xl mx-auto flex">
        {TABS.map(tab => {
          const isActive = tab.id === activeTab;
          const count = counts[tab.id];
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`px-4 py-3 text-sm whitespace-nowrap flex items-center gap-2 border-b-2 transition-colors ${
                isActive
                  ? 'border-blue-600 text-blue-600 font-medium'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
              {count != null && count > 0 && (
                <span className="bg-blue-100 text-blue-700 text-xs font-medium px-1.5 py-0.5 rounded-full">
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
