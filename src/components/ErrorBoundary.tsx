import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, LogIn, ShieldAlert } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an unhandled error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  handleResetAuth = () => {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('school_user_authenticated');
    }
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  override render() {
    if (this.state.hasError) {
      const { error, errorInfo } = this.state;
      const isArabic = typeof document !== 'undefined' && document.documentElement.lang !== 'en';

      return (
        <div
          dir={isArabic ? 'rtl' : 'ltr'}
          className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-4 font-['Cairo',sans-serif]"
        >
          <div className="max-w-lg w-full bg-slate-800/95 border border-slate-700/80 rounded-2xl shadow-2xl p-6 sm:p-8 backdrop-blur-md">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-black text-white">
                  {isArabic
                    ? 'حدث خطأ غير متوقع في واجهة النظام'
                    : 'An unexpected application error occurred'}
                </h2>
                <p className="text-xs text-slate-400">
                  {isArabic
                    ? 'بيانات الحضور والغياب والطلاب محفوظة بأمان ولم تتأثر.'
                    : 'Attendance records and student data remain safely saved.'}
                </p>
              </div>
            </div>

            <div className="bg-slate-900/80 border border-slate-700/60 rounded-xl p-3.5 mb-6 text-xs text-slate-300">
              <p className="font-semibold text-rose-300 mb-1 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4" />
                <span>{isArabic ? 'رسالة الخطأ:' : 'Error details:'}</span>
              </p>
              <p className="font-mono text-[11px] text-slate-400 break-words">
                {error?.message || (isArabic ? 'خطأ برمجي أثناء التصيير (Render Error)' : 'Unknown render error')}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={this.handleReload}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors cursor-pointer shadow-sm"
              >
                <RefreshCw className="w-4 h-4" />
                <span>{isArabic ? 'إعادة تحميل الصفحة' : 'Reload Page'}</span>
              </button>

              <button
                type="button"
                onClick={this.handleResetAuth}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                <span>{isArabic ? 'العودة لتسجيل الدخول' : 'Back to Login'}</span>
              </button>
            </div>

            {errorInfo?.componentStack && (
              <details className="mt-4 text-[10px] text-slate-500 cursor-pointer">
                <summary className="hover:text-slate-400 font-semibold">
                  {isArabic ? 'عرض مسار الخطأ الفني (Stack Trace)' : 'Show Technical Stack'}
                </summary>
                <pre className="mt-2 p-2.5 bg-slate-950 rounded-lg overflow-x-auto text-slate-400 font-mono text-[10px] leading-relaxed max-h-40">
                  {errorInfo.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
