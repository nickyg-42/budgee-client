import { useCallback, useEffect, useRef } from 'react';

interface RangeSliderProps {
  min: number;
  max: number;
  step?: number;
  values: [number | undefined, number | undefined];
  onChange: (values: [number, number]) => void;
  disabled?: boolean;
}

export const RangeSlider = ({ min, max, step = 1, values, onChange, disabled }: RangeSliderProps) => {
  const [low, high] = values;
  const clamp = useCallback((v: number) => Math.min(max, Math.max(min, v)), [min, max]);
  const pct = (v: number) => ((v - min) / (max - min)) * 100;
  const left = typeof low === 'number' ? pct(low) : 0;
  const width = typeof low === 'number' && typeof high === 'number' ? pct(high) - pct(low) : 0;
  const containerRef = useRef<HTMLDivElement | null>(null);
  const draggingRef = useRef<'low' | 'high' | null>(null);

  const updateLow = (next: number) => {
    const cl = clamp(next);
    if (typeof high === 'number') {
      const fixed = Math.min(cl, high);
      onChange([fixed, high]);
    } else {
      onChange([cl, cl]);
    }
  };
  const updateHigh = (next: number) => {
    const cl = clamp(next);
    if (typeof low === 'number') {
      const fixed = Math.max(cl, low);
      onChange([low, fixed]);
    } else {
      onChange([cl, cl]);
    }
  };
  const posToValue = (clientX: number) => {
    const el = containerRef.current;
    if (!el) return typeof low === 'number' ? low : min;
    const rect = el.getBoundingClientRect();
    const ratio = (clientX - rect.left) / rect.width;
    const raw = min + ratio * (max - min);
    const stepped = Math.round(raw / step) * step;
    return clamp(stepped);
  };
  const startDrag = (which: 'low' | 'high', initialClientX?: number) => {
    if (disabled) return;
    draggingRef.current = which;
    const onMove = (e: PointerEvent) => {
      if (disabled) return;
      const val = posToValue(e.clientX);
      if (draggingRef.current === 'low') updateLow(val);
      else updateHigh(val);
    };
    const onUp = () => {
      draggingRef.current = null;
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    if (typeof initialClientX === 'number') {
      const val = posToValue(initialClientX);
      if (which === 'low') updateLow(val);
      else updateHigh(val);
    }
  };

  return (
    <div className="w-full">
      <div
        ref={containerRef}
        className="relative h-8 cursor-pointer"
        onPointerDown={(e) => {
          if (disabled) return;
          const val = posToValue(e.clientX);
          let which: 'low' | 'high' = 'low';
          if (typeof low === 'number' && typeof high === 'number') {
            const dLow = Math.abs(val - low);
            const dHigh = Math.abs(val - high);
            which = dLow < dHigh ? 'low' : 'high';
          } else if (typeof low === 'number') {
            which = 'low';
          } else if (typeof high === 'number') {
            which = 'high';
          } else {
            which = val < (min + max) / 2 ? 'low' : 'high';
          }
          startDrag(which, e.clientX);
        }}
      >
        <div className="absolute inset-y-3 left-0 right-0 rounded-full bg-gray-200" />
        {width > 0 && (
          <div className="absolute inset-y-3 rounded-full bg-blue-300" style={{ left: `${pct(low as number)}%`, width: `${width}%` }} />
        )}
        {typeof low === 'number' && (
          <button
          type="button"
          className="absolute -mt-2 w-4 h-4 rounded-full bg-white border border-blue-500 cursor-ew-resize"
          style={{ left: `calc(${left}% - 8px)`, top: '50%' }}
          disabled={disabled}
          onPointerDown={(e) => {
            if (disabled) return;
            e.stopPropagation();
            startDrag('low');
          }}
          onKeyDown={(e) => {
            if (disabled) return;
            if (e.key === 'ArrowLeft') updateLow((low as number) - step);
            if (e.key === 'ArrowRight') updateLow((low as number) + step);
          }}
          aria-label="Minimum"
        />
        )}
        {typeof high === 'number' && (
          <button
          type="button"
          className="absolute -mt-2 w-4 h-4 rounded-full bg-white border border-blue-500 cursor-ew-resize"
          style={{ left: `calc(${pct(high as number)}% - 8px)`, top: '50%' }}
          disabled={disabled}
          onPointerDown={(e) => {
            if (disabled) return;
            e.stopPropagation();
            startDrag('high');
          }}
          onKeyDown={(e) => {
            if (disabled) return;
            if (e.key === 'ArrowLeft') updateHigh((high as number) - step);
            if (e.key === 'ArrowRight') updateHigh((high as number) + step);
          }}
          aria-label="Maximum"
        />
        )}
      </div>
      <div className="mt-2 flex items-center justify-between text-xs text-gray-600">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  );
};
