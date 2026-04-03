import React from 'react'
import Link from 'next/link'

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, info) {
    // Log to console in dev; swap for Sentry.captureException(error) in Phase 0.3
    console.error('[PFC Error Boundary]', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-black px-6 text-center text-white font-sans">
          <p className="text-sm font-medium uppercase tracking-widest text-gray-500 mb-4">
            Something went wrong
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-[#F5F5F7] sm:text-4xl">
            Unexpected error
          </h1>
          <p className="mt-4 max-w-sm text-base text-gray-400">
            A part of the page crashed. Refresh to try again, or head back home.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={() => this.setState({ hasError: false })}
              className="rounded-full bg-white px-6 py-2.5 text-sm font-semibold text-black transition hover:bg-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
            >
              Try Again
            </button>
            <Link
              href="/"
              className="rounded-full border border-white/20 px-6 py-2.5 text-sm font-semibold text-white transition hover:border-white/40 hover:bg-white/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
            >
              Go Home
            </Link>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
