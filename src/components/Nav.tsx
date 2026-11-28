import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { Menu, X, ShoppingBag, User2, LogOut, LayoutDashboard, Shield, Search } from 'lucide-react'
import { useStore } from '../lib/store'
import { Btn, Logo } from './ui'
import { initiales } from '../lib/format'

export default function Nav() {
  const { user, panier, deconnecter, maBoutique } = useStore()
  const [ouvert, setOuvert] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [q, setQ] = useState('')
  const loc = useLocation()
  const nav = useNavigate()

  useEffect(() => setOuvert(false), [loc.pathname])
  useEffect(() => {
    const f = () => setScrolled(window.scrollY > 12)
    f()
    window.addEventListener('scroll', f)
    return () => window.removeEventListener('scroll', f)
  }, [])

  const liens = [
    { to: '/', label: 'Accueil' },
    { to: '/produits', label: 'Produits' },
    { to: '/boutiques', label: 'Boutiques' },
    { to: '/aide', label: 'Aide' },
  ]

  const espace = user?.role === 'admin' ? '/admin' : user?.role === 'vendeur' ? '/vendeur' : '/compte'

  return (
    <header
      className={`sticky top-0 z-50 border-b transition-all duration-300 ${
        scrolled ? 'border-line bg-ink/85 backdrop-blur-xl' : 'border-transparent bg-transparent'
      }`}
    >
      <div className="mx-auto flex h-[70px] max-w-7xl items-center gap-4 px-5 sm:px-7">
        <Link to="/" className="shrink-0">
          <Logo size="sm" />
        </Link>

        <nav className="ml-4 hidden items-center gap-1 lg:flex">
          {liens.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                `rounded-full px-3.5 py-2 text-sm font-medium transition ${
                  isActive ? 'bg-cream/8 text-cream' : 'text-cream/60 hover:text-cream'
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            nav(`/produits?q=${encodeURIComponent(q)}`)
          }}
          className="ml-auto hidden flex-1 max-w-xs items-center gap-2 rounded-full border border-line bg-ink-2/80 px-3.5 py-2 md:flex"
        >
          <Search size={15} className="text-cream/40" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Rechercher un produit…"
            className="w-full bg-transparent text-sm text-cream placeholder:text-cream/35"
          />
        </form>

        <div className="ml-auto flex items-center gap-2 md:ml-0">
          <Link to="/panier" className="relative rounded-full p-2.5 text-cream/70 transition hover:bg-cream/5 hover:text-cream">
            <ShoppingBag size={19} />
            {panier.length > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-[17px] min-w-[17px] items-center justify-center rounded-full bg-mandarine px-1 text-[10px] font-bold text-ink">
                {panier.length}
              </span>
            )}
          </Link>

          {user ? (
            <div className="hidden items-center gap-2 md:flex">
              <Link
                to={espace}
                className="flex items-center gap-2 rounded-full border border-line bg-ink-2 py-1.5 pl-1.5 pr-4 transition hover:border-mandarine/50"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-mandarine text-[11px] font-bold text-ink">
                  {initiales(user.nom)}
                </span>
                <span className="text-[13px] font-semibold">{user.nom.split(' ')[0]}</span>
              </Link>
              <button onClick={deconnecter} title="Se déconnecter" className="rounded-full p-2.5 text-cream/50 hover:bg-cream/5 hover:text-cream">
                <LogOut size={17} />
              </button>
            </div>
          ) : (
            <div className="hidden items-center gap-2 md:flex">
              <Btn to="/connexion" variant="ghost" size="sm">Connexion</Btn>
              <Btn to="/inscription" variant="primary" size="sm">Créer ma boutique</Btn>
            </div>
          )}

          <button onClick={() => setOuvert((o) => !o)} className="rounded-full p-2.5 text-cream lg:hidden">
            {ouvert ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {ouvert && (
        <div className="border-t border-line bg-ink/97 px-5 pb-6 pt-4 backdrop-blur-xl lg:hidden">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              nav(`/produits?q=${encodeURIComponent(q)}`)
            }}
            className="mb-4 flex items-center gap-2 rounded-full border border-line bg-ink-2 px-4 py-2.5"
          >
            <Search size={16} className="text-cream/40" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher…" className="w-full bg-transparent text-sm" />
          </form>
          <div className="flex flex-col gap-1">
            {liens.map((l) => (
              <NavLink key={l.to} to={l.to} className="rounded-xl px-3 py-2.5 text-[15px] font-medium text-cream/80 hover:bg-cream/5">
                {l.label}
              </NavLink>
            ))}
            {user ? (
              <>
                <NavLink to={espace} className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-[15px] font-medium text-cream/80 hover:bg-cream/5">
                  {user.role === 'admin' ? <Shield size={16} /> : user.role === 'vendeur' ? <LayoutDashboard size={16} /> : <User2 size={16} />}
                  Mon espace
                </NavLink>
                {user.role === 'vendeur' && maBoutique() && (
                  <NavLink to={`/boutique/${maBoutique()!.slug}`} className="rounded-xl px-3 py-2.5 text-[15px] text-cream/80 hover:bg-cream/5">
                    Voir ma boutique
                  </NavLink>
                )}
                <button onClick={deconnecter} className="mt-2 rounded-xl px-3 py-2.5 text-left text-[15px] text-red-300 hover:bg-red-500/10">
                  Se déconnecter
                </button>
              </>
            ) : (
              <div className="mt-3 flex flex-col gap-2">
                <Btn to="/connexion" variant="outline" full>Connexion</Btn>
                <Btn to="/inscription" variant="primary" full>Créer ma boutique</Btn>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
