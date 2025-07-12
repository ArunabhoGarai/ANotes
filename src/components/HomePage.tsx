import React, { useEffect, useState } from 'react';
import { BookOpen, Brain, Zap, Target, Users, Award, TrendingUp, Clock, FileText, Sparkles, ArrowRight, Star, CheckCircle, Cpu, Database, Shield } from 'lucide-react';
import { User } from '../hooks/useAuth';

interface HomePageProps {
  user: User;
  onGetStarted: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({ user, onGetStarted }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);

  useEffect(() => {
    setIsVisible(true);
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % 4);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const features = [
    {
      icon: Brain,
      title: 'Unlimited AI Processing',
      description: 'No word limits! Our AI processes each topic individually for complete coverage, unlike restricted models that give incomplete notes',
      color: 'from-purple-500 to-pink-500',
      gradient: 'from-purple-500/20 to-pink-500/20'
    },
    {
      icon: FileText,
      title: 'Smart Book & Syllabus Processing',
      description: 'Upload your books or just provide your syllabus - we extract every topic and create comprehensive notes with 100% coverage',
      color: 'from-blue-500 to-cyan-500',
      gradient: 'from-blue-500/20 to-cyan-500/20'
    },
    {
      icon: Zap,
      title: 'Everything Included',
      description: 'Numericals, examples, flowcharts, diagrams, formulas - EVERYTHING covered. Your job is just to study!',
      color: 'from-yellow-500 to-orange-500',
      gradient: 'from-yellow-500/20 to-orange-500/20'
    },
    {
      icon: Target,
      title: 'Success Guaranteed',
      description: '100% reliability + peace of mind + your success. Excellence guaranteed or we shut down!',
      color: 'from-green-500 to-emerald-500',
      gradient: 'from-green-500/20 to-emerald-500/20'
    }
  ];

  const stats = [
    { label: 'Study Notes Generated', value: '50,000+', icon: BookOpen, color: 'text-blue-400' },
    { label: 'Active Students', value: '12,500+', icon: Users, color: 'text-purple-400' },
    { label: 'Success Rate', value: '98%', icon: Award, color: 'text-green-400' },
    { label: 'Time Saved', value: '10,000+ hrs', icon: Clock, color: 'text-yellow-400' }
  ];

  const capabilities = [
    { icon: Cpu, title: 'Advanced AI Processing', description: 'Powered by Google\'s latest Gemini 2.0 Flash' },
    { icon: Database, title: 'Smart Content Analysis', description: 'Intelligent extraction from any document format' },
    { icon: Shield, title: 'Secure & Private', description: 'Your data is protected with enterprise-grade security' },
    { icon: Star, title: 'Premium Quality', description: 'Professional-grade study materials every time' }
  ];

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const getInitials = (name?: string, email?: string) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return email?.slice(0, 2).toUpperCase() || 'U';
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -inset-10 opacity-50">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute top-3/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl animate-pulse delay-2000"></div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="relative">
        <div className="container mx-auto px-4 py-20">
          <div className="max-w-6xl mx-auto">
            {/* Personal Welcome */}
            <div className={`flex items-center justify-center space-x-6 mb-12 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              <div className="relative group">
                <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center shadow-2xl group-hover:shadow-blue-500/50 transition-all duration-300">
                  <span className="text-2xl font-bold text-white">
                    {getInitials(user.name, user.email)}
                  </span>
                </div>
                <div className="absolute -inset-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full opacity-0 group-hover:opacity-20 blur transition-all duration-300"></div>
              </div>
              <div className="text-left">
                <p className="text-xl text-gray-300">{getGreeting()},</p>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  {user.name || user.email.split('@')[0]}!
                </h1>
              </div>
            </div>

            {/* Main Heading */}
            <div className={`text-center space-y-8 mb-16 transition-all duration-1000 delay-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              <h2 className="text-6xl md:text-7xl font-bold leading-tight">
                Transform Your
                <span className="block bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent animate-pulse">
                  Learning Journey
                </span>
              </h2>
              <div className="space-y-6 max-w-5xl mx-auto">
                <p className="text-xl text-gray-300 leading-relaxed">
                  Experience the future of education with AI-powered study notes that adapt to your learning style. 
                  Powered by Google's revolutionary Gemini 2.0 Flash for unmatched accuracy and depth.
                </p>
                
                {/* Key Value Propositions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                  <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 backdrop-blur-lg rounded-2xl p-6 border border-blue-500/30">
                    <h3 className="text-lg font-bold text-blue-300 mb-3">📚 Upload Your Book & Syllabus</h3>
                    <p className="text-gray-300 text-sm leading-relaxed">
                      Unlike normal AI models restricted by word limits giving incomplete notes, our AI smartly extracts topics and processes every topic individually. Get reliable notes with <span className="text-blue-400 font-semibold">100% coverage of your syllabus with no limits!</span>
                    </p>
                  </div>
                  
                  <div className="bg-gradient-to-r from-green-600/20 to-emerald-600/20 backdrop-blur-lg rounded-2xl p-6 border border-green-500/30">
                    <h3 className="text-lg font-bold text-green-300 mb-3">🎯 No Book? No Problem!</h3>
                    <p className="text-gray-300 text-sm leading-relaxed">
                      Just give us your detailed syllabus and we'll handle the rest! <span className="text-green-400 font-semibold">100% coverage + reliability + your peace of mind + your success</span> (your hard work also needed!). You get everything!
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* CTA Section */}
            <div className={`flex flex-col items-center space-y-8 mb-20 transition-all duration-1000 delay-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              <button
                onClick={onGetStarted}
                className="group relative bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold py-6 px-12 rounded-2xl hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-4 focus:ring-blue-500/50 transition-all duration-300 shadow-2xl hover:shadow-blue-500/50 transform hover:-translate-y-2 hover:scale-105"
              >
                <div className="flex items-center space-x-3">
                  <Sparkles className="w-6 h-6 group-hover:rotate-12 transition-transform duration-300" />
                  <span className="text-xl">Start Creating Magic</span>
                  <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform duration-300" />
                </div>
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl opacity-0 group-hover:opacity-30 blur transition-all duration-300"></div>
              </button>
              
              <div className="flex items-center space-x-3 text-gray-400">
                <Clock className="w-5 h-5" />
                <span>Generate comprehensive notes in under 30 seconds</span>
                <div className="flex space-x-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                  ))}
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className={`grid grid-cols-2 md:grid-cols-4 gap-6 mb-20 transition-all duration-1000 delay-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              {stats.map((stat, index) => (
                <div key={index} className="group relative bg-gray-800/50 backdrop-blur-lg rounded-2xl p-6 border border-gray-700 hover:border-gray-600 transition-all duration-300 hover:transform hover:-translate-y-2">
                  <div className="text-center">
                    <stat.icon className={`w-8 h-8 ${stat.color} mx-auto mb-3 group-hover:scale-110 transition-transform duration-300`} />
                    <p className="text-3xl font-bold text-white mb-1">{stat.value}</p>
                    <p className="text-sm text-gray-400">{stat.label}</p>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-all duration-300"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="relative py-20 bg-gray-800/30">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h3 className="text-5xl font-bold text-white mb-6">
                Why Choose <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">ANotes</span>?
              </h3>
              <div className="space-y-6 max-w-4xl mx-auto">
                <p className="text-xl text-gray-300">
                  Experience cutting-edge AI technology designed to revolutionize how you learn
                </p>
                
                {/* Comprehensive Coverage Guarantee */}
                <div className="bg-gradient-to-r from-yellow-600/20 to-orange-600/20 backdrop-blur-lg rounded-2xl p-6 border border-yellow-500/30">
                  <h4 className="text-xl font-bold text-yellow-300 mb-4">🔥 Complete Coverage Guarantee</h4>
                  <p className="text-gray-200 leading-relaxed">
                    Ever had a doubt that <span className="text-yellow-400 font-semibold">numericals, examples, flowcharts</span> etc. will not be covered? 
                    <span className="text-white font-bold"> Don't</span> - because we provide you <span className="text-yellow-400 font-bold">EVERYTHING</span>. 
                    Your work is to <span className="text-green-400 font-semibold">JUST STUDY</span>. 
                    Save yourself from the hassle of creating notes and start learning with top quality notes.
                  </p>
                  <div className="mt-4 p-3 bg-red-600/20 border border-red-500/50 rounded-lg">
                    <p className="text-red-300 font-bold text-center">
                      🎯 Excellence Guaranteed or We'll Shut Down Our App!
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {features.map((feature, index) => (
                <div 
                  key={index} 
                  className={`group relative bg-gray-800/50 backdrop-blur-lg rounded-3xl p-8 border border-gray-700 hover:border-gray-600 transition-all duration-500 transform hover:-translate-y-4 hover:scale-105 ${activeFeature === index ? 'ring-2 ring-blue-500/50' : ''}`}
                  onMouseEnter={() => setActiveFeature(index)}
                >
                  <div className="flex items-start space-x-6">
                    <div className={`relative w-16 h-16 bg-gradient-to-r ${feature.color} rounded-2xl flex items-center justify-center shadow-2xl group-hover:shadow-lg transition-all duration-300 group-hover:rotate-6`}>
                      <feature.icon className="w-8 h-8 text-white" />
                      <div className={`absolute -inset-2 bg-gradient-to-r ${feature.color} rounded-2xl opacity-0 group-hover:opacity-30 blur transition-all duration-300`}></div>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-2xl font-bold text-white mb-4 group-hover:text-blue-400 transition-colors duration-300">
                        {feature.title}
                      </h4>
                      <p className="text-gray-300 leading-relaxed group-hover:text-gray-200 transition-colors duration-300">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                  <div className={`absolute inset-0 bg-gradient-to-r ${feature.gradient} rounded-3xl opacity-0 group-hover:opacity-100 transition-all duration-300`}></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Capabilities Section */}
      <div className="relative py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h3 className="text-5xl font-bold text-white mb-6">
                Powered by <span className="bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">Advanced AI</span>
              </h3>
              <p className="text-xl text-gray-300">
                Built with enterprise-grade technology for professional results
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {capabilities.map((capability, index) => (
                <div key={index} className="group relative bg-gray-800/30 backdrop-blur-lg rounded-2xl p-6 border border-gray-700 hover:border-blue-500/50 transition-all duration-300 hover:transform hover:-translate-y-2">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                      <capability.icon className="w-6 h-6 text-white" />
                    </div>
                    <h4 className="text-lg font-bold text-white mb-2">{capability.title}</h4>
                    <p className="text-sm text-gray-400">{capability.description}</p>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-all duration-300"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="relative py-20 bg-gray-800/30">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h3 className="text-5xl font-bold text-white mb-6">
                How It <span className="bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">Works</span>
              </h3>
              <div className="space-y-4">
                <p className="text-xl text-gray-300">
                  Three simple steps to transform your learning experience
                </p>
                <p className="text-lg text-blue-300 font-semibold">
                  No hassle, no incomplete notes, no compromise - just excellence!
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  step: '01',
                  title: 'Upload Book or Syllabus',
                  description: 'Have a book? Upload it! No book? Just give us your detailed syllabus - we handle everything else',
                  icon: BookOpen,
                  color: 'from-blue-500 to-cyan-500'
                },
                {
                  step: '02',
                  title: 'Smart Topic Extraction',
                  description: 'Our AI extracts every topic individually and processes them without word limits for complete coverage',
                  icon: Brain,
                  color: 'from-purple-500 to-pink-500'
                },
                {
                  step: '03',
                  title: 'Get EVERYTHING',
                  description: 'Receive complete notes with numericals, examples, flowcharts - literally everything you need to succeed',
                  icon: CheckCircle,
                  color: 'from-green-500 to-emerald-500'
                }
              ].map((step, index) => (
                <div key={index} className="relative group">
                  <div className="bg-gray-800/50 backdrop-blur-lg rounded-3xl p-8 border border-gray-700 hover:border-gray-600 transition-all duration-300 text-center group-hover:transform group-hover:-translate-y-4">
                    <div className="relative mb-8">
                      <div className={`w-20 h-20 bg-gradient-to-r ${step.color} rounded-2xl flex items-center justify-center mx-auto shadow-2xl group-hover:shadow-lg transition-all duration-300 group-hover:rotate-6`}>
                        <step.icon className="w-10 h-10 text-white" />
                      </div>
                      <div className="absolute -top-3 -right-3 w-10 h-10 bg-gray-900 border-2 border-gray-700 text-white rounded-full flex items-center justify-center text-sm font-bold">
                        {step.step}
                      </div>
                    </div>
                    <h4 className="text-2xl font-bold text-white mb-4 group-hover:text-blue-400 transition-colors duration-300">
                      {step.title}
                    </h4>
                    <p className="text-gray-300 group-hover:text-gray-200 transition-colors duration-300">
                      {step.description}
                    </p>
                  </div>
                  {index < 2 && (
                    <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 transform -translate-y-1/2 z-10"></div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Final CTA Section */}
      <div className="relative py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="relative bg-gradient-to-r from-blue-600/20 to-purple-600/20 backdrop-blur-lg rounded-3xl p-12 border border-gray-700 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10"></div>
              <div className="relative z-10">
                <h3 className="text-4xl md:text-5xl font-bold text-white mb-6">
                  Ready to <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Revolutionize</span> Your Studies?
                </h3>
                <div className="space-y-6 mb-8">
                  <p className="text-xl text-gray-300 max-w-2xl mx-auto">
                    Join thousands of students who have transformed their learning experience with AI-powered study notes.
                  </p>
                  <div className="bg-gradient-to-r from-green-600/30 to-blue-600/30 backdrop-blur-lg rounded-2xl p-6 border border-green-500/40 max-w-3xl mx-auto">
                    <p className="text-lg text-green-300 font-bold mb-2">🎯 Our Promise to You:</p>
                    <p className="text-gray-200 leading-relaxed">
                      <span className="text-yellow-400 font-semibold">100% syllabus coverage</span> • 
                      <span className="text-blue-400 font-semibold"> No word limits</span> • 
                      <span className="text-green-400 font-semibold"> Everything included</span> • 
                      <span className="text-purple-400 font-semibold"> Excellence guaranteed</span>
                    </p>
                    <p className="text-white font-bold mt-3 text-center">
                      Your success is our mission! 🚀
                    </p>
                  </div>
                </div>
                <button
                  onClick={onGetStarted}
                  className="group bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold py-4 px-8 rounded-2xl hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-4 focus:ring-blue-500/50 transition-all duration-300 shadow-2xl hover:shadow-blue-500/50 transform hover:-translate-y-2 hover:scale-105"
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-lg">Start Creating Perfect Notes</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform duration-300" />
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};