import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  CheckCircle, 
  XCircle, 
  Circle, 
  HelpCircle,
  Mic,
  PenTool,
  Eraser,
  Palette,
  Undo,
  Redo,
  Settings,
  ArrowLeft
} from 'lucide-react';
import { NotebookStep, Stroke } from '../types';
import { MathDrawingCanvas } from './MathDrawingCanvas';

interface NotebookViewProps {
  onBack: () => void;
  onSettings: () => void;
}

export const NotebookView: React.FC<NotebookViewProps> = ({
  onBack,
  onSettings
}) => {
  const [steps, setSteps] = useState<NotebookStep[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [showFeedback, setShowFeedback] = useState(true);
  const [showHints, setShowHints] = useState(true);
  const [strokeColor, setStrokeColor] = useState('#1DA1F2'); // Electric blue
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [hoveredStep, setHoveredStep] = useState<number | null>(null);
  
  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize a new step
  const addNewStep = useCallback(() => {
    const newStep: NotebookStep = {
      id: steps.length + 1,
      content: '',
      latex: '',
      status: 'current',
      timestamp: Date.now(),
      strokes: []
    };
    setSteps(prev => [...prev, newStep]);
    setCurrentStep(steps.length);
  }, [steps.length]);

  // Initialize first step
  useEffect(() => {
    if (steps.length === 0) {
      addNewStep();
    }
  }, [steps.length, addNewStep]);


  const getStepIcon = (step: NotebookStep) => {
    switch (step.status) {
      case 'correct':
        return <CheckCircle className="w-6 h-6 text-green-500" />;
      case 'incorrect':
        return <XCircle className="w-6 h-6 text-red-500" />;
      case 'current':
        return <Circle className="w-6 h-6 text-blue-500" />;
      default:
        return <Circle className="w-6 h-6 text-gray-500" />;
    }
  };

  const getStepColor = (step: NotebookStep) => {
    switch (step.status) {
      case 'correct':
        return 'border-green-500';
      case 'incorrect':
        return 'border-red-500';
      case 'current':
        return 'border-blue-500';
      default:
        return 'border-gray-500';
    }
  };

  return (
    <div className="h-screen bg-black text-white flex flex-col">
      {/* Top Navigation */}
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-400" />
          </button>
          <h1 className="text-xl font-semibold">Math Notebook</h1>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowHints(!showHints)}
            className={`p-2 rounded-lg transition-colors ${
              showHints ? 'bg-blue-600' : 'bg-gray-800 hover:bg-gray-700'
            }`}
          >
            <HelpCircle className="w-5 h-5" />
          </button>
          <button
            onClick={onSettings}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <Settings className="w-5 h-5 text-gray-400" />
          </button>
        </div>
      </div>

      {/* Notebook Content */}
      <div className="flex-1 overflow-y-auto" ref={containerRef}>
        <div className="max-w-6xl mx-auto p-6">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className="relative mb-1"
              onMouseEnter={() => setHoveredStep(step.id)}
              onMouseLeave={() => setHoveredStep(null)}
            >
              {/* Step Marker */}
              <div className="absolute left-0 top-0 w-12 h-12 flex items-center justify-center">
                <div className={`w-8 h-8 rounded-full border-2 ${getStepColor(step)} flex items-center justify-center bg-black`}>
                  {getStepIcon(step)}
                </div>
              </div>

              {/* Real-time LaTeX Canvas */}
              <div className="ml-16">
                <MathDrawingCanvas
                  initialStrokes={step.strokes}
                  onStrokesChange={(strokes) => {
                    setSteps(prev => prev.map(s => 
                      s.id === step.id ? { ...s, strokes } : s
                    ));
                  }}
                  onLatexChange={(latex) => {
                    setSteps(prev => prev.map(s => 
                      s.id === step.id ? { ...s, latex } : s
                    ));
                  }}
                />
              </div>

              {/* Hint Tooltip */}
              {showHints && step.hint && hoveredStep === step.id && (
                <div className="absolute left-16 top-16 bg-blue-600 text-white text-xs px-3 py-2 rounded-lg shadow-lg z-10">
                  {step.hint}
                  <div className="absolute -top-1 left-4 w-2 h-2 bg-blue-600 transform rotate-45"></div>
                </div>
              )}

              {/* Error Strikethrough */}
              {step.status === 'incorrect' && (
                <div className="absolute left-16 top-7 w-full h-0.5 bg-red-500 z-10"></div>
              )}
            </div>
          ))}

          {/* Add New Step Button */}
          <button
            onClick={addNewStep}
            className="ml-16 mt-4 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors text-sm"
          >
            + Add Step
          </button>
        </div>
      </div>

      {/* Floating Bottom Toolbar */}
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-gray-900/90 backdrop-blur-sm rounded-full px-6 py-3 shadow-xl border border-gray-800">
        <div className="flex items-center space-x-4">
          {/* Undo/Redo */}
          <button className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
            <Undo className="w-5 h-5 text-gray-400" />
          </button>
          <button className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
            <Redo className="w-5 h-5 text-gray-400" />
          </button>

          {/* Drawing Tools */}
          <div className="w-px h-6 bg-gray-700"></div>
          
          <button className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
            <PenTool className="w-5 h-5 text-gray-400" />
          </button>
          <button className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
            <Eraser className="w-5 h-5 text-gray-400" />
          </button>

          {/* Color Palette */}
          <div className="flex items-center space-x-2">
            {['#1DA1F2', '#000000', '#FF5252', '#00C853', '#FFD600', '#FFFFFF'].map(color => (
              <button
                key={color}
                onClick={() => setStrokeColor(color)}
                className={`w-6 h-6 rounded-full border-2 transition-all ${
                  strokeColor === color ? 'border-white scale-110' : 'border-gray-600'
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>

          {/* Microphone (Center) */}
          <div className="w-px h-6 bg-gray-700"></div>
          <button className="p-3 bg-blue-600 hover:bg-blue-700 rounded-full transition-colors">
            <Mic className="w-6 h-6 text-white" />
          </button>

          {/* Thickness Control */}
          <div className="w-px h-6 bg-gray-700"></div>
          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-400">Width</span>
            <input
              type="range"
              min="1"
              max="10"
              value={strokeWidth}
              onChange={(e) => setStrokeWidth(Number(e.target.value))}
              className="w-16"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
