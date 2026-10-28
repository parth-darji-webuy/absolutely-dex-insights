"use client";

import { useRouter } from "next/navigation";
import { Component, type ErrorInfo, type ReactNode, startTransition } from "react";
import { Card } from "./Card";

type Props = { title?: ReactNode; subtitle?: ReactNode; className?: string; refresh: () => void; children: ReactNode };
type State = { failed: boolean };

class Boundary extends Component<Props, State> {
  state: State = { failed: false };
  static getDerivedStateFromError(): State {
    return { failed: true };
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Card failed to load:", error.message, info.componentStack);
  }
  retry = () => {
    // Ask the server for fresh data, then try rendering the card again.
    startTransition(() => {
      this.props.refresh();
      this.setState({ failed: false });
    });
  };
  render() {
    if (!this.state.failed) return this.props.children;
    const { title, subtitle, className } = this.props;
    return <Card title={title} subtitle={subtitle} className={className} error="We couldn’t load this card. The rest of the page still works." onRetry={this.retry} />;
  }
}

/**
 * Wrap one card's data in this (inside a Suspense) so a failure shows an error with Retry
 * on that card only, and the rest of the page keeps working.
 */
export function CardBoundary(props: Omit<Props, "refresh">) {
  const router = useRouter();
  return <Boundary {...props} refresh={() => router.refresh()} />;
}
