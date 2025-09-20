import React from 'react';
import { MathStep } from '../types';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface StepByStepDisplayProps {
  steps: MathStep[];
  onStepClick?: (step: MathStep) => void;
}

export const StepByStepDisplay: React.FC<StepByStepDisplayProps> = ({
  steps,
  onStepClick
}) => {
  const getStepIcon = (step: MathStep) => {
    if (step.isCorrect) {
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    } else if (step.feedback) {
      return <XCircle className="w-5 h-5 text-red-500" />;
    } else {
      return <AlertCircle className="w-5 h-5 text-yellow-500" />;
    }
  };

  const getStepColor = (step: MathStep) => {
    if (step.isCorrect) {
      return 'border-green-500 bg-green-500/10';
    } else if (step.feedback) {
      return 'border-red-500 bg-red-500/10';
    } else {
      return 'border-yellow-500 bg-yellow-500/10';
    }
  };

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
        <span className="mr-2">📝</span>
        Step-by-Step Solution
      </h3>
      
      {steps.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <div className="text-4xl mb-2">🧮</div>
          <p>Draw your equation to see step-by-step solution</p>
        </div>
      ) : (
        <div className="space-y-2">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className={`p-3 rounded-lg border-2 transition-all cursor-pointer hover:scale-105 ${getStepColor(step)}`}
              onClick={() => onStepClick?.(step)}
            >
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    step.isCorrect ? 'bg-green-500 text-white' : 
                    step.feedback ? 'bg-red-500 text-white' : 
                    'bg-yellow-500 text-white'
                  }`}>
                    {step.id}
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    {getStepIcon(step)}
                    <span className="text-white font-mono text-lg">
                      {step.equation}
                    </span>
                  </div>
                  
                  <div className="text-sm text-gray-300 font-mono">
                    LaTeX: {step.latex}
                  </div>
                  
                  {step.feedback && (
                    <div className="mt-2 text-sm text-red-300 bg-red-900/20 p-2 rounded">
                      {step.feedback}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};









