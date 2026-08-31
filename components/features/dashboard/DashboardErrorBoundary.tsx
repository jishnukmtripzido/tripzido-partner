"use client";

import { Component, type ReactNode } from "react";

interface DashboardErrorBoundaryProps {
  children: ReactNode;
  fallback: (props: { error: Error; retry: () => void }) => ReactNode;
  // Bump this (e.g. a counter) to clear a caught error and retry rendering
  // children — mirrors react-error-boundary's `resetKeys`.
  resetKey?: unknown;
}

interface DashboardErrorBoundaryState {
  error: Error | null;
}

export class DashboardErrorBoundary extends Component<
  DashboardErrorBoundaryProps,
  DashboardErrorBoundaryState
> {
  state: DashboardErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: unknown): DashboardErrorBoundaryState {
    return { error: error instanceof Error ? error : new Error(String(error)) };
  }

  componentDidUpdate(prevProps: DashboardErrorBoundaryProps) {
    if (this.state.error && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ error: null });
    }
  }

  retry = () => this.setState({ error: null });

  render() {
    const { error } = this.state;
    if (error) return this.props.fallback({ error, retry: this.retry });
    return this.props.children;
  }
}
