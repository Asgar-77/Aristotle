import React, { useState, useEffect } from 'react';
import { 
  PenTool, 
  Brain, 
  CheckCircle, 
  XCircle, 
  ArrowRight, 
  Play,
  Target,
  Zap,
  BookOpen,
  TrendingUp,
  Users,
  Star,
  ChevronDown,
  ChevronUp,
  Monitor,
  Smartphone,
  Tablet,
  Award,
  Clock,
  Lightbulb,
  MessageCircle,
  HelpCircle
} from 'lucide-react';

interface LandingPageProps {
  onStartPracticing: () => void;
}

// Animated Title Component
const AnimatedTitle: React.FC<{ text: string; className?: string }> = ({ text, className = "" }) => {
  return (
    <h1 className={`text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-bold bg-gradient-to-r from-purple-400 via-blue-400 to-green-400 bg-clip-text text-transparent mb-6 ${className}`}>
      {text.split('').map((letter, index) => (
        <span
          key={index}
          className="inline-block animate-simple-drop"
          style={{
            animationDelay: `${index * 0.15}s`,
            position: 'relative',
            display: 'inline-block'
          }}
        >
          {letter === ' ' ? '\u00A0' : letter}
        </span>
      ))}
    </h1>
  );
};

export const LandingPage: React.FC<LandingPageProps> = ({ onStartPracticing }) => {
  const [isHovering, setIsHovering] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [animatedElements, setAnimatedElements] = useState<Set<number>>(new Set());
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);
  const [showDemo, setShowDemo] = useState(false);

  // Testimonials data
  const testimonials = [
    {
      name: "Sarah Chen",
      role: "High School Student",
      content: "Aristotle helped me go from failing algebra to getting A's! The instant feedback is amazing.",
      rating: 5
    },
    {
      name: "Marcus Johnson",
      role: "College Student",
      content: "Finally, a tool that understands my handwriting and gives me real help. Game changer!",
      rating: 5
    },
    {
      name: "Emily Rodriguez",
      role: "Math Teacher",
      content: "My students love using Aristotle. It's like having a personal tutor for each student.",
      rating: 5
    }
  ];

  // FAQ data
  const faqs = [
    {
      question: "How does Aristotle recognize my handwriting?",
      answer: "Aristotle uses advanced AI technology to convert your handwritten math into digital format in real-time, just like a human tutor would understand your work."
    },
    {
      question: "Is my work saved automatically?",
      answer: "Yes! Your work is automatically saved as you go, so you never lose your progress. You can also manually save anytime."
    },
    {
      question: "Can I use Aristotle on my phone?",
      answer: "Absolutely! Aristotle works perfectly on phones, tablets, and computers. Just draw with your finger or stylus."
    },
    {
      question: "Is Aristotle free to use?",
      answer: "Yes, Aristotle is completely free! No hidden costs, no subscriptions - just start practicing and improving your math skills."
    },
    {
      question: "What math topics does Aristotle support?",
      answer: "Aristotle supports algebra, geometry, calculus, and many other math topics. It's designed to help with any handwritten math problem."
    }
  ];

  // Trigger animations on mount
  useEffect(() => {
    // Start with page fade-in
    setTimeout(() => setIsVisible(true), 100);
    
    // Stagger animations for different sections
    const timeouts = [
      setTimeout(() => setAnimatedElements(prev => new Set([...prev, 1])), 300),
      setTimeout(() => setAnimatedElements(prev => new Set([...prev, 2])), 500),
      setTimeout(() => setAnimatedElements(prev => new Set([...prev, 3])), 700),
      setTimeout(() => setAnimatedElements(prev => new Set([...prev, 4])), 900),
      setTimeout(() => setAnimatedElements(prev => new Set([...prev, 5])), 1100),
    ];

    return () => timeouts.forEach(clearTimeout);
  }, []);

  return (
    <div className={`min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white overflow-hidden transition-all duration-1000 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
      {/* Hero Section */}
      <div className="relative min-h-screen flex items-center justify-center px-6">
        {/* Background Elements */}
        <div className={`absolute inset-0 overflow-hidden transition-all duration-2000 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
          <div className="absolute top-20 left-20 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl animate-pulse animate-float" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse animate-float" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-green-500/5 rounded-full blur-2xl animate-pulse animate-float" style={{ animationDelay: '2s' }} />
          <div className="absolute top-1/4 right-1/4 w-48 h-48 bg-pink-500/5 rounded-full blur-2xl animate-pulse animate-float" style={{ animationDelay: '3s' }} />
          <div className="absolute bottom-1/4 left-1/4 w-56 h-56 bg-yellow-500/5 rounded-full blur-2xl animate-pulse animate-float" style={{ animationDelay: '4s' }} />
        </div>

        <div className={`relative z-10 max-w-6xl mx-auto text-center transition-all duration-1500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          {/* Aristotle Title */}
          <div className={`mb-8 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <AnimatedTitle text="Aristotle" />
            {/* Backup visible title for testing */}
            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-bold bg-gradient-to-r from-purple-400 via-blue-400 to-green-400 bg-clip-text text-transparent mb-6">
              Aristotle
            </h1>
          </div>

          {/* Main Headline */}
          <h2 className={`text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold mb-4 sm:mb-6 leading-tight transition-all duration-1000 delay-400 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <span className="inline-block">Practice Makes You Perfect</span>
            <br />
            <span className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl text-purple-300 inline-block transition-all duration-1000 delay-600">But Only If You Practice Right</span>
          </h2>

          {/* Subheadline */}
          <p className={`text-base sm:text-lg md:text-xl lg:text-2xl text-gray-300 mb-6 sm:mb-8 max-w-2xl sm:max-w-4xl mx-auto leading-relaxed px-4 sm:px-0 transition-all duration-1000 delay-800 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            Aristotle is your personal practice buddy. Not another lecture, not another video but an assistant who's with you while you solve problems, pointing out mistakes, guiding you step by step, and helping you truly master the subject.
          </p>

              {/* CTA Buttons */}
              <div className={`flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center mb-12 sm:mb-16 px-4 sm:px-0 transition-all duration-1000 delay-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                <button
                  onClick={onStartPracticing}
                  onMouseEnter={() => setIsHovering(true)}
                  onMouseLeave={() => setIsHovering(false)}
                  className="group relative px-6 sm:px-8 md:px-12 py-4 sm:py-5 md:py-6 bg-gradient-to-r from-purple-600 via-blue-600 to-green-600 hover:from-purple-700 hover:via-blue-700 hover:to-green-700 rounded-xl sm:rounded-2xl font-bold text-base sm:text-lg md:text-xl transition-all duration-500 transform hover:scale-105 shadow-2xl hover:shadow-purple-500/30 overflow-hidden w-full sm:w-auto"
                >
                  <span className="relative z-10 flex items-center justify-center space-x-2 sm:space-x-3">
                    <PenTool className="w-5 h-5 sm:w-6 sm:h-6 group-hover:rotate-12 transition-transform duration-300" />
                    <span className="text-center">Start Practicing Smarter</span>
                    <ArrowRight className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-300 ${isHovering ? 'translate-x-2' : ''}`} />
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-400 via-blue-400 to-green-400 rounded-xl sm:rounded-2xl opacity-0 group-hover:opacity-20 transition-opacity duration-500" />
                  <div className="absolute inset-0 bg-white/10 rounded-xl sm:rounded-2xl transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
                </button>

                <button 
                  onClick={() => setShowDemo(!showDemo)}
                  className="group px-6 sm:px-8 py-4 sm:py-5 md:py-6 border-2 border-purple-500/30 hover:border-purple-400/60 rounded-xl sm:rounded-2xl font-semibold text-base sm:text-lg transition-all duration-300 hover:scale-105 transform flex items-center justify-center space-x-2 sm:space-x-3 w-full sm:w-auto hover:bg-purple-500/10"
                >
                  <Play className="w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform duration-300" />
                  <span>See It in Action</span>
                </button>
              </div>

              {/* Demo Video Section */}
              {showDemo && (
                <div className={`mt-8 transition-all duration-500 ${showDemo ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                  <div className="bg-gray-800/50 rounded-2xl p-6 border border-purple-500/20">
                    <h3 className="text-xl font-bold text-white mb-4 text-center">Watch Aristotle in Action</h3>
                    <div className="aspect-video bg-gray-900 rounded-xl flex items-center justify-center border border-gray-700">
                      <div className="text-center">
                        <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Play className="w-8 h-8 text-white" />
                        </div>
                        <p className="text-gray-300 mb-2">Demo Video Coming Soon</p>
                        <p className="text-sm text-gray-400">See how students solve math problems with Aristotle</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Screenshots Section */}
              <div className={`mt-16 transition-all duration-1000 delay-1200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                <h3 className="text-2xl font-bold text-white mb-12 text-center">See How It Works</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700 hover:border-purple-500/50 transition-all duration-300 hover:scale-105">
                    <div className="aspect-video bg-gray-900 rounded-lg mb-4 flex items-center justify-center">
                      <Monitor className="w-12 h-12 text-purple-400" />
                    </div>
                    <h4 className="text-lg font-semibold text-white mb-2">Write Naturally</h4>
                    <p className="text-gray-300 text-sm">Draw math problems just like you would on paper</p>
                  </div>
                  <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700 hover:border-blue-500/50 transition-all duration-300 hover:scale-105">
                    <div className="aspect-video bg-gray-900 rounded-lg mb-4 flex items-center justify-center">
                      <Brain className="w-12 h-12 text-blue-400" />
                    </div>
                    <h4 className="text-lg font-semibold text-white mb-2">AI Recognition</h4>
                    <p className="text-gray-300 text-sm">Watch your handwriting convert to digital math instantly</p>
                  </div>
                  <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700 hover:border-green-500/50 transition-all duration-300 hover:scale-105">
                    <div className="aspect-video bg-gray-900 rounded-lg mb-4 flex items-center justify-center">
                      <CheckCircle className="w-12 h-12 text-green-400" />
                    </div>
                    <h4 className="text-lg font-semibold text-white mb-2">Get Feedback</h4>
                    <p className="text-gray-300 text-sm">Receive instant guidance and corrections</p>
                  </div>
                </div>
              </div>



        </div>
      </div>

      {/* Problem Section */}
      <div className={`py-12 sm:py-16 md:py-20 px-4 sm:px-6 bg-gradient-to-r from-red-900/20 to-orange-900/20 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        <div className="max-w-4xl mx-auto text-center">
          <h3 className={`text-2xl sm:text-3xl md:text-4xl font-bold mb-6 sm:mb-8 text-red-300 transition-all duration-1000 px-4 sm:px-0 ${animatedElements.has(1) ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            Students Don't Struggle Because of a Lack of Resources
          </h3>
          <p className={`text-base sm:text-lg md:text-xl text-gray-300 mb-8 sm:mb-12 leading-relaxed transition-all duration-1000 delay-200 px-4 sm:px-0 ${animatedElements.has(1) ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            They struggle because when they practice, they practice alone.
            <br />
            <span className="text-lg sm:text-xl md:text-2xl font-semibold text-red-200">Mistakes pile up. Doubts grow. Confidence fades.</span>
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
            <div className={`p-4 sm:p-6 bg-red-900/30 rounded-xl border border-red-500/20 hover:bg-red-900/40 hover:border-red-500/40 transition-all duration-500 hover:scale-105 hover:shadow-lg hover:shadow-red-500/20 group ${animatedElements.has(2) ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              <XCircle className="w-10 h-10 sm:w-12 sm:h-12 text-red-400 mx-auto mb-3 sm:mb-4 group-hover:scale-110 transition-transform duration-300" />
              <h4 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-3 text-red-200">Practicing Blindly</h4>
              <p className="text-sm sm:text-base text-gray-300">Making the same mistakes over and over without knowing why</p>
            </div>
            <div className={`p-4 sm:p-6 bg-red-900/30 rounded-xl border border-red-500/20 hover:bg-red-900/40 hover:border-red-500/40 transition-all duration-500 hover:scale-105 hover:shadow-lg hover:shadow-red-500/20 group delay-200 ${animatedElements.has(2) ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              <XCircle className="w-10 h-10 sm:w-12 sm:h-12 text-red-400 mx-auto mb-3 sm:mb-4 group-hover:scale-110 transition-transform duration-300" />
              <h4 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-3 text-red-200">No Feedback</h4>
              <p className="text-sm sm:text-base text-gray-300">Waiting until test day to discover what you don't understand</p>
            </div>
            <div className={`p-4 sm:p-6 bg-red-900/30 rounded-xl border border-red-500/20 hover:bg-red-900/40 hover:border-red-500/40 transition-all duration-500 hover:scale-105 hover:shadow-lg hover:shadow-red-500/20 group delay-400 sm:col-span-2 md:col-span-1 ${animatedElements.has(2) ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              <XCircle className="w-10 h-10 sm:w-12 sm:h-12 text-red-400 mx-auto mb-3 sm:mb-4 group-hover:scale-110 transition-transform duration-300" />
              <h4 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-3 text-red-200">Losing Confidence</h4>
              <p className="text-sm sm:text-base text-gray-300">Feeling like you'll never get it, even when you're trying hard</p>
            </div>
          </div>
        </div>
      </div>

      {/* Guide Section */}
      <div className={`py-12 sm:py-16 md:py-20 px-4 sm:px-6 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        <div className="max-w-4xl mx-auto text-center">
          <h3 className={`text-2xl sm:text-3xl md:text-4xl font-bold mb-6 sm:mb-8 text-blue-300 transition-all duration-1000 px-4 sm:px-0 ${animatedElements.has(3) ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            Meet Aristotle: Your Digital Practice Buddy
          </h3>
          <p className={`text-base sm:text-lg md:text-xl text-gray-300 mb-8 sm:mb-12 leading-relaxed transition-all duration-1000 delay-200 px-4 sm:px-0 ${animatedElements.has(3) ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            Aristotle doesn't just mark the final answer.
            <br />
            <span className="text-lg sm:text-xl md:text-2xl font-semibold text-blue-200">It follows your steps, catches your slips, and shows you exactly where you're lacking.</span>
            <br />
            <span className="text-sm sm:text-base md:text-lg text-gray-400">You stay in control — Aristotle just makes sure you never practice in the dark.</span>
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 items-center">
            <div className="space-y-4 sm:space-y-6">
              <div className={`flex items-start space-x-3 sm:space-x-4 group hover:bg-gray-800/50 p-3 sm:p-4 rounded-xl transition-all duration-500 ${animatedElements.has(4) ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'}`}>
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                  <PenTool className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div>
                  <h4 className="text-lg sm:text-xl font-semibold mb-1 sm:mb-2 text-blue-200">Write or Solve as Usual</h4>
                  <p className="text-sm sm:text-base text-gray-300">Just write your math problems by hand, exactly like you always do</p>
                </div>
              </div>
              <div className={`flex items-start space-x-3 sm:space-x-4 group hover:bg-gray-800/50 p-3 sm:p-4 rounded-xl transition-all duration-500 delay-200 ${animatedElements.has(4) ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'}`}>
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-600 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                  <Brain className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div>
                  <h4 className="text-lg sm:text-xl font-semibold mb-1 sm:mb-2 text-green-200">Aristotle Reads in Real Time</h4>
                  <p className="text-sm sm:text-base text-gray-300">Watch as your handwriting is instantly converted to clean LaTeX</p>
                </div>
              </div>
              <div className={`flex items-start space-x-3 sm:space-x-4 group hover:bg-gray-800/50 p-3 sm:p-4 rounded-xl transition-all duration-500 delay-400 ${animatedElements.has(4) ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'}`}>
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-600 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                  <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div>
                  <h4 className="text-lg sm:text-xl font-semibold mb-1 sm:mb-2 text-purple-200">Instant Feedback & Guidance</h4>
                  <p className="text-sm sm:text-base text-gray-300">Get hints, corrections, and step-by-step guidance as you work</p>
                </div>
              </div>
            </div>
            
            <div className={`relative transition-all duration-1000 delay-600 ${animatedElements.has(4) ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'}`}>
              <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 border border-purple-500/20 shadow-2xl hover:shadow-purple-500/30 transition-all duration-500 hover:scale-105">
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex items-center space-x-2 sm:space-x-3 group">
                    <div className="w-2 h-2 sm:w-3 sm:h-3 bg-green-400 rounded-full group-hover:scale-125 transition-transform duration-300"></div>
                    <span className="text-green-400 font-mono text-sm sm:text-base">2x + 3 = 11</span>
                  </div>
                  <div className="flex items-center space-x-2 sm:space-x-3 group">
                    <div className="w-2 h-2 sm:w-3 sm:h-3 bg-yellow-400 rounded-full group-hover:scale-125 transition-transform duration-300"></div>
                    <span className="text-yellow-400 font-mono text-sm sm:text-base">2x = 8</span>
                  </div>
                  <div className="flex items-center space-x-2 sm:space-x-3 group">
                    <div className="w-2 h-2 sm:w-3 sm:h-3 bg-red-400 rounded-full group-hover:scale-125 transition-transform duration-300"></div>
                    <span className="text-red-400 font-mono text-sm sm:text-base">x = 4</span>
                  </div>
                </div>
                <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-green-900/30 rounded-lg border border-green-500/30 hover:bg-green-900/40 transition-colors duration-300">
                  <p className="text-green-200 text-xs sm:text-sm">✓ Perfect! You solved it step by step</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className={`py-12 sm:py-16 md:py-20 px-4 sm:px-6 bg-gradient-to-r from-purple-900/20 to-blue-900/20 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        <div className="max-w-6xl mx-auto">
          <h3 className={`text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-8 sm:mb-12 md:mb-16 text-purple-300 transition-all duration-1000 px-4 sm:px-0 ${animatedElements.has(5) ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            Why Students Choose Aristotle
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
            <div className={`text-center p-4 sm:p-6 group hover:bg-gray-800/30 rounded-xl transition-all duration-500 hover:scale-105 hover:shadow-lg hover:shadow-blue-500/20 ${animatedElements.has(5) ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6 group-hover:scale-110 transition-transform duration-300">
                <Zap className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </div>
              <h4 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-blue-200">Instant Feedback</h4>
              <p className="text-sm sm:text-base text-gray-300">See mistakes the moment they happen, not after the test</p>
            </div>
            
            <div className={`text-center p-4 sm:p-6 group hover:bg-gray-800/30 rounded-xl transition-all duration-500 hover:scale-105 hover:shadow-lg hover:shadow-green-500/20 delay-200 ${animatedElements.has(5) ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6 group-hover:scale-110 transition-transform duration-300">
                <BookOpen className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </div>
              <h4 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-green-200">Step-by-Step Guidance</h4>
              <p className="text-sm sm:text-base text-gray-300">Understand not just the "what" but the "why" behind every step</p>
            </div>
            
            <div className={`text-center p-4 sm:p-6 group hover:bg-gray-800/30 rounded-xl transition-all duration-500 hover:scale-105 hover:shadow-lg hover:shadow-purple-500/20 delay-400 ${animatedElements.has(5) ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6 group-hover:scale-110 transition-transform duration-300">
                <Target className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </div>
              <h4 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-purple-200">Confidence Tracking</h4>
              <p className="text-sm sm:text-base text-gray-300">Watch your progress grow as you master one problem at a time</p>
            </div>
            
            <div className={`text-center p-4 sm:p-6 group hover:bg-gray-800/30 rounded-xl transition-all duration-500 hover:scale-105 hover:shadow-lg hover:shadow-orange-500/20 delay-600 ${animatedElements.has(5) ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6 group-hover:scale-110 transition-transform duration-300">
                <Brain className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </div>
              <h4 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-orange-200">Anytime, Anywhere</h4>
              <p className="text-sm sm:text-base text-gray-300">Aristotle is always available when you're ready to practice</p>
            </div>
          </div>
        </div>
      </div>

      {/* Transformation Section */}
      <div className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <h3 className="text-4xl font-bold text-center mb-16 text-green-300">
            The Aristotle Transformation
          </h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="space-y-6">
              <h4 className="text-2xl font-semibold text-red-300 mb-6">Before Aristotle</h4>
              <div className="space-y-4">
                <div className="flex items-center space-x-4 p-4 bg-red-900/20 rounded-xl border border-red-500/20">
                  <XCircle className="w-6 h-6 text-red-400 flex-shrink-0" />
                  <span className="text-gray-300">Practicing blindly, repeating the same mistakes</span>
                </div>
                <div className="flex items-center space-x-4 p-4 bg-red-900/20 rounded-xl border border-red-500/20">
                  <XCircle className="w-6 h-6 text-red-400 flex-shrink-0" />
                  <span className="text-gray-300">Losing confidence with each failed attempt</span>
                </div>
                <div className="flex items-center space-x-4 p-4 bg-red-900/20 rounded-xl border border-red-500/20">
                  <XCircle className="w-6 h-6 text-red-400 flex-shrink-0" />
                  <span className="text-gray-300">Wasting time on problems you don't understand</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-6">
              <h4 className="text-2xl font-semibold text-green-300 mb-6">After Aristotle</h4>
              <div className="space-y-4">
                <div className="flex items-center space-x-4 p-4 bg-green-900/20 rounded-xl border border-green-500/20">
                  <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0" />
                  <span className="text-gray-300">Targeted feedback that shows exactly what to fix</span>
                </div>
                <div className="flex items-center space-x-4 p-4 bg-green-900/20 rounded-xl border border-green-500/20">
                  <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0" />
                  <span className="text-gray-300">Growing confidence with each correct step</span>
                </div>
                <div className="flex items-center space-x-4 p-4 bg-green-900/20 rounded-xl border border-green-500/20">
                  <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0" />
                  <span className="text-gray-300">Smarter practice that builds real understanding</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="text-center mt-12">
            <p className="text-2xl font-semibold text-gray-200 mb-8">
              Because practice doesn't just make perfect — <span className="text-green-400">perfect practice makes perfect</span>
            </p>
          </div>
        </div>
      </div>

      {/* Testimonials Section */}
      <div className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 bg-gradient-to-r from-blue-900/20 to-green-900/20">
        <div className="max-w-6xl mx-auto">
          <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-8 sm:mb-12 text-center text-green-300">
            What Students Are Saying
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-gray-800/50 rounded-xl p-6 border border-gray-700 hover:border-green-500/50 transition-all duration-300 hover:scale-105">
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-300 mb-4 italic">"{testimonial.content}"</p>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gradient-to-r from-green-400 to-blue-400 rounded-full flex items-center justify-center mr-3">
                    <span className="text-white font-bold text-sm">
                      {testimonial.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div>
                    <p className="text-white font-semibold">{testimonial.name}</p>
                    <p className="text-gray-400 text-sm">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="py-12 sm:py-16 md:py-20 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-8 sm:mb-12 text-center text-white">
            Frequently Asked Questions
          </h3>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-gray-800/50 rounded-xl border border-gray-700 hover:border-purple-500/50 transition-all duration-300">
                <button
                  onClick={() => setOpenFAQ(openFAQ === index ? null : index)}
                  className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-700/30 transition-colors duration-200"
                >
                  <span className="text-white font-semibold pr-4">{faq.question}</span>
                  {openFAQ === index ? (
                    <ChevronUp className="w-5 h-5 text-purple-400 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  )}
                </button>
                {openFAQ === index && (
                  <div className="px-6 pb-4">
                    <p className="text-gray-300 leading-relaxed">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Final CTA Section */}
      <div className={`py-12 sm:py-16 md:py-20 px-4 sm:px-6 bg-gradient-to-r from-purple-900/30 to-blue-900/30 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        <div className="max-w-4xl mx-auto text-center">
          <h3 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6 text-white px-4 sm:px-0">
            Don't Practice Alone
          </h3>
          <p className="text-lg sm:text-xl md:text-2xl text-gray-300 mb-8 sm:mb-12 px-4 sm:px-0">
            Practice with Aristotle and see the difference
          </p>
          
          <button
            onClick={onStartPracticing}
            className="group relative px-8 sm:px-12 md:px-16 py-4 sm:py-6 md:py-8 bg-gradient-to-r from-purple-600 via-blue-600 to-green-600 hover:from-purple-700 hover:via-blue-700 hover:to-green-700 rounded-2xl sm:rounded-3xl font-bold text-lg sm:text-xl md:text-2xl transition-all duration-500 transform hover:scale-105 shadow-2xl hover:shadow-purple-500/30 w-full sm:w-auto"
          >
            <span className="relative z-10 flex items-center justify-center space-x-3 sm:space-x-4">
              <PenTool className="w-6 h-6 sm:w-8 sm:h-8" />
              <span>Try Aristotle Now</span>
              <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6" />
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-purple-400 via-blue-400 to-green-400 rounded-2xl sm:rounded-3xl opacity-0 group-hover:opacity-20 transition-opacity duration-500" />
          </button>
          

        </div>
      </div>
    </div>
  );
};
