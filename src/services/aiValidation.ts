import { Groq } from 'groq-sdk';

const groq = new Groq({
  apiKey: import.meta.env.VITE_GROQ_API_KEY || '',
  dangerouslyAllowBrowser: true
});

export interface StepValidationResult {
  isCorrect: boolean;
  feedback: string;
  explanation?: string;
  confidence: number;
}

export class AIValidationService {
  private static instance: AIValidationService;
  
  public static getInstance(): AIValidationService {
    if (!AIValidationService.instance) {
      AIValidationService.instance = new AIValidationService();
    }
    return AIValidationService.instance;
  }

  async validateMathStep(latex: string, context?: string): Promise<StepValidationResult> {
    try {
      console.log('🔍 AI Validation - Starting validation for:', latex);
      console.log('🔑 API Key from env:', import.meta.env.VITE_GROQ_API_KEY);
      console.log('🔑 API Key available:', !!import.meta.env.VITE_GROQ_API_KEY);
      console.log('🔧 Groq instance:', groq);
      
      const prompt = this.buildValidationPrompt(latex, context);
      console.log('📝 AI Validation - Prompt created, sending to Groq...');
      console.log('📝 Full prompt:', prompt);
      
      const chatCompletion = await groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content: "You are a math tutor that validates mathematical steps. Analyze the given mathematical step and determine if it's correct in the context of the problem. Respond with ONLY valid JSON format. Do not include any text before or after the JSON. The JSON must contain: isCorrect (boolean), feedback (string with emoji), explanation (optional string), confidence (number 0-1)."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        model: "openai/gpt-oss-20b",
        temperature: 0.1,
        max_completion_tokens: 300,
        top_p: 0.9,
        stream: false
      });

