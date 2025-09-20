import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  CheckCircle, 
  XCircle, 
  Circle, 
  HelpCircle,
  Mic,
  PenTool,
  Eraser,
  Undo,
  Redo,
  Settings,
  ArrowLeft,
  Save
} from 'lucide-react';
import { NotebookStep, Stroke } from '../types';
import { getCanvasCoordinates, drawStroke, clearCanvas, redrawAllStrokes } from '../utils/canvas';
import { recognitionService } from '../services/recognition';

interface NotebookCanvasProps {
  onBack: () => void;
  onSave: (notebook: any) => void;
  onSettings: () => void;
}

export const NotebookCanvas: React.FC<NotebookCanvasProps> = ({
  onBack,
  onSave,
  onSettings
}) => {
  const [problem, setProblem] = useState<string>('');
  const [showProblemInput, setShowProblemInput] = useState(false);
  const [steps, setSteps] = useState<NotebookStep[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentStrokes, setCurrentStrokes] = useState<Stroke[]>([]);
  const [showFeedback, setShowFeedback] = useState(true);
  const [showHints, setShowHints] = useState(true);
  const [strokeColor, setStrokeColor] = useState('#1DA1F2'); // Electric blue
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [hoveredStep, setHoveredStep] = useState<number | null>(null);
  const [isRecognizing, setIsRecognizing] = useState(false);
  
  const canvasRefs = useRef<(HTMLCanvasElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const problemInputRef = useRef<HTMLInputElement>(null);

  // Initialize first step when problem is set
  useEffect(() => {
    if (problem && steps.length === 0) {
      addNewStep();
    }
  }, [problem, steps.length]);

  // Focus problem input when shown
  useEffect(() => {
    if (showProblemInput && problemInputRef.current) {
      problemInputRef.current.focus();
    }
  }, [showProblemInput]);

  // Add new step
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

  // Handle problem input
  const handleProblemSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (problem.trim()) {
      setShowProblemInput(false);
      addNewStep();
    }
  };

  // Drawing handlers
  const startDrawing = useCallback((stepId: number, point: { x: number; y: number }) => {
    setIsDrawing(true);
    setCurrentStep(stepId - 1);
    setCurrentStrokes([{ points: [point], timestamp: Date.now() }]);
  }, []);

  const draw = useCallback((point: { x: number; y: number }) => {
    if (!isDrawing) return;

    const canvas = canvasRefs.current[currentStep];
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const newStroke = {
      points: [...currentStrokes[currentStrokes.length - 1]?.points || [], point],
      timestamp: Date.now()
    };

    setCurrentStrokes(prev => [...prev.slice(0, -1), newStroke]);

    // Draw the current stroke
    if (newStroke.points.length > 1) {
      drawStroke(ctx, newStroke, strokeColor, strokeWidth);
    }
  }, [isDrawing, currentStrokes, currentStep, strokeColor, strokeWidth]);

  const endDrawing = useCallback(async () => {
    if (!isDrawing || currentStrokes.length === 0) {
      setIsDrawing(false);
      setCurrentStrokes([]);
      return;
    }

    const newStrokes = [...currentStrokes];
    
    // Update strokes in state
    setSteps(prev => prev.map((step, index) => 
      index === currentStep 
        ? { ...step, strokes: [...step.strokes, ...newStrokes] }
        : step
    ));

    // Recognize handwriting
    if (newStrokes.length > 0) {
      setIsRecognizing(true);
      try {
        const canvas = canvasRefs.current[currentStep];
        if (canvas) {
          const result = await recognitionService.recognizeDrawing(canvas);
          if (result && result.latex) {
            setSteps(prev => prev.map((step, index) => 
              index === currentStep 
                ? { 
                    ...step, 
                    latex: result.latex,
                    content: result.text || '',
                    status: result.confidence && result.confidence > 0.7 ? 'correct' : 'incorrect',
                    feedback: result.confidence && result.confidence > 0.7 ? 'Correct!' : 'Check your work'
                  }
                : step
            ));
          }
        }
      } catch (error) {
        console.error('Recognition error:', error);
      } finally {
        setIsRecognizing(false);
      }
    }

    setIsDrawing(false);
    setCurrentStrokes([]);
  }, [isDrawing, currentStrokes, currentStep]);

  // Mouse events
  const handleMouseDown = (e: React.MouseEvent, stepId: number) => {
    const canvas = canvasRefs.current[stepId - 1];
    if (!canvas) return;
    
    const point = getCanvasCoordinates(e.nativeEvent, canvas);
    startDrawing(stepId, point);
  };

  const handleMouseMove = (e: React.MouseEvent, stepId: number) => {
    const canvas = canvasRefs.current[stepId - 1];
    if (!canvas) return;
    
    const point = getCanvasCoordinates(e.nativeEvent, canvas);
    draw(point);
  };

  const handleMouseUp = () => {
    endDrawing();
  };

  // Touch events
  const handleTouchStart = (e: React.TouchEvent, stepId: number) => {
    e.preventDefault();
    const canvas = canvasRefs.current[stepId - 1];
    if (!canvas || e.touches.length === 0) return;
    
    const point = getCanvasCoordinates(e.touches[0], canvas);
    startDrawing(stepId, point);
  };

  const handleTouchMove = (e: React.TouchEvent, stepId: number) => {
    e.preventDefault();
    const canvas = canvasRefs.current[stepId - 1];
    if (!canvas || e.touches.length === 0) return;
    
    const point = getCanvasCoordinates(e.touches[0], canvas);
    draw(point);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    endDrawing();
  };

  // Initialize canvas for each step
  const initializeCanvas = useCallback((stepId: number) => {
    const canvas = canvasRefs.current[stepId - 1];
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = canvas.offsetWidth * 2;
    canvas.height = 80 * 2; // Fixed height for each line
    ctx.scale(2, 2);

    // Set canvas style
    ctx.imageSmoothingEnabled = false;
    
    // Draw blue grid line (ruled paper effect)
    ctx.strokeStyle = '#1E90FF';
    ctx.globalAlpha = 0.3;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, 79);
    ctx.lineTo(canvas.width / 2, 79);
    ctx.stroke();
    ctx.globalAlpha = 1;

    // Redraw existing strokes
    const step = steps.find(s => s.id === stepId);
    if (step) {
      step.strokes.forEach(stroke => {
        drawStroke(ctx, stroke, strokeColor, strokeWidth);
      });
    }
  }, [steps, strokeColor, strokeWidth]);

  // Initialize all canvases
  useEffect(() => {
    steps.forEach(step => {
      initializeCanvas(step.id);
    });
  }, [steps, initializeCanvas]);

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

  const handleSave = () => {
    const notebook = {
      id: Date.now().toString(),
      title: problem || `Notebook ${new Date().toLocaleDateString()}`,
      problem,
      steps,
      createdAt: new Date(),
      thumbnail: null
    };
    onSave(notebook);
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
            onClick={handleSave}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>Save</span>
          </button>
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
          {/* Problem Section */}
          {!problem ? (
            <div 
              className="mb-8 p-8 border-2 border-dashed border-gray-700 rounded-xl text-center cursor-pointer hover:border-blue-500 transition-colors"
              onClick={() => setShowProblemInput(true)}
            >
              <h3 className="text-lg font-semibold mb-2">Click here to enter your problem</h3>
              <p className="text-gray-400">What would you like to solve?</p>
            </div>
          ) : (
            <div className="mb-8 p-6 bg-gray-900 rounded-xl border border-gray-800">
              <h3 className="text-lg font-semibold mb-2 text-blue-400">Problem:</h3>
              <p className="text-white text-lg">{problem}</p>
            </div>
          )}

          {/* Problem Input Modal */}
          {showProblemInput && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-gray-900 rounded-xl p-6 w-full max-w-md mx-4">
                <h3 className="text-lg font-semibold mb-4">Enter the problem to solve</h3>
                <form onSubmit={handleProblemSubmit}>
                  <input
                    ref={problemInputRef}
                    type="text"
                    value={problem}
                    onChange={(e) => setProblem(e.target.value)}
                    placeholder="e.g., Solve for x: 2x + 5 = 13"
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="flex space-x-3 mt-4">
                    <button
                      type="submit"
                      className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                    >
                      Start Solving
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowProblemInput(false)}
                      className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Steps */}
          {steps.map((step, index) => (
            <div
              key={step.id}
              className="relative mb-2"
              onMouseEnter={() => setHoveredStep(step.id)}
              onMouseLeave={() => setHoveredStep(null)}
            >
              {/* Step Marker */}
              <div className="absolute left-0 top-0 w-12 h-20 flex items-center justify-center">
                <div className={`w-8 h-8 rounded-full border-2 ${getStepColor(step)} flex items-center justify-center bg-black`}>
                  {getStepIcon(step)}
                </div>
              </div>

              {/* Drawing Canvas */}
              <div className="ml-16 mr-80">
                <canvas
                  ref={el => canvasRefs.current[step.id - 1] = el}
                  className="w-full h-20 cursor-crosshair touch-none"
                  onMouseDown={(e) => handleMouseDown(e, step.id)}
                  onMouseMove={(e) => handleMouseMove(e, step.id)}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  onTouchStart={(e) => handleTouchStart(e, step.id)}
                  onTouchMove={(e) => handleTouchMove(e, step.id)}
                  onTouchEnd={handleTouchEnd}
                />
              </div>

              {/* LaTeX Feedback Column */}
              {showFeedback && (
                <div className="absolute right-0 top-0 w-72 h-20 flex items-center">
                  <div className="text-sm text-gray-300 font-mono bg-gray-900 p-3 rounded-lg w-full">
                    {isRecognizing ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                        <span>Recognizing...</span>
                      </div>
                    ) : (
                      step.latex || 'Write your equation...'
                    )}
                  </div>
                </div>
              )}

              {/* Hint Tooltip */}
              {showHints && step.feedback && hoveredStep === step.id && (
                <div className="absolute left-16 top-22 bg-blue-600 text-white text-xs px-3 py-2 rounded-lg shadow-lg z-10">
                  {step.feedback}
                  <div className="absolute -top-1 left-4 w-2 h-2 bg-blue-600 transform rotate-45"></div>
                </div>
              )}

              {/* Error Strikethrough */}
              {step.status === 'incorrect' && (
                <div className="absolute left-16 top-10 w-full h-0.5 bg-red-500 z-10"></div>
              )}
            </div>
          ))}

          {/* Add New Step Button */}
          {problem && (
            <button
              onClick={addNewStep}
              className="ml-16 mt-4 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors text-sm"
            >
              + Add Step
            </button>
          )}
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
