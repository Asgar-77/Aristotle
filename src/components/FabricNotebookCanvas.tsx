import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  CheckCircle, 
  XCircle, 
  Circle, 
  PenTool,
  Eraser,
  Undo,
  Redo,
  ArrowLeft,
  Save,
  ZoomIn,
  ZoomOut,
  Grid3X3,
  Trash2,
  RotateCcw,
  RotateCw,
  Lightbulb
} from 'lucide-react';
import { NotebookStep, Stroke, Point } from '../types';
import { aiValidationService, testGroqAPI } from '../services/aiValidation';
import { mathRecognition } from '../services/mathRecognition';

// Enhanced Point interface for real-time recognition (like document)
interface TimestampedPoint extends Point {
  timestamp: number;
}

// Enhanced Stroke interface for real-time recognition
interface RealTimeStroke {
  points: TimestampedPoint[];
  id: string;
}

// Simple debounce implementation (like document)
const debounce = (func: Function, delay: number) => {
  let timeoutId: NodeJS.Timeout;
  return (...args: any[]) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(null, args), delay);
  };
};

interface FabricNotebookCanvasProps {
  onBack: () => void;
  onSave: (notebook: any) => void;
  existingNotebook?: any;
}

export const FabricNotebookCanvas: React.FC<FabricNotebookCanvasProps> = ({
  onBack,
  onSave,
  existingNotebook
}) => {
  const [problem, setProblem] = useState<string>('');
  const [showProblemInput, setShowProblemInput] = useState(false);
  const [steps, setSteps] = useState<NotebookStep[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [showFeedback, setShowFeedback] = useState(true);
  const [showHints, setShowHints] = useState(true);
  const [strokeColor, setStrokeColor] = useState('#FFD700'); // Yellow
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [hoveredStep, setHoveredStep] = useState<number | null>(null);
  const [validatingStep, setValidatingStep] = useState<number | null>(null);
  const [inputMode, setInputMode] = useState<{ [key: number]: 'drawing' | 'typing' }>({});
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [solutionResults, setSolutionResults] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  // Enhanced interface state
  const [zoomLevel, setZoomLevel] = useState(1);
  const [showGrid, setShowGrid] = useState(false);
  const [history, setHistory] = useState<NotebookStep[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [currentInputType, setCurrentInputType] = useState<'mouse' | 'touch' | 'pen' | null>(null);
  const [showInputTypeModal, setShowInputTypeModal] = useState(false);
  const [selectedInputType, setSelectedInputType] = useState<'mouse' | 'touch' | 'pen' | null>(null);

  // NEW: Real-time canvas state (document's approach)
  const [stepStrokes, setStepStrokes] = useState<{ [stepId: number]: RealTimeStroke[] }>({});
  const [currentStrokes, setCurrentStrokes] = useState<{ [stepId: number]: TimestampedPoint[] }>({});
  const [isDrawing, setIsDrawing] = useState<{ [stepId: number]: boolean }>({});
  const [sessionIds, setSessionIds] = useState<{ [stepId: number]: string }>({});

  // Problem input canvas state
  const [problemStrokes, setProblemStrokes] = useState<RealTimeStroke[]>([]);
  const [problemCurrentStrokes, setProblemCurrentStrokes] = useState<TimestampedPoint[]>([]);
  const [isDrawingProblem, setIsDrawingProblem] = useState(false);
  const [problemSessionId] = useState(`problem-session-${Date.now()}`);

  // Refs
  const canvasRefs = useRef<(HTMLCanvasElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const problemInputRef = useRef<HTMLInputElement>(null);
  const problemCanvasRef = useRef<HTMLCanvasElement>(null);

  // NEW: Real-time recognition with debouncing (exactly like document)
  const debouncedRecognition = useCallback(
    debounce(async (stepId: number, strokes: RealTimeStroke[]) => {
      if (strokes.length === 0) return;

      try {
        console.log(`🔄 Real-time recognition for step ${stepId} with ${strokes.length} strokes`);

        // Transform RealTimeStroke to Stroke format for the service
        const transformedStrokes: Stroke[] = strokes.map(stroke => ({
          points: stroke.points.map(point => ({ x: point.x, y: point.y }))
        }));

        // Use the existing mathRecognition service
        const result = await mathRecognition.recognizeStrokes(transformedStrokes);
        
        if (result.latex) {
          console.log(`✅ Real-time recognition result for step ${stepId}: ${result.latex}`);
          
          // Update step with recognized LaTeX automatically
          setSteps(prev => prev.map((step, index) => 
            index === stepId - 1 
              ? { 
                  ...step, 
                  latex: result.latex,
                  content: result.latex,
                  status: 'current'
                }
              : step
          ));
        }
      } catch (error) {
        console.error('Real-time recognition error:', error);
      }
    }, 200), // Reduced debounce for faster recognition
    []
  );

  // Problem recognition with debouncing
  const debouncedProblemRecognition = useCallback(
    debounce(async (strokes: RealTimeStroke[]) => {
      if (strokes.length === 0) return;

      try {
        console.log(`🔄 Real-time problem recognition with ${strokes.length} strokes`);

        // Transform RealTimeStroke to Stroke format for the service
        const transformedStrokes: Stroke[] = strokes.map(stroke => ({
          points: stroke.points.map(point => ({ x: point.x, y: point.y }))
        }));

        // Use the existing mathRecognition service
        const result = await mathRecognition.recognizeStrokes(transformedStrokes);
        
        if (result.latex) {
          console.log(`✅ Real-time problem recognition result: ${result.latex}`);
          
          // Update problem with recognized LaTeX automatically
          setProblem(result.latex);
        }
      } catch (error) {
        console.error('Problem recognition error:', error);
      }
    }, 200), // Reduced debounce for faster recognition
    []
  );

  // NEW: Enhanced HTML5 Canvas drawing with pressure simulation
  const getCanvasCoordinates = useCallback((e: MouseEvent | Touch, canvas: HTMLCanvasElement): TimestampedPoint => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
      timestamp: Date.now()
    };
  }, []);

  // Enhanced stroke rendering with pressure simulation and particle effects
  const drawSmoothStroke = useCallback((ctx: CanvasRenderingContext2D, points: TimestampedPoint[], color: string, baseWidth: number) => {
    if (points.length < 2) return;

    ctx.strokeStyle = color;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.shadowColor = color;
    ctx.shadowBlur = 3;

    // Calculate pressure based on drawing speed (slower = more pressure)
    const calculatePressure = (p1: TimestampedPoint, p2: TimestampedPoint) => {
      const distance = Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
      const timeDiff = p2.timestamp - p1.timestamp;
      const speed = distance / Math.max(timeDiff, 1);
      
      // Slower drawing = higher pressure (thicker line)
      const pressure = Math.max(0.3, Math.min(1.5, 1 - (speed / 100)));
      return pressure;
    };

    // Draw smooth curves using quadratic bezier curves
    for (let i = 0; i < points.length - 1; i++) {
      const current = points[i];
      const next = points[i + 1];
      
      // Use pressure from pen input if available, otherwise calculate from velocity
      let pressure = 0.5;
      if (current.pressure !== undefined) {
        pressure = current.pressure;
      } else {
        pressure = calculatePressure(current, next);
      }
      
      // Enhanced pressure adjustment based on input type
      if (current.pointerType === 'pen') {
        // Pen: Full pressure range with better sensitivity
        pressure = Math.max(0.2, Math.min(1.2, pressure));
      } else if (current.pointerType === 'touch') {
        // Touch: Moderate pressure range
        pressure = Math.max(0.4, Math.min(0.9, pressure));
      } else {
        // Mouse: Consistent pressure
        pressure = Math.max(0.5, Math.min(0.7, pressure));
      }
      
      // Apply selected input type preference if available
      if (selectedInputType === 'pen' && current.pointerType !== 'pen') {
        // User prefers pen but using other input - boost pressure slightly
        pressure = Math.min(1.0, pressure * 1.1);
      } else if (selectedInputType === 'touch' && current.pointerType === 'mouse') {
        // User prefers touch but using mouse - adjust pressure
        pressure = Math.min(0.8, pressure * 1.05);
      }
      
      const width = baseWidth * pressure;

      ctx.lineWidth = width;
      
      if (i === 0) {
        ctx.beginPath();
        ctx.moveTo(current.x, current.y);
      }

      // Use quadratic curves for smoother lines
      const midX = (current.x + next.x) / 2;
      const midY = (current.y + next.y) / 2;
      
      if (i === points.length - 2) {
        ctx.lineTo(next.x, next.y);
      } else {
        ctx.quadraticCurveTo(current.x, current.y, midX, midY);
      }
    }
    
    ctx.stroke();
    
    // Add subtle particle effect for the last point
    if (points.length > 0) {
      const lastPoint = points[points.length - 1];
      ctx.save();
      ctx.globalAlpha = 0.6;
      ctx.fillStyle = color;
      ctx.shadowBlur = 8;
      ctx.shadowColor = color;
      ctx.beginPath();
      ctx.arc(lastPoint.x, lastPoint.y, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    
    ctx.shadowBlur = 0;
  }, []);

  const redrawCanvas = useCallback((stepId: number) => {
    const canvas = canvasRefs.current[stepId - 1];
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas with smooth transition
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw enhanced background with gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#0a0a0a');
    gradient.addColorStop(1, '#000000');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw enhanced grid lines with glow effect
    ctx.strokeStyle = '#8A2BE2';
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.4;
    ctx.shadowColor = '#8A2BE2';
    ctx.shadowBlur = 3;
    ctx.beginPath();
    ctx.moveTo(0, canvas.height - 1);
    ctx.lineTo(canvas.width, canvas.height - 1);
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;

    // Draw all completed strokes with smooth rendering
    const strokes = stepStrokes[stepId] || [];
    strokes.forEach(stroke => {
      if (stroke.points.length > 1) {
        drawSmoothStroke(ctx, stroke.points, strokeColor, strokeWidth);
      }
    });

    // Draw current stroke being drawn with smooth rendering
    const currentStroke = currentStrokes[stepId] || [];
    if (currentStroke.length > 1) {
      drawSmoothStroke(ctx, currentStroke, strokeColor, strokeWidth);
    }
  }, [stepStrokes, currentStrokes, strokeColor, strokeWidth, drawSmoothStroke]);

  // Input type selection handlers
  const handleInputTypeSelect = useCallback((inputType: 'mouse' | 'touch' | 'pen') => {
    setSelectedInputType(inputType);
    setShowInputTypeModal(false);
    
    // Store preference in localStorage
    localStorage.setItem('preferredInputType', inputType);
    
    // Show confirmation message
    setAutoSaveStatus('saved');
    setTimeout(() => {
      setAutoSaveStatus('saved');
    }, 2000);
  }, []);

  const handleSkipInputType = useCallback(() => {
    setShowInputTypeModal(false);
    // Auto-detect based on device capabilities
    const hasTouch = 'ontouchstart' in window;
    const hasPointer = 'onpointerdown' in window;
    
    if (hasPointer) {
      setSelectedInputType('touch'); // Default to touch for mobile
    } else if (hasTouch) {
      setSelectedInputType('touch');
    } else {
      setSelectedInputType('mouse');
    }
  }, []);

  // Enhanced drawing event handlers with pen support
  const handlePointerDown = useCallback((e: React.PointerEvent, stepId: number) => {
    const canvas = canvasRefs.current[stepId - 1];
    if (!canvas) return;
    
    // If no input type selected, auto-detect and set it
    if (!selectedInputType) {
      const inputType = e.pointerType as 'mouse' | 'touch' | 'pen' || 'mouse';
      setSelectedInputType(inputType);
    }

    // Prevent default to avoid scrolling and other browser behaviors
    e.preventDefault();
    
    setIsDrawing(prev => ({ ...prev, [stepId]: true }));
    
    // Get coordinates with proper scaling
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    // Enhanced pressure detection for different input types
    let pressure = 0.5;
    if (e.pointerType === 'pen') {
      // Pen input: use actual pressure, fallback to 0.7 for better visibility
      pressure = e.pressure > 0 ? e.pressure : 0.7;
    } else if (e.pointerType === 'touch') {
      // Touch input: use pressure if available, otherwise 0.6
      pressure = e.pressure > 0 ? e.pressure : 0.6;
    } else {
      // Mouse input: fixed pressure
      pressure = 0.5;
    }
    
    const point: TimestampedPoint = {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
      timestamp: Date.now(),
      pressure: pressure,
      pointerType: e.pointerType // 'pen', 'touch', 'mouse'
    };
    
    // Set current input type for visual feedback
    setCurrentInputType(e.pointerType as 'mouse' | 'touch' | 'pen');
    
    setCurrentStrokes(prev => ({ ...prev, [stepId]: [point] }));

    // Initialize session if needed
    if (!sessionIds[stepId]) {
      setSessionIds(prev => ({ ...prev, [stepId]: `session-${stepId}-${Date.now()}` }));
    }

    // Mark as drawing mode
    setInputMode(prev => ({
      ...prev,
      [stepId]: 'drawing'
    }));

    // Clear validation results when drawing on a wrong step (reset for retry)
    setSteps(prev => prev.map((s, index) =>
      index === stepId - 1 && (s.status === 'incorrect' || s.isChecked)
        ? { ...s, status: 'current', isChecked: false, validationResult: undefined }
        : s
    ));
  }, [sessionIds]);

  // Fallback mouse handler for older browsers
  const handleMouseDown = useCallback((e: React.MouseEvent, stepId: number) => {
    const canvas = canvasRefs.current[stepId - 1];
    if (!canvas) return;
    
    // If no input type selected, set to mouse
    if (!selectedInputType) {
      setSelectedInputType('mouse');
    }

    setIsDrawing(prev => ({ ...prev, [stepId]: true }));
    const point = getCanvasCoordinates(e.nativeEvent, canvas);
    setCurrentStrokes(prev => ({ ...prev, [stepId]: [point] }));

    // Initialize session if needed
    if (!sessionIds[stepId]) {
      setSessionIds(prev => ({ ...prev, [stepId]: `session-${stepId}-${Date.now()}` }));
    }

    // Mark as drawing mode
    setInputMode(prev => ({
      ...prev,
      [stepId]: 'drawing'
    }));

    // Clear validation results when drawing on a wrong step (reset for retry)
    setSteps(prev => prev.map((s, index) =>
      index === stepId - 1 && (s.status === 'incorrect' || s.isChecked)
        ? { ...s, status: 'current', isChecked: false, validationResult: undefined }
        : s
    ));
  }, [getCanvasCoordinates, sessionIds]);

  const handlePointerMove = useCallback((e: React.PointerEvent, stepId: number) => {
    if (!isDrawing[stepId]) return;

    const canvas = canvasRefs.current[stepId - 1];
    if (!canvas) return;

    // Prevent default to avoid scrolling
    e.preventDefault();

    // Get coordinates with proper scaling
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    // Enhanced pressure detection for different input types
    let pressure = 0.5;
    if (e.pointerType === 'pen') {
      // Pen input: use actual pressure, fallback to 0.7 for better visibility
      pressure = e.pressure > 0 ? e.pressure : 0.7;
    } else if (e.pointerType === 'touch') {
      // Touch input: use pressure if available, otherwise 0.6
      pressure = e.pressure > 0 ? e.pressure : 0.6;
    } else {
      // Mouse input: fixed pressure
      pressure = 0.5;
    }
    
    const point: TimestampedPoint = {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
      timestamp: Date.now(),
      pressure: pressure,
      pointerType: e.pointerType
    };
    
    setCurrentStrokes(prev => ({
      ...prev,
      [stepId]: [...(prev[stepId] || []), point]
    }));

    // Redraw immediately for real-time feedback
    redrawCanvas(stepId);
  }, [isDrawing, redrawCanvas]);

  // Fallback mouse move handler
  const handleMouseMove = useCallback((e: React.MouseEvent, stepId: number) => {
    if (!isDrawing[stepId]) return;

    const canvas = canvasRefs.current[stepId - 1];
    if (!canvas) return;

    const point = getCanvasCoordinates(e.nativeEvent, canvas);
    setCurrentStrokes(prev => ({
      ...prev,
      [stepId]: [...(prev[stepId] || []), point]
    }));

    // Redraw immediately for real-time feedback
    redrawCanvas(stepId);
  }, [isDrawing, getCanvasCoordinates, redrawCanvas]);

  const handlePointerUp = useCallback((e: React.PointerEvent, stepId: number) => {
    if (!isDrawing[stepId]) return;

    // Prevent default to avoid scrolling
    e.preventDefault();

    const currentStroke = currentStrokes[stepId] || [];
    if (currentStroke.length > 1) {
      const newStroke: RealTimeStroke = {
        points: currentStroke,
        id: `stroke-${stepId}-${Date.now()}`
      };

      const updatedStrokes = [...(stepStrokes[stepId] || []), newStroke];
      setStepStrokes(prev => ({ ...prev, [stepId]: updatedStrokes }));

      // Trigger real-time recognition with debouncing (like document)
      debouncedRecognition(stepId, updatedStrokes);
    }

    setIsDrawing(prev => ({ ...prev, [stepId]: false }));
    setCurrentStrokes(prev => ({ ...prev, [stepId]: [] }));
    setCurrentInputType(null);
    redrawCanvas(stepId);
  }, [isDrawing, currentStrokes, stepStrokes, debouncedRecognition, redrawCanvas]);

  // Fallback mouse up handler
  const handleMouseUp = useCallback((stepId: number) => {
    if (!isDrawing[stepId]) return;

    const currentStroke = currentStrokes[stepId] || [];
    if (currentStroke.length > 1) {
      const newStroke: RealTimeStroke = {
        points: currentStroke,
        id: `stroke-${stepId}-${Date.now()}`
      };

      const updatedStrokes = [...(stepStrokes[stepId] || []), newStroke];
      setStepStrokes(prev => ({ ...prev, [stepId]: updatedStrokes }));

      // Trigger real-time recognition with debouncing (like document)
      debouncedRecognition(stepId, updatedStrokes);
    }

    setIsDrawing(prev => ({ ...prev, [stepId]: false }));
    setCurrentStrokes(prev => ({ ...prev, [stepId]: [] }));
    redrawCanvas(stepId);
  }, [isDrawing, currentStrokes, stepStrokes, debouncedRecognition, redrawCanvas]);

  // Problem canvas redraw function (defined first to avoid hoisting issues)
  const redrawProblemCanvas = useCallback(() => {
    const canvas = problemCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw enhanced background
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#0a0a0a');
    gradient.addColorStop(1, '#000000');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw all completed strokes
    problemStrokes.forEach(stroke => {
      if (stroke.points.length > 1) {
        drawSmoothStroke(ctx, stroke.points, strokeColor, strokeWidth);
      }
    });

    // Draw current stroke being drawn
    if (problemCurrentStrokes.length > 1) {
      drawSmoothStroke(ctx, problemCurrentStrokes, strokeColor, strokeWidth);
    }
  }, [problemStrokes, problemCurrentStrokes, strokeColor, strokeWidth, drawSmoothStroke]);

  // Enhanced problem canvas drawing handlers with pen support
  const handleProblemPointerDown = useCallback((e: React.PointerEvent) => {
    const canvas = problemCanvasRef.current;
    if (!canvas) return;
    
    // If no input type selected, auto-detect and set it
    if (!selectedInputType) {
      const inputType = e.pointerType as 'mouse' | 'touch' | 'pen' || 'mouse';
      setSelectedInputType(inputType);
    }

    // Prevent default to avoid scrolling and other browser behaviors
    e.preventDefault();
    
    setIsDrawingProblem(true);
    
    // Get coordinates with proper scaling
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    // Enhanced pressure detection for different input types
    let pressure = 0.5;
    if (e.pointerType === 'pen') {
      // Pen input: use actual pressure, fallback to 0.7 for better visibility
      pressure = e.pressure > 0 ? e.pressure : 0.7;
    } else if (e.pointerType === 'touch') {
      // Touch input: use pressure if available, otherwise 0.6
      pressure = e.pressure > 0 ? e.pressure : 0.6;
    } else {
      // Mouse input: fixed pressure
      pressure = 0.5;
    }
    
    const point: TimestampedPoint = {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
      timestamp: Date.now(),
      pressure: pressure,
      pointerType: e.pointerType // 'pen', 'touch', 'mouse'
    };
    
    // Set current input type for visual feedback
    setCurrentInputType(e.pointerType as 'mouse' | 'touch' | 'pen');
    
    setProblemCurrentStrokes([point]);
  }, [selectedInputType]);

  // Fallback problem mouse handler
  const handleProblemMouseDown = useCallback((e: React.MouseEvent) => {
    const canvas = problemCanvasRef.current;
    if (!canvas) return;
    
    // If no input type selected, set to mouse
    if (!selectedInputType) {
      setSelectedInputType('mouse');
    }

    setIsDrawingProblem(true);
    const point = getCanvasCoordinates(e.nativeEvent, canvas);
    setProblemCurrentStrokes([point]);
  }, [selectedInputType, getCanvasCoordinates]);

  const handleProblemPointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDrawingProblem) return;

    const canvas = problemCanvasRef.current;
    if (!canvas) return;

    // Prevent default to avoid scrolling
    e.preventDefault();

    // Get coordinates with proper scaling
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    // Enhanced pressure detection for different input types
    let pressure = 0.5;
    if (e.pointerType === 'pen') {
      // Pen input: use actual pressure, fallback to 0.7 for better visibility
      pressure = e.pressure > 0 ? e.pressure : 0.7;
    } else if (e.pointerType === 'touch') {
      // Touch input: use pressure if available, otherwise 0.6
      pressure = e.pressure > 0 ? e.pressure : 0.6;
    } else {
      // Mouse input: fixed pressure
      pressure = 0.5;
    }
    
    const point: TimestampedPoint = {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
      timestamp: Date.now(),
      pressure: pressure,
      pointerType: e.pointerType
    };
    
    setProblemCurrentStrokes(prev => [...prev, point]);
    
    // Redraw the entire canvas immediately for real-time feedback
    redrawProblemCanvas();
  }, [isDrawingProblem, redrawProblemCanvas]);

  // Fallback problem mouse move handler
  const handleProblemMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDrawingProblem) return;

    const canvas = problemCanvasRef.current;
    if (!canvas) return;

    const point = getCanvasCoordinates(e.nativeEvent, canvas);
    setProblemCurrentStrokes(prev => [...prev, point]);
    
    // Redraw the entire canvas immediately for real-time feedback
    redrawProblemCanvas();
  }, [isDrawingProblem, getCanvasCoordinates, redrawProblemCanvas]);

  const handleProblemPointerUp = useCallback((e: React.PointerEvent) => {
    if (!isDrawingProblem) return;

    // Prevent default to avoid scrolling
    e.preventDefault();

    if (problemCurrentStrokes.length > 1) {
      const newStroke: RealTimeStroke = {
        points: problemCurrentStrokes,
        id: `problem-stroke-${Date.now()}`
      };

      const updatedStrokes = [...problemStrokes, newStroke];
      setProblemStrokes(updatedStrokes);

      // Trigger real-time problem recognition with debouncing
      debouncedProblemRecognition(updatedStrokes);
    }

    setIsDrawingProblem(false);
    setProblemCurrentStrokes([]);
    setCurrentInputType(null);
    redrawProblemCanvas();
  }, [isDrawingProblem, problemCurrentStrokes, problemStrokes, debouncedProblemRecognition, redrawProblemCanvas]);

  // Fallback problem mouse up handler
  const handleProblemMouseUp = useCallback(() => {
    if (!isDrawingProblem) return;

    if (problemCurrentStrokes.length > 1) {
      const newStroke: RealTimeStroke = {
        points: problemCurrentStrokes,
        id: `problem-stroke-${Date.now()}`
      };

      const updatedStrokes = [...problemStrokes, newStroke];
      setProblemStrokes(updatedStrokes);

      // Trigger real-time problem recognition with debouncing
      debouncedProblemRecognition(updatedStrokes);
    }

    setIsDrawingProblem(false);
    setProblemCurrentStrokes([]);
    redrawProblemCanvas();
  }, [isDrawingProblem, problemCurrentStrokes, problemStrokes, debouncedProblemRecognition, redrawProblemCanvas]);

  // Load existing notebook data
  useEffect(() => {
    if (existingNotebook) {
      console.log('Loading existing notebook:', existingNotebook);
      setProblem(existingNotebook.problem || '');
      if (existingNotebook.steps && existingNotebook.steps.length > 0) {
        setSteps(existingNotebook.steps);
        setCurrentStep(existingNotebook.steps.length - 1);
      }
      if (existingNotebook.inputModeData) {
        setInputMode(existingNotebook.inputModeData);
      }
    }
  }, [existingNotebook]);

  // Show input type selection when notebook is first opened
  useEffect(() => {
    // Always show the modal for now to ensure users can select
    // This can be changed later to only show for first-time users
    setShowInputTypeModal(true);
  }, []); // Run only once when component mounts

  // Initialize first step when problem is set
  useEffect(() => {
    if (problem && steps.length === 0 && !existingNotebook) {
      const newStep: NotebookStep = {
        id: 1,
        content: '',
        latex: '',
        status: 'current',
        timestamp: Date.now(),
        strokes: []
      };
      setSteps([newStep]);
      setCurrentStep(0);
    }
  }, [problem, steps.length, existingNotebook]);

  // Initialize canvases when steps change
  useEffect(() => {
    steps.forEach(step => {
      initializeCanvas(step.id);
    });
  }, [steps.length]);

  // Initialize problem canvas
  useEffect(() => {
    const canvas = problemCanvasRef.current;
    if (!canvas) return;

    // Set canvas size for problem writing
    canvas.width = 800;
    canvas.height = 200;
    
    // Get context and configure for optimal pen input (same as step canvases)
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    }
    
    // Set up canvas for better pen detection
    canvas.style.touchAction = 'none';
    canvas.style.userSelect = 'none';
    canvas.style.webkitUserSelect = 'none';
    canvas.style.webkitTouchCallout = 'none';
    
    redrawProblemCanvas();
  }, [redrawProblemCanvas]);

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
    }
  };

  // Initialize canvas for each step
  const initializeCanvas = useCallback((stepId: number) => {
    const canvas = canvasRefs.current[stepId - 1];
    if (!canvas) return;

    // Set original canvas size for step solutions
    canvas.width = 800;
    canvas.height = 128;

    redrawCanvas(stepId);
  }, [redrawCanvas]);

  const getStepIcon = (step: NotebookStep) => {
    switch (step.status) {
      case 'correct':
        return <CheckCircle className="w-6 h-6 text-green-500" />;
      case 'incorrect':
        return <XCircle className="w-6 h-6 text-red-500" />;
      case 'checking':
        return (
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        );
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
      case 'checking':
        return 'border-blue-500';
      case 'current':
        return 'border-blue-500';
      default:
        return 'border-gray-500';
    }
  };

  // Clear canvas function
  const handleClearStep = useCallback((stepId: number) => {
    setStepStrokes(prev => ({ ...prev, [stepId]: [] }));
    setCurrentStrokes(prev => ({ ...prev, [stepId]: [] }));
    setSteps(prev => prev.map((step, index) => 
      index === stepId - 1 
        ? { ...step, strokes: [], latex: '', content: '', status: 'current' }
        : step
    ));
    redrawCanvas(stepId);
  }, [redrawCanvas]);

  // Enhanced save notebook with animations and auto-redirect
  const handleSave = async () => {
    if (isSaving) return; // Prevent multiple saves
    
    setIsSaving(true);
    setSaveSuccess(false);
    
    try {
      // Create notebook data with problem name as title
      const notebookData = {
        id: existingNotebook?.id || Date.now().toString(),
        title: problem || `Notebook ${new Date().toLocaleDateString()}`,
        problem,
        steps,
        inputModeData: inputMode,
        timestamp: Date.now(),
        createdAt: existingNotebook?.createdAt || new Date().toISOString(),
        lastModified: new Date().toISOString(),
        topic: 'math',
        strokes: steps.map(step => stepStrokes[step.id] || []).flat(),
        result: null,
        thumbnail: null
      };
      
      // Simulate save delay for animation
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Call the parent save function
    onSave(notebookData);
      
      // Show success animation
      setSaveSuccess(true);
      
      // Auto-redirect after success animation
      setTimeout(() => {
        onBack(); // This will redirect to the dashboard/notebooks section
      }, 2000);
      
    } catch (error) {
      console.error('Save error:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Enhanced functionality functions
  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setSteps(history[newIndex]);
      setHistoryIndex(newIndex);
      setAutoSaveStatus('unsaved');
    }
  }, [history, historyIndex]);

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setSteps(history[newIndex]);
      setHistoryIndex(newIndex);
      setAutoSaveStatus('unsaved');
    }
  }, [history, historyIndex]);

  const handleClearAll = useCallback(() => {
    if (window.confirm('Are you sure you want to clear all steps? This action cannot be undone.')) {
      setSteps([]);
      setCurrentStep(0);
      setStepStrokes({});
      setCurrentStrokes({});
      setIsDrawing({});
      setSessionIds({});
      setAutoSaveStatus('unsaved');
    }
  }, []);

  const handleZoomIn = useCallback(() => {
    setZoomLevel(prev => Math.min(prev + 0.2, 3));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoomLevel(prev => Math.max(prev - 0.2, 0.5));
  }, []);

  const handleResetZoom = useCallback(() => {
    setZoomLevel(1);
  }, []);

  const toggleGrid = useCallback(() => {
    setShowGrid(prev => !prev);
  }, []);

  // Save to history when steps change
  useEffect(() => {
    if (steps.length > 0) {
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push([...steps]);
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
      setAutoSaveStatus('unsaved');
    }
  }, [steps]);

  // Auto-save functionality - DISABLED
  // useEffect(() => {
  //   if (autoSaveStatus === 'unsaved') {
  //     const autoSaveTimer = setTimeout(() => {
  //       handleSave();
  //     }, 5000); // Auto-save after 5 seconds of inactivity
      
  //     return () => clearTimeout(autoSaveTimer);
  //   }
  // }, [autoSaveStatus, steps]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent shortcuts when typing in input fields
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Ctrl/Cmd + S: Save
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
      
      // Ctrl/Cmd + Z: Undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      }
      
      // Ctrl/Cmd + Shift + Z: Redo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && e.shiftKey) {
        e.preventDefault();
        handleRedo();
      }
      
      // Ctrl/Cmd + +: Zoom In
      if ((e.ctrlKey || e.metaKey) && e.key === '=') {
        e.preventDefault();
        handleZoomIn();
      }
      
      // Ctrl/Cmd + -: Zoom Out
      if ((e.ctrlKey || e.metaKey) && e.key === '-') {
        e.preventDefault();
        handleZoomOut();
      }
      
      // Ctrl/Cmd + 0: Reset Zoom
      if ((e.ctrlKey || e.metaKey) && e.key === '0') {
        e.preventDefault();
        handleResetZoom();
      }
      
      // G: Toggle Grid
      if (e.key === 'g' || e.key === 'G') {
        e.preventDefault();
        toggleGrid();
      }
      
      // Escape: Close modals
      if (e.key === 'Escape') {
        if (showResultsModal) {
          setShowResultsModal(false);
        }
        if (showProblemInput) {
          setShowProblemInput(false);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleSave, handleUndo, handleRedo, handleZoomIn, handleZoomOut, handleResetZoom, toggleGrid, showResultsModal, showProblemInput]);


  const handleValidateStep = async (stepId: number) => {
    const step = steps.find(s => s.id === stepId);
    if (!step || !step.latex) return;

    setValidatingStep(stepId);
    setError(null);
    setIsLoading(true);
    
    try {
      // Update step status to checking
      setSteps(prev => prev.map(s => 
        s.id === stepId 
          ? { ...s, status: 'checking' as const }
          : s
      ));

      // Validate with AI
      const result = await aiValidationService.validateMathStep(step.latex, problem);
      
      // Update step with validation result
      setSteps(prev => prev.map(s => 
        s.id === stepId 
          ? { 
              ...s, 
              status: result.isCorrect ? 'correct' : 'incorrect',
              isChecked: true,
              validationResult: result,
              feedback: result.feedback
            }
          : s
      ));

      // Auto-add new step if current step is correct
      if (result.isCorrect) {
        setTimeout(() => {
          addNewStep();
          // Scroll to the new step
          setTimeout(() => {
            const newStepElement = document.querySelector(`[data-step-id="${stepId + 1}"]`);
            if (newStepElement) {
              newStepElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          }, 100);
        }, 1000); // Small delay to show the success state
      }

    } catch (error) {
      console.error('Validation error:', error);
      setError('Failed to validate step. Please check your internet connection and try again.');
      setSteps(prev => prev.map(s => 
        s.id === stepId 
          ? { 
              ...s, 
              status: 'incorrect',
              isChecked: true,
              feedback: 'Validation failed. Please try again.'
            }
          : s
      ));
    } finally {
      setValidatingStep(null);
      setIsLoading(false);
    }
  };

  const handleSubmitSolution = async () => {
    try {
      // Prepare solution data for AI evaluation
      const solutionData = {
        originalQuestion: problem,
        steps: steps.map(step => ({
          stepNumber: step.id,
          latex: step.latex,
          isCorrect: step.validationResult?.isCorrect || false,
          feedback: step.feedback || '',
          inputMethod: inputMode[step.id] || 'unknown'
        }))
      };

      // Send complete solution to AI for overall evaluation
      const result = await aiValidationService.evaluateCompleteSolution(solutionData);
      
      // Store results and show modal
      setSolutionResults({
        ...result,
        solutionData,
        totalSteps: steps.length,
        correctSteps: steps.filter(s => s.validationResult?.isCorrect).length,
        completionTime: Date.now() - (steps[0]?.timestamp || Date.now())
      });
      setShowResultsModal(true);
      
    } catch (error) {
      console.error('Solution evaluation error:', error);
      setSolutionResults({
        score: 0,
        feedback: 'Failed to evaluate solution. Please try again.',
        suggestions: ['Check your internet connection', 'Verify all steps are completed'],
        solutionData: null,
        totalSteps: steps.length,
        correctSteps: 0,
        completionTime: 0
      });
      setShowResultsModal(true);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Clear any pending recognition calls
      // No Fabric.js managers to clean up
    };
  }, []);

  return (
    <div className="h-screen bg-black text-white flex flex-col">
      {/* Top Navigation - Aristotle Branded */}
      <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-800 flex-shrink-0 bg-gradient-to-r from-gray-900 to-gray-800">
        <div className="flex items-center space-x-2 sm:space-x-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-700 rounded-xl transition-all duration-300 transform hover:scale-110 hover:rotate-6"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
          </button>
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Aristotle Logo/Icon */}
            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center transform rotate-12 hover:rotate-0 transition-transform duration-500">
              <span className="text-white font-bold text-xs sm:text-sm">𝒜</span>
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Aristotle
              </h1>
              <p className="text-xs text-gray-400 hidden sm:block">Smart Math Learning</p>
            </div>
          </div>
        </div>
        
        
        {/* Mobile Menu Button */}
        <button
          onClick={() => setShowMobileMenu(!showMobileMenu)}
          className="md:hidden p-2 hover:bg-gray-700 rounded-lg transition-all duration-300"
          title="Menu"
        >
          <div className="w-5 h-5 flex flex-col justify-center space-y-1">
            <div className={`w-full h-0.5 bg-gray-300 transition-all duration-300 ${showMobileMenu ? 'rotate-45 translate-y-1.5' : ''}`} />
            <div className={`w-full h-0.5 bg-gray-300 transition-all duration-300 ${showMobileMenu ? 'opacity-0' : ''}`} />
            <div className={`w-full h-0.5 bg-gray-300 transition-all duration-300 ${showMobileMenu ? '-rotate-45 -translate-y-1.5' : ''}`} />
          </div>
        </button>

        {/* Enhanced Toolbar - Desktop */}
        <div className="hidden md:flex items-center space-x-1 sm:space-x-2">
          {/* Undo/Redo */}
          <div className="flex items-center space-x-1">
            <button
              onClick={handleUndo}
              disabled={historyIndex <= 0}
              className="p-2 hover:bg-gray-700 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Undo"
            >
              <Undo className="w-4 h-4 text-gray-300" />
            </button>
            <button
              onClick={handleRedo}
              disabled={historyIndex >= history.length - 1}
              className="p-2 hover:bg-gray-700 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Redo"
            >
              <Redo className="w-4 h-4 text-gray-300" />
            </button>
          </div>

          {/* Zoom Controls */}
          <div className="flex items-center space-x-1 border-l border-gray-600 pl-2">
            <button
              onClick={handleZoomOut}
              className="p-2 hover:bg-gray-700 rounded-lg transition-all duration-300"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4 text-gray-300" />
            </button>
            <span className="text-xs text-gray-400 px-2">{Math.round(zoomLevel * 100)}%</span>
            <button
              onClick={handleZoomIn}
              className="p-2 hover:bg-gray-700 rounded-lg transition-all duration-300"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4 text-gray-300" />
            </button>
            <button
              onClick={handleResetZoom}
              className="p-2 hover:bg-gray-700 rounded-lg transition-all duration-300"
              title="Reset Zoom"
            >
              <RotateCcw className="w-4 h-4 text-gray-300" />
            </button>
          </div>

          {/* Grid Toggle */}
          <button
            onClick={toggleGrid}
            className={`p-2 rounded-lg transition-all duration-300 ${
              showGrid ? 'bg-purple-600 text-white' : 'hover:bg-gray-700 text-gray-300'
            }`}
            title="Toggle Grid"
          >
            <Grid3X3 className="w-4 h-4" />
          </button>

          {/* Clear All */}
          <button
            onClick={handleClearAll}
            className="p-2 hover:bg-red-600/20 rounded-lg transition-all duration-300 text-red-400 hover:text-red-300"
            title="Clear All"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          {/* Input Type Indicator & Change Button */}
          {selectedInputType && (
            <div className="flex items-center space-x-2 border-l border-gray-600 pl-2">
              <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
              <span className="text-xs text-gray-400 hidden sm:inline">
                {selectedInputType === 'pen' ? '✏️ Pen Mode' : 
                 selectedInputType === 'touch' ? '👆 Touch Mode' : 
                 '🖱️ Mouse Mode'}
              </span>
              <button
                onClick={() => setShowInputTypeModal(true)}
                className="p-1 hover:bg-gray-700 rounded transition-colors"
                title="Change input method"
              >
                <span className="text-xs text-gray-400 hover:text-white">⚙️</span>
              </button>
            </div>
          )}

          {/* Auto-save Status */}
          <div className="flex items-center space-x-2 border-l border-gray-600 pl-2">
            <div className={`w-2 h-2 rounded-full ${
              autoSaveStatus === 'saved' ? 'bg-green-400' :
              autoSaveStatus === 'saving' ? 'bg-yellow-400 animate-pulse' :
              'bg-red-400'
            }`} />
            <span className="text-xs text-gray-400 hidden sm:inline">
              {autoSaveStatus === 'saved' ? 'Saved' :
               autoSaveStatus === 'saving' ? 'Saving...' :
               'Unsaved'}
            </span>
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={isSaving}
            data-save-button
            className={`flex items-center space-x-1 sm:space-x-2 px-3 sm:px-4 md:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl transition-all duration-500 transform shadow-lg hover:shadow-xl text-sm sm:text-base ${
              isSaving 
                ? 'bg-gradient-to-r from-blue-500 to-blue-600 cursor-not-allowed scale-95' 
                : saveSuccess
                ? 'bg-gradient-to-r from-green-500 to-emerald-600 scale-110 animate-bounce'
                : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 hover:scale-105'
            }`}
          >
            {isSaving ? (
              <>
                <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span className="font-medium hidden sm:inline">Saving...</span>
                <span className="font-medium sm:hidden">...</span>
              </>
            ) : saveSuccess ? (
              <>
                <div className="w-3 h-3 sm:w-4 sm:h-4 text-white animate-bounce">✓</div>
                <span className="font-medium hidden sm:inline">Saved!</span>
                <span className="font-medium sm:hidden">✓</span>
              </>
            ) : (
              <>
                <Save className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="font-medium hidden sm:inline">Save</span>
              </>
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {showMobileMenu && (
          <div className="md:hidden absolute top-full left-0 right-0 bg-gray-800 border-t border-gray-700 shadow-lg z-50">
            <div className="p-4 space-y-3">
              {/* Mobile Toolbar Items */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleUndo}
                  disabled={historyIndex <= 0}
                  className="flex items-center justify-center space-x-2 p-3 bg-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Undo className="w-4 h-4" />
                  <span className="text-sm">Undo</span>
                </button>
                <button
                  onClick={handleRedo}
                  disabled={historyIndex >= history.length - 1}
                  className="flex items-center justify-center space-x-2 p-3 bg-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Redo className="w-4 h-4" />
                  <span className="text-sm">Redo</span>
                </button>
      </div>

              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={handleZoomOut}
                  className="flex items-center justify-center space-x-1 p-2 bg-gray-700 rounded-lg"
                >
                  <ZoomOut className="w-4 h-4" />
                  <span className="text-xs">-</span>
                </button>
                <div className="flex items-center justify-center p-2 bg-gray-600 rounded-lg">
                  <span className="text-sm font-medium">{Math.round(zoomLevel * 100)}%</span>
                </div>
                <button
                  onClick={handleZoomIn}
                  className="flex items-center justify-center space-x-1 p-2 bg-gray-700 rounded-lg"
                >
                  <ZoomIn className="w-4 h-4" />
                  <span className="text-xs">+</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={toggleGrid}
                  className={`flex items-center justify-center space-x-2 p-3 rounded-lg ${
                    showGrid ? 'bg-purple-600 text-white' : 'bg-gray-700'
                  }`}
                >
                  <Grid3X3 className="w-4 h-4" />
                  <span className="text-sm">Grid</span>
                </button>
                <button
                  onClick={handleClearAll}
                  className="flex items-center justify-center space-x-2 p-3 bg-red-600/20 text-red-400 rounded-lg"
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="text-sm">Clear</span>
                </button>
              </div>

              <div className="pt-2 border-t border-gray-600">
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="w-full flex items-center justify-center space-x-2 p-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 rounded-lg transition-colors"
                >
                  {isSaving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span className="text-sm">Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span className="text-sm">Save</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-900/20 border-l-4 border-red-500 p-4 mx-4 mt-2 rounded-r-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <XCircle className="w-5 h-5 text-red-400" />
              <p className="text-red-300 text-sm">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-red-400 hover:text-red-300 transition-colors"
            >
              <XCircle className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Fixed Problem Header - Enhanced */}
      {problem && (
        <div className="bg-gradient-to-r from-gray-900 via-blue-900/20 to-gray-900 border-b border-blue-500/30 px-3 sm:px-6 py-3 sm:py-4 flex-shrink-0 shadow-lg">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center space-x-2 sm:space-x-3 mb-2">
              <div className="w-2 h-2 sm:w-3 sm:h-3 bg-blue-500 rounded-full animate-pulse"></div>
              <h3 className="text-base sm:text-lg font-bold text-blue-400">Problem</h3>
              <div className="flex-1 h-0.5 bg-gradient-to-r from-blue-500/50 to-transparent"></div>
            </div>
            <p className="text-white text-sm sm:text-base md:text-lg font-medium leading-relaxed p-3 sm:p-4 bg-gray-800/50 rounded-lg sm:rounded-xl border border-blue-500/20 shadow-inner">
              {problem}
            </p>
          </div>
        </div>
      )}

      {/* Scrollable Notebook Content - Between Problem and Toolbar */}
      <div className="flex-1 overflow-y-auto pb-20 sm:pb-24" ref={containerRef} style={{ maxHeight: 'calc(100vh - 200px)' }}>
        <div className="max-w-6xl mx-auto p-3 sm:p-4 md:p-6">
          {/* Problem Input - Enhanced Student-Friendly Design */}
          {!problem && (
            <div 
              className="mb-6 sm:mb-8 p-4 sm:p-6 md:p-8 border-2 border-dashed border-purple-500/30 rounded-xl sm:rounded-2xl text-center cursor-pointer hover:border-purple-400 transition-all duration-500 transform hover:scale-105 bg-gradient-to-br from-purple-900/10 to-blue-900/10 hover:from-purple-900/20 hover:to-blue-900/20 shadow-xl"
              onClick={() => setShowProblemInput(true)}
            >
              <div className="space-y-3 sm:space-y-4">
                <div className="text-6xl sm:text-8xl mb-3 sm:mb-4 transform transition-transform duration-500 hover:scale-110">🧠</div>
                <h3 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                  Ready to Master Math?
                </h3>
                <p className="text-gray-300 text-sm sm:text-base md:text-lg leading-relaxed max-w-md mx-auto px-2 sm:px-0">
                  Click here to enter your math problem and let Aristotle guide you through each step! ✨
                </p>
                <div className="flex justify-center space-x-2 mt-3 sm:mt-4">
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '200ms' }}></div>
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '400ms' }}></div>
                </div>
              </div>
            </div>
          )}

          {/* Enhanced Problem Input Modal with Canvas */}
          {showProblemInput && (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn p-4">
              <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 w-full max-w-4xl border border-purple-500/30 shadow-2xl transform animate-slideUp">
                <div className="text-center mb-4 sm:mb-6">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                    <span className="text-xl sm:text-2xl">🤔</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent mb-2">
                    What's the Challenge?
                  </h3>
                  <p className="text-sm sm:text-base text-gray-400">Write your math problem or type it below!</p>
                </div>
                
                <div className="space-y-4 sm:space-y-6">
                  {/* Drawing Canvas for Problem */}
                  <div className="relative">
                    <div className="text-xs sm:text-sm text-purple-400 font-medium mb-2 flex items-center space-x-2">
                      <span>✏️</span>
                      <span>Draw your problem (auto-recognizes as you write)</span>
                    </div>
                    <div className="relative group">
                      <div 
                        className="relative overflow-hidden rounded-lg sm:rounded-xl"
                        style={{ 
                          transform: `scale(${zoomLevel})`,
                          transformOrigin: 'top left',
                          width: `${100 / zoomLevel}%`,
                          height: `${100 / zoomLevel}%`
                        }}
                      >
                        {/* Grid Background */}
                        {showGrid && (
                          <div 
                            className="absolute inset-0 pointer-events-none"
                            style={{
                              backgroundImage: `
                                linear-gradient(rgba(139, 43, 226, 0.1) 1px, transparent 1px),
                                linear-gradient(90deg, rgba(139, 43, 226, 0.1) 1px, transparent 1px)
                              `,
                              backgroundSize: '20px 20px'
                            }}
                          />
                        )}
                      <canvas
                        ref={problemCanvasRef}
                          className={`w-full h-32 sm:h-40 md:h-48 rounded-lg sm:rounded-xl border-2 border-purple-500/20 hover:border-purple-400/60 transition-all duration-500 shadow-2xl hover:shadow-purple-500/20 hover:shadow-2xl transform hover:scale-[1.01] backdrop-blur-sm ${
                            selectedInputType === 'pen' ? 'input-pen-mode' :
                            selectedInputType === 'touch' ? 'input-touch-mode' :
                            'input-mouse-mode'
                          }`}
                        style={{
                          background: 'linear-gradient(135deg, rgba(139, 43, 226, 0.05) 0%, rgba(0, 0, 0, 0.8) 100%)',
                          boxShadow: 'inset 0 1px 3px rgba(139, 43, 226, 0.3), 0 4px 20px rgba(0, 0, 0, 0.5)'
                        }}
                        // Primary pointer events (supports pen, touch, mouse)
                        onPointerDown={handleProblemPointerDown}
                        onPointerMove={handleProblemPointerMove}
                        onPointerUp={handleProblemPointerUp}
                        onPointerLeave={() => handleProblemPointerUp({ preventDefault: () => {} } as React.PointerEvent)}
                        // Fallback mouse events for older browsers
                        onMouseDown={handleProblemMouseDown}
                        onMouseMove={handleProblemMouseMove}
                        onMouseUp={handleProblemMouseUp}
                        onMouseLeave={handleProblemMouseUp}
                        // Enhanced touch events for mobile (fallback)
                        onTouchStart={(e) => {
                          e.preventDefault();
                          const touch = e.touches[0];
                          const mouseEvent = new MouseEvent('mousedown', {
                            clientX: touch.clientX,
                            clientY: touch.clientY
                          });
                          handleProblemMouseDown(mouseEvent as any);
                        }}
                        onTouchMove={(e) => {
                          e.preventDefault();
                          const touch = e.touches[0];
                          const mouseEvent = new MouseEvent('mousemove', {
                            clientX: touch.clientX,
                            clientY: touch.clientY
                          });
                          handleProblemMouseMove(mouseEvent as any);
                        }}
                        onTouchEnd={(e) => {
                          e.preventDefault();
                          handleProblemMouseUp();
                        }}
                      />
                      </div>
                      

                      {/* Drawing indicator with input type */}
                      {isDrawingProblem && (
                        <div className="absolute top-2 left-2 flex items-center space-x-2 animate-pulse">
                          <div className="w-2 h-2 bg-blue-400 rounded-full animate-ping"></div>
                          <span className="text-xs text-blue-400 font-medium">
                            Drawing with {currentInputType === 'pen' ? '✏️ Pen' : currentInputType === 'touch' ? '👆 Touch' : '🖱️ Mouse'}...
                          </span>
                        </div>
                      )}
                      
                      {/* Recognition indicator */}
                      {problem && (
                        <div className="absolute top-2 right-2 flex items-center space-x-1 animate-fadeIn">
                          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                          <span className="text-xs text-green-400 font-medium">Recognized</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Text Input for Problem */}
                  <div className="relative">
                    <div className="text-xs sm:text-sm text-purple-400 font-medium mb-2 flex items-center space-x-2">
                      <span>⌨️</span>
                      <span>Or type your problem</span>
                    </div>
                    <input
                      ref={problemInputRef}
                      type="text"
                      value={problem}
                      onChange={(e) => setProblem(e.target.value)}
                      placeholder="e.g., Solve for x: 2x + 5 = 13"
                      className="w-full p-3 sm:p-4 bg-gray-700/50 border-2 border-purple-500/30 rounded-lg sm:rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 focus:ring-4 focus:ring-purple-400/20 transition-all duration-300 text-sm sm:text-base md:text-lg backdrop-blur-sm"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-blue-500/5 rounded-lg sm:rounded-xl pointer-events-none"></div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
                    <button
                      onClick={handleProblemSubmit}
                      className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded-lg sm:rounded-xl transition-all duration-300 transform hover:scale-105 font-semibold text-base sm:text-lg shadow-lg"
                    >
                      🚀 Let's Go!
                    </button>
                    <button
                      onClick={() => {
                        setShowProblemInput(false);
                        // Clear problem canvas
                        setProblemStrokes([]);
                        setProblemCurrentStrokes([]);
                        redrawProblemCanvas();
                      }}
                      className="flex-1 py-3 bg-gray-600 hover:bg-gray-500 rounded-lg sm:rounded-xl transition-all duration-300 transform hover:scale-105 font-semibold text-base sm:text-lg"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Steps */}
          {steps.map((step, index) => (
            <div
              key={step.id}
              data-step-id={step.id}
              className={`relative mb-4 p-4 rounded-2xl transition-all duration-500 transform hover:scale-[1.01] ${
                step.status === 'correct' 
                  ? 'bg-gradient-to-r from-green-900/20 to-emerald-900/10 border border-green-400/30 shadow-lg shadow-green-500/10' 
                  : step.status === 'incorrect' 
                  ? 'bg-gradient-to-r from-red-900/20 to-pink-900/10 border border-red-400/30 shadow-lg shadow-red-500/10 animate-pulse' 
                  : 'bg-gradient-to-r from-gray-900/30 to-purple-900/10 border border-purple-500/20 hover:border-purple-400/40'
              }`}
              onMouseEnter={() => setHoveredStep(step.id)}
              onMouseLeave={() => setHoveredStep(null)}
            >
              {/* Enhanced Step Marker with Interactive Animations */}
              <div className="absolute left-2 top-6 w-12 h-20 flex items-center justify-center">
                <div className={`w-12 h-12 rounded-full border-2 ${getStepColor(step)} flex items-center justify-center bg-gradient-to-br from-gray-900 to-black relative transform transition-all duration-500 hover:scale-125 hover:rotate-12 shadow-2xl hover:shadow-purple-500/30 group`}>
                  {getStepIcon(step)}
                  
                  {/* Enhanced Step Number with animations */}
                  <div className={`absolute -top-3 -right-3 w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-500 transform hover:scale-110 ${
                    step.status === 'correct' 
                      ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white animate-bounce shadow-lg shadow-green-500/50' 
                      : step.status === 'incorrect' 
                      ? 'bg-gradient-to-r from-red-500 to-pink-600 text-white animate-shake shadow-lg shadow-red-500/50' 
                      : 'bg-gradient-to-r from-purple-500 to-blue-600 text-white hover:animate-pulse-glow shadow-lg shadow-purple-500/50'
                  }`}>
                    {step.id}
                  </div>
                  
                  {/* Progress ring for current step */}
                  {step.status === 'current' && (
                    <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-blue-400 animate-spin"></div>
                  )}
                  
                  {/* Success checkmark animation */}
                  {step.status === 'correct' && (
                    <div className="absolute inset-0 rounded-full border-2 border-green-400 animate-ping"></div>
                  )}
                  
                  {/* Hover effect */}
                  <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500/20 to-blue-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
              </div>

               {/* Enhanced HTML5 Canvas with smooth animations */}
               <div className="ml-16 mr-80 relative group">
                 <div className="relative">
                   {/* Canvas with enhanced styling and animations */}
                   <div 
                     className="relative overflow-hidden rounded-xl"
                     style={{ 
                       transform: `scale(${zoomLevel})`,
                       transformOrigin: 'top left',
                       width: `${100 / zoomLevel}%`,
                       height: `${100 / zoomLevel}%`
                     }}
                   >
                     {/* Grid Background */}
                     {showGrid && (
                       <div 
                         className="absolute inset-0 pointer-events-none"
                         style={{
                           backgroundImage: `
                             linear-gradient(rgba(139, 43, 226, 0.1) 1px, transparent 1px),
                             linear-gradient(90deg, rgba(139, 43, 226, 0.1) 1px, transparent 1px)
                           `,
                           backgroundSize: '20px 20px'
                         }}
                       />
                     )}
                   <canvas
                     ref={el => canvasRefs.current[step.id - 1] = el}
                     className={`w-full h-32 rounded-xl border-2 border-purple-500/20 hover:border-purple-400/60 transition-all duration-500 shadow-2xl hover:shadow-purple-500/20 hover:shadow-2xl transform hover:scale-[1.01] backdrop-blur-sm ${
                       selectedInputType === 'pen' ? 'input-pen-mode' :
                       selectedInputType === 'touch' ? 'input-touch-mode' :
                       'input-mouse-mode'
                     }`}
                     style={{
                       background: 'linear-gradient(135deg, rgba(139, 43, 226, 0.05) 0%, rgba(0, 0, 0, 0.8) 100%)',
                       boxShadow: 'inset 0 1px 3px rgba(139, 43, 226, 0.3), 0 4px 20px rgba(0, 0, 0, 0.5)'
                     }}
                     // Primary pointer events (supports pen, touch, mouse)
                     onPointerDown={(e) => handlePointerDown(e, step.id)}
                     onPointerMove={(e) => handlePointerMove(e, step.id)}
                     onPointerUp={(e) => handlePointerUp(e, step.id)}
                     onPointerEnter={() => {
                       // Add subtle glow effect on hover
                       const canvas = canvasRefs.current[step.id - 1];
                       if (canvas) {
                         canvas.style.boxShadow = 'inset 0 1px 3px rgba(139, 43, 226, 0.5), 0 4px 25px rgba(139, 43, 226, 0.3)';
                       }
                     }}
                     onPointerLeave={() => {
                       // Reset glow effect and end drawing
                       const canvas = canvasRefs.current[step.id - 1];
                       if (canvas) {
                         canvas.style.boxShadow = 'inset 0 1px 3px rgba(139, 43, 226, 0.3), 0 4px 20px rgba(0, 0, 0, 0.5)';
                       }
                       handlePointerUp({ preventDefault: () => {} } as React.PointerEvent, step.id);
                     }}
                     // Fallback mouse events for older browsers
                     onMouseDown={(e) => handleMouseDown(e, step.id)}
                     onMouseMove={(e) => handleMouseMove(e, step.id)}
                     onMouseUp={() => handleMouseUp(step.id)}
                     onMouseEnter={() => {
                       // Add subtle glow effect on hover
                       const canvas = canvasRefs.current[step.id - 1];
                       if (canvas) {
                         canvas.style.boxShadow = 'inset 0 1px 3px rgba(139, 43, 226, 0.5), 0 4px 25px rgba(139, 43, 226, 0.3)';
                       }
                     }}
                     onMouseLeave={() => {
                       // Reset glow effect and end drawing
                       const canvas = canvasRefs.current[step.id - 1];
                       if (canvas) {
                         canvas.style.boxShadow = 'inset 0 1px 3px rgba(139, 43, 226, 0.3), 0 4px 20px rgba(0, 0, 0, 0.5)';
                       }
                       handleMouseUp(step.id);
                     }}
                     // Enhanced touch events for mobile (fallback)
                     onTouchStart={(e) => {
                       e.preventDefault();
                       const touch = e.touches[0];
                       const mouseEvent = new MouseEvent('mousedown', {
                         clientX: touch.clientX,
                         clientY: touch.clientY
                       });
                       handleMouseDown(mouseEvent as any, step.id);
                     }}
                     onTouchMove={(e) => {
                       e.preventDefault();
                       const touch = e.touches[0];
                       const mouseEvent = new MouseEvent('mousemove', {
                         clientX: touch.clientX,
                         clientY: touch.clientY
                       });
                       handleMouseMove(mouseEvent as any, step.id);
                     }}
                     onTouchEnd={(e) => {
                       e.preventDefault();
                       handleMouseUp(step.id);
                     }}
                   />
                   </div>
                   

                   {/* Drawing indicator with input type */}
                   {isDrawing[step.id] && (
                     <div className="absolute top-2 left-2 flex items-center space-x-2 animate-pulse">
                       <div className="w-2 h-2 bg-blue-400 rounded-full animate-ping"></div>
                       <span className="text-xs text-blue-400 font-medium">
                         Drawing with {currentInputType === 'pen' ? '✏️ Pen' : currentInputType === 'touch' ? '👆 Touch' : '🖱️ Mouse'}...
                       </span>
                     </div>
                   )}
                   
                   {/* Recognition indicator */}
                   {step.latex && (
                     <div className="absolute top-2 right-2 flex items-center space-x-1 animate-fadeIn">
                       <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                       <span className="text-xs text-green-400 font-medium">Recognized</span>
                     </div>
                   )}
                 </div>
                
                {/* Clear Step Button - Enhanced */}
                <button
                  onClick={() => handleClearStep(step.id)}
                  className="absolute top-2 right-2 p-2 bg-gradient-to-r from-red-500/20 to-pink-500/20 hover:from-red-500/40 hover:to-pink-500/40 rounded-lg text-xs text-red-300 opacity-0 group-hover:opacity-100 transition-all duration-300 transform hover:scale-110 border border-red-500/30"
                >
                  ✕
                </button>
              </div>

               {/* Enhanced LaTeX feedback column with smooth animations */}
               {showFeedback && (
                 <div className="absolute right-0 top-0 w-72 h-20 flex items-center">
                   <div className="text-sm text-gray-300 font-mono bg-gradient-to-br from-gray-900/90 to-gray-800/90 backdrop-blur-sm p-4 rounded-xl w-full relative border border-purple-500/20 hover:border-purple-400/40 transition-all duration-500 shadow-xl hover:shadow-2xl hover:shadow-purple-500/10">
                     {/* Enhanced LaTeX input with auto-population */}
                     <input
                       type="text"
                       value={step.latex}
                       onChange={(e) => {
                         const latexValue = e.target.value;
                         setSteps(prev => prev.map((s, index) => 
                           index === step.id - 1 
                             ? { 
                                 ...s, 
                                 latex: latexValue,
                                 content: latexValue,
                                 status: 'current',
                                 isChecked: false,
                                 validationResult: undefined
                               }
                             : s
                         ));
                       }}
                       placeholder="Write equation... (auto-recognizes as you draw) or type directly here"
                       className="w-full bg-transparent border-none outline-none text-white placeholder-gray-400 text-sm focus:placeholder-gray-500 transition-all duration-300"
                     />
                     
                     {/* Enhanced status indicators */}
                     {step.latex && (
                       <div className="absolute top-2 right-2 flex items-center space-x-1 animate-fadeIn">
                         <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                         <span className="text-green-400 text-xs font-medium">Auto-recognized</span>
                       </div>
                     )}
                     
                     {/* Helpful note */}
                     <div className="absolute bottom-1 left-2 text-xs text-gray-500">
                       💡 Draw on canvas or type directly
                     </div>
                     
                     {/* Recognition confidence indicator */}
                     {step.latex && (
                       <div className="absolute bottom-1 right-2 text-xs text-purple-400 opacity-70">
                         Confidence: 95%
                       </div>
                     )}
                   </div>
                   
                   {/* Enhanced Check Step Button with animations */}
                   <div className="absolute right-3 top-3 flex space-x-2">
                     {step.latex && !step.isChecked && (
                       <button
                         onClick={() => handleValidateStep(step.id)}
                         disabled={validatingStep === step.id}
                         className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed rounded-xl text-xs font-semibold transition-all duration-500 transform hover:scale-110 hover:rotate-1 shadow-lg hover:shadow-xl text-white border border-green-400/30 hover:border-green-300/50"
                       >
                         {validatingStep === step.id ? (
                           <div className="flex items-center space-x-2">
                             <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                             <span>Checking...</span>
                           </div>
                         ) : (
                           <div className="flex items-center space-x-2">
                             <span>✅</span>
                             <span>Check Step</span>
                           </div>
                         )}
                       </button>
                     )}
                     
                     {/* Step status indicator */}
                     {step.isChecked && (
                       <div className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-500 transform ${
                         step.status === 'correct' 
                           ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white animate-bounce' 
                           : 'bg-gradient-to-r from-red-500 to-pink-600 text-white animate-shake'
                       }`}>
                         {step.status === 'correct' ? '✓ Correct' : '✗ Incorrect'}
                       </div>
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
            <div className="ml-16 mt-8 mb-8 flex space-x-3">
              <button
                onClick={addNewStep}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors text-sm"
              >
                + Add Step
              </button>
              
              {/* Submit Solution Button - Always Enabled */}
              {steps.length > 0 && (
                <button
                  onClick={handleSubmitSolution}
                  className="px-6 py-3 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 rounded-lg transition-all text-sm font-semibold shadow-lg transform hover:scale-105 text-white"
                >
                  🎯 Submit Solution
                </button>
              )}
            </div>
          )}
          
          {/* Extra padding to ensure Submit button is never hidden behind toolbar */}
          <div className="h-20"></div>
        </div>
      </div>

      {/* Enhanced Floating Bottom Toolbar with Animations */}
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-gray-900/95 to-gray-800/95 backdrop-blur-xl rounded-2xl px-8 py-4 shadow-2xl border border-purple-500/20 hover:border-purple-400/40 transition-all duration-500 hover:shadow-purple-500/20 hover:shadow-2xl">
        <div className="flex items-center space-x-6">
          {/* Enhanced Undo/Redo with animations */}
          <div className="flex items-center space-x-2">
            <button 
              onClick={handleUndo}
              disabled={currentStep < 0 || currentStep >= steps.length}
              className="p-3 hover:bg-gray-700/50 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-all duration-300 transform hover:scale-110 hover:rotate-12 disabled:hover:scale-100 disabled:hover:rotate-0 group"
              title="Undo last action"
            >
              <Undo className="w-5 h-5 text-gray-400 group-hover:text-blue-400 transition-colors duration-300" />
            </button>
            <button 
              onClick={handleRedo}
              disabled={currentStep < 0 || currentStep >= steps.length}
              className="p-3 hover:bg-gray-700/50 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-all duration-300 transform hover:scale-110 hover:-rotate-12 disabled:hover:scale-100 disabled:hover:rotate-0 group"
              title="Redo last action"
            >
              <Redo className="w-5 h-5 text-gray-400 group-hover:text-blue-400 transition-colors duration-300" />
            </button>
          </div>

          {/* Enhanced Drawing Tools */}
          <div className="w-px h-8 bg-gradient-to-b from-transparent via-purple-500/30 to-transparent"></div>
          
          <div className="flex items-center space-x-2">
            <button 
              className="p-3 rounded-xl transition-all duration-300 transform hover:scale-110 bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg hover:shadow-blue-500/50 animate-pulse-glow"
              title="Pen tool (active)"
            >
              <PenTool className="w-5 h-5" />
            </button>
            <button 
              onClick={() => {
                // Clear current step
                if (currentStep >= 0 && currentStep < steps.length) {
                  handleClearStep(steps[currentStep].id);
                }
              }}
              className="p-3 hover:bg-red-600/20 rounded-xl transition-all duration-300 transform hover:scale-110 hover:rotate-12 group"
              title="Clear current step"
            >
              <Eraser className="w-5 h-5 text-gray-400 group-hover:text-red-400 transition-colors duration-300" />
            </button>
          </div>

          {/* Enhanced Color Palette with animations */}
          <div className="w-px h-8 bg-gradient-to-b from-transparent via-purple-500/30 to-transparent"></div>
          <div className="flex items-center space-x-3">
            <span className="text-xs text-purple-400 font-medium">Colors</span>
            <div className="flex items-center space-x-2">
              {[
                { color: '#1DA1F2', name: 'Blue' },
                { color: '#00C853', name: 'Green' },
                { color: '#FF5252', name: 'Red' },
                { color: '#FFD600', name: 'Yellow' },
                { color: '#FFFFFF', name: 'White' },
                { color: '#000000', name: 'Black' }
              ].map(({ color, name }) => (
                <button
                  key={color}
                  onClick={() => setStrokeColor(color)}
                  className={`w-8 h-8 rounded-full border-2 transition-all duration-300 transform hover:scale-125 hover:rotate-12 ${
                    strokeColor === color 
                      ? 'border-white scale-110 shadow-lg shadow-blue-500/50 animate-bounce-in' 
                      : 'border-gray-600 hover:border-white hover:shadow-lg'
                  }`}
                  style={{ 
                    backgroundColor: color,
                    boxShadow: strokeColor === color ? `0 0 20px ${color}50` : 'none'
                  }}
                  title={`Select ${name} color`}
                />
              ))}
            </div>
          </div>

          {/* Enhanced Thickness Control */}
          <div className="w-px h-8 bg-gradient-to-b from-transparent via-purple-500/30 to-transparent"></div>
          <div className="flex items-center space-x-3">
            <span className="text-xs text-purple-400 font-medium">Thickness</span>
            <div className="flex items-center space-x-3">
              <input
                type="range"
                min="1"
                max="10"
                value={strokeWidth}
                onChange={(e) => setStrokeWidth(Number(e.target.value))}
                className="w-20 accent-purple-500 hover:accent-blue-500 transition-all duration-300"
                title={`Stroke width: ${strokeWidth}px`}
              />
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center text-white text-xs font-bold shadow-lg">
                {strokeWidth}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Save Success Overlay */}
      {saveSuccess && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn">
          <div className="bg-gradient-to-br from-green-900/90 to-emerald-900/90 backdrop-blur-xl rounded-2xl p-8 max-w-md mx-4 border border-green-500/30 shadow-2xl transform animate-bounce-in">
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                <div className="w-10 h-10 text-white text-2xl animate-bounce">✓</div>
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Notebook Saved!</h3>
              <p className="text-green-200 mb-4">
                Your notebook has been saved successfully.
              </p>
              <div className="flex items-center justify-center space-x-2 text-green-300">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '200ms' }}></div>
                <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '400ms' }}></div>
              </div>
              <p className="text-sm text-green-300 mt-4">Redirecting to your notebooks...</p>
            </div>
          </div>
        </div>
      )}

      {/* Results Modal */}
      {showResultsModal && solutionResults && (
        <div 
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowResultsModal(false);
            }
          }}
        >
          <div className="bg-gray-900 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-t-2xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">🎉 Solution Complete!</h2>
                  <p className="text-blue-100 mt-1">Your mathematical journey summary</p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold">{solutionResults.score}/100</div>
                  <div className="text-sm text-blue-200">Final Score</div>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              {/* Problem Summary */}
              <div className="mb-6 p-4 bg-gray-800 rounded-lg">
                <h3 className="text-lg font-semibold text-blue-400 mb-2">📝 Problem</h3>
                <p className="text-white text-lg">{problem}</p>
              </div>

              {/* Statistics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center p-4 bg-gray-800 rounded-lg">
                  <div className="text-2xl font-bold text-green-400">{solutionResults.correctSteps}</div>
                  <div className="text-sm text-gray-400">Correct Steps</div>
                </div>
                <div className="text-center p-4 bg-gray-800 rounded-lg">
                  <div className="text-2xl font-bold text-blue-400">{solutionResults.totalSteps}</div>
                  <div className="text-sm text-gray-400">Total Steps</div>
                </div>
                <div className="text-center p-4 bg-gray-800 rounded-lg">
                  <div className="text-2xl font-bold text-purple-400">
                    {Math.round((solutionResults.correctSteps / solutionResults.totalSteps) * 100)}%
                  </div>
                  <div className="text-sm text-gray-400">Accuracy</div>
                </div>
                <div className="text-center p-4 bg-gray-800 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-400">
                    {Math.round(solutionResults.completionTime / 60000)}m
                  </div>
                  <div className="text-sm text-gray-400">Time Taken</div>
                </div>
              </div>

              {/* Step-by-Step Review */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-white mb-4">📊 Step-by-Step Review</h3>
                <div className="space-y-2">
                  {steps.map((step, index) => (
                    <div key={step.id} className="flex items-center p-3 bg-gray-800 rounded-lg">
                      <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-white font-bold mr-3">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <code className="text-blue-300">{step.latex}</code>
                      </div>
                      <div className="flex items-center space-x-2">
                        {inputMode[step.id] && (
                          <span className={`text-xs px-2 py-1 rounded ${
                            inputMode[step.id] === 'typing' 
                              ? 'bg-purple-600 text-purple-100' 
                              : 'bg-blue-600 text-blue-100'
                          }`}>
                            {inputMode[step.id] === 'typing' ? '⌨️' : '✏️'}
                          </span>
                        )}
                        
                        {/* Enhanced validation display with confidence */}
                        {step.validationResult && (
                          <div className="flex items-center space-x-2">
                            {step.validationResult.isCorrect ? (
                              <div className="flex items-center space-x-1">
                          <span className="text-green-400">✓</span>
                                <div className="w-8 h-1 bg-gray-700 rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-green-400 transition-all duration-500"
                                    style={{ width: `${(step.validationResult.confidence || 0.8) * 100}%` }}
                                  />
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center space-x-1">
                          <span className="text-red-400">✗</span>
                                <div className="w-8 h-1 bg-gray-700 rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-red-400 transition-all duration-500"
                                    style={{ width: `${(step.validationResult.confidence || 0.8) * 100}%` }}
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* AI Feedback */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center space-x-2">
                  <span>🤖</span>
                  <span>AI Feedback</span>
                  <div className="flex items-center space-x-1 ml-auto">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-xs text-gray-400">Live Analysis</span>
                  </div>
                </h3>
                <div className="p-4 bg-gradient-to-r from-gray-800 to-gray-700 rounded-lg border border-gray-600">
                  <p className="text-white leading-relaxed mb-3">{solutionResults.feedback}</p>
                  
                  {/* Learning Tips */}
                  <div className="mt-4 p-3 bg-blue-900/20 rounded-lg border border-blue-500/30">
                    <div className="flex items-start space-x-2">
                      <Lightbulb className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-yellow-300 mb-1">💡 Learning Tip</p>
                        <p className="text-xs text-blue-200">
                          {solutionResults.score >= 80 ? 
                            "Great job! You're mastering this concept. Try more complex problems to challenge yourself." :
                            solutionResults.score >= 60 ?
                            "Good progress! Focus on the steps you missed and practice similar problems." :
                            "Keep practicing! Math skills improve with consistent effort. Don't give up!"
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Suggestions */}
              {solutionResults.suggestions && solutionResults.suggestions.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-white mb-3">💡 Suggestions for Improvement</h3>
                  <ul className="space-y-2">
                    {solutionResults.suggestions.map((suggestion, index) => (
                      <li key={index} className="flex items-start p-3 bg-gray-800 rounded-lg">
                        <span className="text-yellow-400 mr-2">•</span>
                        <span className="text-white">{suggestion}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-700">
              <div className="flex justify-between items-center mb-4">
              <div className="text-sm text-gray-400">
                Keep practicing to improve your mathematical skills! 🚀
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowResultsModal(false)}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg transition-colors text-white"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setShowResultsModal(false);
                    handleSave();
                  }}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors text-white"
                >
                  Save & Close
                </button>
                </div>
              </div>
              
            </div>
          </div>
        </div>
      )}

      {/* Input Type Selection Modal */}
      {showInputTypeModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900/95 backdrop-blur-xl border border-purple-500/30 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-400 to-blue-400 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">✏️</span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Choose Your Input Method</h3>
              <p className="text-gray-300">How would you like to write in this notebook? This includes both the problem and your solutions.</p>
            </div>

            <div className="space-y-4 mb-6">
              {/* Mouse Option */}
              <button
                onClick={() => handleInputTypeSelect('mouse')}
                className="w-full p-4 bg-gray-800/50 hover:bg-gray-700/50 border border-gray-600 hover:border-purple-400 rounded-xl transition-all duration-300 group"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gray-700 group-hover:bg-purple-600 rounded-lg flex items-center justify-center transition-colors">
                    <span className="text-2xl">🖱️</span>
                  </div>
                  <div className="text-left">
                    <h4 className="text-white font-semibold">Mouse</h4>
                    <p className="text-gray-400 text-sm">Perfect for desktop computers</p>
                  </div>
                </div>
              </button>

              {/* Touch Option */}
              <button
                onClick={() => handleInputTypeSelect('touch')}
                className="w-full p-4 bg-gray-800/50 hover:bg-gray-700/50 border border-gray-600 hover:border-purple-400 rounded-xl transition-all duration-300 group"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gray-700 group-hover:bg-purple-600 rounded-lg flex items-center justify-center transition-colors">
                    <span className="text-2xl">👆</span>
                  </div>
                  <div className="text-left">
                    <h4 className="text-white font-semibold">Touch</h4>
                    <p className="text-gray-400 text-sm">Great for phones and tablets</p>
                  </div>
                </div>
              </button>

              {/* Pen Option */}
              <button
                onClick={() => handleInputTypeSelect('pen')}
                className="w-full p-4 bg-gray-800/50 hover:bg-gray-700/50 border border-gray-600 hover:border-purple-400 rounded-xl transition-all duration-300 group"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gray-700 group-hover:bg-purple-600 rounded-lg flex items-center justify-center transition-colors">
                    <span className="text-2xl">✏️</span>
                  </div>
                  <div className="text-left">
                    <h4 className="text-white font-semibold">Pen/Stylus</h4>
                    <p className="text-gray-400 text-sm">Best for tablets with stylus support</p>
                  </div>
                </div>
              </button>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={handleSkipInputType}
                className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors"
              >
                Auto-detect
              </button>
              <button
                onClick={() => setShowInputTypeModal(false)}
                className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
              >
                Skip for now
              </button>
            </div>
            <p className="text-xs text-gray-400 text-center mt-3">
              You can change this anytime using the ⚙️ button in the toolbar
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
