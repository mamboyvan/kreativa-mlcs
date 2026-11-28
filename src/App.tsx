import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { lazy, Suspense, useEffect, type ReactNode } from 'react'
import { StoreProvider, useStore } from './lib/store'
import { ToastProvider } from './components/Toast'
import Nav from './components/Nav'
import Footer from './components/Footer'
import Assistant from './components/Assistant'
import Protected from './components/Protected'
import { Btn, Section } from './components/ui'
import { demarrerBattement, track } from './lib/analytics'

// Charger chaque page uniquement quand elle est demandée.
// Cela évite de télécharger toute l'application avant le premier affichage.
const Home = lazy(() => import('./pages/Home'))
const Catalogue = lazy(() => import('./pages/Catalogue'))
const Produit = lazy(() => import('./pages/Produit'))
const Boutiques = lazy(() => import('./pages/Boutiques'))
const BoutiquePublique = lazy(() => import('./pages/BoutiquePublique'))
const Connexion = lazy(() => import('./pages/Connexion'))
const Inscription = lazy(() => import('./pages/Inscription'))
const MotDePasse = lazy(() => import('./pages/MotDePasse'))
const Panier = lazy(() => import('./pages/Panier'))
const CommandePage = lazy(() => import('./pages/Commande'))
const Compte = lazy(() => import('./pages/Compte'))
const CreerBoutique = lazy(() => import('./pages/CreerBoutique'))
const Vendeur = lazy(() => import('./pages/Vendeur'))
const Admin = lazy(() => import('./pages/Admin'))
const Aide = lazy(() => import('./pages/Aide'))

function HautDePage() {
  const { pathname } = useLocation()
  useEffect(() => window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior }), [pathname])
  useEffect(() => {
    // Le suivi statistique ne doit jamais empêcher l'ouverture d'une page.
    try {
      demarrerBattement()
      track('page_vue', { chemin: pathname })
    } catch (error) {
      console.warn('Suivi statistique indisponible :', error)
    }
  }, [pathname])
  return null
}

function Attente({ children }: { children: ReactNode }) {
  const { pret } = useStore()
  if (!pret)
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-line border-t-mandarine" />
          <p className="mt-4 text-sm text-cream/40">Préparation de KREATIVA…</p>
        </div>
      </div>
    )
  return <>{children}</>
}

function ChargementPage() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="text-center" role="status" aria-live="polite">
        <div className="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-line border-t-mandarine" />
        <p className="mt-4 text-sm text-cream/55">Ouverture de la page…</p>
      </div>
    </div>
  )
}

function Introuvable() {
  return (
    <Section className="flex min-h-[60vh] flex-col items-center justify-center py-24 text-center">
      <p className="display text-7xl font-extrabold text-mandarine">404</p>
      <h1 className="mt-4 text-3xl font-extrabold">Page introuvable</h1>
      <p className="mt-2 max-w-md text-cream/55">Cette page n’existe pas ou a été déplacée. Reprenons depuis l’accueil.</p>
      <div className="mt-7 flex gap-3">
        <Btn to="/">Retour à l’accueil</Btn>
        <Btn to="/produits" variant="outline">Voir le catalogue</Btn>
      </div>
    </Section>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <StoreProvider>
        <ToastProvider>
          <div className="kreativa-grain flex min-h-screen flex-col">
            <HautDePage />
            <Nav />
            <main className="flex-1">
              <Attente>
                <Suspense fallback={<ChargementPage />}>
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/produits" element={<Catalogue />} />
                    <Route path="/produit/:id" element={<Produit />} />
                    <Route path="/boutiques" element={<Boutiques />} />
                    <Route path="/boutique/:slug" element={<BoutiquePublique />} />
                    <Route path="/connexion" element={<Connexion />} />
                    <Route path="/inscription" element={<Inscription />} />
                    <Route path="/mot-de-passe" element={<MotDePasse />} />
                    <Route path="/panier" element={<Panier />} />
                    <Route path="/aide" element={<Aide />} />
                    <Route
                      path="/commande/:id"
                      element={<Protected roles={['acheteur', 'vendeur', 'admin']}><CommandePage /></Protected>}
                    />
                    <Route
                      path="/compte"
                      element={<Protected roles={['acheteur', 'vendeur', 'admin']}><Compte /></Protected>}
                    />
                    <Route
                      path="/creer-boutique"
                      element={<Protected roles={['acheteur', 'vendeur']}><CreerBoutique /></Protected>}
                    />
                    <Route path="/vendeur" element={<Protected roles={['vendeur']}><Vendeur /></Protected>} />
                    <Route path="/admin" element={<Protected roles={['admin']}><Admin /></Protected>} />
                    <Route path="*" element={<Introuvable />} />
                  </Routes>
                </Suspense>
              </Attente>
            </main>
            <Footer />
            <Assistant />
          </div>
        </ToastProvider>
      </StoreProvider>
    </BrowserRouter>
  )
}
