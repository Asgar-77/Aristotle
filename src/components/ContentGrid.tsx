import React from 'react';
import { Board } from '../types';
import { Calendar, FileText } from 'lucide-react';

interface ContentGridProps {
  boards: Board[];
  onBoardSelect: (board: Board) => void;
  onOpenNotebook?: () => void;
  searchQuery: string;
}

export const ContentGrid: React.FC<ContentGridProps> = ({
  boards,
  onBoardSelect,
  onOpenNotebook,
  searchQuery
}) => {
  const filteredBoards = boards.filter(board =>
    board.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    board.topic.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 h-full overflow-y-auto">
      {filteredBoards.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-center">
          <div className="w-24 h-24 bg-gray-800 rounded-full flex items-center justify-center mb-4">
            <FileText className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">No boards found</h3>
          <p className="text-gray-400 mb-6">
            {searchQuery ? 'Try adjusting your search terms' : 'Create your first math board to get started'}
          </p>
          <div className="flex space-x-4">
            <button 
              onClick={onOpenNotebook}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              Open Notebook
            </button>
            <button className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors">
              Create New Board
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredBoards.map((board) => (
            <div
              key={board.id}
              onClick={() => onBoardSelect(board)}
              className="group cursor-pointer bg-gray-900 rounded-lg border border-gray-800 overflow-hidden hover:border-blue-500/50 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300"
            >
              {/* Thumbnail */}
              <div className="aspect-video bg-gray-800 relative overflow-hidden">
                {board.thumbnail ? (
                  <img
                    src={board.thumbnail}
                    alt={board.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="text-4xl text-gray-600">📝</div>
                  </div>
                )}
                
                {/* Overlay on hover */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <div className="text-white text-sm font-medium">Open Board</div>
                </div>
              </div>

              {/* Content */}
              <div className="p-4">
                <h3 className="text-white font-semibold text-lg mb-2 truncate">
                  {board.title}
                </h3>
                
                <div className="flex items-center justify-between text-sm text-gray-400">
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-4 h-4" />
                    <span>{board.date}</span>
                  </div>
                  <span className="px-2 py-1 bg-gray-800 rounded text-xs">
                    {board.topic}
                  </span>
                </div>

                {/* Confidence indicator if available */}
                {board.result && (
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                      <span>Recognition</span>
                      <span>{(board.result.confidence * 100).toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-1.5">
                      <div
                        className={`h-1.5 rounded-full transition-all duration-500 ${
                          board.result.confidence > 0.8 ? 'bg-green-500' :
                          board.result.confidence > 0.6 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${board.result.confidence * 100}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
