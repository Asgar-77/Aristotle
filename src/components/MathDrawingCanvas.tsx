import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Point, Stroke } from '../types';
import { mathRecognition } from '../services/mathRecognition';
import debounce from 'lodash/debounce';
import katex from 'katex';
import 'katex/dist/katex.min.css';

interface MathDrawingCanvasProps {
  onStrokesChange?: (strokes: Stroke[]) => void;
  onLatexChange?: (latex: string) => void;
  initialStrokes?: Stroke[];
  width?: number;
  height?: number;
}

export const MathDrawingCanvas: React.FC<MathDrawingCanvasProps> = ({
  onStrokesChange,
  onLatexChange,
  initialStrokes = [],
  width = 800,
  height = 400
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mathDisplayRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentStroke, setCurrentStroke] = useState<Point[]>([]);
  const [strokes, setStrokes] = useState<Stroke[]>(initialStrokes);
  const [latex, setLatex] = useState<string>('');
  const [isRecognizing, setIsRecognizing] = useState(false);

  // Initialize canvas
  const initializeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = width;
    canvas.height = height;

    // Set canvas style
    ctx.imageSmoothingEnabled = false;
    
    // Draw black background
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw grid
    ctx.strokeStyle = '#1DA1F2';
    ctx.lineWidth = 0.5;
    ctx.globalAlpha = 0.2;
    
    // Draw vertical lines
    for (let x = 0; x <= width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    
    // Draw horizontal lines
    for (let y = 0; y <= height; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    
    ctx.globalAlpha = 1;
    
    // Draw existing strokes
    drawStrokes(strokes);
  }, [width, height, strokes]);

  useEffect(() => {
    initializeCanvas();
  }, [initializeCanvas]);

  // Drawing functions
  const drawStrokes = useCallback((strokesToDraw: Stroke[]) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    strokesToDraw.forEach(stroke => {
      if (stroke.points.length < 2) return;
      
      ctx.beginPath();
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }
      
      ctx.stroke();
    });
  }, []);

  // Recognition
  const recognizeStrokes = useCallback(async (strokeData: Stroke[]) => {
    if (strokeData.length === 0) return;
    
    try {
      setIsRecognizing(true);
      const result = await mathRecognition.recognizeStrokes(strokeData);
      
      setLatex(result.latex);
      onLatexChange?.(result.latex);

      // Render LaTeX
      if (mathDisplayRef.current && result.latex) {
        katex.render(result.latex, mathDisplayRef.current, {
          displayMode: true,
          throwOnError: false,
          trust: true,
          strict: false,
        });
      }
    } catch (error) {
      console.error('Recognition error:', error);
    } finally {
      setIsRecognizing(false);
    }
  }, [onLatexChange]);

  // Debounced recognition
  const debouncedRecognize = useCallback(
    debounce((strokeData: Stroke[]) => {
      recognizeStrokes(strokeData);
    }, 300),
    [recognizeStrokes]
  );

  // Event handlers
  const getCanvasPoint = (e: MouseEvent | Touch): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * canvas.width,
      y: ((e.clientY - rect.top) / rect.height) * canvas.height
    };
  };

  const startDrawing = useCallback((point: Point) => {
    setIsDrawing(true);
    setCurrentStroke([point]);
  }, []);

  const draw = useCallback((point: Point) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const newStroke = [...currentStroke, point];
    setCurrentStroke(newStroke);

    // Draw the current stroke
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (newStroke.length > 1) {
      ctx.beginPath();
      ctx.moveTo(newStroke[newStroke.length - 2].x, newStroke[newStroke.length - 2].y);
      ctx.lineTo(point.x, point.y);
      ctx.stroke();
    }
  }, [isDrawing, currentStroke]);

  const endDrawing = useCallback(() => {
    if (!isDrawing || currentStroke.length < 2) {
      setIsDrawing(false);
      setCurrentStroke([]);
      return;
    }

    const newStroke: Stroke = {
      points: currentStroke,
      timestamp: Date.now()
    };

    const updatedStrokes = [...strokes, newStroke];
    setStrokes(updatedStrokes);
    onStrokesChange?.(updatedStrokes);
    debouncedRecognize(updatedStrokes);
    
    setIsDrawing(false);
    setCurrentStroke([]);
  }, [isDrawing, currentStroke, strokes, onStrokesChange, debouncedRecognize]);

  // Mouse events
  const handleMouseDown = (e: React.MouseEvent) => {
    const point = getCanvasPoint(e.nativeEvent);
    startDrawing(point);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const point = getCanvasPoint(e.nativeEvent);
    draw(point);
  };

  // Touch events
  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    if (e.touches.length === 0) return;
    const point = getCanvasPoint(e.touches[0]);
    startDrawing(point);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    if (e.touches.length === 0) return;
    const point = getCanvasPoint(e.touches[0]);
    draw(point);
  };

  return (
    <div className="flex space-x-4">
      <div className="flex-1">
        <canvas
          ref={canvasRef}
          className="w-full h-full cursor-crosshair touch-none border-2 border-blue-500/30 rounded-lg"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={endDrawing}
          onMouseLeave={endDrawing}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={endDrawing}
        />
      </div>

      <div className="w-1/2">
        <div className="bg-gray-900 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-white mb-4">LaTeX Output</h3>
          
          {isRecognizing ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : latex ? (
            <>
              <div ref={mathDisplayRef} className="mb-4 bg-black/50 p-4 rounded overflow-x-auto"></div>
              <div className="text-sm font-mono text-gray-400 bg-black/30 p-2 rounded">
                {latex}
              </div>
            </>
          ) : (
            <div className="text-gray-500 text-center py-8">
              Start writing to see LaTeX output
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

