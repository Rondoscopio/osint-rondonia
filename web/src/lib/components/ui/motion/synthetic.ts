// Pure samples for illustrations. Their phase offsets never change between renders.
const TAU = 2 * Math.PI;

function gaussian(position: number, center: number, spread: number) {
  return Math.exp(-(((position - center) / spread) ** 2));
}

export function spectrumAt(position: number, seed: number, phase: number) {
  const bass = gaussian(position, 0.18 + 0.055 * Math.sin(phase + seed), 0.18);
  const mid = gaussian(position, 0.52 + 0.06 * Math.cos(phase - seed), 0.16);
  const high = gaussian(position, 0.8, 0.105);
  return Math.min(
    1,
    0.12 +
      bass * (0.58 + 0.18 * Math.cos(phase)) +
      mid * (0.36 + 0.1 * Math.sin(phase + 1.1)) +
      high * (0.13 + 0.11 * Math.cos(phase - 1.4)),
  );
}

export function surfaceHeight(column: number, row: number, seed: number) {
  return (
    0.16 +
    gaussian(column, 5.2 + 0.4 * Math.sin(seed), 3.9) *
      gaussian(row, 3, 3.2) *
      (0.65 + 0.12 * Math.sin(column * 0.82 + row * 0.6 + seed))
  );
}

export function waveform(seed: number, harmonic: boolean) {
  return Array.from({ length: 145 }, (_, index) => {
    const x = (index / 144) * 240;
    const phase = (x / 120) * TAU + seed;
    const envelope = 0.72 + 0.28 * Math.cos((x / 120) * TAU + 0.3);
    const y =
      51 -
      (harmonic
        ? Math.sin(phase * 2 + 0.48) * 11
        : (Math.sin(phase) * 18 + Math.sin(phase * 2 + 0.45) * 6) * envelope);
    return `${index ? 'L' : 'M'}${x.toFixed(2)} ${y.toFixed(2)}`;
  }).join(' ');
}

export function spectralBands(seed: number) {
  return Array.from({ length: 15 }, (_, index) => {
    const path = (harmonic: number) => {
      const x = index * 12;
      const y =
        70 -
        harmonic * (8.9 + 1.3 * Math.sin(index * 0.34 + seed)) +
        3 * Math.sin(index * 0.53 + seed);
      return `M${x} ${y.toFixed(1)}h9`;
    };
    return {
      id: index,
      strong: [1, 2, 3].map(path).join(' '),
      faint: [4, 5, 6].map(path).join(' '),
      strength: 0.36 + 0.52 * ((1 + Math.sin(index * 0.53 + seed)) / 2),
    };
  });
}
