import React, { useState } from 'react';
import { 
  Settings, 
  Search, 
  ChevronDown, 
  ChevronRight,
  MessageCircle,
  Home,
  BookOpen,
  Calculator,
  FunctionSquare,
  Triangle,
  Infinity,
  Hash
} from 'lucide-react';
import { Topic } from '../types';

interface SidebarProps {
  topics: Topic[];
  onTopicSelect: (topicId: string) => void;
  onOpenNotebook?: () => void;
  onSearch: (query: string) => void;
  searchQuery: string;
  selectedTopic?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  topics,
  onTopicSelect,
  onOpenNotebook,
  onSearch,
  searchQuery,
  selectedTopic
}) => {
  const [expandedTopics, setExpandedTopics] = useState<Set<string>>(new Set(['welcome']));

  const toggleTopic = (topicId: string) => {
    setExpandedTopics(prev => {
      const newSet = new Set(prev);
      if (newSet.has(topicId)) {
        newSet.delete(topicId);
      } else {
        newSet.add(topicId);
      }
      return newSet;
    });
  };

  const renderTopic = (topic: Topic, level: number = 0) => {
    const Icon = topic.icon;
    const isExpanded = expandedTopics.has(topic.id);
    const hasChildren = topic.children && topic.children.length > 0;
    const isSelected = selectedTopic === topic.id;

    return (
      <div key={topic.id}>
        <button
          onClick={() => {
            if (hasChildren) {
              toggleTopic(topic.id);
            } else {
              onTopicSelect(topic.id);
            }
          }}
          className={`w-full flex items-center space-x-3 px-4 py-3 text-left transition-all hover:bg-gray-800/50 ${
            isSelected ? 'bg-blue-500/20 border-r-2 border-blue-500' : ''
          }`}
          style={{ paddingLeft: `${16 + level * 20}px` }}
        >
          {hasChildren && (
            <div className="flex-shrink-0">
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 text-gray-400" />
              ) : (
                <ChevronRight className="w-4 h-4 text-gray-400" />
              )}
            </div>
          )}
          {!hasChildren && <div className="w-4" />}
          
          <Icon className={`w-5 h-5 ${topic.color} flex-shrink-0`} />
          <span className="text-sm font-medium text-white truncate">
            {topic.name}
          </span>
        </button>
        
        {hasChildren && isExpanded && (
          <div>
            {topic.children?.map(child => renderTopic(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col h-screen">
      {/* Header */}
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
              <Calculator className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold text-white">MathScribe</span>
          </div>
          <button className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
            <Settings className="w-5 h-5 text-gray-400" />
          </button>
        </div>
        
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => onSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto">
        <div className="py-2">
          {/* Notebook Button */}
          {onOpenNotebook && (
            <button
              onClick={onOpenNotebook}
              className="w-full flex items-center space-x-3 px-4 py-3 text-left transition-all hover:bg-gray-800/50 mb-2"
            >
              <div className="w-4" />
              <BookOpen className="w-5 h-5 text-blue-400 flex-shrink-0" />
              <span className="text-sm font-medium text-white truncate">
                Notebook
              </span>
            </button>
          )}
          
          {topics.map(topic => renderTopic(topic))}
        </div>
      </div>

      {/* Discord Button */}
      <div className="p-4 border-t border-gray-800">
        <button className="w-full flex items-center space-x-3 px-4 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors">
          <MessageCircle className="w-5 h-5 text-white" />
          <span className="text-sm font-medium text-white">Discord</span>
        </button>
      </div>
    </div>
  );
};
