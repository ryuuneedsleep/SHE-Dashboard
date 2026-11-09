import React from 'react';
import { ChevronDown } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectFieldProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: SelectOption[];
  error?: string;
  helperText?: string;
  placeholder?: string;
  required?: boolean;
}

export const SelectField = React.forwardRef<HTMLSelectElement, SelectFieldProps>(
  (
    {
      label,
      options,
      error,
      helperText,
      placeholder = 'Select an option',
      id,
      className = '',
      required,
      ...props
    },
    ref
  ) => {
    const selectId = id || props.name;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={selectId}
            className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5"
          >
            {label}
            {required && <span className="text-[#EB0A1E] ml-1">*</span>}
          </label>
        )}

        <div className="relative rounded-lg shadow-sm">
          <select
            ref={ref}
            id={selectId}
            className={`block w-full appearance-none rounded-lg border text-sm transition-colors py-2.5 pl-3.5 pr-10 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-1 ${
              error
                ? 'border-red-500 focus:border-red-500 focus:ring-red-200'
                : 'border-gray-300 focus:border-gray-900 focus:ring-gray-200'
            } ${className}`}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <div className="pointer-events-none absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400">
            <ChevronDown className="w-4 h-4" />
          </div>
        </div>

        {error ? (
          <p className="mt-1.5 text-xs text-red-600 font-medium flex items-center gap-1">
            <span className="w-1 h-1 rounded-full bg-red-600 inline-block" />
            {error}
          </p>
        ) : helperText ? (
          <p className="mt-1 text-xs text-gray-500">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

SelectField.displayName = 'SelectField';

