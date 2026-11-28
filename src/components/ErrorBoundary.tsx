import { Component, type ErrorInfo, type ReactNode } from 'react'

type Props = { children: ReactNode }
type State = { hasError: boolean; errorMessage: string }

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, errorMessage: '' }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      errorMessage: error?.message ? String(error.message).slice(0, 300) : 'Erreur inconnue dans le navigateur.',
    }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Erreur inattendue dans Kreativa :', error, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="flex min-h-screen items-center justify-center bg-[#12100E] px-5 py-16 text-[#F8F1E8]">
          <section className="w-full max-w-lg rounded-3xl border border-white/10 bg-white/[0.04] p-8 text-center shadow-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#FF6A1F]">KREATIVA</p>
            <h1 className="mt-4 text-2xl font-bold">Une erreur est survenue</h1>
            <p className="mt-3 text-sm leading-6 text-white/65">
              La page n’a pas pu s’afficher correctement. Le détail ci-dessous nous aidera à corriger le problème.
            </p>
            <div className="mt-5 rounded-xl border border-white/10 bg-black/30 p-4 text-left">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#FFB078]">Détail de l’erreur</p>
              <p className="mt-2 break-words font-mono text-xs leading-5 text-white/80">{this.state.errorMessage}</p>
            </div>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-7 rounded-xl bg-[#FF6A1F] px-5 py-3 text-sm font-bold text-[#17110D] transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF6A1F]"
            >
              Recharger Kreativa
            </button>
          </section>
        </main>
      )
    }

    return this.props.children
  }
}
