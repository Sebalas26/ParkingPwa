import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { THEME_OPTIONS } from '../model/theme';
import './ThemeSelector.css';

interface ThemeSelectorProps {
  currentTheme: string;
  onSelectTheme: (themeId: string) => void;
}

export const ThemeSelector: React.FC<ThemeSelectorProps> = ({ currentTheme, onSelectTheme }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = THEME_OPTIONS.find(t => t.id === currentTheme) || THEME_OPTIONS[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="theme-selector-wrapper" ref={containerRef}>
      <button 
        className="theme-dropdown-btn" 
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <span className="theme-dot" style={{ backgroundColor: selectedOption.dotColor }} />
        <span>{selectedOption.name}</span>
        <ChevronDown size={14} className={`theme-chevron ${isOpen ? 'open' : ''}`} />
      </button>

      {isOpen && (
        <div className="theme-menu">
          {THEME_OPTIONS.map((option) => {
            const isActive = option.id === currentTheme;
            return (
              <button
                key={option.id}
                className={`theme-item ${isActive ? 'active' : ''}`}
                onClick={() => {
                  onSelectTheme(option.id);
                  setIsOpen(false);
                }}
              >
                <span className="theme-dot" style={{ backgroundColor: option.dotColor }} />
                <span>{option.name}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
