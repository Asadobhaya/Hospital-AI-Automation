// src/components/ErrorBoundary.jsx — Fault-Tolerant React Clinical Error Boundary
import React, { Component } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import Button from './Button';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error('ErrorBoundary caught an unhandled clinical render error:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          role="alert"
          aria-live="assertive"
          className="min-h-screen bg-[#F5F8FC] flex items-center justify-center p-4 sm:p-6"
        >
          <div className="card-surface max-w-lg w-full p-6 sm:p-8 rounded-2xl shadow-lg border border-[#DFE6EE] text-center">
            <div
              className="w-14 h-14 rounded-2xl bg-[#FDECEC] text-[#B42318] border border-[#B42318]/20 flex items-center justify-center mx-auto mb-4"
              aria-hidden="true"
            >
              <AlertTriangle className="w-7 h-7" />
            </div>

            <h1 className="text-xl font-bold text-[#172B3A] tracking-tight">
              Clinical Workspace Interrupted
            </h1>
            <p className="text-sm text-[#4B5D6B] mt-2 leading-relaxed">
              An unexpected interface render issue occurred in this session. Patient records and backend databases remain completely unaffected.
            </p>

            {this.state.error && (
              <div className="mt-4 p-3 bg-[#F5F8FC] rounded-xl border border-[#DFE6EE] text-left text-xs font-mono text-[#617181] overflow-x-auto max-h-32">
                <p className="font-semibold text-[#B42318]">{this.state.error.toString()}</p>
              </div>
            )}

            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button
                variant="secondary"
                size="md"
                onClick={this.handleReload}
                icon={RefreshCw}
                className="w-full sm:w-auto"
              >
                Reload Dashboard
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={this.handleReset}
                icon={Home}
                className="w-full sm:w-auto"
              >
                Return to Overview
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
