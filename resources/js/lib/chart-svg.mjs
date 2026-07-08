// Pure SVG-geometry helpers for the Start Here widgets.
// No DOM access — unit-testable under node --test.

export function extent(values) {
  let min = Infinity, max = -Infinity;
  for (const v of values) {
    if (v < min) min = v;
    if (v > max) max = v;
  }
  if (min === max) { min -= 1; max += 1; }
  return [min, max];
}

export function scale(v, dMin, dMax, rMin, rMax) {
  return rMin + ((v - dMin) / (dMax - dMin)) * (rMax - rMin);
}

export function linePath(values, w, h, pad = 10) {
  const [lo, hi] = extent(values);
  return values
    .map((v, i) => {
      const x = scale(i, 0, values.length - 1, pad, w - pad);
      const y = scale(v, lo, hi, h - pad, pad);
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
}

export function candleGeometry(ohlc, w, h, pad = 10) {
  const lo = Math.min(...ohlc.map(c => c.l));
  const hi = Math.max(...ohlc.map(c => c.h));
  const slot = (w - pad * 2) / ohlc.length;
  const bodyW = slot * 0.6;
  const y = v => scale(v, lo, hi, h - pad, pad);
  return ohlc.map((c, i) => {
    const xMid = pad + slot * i + slot / 2;
    const top = Math.max(c.o, c.c);
    const bot = Math.min(c.o, c.c);
    return {
      x: xMid - bodyW / 2,
      w: bodyW,
      xMid,
      bodyY: y(top),
      bodyH: Math.max(1, y(bot) - y(top)),
      wickY1: y(c.h),
      wickY2: y(c.l),
      up: c.c >= c.o,
    };
  });
}
