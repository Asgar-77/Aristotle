import React, { useEffect, useRef } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

interface MathRendererProps {
  latex: string;
  className?: string;
}

export const MathRenderer: React.FC<MathRendererProps> = ({ latex, className = '' }) => {
  const mathRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mathRef.current || !latex) return;

    try {
      katex.render(latex, mathRef.current, {
        displayMode: true,
        throwOnError: false,
        errorColor: '#ef4444',
        fleqn: false,
      });
    } catch (error) {
      console.error('KaTeX rendering error:', error);
      if (mathRef.current) {
        mathRef.current.textContent = `Error rendering: ${latex}`;
        mathRef.current.className = 'text-red-500';
      }
    }
  }, [latex]);

  if (!latex) {
    return (
      <div className={`text-slate-400 text-center py-8 ${className}`}>
        No equation detected yet
      </div>
    );
  }

  return (
    <div className={`math-container ${className}`}>
      <div ref={mathRef} className="text-xl" />
    </div>
  );
};