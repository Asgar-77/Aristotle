import React from 'react';
import { Calendar, FileText, Trash2, Home, BookOpen, PenTool } from 'lucide-react';
import { Board } from '../types';

interface PracticeDashboardProps {
  notebooks: Board[];
  onNewNotebook: () => void;
  onOpenNotebook: (notebook: Board) => void;
  onDeleteNotebook: (id: string) => void;
  onGoHome: () => void;
}

export const PracticeDashboard: React.FC<PracticeDashboardProps> = ({
  notebooks,
  onNewNotebook,
  onOpenNotebook,
  onDeleteNotebook,
  onGoHome
}) => {

  const formatDate = (dateString: string | Date) => {
    try {
      const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return 'Recent';
      }
      
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    } catch (error) {
      return 'Recent';
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex">
      {/* Enhanced Sidebar */}
      <div className="w-80 bg-gradient-to-b from-gray-900 to-gray-800 border-r border-purple-500/30 shadow-2xl">
        <div className="p-6">
          {/* Aristotle Branding */}
          <div className="flex items-center space-x-3 mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl flex items-center justify-center transform rotate-12 hover:rotate-0 transition-transform duration-500 animate-glow">
              <span className="text-white font-bold text-lg">𝒜</span>
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                Aristotle
              </h1>
              <p className="text-xs text-gray-400">Smart Math Learning</p>
            </div>
          </div>

          {/* Navigation Options */}
          <nav className="space-y-4 mb-8">
            <button
              onClick={onGoHome}
              className="w-full flex items-center space-x-3 px-4 py-3 bg-gradient-to-r from-purple-600/20 to-blue-600/20 hover:from-purple-600/40 hover:to-blue-600/40 border border-purple-500/30 rounded-xl transition-all duration-300 transform hover:scale-105"
            >
              <Home className="w-5 h-5 text-purple-400" />
              <span className="font-medium">Home</span>
            </button>
            <button
              className="w-full flex items-center space-x-3 px-4 py-3 bg-gradient-to-r from-blue-600/40 to-purple-600/40 border border-blue-400/50 rounded-xl"
            >
              <BookOpen className="w-5 h-5 text-blue-400" />
              <span className="font-medium">Notebooks</span>
            </button>
          </nav>

          {/* Create New Options */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Create New</h3>
            
            {/* Start New Practice */}
            <button
              onClick={onNewNotebook}
              className="w-full flex items-center space-x-3 px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              <PenTool className="w-5 h-5" />
              <span className="font-medium">Start New Practice</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1">
        {/* Top Header */}
        <div className="bg-gradient-to-r from-gray-900 to-gray-800 border-b border-purple-500/30 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                Your Notebooks
              </h1>
              <p className="text-gray-400 text-sm">Manage and create your math problem collections</p>
            </div>
            <div className="text-sm text-gray-400">
              {notebooks.length} {notebooks.length === 1 ? 'notebook' : 'notebooks'}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="p-6">
          {notebooks.length === 0 ? (
            /* Enhanced Empty State */
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-32 h-32 bg-gradient-to-br from-purple-600/20 to-blue-600/20 rounded-3xl flex items-center justify-center mb-8 border border-purple-500/30">
                <FileText className="w-16 h-16 text-purple-400" />
              </div>
              <h3 className="text-3xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                Ready to Start Learning?
              </h3>
              <p className="text-gray-300 mb-12 text-center max-w-lg text-lg leading-relaxed">
                Create your first notebook to start practicing math step by step with Aristotle's AI-powered guidance ✨
              </p>
              <div className="flex justify-center">
                <button
                  onClick={onNewNotebook}
                  className="flex items-center space-x-3 px-12 py-6 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 rounded-2xl font-bold text-lg transition-all duration-300 transform hover:scale-105 shadow-2xl hover:shadow-green-500/30"
                >
                  <PenTool className="w-6 h-6" />
                  <span>Start Your First Practice</span>
                </button>
              </div>
            </div>
          ) : (
            /* Enhanced Notebooks Grid */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {notebooks.map((notebook) => (
                <div
                  key={notebook.id}
                  className="group relative bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl border border-purple-500/20 hover:border-purple-400/40 transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/20 transform hover:scale-105"
                >
                {/* Thumbnail Preview */}
                <div className="aspect-video bg-gray-800 rounded-t-xl relative overflow-hidden">
                  {notebook.thumbnail ? (
                    <img
                      src={notebook.thumbnail}
                      alt={notebook.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <FileText className="w-12 h-12 text-gray-500" />
                    </div>
                  )}
                  
                  {/* Overlay on hover */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                    <button
                      onClick={() => onOpenNotebook(notebook)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors"
                    >
                      Open Notebook
                    </button>
                  </div>
                </div>

                {/* Notebook Info */}
                <div className="p-4">
                  <h3 className="font-semibold text-white mb-2 truncate">
                    {notebook.title}
                  </h3>
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-400">
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(notebook.date)}</span>
                    </div>
                  </div>

                  {notebook.topic && (
                    <div className="mt-2">
                      <span className="inline-block px-2 py-1 bg-blue-600/20 text-blue-400 text-xs rounded-md">
                        {notebook.topic}
                      </span>
                    </div>
                  )}
                </div>

                {/* Delete Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteNotebook(notebook.id);
                  }}
                  className="absolute top-2 right-2 p-1 bg-red-600/20 hover:bg-red-600/30 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200"
                >
                  <Trash2 className="w-4 h-4 text-red-400" />
                </button>
              </div>
            ))}
          </div>
          )}
        </div>
      </div>

    </div>
  );
};