      const response = chatCompletion.choices[0]?.message?.content || '';
      console.log('✅ AI Validation - Received response:', response);
      return this.parseValidationResponse(response);
    } catch (error) {
      console.error('❌ AI validation error:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        apiKeyPresent: !!import.meta.env.VITE_GROQ_API_KEY
      });
      
      // Fallback validation for basic cases
      if (latex.trim()) {
        return this.fallbackValidation(latex);
      }
      
      return {
        isCorrect: false,
        feedback: 'Unable to validate step. Please check your internet connection and try again.',
        confidence: 0
      };
    }
  }

  private fallbackValidation(latex: string): StepValidationResult {
    console.log('🛠️ Using enhanced fallback validation for:', latex);
    const trimmed = latex.trim();
    
    // Check for common mistakes first
    const mistakeCheck = this.checkForCommonMistakes(trimmed);
    if (mistakeCheck) {
      return mistakeCheck;
    }
    
    // Enhanced validation patterns
    const hasEquals = trimmed.includes('=');
    const hasNumbers = /\d/.test(trimmed);
    const hasVariables = /[a-zA-Z]/.test(trimmed);
    const hasBasicOperations = /[+\-*/^()]/.test(trimmed);
    const hasFractions = /\\frac|\//.test(trimmed);
    const hasSquareRoot = /\\sqrt|√/.test(trimmed);
    
    // Specific step patterns for common algebra problems
    if (this.isValidAlgebraStep(trimmed)) {
      return this.getStepSpecificFeedback(trimmed);
    }
    
    // Valid equation with equals sign
    if (hasEquals && (hasNumbers || hasVariables)) {
      return {
        isCorrect: true,
        feedback: '✅ Valid equation!',
        confidence: 0.9
      };
    }
    
    // Valid mathematical expression
    if ((hasNumbers || hasVariables || hasFractions || hasSquareRoot) && trimmed.length > 0) {
      return {
        isCorrect: true,
        feedback: '✅ Valid expression!',
        confidence: 0.85
      };
    }
    
    // Basic operations without clear context
    if (hasBasicOperations || hasNumbers || hasVariables) {
      return {
        isCorrect: true,
        feedback: '👍 Good step!',
        confidence: 0.75
      };
    }
    
    return {
      isCorrect: false,
      feedback: '🤔 Write a complete equation.',
      confidence: 0.3
    };
  }

  private checkForCommonMistakes(step: string): StepValidationResult | null {
    const trimmed = step.trim();
    
    // Check for common sign errors when moving terms
    // Wrong: 2x + 3 = 11 → 2x = 11 + 3 (should be 11 - 3)
    if (/^\d*x?\s*=\s*\d+\s*\+\s*\d+$/.test(trimmed)) {
      // This might be wrong if it should be subtraction
      const match = trimmed.match(/^(\d*)x?\s*=\s*(\d+)\s*\+\s*(\d+)$/);
      if (match) {
        const [, , num1, num2] = match;
        return {
          isCorrect: false,
          feedback: `🤔 Check signs: when moving ${num2}, it should become -${num2}`,
          explanation: `When moving a positive term across the equals sign, it becomes negative.`,
          confidence: 0.85
        };
      }
    }
    
    // Check for obvious arithmetic errors
    const arithmeticMatch = trimmed.match(/^(\d+)\s*([+\-])\s*(\d+)\s*=\s*(\d+)$/);
    if (arithmeticMatch) {
      const [, num1, op, num2, result] = arithmeticMatch;
      const expected = op === '+' ? parseInt(num1) + parseInt(num2) : parseInt(num1) - parseInt(num2);
      if (expected !== parseInt(result)) {
        return {
          isCorrect: false,
          feedback: `❌ Arithmetic error: ${num1} ${op} ${num2} = ${expected}, not ${result}`,
          confidence: 0.95
        };
      }
    }
    
    return null; // No mistakes found
  }

  private isValidAlgebraStep(step: string): boolean {
    // Enhanced patterns for common algebra steps
    const algebraPatterns = [
      /^\d*x?\s*=\s*\d+$/, // Like "x = 4", "2x = 8"
      /^\d*x?\s*[+\-]\s*\d+\s*=\s*\d+$/, // Like "2x + 3 = 11", "x - 5 = 2"
      /^\d+\s*[+\-]\s*\d+\s*=?\s*\d*$/, // Like "11 - 3", "11 - 3 = 8"
      /^\d+\s*\/\s*\d+\s*=?\s*\d*$/, // Like "8/2", "8/2 = 4"
      /^\d+\(\d+\)\s*[+\-]\s*\d+\s*=\s*\d+$/, // Like "2(4) + 3 = 11"
      /^\\frac\{\d+\}\{\d+\}/, // LaTeX fractions
      /^\d+\s*=\s*\d+$/, // Simple equality check like "11 = 11"
    ];
    
    return algebraPatterns.some(pattern => pattern.test(step.replace(/\s+/g, ' ').trim()));
  }

  private getStepSpecificFeedback(step: string): StepValidationResult {
    const trimmed = step.trim();
    
    // Enhanced specific feedback with more variety and encouragement
    if (/^x\s*=\s*\d+$/.test(trimmed)) {
      const encouragements = [
        '🎯 Perfect! You found the value of x!',
        '🌟 Excellent! You solved for x!',
        '🚀 Great work! You isolated the variable!',
        '💎 Outstanding! You found the solution!'
      ];
      return {
        isCorrect: true,
        feedback: encouragements[Math.floor(Math.random() * encouragements.length)],
        confidence: 0.95
      };
    }
    
    if (/^\d+x\s*=\s*\d+$/.test(trimmed)) {
      const encouragements = [
        '✅ Correct step!',
        '👍 Nice work!',
        '🎉 Great progress!',
        '💪 You\'re doing great!'
      ];
      return {
        isCorrect: true,
        feedback: encouragements[Math.floor(Math.random() * encouragements.length)],
        confidence: 0.9
      };
    }
    
    // Pattern for moving terms (like 2x + 3 = 11 → 2x = 11 - 3)
    if (/^\d*x?\s*=\s*\d+\s*[+\-]\s*\d+$/.test(trimmed)) {
      const encouragements = [
        '👍 Good move!',
        '🎯 Smart algebraic manipulation!',
        '✨ Nice work isolating the variable!',
        '🔥 Great step!'
      ];
      return {
        isCorrect: true,
        feedback: encouragements[Math.floor(Math.random() * encouragements.length)],
        confidence: 0.9
      };
    }
    
    // Arithmetic calculations
    if (/^\d+\s*[+\-]\s*\d+\s*=\s*\d+$/.test(trimmed)) {
      // Verify the arithmetic is correct
      const match = trimmed.match(/^(\d+)\s*([+\-])\s*(\d+)\s*=\s*(\d+)$/);
      if (match) {
        const [, num1, op, num2, result] = match;
        const expected = op === '+' ? parseInt(num1) + parseInt(num2) : parseInt(num1) - parseInt(num2);
        if (expected === parseInt(result)) {
          const encouragements = [
            '🧮 Correct!',
            '🎯 Perfect arithmetic!',
            '⭐ Great calculation!',
            '💯 Excellent math!'
          ];
          return {
            isCorrect: true,
            feedback: encouragements[Math.floor(Math.random() * encouragements.length)],
            confidence: 0.95
          };
        } else {
          return {
            isCorrect: false,
            feedback: `🤔 Check: ${num1} ${op} ${num2} = ${expected}`,
            confidence: 0.9
          };
        }
      }
    }
    
    // Division steps
    if (/^\d+\s*\/\s*\d+/.test(trimmed) || /\\frac/.test(trimmed)) {
      const encouragements = [
        '🔢 Good!',
        '📊 Nice division!',
        '🎯 Great work!',
        '✨ Excellent!'
      ];
      return {
        isCorrect: true,
        feedback: encouragements[Math.floor(Math.random() * encouragements.length)],
        confidence: 0.85
      };
    }
    
    // Verification steps (like 11 = 11)
    if (/^(\d+)\s*=\s*\1$/.test(trimmed)) {
      const encouragements = [
        '✓ Perfect verification! Your check confirms the solution.',
        '🎉 Excellent! You verified your answer correctly!',
        '🌟 Outstanding! Your solution checks out!',
        '💎 Perfect! You double-checked your work!'
      ];
      return {
        isCorrect: true,
        feedback: encouragements[Math.floor(Math.random() * encouragements.length)],
        confidence: 0.95
      };
    }
    
    // Substitution checks (like 2(4) + 3 = 11)
    if (/^\d+\(\d+\)\s*[+\-]\s*\d+\s*=\s*\d+$/.test(trimmed)) {
      const encouragements = [
        '🔍 Excellent substitution check! You verified your answer.',
        '🎯 Perfect! You checked your solution!',
        '⭐ Great verification! Your answer is correct!',
        '🚀 Outstanding! You confirmed your solution!'
      ];
      return {
        isCorrect: true,
        feedback: encouragements[Math.floor(Math.random() * encouragements.length)],
        confidence: 0.9
      };
    }
    
    const encouragements = [
      '✅ Good mathematical step! Keep going.',
      '👍 Nice work! Continue solving.',
      '🎯 Great progress! Keep it up.',
      '💪 You\'re doing well! Don\'t stop now.',
      '✨ Excellent! You\'re on the right track.',
      '🌟 Great job! Keep solving step by step.'
    ];
    
    return {
      isCorrect: true,
      feedback: encouragements[Math.floor(Math.random() * encouragements.length)],
      confidence: 0.8
    };
  }

  private isCommonAlgebraStep(step: string): boolean {
    // Common patterns that are usually correct
    const commonPatterns = [
      /^\d+x?\s*=\s*\d+$/, // Like "2x = 8" or "x = 4"
      /^\d+x?\s*[+\-]\s*\d+\s*=\s*\d+$/, // Like "2x + 3 = 11"
      /^x\s*=\s*\d+\/?\d*$/, // Like "x = 4" or "x = 8/2"
      /^\d+\s*[+\-]\s*\d+\s*=?\s*\d*$/, // Like "11 - 3" or "11 - 3 = 8"
      /^\d+x?\s*\/?\s*\d+\s*=?\s*\d*$/, // Like "8/2" or "8/2 = 4"
    ];
    
    return commonPatterns.some(pattern => pattern.test(step.replace(/\s+/g, ' ').trim()));
  }

  private buildValidationPrompt(latex: string, context?: string): string {
    let prompt = `You are a math tutor validating a student's step-by-step solution. 

ORIGINAL PROBLEM: ${context || 'Not provided'}
STUDENT'S CURRENT STEP: ${latex}

Validate this mathematical step carefully:

1. Check if the step follows correct mathematical rules
2. Verify arithmetic calculations are accurate  
3. Ensure algebraic manipulations are valid
4. Consider if this step logically follows from the previous work

VALIDATION RULES:
✓ CORRECT examples:
- Moving terms across equals: 2x + 3 = 11 → 2x = 11 - 3
- Combining like terms: 11 - 3 = 8
- Division: 2x = 8 → x = 4  
- Substitution check: 2(4) + 3 = 11

✗ INCORRECT examples:
- Wrong signs: 2x + 3 = 11 → 2x = 11 + 3
- Bad arithmetic: 11 - 3 = 7
- Invalid operations: 2x = 8 → x = 8

Respond with ONLY this JSON format:
{
  "isCorrect": true/false,
  "feedback": "Brief, encouraging feedback about the step",
  "explanation": "If wrong, explain the correct approach",
  "confidence": 0.0-1.0
}

Be encouraging but mathematically accurate. JSON only:`;

    return prompt;
  }

  private parseValidationResponse(response: string): StepValidationResult {
    try {
      // Clean the response first
      let cleanedResponse = response.trim();
      
      // Remove any markdown code blocks
      cleanedResponse = cleanedResponse.replace(/```json\s*|\s*```/g, '');
      
      // Try to extract JSON from the response
      const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        let jsonString = jsonMatch[0];
        
        // Fix common JSON issues
        jsonString = jsonString
          .replace(/\\"/g, '"')  // Fix escaped quotes
          .replace(/\\n/g, '\\n')  // Fix escaped newlines
          .replace(/\\t/g, '\\t')  // Fix escaped tabs
          .replace(/\\r/g, '\\r'); // Fix escaped carriage returns
        
        const parsed = JSON.parse(jsonString);
        
        // Clean and format the feedback
        let feedback = parsed.feedback || 'No feedback provided';
        feedback = this.cleanFeedback(feedback);
        
        let explanation = parsed.explanation;
        if (explanation) {
          explanation = this.cleanFeedback(explanation);
        }
        
        return {
          isCorrect: Boolean(parsed.isCorrect),
          feedback: feedback,
          explanation: explanation,
          confidence: Math.max(0, Math.min(1, Number(parsed.confidence) || 0.5))
        };
      }
    } catch (error) {
      console.error('Failed to parse AI response:', error);
    }

    // Fallback parsing - clean the response
    const cleanedResponse = this.cleanFeedback(response);
    const isCorrect = cleanedResponse.toLowerCase().includes('correct') || 
                     cleanedResponse.toLowerCase().includes('valid') ||
                     cleanedResponse.toLowerCase().includes('true');
    
    return {
      isCorrect,
      feedback: cleanedResponse.substring(0, 200) + (cleanedResponse.length > 200 ? '...' : ''),
      confidence: isCorrect ? 0.8 : 0.3
    };
  }

  private cleanFeedback(text: string): string {
    if (!text) return '';
    
    // Remove JSON artifacts
    let cleaned = text
      .replace(/^[{\[]/, '') // Remove leading { or [
      .replace(/[}\]]$/, '') // Remove trailing } or ]
      .replace(/^"|"$/g, '') // Remove surrounding quotes
      .replace(/\\"/g, '"')  // Fix escaped quotes
      .replace(/\\n/g, '\n') // Fix escaped newlines
      .replace(/\\t/g, '\t') // Fix escaped tabs
      .replace(/\\r/g, '\r') // Fix escaped carriage returns
      .trim();
    
    // Remove common JSON field names and patterns
    cleaned = cleaned
      .replace(/^"feedback":\s*"?/i, '')
      .replace(/^"explanation":\s*"?/i, '')
      .replace(/^"isCorrect":\s*"?/i, '')
      .replace(/^"confidence":\s*"?/i, '')
      .replace(/^"score":\s*"?/i, '')
      .replace(/^"suggestions":\s*"?/i, '')
      .replace(/^"feedback"\s*:\s*"?/i, '')
      .replace(/^"explanation"\s*:\s*"?/i, '')
      .replace(/^"isCorrect"\s*:\s*"?/i, '')
      .replace(/^"confidence"\s*:\s*"?/i, '')
      .replace(/^"score"\s*:\s*"?/i, '')
      .replace(/^"suggestions"\s*:\s*"?/i, '')
      .replace(/^score":\s*"?/i, '') // Handle malformed JSON like "score":90
      .replace(/^feedback":\s*"?/i, '') // Handle malformed JSON like "feedback":"text
      .replace(/^suggestions":\s*"?/i, '') // Handle malformed JSON like "suggestions":["text
      .replace(/^isCorrect":\s*"?/i, '') // Handle malformed JSON like "isCorrect":true
      .replace(/^confidence":\s*"?/i, '') // Handle malformed JSON like "confidence":0.9
      .replace(/^explanation":\s*"?/i, ''); // Handle malformed JSON like "explanation":"text
    
    // Remove trailing commas, quotes, and other JSON artifacts
    cleaned = cleaned
      .replace(/",?\s*$/, '')
      .replace(/",?\s*$/, '')
      .replace(/^,/, '')
      .replace(/,$/, '')
      .replace(/^"|"$/g, '');
    
    // Handle specific malformed patterns like "score":90,"feedback":"text
    if (cleaned.includes('"score":') || cleaned.includes('"feedback":') || cleaned.includes('"suggestions":')) {
      // Extract just the content after the field name
      const parts = cleaned.split(/["\s]*[a-zA-Z]+["\s]*:\s*/);
      if (parts.length > 1) {
        cleaned = parts[parts.length - 1];
      }
    }
    
    // Clean up any remaining JSON artifacts
    cleaned = cleaned
      .replace(/^[{\[]/, '')
      .replace(/[}\]]$/, '')
      .replace(/^"|"$/g, '')
      .trim();
    
    // Ensure it starts with an emoji or proper formatting
    if (cleaned && !cleaned.match(/^[🎯✅❌👍🤔💡🎉🌟💪✨🔥📚💯]/)) {
      // Add appropriate emoji based on content
      if (cleaned.toLowerCase().includes('correct') || cleaned.toLowerCase().includes('good') || cleaned.toLowerCase().includes('excellent') || cleaned.toLowerCase().includes('great')) {
        cleaned = '✅ ' + cleaned;
      } else if (cleaned.toLowerCase().includes('wrong') || cleaned.toLowerCase().includes('incorrect') || cleaned.toLowerCase().includes('error')) {
        cleaned = '❌ ' + cleaned;
      } else if (cleaned.toLowerCase().includes('hint') || cleaned.toLowerCase().includes('try') || cleaned.toLowerCase().includes('remember')) {
        cleaned = '💡 ' + cleaned;
      } else {
        cleaned = '📝 ' + cleaned;
      }
    }
    
    return cleaned.trim();
  }

  private cleanSuggestion(text: string): string {
    if (!text) return '';
    
    // Remove bullet points and formatting artifacts
    let cleaned = text
      .replace(/^[•\-\*]\s*/, '') // Remove bullet points
      .replace(/^📝\s*/, '') // Remove emoji prefixes
      .replace(/^e\.g\.\s*/, '') // Remove "e.g." prefixes
      .replace(/^Thus\s*/, '') // Remove "Thus" prefixes
      .replace(/^\(x = \d+\)\.?\s*/, '') // Remove solution examples
      .replace(/^Verify\s*/, '') // Remove "Verify" prefixes
      .replace(/^Include\s*/, '') // Remove "Include" prefixes
      .replace(/^Add\s*/, '') // Remove "Add" prefixes
      .trim();
    
    // Remove LaTeX formatting
    cleaned = cleaned
      .replace(/\\\(/g, '')
      .replace(/\\\)/g, '')
      .replace(/\\[a-zA-Z]+\{[^}]*\}/g, '')
      .replace(/\{[^}]*\}/g, '')
      .replace(/\\/g, '')
      .trim();
    
    // Add appropriate emoji based on content
    if (cleaned.toLowerCase().includes('verify') || cleaned.toLowerCase().includes('check') || cleaned.toLowerCase().includes('substitute')) {
      cleaned = '🔍 ' + cleaned;
    } else if (cleaned.toLowerCase().includes('add') || cleaned.toLowerCase().includes('include') || cleaned.toLowerCase().includes('step')) {
      cleaned = '📝 ' + cleaned;
    } else if (cleaned.toLowerCase().includes('explain') || cleaned.toLowerCase().includes('understanding') || cleaned.toLowerCase().includes('reinforce')) {
      cleaned = '📚 ' + cleaned;
    } else if (cleaned.toLowerCase().includes('practice') || cleaned.toLowerCase().includes('review') || cleaned.toLowerCase().includes('focus')) {
      cleaned = '🎯 ' + cleaned;
    } else {
      cleaned = '💡 ' + cleaned;
    }
    
    return cleaned.trim();
  }

  async getStepHint(latex: string, context?: string): Promise<string> {
    try {
      const prompt = `The student wrote this mathematical step: ${latex}\n\n${
        context ? `Context: ${context}\n\n` : ''
      }This step appears to be incorrect. Provide a helpful hint to guide them toward the correct approach. Keep it brief and encouraging.`;

      const chatCompletion = await groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content: "You are a helpful math tutor. Provide encouraging hints to help students learn from their mistakes. Start your response with an appropriate emoji (💡, 🤔, or 🎯) and keep the hint brief and encouraging."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        model: "openai/gpt-oss-20b",
        temperature: 0.7,
        max_completion_tokens: 200
      });

      const hint = chatCompletion.choices[0]?.message?.content || 'Try to review the algebraic rules and try again.';
      return this.cleanFeedback(hint);
    } catch (error) {
      console.error('AI hint error:', error);
      return 'Try to review the algebraic rules and try again.';
    }
  }

  async evaluateCompleteSolution(solutionData: {
    originalQuestion: string;
    steps: Array<{
      stepNumber: number;
      latex: string;
      isCorrect: boolean;
      feedback: string;
    }>;
  }): Promise<{
    score: number;
    feedback: string;
    suggestions: string[];
  }> {
    try {
      const prompt = `Evaluate this complete mathematical solution:

Original Problem: ${solutionData.originalQuestion}

Steps:
${solutionData.steps.map(step => 
  `Step ${step.stepNumber}: ${step.latex} (${step.isCorrect ? 'Correct' : 'Incorrect'})`
).join('\n')}

Please provide a comprehensive evaluation with:
1. Overall score (0-100)
2. Detailed feedback on the solution
3. Specific suggestions for improvement

Respond with a JSON object containing:
- "score": number (0-100)
- "feedback": string (detailed evaluation of the solution)
- "suggestions": array of strings (specific improvement suggestions)`;

      const chatCompletion = await groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content: "You are an expert math tutor evaluating a student's complete solution. Be encouraging but thorough in your assessment. Respond with ONLY valid JSON format. Do not include any text before or after the JSON. The JSON must contain: score (number 0-100), feedback (string with emoji), suggestions (array of strings with emojis)."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        model: "openai/gpt-oss-20b",
        temperature: 0.2,
        max_completion_tokens: 800,
        top_p: 0.9,
        stream: false
      });

      const response = chatCompletion.choices[0]?.message?.content || '';
      return this.parseSolutionEvaluation(response);
    } catch (error) {
      console.error('Solution evaluation error:', error);
      // Enhanced fallback evaluation
      return this.fallbackSolutionEvaluation(solutionData);
    }
  }

  private fallbackSolutionEvaluation(solutionData: {
    originalQuestion: string;
    steps: Array<{
      stepNumber: number;
      latex: string;
      isCorrect: boolean;
      feedback: string;
    }>;
  }): {
    score: number;
    feedback: string;
    suggestions: string[];
  } {
    const totalSteps = solutionData.steps.length;
    const correctSteps = solutionData.steps.filter(step => step.isCorrect).length;
    const accuracy = totalSteps > 0 ? (correctSteps / totalSteps) * 100 : 0;
    
    // Calculate score based on accuracy and step quality
    let score = Math.round(accuracy);
    if (accuracy === 100) score = Math.min(100, score + 10); // Bonus for perfect accuracy
    
    // Generate contextual feedback
    let feedback = '';
    const suggestions: string[] = [];
    
    if (accuracy >= 90) {
      feedback = `🎉 Excellent! ${correctSteps}/${totalSteps} steps correct.`;
      suggestions.push('Try more complex problems to further challenge yourself');
      suggestions.push('Consider exploring advanced topics like quadratic equations');
    } else if (accuracy >= 70) {
      feedback = `👍 Good! ${correctSteps}/${totalSteps} steps correct.`;
      suggestions.push('Review the steps you missed and understand the correct approach');
      suggestions.push('Practice similar problems to strengthen your skills');
    } else if (accuracy >= 50) {
      feedback = `📚 Progress! ${correctSteps}/${totalSteps} steps correct.`;
      suggestions.push('Focus on understanding the fundamental algebraic rules');
      suggestions.push('Break down complex problems into smaller, manageable steps');
      suggestions.push('Double-check your arithmetic calculations');
    } else {
      feedback = `💪 Keep going! ${correctSteps}/${totalSteps} steps correct.`;
      suggestions.push('Review basic algebraic operations and rules');
      suggestions.push('Start with simpler problems and gradually increase difficulty');
      suggestions.push('Don\'t hesitate to ask for help when you need it');
    }
    
    // Add step-specific suggestions
    if (solutionData.steps.some(step => step.latex.includes('='))) {
      if (correctSteps < totalSteps) {
        suggestions.push('Remember: when moving terms across an equals sign, change their signs');
      }
    }
    
    return {
      score,
      feedback,
      suggestions
    };
  }

  private parseSolutionEvaluation(response: string): {
    score: number;
    feedback: string;
    suggestions: string[];
  } {
    try {
      // Clean the response to handle escaped characters
      let cleanedResponse = response.trim();
      
      // Remove any markdown code blocks
      cleanedResponse = cleanedResponse.replace(/```json\s*|\s*```/g, '');
      
      // Handle malformed JSON like "score":90,"feedback":"text
      const malformedMatch = cleanedResponse.match(/["\s]*score["\s]*:\s*(\d+),["\s]*feedback["\s]*:\s*"([^"]+)",["\s]*suggestions["\s]*:\s*\[([^\]]*)\]/);
      if (malformedMatch) {
        const [, scoreStr, feedbackStr, suggestionsStr] = malformedMatch;
        const score = Math.max(0, Math.min(100, Number(scoreStr) || 0));
        const feedback = this.cleanFeedback(feedbackStr);
        
        // Parse suggestions array
        let suggestions: string[] = [];
        if (suggestionsStr.trim()) {
          suggestions = suggestionsStr
            .split(',')
            .map(s => this.cleanSuggestion(s.trim().replace(/^"|"$/g, '')))
            .filter(s => s.trim().length > 0);
        }
        
        if (suggestions.length === 0) {
          suggestions = this.generateDefaultSuggestions(score);
        }
        
        return { score, feedback, suggestions };
      }
      
      // Find JSON object in the response
      const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        let jsonString = jsonMatch[0];
        
        // Fix common JSON issues
        jsonString = jsonString
          .replace(/\\"/g, '"')  // Fix escaped quotes
          .replace(/\\n/g, '\\n')  // Fix escaped newlines
          .replace(/\\t/g, '\\t')  // Fix escaped tabs
          .replace(/\\r/g, '\\r'); // Fix escaped carriage returns
        
        const parsed = JSON.parse(jsonString);
        
        // Clean and format feedback
        let feedback = parsed.feedback || 'No feedback provided.';
        feedback = this.cleanFeedback(feedback);
        
        // Clean and format suggestions
        let suggestions: string[] = [];
        if (Array.isArray(parsed.suggestions)) {
          suggestions = parsed.suggestions.map((suggestion: any) => {
            if (typeof suggestion === 'string') {
              return this.cleanSuggestion(suggestion);
            }
            return this.cleanSuggestion(String(suggestion));
          }).filter(s => s.trim().length > 0);
        }
        
        // Ensure we have at least one suggestion
        if (suggestions.length === 0) {
          suggestions = this.generateDefaultSuggestions(parsed.score || 0);
        }
        
        return {
          score: Math.max(0, Math.min(100, Number(parsed.score) || 0)),
          feedback: feedback,
          suggestions: suggestions
        };
      }
    } catch (error) {
      console.error('Failed to parse solution evaluation:', error);
    }

    // Fallback parsing
    const scoreMatch = response.match(/(\d+)\/100|score[:\s]*(\d+)/i);
    const score = scoreMatch ? Number(scoreMatch[1] || scoreMatch[2]) : 50;

    return {
      score: Math.max(0, Math.min(100, score)),
      feedback: this.cleanFeedback(response.substring(0, 500)) + (response.length > 500 ? '...' : ''),
      suggestions: this.generateDefaultSuggestions(score)
    };
  }

  private generateDefaultSuggestions(score: number): string[] {
    if (score >= 90) {
      return [
        '🎯 Try more complex problems to challenge yourself',
        '🌟 Consider exploring advanced topics like quadratic equations',
        '💪 Keep up the excellent work!'
      ];
    } else if (score >= 70) {
      return [
        '📚 Review the steps you missed and understand the correct approach',
        '🎯 Practice similar problems to strengthen your skills',
        '💡 Focus on the areas that need improvement'
      ];
    } else if (score >= 50) {
      return [
        '📖 Focus on understanding the fundamental algebraic rules',
        '🔍 Break down complex problems into smaller, manageable steps',
        '🧮 Double-check your arithmetic calculations'
      ];
    } else {
      return [
        '📚 Review basic algebraic operations and rules',
        '🎯 Start with simpler problems and gradually increase difficulty',
        '💪 Don\'t hesitate to ask for help when you need it'
      ];
    }
  }
}

export const aiValidationService = AIValidationService.getInstance();

// Test function to verify API connection
export const testGroqAPI = async () => {
  try {
    console.log('🧪 Testing Groq API connection...');
    console.log('🔑 API Key:', import.meta.env.VITE_GROQ_API_KEY);
    
    const response = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are a math validation assistant. Respond with JSON format only."
        },
        {
          role: "user",
          content: `Test validation for step: x = 4 in problem: 2x + 3 = 11

Respond with JSON:
{
  "isCorrect": true,
  "feedback": "Test successful!",
  "confidence": 0.9
}`
        }
      ],
      model: "llama3-8b-8192",
      temperature: 0.1,
      max_completion_tokens: 100,
      top_p: 0.9,
      stream: false
    });
    
    console.log('✅ API Test Success:', response);
    return { success: true, response: response.choices[0]?.message?.content };
  } catch (error) {
    console.error('❌ API Test Failed:', error);
    return { success: false, error };
  }
};
