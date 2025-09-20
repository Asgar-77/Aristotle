import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Point, Stroke } from '../types';
import { getCanvasCoordinates, drawStroke, clearCanvas, redrawAllStrokes } from '../utils/canvas';
import debounce from 'lodash/debounce';
import katex from 'katex';
import 'katex/dist/katex.min.css';

interface RealTimeLatexCanvasProps {
  onStrokesChange?: (strokes: Stroke[]) => void;
  onLatexChange?: (latex: string) => void;
  onClear?: () => void;
  initialStrokes?: Stroke[];
}

export const RealTimeLatexCanvas: React.FC<RealTimeLatexCanvasProps> = ({
  onStrokesChange,
  onLatexChange,
  onClear,
  initialStrokes = []
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mathRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentStroke, setCurrentStroke] = useState<Point[]>([]);
  const [strokes, setStrokes] = useState<Stroke[]>(initialStrokes);
  const [latex, setLatex] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isRecognizing, setIsRecognizing] = useState(false);

  // Initialize canvas with grid and background
  const initializeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = 800;
    canvas.height = 400;

    // Set canvas style
    ctx.imageSmoothingEnabled = false;
    
    // Draw black background
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw grid
    const gridSize = 40;
    ctx.strokeStyle = '#1DA1F2';
    ctx.lineWidth = 0.5;
    ctx.globalAlpha = 0.2;
    
    for (let x = 0; x <= canvas.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    
    for (let y = 0; y <= canvas.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }
    
    ctx.globalAlpha = 1;
    
    // Redraw existing strokes
    redrawAllStrokes(ctx, strokes);
  }, [strokes]);

  useEffect(() => {
    initializeCanvas();
  }, [initializeCanvas]);

  // Mathpix API call
  const recognizeStrokes = async (strokeData: Stroke[]) => {
    try {
      setIsRecognizing(true);
      setError(null);

      // Transform strokes to Mathpix format
      const xArrays: number[][] = [];
      const yArrays: number[][] = [];

      strokeData.forEach(stroke => {
        const xPoints = stroke.points.map(point => point.x);
        const yPoints = stroke.points.map(point => point.y);
        xArrays.push(xPoints);
        yArrays.push(yPoints);
      });

      const requestData = {
        strokes: {
          strokes: {
            x: xArrays,
            y: yArrays
          }
        }
      };

      const response = await fetch("https://api.mathpix.com/v3/strokes", {
        method: "POST",
        headers: {
          "app_id": "aristotle_927f26_bb2bac",
          "app_key": "e450411a0ccb86471c9920940dce21bd6d7b148bf5534407f989756e179781c6",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      });

      const data = await response.json();

      if (response.ok && data.latex) {
        const cleanedLatex = data.latex
          .replace(/^\\\(|\\\)$|^\\\[|\\\]$|^\$|\$$|^\$\$|\$\$$/g, '')
          .trim();
        setLatex(cleanedLatex);
        onLatexChange?.(cleanedLatex);
      } else {
        setError(data.error || 'Recognition failed');
      }
    } catch (err) {
      setError('Network error occurred');
      console.error('Recognition error:', err);
    } finally {
      setIsRecognizing(false);
    }
  };

  // Debounced recognition
  const debouncedRecognize = useCallback(
    debounce((strokeData: Stroke[]) => {
      if (strokeData.length > 0) {
        recognizeStrokes(strokeData);
      }
    }, 300),
    []
  );

  // Drawing handlers
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

    if (newStroke.length > 1) {
      const tempStroke: Stroke = {
        points: newStroke,
        timestamp: Date.now()
      };
      
      clearCanvas(canvas, ctx);
      redrawAllStrokes(ctx, strokes);
      drawStroke(ctx, tempStroke);
    }
  }, [isDrawing, currentStroke, strokes]);

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

  // Event handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const point = getCanvasCoordinates(e.nativeEvent, canvas);
    startDrawing(point);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const point = getCanvasCoordinates(e.nativeEvent, canvas);
    draw(point);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas || e.touches.length === 0) return;
    const point = getCanvasCoordinates(e.touches[0], canvas);
    startDrawing(point);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas || e.touches.length === 0) return;
    const point = getCanvasCoordinates(e.touches[0], canvas);
    draw(point);
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    clearCanvas(canvas, ctx);
    setStrokes([]);
    setLatex('');
    onClear?.();
  };

  // Render LaTeX
  useEffect(() => {
    if (mathRef.current && latex && !error) {
      try {
        katex.render(latex, mathRef.current, {
          displayMode: true,
          throwOnError: false,
          trust: true,
          strict: false,
        });
      } catch (err) {
        console.error("KaTeX rendering error:", err);
      }
    }
  }, [latex, error]);

  return (
    <div className="flex space-x-4">
      <div className="flex-1">
        <div className="w-full h-full relative">
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
          
          {strokes.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center">
                <div className="text-6xl mb-4">✏️</div>
                <p className="text-gray-400 text-lg">Write your math equation here</p>
                <p className="text-gray-500 text-sm mt-2">Use mouse or touch to draw</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="w-1/2 flex flex-col">
        <div className="bg-gray-900 p-4 rounded-lg flex-1">
          <h3 className="text-lg font-semibold text-white mb-4">LaTeX Output</h3>
          
          {isRecognizing ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : error ? (
            <div className="text-red-400 p-4 bg-red-900/20 rounded">
              {error}
            </div>
          ) : latex ? (
            <>
              <div ref={mathRef} className="mb-4 bg-black/50 p-4 rounded overflow-x-auto"></div>
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



