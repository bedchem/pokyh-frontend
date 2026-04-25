export default function Spinner({ size = 24 }: { size?: number }) {
  return (
    <div
      className="animate-spin rounded-full border-2 border-transparent"
      style={{
        width: size,
        height: size,
        borderTopColor: 'var(--accent)',
        borderLeftColor: 'var(--accent)',
      }}
    />
  );
}
