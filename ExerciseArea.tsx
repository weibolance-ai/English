import React, { useState, useEffect } from 'react';
import { VocabularyItem, WritingFeedback, LoadingState } from '../types';
import { getTopicSuggestions, generateVocabulary, evaluateWriting } from '../services/geminiService';
import { ArrowRight, RefreshCw, Send, CheckCircle, AlertCircle, Loader2, Sparkles, Heart, BookOpen, PenTool, Lightbulb, Check, Award, Anchor } from 'lucide-react';

interface ExerciseAreaProps {
  apiKey: string;
  mode: any;
  topic: string;
  setTopic: (t: string) => void;
  level: string;
}

type Step = 'TOPIC' | 'VOCAB' | 'WRITING' | 'FEEDBACK';

export const ExerciseArea: React.FC<ExerciseAreaProps> = ({ apiKey, mode, topic, setTopic, level }) => {
  const [step, setStep] = useState<Step>('TOPIC');
  const [loading, setLoading] = useState<LoadingState>('idle');
  const [error, setError] = useState<string | null>(null);

  // Data States
  const [suggestedTopics, setSuggestedTopics] = useState<string[]>([]);
  const [vocabList, setVocabList] = useState<VocabularyItem[]>([]);
  const [userSubmission, setUserSubmission] = useState('');
  const [feedback, setFeedback] = useState<WritingFeedback | null>(null);

  // Reset when coming back to Topic selection
  const handleReset = () => {
    setStep('TOPIC');
    setVocabList([]);
    setUserSubmission('');
    setFeedback(null);
    setError(null);
  };

  // Step 1: Topic Selection Logic
  const handleGetTopics = async () => {
    setLoading('generating_topics');
    setError(null);
    try {
        const topics = await getTopicSuggestions(apiKey, topic);
        setSuggestedTopics(topics);
    } catch (e) {
        setError("无法获取推荐主题，请检查网络或API Key");
    } finally {
        setLoading('idle');
    }
  };

  const confirmTopic = (selectedTopic: string) => {
      setTopic(selectedTopic);
      handleGenerateVocab(selectedTopic);
  };

  // Step 2: Vocab Generation
  const handleGenerateVocab = async (selectedTopic: string) => {
    setLoading('generating_vocab');
    setError(null);
    try {
        const vocab = await generateVocabulary(apiKey, selectedTopic, level);
        setVocabList(vocab);
        setStep('VOCAB');
    } catch (e) {
        setError("生成词汇失败");
    } finally {
        setLoading('idle');
    }
  };

  const handleStartWriting = () => {
      setStep('WRITING');
  };

  // Step 3: Submission
  const handleSubmit = async () => {
      if (!userSubmission.trim()) return;
      setLoading('evaluating');
      try {
          const result = await evaluateWriting(
              apiKey, 
              topic, 
              vocabList.map(v => v.word), 
              userSubmission
          );
          setFeedback(result);
          setStep('FEEDBACK');
      } catch (e) {
          setError("评估失败，请重试");
      } finally {
          setLoading('idle');
      }
  };

  // Helper to check vocab usage in realtime
  const checkVocabUsed = (word: string) => {
      const regex = new RegExp(`\\b${word}\\w*\\b`, 'i');
      return regex.test(userSubmission);
  };

  // Renders
  const renderTopicStep = () => (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4">
        <div className="text-center space-y-2">
            <h2 className="text-3xl font-serif font-bold text-slate-800">今天想写点什么？</h2>
            <p className="text-slate-500">选择一个深度话题，开始你的刻意练习。</p>
        </div>

        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 space-y-6">
            <div>
                <label className="block text-sm font-bold text-slate-500 mb-2 uppercase tracking-wide">自定义话题</label>
                <div className="flex gap-3">
                    <input
                        type="text"
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        placeholder="例如：Digital Minimalism, The Future of Work..."
                        className="flex-1 px-5 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary-100 outline-none text-slate-800"
                    />
                    <button 
                        onClick={() => confirmTopic(topic)}
                        disabled={!topic.trim() || loading === 'generating_vocab'}
                        className="px-6 py-3 bg-primary-600 text-white font-bold rounded-xl disabled:opacity-50 hover:bg-primary-700 transition-colors"
                    >
                        {loading === 'generating_vocab' ? <Loader2 className="animate-spin" /> : <ArrowRight />}
                    </button>
                </div>
            </div>

            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-100"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-slate-400">或</span>
                </div>
            </div>

            <div>
                <div className="flex justify-between items-center mb-4">
                    <label className="text-sm font-bold text-slate-500 uppercase tracking-wide flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-primary-500" /> AI 推荐话题
                    </label>
                    <button onClick={handleGetTopics} className="text-xs text-primary-600 hover:text-primary-800 font-medium flex items-center gap-1">
                        <RefreshCw className={`w-3 h-3 ${loading === 'generating_topics' ? 'animate-spin' : ''}`} /> 换一批
                    </button>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {suggestedTopics.length > 0 ? suggestedTopics.map((t, i) => (
                        <button
                            key={i}
                            onClick={() => confirmTopic(t)}
                            className="text-left p-4 rounded-xl border border-slate-200 hover:border-primary-300 hover:bg-primary-50 transition-all group"
                        >
                            <span className="font-serif text-slate-700 group-hover:text-primary-800 font-medium">{t}</span>
                        </button>
                    )) : (
                        <div className="col-span-2 text-center py-8 text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                             点击“换一批”获取灵感
                        </div>
                    )}
                </div>
            </div>
        </div>
    </div>
  );

  const renderVocabStep = () => (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-right-4">
        <div className="flex items-center gap-4 mb-6">
            <button onClick={() => setStep('TOPIC')} className="p-2 hover:bg-slate-100 rounded-full text-slate-400">
                <ArrowRight className="w-5 h-5 rotate-180" />
            </button>
            <div>
                <h2 className="text-2xl font-serif font-bold text-slate-800">构建词汇库</h2>
                <p className="text-slate-500">为了精准表达 "{topic}"，建议使用以下高级词汇：</p>
            </div>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                {vocabList.map((v, i) => (
                    <div key={i} className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:border-primary-200 transition-colors">
                        <div className="flex justify-between items-baseline mb-1">
                            <span className="font-bold text-lg text-slate-800">{v.word}</span>
                            <span className="text-xs text-slate-400 italic">{v.pos}</span>
                        </div>
                        <p className="text-sm text-slate-500">{v.definition}</p>
                    </div>
                ))}
            </div>
            
            <div className="flex justify-end">
                <button 
                    onClick={handleStartWriting}
                    className="px-8 py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl shadow-lg shadow-primary-500/30 flex items-center gap-2 transform hover:scale-105 transition-all"
                >
                    <PenTool className="w-5 h-5" /> 开始写作
                </button>
            </div>
        </div>
    </div>
  );

  const renderWritingStep = () => (
    <div className="max-w-6xl mx-auto h-[calc(100vh-140px)] flex gap-6 animate-in fade-in">
        {/* Left: Writing Area */}
        <div className="flex-1 flex flex-col bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
             <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <div>
                    <h3 className="font-bold text-slate-700 flex items-center gap-2">
                        <PenTool className="w-4 h-4 text-primary-500" /> 写作练习
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">尝试写一段逻辑严密的段落 (100-200 words)</p>
                </div>
                <div className="text-sm px-3 py-1 bg-white border border-slate-200 rounded-lg text-slate-500 max-w-xs truncate">
                    话题: {topic}
                </div>
             </div>
             <textarea
                value={userSubmission}
                onChange={(e) => setUserSubmission(e.target.value)}
                className="flex-1 w-full p-8 outline-none resize-none font-serif text-lg leading-relaxed text-slate-800 placeholder-slate-300"
                placeholder="在此输入... 尝试运用右侧的词汇，注意使用从句（Hypotaxis）连接你的观点。"
                spellCheck={false}
             />
             <div className="p-6 border-t border-slate-100 flex justify-between items-center bg-white">
                <button onClick={() => setStep('VOCAB')} className="text-slate-400 hover:text-slate-600 text-sm font-medium">
                    返回词汇表
                </button>
                <button
                    onClick={handleSubmit}
                    disabled={!userSubmission.trim() || loading === 'evaluating'}
                    className="px-8 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl flex items-center gap-2 transition-all disabled:opacity-50"
                >
                    {loading === 'evaluating' ? <Loader2 className="animate-spin" /> : <Send className="w-4 h-4" />}
                    提交评估
                </button>
             </div>
        </div>

        {/* Right: Vocab Checklist */}
        <div className="w-72 hidden md:flex flex-col gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex-1 overflow-y-auto">
                <h4 className="font-bold text-slate-700 mb-4 flex items-center gap-2 text-sm uppercase tracking-wide">
                    <TargetIcon className="w-4 h-4 text-primary-500" /> 目标词汇
                </h4>
                <div className="space-y-2">
                    {vocabList.map((v, i) => {
                        const used = checkVocabUsed(v.word);
                        return (
                            <div 
                                key={i} 
                                className={`p-3 rounded-lg border transition-all duration-300 ${
                                    used 
                                    ? 'bg-primary-50 border-primary-200 shadow-sm translate-x-1' 
                                    : 'bg-white border-slate-100 text-slate-500'
                                }`}
                            >
                                <div className="flex justify-between items-center">
                                    <span className={`font-medium ${used ? 'text-primary-800' : 'text-slate-600'}`}>{v.word}</span>
                                    {used && <Check className="w-4 h-4 text-primary-500" />}
                                </div>
                                <div className="text-xs mt-1 opacity-70 truncate">{v.definition}</div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    </div>
  );

  const renderFeedbackStep = () => {
      if (!feedback) return null;
      return (
        <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-8 pb-20">
            {/* Header Score */}
            <div className="bg-slate-900 text-white p-8 rounded-3xl shadow-xl flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="flex items-center gap-4">
                    <div className="p-4 bg-white/10 rounded-full backdrop-blur-sm">
                        <Award className="w-8 h-8 text-yellow-400" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold">评估报告完成</h2>
                        <p className="text-slate-400 text-sm mt-1">{feedback.generalAdvice}</p>
                    </div>
                </div>
                <div className="text-center md:text-right">
                    <div className="text-5xl font-bold font-serif text-primary-400">{feedback.overallScore}</div>
                    <div className="text-xs uppercase tracking-widest text-slate-500 font-bold mt-1">Overall Score</div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Syntax Card */}
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2">
                            <Anchor className="w-5 h-5 text-blue-500" /> 句法逻辑
                        </h3>
                        <span className="font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-lg text-sm">{feedback.syntax.score}/100</span>
                    </div>
                    <p className="text-slate-600 text-sm mb-4 leading-relaxed">{feedback.syntax.comment}</p>
                    {feedback.syntax.examples.length > 0 && (
                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                            <div className="text-xs font-bold text-slate-400 uppercase mb-2">建议优化:</div>
                            <ul className="space-y-2">
                                {feedback.syntax.examples.map((ex, i) => (
                                    <li key={i} className="text-xs text-slate-700 italic border-l-2 border-blue-300 pl-2">{ex}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>

                {/* Lexicon Card */}
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-center mb-4">
                         <h3 className="font-bold text-slate-800 flex items-center gap-2">
                            <BookOpen className="w-5 h-5 text-purple-500" /> 词汇精度
                        </h3>
                        <span className="font-bold text-purple-600 bg-purple-50 px-2 py-1 rounded-lg text-sm">{feedback.lexicon.score}/100</span>
                    </div>
                    <p className="text-slate-600 text-sm mb-4 leading-relaxed">{feedback.lexicon.comment}</p>
                    <div className="space-y-2">
                        {feedback.lexicon.vocabUsageCheck.slice(0, 3).map((v, i) => (
                             <div key={i} className={`text-xs flex justify-between p-2 rounded ${v.usedCorrectly ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                                <span>{v.word}</span>
                                <span>{v.usedCorrectly ? 'OK' : 'Issue'}</span>
                             </div>
                        ))}
                         {feedback.lexicon.vocabUsageCheck.length > 3 && (
                             <div className="text-xs text-center text-slate-400">+ more details below</div>
                         )}
                    </div>
                </div>

                {/* Grammar Card */}
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2">
                            <Lightbulb className="w-5 h-5 text-amber-500" /> 语法细节
                        </h3>
                        <span className="font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-lg text-sm">{feedback.grammar.score}/100</span>
                    </div>
                    <p className="text-slate-600 text-sm mb-4 leading-relaxed">{feedback.grammar.comment}</p>
                    {feedback.grammar.corrections.length > 0 ? (
                        <div className="space-y-2">
                            {feedback.grammar.corrections.slice(0, 2).map((c, i) => (
                                <div key={i} className="text-xs bg-red-50/50 p-2 rounded border border-red-50">
                                    <span className="line-through text-red-400 mr-2">{c.original}</span>
                                    <span className="text-green-600 font-medium">{c.correction}</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-xs text-green-600 flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" /> No fossilized errors found!
                        </div>
                    )}
                </div>
            </div>
            
            <div className="flex justify-center pt-8">
                 <button 
                    onClick={handleReset}
                    className="px-8 py-3 bg-white hover:bg-slate-50 text-slate-700 font-bold rounded-xl border border-slate-200 flex items-center gap-2 shadow-sm transition-all"
                >
                    <RefreshCw className="w-4 h-4" /> 开启新的练习
                </button>
            </div>
        </div>
      );
  };

  // Main Render Switch
  return (
    <div className="w-full min-h-full">
        {step === 'TOPIC' && renderTopicStep()}
        {step === 'VOCAB' && renderVocabStep()}
        {step === 'WRITING' && renderWritingStep()}
        {step === 'FEEDBACK' && renderFeedbackStep()}

        {error && (
            <div className="fixed bottom-6 right-6 bg-red-50 text-red-600 px-4 py-3 rounded-xl border border-red-100 shadow-lg flex items-center gap-2 animate-in slide-in-from-bottom">
                <AlertCircle className="w-5 h-5" /> {error}
                <button onClick={() => setError(null)} className="ml-2"><XIcon className="w-4 h-4" /></button>
            </div>
        )}
    </div>
  );
};

// Icons needed locally
const TargetIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
);
const XIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M18 6 6 18"/><path d="m6 6 18 18"/></svg>
);