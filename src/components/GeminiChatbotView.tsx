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

const formatChatTime = (lang: 'ar' | 'en') =>
  new Date().toLocaleTimeString(lang === 'ar' ? 'ar-SA' : 'en-GB', { hour: '2-digit', minute: '2-digit' });

const buildWelcomeMessage = (lang: 'ar' | 'en', tenantName: string): string =>
  lang === 'ar'
    ? `أهلاً بك في المساعد الذكي لنظام الحضور المدرسي (${tenantName})! أنا جاهز لمساعدتك في:
• صياغة رسائل وإشعارات أولياء الأمور وحلول الغياب المتكرر.
• تحليل لوائح السلوك والمواظبة الوزارية ونسب الحرمان.
• خطط تشجيعية لتحسين نسبة حضور الفصول الدراسية.

كيف يمكنني خدمتك اليوم؟`
    : `Welcome to the smart assistant for the school attendance system (${tenantName})! I'm ready to help you with:
• Drafting guardian messages and notifications, and solutions for chronic absence.
• Analyzing ministry behavior and attendance regulations and denial rates.
• Encouragement plans to improve classroom attendance rates.

How can I help you today?`;

const buildResetMessage = (lang: 'ar' | 'en', title: { titleAr: string; titleEn: string }): string =>
  lang === 'ar'
    ? `تم بدء محادثة جديدة مع ${title.titleAr}. كيف أساعدك؟`
    : `A new conversation with ${title.titleEn} has started. How can I help you?`;

export const GeminiChatbotView: React.FC = () => {
  const { lang, currentTenant } = useAttendance();

  // Role selection
  const [activeRole, setActiveRole] = useState<'counselor' | 'teacher_fast' | 'policy_analyst'>('counselor');

  // Messages state
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      role: 'assistant',
      content: buildWelcomeMessage(lang, currentTenant.name),
      timestamp: formatChatTime(lang),
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

  // Keep the intro assistant message in sync with the active language while no user turn exists yet.
  useEffect(() => {
    setMessages((prev) => {
      if (prev.length !== 1 || prev[0].role !== 'assistant') return prev;
      const isReset = prev[0].id.startsWith('reset-');
      const content = isReset
        ? buildResetMessage(lang, roleConfigs[activeRole])
        : buildWelcomeMessage(lang, currentTenant.name);
      if (prev[0].content === content) return prev;
      return [{ ...prev[0], content, timestamp: formatChatTime(lang) }];
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

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
      descEn: 'Educational counseling, chronic absence solutions, and family-school partnership',
      quickPrompts: [
        'كيف نتعامل مع طالب تجاوز 6 أيام غياب متفرقة دون مبرر؟',
        'صياغة خطاب رسمي ودّي لولي أمر طالب متكرر التأخر الصباحي',
        'ما هي خطوات إحالة الطالب للموجه الطلابي حسب لائحة السلوك والمواظبة؟',
      ],
      quickPromptsEn: [
        'How do we handle a student who exceeded 6 scattered unjustified absence days?',
        'Draft a formal, friendly letter to the guardian of a student with repeated morning tardiness',
        'What are the steps to refer a student to the counselor per the behavior and attendance bylaw?',
      ],
    },
    teacher_fast: {
      titleAr: 'مساعد المعلم السريع للحصص',
      titleEn: 'Fast Teacher Classroom Assistant',
      modelName: 'gemini-2.5-flash',
      icon: <Zap className="w-4 h-4 text-amber-500" />,
      descAr: 'صياغة رسائل SMS سريعة، ملخصات الحصة، نصائح إدارة الوقت',
      descEn: 'Draft quick SMS messages, lesson summaries, and time-management tips',
      quickPrompts: [
        'صغ رسالة SMS موجزة لولي أمر تفيد بغياب الطالب عن الحصة الأولى',
        'رسالة تذكير قصيرة لأولياء الأمور بأهمية حضور الطابور الصباحي غدًا',
        'طريقة سريعة لتفقد الحضور في بداية الحصة خلال دقيقتين فقط',
      ],
      quickPromptsEn: [
        'Write a concise SMS to a guardian noting the student missed the first period',
        'A short reminder to guardians about attending tomorrow morning assembly',
        'A quick way to check attendance at the start of a period in just two minutes',
      ],
    },
    policy_analyst: {
      titleAr: 'المحلل الإحصائي وخبير السياسات',
      titleEn: 'Policy & Attendance Data Analyst',
      modelName: 'gemini-2.5-pro',
      icon: <Brain className="w-4 h-4 text-indigo-600" />,
      descAr: 'تحليل أعمق لاتجاهات الغياب، أيام ما قبل الإجازات، ومبادرات التحفيز',
      descEn: 'Deeper analysis of absence trends, pre-holiday days, and motivation initiatives',
      quickPrompts: [
        'خطة متكاملة لمكافحة ظاهرة الغياب الجماعي في الأسبوع الميت قبل الإجازات',
        'تحليل إحصائي مقترح لقياس ارتباط الحضور بالمستوى التحصيلي للطلاب',
        'تصميم مسابقة الحضور المثالي الشهرية بين فصول المدرسة ومعاييرها',
      ],
      quickPromptsEn: [
        'A comprehensive plan to combat mass absence during the dead week before holidays',
        'A proposed statistical analysis to measure the link between attendance and achievement',
        'Design a monthly perfect-attendance competition between school classes and its criteria',
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
      timestamp: formatChatTime(lang),
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
        throw new Error(lang === 'ar' ? `خطأ من الخادم: ${res.status}` : `Server error: ${res.status}`);
      }

      const data = await res.json();

      const assistantMessage: ChatMessage = {
        id: `msg-reply-${Date.now()}`,
        role: 'assistant',
        content: data.reply || (lang === 'ar' ? 'تمت معالجة الطلب بنجاح.' : 'The request was processed successfully.'),
        timestamp: formatChatTime(lang),
        modelUsed: data.modelUsed || preferredModel,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      console.error('Chat error:', err);
      const errorMessage: ChatMessage = {
        id: `msg-err-${Date.now()}`,
        role: 'assistant',
        content:
          lang === 'ar'
            ? 'عذراً، حدث خطأ أثناء الاتصال بخدمة الذكاء الاصطناعي. يرجى المحاولة مرة أخرى.'
            : 'Sorry, an error occurred while connecting to the AI service. Please try again.',
        timestamp: formatChatTime(lang),
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
        content: buildResetMessage(lang, roleConfigs[activeRole]),
        timestamp: formatChatTime(lang),
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
              {lang === 'ar' ? currentRoleCfg.descAr : currentRoleCfg.descEn}
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
                <span className="hidden sm:inline">
                  {lang === 'ar'
                    ? `${cfg.titleAr.split(' ')[0]} ${cfg.titleAr.split(' ')[1]}`
                    : cfg.titleEn.split(' ').slice(0, 2).join(' ')}
                </span>
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
        {(lang === 'ar' ? currentRoleCfg.quickPrompts : currentRoleCfg.quickPromptsEn).map((prompt, i) => (
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
                  {lang === 'ar' ? 'ج' : 'G'}
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
                    {isAssistant ? (lang === 'ar' ? currentRoleCfg.titleAr : currentRoleCfg.titleEn) : lang === 'ar' ? 'المستخدم' : 'You'}
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
              {lang === 'ar' ? 'ج' : 'G'}
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
