import { Point, Stroke } from '../types';

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
  color: string = '#1DA1F2', // Electric blue color for black background
  lineWidth: number = 3 // Slightly thicker for better visibility
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
  ctx.strokeStyle = '#1DA1F2'; // Electric blue color
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