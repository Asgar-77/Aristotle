import React from 'react';
import { DrawingCanvas } from './DrawingCanvas';
import { OutputPanel } from './OutputPanel';
import { StepByStepDisplay } from './StepByStepDisplay';
import { RecognitionResult, Stroke, MathStep } from '../types';
import { CheckCircle, XCircle, AlertCircle, Zap } from 'lucide-react';

interface WhiteboardViewProps {
  strokes: Stroke[];
  onStrokesChange: (strokes: Stroke[]) => void;
  result: RecognitionResult | null;
  isRecognizing: boolean;
  feedback: {
    type: 'correct' | 'incorrect' | 'partial' | 'neutral';
    message: string;
  } | null;
  stepByStepResult: {
    steps: MathStep[];
    finalAnswer?: string;
    overallCorrect: boolean;
  } | null;
  onClear: () => void;
  strokeColor: string;
  strokeWidth: number;
  onColorChange: (color: string) => void;
  onWidthChange: (width: number) => void;
}

export const WhiteboardView: React.FC<WhiteboardViewProps> = ({
  strokes,
  onStrokesChange,
  result,
  isRecognizing,
  feedback,
  stepByStepResult,
  onClear,
  strokeColor,
  strokeWidth,
  onColorChange,
  onWidthChange
}) => {
  return (
    <div className="h-full flex">
      {/* Left Side - Drawing Canvas */}
      <div className="flex-1 bg-black relative">
        <DrawingCanvas
          strokes={strokes}
          onStrokesChange={onStrokesChange}
          onClear={onClear}
        />
        
        {/* Real-time Feedback Overlay */}
        {feedback && (
          <div className={`absolute top-4 left-4 right-4 p-4 rounded-lg border-l-4 ${
            feedback.type === 'correct' ? 'bg-green-900/20 border-green-500 text-green-300' :
            feedback.type === 'incorrect' ? 'bg-red-900/20 border-red-500 text-red-300' :
            feedback.type === 'partial' ? 'bg-yellow-900/20 border-yellow-500 text-yellow-300' :
            'bg-blue-900/20 border-blue-500 text-blue-300'
          }`}>
            <div className="flex items-center space-x-2">
              {feedback.type === 'correct' && <CheckCircle className="w-5 h-5" />}
              {feedback.type === 'incorrect' && <XCircle className="w-5 h-5" />}
              {feedback.type === 'partial' && <AlertCircle className="w-5 h-5" />}
              {feedback.type === 'neutral' && <Zap className="w-5 h-5" />}
              <span className="font-medium">{feedback.message}</span>
            </div>
          </div>
        )}
      </div>

      {/* Right Side - Recognition Results */}
      <div className="w-96 bg-gray-900 border-l border-gray-800 flex flex-col">
        {/* LaTeX Output */}
        <div className="p-6 border-b border-gray-800">
          <h2 className="text-lg font-semibold text-white flex items-center space-x-2 mb-4">
            <span>🧠</span>
            <span>Recognition</span>
            {isRecognizing && (
              <div className="flex items-center space-x-2 text-sm text-yellow-400">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-yellow-400 border-t-transparent"></div>
                <span>Recognizing...</span>
              </div>
            )}
          </h2>
          <OutputPanel result={result} isRecognizing={isRecognizing} />
        </div>

        {/* Step-by-Step Solution */}
        {stepByStepResult && (
          <div className="flex-1 p-6 overflow-y-auto">
            <StepByStepDisplay
              steps={stepByStepResult.steps}
              onStepClick={(step) => console.log('Step clicked:', step)}
            />
          </div>
        )}

        {/* Empty State */}
        {!result && !isRecognizing && (
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="text-center">
              <div className="text-4xl mb-4">✏️</div>
              <p className="text-gray-400 text-sm">
                Draw your math equation to see recognition results
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
