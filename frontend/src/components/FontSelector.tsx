'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Type, Check, ChevronDown, RotateCcw } from 'lucide-react';
import { EditorFontId, EDITOR_FONTS, getEditorFont } from '@/types';

interface FontSelectorProps {
  selectedFontId: EditorFontId;
  onSelectFont: (fontId: EditorFontId) => void;
  onResetTypography?: () => void;
  className?: string;
}

export const FontSelector: React.FC<FontSelectorProps> = ({
  selectedFontId,
  onSelectFont,
  onResetTypography,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const currentFont = getEditorFont(selectedFontId);

  // Close dropdown when clicking outside
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

  const handleSelect = (fontId: EditorFontId) => {
    onSelectFont(fontId);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className={`relative inline-block text-left ${className}`}>
      {/* Dropdown Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1 text-xs font-medium text-slate-300 hover:text-white hover:border-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition cursor-pointer"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        title="Change code editor font"
      >
        <Type className="h-3.5 w-3.5 text-indigo-400 flex-shrink-0" />
        <span className="hidden sm:inline font-mono text-[11px] max-w-[130px] truncate" style={{ fontFamily: currentFont.fontFamily }}>
          {currentFont.name}
        </span>
        <span className="sm:hidden font-mono text-[11px]">Font</span>
        <ChevronDown
          className={`h-3 w-3 text-slate-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-white' : ''
          }`}
        />
      </button>

      {/* Floating Dropdown Menu */}
      {isOpen && (
        <div
          role="listbox"
          aria-label="Editor font selection"
          className="absolute right-0 sm:right-auto sm:left-0 mt-1.5 w-64 rounded-xl border border-slate-800 bg-slate-900/95 p-1.5 shadow-2xl backdrop-blur-md z-50 animate-in fade-in zoom-in-95 duration-100"
        >
          <div className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-800/80 mb-1">
            Editor Typography
          </div>

          <div className="space-y-0.5 max-h-[320px] overflow-y-auto">
            {EDITOR_FONTS.map((font) => {
              const isSelected = font.id === selectedFontId;
              return (
                <button
                  key={font.id}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => handleSelect(font.id)}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition cursor-pointer text-left ${
                    isSelected
                      ? 'bg-indigo-600/20 text-indigo-300 font-semibold border border-indigo-500/30'
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white border border-transparent'
                  }`}
                >
                  <div className="flex flex-col min-w-0 pr-2">
                    <span
                      className="text-xs truncate"
                      style={{ fontFamily: font.fontFamily }}
                    >
                      {font.name}
                    </span>
                    {font.ligatures && (
                      <span className="text-[10px] text-slate-400 font-sans">
                        Ligatures enabled (== != -&gt;)
                      </span>
                    )}
                  </div>

                  {isSelected && (
                    <Check className="h-4 w-4 text-indigo-400 flex-shrink-0" />
                  )}
                </button>
              );
            })}
          </div>

          {onResetTypography && (
            <div className="pt-1.5 mt-1 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  onResetTypography();
                  setIsOpen(false);
                }}
                className="w-full flex items-center justify-center gap-1.5 py-1 px-2 rounded-lg border border-slate-800/80 bg-slate-950/60 hover:bg-slate-800 text-[11px] font-medium text-slate-400 hover:text-indigo-300 transition cursor-pointer"
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

