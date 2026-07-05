import { Component } from 'react'
import type { ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          gap: '1rem',
          color: '#e8e8e8',
          background: '#0d2117',
          padding: '2rem',
          textAlign: 'center',
        }}>
          <p style={{ fontSize: '1.2rem', fontWeight: 600 }}>Something went wrong</p>
          <p style={{ fontSize: '0.85rem', color: '#667' }}>{this.state.error.message}</p>
          <button
            onClick={() => this.setState({ error: null })}
            style={{ background: '#2a8a50', color: '#fff', padding: '0.6rem 1.2rem', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
          >
            Retry
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
