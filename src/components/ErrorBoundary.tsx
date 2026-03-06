import { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCcw } from "lucide-react";
import { glassPanelStrong, goldChromeLine } from "@/lib/glass-styles";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center nebula-bg p-4">
          <div 
            className="max-w-md w-full rounded-2xl p-8 text-center relative overflow-hidden"
            style={glassPanelStrong}
          >
            <div className="absolute top-0 left-6 right-6 h-px" style={goldChromeLine} />
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center border border-destructive/20">
                <AlertTriangle className="w-8 h-8 text-destructive" />
              </div>
            </div>
            <h1 className="text-xl font-bold text-foreground mb-2 font-display">System Malfunction</h1>
            <p className="text-sm text-muted-foreground mb-6 font-mono">
              The observatory encountered a critical error.
              <br />
              <span className="text-xs opacity-70 mt-2 block bg-black/20 p-2 rounded border border-white/5">
                {this.state.error?.message}
              </span>
            </p>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-semibold btn-gold shine-sweep"
            >
              <RefreshCcw className="w-3.5 h-3.5" />
              Reinitialize System
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
