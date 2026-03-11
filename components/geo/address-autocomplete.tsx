"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Search, MapPin, Loader2, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { searchLocation, type GeoSearchResult } from "@/lib/geo-service";

interface AddressAutocompleteProps {
  value?: string;
  placeholder?: string;
  onChange?: (value: string) => void;
  onSelect?: (result: GeoSearchResult) => void;
  className?: string;
  disabled?: boolean;
  countryCode?: string;
  debounceMs?: number;
}

export function AddressAutocomplete({
  value = "",
  placeholder = "Search for a location...",
  onChange,
  onSelect,
  className,
  disabled = false,
  countryCode = "ug",
  debounceMs = 500,
}: AddressAutocompleteProps) {
  const [inputValue, setInputValue] = useState(value);
  const [results, setResults] = useState<GeoSearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Update input value when prop changes
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced search
  const performSearch = useCallback(
    async (query: string) => {
      if (query.length < 2) {
        setResults([]);
        setIsOpen(false);
        return;
      }

      setIsLoading(true);
      try {
        const searchResults = await searchLocation(query, {
          countryCode,
          limit: 6,
        });
        setResults(searchResults);
        setIsOpen(searchResults.length > 0);
        setHighlightedIndex(-1);
      } catch (error) {
        console.error("Search error:", error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    },
    [countryCode]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onChange?.(newValue);

    // Clear previous debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Debounce the search
    debounceRef.current = setTimeout(() => {
      performSearch(newValue);
    }, debounceMs);
  };

  const handleSelect = (result: GeoSearchResult) => {
    const displayValue = formatDisplayName(result);
    setInputValue(displayValue);
    onChange?.(displayValue);
    onSelect?.(result);
    setIsOpen(false);
    setResults([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || results.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < results.length - 1 ? prev + 1 : 0
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev > 0 ? prev - 1 : results.length - 1
        );
        break;
      case "Enter":
        e.preventDefault();
        if (highlightedIndex >= 0) {
          handleSelect(results[highlightedIndex]);
        }
        break;
      case "Escape":
        setIsOpen(false);
        break;
    }
  };

  const handleClear = () => {
    setInputValue("");
    onChange?.("");
    setResults([]);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const formatDisplayName = (result: GeoSearchResult): string => {
    const parts: string[] = [];
    const addr = result.address;

    if (addr.village || addr.town) {
      parts.push(addr.village || addr.town || "");
    }
    if (addr.district || addr.county) {
      parts.push(addr.district || addr.county || "");
    }
    if (addr.region || addr.state) {
      parts.push(addr.region || addr.state || "");
    }

    return parts.length > 0 ? parts.join(", ") : result.displayName.split(",")[0];
  };

  const formatResultItem = (result: GeoSearchResult): { primary: string; secondary: string } => {
    const addr = result.address;
    const primary = addr.village || addr.town || addr.city || result.displayName.split(",")[0];
    
    const secondaryParts: string[] = [];
    if (addr.district) secondaryParts.push(addr.district);
    if (addr.region || addr.state) secondaryParts.push(addr.region || addr.state || "");
    
    return {
      primary,
      secondary: secondaryParts.join(", "),
    };
  };

  return (
    <div className={cn("relative", className)}>
      <div className="relative">
        <Search
          size={18}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]"
        />
        <Input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => results.length > 0 && setIsOpen(true)}
          placeholder={placeholder}
          disabled={disabled}
          className="pl-10 pr-10"
        />
        {isLoading ? (
          <Loader2
            size={18}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)] animate-spin"
          />
        ) : inputValue ? (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--very-dark-color)]"
          >
            <X size={18} />
          </button>
        ) : null}
      </div>

      {/* Dropdown Results */}
      {isOpen && results.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-[100] w-full mt-1 bg-paper rounded-lg border border-[var(--very-dark-color)]/10 shadow-custom max-h-64 overflow-y-auto"
        >
          {results.map((result, index) => {
            const { primary, secondary } = formatResultItem(result);
            return (
              <button
                key={result.placeId}
                type="button"
                onClick={() => handleSelect(result)}
                className={cn(
                  "w-full px-4 py-3 text-left flex items-start gap-3 hover:bg-pale transition-colors",
                  highlightedIndex === index && "bg-pale"
                )}
              >
                <MapPin size={18} className="text-primary mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{primary}</p>
                  {secondary && (
                    <p className="text-sm opacity-60 truncate">{secondary}</p>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
