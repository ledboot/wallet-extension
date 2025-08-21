import React from 'react';
import { MdError, MdRefresh, MdHome } from 'react-icons/md';

interface ErrorBoundaryProps {
  children?: React.ReactNode;
  errorTitle?: string;
  errorMessage?: string;
  homeButtonText?: string;
  refreshButtonText?: string;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps> {
  state: {
    hasError: boolean;
    errorInfo?: string;
  } = {
    hasError: false,
    errorInfo: undefined
  };

  static defaultProps = {
    errorTitle: '哎呀！出现了一些问题',
    errorMessage: '我们遇到了一个意外错误。请尝试返回或刷新页面。',
    homeButtonText: '返回首页',
    refreshButtonText: '刷新页面'
  };

  constructor(props: ErrorBoundaryProps) {
    super(props);
  }

  static getDerivedStateFromError(error: Error) {
    return {
      hasError: true,
      errorInfo: error.message || '发生了一个意外错误'
    };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('ErrorBoundary捕获到错误:', error, info);
    this.setState({
      hasError: true,
      errorInfo: error.message || '发生了一个意外错误'
    });
  }

  navigateHome = () => {
    try {
      window.location.href = 'index.html';
    } catch (e) {
      window.location.replace('index.html');
    }
  };

  refreshPage = () => {
    try {
      window.location.reload();
    } catch (e) {
      window.location.href = 'index.html';
    }
  };

  render() {
    const { errorTitle, errorMessage, homeButtonText, refreshButtonText, children } = this.props;
    const { hasError, errorInfo } = this.state;

    if (hasError) {
      return (
        <div className="min-h-screen w-full bg-base-100 flex items-center justify-center p-4">
          <div className="card w-full max-w-md bg-base-200 shadow-xl border border-error/20">
            <div className="card-body items-center text-center p-8">
              <div className="avatar placeholder mb-6">
                <div className="bg-error/10 text-error rounded-full w-20 h-20 flex items-center justify-center">
                  <MdError size={48} className="animate-pulse" />
                </div>
              </div>

              <div className="space-y-4 w-full">
                <h2 className="card-title text-2xl font-bold text-base-content justify-center">
                  {errorTitle}
                </h2>
                <p className="text-base-content/70 text-sm leading-relaxed">
                  {errorMessage}
                </p>

                {errorInfo && (
                  <div className="collapse collapse-arrow bg-base-300">
                    <input type="checkbox" />
                    <div className="collapse-title text-sm font-medium">
                      查看错误详情
                    </div>
                    <div className="collapse-content">
                      <div className="bg-base-100 rounded-lg p-3 text-xs font-mono text-base-content/60 overflow-auto max-h-32">
                        <code>{errorInfo}</code>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="card-actions justify-center w-full mt-6 space-y-3">
                <button
                  className="btn btn-primary w-full gap-2"
                  onClick={this.navigateHome}
                >
                  <MdHome size={18} />
                  {homeButtonText}
                </button>
                <button
                  className="btn btn-outline w-full gap-2"
                  onClick={this.refreshPage}
                >
                  <MdRefresh size={18} className="group-hover:animate-spin" />
                  {refreshButtonText}
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return children;
  }
}

