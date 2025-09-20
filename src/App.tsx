import React, { useState, useCallback, useEffect } from 'react';
import { 
  Settings, 
  Search, 
  Plus, 
  ChevronDown, 
  ChevronRight,
  MessageCircle,
  Home,
  BookOpen,
  Calculator,
  FunctionSquare,
  Triangle,
  Infinity,
  Hash,
  PenTool,
  Brain,
  CheckCircle,
  XCircle,
  AlertCircle,
  Mic,
  Eraser,
  Palette,
  Undo,
  Redo,
  Download,
  Share
} from 'lucide-react';
import { DrawingCanvas } from './components/DrawingCanvas';
import { OutputPanel } from './components/OutputPanel';
import { StepByStepDisplay } from './components/StepByStepDisplay';
import { SettingsModal } from './components/SettingsModal';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { ContentGrid } from './components/ContentGrid';
import { WhiteboardView } from './components/WhiteboardView';
import { NotebookView } from './components/NotebookView';
import { NotebookCanvas } from './components/NotebookCanvas';
import { FabricNotebookCanvas } from './components/FabricNotebookCanvas';
import { LandingPage } from './components/LandingPage';
import { PracticeDashboard } from './components/PracticeDashboard';
import { BottomToolbar } from './components/BottomToolbar';
import { recognitionService } from './services/recognition';
import { Stroke, RecognitionResult, DrawingData, MathStep, StepByStepResult, Topic, Board } from './types';

// Topics for sidebar navigation
const TOPICS: Topic[] = [
  { id: 'welcome', name: 'Welcome', icon: Home, color: 'text-blue-400', isExpanded: true },
  { id: 'examples', name: 'Examples', icon: BookOpen, color: 'text-green-400', isExpanded: false },
  { 
    id: 'algebra', 
    name: 'Algebra', 
    icon: FunctionSquare, 
    color: 'text-purple-400', 
    isExpanded: false,
    children: [
      { id: 'linear', name: 'Linear Equations', icon: FunctionSquare, color: 'text-purple-300', isExpanded: false },
      { id: 'quadratic', name: 'Quadratic Equations', icon: FunctionSquare, color: 'text-purple-300', isExpanded: false },
      { id: 'polynomials', name: 'Polynomials', icon: FunctionSquare, color: 'text-purple-300', isExpanded: false }
    ]
  },
  { 
    id: 'geometry', 
    name: 'Geometry', 
    icon: Triangle, 
    color: 'text-orange-400', 
    isExpanded: false,
    children: [
      { id: 'triangles', name: 'Triangles', icon: Triangle, color: 'text-orange-300', isExpanded: false },
      { id: 'circles', name: 'Circles', icon: Triangle, color: 'text-orange-300', isExpanded: false }
    ]
  },
  { id: 'calculus', name: 'Calculus', icon: Infinity, color: 'text-pink-400', isExpanded: false },
  { id: 'trigonometry', name: 'Trigonometry', icon: Hash, color: 'text-cyan-400', isExpanded: false }
];

// Mock boards data
const MOCK_BOARDS: Board[] = [
  {
    id: '1',
    title: 'Quadratic Formula',
    thumbnail: '/api/placeholder/300/200',
    date: '2024-01-15',
    topic: 'algebra',
    strokes: [],
    result: { latex: 'x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}', plainText: 'x equals negative b plus or minus square root of b squared minus 4ac over 2a', confidence: 0.95 }
  },
  {
    id: '2',
    title: 'Derivative Rules',
    thumbnail: '/api/placeholder/300/200',
    date: '2024-01-14',
    topic: 'calculus',
    strokes: [],
    result: { latex: '\\frac{d}{dx}[x^n] = nx^{n-1}', plainText: 'derivative of x to the n equals n times x to the n minus 1', confidence: 0.92 }
  },
  {
    id: '3',
    title: 'Pythagorean Theorem',
    thumbnail: '/api/placeholder/300/200',
    date: '2024-01-13',
    topic: 'geometry',
    strokes: [],
    result: { latex: 'a^2 + b^2 = c^2', plainText: 'a squared plus b squared equals c squared', confidence: 0.98 }
  }
];

