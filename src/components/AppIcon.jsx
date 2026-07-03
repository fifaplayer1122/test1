// Clean inline app icon — no external file dependency
export default function AppIcon({ size = 40, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="cc-grad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#2563EB" />
          <stop offset="100%" stopColor="#1D4ED8" />
        </linearGradient>
      </defs>
      {/* Rounded square base */}
      <rect width="40" height="40" rx="10" fill="url(#cc-grad)" />
      {/* Lightning bolt / zap — command symbol */}
      <path
        d="M23 8L13 22h8l-4 10 14-16h-8L23 8z"
        fill="white"
        fillOpacity="0.95"
      />
    </svg>
  );
}
