import { useMemo } from 'react'
import { cn } from '@/utils/cn'

const N = 25 // modules per side

/** Deterministic pseudo-random bit for a cell (stable across renders). */
function bit(x, y, seed) {
  let h = (x * 374761393 + y * 668265263 + seed * 2147483647) >>> 0
  h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0
  return ((h ^ (h >>> 16)) & 7) < 3
}

const inFinder = (x, y) =>
  (x < 8 && y < 8) || (x >= N - 8 && y < 8) || (x < 8 && y >= N - 8)

/**
 * Decorative QR-style graphic. NOT a scannable code — never use it where a real
 * payment QR is expected. The real UPI QR comes from the payment provider.
 */
export function FauxQr({ seed = 7, className, scanning = false }) {
  const cells = useMemo(() => {
    const out = []
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (!inFinder(x, y) && bit(x, y, seed)) out.push([x, y])
    return out
  }, [seed])

  return (
    <div className={cn('relative overflow-hidden rounded-card bg-white p-3 [container-type:size]', className)} aria-hidden="true">
      <svg viewBox={`0 0 ${N} ${N}`} className="block size-full" shapeRendering="crispEdges">
        {cells.map(([x, y]) => (
          <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill="#0b1410" />
        ))}
        {[
          [0, 0],
          [N - 7, 0],
          [0, N - 7],
        ].map(([x, y]) => (
          <g key={`${x}-${y}`}>
            <rect x={x} y={y} width="7" height="7" rx="1.6" fill="#0b1410" />
            <rect x={x + 1} y={y + 1} width="5" height="5" rx="1.1" fill="#fff" />
            <rect x={x + 2} y={y + 2} width="3" height="3" rx=".8" fill="#166534" />
          </g>
        ))}
      </svg>
      {scanning && (
        <span className="absolute inset-x-3 top-3 h-0.5 animate-scan rounded-full bg-fresh shadow-[0_0_14px_2px_var(--fresh)] [--scan-distance:calc(100cqh-1.5rem)]" />
      )}
    </div>
  )
}
