import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Point, Stroke } from '../types';
import { getCanvasCoordinates, drawStroke, clearCanvas, redrawAllStrokes } from '../utils/canvas';

interface DrawingCanvasProps {
  onStrokesChange: (strokes: Stroke[]) => void;
  onClear: () => void;
  strokes: Stroke[];
}

export const DrawingCanvas: React.FC<DrawingCanvasProps> = ({
  onStrokesChange,
  onClear,
  strokes
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentStroke, setCurrentStroke] = useState<Point[]>([]);

  const drawGrid = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const gridSize = 20;
    ctx.strokeStyle = '#1DA1F2'; // Electric blue color
    ctx.lineWidth = 0.5;
    ctx.globalAlpha = 0.2;
    
    // Draw vertical lines
    for (let x = 0; x <= width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    
    // Draw horizontal lines
    for (let y = 0; y <= height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    
    ctx.globalAlpha = 1;
  }, []);

  const initializeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = 800;
    canvas.height = 400;

    // Set canvas style for crisp lines
    ctx.imageSmoothingEnabled = false;
    
    // Draw black background
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw electric blue grid
    drawGrid(ctx, canvas.width, canvas.height);
    
    // Redraw existing strokes
    redrawAllStrokes(ctx, strokes);
  }, [strokes, drawGrid]);

  useEffect(() => {
    initializeCanvas();
  }, [initializeCanvas]);

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
    if (newStroke.length > 1) {
      const tempStroke: Stroke = {
        points: newStroke,
        timestamp: Date.now()
      };
      
      // Clear and redraw all strokes plus current
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
    onStrokesChange(updatedStrokes);
    
    setIsDrawing(false);
    setCurrentStroke([]);
  }, [isDrawing, currentStroke, strokes, onStrokesChange]);

  // Mouse events
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

  const handleMouseUp = () => {
    endDrawing();
  };

  // Touch events
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

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    endDrawing();
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    clearCanvas(canvas, ctx);
    onClear();
  };

  return (
    <div className="w-full h-full relative">
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-crosshair touch-none"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
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
  );
};