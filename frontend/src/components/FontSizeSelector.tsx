'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Plus, Minus, ChevronDown, RotateCcw } from 'lucide-react';
import {
  DEFAULT_EDITOR_FONT_SIZE,
  MIN_EDITOR_FONT_SIZE,
  MAX_EDITOR_FONT_SIZE,
  EDITOR_FONT_SIZES,
} from '@/types';

interface FontSizeSelectorProps {
  fontSize: number;
  onFontSizeChange: (newSize: number) => void;
  onResetTypography?: () => void;
  className?: string;
}

export const FontSizeSelector: React.FC<FontSizeSelectorProps> = ({
  fontSize,
  onFontSizeChange,
  onResetTypography,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click or Escape key
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleDecrease = () => {
    if (fontSize > MIN_EDITOR_FONT_SIZE) {
      onFontSizeChange(fontSize - 1);
    }
  };

  const handleIncrease = () => {
    if (fontSize < MAX_EDITOR_FONT_SIZE) {
      onFontSizeChange(fontSize + 1);
    }
  };

  return (
    <div ref={containerRef} className={`relative inline-flex items-center ${className}`}>
      {/* Stepper + Dropdown Trigger Group */}
      <div className="flex items-center rounded-lg border border-slate-800 bg-slate-900 p-0.5 shadow-sm">
        {/* Minus Quick Button */}
        <button
          type="button"
          onClick={handleDecrease}
          disabled={fontSize <= MIN_EDITOR_FONT_SIZE}
          className="flex h-6 w-6 items-center justify-center rounded text-slate-400 hover:bg-slate-800 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
          title={`Decrease font size (-1px, min ${MIN_EDITOR_FONT_SIZE}px)`}
          aria-label="Decrease font size"
        >
          <Minus className="h-3 w-3" />
        </button>

        {/* Dropdown Toggle with Size Label */}
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="flex items-center gap-1 px-2 py-0.5 text-xs font-mono font-medium text-slate-200 hover:text-white transition cursor-pointer"
          title="Select or adjust editor font size"
          aria-haspopup="dialog"
          aria-expanded={isOpen}
        >
          <span>{fontSize}px</span>
          <ChevronDown
            className={`h-2.5 w-2.5 text-slate-400 transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-white' : ''
            }`}
          />
        </button>

        {/* Plus Quick Button */}
        <button
          type="button"
          onClick={handleIncrease}
          disabled={fontSize >= MAX_EDITOR_FONT_SIZE}
          className="flex h-6 w-6 items-center justify-center rounded text-slate-400 hover:bg-slate-800 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
          title={`Increase font size (+1px, max ${MAX_EDITOR_FONT_SIZE}px)`}
          aria-label="Increase font size"
        >
          <Plus className="h-3 w-3" />
        </button>
      </div>

      {/* Floating Slider & Presets Popover */}
      {isOpen && (
        <div
          role="dialog"
          aria-label="Font size controls"
          className="absolute right-0 sm:right-auto sm:left-0 mt-1.5 top-full w-64 rounded-xl border border-slate-800 bg-slate-900/95 p-3 shadow-2xl backdrop-blur-md z-50 animate-in fade-in zoom-in-95 duration-100 space-y-3"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-1.5 border-b border-slate-800/80">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Font Size
            </span>
            <span className="text-xs font-mono font-semibold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
              {fontSize}px
            </span>
          </div>

          {/* Interactive Range Slider */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
              <span>{MIN_EDITOR_FONT_SIZE}px</span>
              <span className="text-slate-400">Default: {DEFAULT_EDITOR_FONT_SIZE}px</span>
              <span>{MAX_EDITOR_FONT_SIZE}px</span>
            </div>
            <input
              type="range"
              min={MIN_EDITOR_FONT_SIZE}
              max={MAX_EDITOR_FONT_SIZE}
              step={1}
              value={fontSize}
              onChange={(e) => onFontSizeChange(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500 hover:accent-indigo-400"
            />
          </div>

          {/* Quick Presets Grid */}
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 block">Preset Sizes</span>
            <div className="grid grid-cols-5 gap-1">
              {EDITOR_FONT_SIZES.map((size) => {
                const isActive = size === fontSize;
                return (
                  <button
                    key={size}
                    type="button"
                    onClick={() => onFontSizeChange(size)}
                    className={`py-1 rounded text-xs font-mono font-medium transition cursor-pointer text-center ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/40 font-bold'
                        : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    {size}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Reset to Default Button */}
          {onResetTypography && (
            <div className="pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  onResetTypography();
                  setIsOpen(false);
                }}
                className="w-full flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg border border-slate-800 bg-slate-950/60 hover:bg-slate-800 text-[11px] font-medium text-slate-400 hover:text-indigo-300 transition cursor-pointer"
                title="Reset font family to Fira Code and size to 16px"
              >
                <RotateCcw className="h-3 w-3 text-indigo-400" />
                <span>Reset to Default (Fira Code, 16px)</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

