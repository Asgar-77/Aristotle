import React, { useState } from 'react';
import { Undo, Redo, Palette, Ruler, Download, Copy, Settings } from 'lucide-react';

interface EnhancedToolbarProps {
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
  onSettings: () => void;
  onDownload: () => void;
  onCopy: () => void;
  canUndo: boolean;
  canRedo: boolean;
  strokeColor: string;
  onColorChange: (color: string) => void;
  strokeWidth: number;
  onWidthChange: (width: number) => void;
}

export const EnhancedToolbar: React.FC<EnhancedToolbarProps> = ({
  onUndo,
  onRedo,
  onClear,
  onSettings,
  onDownload,
  onCopy,
  canUndo,
  canRedo,
  strokeColor,
  onColorChange,
  strokeWidth,
  onWidthChange
}) => {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showWidthPicker, setShowWidthPicker] = useState(false);

  const colors = [
    { name: 'White', value: '#ffffff', bg: 'bg-white' },
    { name: 'Blue', value: '#3b82f6', bg: 'bg-blue-500' },
    { name: 'Green', value: '#10b981', bg: 'bg-green-500' },
    { name: 'Yellow', value: '#f59e0b', bg: 'bg-yellow-500' },
    { name: 'Orange', value: '#f97316', bg: 'bg-orange-500' },
    { name: 'Red', value: '#ef4444', bg: 'bg-red-500' },
    { name: 'Pink', value: '#ec4899', bg: 'bg-pink-500' },
    { name: 'Purple', value: '#8b5cf6', bg: 'bg-purple-500' }
  ];

  const widths = [1, 2, 3, 4, 5, 8, 12, 16, 20];

  return (
    <div className="bg-gray-800/90 backdrop-blur-sm rounded-lg p-4 shadow-xl border border-gray-700">
      <div className="flex items-center justify-between">
        {/* Left Section - Undo/Redo */}
        <div className="flex items-center space-x-2">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className={`p-2 rounded-lg transition-all ${
              canUndo
                ? 'bg-gray-700 hover:bg-gray-600 text-white'
                : 'bg-gray-800 text-gray-500 cursor-not-allowed'
            }`}
          >
            <Undo className="w-5 h-5" />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className={`p-2 rounded-lg transition-all ${
              canRedo
                ? 'bg-gray-700 hover:bg-gray-600 text-white'
                : 'bg-gray-800 text-gray-500 cursor-not-allowed'
            }`}
          >
            <Redo className="w-5 h-5" />
          </button>
        </div>

        {/* Middle Section - Drawing Tools */}
        <div className="flex items-center space-x-4">
          {/* Color Picker */}
          <div className="relative">
            <button
              onClick={() => setShowColorPicker(!showColorPicker)}
              className="flex items-center space-x-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
            >
              <div
                className="w-4 h-4 rounded-full border-2 border-gray-400"
                style={{ backgroundColor: strokeColor }}
              />
              <Palette className="w-4 h-4 text-white" />
            </button>
            
            {showColorPicker && (
              <div className="absolute top-full left-0 mt-2 p-3 bg-gray-800 rounded-lg shadow-xl border border-gray-700 z-10">
                <div className="grid grid-cols-4 gap-2">
                  {colors.map((color) => (
                    <button
                      key={color.value}
                      onClick={() => {
                        onColorChange(color.value);
                        setShowColorPicker(false);
                      }}
                      className={`w-8 h-8 rounded-full border-2 transition-all hover:scale-110 ${
                        strokeColor === color.value
                          ? 'border-white scale-110'
                          : 'border-gray-600'
                      }`}
                      style={{ backgroundColor: color.value }}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Width Picker */}
          <div className="relative">
            <button
              onClick={() => setShowWidthPicker(!showWidthPicker)}
              className="flex items-center space-x-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
            >
              <div
                className="bg-white rounded-full"
                style={{ width: Math.max(2, strokeWidth), height: Math.max(2, strokeWidth) }}
              />
              <Ruler className="w-4 h-4 text-white" />
            </button>
            
            {showWidthPicker && (
              <div className="absolute top-full left-0 mt-2 p-3 bg-gray-800 rounded-lg shadow-xl border border-gray-700 z-10">
                <div className="space-y-2">
                  {widths.map((width) => (
                    <button
                      key={width}
                      onClick={() => {
                        onWidthChange(width);
                        setShowWidthPicker(false);
                      }}
                      className={`w-full flex items-center space-x-2 px-2 py-1 rounded transition-colors ${
                        strokeWidth === width
                          ? 'bg-blue-600 text-white'
                          : 'hover:bg-gray-700 text-gray-300'
                      }`}
                    >
                      <div
                        className="bg-white rounded-full"
                        style={{ width: Math.max(2, width), height: Math.max(2, width) }}
                      />
                      <span className="text-sm">{width}px</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Section - Actions */}
        <div className="flex items-center space-x-2">
          <button
            onClick={onCopy}
            className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-white"
            title="Copy LaTeX"
          >
            <Copy className="w-5 h-5" />
          </button>
          <button
            onClick={onDownload}
            className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-white"
            title="Download"
          >
            <Download className="w-5 h-5" />
          </button>
          <button
            onClick={onSettings}
            className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-white"
            title="Settings"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};









