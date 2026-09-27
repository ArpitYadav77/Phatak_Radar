import { Component } from 'react';

/** Keeps one broken widget from blanking the whole screen. */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('UI error:', error, info?.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="card card-pad stack" role="alert">
        <strong>{this.props.title || 'Something went wrong here.'}</strong>
        <p className="small text-2">The rest of the app still works. Reload to try again.</p>
        <button className="btn btn-sm" style={{ alignSelf: 'flex-start' }} onClick={() => this.setState({ error: null })}>Try again</button>
      </div>
    );
  }
}
