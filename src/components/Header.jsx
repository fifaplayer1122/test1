export default function Header({ activeCount, completedCount }) {
  return (
    <header className="px-4 py-4 sm:px-6" style={{ background: 'linear-gradient(135deg, #0D1B2A 0%, #1B3A5B 100%)' }}>
      <div className="max-w-5xl mx-auto flex items-center gap-3">
        <div className="bg-white/10 rounded-lg w-10 h-10 flex items-center justify-center flex-shrink-0">
          <span className="text-white font-bold text-lg">R</span>
        </div>
        <div>
          <h1 className="text-white font-semibold text-xl leading-tight">Ravi's Action Items</h1>
          <p className="text-blue-200 text-sm">{activeCount} active · {completedCount} completed</p>
        </div>
      </div>
    </header>
  );
}
