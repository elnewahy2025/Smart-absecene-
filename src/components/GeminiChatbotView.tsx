import React, { useState, useRef, useEffect } from 'react';
import { useAttendance } from '../context/AttendanceContext';
import { authenticatedFetch } from '../lib/api';
import {
  MessageSquare,
  Send,
  Sparkles,
  Zap,
  Brain,
  Trash2,
  User,
  CheckCircle,
  Copy,
  Clock,
  BookOpen,
} from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  modelUsed?: string;
}

export const GeminiChatbotView: React.FC = () => {
  const { lang, currentTenant } = useAttendance();

  // Role selection
  const [activeRole, setActiveRole] = useState<'counselor' | 'teacher_fast' | 'policy_analyst'>('counselor');

  // Messages state
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      role: 'assistant',
      content: `أهلاً بك في المساعد الذكي لنظام الحضور المدرسي (${currentTenant.name})! أنا جاهز لمساعدتك في:
• صياغة رسائل وإشعارات أولياء الأمور وحلول الغياب المتكرر.
• تحليل لوائح السلوك والمواظبة الوزارية ونسب الحرمان.
• خطط تشجيعية لتحسين نسبة حضور الفصول الدراسية.

كيف يمكنني خدمتك اليوم؟`,
      timestamp: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }),
      modelUsed: 'gemini-2.5-flash',
    },
  ]);

  const [inputPrompt, setInputPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Model preference mapped per role:
  // - gemini-2.5-pro for complex policy analysis and strategic planning
  // - gemini-2.5-flash for general counselor tasks
  // - gemini-2.5-flash for rapid SMS & classroom speed
  const getModelPreference = (role: string) => {
    if (role === 'teacher_fast') return 'gemini-2.5-flash';
    if (role === 'policy_analyst') return 'gemini-2.5-pro';
    return 'gemini-2.5-flash';
  };

  const roleConfigs = {
    counselor: {
      titleAr: 'المستشار المدرسي والتوجيه الطلابي',
      titleEn: 'Academic & Guidance Counselor',
      modelName: 'gemini-2.5-flash',
      icon: <BookOpen className="w-4 h-4 text-emerald-600" />,
      descAr: 'استشارات تربوية، حلول الغياب المتكرر، وشراكة الأسرة مع المدرسة',
      quickPrompts: [
        'كيف نتعامل مع طالب تجاوز 6 أيام غياب متفرقة دون مبرر؟',
        'صياغة خطاب رسمي ودّي لولي أمر طالب متكرر التأخر الصباحي',
        'ما هي خطوات إحالة الطالب للموجه الطلابي حسب لائحة السلوك والمواظبة؟',
      ],
    },
    teacher_fast: {
      titleAr: 'مساعد المعلم السريع للحصص',
      titleEn: 'Fast Teacher Classroom Assistant',
      modelName: 'gemini-2.5-flash',
      icon: <Zap className="w-4 h-4 text-amber-500" />,
      descAr: 'صياغة رسائل SMS سريعة، ملخصات الحصة، نصائح إدارة الوقت',
      quickPrompts: [
        'صغ رسالة SMS موجزة لولي أمر تفيد بغياب الطالب عن الحصة الأولى',
        'رسالة تذكير قصيرة لأولياء الأمور بأهمية حضور الطابور الصباحي غدًا',
        'طريقة سريعة لتفقد الحضور في بداية الحصة خلال دقيقتين فقط',
      ],
    },
    policy_analyst: {
      titleAr: 'المحلل الإحصائي وخبير السياسات',
      titleEn: 'Policy & Attendance Data Analyst',
      modelName: 'gemini-2.5-pro',
      icon: <Brain className="w-4 h-4 text-indigo-600" />,
      descAr: 'تحليل أعمق لاتجاهات الغياب، أيام ما قبل الإجازات، ومبادرات التحفيز',
      quickPrompts: [
        'خطة متكاملة لمكافحة ظاهرة الغياب الجماعي في الأسبوع الميت قبل الإجازات',
        'تحليل إحصائي مقترح لقياس ارتباط الحضور بالمستوى التحصيلي للطلاب',
        'تصميم مسابقة الحضور المثالي الشهرية بين فصول المدرسة ومعاييرها',
      ],
    },
  };

  const handleSendMessage = async (customText?: string) => {
    const textToSend = customText || inputPrompt;
    if (!textToSend.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }),
    };

    // Optimistically add user message
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInputPrompt('');
    setIsLoading(true);

    try {
      const preferredModel = getModelPreference(activeRole);
      const res = await authenticatedFetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMessages.map((m) => ({ role: m.role, content: m.content })),
          role: activeRole,
          modelPreference: preferredModel,
        }),
      });

      if (!res.ok) {
        throw new Error(`خطأ من الخادم: ${res.status}`);
      }

      const data = await res.json();

      const assistantMessage: ChatMessage = {
        id: `msg-reply-${Date.now()}`,
        role: 'assistant',
        content: data.reply || 'تمت معالجة الطلب بنجاح.',
        timestamp: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }),
        modelUsed: data.modelUsed || preferredModel,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      console.error('Chat error:', err);
      const errorMessage: ChatMessage = {
        id: `msg-err-${Date.now()}`,
        role: 'assistant',
        content: 'عذراً، حدث خطأ أثناء الاتصال بخدمة الذكاء الاصطناعي. يرجى المحاولة مرة أخرى.',
        timestamp: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: `reset-${Date.now()}`,
        role: 'assistant',
        content: `تم بدء محادثة جديدة مع ${roleConfigs[activeRole].titleAr}. كيف أساعدك؟`,
        timestamp: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }),
        modelUsed: roleConfigs[activeRole].modelName,
      },
    ]);
  };

  const currentRoleCfg = roleConfigs[activeRole];

  return (
    <div className="gemini-chat-container bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col h-[750px] overflow-hidden">
      {/* Header Bar */}
      <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-sm">
              {lang === 'ar' ? 'المساعد المدرسي الذكي المدعوم بـ Gemini' : 'Gemini School Assistant'}
            </h3>
            <p className="text-[11px] text-slate-500">
              {currentRoleCfg.descAr}
            </p>
          </div>
        </div>

        {/* Role Switcher Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg">
          {(['counselor', 'teacher_fast', 'policy_analyst'] as const).map((rKey) => {
            const cfg = roleConfigs[rKey];
            const active = activeRole === rKey;
            return (
              <button
                key={rKey}
                onClick={() => setActiveRole(rKey)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                  active
                    ? 'bg-white text-slate-900 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {cfg.icon}
                <span className="hidden sm:inline">{cfg.titleAr.split(' ')[0]} {cfg.titleAr.split(' ')[1]}</span>
                <span className="text-[10px] font-mono text-slate-400">({cfg.modelName.replace('gemini-', '')})</span>
              </button>
            );
          })}

          <button
            onClick={handleClearChat}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-md transition-colors ml-1 cursor-pointer"
            title="مسح المحادثة / Clear"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Quick Prompts Bar */}
      <div className="px-4 py-2 border-b border-slate-100 bg-slate-50/40 flex items-center gap-2 overflow-x-auto text-[11px]">
        <span className="text-slate-500 font-semibold shrink-0 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-emerald-600" />
          {lang === 'ar' ? 'اقتراحات سريعة:' : 'Quick:'}
        </span>
        {currentRoleCfg.quickPrompts.map((prompt, i) => (
          <button
            key={i}
            onClick={() => handleSendMessage(prompt)}
            className="gemini-quick-pill bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border border-slate-200 px-2.5 py-1 rounded-full whitespace-nowrap transition-colors cursor-pointer shrink-0 text-[10px]"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Chat Thread Messages */}
      <div className="gemini-chat-thread flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/20">
        {messages.map((msg) => {
          const isAssistant = msg.role === 'assistant';
          return (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${isAssistant ? 'justify-start' : 'justify-end'}`}
            >
              {isAssistant && (
                <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 text-xs font-bold shadow-xs">
                  ج
                </div>
              )}

              <div
                className={`max-w-[85%] md:max-w-[75%] rounded-2xl p-3.5 text-xs sm:text-[13px] leading-relaxed shadow-xs ${
                  isAssistant
                    ? 'gemini-assistant-bubble bg-white border border-slate-200 text-slate-800 rounded-tr-xs'
                    : 'gemini-user-bubble bg-slate-900 text-white rounded-tl-xs'
                }`}
              >
                {/* Message Header info */}
                <div className="flex items-center justify-between gap-4 mb-1.5 pb-1 border-b border-slate-100/30 text-[10px] opacity-75">
                  <span className="font-semibold">
                    {isAssistant ? currentRoleCfg.titleAr : lang === 'ar' ? 'المستخدم' : 'You'}
                  </span>
                  <div className="flex items-center gap-1.5 font-mono">
                    {msg.modelUsed && (
                      <span className="bg-emerald-50 text-emerald-700 px-1.5 py-0.2 rounded border border-emerald-200">
                        {msg.modelUsed}
                      </span>
                    )}
                    <span>{msg.timestamp}</span>
                  </div>
                </div>

                {/* Message Body */}
                <div className="whitespace-pre-wrap">{msg.content}</div>

                {/* Copy button for assistant responses */}
                {isAssistant && (
                  <div className="mt-2 pt-1 border-t border-slate-100 flex items-center justify-end">
                    <button
                      onClick={() => handleCopyMessage(msg.id, msg.content)}
                      className="text-[10px] text-slate-400 hover:text-slate-700 flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      {copiedId === msg.id ? (
                        <>
                          <CheckCircle className="w-3 h-3 text-emerald-600" />
                          <span className="text-emerald-600">{lang === 'ar' ? 'تم النسخ' : 'Copied'}</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>{lang === 'ar' ? 'نسخ النص' : 'Copy'}</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>

              {!isAssistant && (
                <div className="w-7 h-7 rounded-lg bg-slate-800 text-white flex items-center justify-center shrink-0 text-xs shadow-xs">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-start gap-3 justify-start">
            <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 text-xs font-bold animate-pulse">
              ج
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl rounded-tr-xs p-3 text-xs text-slate-500 shadow-xs flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-600 animate-bounce" />
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-600 animate-bounce [animation-delay:0.2s]" />
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-600 animate-bounce [animation-delay:0.4s]" />
              <span className="font-medium mr-1">
                {lang === 'ar' ? `جارٍ التفكير وصياغة الرد بنموذج ${currentRoleCfg.modelName}...` : 'Generating response...'}
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input Bar */}
      <div className="p-3 border-t border-slate-200 bg-white">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            disabled={isLoading}
            placeholder={
              lang === 'ar'
                ? `اسأل ${currentRoleCfg.titleAr}... (مثال: صغ رسالة اعتذار، خطوات إنذار الغياب)`
                : `Ask ${currentRoleCfg.titleEn}...`
            }
            className="flex-1 bg-slate-50 border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:outline-hidden disabled:opacity-50"
          />

          <button
            type="submit"
            disabled={isLoading || !inputPrompt.trim()}
            className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold p-2.5 rounded-xl transition-colors cursor-pointer shadow-xs shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
