import React, { useState } from 'react';
import { X, Settings, PenTool, Eye, EyeOff, RotateCcw, MessageSquare, Palette, Ruler } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState('whiteboard');
  const [showFeedback, setShowFeedback] = useState(true);
  const [inputMethod, setInputMethod] = useState<'finger' | 'pencil'>('finger');

  if (!isOpen) return null;

  const tabs = [
    { id: 'general', name: 'General', icon: Settings },
    { id: 'chiron', name: 'Chiron', icon: MessageSquare },
    { id: 'whiteboard', name: 'Whiteboard', icon: PenTool },
    { id: 'handwriting', name: 'Handwriting', icon: Palette },
    { id: 'misc', name: 'Misc', icon: Ruler }
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-xl font-semibold text-white">Settings</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-700">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'text-blue-400 border-b-2 border-blue-400 bg-blue-400/10'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.name}</span>
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="p-6 max-h-96 overflow-y-auto">
          {activeTab === 'general' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-white">General Settings</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Theme
                  </label>
                  <select className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white">
                    <option value="dark">Dark</option>
                    <option value="light">Light</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Language
                  </label>
                  <select className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white">
                    <option value="en">English</option>
                    <option value="es">Spanish</option>
                    <option value="fr">French</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'chiron' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-white">Chiron Settings</h3>
              <div className="space-y-4">
                <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                  <h4 className="font-medium text-blue-400 mb-2">Mathematical Context</h4>
                  <p className="text-sm text-gray-300">
                    Enable automatic variable definition and context recognition for better equation solving.
                  </p>
                </div>
                <div>
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded"
                      defaultChecked
                    />
                    <span className="text-sm text-gray-300">Auto-define variables</span>
                  </label>
                </div>
                <div>
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded"
                      defaultChecked
                    />
                    <span className="text-sm text-gray-300">Step-by-step validation</span>
                  </label>
                </div>
                <div>
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded"
                    />
                    <span className="text-sm text-gray-300">Show mathematical hints</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'whiteboard' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-white">Whiteboard Settings</h3>
              
              {/* Drawing Section */}
              <div>
                <h4 className="font-medium text-white mb-3 flex items-center">
                  <PenTool className="w-4 h-4 mr-2" />
                  Drawing
                </h4>
                <p className="text-sm text-gray-400 mb-4">
                  Use one finger to draw and two fingers to scroll
                </p>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setInputMethod('finger')}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                      inputMethod === 'finger'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    <span>👆</span>
                    <span>Finger</span>
                  </button>
                  <button
                    onClick={() => setInputMethod('pencil')}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                      inputMethod === 'pencil'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    <span>✏️</span>
                    <span>Pencil</span>
                  </button>
                </div>
              </div>

              {/* Feedback Toggle */}
              <div>
                <h4 className="font-medium text-white mb-3 flex items-center">
                  <span className="mr-2">📝</span>
                  Feedback Toggle
                </h4>
                <p className="text-sm text-gray-400 mb-4">
                  Provides a toggle to quickly switch feedback on or off
                </p>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowFeedback(false)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                      !showFeedback
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    <EyeOff className="w-4 h-4" />
                    <span>Hide</span>
                  </button>
                  <button
                    onClick={() => setShowFeedback(true)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                      showFeedback
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    <Eye className="w-4 h-4" />
                    <span>Show</span>
                  </button>
                </div>
              </div>

              {/* Clean Slate */}
              <div>
                <h4 className="font-medium text-white mb-3 flex items-center">
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Clean Slate
                </h4>
                <p className="text-sm text-gray-400 mb-4">
                  Start fresh with a clean board or new conversation
                </p>
                <div className="flex space-x-3">
                  <button className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors">
                    Clear Board
                  </button>
                  <button className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors">
                    Reset Chat
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'handwriting' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-white">Handwriting Settings</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Recognition Engine
                  </label>
                  <select className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white">
                    <option value="mathpix">Mathpix (Recommended)</option>
                    <option value="google">Google ML Kit</option>
                    <option value="microsoft">Microsoft Cognitive Services</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Stroke Sensitivity
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    defaultValue="5"
                    className="w-full"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'misc' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-white">Miscellaneous</h3>
              <div className="space-y-4">
                <div>
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded"
                      defaultChecked
                    />
                    <span className="text-sm text-gray-300">Auto-save drawings</span>
                  </label>
                </div>
                <div>
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded"
                    />
                    <span className="text-sm text-gray-300">Show grid lines</span>
                  </label>
                </div>
                <div>
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded"
                      defaultChecked
                    />
                    <span className="text-sm text-gray-300">Enable haptic feedback</span>
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};









