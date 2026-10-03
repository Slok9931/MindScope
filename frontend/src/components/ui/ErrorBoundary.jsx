import { Component } from "react";
import Icon from "./Icon";
import Button from "./Button";

/** Catches render errors in a subtree so one bad payload never blanks the whole app. */
export default class ErrorBoundary extends Component {
  state = { error: null };
  static getDerivedStateFromError(error) { return { error }; }
  componentDidCatch(error, info) { console.error("UI error:", error, info.componentStack); }
  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="page">
        <div className="error-state">
          <Icon name="alert" size={28} />
          <h3>Something went wrong while drawing this page</h3>
          <p>{String(this.state.error.message || this.state.error)}</p>
          <Button variant="ghost" onClick={() => this.setState({ error: null })} icon={<Icon name="reset" size={16} />}>Try again</Button>
        </div>
      </div>
    );
  }
}
