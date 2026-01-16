import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Check } from 'lucide-react';

interface Option {
  value: string;
  label: string;
}

interface FilterPillProps {
  label: string;
  options: Option[];
  selected: string[];
  onChange: (next: string[]) => void;
  summary?: string;
}

export const FilterPill = ({ label, options, selected, onChange, summary }: FilterPillProps) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  const isSelected = (v: string) => (selected || []).includes(v);
  const toggle = (v: string) => {
    const prev = Array.isArray(selected) ? [...selected] : [];
    const has = prev.includes(v);
    const next = has ? prev.filter(x => x !== v) : Array.from(new Set([...prev, v]));
    onChange(next);
  };
  const clearAll = () => onChange([]);
  const selectAll = () => onChange(options.map(o => o.value));

  const summaryText = summary ?? ((selected || []).length > 0 ? `${selected.length} selected` : 'All');

  return (
    <div className="relative inline-block" ref={ref}>
      <button
        className={`inline-flex items-center px-3 py-2 rounded-md border text-sm ${open ? 'bg-blue-50 text-blue-700 border-blue-300' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
        onClick={() => setOpen(v => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        title={label}
      >
        <span className="font-medium mr-2">{label}</span>
        <span className="text-xs text-gray-500 mr-2">{summaryText}</span>
        <ChevronDown className={`w-4 h-4 ${open ? 'transform rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute z-30 mt-2 w-64 bg-white border border-gray-200 rounded-md shadow-lg">
          <div className="max-h-64 overflow-auto py-2">
            {options.map(opt => {
              const checked = isSelected(opt.value);
              return (
                <button
                  key={opt.value}
                  onClick={() => toggle(opt.value)}
                  className={`w-full flex items-center justify-between px-3 py-2 text-sm ${checked ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'}`}
                >
                  <span>{opt.label}</span>
                  {checked && <Check className="w-4 h-4 text-blue-600" />}
                </button>
              );
            })}
            {options.length === 0 && (
              <div className="px-3 py-2 text-xs text-gray-500">No options available</div>
            )}
          </div>
          <div className="flex items-center justify-between px-3 py-2 border-t border-gray-100">
            <button className="text-xs text-gray-600 underline" onClick={clearAll}>Clear filter</button>
            <button className="text-xs text-gray-600 underline" onClick={selectAll}>Select all</button>
          </div>
        </div>
      )}
    </div>
  );
}
