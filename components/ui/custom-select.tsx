"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CustomSelectOption {
  value: string;
  label: string;
}

export interface CustomSelectProps {
  name?: string;
  value?: string;
  onChange?: (value: string) => void;
  options: CustomSelectOption[];
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

export const CustomSelect = React.forwardRef<HTMLButtonElement, CustomSelectProps>(
  ({ name, value, onChange, options, placeholder = "Select...", required, disabled, className }, ref) => {
    const [isOpen, setIsOpen] = React.useState(false);
    const selectRef = React.useRef<HTMLDivElement>(null);

    const selectedOption = options.find((opt) => opt.value === value);
    const displayValue = selectedOption?.label || placeholder;

    React.useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
          setIsOpen(false);
        }
      };

      if (isOpen) {
        document.addEventListener("mousedown", handleClickOutside);
      }

      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }, [isOpen]);

    const handleSelect = (optionValue: string) => {
      onChange?.(optionValue);
      setIsOpen(false);
    };

    return (
      <div ref={selectRef} className="relative w-full">
        <input type="hidden" name={name} value={value || ""} required={required} />
        <button
          ref={ref}
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={cn(
            "flex h-11 w-full items-center justify-between border-0 border-b border-[var(--very-dark-color)]/20 bg-transparent px-0 py-2.5 text-body rounded-none",
            "focus:outline-none focus:border-[var(--very-dark-color)]/40",
            "disabled:cursor-not-allowed disabled:opacity-50",
            !selectedOption && "text-[var(--very-dark-color)]/40",
            className
          )}
        >
          <span className="truncate">{displayValue}</span>
          <ChevronDown
            size={16}
            className={cn(
              "ml-2 flex-shrink-0 transition-transform",
              isOpen && "rotate-180"
            )}
          />
        </button>

        {isOpen && (
          <div className="absolute z-[100] mt-2 w-full rounded-md bg-[var(--card)] shadow-custom border border-[var(--border)]">
            <div className="max-h-60 overflow-auto">
              {options.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSelect(option.value)}
                  className={cn(
                    "w-full px-3 py-2.5 text-left text-body hover:bg-pale transition-colors",
                    value === option.value && "bg-pale"
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }
);

CustomSelect.displayName = "CustomSelect";







