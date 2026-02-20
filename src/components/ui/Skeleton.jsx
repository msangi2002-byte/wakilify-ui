/**
 * Facebook/Instagram-style skeleton placeholder (viboksi vya kijivu).
 * Use for loading states instead of spinners – same UX as Facebook Web.
 */
export function Skeleton({ className = '', style = {}, ...props }) {
  return (
    <div
      className={`skeleton-shimmer ${className}`}
      style={{
        backgroundColor: 'var(--skeleton-bg, #e4e6eb)',
        borderRadius: 'var(--skeleton-radius, 8px)',
        ...style,
      }}
      aria-hidden
      {...props}
    />
  );
}

export function SkeletonCircle({ size = 40, className = '', ...props }) {
  return (
    <Skeleton
      className={className}
      style={{ width: size, height: size, borderRadius: '50%' }}
      {...props}
    />
  );
}

export function SkeletonText({ lines = 1, className = '' }) {
  return (
    <div className={className} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton
          key={i}
          style={{
            height: 14,
            maxWidth: i === lines - 1 && lines > 1 ? '60%' : '100%',
          }}
        />
      ))}
    </div>
  );
}
