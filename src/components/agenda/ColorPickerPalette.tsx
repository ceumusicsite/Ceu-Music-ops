import React from 'react';

interface ColorPickerPaletteProps {
  selectedColor: string;
  onChange: (color: string) => void;
  label?: string;
}

export const PRESET_COLORS = [
  { hex: '#00d2b4', name: 'Teal Céu' },
  { hex: '#a855f7', name: 'Roxo Elétrico' },
  { hex: '#3b82f6', name: 'Azul Real' },
  { hex: '#ec4899', name: 'Rosa Vibrante' },
  { hex: '#f97316', name: 'Laranja Studio' },
  { hex: '#10b981', name: 'Verde Esmeralda' },
  { hex: '#eab308', name: 'Dourado / Âmbar' },
  { hex: '#ef4444', name: 'Vermelho / Urgente' },
  { hex: '#06b6d4', name: 'Ciano Claro' },
  { hex: '#6366f1', name: 'Índigo' },
];

export default function ColorPickerPalette({
  selectedColor,
  onChange,
  label = 'Cor de Identificação',
}: ColorPickerPaletteProps) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-300 mb-2">
        {label}
      </label>
      <div className="flex flex-wrap items-center gap-2">
        {PRESET_COLORS.map((preset) => {
          const isSelected = selectedColor.toLowerCase() === preset.hex.toLowerCase();
          return (
            <button
              key={preset.hex}
              type="button"
              onClick={() => onChange(preset.hex)}
              title={preset.name}
              className={`w-7 h-7 rounded-full transition-all duration-200 cursor-pointer flex items-center justify-center ${
                isSelected
                  ? 'ring-2 ring-white scale-110 shadow-lg'
                  : 'hover:scale-105 opacity-80 hover:opacity-100'
              }`}
              style={{ backgroundColor: preset.hex }}
            >
              {isSelected && (
                <i className="ri-check-line text-xs font-bold text-white drop-shadow-md"></i>
              )}
            </button>
          );
        })}

        {/* Input customizado de cor */}
        <div className="relative flex items-center">
          <input
            type="color"
            value={selectedColor}
            onChange={(e) => onChange(e.target.value)}
            className="w-7 h-7 rounded-full cursor-pointer bg-transparent border-0 opacity-0 absolute inset-0 z-10"
            title="Escolher cor personalizada"
          />
          <div
            className="w-7 h-7 rounded-full border border-dashed border-gray-500 hover:border-white flex items-center justify-center text-gray-400 hover:text-white transition-smooth"
            style={{ backgroundColor: selectedColor }}
          >
            <i className="ri-palette-line text-xs drop-shadow"></i>
          </div>
        </div>
      </div>
    </div>
  );
}
