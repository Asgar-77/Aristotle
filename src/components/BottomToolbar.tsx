import React, { useState } from 'react';
import { 
  Undo, 
  Redo, 
  Palette, 
  Ruler, 
  Download, 
  Copy, 
  Mic,
  Eraser,
  Trash2
} from 'lucide-react';

interface BottomToolbarProps {
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
  onDownload: () => void;
  onCopy: () => void;
  canUndo: boolean;
  canRedo: boolean;
  strokeColor: string;
  onColorChange: (color: string) => void;
  strokeWidth: number;
  onWidthChange: (width: number) => void;
}

export const BottomToolbar: React.FC<BottomToolbarProps> = ({
  onUndo,
  onRedo,
  onClear,
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
    { name: 'Blue', value: '#1DA1F2', bg: 'bg-blue-500' },
    { name: 'White', value: '#ffffff', bg: 'bg-white' },
    { name: 'Green', value: '#00C853', bg: 'bg-green-500' },
    { name: 'Red', value: '#FF5252', bg: 'bg-red-500' },
    { name: 'Yellow', value: '#FFD600', bg: 'bg-yellow-500' },
    { name: 'Orange', value: '#FF9800', bg: 'bg-orange-500' },
    { name: 'Purple', value: '#9C27B0', bg: 'bg-purple-500' },
    { name: 'Pink', value: '#E91E63', bg: 'bg-pink-500' }
  ];

  const widths = [1, 2, 3, 4, 5, 8, 12, 16, 20];

  return (
    <div className="bg-gray-900 border-t border-gray-800 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Left Section - Undo/Redo */}
        <div className="flex items-center space-x-2">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className={`p-3 rounded-lg transition-all ${
              canUndo
                ? 'bg-gray-800 hover:bg-gray-700 text-white'
                : 'bg-gray-900 text-gray-500 cursor-not-allowed'
            }`}
          >
            <Undo className="w-5 h-5" />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className={`p-3 rounded-lg transition-all ${
              canRedo
                ? 'bg-gray-800 hover:bg-gray-700 text-white'
                : 'bg-gray-900 text-gray-500 cursor-not-allowed'
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
              className="flex items-center space-x-2 px-4 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <div
                className="w-5 h-5 rounded-full border-2 border-gray-400"
                style={{ backgroundColor: strokeColor }}
              />
              <Palette className="w-5 h-5 text-white" />
            </button>
            
            {showColorPicker && (
              <div className="absolute bottom-full left-0 mb-2 p-4 bg-gray-800 rounded-lg shadow-xl border border-gray-700 z-10">
                <div className="grid grid-cols-4 gap-3">
                  {colors.map((color) => (
                    <button
                      key={color.value}
                      onClick={() => {
                        onColorChange(color.value);
                        setShowColorPicker(false);
                      }}
                      className={`w-10 h-10 rounded-full border-2 transition-all hover:scale-110 ${
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
              className="flex items-center space-x-2 px-4 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <div
                className="bg-white rounded-full"
                style={{ width: Math.max(2, strokeWidth), height: Math.max(2, strokeWidth) }}
              />
              <Ruler className="w-5 h-5 text-white" />
            </button>
            
            {showWidthPicker && (
              <div className="absolute bottom-full left-0 mb-2 p-4 bg-gray-800 rounded-lg shadow-xl border border-gray-700 z-10">
                <div className="space-y-2">
                  {widths.map((width) => (
                    <button
                      key={width}
                      onClick={() => {
                        onWidthChange(width);
                        setShowWidthPicker(false);
                      }}
                      className={`w-full flex items-center space-x-3 px-3 py-2 rounded transition-colors ${
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

          {/* Clear Button */}
          <button
            onClick={onClear}
            className="flex items-center space-x-2 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
          >
            <Trash2 className="w-5 h-5" />
            <span>Clear</span>
          </button>
        </div>

        {/* Right Section - Actions */}
        <div className="flex items-center space-x-2">
          <button
            onClick={onCopy}
            className="p-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors text-white"
            title="Copy LaTeX"
          >
            <Copy className="w-5 h-5" />
          </button>
          <button
            onClick={onDownload}
            className="p-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors text-white"
            title="Download"
          >
            <Download className="w-5 h-5" />
          </button>
          <button
            className="p-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors text-white"
            title="Voice Input"
          >
            <Mic className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
