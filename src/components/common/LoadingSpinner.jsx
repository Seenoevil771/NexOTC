export default function LoadingSpinner({ size = 24, color = '#3b82f6' }) {
  return (
    <div className="flex items-center justify-center">
      <div
        className="rounded-full border-2 border-transparent animate-spin"
        style={{
          width: size,
          height: size,
          borderTopColor: color,
          borderRightColor: `${color}50`,
        }}
      />
    </div>
  );
}

export function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-64">
      <div className="flex flex-col items-center gap-4">
        <LoadingSpinner size={40} />
        <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>Loading data…</p>
      </div>
    </div>
  );
}