function App() {
  // App state
  const [appState, setAppState] = useState<AppState>({
    currentView: 'landing', // Start with landing page
    searchQuery: ''
  });

  // Notebook state
  const [notebooks, setNotebooks] = useState<Board[]>([]);
  const [currentNotebook, setCurrentNotebook] = useState<Board | null>(null);

  // Load notebooks from localStorage on component mount
  useEffect(() => {
    try {
      const savedNotebooks = localStorage.getItem('math-notebooks');
      if (savedNotebooks) {
        const parsed = JSON.parse(savedNotebooks);
        setNotebooks(parsed);
      }
    } catch (error) {
      console.error('Failed to load notebooks from localStorage:', error);
    }
  }, []);

  // Save notebooks to localStorage whenever notebooks change
  useEffect(() => {
    try {
      localStorage.setItem('math-notebooks', JSON.stringify(notebooks));
    } catch (error) {
      console.error('Failed to save notebooks to localStorage:', error);
    }
  }, [notebooks]);
  
  // Whiteboard state
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [result, setResult] = useState<RecognitionResult | null>(null);
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: 'correct' | 'incorrect' | 'partial' | 'neutral';
    message: string;
  } | null>(null);
  const [stepByStepResult, setStepByStepResult] = useState<StepByStepResult | null>(null);
  
  // UI state
  const [showSettings, setShowSettings] = useState(false);
  const [strokeColor, setStrokeColor] = useState('#1DA1F2'); // Electric blue
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [history, setHistory] = useState<Stroke[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [topics, setTopics] = useState<Topic[]>(TOPICS);
  const [boards, setBoards] = useState<Board[]>(MOCK_BOARDS);

  // Navigation handlers
  const handleTopicSelect = useCallback((topicId: string) => {
    setAppState(prev => ({
      ...prev,
      currentView: 'topic',
      selectedTopic: topicId
    }));
  }, []);

  const handleBoardSelect = useCallback((board: Board) => {
    setAppState(prev => ({
      ...prev,
      currentView: 'whiteboard',
      selectedBoard: board
    }));
    setStrokes(board.strokes);
    setResult(board.result || null);
  }, []);

  const handleNewBoard = useCallback(() => {
    const newBoard: Board = {
      id: Date.now().toString(),
      title: 'New Board',
      thumbnail: '/api/placeholder/300/200',
      date: new Date().toISOString().split('T')[0],
      topic: appState.selectedTopic || 'welcome',
      strokes: [],
    };
    
    setBoards(prev => [newBoard, ...prev]);
    setAppState(prev => ({
      ...prev,
      currentView: 'whiteboard',
      selectedBoard: newBoard
    }));
  }, [appState.selectedTopic]);

  const handleBackToHome = useCallback(() => {
    setAppState(prev => ({
      ...prev,
      currentView: 'home',
      selectedTopic: undefined,
      selectedBoard: undefined
    }));
  }, []);

  const handleOpenNotebook = useCallback(() => {
    setAppState(prev => ({
      ...prev,
      currentView: 'notebook'
    }));
  }, []);

  // New flow handlers
  const handleStartPracticing = useCallback(() => {
    setAppState(prev => ({
      ...prev,
      currentView: 'dashboard'
    }));
  }, []);

  const handleGoHome = useCallback(() => {
    setAppState(prev => ({
      ...prev,
      currentView: 'landing'
    }));
  }, []);

  const handleNewNotebook = useCallback(() => {
    setCurrentNotebook(null);
    setAppState(prev => ({
      ...prev,
      currentView: 'notebook'
    }));
  }, []);

  const handleOpenExistingNotebook = useCallback((notebook: Board) => {
    console.log('Opening existing notebook:', notebook);
    setCurrentNotebook(notebook);
    setAppState(prev => ({
      ...prev,
      currentView: 'notebook'
    }));
  }, []);

  const handleSaveNotebook = useCallback((notebook: any) => {
    // Ensure we have a valid notebook with all required data
    const enhancedNotebook = {
      ...notebook,
      id: notebook.id || Date.now().toString(),
      title: notebook.title || `Notebook ${new Date().toLocaleDateString()}`,
      date: notebook.lastModified || new Date().toISOString(),
      topic: 'math', // Default topic
      strokes: notebook.steps ? notebook.steps.map(step => step.strokes || []).flat() : [],
      result: null,
      steps: notebook.steps || [],
      problem: notebook.problem || '',
      inputModeData: notebook.inputModeData || {},
      thumbnail: notebook.thumbnail || null,
      createdAt: notebook.createdAt || new Date().toISOString(),
      lastModified: new Date().toISOString()
    };

    setNotebooks(prev => {
      const existingIndex = prev.findIndex(n => n.id === enhancedNotebook.id);
      if (existingIndex >= 0) {
        // Update existing notebook
        const updated = [...prev];
        updated[existingIndex] = enhancedNotebook;
        console.log('Updated existing notebook:', enhancedNotebook);
        return updated;
      } else {
        // Add new notebook
        console.log('Added new notebook:', enhancedNotebook);
        return [...prev, enhancedNotebook];
      }
    });
    
    // Update current notebook
    setCurrentNotebook(enhancedNotebook);
    
    // Don't automatically navigate away - let user stay in notebook
    console.log('Notebook saved successfully!');
  }, []);

  const handleDeleteNotebook = useCallback((id: string) => {
    setNotebooks(prev => prev.filter(n => n.id !== id));
  }, []);

  const handleSearch = useCallback((query: string) => {
    setAppState(prev => ({
      ...prev,
      searchQuery: query
    }));
  }, []);

  // Whiteboard handlers
  const handleStrokesChange = useCallback((newStrokes: Stroke[]) => {
    setStrokes(newStrokes);
  }, []);

  const handleClear = useCallback(() => {
    setStrokes([]);
    setResult(null);
    setStepByStepResult(null);
    setIsRecognizing(false);
    setFeedback(null);
  }, []);

  // Undo/Redo functionality
  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setStrokes(history[newIndex]);
    }
  }, [historyIndex, history]);

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setStrokes(history[newIndex]);
    }
  }, [historyIndex, history]);

  // Update history when strokes change
  useEffect(() => {
    if (strokes.length > 0) {
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push([...strokes]);
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
    }
  }, [strokes]);

  const handleDownload = useCallback(() => {
    console.log('Download triggered');
  }, []);

  const handleCopy = useCallback(() => {
    if (result?.latex) {
      navigator.clipboard.writeText(result.latex);
    }
  }, [result]);

  // Render different views based on current state
  if (appState.currentView === 'landing') {
    return <LandingPage onStartPracticing={handleStartPracticing} />;
  }

  if (appState.currentView === 'dashboard') {
    return (
      <PracticeDashboard
        notebooks={notebooks}
        onNewNotebook={handleNewNotebook}
        onOpenNotebook={handleOpenExistingNotebook}
        onDeleteNotebook={handleDeleteNotebook}
        onGoHome={handleGoHome}
      />
    );
  }

  if (appState.currentView === 'notebook') {
    // Try Fabric.js first, fallback to original canvas if there are issues
    try {
      return (
        <FabricNotebookCanvas
          onBack={() => setAppState(prev => ({ ...prev, currentView: 'dashboard' }))}
          onSave={handleSaveNotebook}
          existingNotebook={currentNotebook}
        />
      );
    } catch (error) {
      console.warn('Fabric.js not available, falling back to HTML5 Canvas:', error);
      return (
        <NotebookCanvas
          onBack={() => setAppState(prev => ({ ...prev, currentView: 'dashboard' }))}
          onSave={handleSaveNotebook}
          onSettings={() => setShowSettings(true)}
        />
      );
    }
  }

  // Original layout for other views
  return (
    <div className="min-h-screen bg-black text-white flex">
      {/* Left Sidebar */}
      <Sidebar
        topics={topics}
        onTopicSelect={handleTopicSelect}
        onOpenNotebook={handleOpenNotebook}
        onSearch={handleSearch}
        searchQuery={appState.searchQuery}
        selectedTopic={appState.selectedTopic}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <TopBar
          currentView={appState.currentView}
          selectedTopic={appState.selectedTopic}
          onNewBoard={handleNewBoard}
          onBackToHome={handleBackToHome}
          onSettings={() => setShowSettings(true)}
        />

        {/* Content Area */}
        <main className="flex-1 overflow-hidden">
          {appState.currentView === 'home' && (
            <ContentGrid
              boards={boards}
              onBoardSelect={handleBoardSelect}
              onOpenNotebook={handleOpenNotebook}
              searchQuery={appState.searchQuery}
            />
          )}

          {appState.currentView === 'topic' && (
            <ContentGrid
              boards={boards.filter(board => board.topic === appState.selectedTopic)}
              onBoardSelect={handleBoardSelect}
              onOpenNotebook={handleOpenNotebook}
              searchQuery={appState.searchQuery}
            />
          )}

          {appState.currentView === 'whiteboard' && (
            <WhiteboardView
              strokes={strokes}
              onStrokesChange={handleStrokesChange}
              result={result}
              isRecognizing={isRecognizing}
              feedback={feedback}
              stepByStepResult={stepByStepResult}
              onClear={handleClear}
              strokeColor={strokeColor}
              strokeWidth={strokeWidth}
              onColorChange={setStrokeColor}
              onWidthChange={setStrokeWidth}
            />
          )}
        </main>

        {/* Bottom Toolbar - Only in whiteboard view */}
        {appState.currentView === 'whiteboard' && (
          <BottomToolbar
            onUndo={handleUndo}
            onRedo={handleRedo}
            onClear={handleClear}
            onDownload={handleDownload}
            onCopy={handleCopy}
            canUndo={historyIndex > 0}
            canRedo={historyIndex < history.length - 1}
            strokeColor={strokeColor}
            onColorChange={setStrokeColor}
            strokeWidth={strokeWidth}
            onWidthChange={setStrokeWidth}
          />
        )}
      </div>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />
    </div>
  );
}

export default App;