import React from 'react';
import { Copy, Download, CheckCircle } from 'lucide-react';
import { RecognitionResult } from '../types';
import { MathRenderer } from './MathRenderer';

interface OutputPanelProps {
  result: RecognitionResult | null;
  isRecognizing: boolean;
}

export const OutputPanel: React.FC<OutputPanelProps> = ({ result, isRecognizing }) => {
  const [copiedLaTeX, setCopiedLaTeX] = React.useState(false);
  const [copiedText, setCopiedText] = React.useState(false);

  const copyToClipboard = async (text: string, type: 'latex' | 'text') => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'latex') {
        setCopiedLaTeX(true);
        setTimeout(() => setCopiedLaTeX(false), 2000);
      } else {
        setCopiedText(true);
        setTimeout(() => setCopiedText(false), 2000);
      }
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  const downloadAsText = () => {
    if (!result) return;

    const content = `LaTeX: ${result.latex}\nPlain Text: ${result.plainText}\nConfidence: ${(result.confidence * 100).toFixed(1)}%`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'math-equation.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full bg-transparent">
      {/* Recognition Results - Dark Theme */}
      
      {isRecognizing && (
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-purple-500 border-t-transparent"></div>
            <span className="text-gray-300">Recognizing handwriting...</span>
          </div>
        </div>
      )}

      {!isRecognizing && !result && (
        <div className="text-center py-12 text-gray-400">
          <div>
            <p className="mb-2">Draw a math equation above to see recognition results</p>
            <p className="text-xs text-gray-500">
              Note: This demo uses Mathpix API for handwriting recognition
            </p>
          </div>
        </div>
      )}

      {!isRecognizing && result && (
        <div className="space-y-6">
          {/* Confidence Score */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-300">Confidence Score:</span>
            <div className="flex items-center space-x-2">
              <div className="w-24 h-2 bg-gray-700 rounded-full">
                <div 
                  className={`h-2 rounded-full transition-all duration-500 ${
                    result.confidence > 0.8 ? 'bg-green-500' : 
                    result.confidence > 0.6 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${result.confidence * 100}%` }}
                />
              </div>
              <span className="text-sm font-medium text-white">{(result.confidence * 100).toFixed(1)}%</span>
            </div>
          </div>

          {/* Rendered Math */}
          <div className="border border-gray-600 rounded-lg p-4 bg-gray-900">
            <h3 className="text-sm font-medium text-gray-300 mb-2">Rendered Equation:</h3>
            <MathRenderer latex={result.latex} className="text-center py-4" />
          </div>

          {/* LaTeX Code */}
          <div className="border border-gray-600 rounded-lg p-4 bg-gray-900">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-300">LaTeX Code:</h3>
              <button
                onClick={() => copyToClipboard(result.latex, 'latex')}
                className="flex items-center space-x-1 text-sm text-purple-400 hover:text-purple-300 transition-colors"
              >
                {copiedLaTeX ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copiedLaTeX ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>
            <code className="block bg-gray-800 p-3 rounded text-sm font-mono text-gray-200 break-all">
              {result.latex}
            </code>
          </div>

          {/* Plain Text */}
          <div className="border border-gray-600 rounded-lg p-4 bg-gray-900">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-300">Plain Text:</h3>
              <button
                onClick={() => copyToClipboard(result.plainText, 'text')}
                className="flex items-center space-x-1 text-sm text-purple-400 hover:text-purple-300 transition-colors"
              >
                {copiedText ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copiedText ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>
            <p className="text-gray-200 bg-gray-800 p-3 rounded">
              {result.plainText}
            </p>
          </div>

          {/* Download Button */}
          <div className="flex justify-center">
            <button
              onClick={downloadAsText}
              className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-lg font-medium transition-all shadow-lg"
            >
              <Download className="w-4 h-4" />
              <span>Download as Text</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};