interface SingleSliderProps {
  min: number;
  max: number;
  step?: number;
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  reverse?: boolean;
}

export const SingleSlider = ({ min, max, step = 1, value, onChange, disabled, reverse }: SingleSliderProps) => {
  return (
    <div className="w-full">
      <div className="relative">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full appearance-none bg-transparent"
          style={reverse ? { transform: 'scaleX(-1)' } : undefined}
        />
      </div>
      <div className="mt-1 flex items-center justify-between text-xs text-gray-600">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  );
};

