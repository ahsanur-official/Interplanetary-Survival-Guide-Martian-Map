import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RotateCcw, Compass, Globe } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('MarsWay Application Error caught by ErrorBoundary:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  private handleResetTo2D = () => {
    try {
      localStorage.setItem('marsway_preferred_view', '2d');
    } catch {}
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="w-screen h-screen bg-[#070a12] text-neutral-100 flex flex-col items-center justify-center p-6 select-none font-sans">
          <div className="max-w-md w-full bg-[#0d1322] border border-orange-500/60 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col items-center text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-orange-950/80 border border-orange-600/70 flex items-center justify-center shadow-lg">
              <Compass className="w-8 h-8 text-orange-400 animate-pulse" />
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-mono tracking-widest uppercase text-orange-400 font-bold px-2 py-0.5 rounded-full bg-orange-950/80 border border-orange-700/50">
                MarsWay Telemetry Recovery
              </span>
              <h2 className="text-xl font-extrabold text-white">Planetary View Recalibration</h2>
              <p className="text-xs text-neutral-400 leading-relaxed">
                A rendering exception was intercepted during surface graphics initialization. You can immediately launch the High-Definition 2D Surface Map or reload.
              </p>
            </div>

            {this.state.error && (
              <div className="w-full bg-black/60 rounded-xl p-3 border border-white/5 text-left">
                <div className="flex items-center gap-1.5 text-rose-400 font-mono text-[11px] font-bold">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{this.state.error.name}: {this.state.error.message}</span>
                </div>
              </div>
            )}

            <div className="w-full flex flex-col sm:flex-row gap-2.5 pt-2">
              <button
                onClick={this.handleResetTo2D}
                className="flex-1 py-2.5 px-4 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-orange-950/60 transition-all cursor-pointer active:scale-95"
              >
                <Globe className="w-4 h-4" />
                <span>Launch 2D Surface Map</span>
              </button>
              <button
                onClick={this.handleReset}
                className="py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-neutral-200 hover:text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reload Platform</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
