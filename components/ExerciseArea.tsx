import React, { useState } from 'react';
import { VocabularyItem, WritingFeedback, LoadingState } from '../types';
import { getTopicSuggestions, generateVocabulary, evaluateWriting } from '../services/geminiService';
import { ArrowRight, RefreshCw, Send, CheckCircle, AlertCircle, Loader2, Sparkles, BookOpen, PenTool, Lightbulb, Check, Award, Anchor, Keyboard, BrainCircuit } from 'lucide-react';

interface ExerciseAreaProps {
  apiKey: string;
  mode: any;
  topic: string;
  setTopic: (t: string) => void;
  level: string;
}

type Step = 'TOPIC' | 'PREP_MODE' | 'MANUAL_INPUT' | 'VOCAB_REVIEW' | 'WRITING' | 'FEEDBACK';

export const ExerciseArea: React.FC<ExerciseAreaProps> = ({ apiKey, mode, topic, setTopic, level }) => {
  const [step, setStep] = useState<Step>('TOPIC');
  const [loading, setLoading] = useState<LoadingState>('idle');
  const [error, setError] = useState<string | null>(null);

  // Data States
  const [suggestedTopics, setSuggestedTopics] = useState<string[]>([]);
  const [vocabList, setVocabList] = useState<VocabularyItem[]>([]);
  const [manualInputText, setManualInputText] = useState('');
  const [userSubmission, setUserSubmission] = useState('');
  const [feedback, setFeedback] = useState<WritingFeedback | null>(null);
  
  // Feedback View State
  const [feedbackTab, setFeedbackTab] = useState<'syntax' | 'lexicon' | 'grammar'>('syntax');

  // Reset logic
  const handleReset = () => {
    setStep('TOPIC');
    setVocabList([]);
    setManualInputText('');
    setUserSubmission('');
    setFeedback(null);
    setFeedbackTab('syntax');
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
      setStep('PREP_MODE');
  };

  // Step 2: Prep Mode Logic
  const handleChooseAI = async () => {
      setLoading('generating_vocab');
      setError(null);
      try {
          const vocab = await generateVocabulary(apiKey, topic, level);
          setVocabList(vocab);
          setStep('VOCAB_REVIEW');
      } catch (e) {
          setError("生成词汇失败");
      } finally {
          setLoading('idle');
      }
  };

  const handleChooseManual = () => {
      setStep('MANUAL_INPUT');
  };

  // Step 3 (Manual): Process Input
  const handleManualInputSubmit = () => {
      if (!manualInputText.trim()) return;
      
      // Parse CSV or newlines
      const words = manualInputText.split(/[\n,，]+/).map(w => w.trim()).filter(w => w.length > 0);
      
      if (words.length === 0) {
          setError("请输入至少一个词汇");
          return;
      }

      const items: VocabularyItem[] = words.map(w => ({
          word: w,
          pos: 'Custom',
          definition: 'User defined vocabulary'
      }));

      setVocabList(items);
      setStep('VOCAB_REVIEW');
  };

  // Step 4: Review -> Writing
  const handleStartWriting = () => {
      setStep('WRITING');
  };

  // Step 5: Submission
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

  // --- Renderers ---

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
                        disabled={!topic.trim()}
                        className="px-6 py-3 bg-primary-600 text-white font-bold rounded-xl disabled:opacity-50 hover:bg-primary-700 transition-colors"
                    >
                        <ArrowRight />
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

  const renderPrepModeStep = () => (
      <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-right-4">
         <div className="flex items-center gap-4 mb-6">
            <button onClick={() => setStep('TOPIC')} className="p-2 hover:bg-slate-100 rounded-full text-slate-400">
                <ArrowRight className="w-5 h-5 rotate-180" />
            </button>
            <div>
                <h2 className="text-2xl font-serif font-bold text-slate-800">选择练习模式</h2>
                <p className="text-slate-500">话题：{topic}</p>
            </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <button 
                onClick={handleChooseAI}
                className="flex flex-col items-center text-center p-8 bg-white border border-slate-200 rounded-3xl hover:border-primary-400 hover:shadow-lg transition-all group"
            >
                <div className="w-16 h-16 bg-primary-50 text-primary-600 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    {loading === 'generating_vocab' ? <Loader2 className="w-8 h-8 animate-spin" /> : <BrainCircuit className="w-8 h-8" />}
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">AI 智能推荐</h3>
                <p className="text-slate-500 text-sm leading-relaxed">
                    由 AI 依据 "{topic}" 推荐 10-15 个高阶词汇。适合扩充词汇量，学习地道搭配。
                </p>
            </button>

            <button 
                onClick={handleChooseManual}
                className="flex flex-col items-center text-center p-8 bg-white border border-slate-200 rounded-3xl hover:border-blue-400 hover:shadow-lg transition-all group"
            >
                <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <Keyboard className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">自定义词汇</h3>
                <p className="text-slate-500 text-sm leading-relaxed">
                    输入你自己想要练习的 10-20 个单词。适合复习生词本，进行针对性刻意练习。
                </p>
            </button>
        </div>
      </div>
  );

  const renderManualInputStep = () => (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in">
        <div className="flex items-center gap-4 mb-2">
            <button onClick={() => setStep('PREP_MODE')} className="p-2 hover:bg-slate-100 rounded-full text-slate-400">
                <ArrowRight className="w-5 h-5 rotate-180" />
            </button>
            <div>
                <h2 className="text-2xl font-serif font-bold text-slate-800">输入目标词汇</h2>
                <p className="text-slate-500">请直接粘贴或输入，用逗号或换行分隔。</p>
            </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <textarea 
                value={manualInputText}
                onChange={(e) => setManualInputText(e.target.value)}
                placeholder="e.g., \nserendipity\nephemeral\nresilience\n..."
                className="w-full h-64 p-4 text-lg font-serif border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-100 resize-none"
            />
            <div className="mt-4 flex justify-between items-center">
                <span className="text-sm text-slate-400">
                    建议数量: 10-20 个 (当前识别: {manualInputText.split(/[\n,，]+/).filter(w => w.trim()).length} 个)
                </span>
                <button 
                    onClick={handleManualInputSubmit}
                    disabled={!manualInputText.trim()}
                    className="px-6 py-2.5 bg-slate-900 text-white font-bold rounded-xl disabled:opacity-50 hover:bg-slate-800 transition-colors flex items-center gap-2"
                >
                    确认词汇 <ArrowRight className="w-4 h-4" />
                </button>
            </div>
        </div>
    </div>
  );

  const renderVocabReviewStep = () => (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-right-4">
        <div className="flex items-center gap-4 mb-6">
            <button onClick={() => setStep('PREP_MODE')} className="p-2 hover:bg-slate-100 rounded-full text-slate-400">
                <ArrowRight className="w-5 h-5 rotate-180" />
            </button>
            <div>
                <h2 className="text-2xl font-serif font-bold text-slate-800">词汇库准备就绪</h2>
                <p className="text-slate-500">本次练习将围绕以下 {vocabList.length} 个核心词汇展开：</p>
            </div>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                {vocabList.map((v, i) => (
                    <div key={i} className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:border-primary-200 transition-colors group">
                        <div className="flex justify-between items-baseline mb-1">
                            <span className="font-bold text-lg text-slate-800 break-words">{v.word}</span>
                            <span className="text-xs text-slate-400 italic">{v.pos !== 'Custom' ? v.pos : ''}</span>
                        </div>
                        {v.definition && v.definition !== 'User defined vocabulary' && (
                            <p className="text-sm text-slate-500">{v.definition}</p>
                        )}
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
                <button onClick={() => setStep('VOCAB_REVIEW')} className="text-slate-400 hover:text-slate-600 text-sm font-medium">
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
                                    <span className={`font-medium ${used ? 'text-primary-800' : 'text-slate-600'} break-all`}>{v.word}</span>
                                    {used && <Check className="w-4 h-4 text-primary-500 shrink-0" />}
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

      // Define tabs configuration
      const tabs = [
          { id: 'syntax', label: '句法逻辑', icon: Anchor, color: 'blue', score: feedback.syntax.score, desc: 'Hypotaxis & Logic' },
          { id: 'lexicon', label: '词汇精度', icon: BookOpen, color: 'purple', score: feedback.lexicon.score, desc: 'Precision & Nuance' },
          { id: 'grammar', label: '语法细节', icon: Lightbulb, color: 'amber', score: feedback.grammar.score, desc: 'Articles & Prepositions' },
      ] as const;
      
      return (
        <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-8 pb-20">
            {/* Header Score */}
            <div className="bg-slate-900 text-white p-8 rounded-3xl shadow-xl flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="flex items-center gap-5">
                    <div className="p-4 bg-white/10 rounded-full backdrop-blur-sm">
                        <Award className="w-10 h-10 text-yellow-400" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-bold font-serif">评估报告完成</h2>
                        <p className="text-slate-400 mt-2 max-w-2xl leading-relaxed">{feedback.generalAdvice}</p>
                    </div>
                </div>
                <div className="text-center md:text-right bg-white/5 p-4 rounded-2xl border border-white/10 min-w-[140px]">
                    <div className="text-5xl font-bold font-serif text-primary-400">{feedback.overallScore}</div>
                    <div className="text-xs uppercase tracking-widest text-slate-500 font-bold mt-1">Overall Score</div>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-8 items-start">
                {/* Left Sidebar Selection */}
                <div className="w-full lg:w-80 flex flex-col gap-4">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider px-2">维度分析</h3>
                    {tabs.map(t => {
                        const isActive = feedbackTab === t.id;
                        let activeClasses = '';
                        let iconColor = '';
                        if (t.color === 'blue') { activeClasses = 'bg-blue-50 border-blue-200 ring-1 ring-blue-100'; iconColor = 'text-blue-600'; }
                        if (t.color === 'purple') { activeClasses = 'bg-purple-50 border-purple-200 ring-1 ring-purple-100'; iconColor = 'text-purple-600'; }
                        if (t.color === 'amber') { activeClasses = 'bg-amber-50 border-amber-200 ring-1 ring-amber-100'; iconColor = 'text-amber-600'; }

                        return (
                          <button
                              key={t.id}
                              onClick={() => setFeedbackTab(t.id)}
                              className={`p-4 rounded-2xl border text-left transition-all duration-200 flex items-center justify-between group hover:shadow-md ${
                                  isActive
                                  ? activeClasses
                                  : 'bg-white border-slate-100 hover:border-slate-200 hover:bg-slate-50'
                              }`}
                          >
                             <div className="flex items-center gap-4">
                                 <div className={`p-3 rounded-xl ${isActive ? 'bg-white' : 'bg-slate-100'} ${isActive ? iconColor : 'text-slate-400'}`}>
                                     <t.icon className="w-6 h-6" />
                                 </div>
                                 <div>
                                     <div className={`font-bold text-lg ${isActive ? 'text-slate-800' : 'text-slate-600'}`}>{t.label}</div>
                                     <div className="text-xs text-slate-400 font-medium">{t.desc}</div>
                                 </div>
                             </div>
                             <div className={`text-xl font-bold font-serif ${isActive ? iconColor : 'text-slate-300'}`}>
                                 {t.score}
                             </div>
                          </button>
                        );
                    })}

                    <button 
                        onClick={handleReset}
                        className="mt-4 w-full py-4 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-2xl border border-slate-700 flex justify-center items-center gap-2 shadow-lg shadow-slate-200 transition-all transform active:scale-95"
                    >
                        <RefreshCw className="w-5 h-5" /> 开启新练习
                    </button>
                </div>

                {/* Right Content Area */}
                <div className="flex-1 bg-white p-8 md:p-10 rounded-3xl border border-slate-100 shadow-sm min-h-[600px]">
                    
                    {/* Syntax Content */}
                    {feedbackTab === 'syntax' && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-right-2 duration-300">
                             <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-blue-100 rounded-lg text-blue-600"><Anchor className="w-6 h-6"/></div>
                                <h3 className="text-2xl font-bold text-slate-800">深度句法剖析</h3>
                             </div>
                             
                             <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 leading-relaxed text-slate-700 text-lg">
                                <span className="font-bold text-slate-900 block mb-3 text-sm uppercase tracking-wide">导师点评</span>
                                {feedback.syntax.comment}
                             </div>
                             
                             <div>
                                <h4 className="font-bold text-slate-800 text-xl mb-6 flex items-center gap-2">
                                    <PenTool className="w-5 h-5 text-blue-500" /> 句子重构工坊
                                </h4>
                                {feedback.syntax.examples.length > 0 ? (
                                    <div className="space-y-4">
                                        {feedback.syntax.examples.map((ex, i) => (
                                            <div key={i} className="group relative p-6 rounded-2xl border border-blue-100 bg-white hover:border-blue-300 hover:shadow-md transition-all">
                                                <div className="absolute top-6 left-6 w-8 h-8 flex items-center justify-center bg-blue-600 text-white font-bold rounded-lg text-sm shadow-sm">
                                                    {i + 1}
                                                </div>
                                                <div className="pl-12">
                                                    <div className="text-xs font-bold text-blue-400 uppercase mb-2 tracking-wide">Optimization Suggestion</div>
                                                    <p className="text-slate-700 text-lg font-serif italic leading-relaxed">
                                                        "{ex}"
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-8 text-center bg-green-50 rounded-2xl border border-green-100 text-green-700">
                                        <CheckCircle className="w-8 h-8 mx-auto mb-2" />
                                        太棒了！你的句法结构非常紧凑，没有发现明显的逻辑断裂（Parataxis）。
                                    </div>
                                )}
                             </div>
                        </div>
                    )}

                    {/* Lexicon Content */}
                    {feedbackTab === 'lexicon' && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-right-2 duration-300">
                             <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-purple-100 rounded-lg text-purple-600"><BookOpen className="w-6 h-6"/></div>
                                <h3 className="text-2xl font-bold text-slate-800">词汇精度审计</h3>
                             </div>

                             <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 leading-relaxed text-slate-700 text-lg">
                                <span className="font-bold text-slate-900 block mb-3 text-sm uppercase tracking-wide">导师点评</span>
                                {feedback.lexicon.comment}
                             </div>

                             {/* Lexicon: Collocation Improvements (New) */}
                             {feedback.lexicon.collocationCorrections && feedback.lexicon.collocationCorrections.length > 0 && (
                                <div className="mb-8">
                                    <h4 className="font-bold text-slate-800 text-xl mb-6 flex items-center gap-2">
                                        <Sparkles className="w-5 h-5 text-purple-500" /> 表达升级建议 (Precision Upgrades)
                                    </h4>
                                    <div className="space-y-4">
                                        {feedback.lexicon.collocationCorrections.map((item, i) => (
                                            <div key={i} className="p-5 bg-purple-50 rounded-2xl border border-purple-100">
                                                <div className="flex flex-col md:flex-row md:items-center gap-4 text-lg">
                                                    <div className="flex-1">
                                                        <span className="text-xs font-bold text-slate-400 uppercase block mb-1">Your Version</span>
                                                        <span className="line-through decoration-purple-300 text-slate-500 decoration-2">{item.original}</span>
                                                    </div>
                                                    <ArrowRight className="hidden md:block w-5 h-5 text-purple-300" />
                                                    <div className="flex-1">
                                                        <span className="text-xs font-bold text-purple-600 uppercase block mb-1">Elite Alternative</span>
                                                        <span className="font-bold text-purple-700">{item.betterAlternative}</span>
                                                    </div>
                                                </div>
                                                <div className="mt-3 pt-3 border-t border-purple-200/50 text-sm text-slate-600 italic">
                                                    {item.reason}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                             )}

                             <div>
                                <h4 className="font-bold text-slate-800 text-xl mb-6 flex items-center gap-2">
                                    <TargetIcon className="w-5 h-5 text-slate-400" /> 目标词汇使用报告
                                </h4>
                                <div className="grid grid-cols-1 gap-4">
                                    {feedback.lexicon.vocabUsageCheck.map((v, i) => (
                                        <div key={i} className={`flex items-start gap-4 p-5 rounded-xl border ${v.usedCorrectly ? 'bg-white border-slate-100' : 'bg-red-50/50 border-red-100'}`}>
                                            <div className={`mt-1 w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${v.usedCorrectly ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                                {v.usedCorrectly ? <Check className="w-4 h-4" /> : <XIcon className="w-4 h-4" />}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex justify-between items-center mb-1">
                                                    <span className="font-bold text-lg text-slate-800">{v.word}</span>
                                                    <span className={`text-xs font-bold px-2 py-1 rounded-md ${v.usedCorrectly ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                        {v.usedCorrectly ? 'PRECISE' : 'IMPRECISE'}
                                                    </span>
                                                </div>
                                                {v.comment && (
                                                    <p className={`text-sm mt-1 ${v.usedCorrectly ? 'text-slate-500' : 'text-red-600 font-medium'}`}>
                                                        {v.comment}
                                                    </p>
                                                )}
                                                {!v.usedCorrectly && !v.comment && (
                                                    <p className="text-sm mt-1 text-slate-400 italic">未检测到该词或使用语境不当。</p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                             </div>
                        </div>
                    )}

                    {/* Grammar Content */}
                    {feedbackTab === 'grammar' && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-right-2 duration-300">
                             <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-amber-100 rounded-lg text-amber-600"><Lightbulb className="w-6 h-6"/></div>
                                <h3 className="text-2xl font-bold text-slate-800">顽固语法扫描</h3>
                             </div>

                             <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 leading-relaxed text-slate-700 text-lg">
                                <span className="font-bold text-slate-900 block mb-3 text-sm uppercase tracking-wide">导师点评</span>
                                {feedback.grammar.comment}
                             </div>

                             <div>
                                <h4 className="font-bold text-slate-800 text-xl mb-6 flex items-center gap-2">
                                    <Sparkles className="w-5 h-5 text-amber-500" /> 纠错日志 (冠词 & 介词)
                                </h4>
                                {feedback.grammar.corrections.length > 0 ? (
                                    <div className="overflow-hidden rounded-2xl border border-slate-200">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                                    <th className="p-4 w-1/3">Original (原文)</th>
                                                    <th className="p-4 w-1/3">Correction (修正)</th>
                                                    <th className="p-4 w-1/3">Reason (病因)</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {feedback.grammar.corrections.map((c, i) => (
                                                    <tr key={i} className="bg-white hover:bg-slate-50/50">
                                                        <td className="p-4 text-slate-500 line-through decoration-red-300 decoration-2">{c.original}</td>
                                                        <td className="p-4 text-green-700 font-bold bg-green-50/30">{c.correction}</td>
                                                        <td className="p-4 text-slate-600 text-sm">{c.reason}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="p-8 text-center bg-green-50 rounded-2xl border border-green-100 text-green-700">
                                        <CheckCircle className="w-8 h-8 mx-auto mb-2" />
                                        完美！这篇练习中没有发现明显的冠词或介词错误。
                                    </div>
                                )}
                             </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
      );
  };

  // Main Render Switch
  return (
    <div className="w-full min-h-full">
        {step === 'TOPIC' && renderTopicStep()}
        {step === 'PREP_MODE' && renderPrepModeStep()}
        {step === 'MANUAL_INPUT' && renderManualInputStep()}
        {step === 'VOCAB_REVIEW' && renderVocabReviewStep()}
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