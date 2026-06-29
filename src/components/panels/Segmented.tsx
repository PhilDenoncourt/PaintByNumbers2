import type { ReactNode } from 'react';

export interface SegmentedOption<T extends string> {
  value: T;
  label: ReactNode;
  disabled?: boolean;
}

interface Props<T extends string> {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /** Larger padded segments (used for the algorithm picker). */
  size?: 'sm' | 'md';
}

/**
 * Pill segmented control matching the redesign tokens: a `#f1f5f9` track with a
 * raised white segment for the active option.
 */
export function Segmented<T extends string>({ options, value, onChange, size = 'sm' }: Props<T>) {
  return (
    <div className="flex gap-1.5 bg-[#f1f5f9] dark:bg-gray-700 p-1 rounded-[10px]">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            disabled={o.disabled}
            onClick={() => onChange(o.value)}
            className={`flex-1 ${size === 'md' ? 'py-2 px-2' : 'py-2 px-1'} rounded-[7px] text-xs font-semibold transition-all ${
              active
                ? 'bg-white dark:bg-gray-900 text-[#0f172a] dark:text-gray-100 shadow-[0_1px_2px_rgba(0,0,0,0.06)]'
                : 'text-[#64748b] dark:text-gray-400 hover:text-[#334155] dark:hover:text-gray-200'
            } ${o.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
