export interface Point {
  x: number;
  y: number;
}

export interface TimestampedPoint {
  x: number;
  y: number;
  timestamp: number;
  pressure?: number;
  pointerType?: string;
}

export interface Stroke {
  points: Point[];
  timestamp: number;
}

export interface RecognitionResult {
  latex: string;
  plainText: string;
  confidence: number;
}

export interface MathStep {
  id: number;
  equation: string;
  latex: string;
  isCorrect: boolean;
  feedback?: string;
  timestamp: number;
}

export interface StepByStepResult {
  steps: MathStep[];
  finalAnswer?: string;
  overallCorrect: boolean;
}

export interface DrawingData {
  strokes: Stroke[];
  width: number;
  height: number;
}

export interface Topic {
  id: string;
  name: string;
  icon: any;
  color: string;
  isExpanded: boolean;
  children?: Topic[];
}

export interface Board {
  id: string;
  title: string;
  thumbnail: string;
  date: string;
  topic: string;
  strokes: Stroke[];
  result?: RecognitionResult;
  steps?: MathStep[];
}

export interface AppState {
  currentView: 'landing' | 'dashboard' | 'notebook' | 'home' | 'topic' | 'whiteboard';
  selectedTopic?: string;
  selectedBoard?: Board;
  searchQuery: string;
}

export interface NotebookStep {
  id: number;
  content: string;
  latex: string;
  status: 'current' | 'correct' | 'incorrect' | 'neutral' | 'checking';
  feedback?: string;
  hint?: string;
  timestamp: number;
  strokes: Stroke[];
  isChecked?: boolean;
  validationResult?: {
    isCorrect: boolean;
    feedback: string;
    explanation?: string;
    confidence: number;
  };
}

export interface NotebookState {
  steps: NotebookStep[];
  currentStep: number;
  showFeedback: boolean;
  showHints: boolean;
}