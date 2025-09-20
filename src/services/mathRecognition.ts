import { Stroke } from '../types';

interface MathpixResponse {
  text?: string;
  latex?: string;
  latex_styled?: string;
  confidence?: number;
  error?: string;
}

export class MathRecognitionService {
  private readonly APP_ID = 'aristotle_927f26_bb2bac';
  private readonly APP_KEY = 'e450411a0ccb86471c9920940dce21bd6d7b148bf5534407f989756e179781c6';

  async recognizeStrokes(strokes: Stroke[]): Promise<{ latex: string; confidence: number }> {
    try {
      // Transform strokes to Mathpix format
      const { xArrays, yArrays } = this.transformStrokes(strokes);

      const requestData = {
        strokes: {
          strokes: {
            x: xArrays,
            y: yArrays
          }
        }
      };

      // Make API request
      const response = await fetch('https://api.mathpix.com/v3/strokes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'app_id': this.APP_ID,
          'app_key': this.APP_KEY
        },
        body: JSON.stringify(requestData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Mathpix API error: ${errorData.error || response.statusText}`);
      }

      const data: MathpixResponse = await response.json();

      // Clean and format the LaTeX
      const latex = this.cleanLatex(data.latex || data.latex_styled || '');
      
      return {
        latex,
        confidence: data.confidence || 0.9
      };
    } catch (error) {
      console.error('Math recognition error:', error);
      throw error;
    }
  }

  private transformStrokes(strokes: Stroke[]): { xArrays: number[][]; yArrays: number[][] } {
    const xArrays: number[][] = [];
    const yArrays: number[][] = [];

    strokes.forEach(stroke => {
      const xPoints = stroke.points.map(point => point.x);
      const yPoints = stroke.points.map(point => point.y);
      xArrays.push(xPoints);
      yArrays.push(yPoints);
    });

    return { xArrays, yArrays };
  }

  private cleanLatex(latex: string): string {
    return latex
      // Remove delimiters
      .replace(/^\\\(|\\\)$|\$\$|\$/g, '')
      // Clean up text commands
      .replace(/\\text\s*\{\s*([^}]+)\s*\}/g, '$1')
      // Fix fractions
      .replace(/\\frac\s*{\s*([^}]+)\s*}\s*{\s*([^}]+)\s*}/g, '\\frac{$1}{$2}')
      // Fix operators
      .replace(/×/g, '\\times')
      .replace(/÷/g, '\\div')
      .replace(/≠/g, '\\neq')
      .replace(/≤/g, '\\leq')
      .replace(/≥/g, '\\geq')
      // Normalize whitespace
      .replace(/\s+/g, ' ')
      .trim();
  }
}

export const mathRecognition = new MathRecognitionService();

