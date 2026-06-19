import { useState, useRef, useEffect } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import {
  PERSONAL_FINANCE_CATEGORIES,
  PERSONAL_FINANCE_CATEGORY_LABELS,
  PRIMARY_TO_DETAILED_MAP,
  getAnyCategoryLabel,
  PersonalFinanceCategory,
  PersonalFinanceDetailedCategory,
} from '../../constants/personalFinanceCategories';
import { useTheme } from '../../theme/ThemeContext';

interface CategoryPickerProps {
  value: string;
  onChange: (category: string) => void;
  excludeCategories?: string[];
  placeholder?: string;
}

export const CategoryPicker = ({
  value,
  onChange,
  excludeCategories = [],
  placeholder = 'Select a category',
}: CategoryPickerProps) => {
  const [open, setOpen] = useState(false);
  const [expandedPrimary, setExpandedPrimary] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const { getCategoryColor } = useTheme();

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const categories = PERSONAL_FINANCE_CATEGORIES.filter(
    (c) => !excludeCategories.includes(c)
  );

  const displayLabel = value ? getAnyCategoryLabel(value) : placeholder;

  const handleSelectPrimary = (cat: PersonalFinanceCategory) => {
    onChange(cat);
    setOpen(false);
    setExpandedPrimary(null);
  };

  const handleSelectDetailed = (cat: string) => {
    onChange(cat);
    setOpen(false);
    setExpandedPrimary(null);
  };

  const toggleExpand = (cat: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedPrimary(expandedPrimary === cat ? null : cat);
  };

  return (
    <div ref={ref} className="relative w-full">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between bg-white border border-gray-300 rounded-md px-3 py-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-300 hover:bg-gray-50"
      >
        <div className="flex items-center space-x-2">
          {value && (
            <span
              className="inline-block w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: getCategoryColor(value) }}
            />
          )}
          <span className={value ? 'text-gray-900' : 'text-gray-500'}>{displayLabel}</span>
        </div>
        <ChevronDown className="w-4 h-4 text-gray-400" />
      </button>
      {open && (
        <div className="absolute z-50 mt-1 w-full max-h-72 overflow-y-auto bg-white border border-gray-200 rounded-md shadow-lg">
          {categories.map((primary) => {
            const detailed = PRIMARY_TO_DETAILED_MAP[primary] || [];
            const hasDetailed = detailed.length > 0;
            const isExpanded = expandedPrimary === primary;
            const isSelected = value === primary;
            return (
              <div key={primary}>
                <div
                  className={`flex items-center px-3 py-2 text-sm cursor-pointer hover:bg-gray-50 ${isSelected ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-900'}`}
                >
                  {hasDetailed ? (
                    <button
                      type="button"
                      onClick={(e) => toggleExpand(primary, e)}
                      className="mr-1 p-0.5 rounded hover:bg-gray-200 flex-shrink-0"
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5 text-gray-500" />
                      )}
                    </button>
                  ) : (
                    <span className="w-5 mr-1 flex-shrink-0" />
                  )}
                  <span
                    className="inline-block w-2.5 h-2.5 rounded-full mr-2 flex-shrink-0"
                    style={{ backgroundColor: getCategoryColor(primary) }}
                  />
                  <span
                    className="flex-1"
                    onClick={() => handleSelectPrimary(primary)}
                  >
                    {PERSONAL_FINANCE_CATEGORY_LABELS[primary]}
                  </span>
                </div>
                {hasDetailed && isExpanded && (
                  <div>
                    {detailed.filter((d) => !excludeCategories.includes(d)).map((d) => {
                      const detailedSelected = value === d;
                      return (
                        <div
                          key={d}
                          onClick={() => handleSelectDetailed(d)}
                          className={`flex items-center pl-10 pr-3 py-1.5 text-sm cursor-pointer hover:bg-gray-50 ${detailedSelected ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'}`}
                        >
                          <span
                            className="inline-block w-2 h-2 rounded-full mr-2 flex-shrink-0 opacity-60"
                            style={{ backgroundColor: getCategoryColor(primary) }}
                          />
                          {getAnyCategoryLabel(d)}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
