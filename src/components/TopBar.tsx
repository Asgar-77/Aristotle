import React from 'react';
import { Plus, Settings, ArrowLeft, Home } from 'lucide-react';

interface TopBarProps {
  currentView: 'home' | 'topic' | 'whiteboard';
  selectedTopic?: string;
  onNewBoard: () => void;
  onBackToHome: () => void;
  onSettings: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  currentView,
  selectedTopic,
  onNewBoard,
  onBackToHome,
  onSettings
}) => {
  const getTitle = () => {
    switch (currentView) {
      case 'home':
        return 'Welcome';
      case 'topic':
        return selectedTopic ? selectedTopic.charAt(0).toUpperCase() + selectedTopic.slice(1) : 'Topic';
      case 'whiteboard':
        return 'Whiteboard';
      default:
        return 'MathScribe';
    }
  };

  return (
    <div className="bg-gray-900 border-b border-gray-800 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Left Side */}
        <div className="flex items-center space-x-4">
          {currentView !== 'home' && (
            <button
              onClick={onBackToHome}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-400" />
            </button>
          )}
          
          <div className="flex items-center space-x-3">
            {currentView === 'home' && (
              <Home className="w-6 h-6 text-blue-400" />
            )}
            <h1 className="text-2xl font-bold text-white">{getTitle()}</h1>
          </div>
        </div>

        {/* Right Side */}
        <div className="flex items-center space-x-3">
          {currentView !== 'whiteboard' && (
            <button
              onClick={onNewBoard}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors shadow-lg"
            >
              <Plus className="w-5 h-5" />
              <span>New</span>
            </button>
          )}
          
          <button
            onClick={onSettings}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <Settings className="w-5 h-5 text-gray-400" />
          </button>
        </div>
      </div>
    </div>
  );
};
