import * as fabric from 'fabric';
import { Point, Stroke } from '../types';

export class FabricCanvasManager {
  private canvas: fabric.Canvas | null = null;
  private isDrawing = false;
  private currentPath: fabric.Path | null = null;
  private strokeColor = '#1DA1F2';
  private strokeWidth = 3;

  constructor(canvasElement: HTMLCanvasElement) {
    this.initializeCanvas(canvasElement);
  }

  private initializeCanvas(canvasElement: HTMLCanvasElement) {
    this.canvas = new fabric.Canvas(canvasElement, {
      width: canvasElement.offsetWidth,
      height: 128, // Increased height for more drawing space
      backgroundColor: '#000000',
      selection: false, // Disable selection for drawing mode
      preserveObjectStacking: true,
    });

    this.setupDrawingMode();
    // Grid lines will be drawn via CSS instead
  }

  private setupDrawingMode() {
    if (!this.canvas) return;

    this.canvas.isDrawingMode = true;
    this.canvas.freeDrawingBrush = new fabric.PencilBrush(this.canvas);
    this.canvas.freeDrawingBrush.color = this.strokeColor;
    this.canvas.freeDrawingBrush.width = this.strokeWidth;

    // Handle drawing start
    this.canvas.on('path:created', (e) => {
      const path = e.path;
      if (path) {
        path.set({
          stroke: this.strokeColor,
          strokeWidth: this.strokeWidth,
          strokeLineCap: 'round',
          strokeLineJoin: 'round',
          selectable: false,
          evented: false,
        });
        
        // No need to manage grid lines anymore
      }
    });
  }


  public setStrokeColor(color: string) {
    this.strokeColor = color;
    if (this.canvas && this.canvas.freeDrawingBrush) {
      this.canvas.freeDrawingBrush.color = color;
    }
  }

  public setStrokeWidth(width: number) {
    this.strokeWidth = width;
    if (this.canvas && this.canvas.freeDrawingBrush) {
      this.canvas.freeDrawingBrush.width = width;
    }
  }

  public clear() {
    if (!this.canvas) return;
    
    // Clear all objects
    this.canvas.clear();
    
    this.canvas.renderAll();
  }

  public getCanvas() {
    return this.canvas;
  }

  public exportAsDataURL(): string {
    if (!this.canvas) return '';
    return this.canvas.toDataURL({
      format: 'png',
      quality: 1,
      multiplier: 2, // High DPI
    });
  }

  public loadFromStrokes(strokes: Stroke[]) {
    if (!this.canvas) return;

    // DO NOT CLEAR - ADD TO EXISTING CONTENT
    // this.clear(); // REMOVED - this was causing handwriting to disappear

    strokes.forEach(stroke => {
      if (stroke.points.length < 2) return;

      const pathData = this.pointsToPathData(stroke.points);
      const path = new fabric.Path(pathData, {
        stroke: this.strokeColor,
        strokeWidth: this.strokeWidth,
        strokeLineCap: 'round',
        strokeLineJoin: 'round',
        fill: '',
        selectable: false,
        evented: false,
      });

      this.canvas!.add(path);
    });

    this.canvas.renderAll();
  }

  private pointsToPathData(points: Point[]): string {
    if (points.length < 2) return '';

    let pathData = `M ${points[0].x} ${points[0].y}`;
    
    for (let i = 1; i < points.length; i++) {
      pathData += ` L ${points[i].x} ${points[i].y}`;
    }

    return pathData;
  }

  public getStrokes(): Stroke[] {
    if (!this.canvas) return [];

    const strokes: Stroke[] = [];
    const objects = this.canvas.getObjects();

    objects.forEach(obj => {
      if (obj.type === 'path') {
        const path = obj as fabric.Path;
        const pathData = path.path;
        
        if (pathData && pathData.length > 0) {
          const points = this.pathDataToPoints(pathData);
          if (points.length > 0) {
            strokes.push({
              points,
              timestamp: Date.now(),
            });
          }
        }
      }
    });

    return strokes;
  }

  private pathDataToPoints(pathData: (string | number)[][]): Point[] {
    const points: Point[] = [];
    
    for (let i = 0; i < pathData.length; i++) {
      const command = pathData[i];
      
      if (Array.isArray(command) && command.length >= 3) {
        const [cmd, x, y] = command;
        
        if (cmd === 'M' || cmd === 'L') {
          points.push({ x: x as number, y: y as number });
        }
      }
    }

    return points;
  }

  public destroy() {
    if (this.canvas) {
      this.canvas.dispose();
      this.canvas = null;
    }
  }

  public resize(width: number, height: number) {
    if (this.canvas) {
      this.canvas.setDimensions({ width, height });
      this.canvas.renderAll();
    }
  }
}

// Utility functions for backward compatibility
export const getCanvasCoordinates = (
  event: MouseEvent | Touch,
  canvas: HTMLCanvasElement
): Point => {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  
  return {
    x: (event.clientX - rect.left) * scaleX,
    y: (event.clientY - rect.top) * scaleY
  };
};

export const drawStroke = (
  ctx: CanvasRenderingContext2D,
  stroke: Stroke,
  color: string = '#1DA1F2',
  lineWidth: number = 3
): void => {
  if (stroke.points.length < 2) return;

  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  ctx.beginPath();
  ctx.moveTo(stroke.points[0].x, stroke.points[0].y);

  for (let i = 1; i < stroke.points.length; i++) {
    ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
  }

  ctx.stroke();
};

export const clearCanvas = (
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D
): void => {
  // Clear the canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Draw black background
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Draw electric blue grid
  const gridSize = 20;
  ctx.strokeStyle = '#1DA1F2';
  ctx.lineWidth = 0.5;
  ctx.globalAlpha = 0.2;
  
  // Draw vertical lines
  for (let x = 0; x <= canvas.width; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }
  
  // Draw horizontal lines
  for (let y = 0; y <= canvas.height; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }
  
  ctx.globalAlpha = 1;
};

export const redrawAllStrokes = (
  ctx: CanvasRenderingContext2D,
  strokes: Stroke[]
): void => {
  strokes.forEach(stroke => drawStroke(ctx, stroke));
};
