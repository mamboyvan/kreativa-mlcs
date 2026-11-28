import { useMemo, useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search, SlidersHorizontal, X } from 'lucide-react'
import { useStore } from '../lib/store'
import { Badge, Btn, Empty, Section } from '../components/ui'
import ProductCard from '../components/ProductCard'
import { CATEGORIES } from '../lib/constants'
import { fcfa } from '../lib/format'
import { track } from '../lib/analytics'

const sansAccent = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')

export default function Catalogue() {
  const { db } = useStore()
  const [params, setParams] = useSearchParams()
  const [q, setQ] = useState(params.get('q') ?? '')
  const [cat, setCat] = useState(params.get('cat') ?? '')
  const [prixMax, setPrixMax] = useState(50000)
  const [tri, setTri] = useState('populaire')
  const [filtres, setFiltres] = useState(false)

  useEffect(() => {
    setQ(params.get('q') ?? '')
    setCat(params.get('cat') ?? '')
  }, [params])

  const resultats = useMemo(() => {
    const t = sansAccent(q.trim())
    let list = db.products.filter((p) => p.statut === 'publie')
    if (t) list = list.filter((p) => sansAccent(p.titre + ' ' + p.description).includes(t))
    if (cat) list = list.filter((p) => p.categorie === cat)
    list = list.filter((p) => p.prix <= prixMax)
    if (tri === 'populaire') list = [...list].sort((a, b) => b.ventes - a.ventes)
    if (tri === 'recent') list = [...list].sort((a, b) => b.createdAt - a.createdAt)
    if (tri === 'prix_asc') list = [...list].sort((a, b) => a.prix - b.prix)
    if (tri === 'prix_desc') list = [...list].sort((a, b) => b.prix - a.prix)
    return list
  }, [db.products, q, cat, prixMax, tri])

  const appliquer = (nq: string, ncat: string) => {
    const next: Record<string, string> = {}
    if (nq) next.q = nq
    if (ncat) next.cat = ncat
    setParams(next, { replace: true })
  }

  useEffect(() => {
    const terme = (params.get('q') ?? '').trim()
    if (!terme) return
    const t = window.setTimeout(() => {
      track('recherche', { meta: { terme: terme.slice(0, 60), resultats: resultats.length, categorie: cat || 'toutes' } })
    }, 400)
    return () => window.clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.get('q'), cat])

  return (
    <Section className="py-12">
      <div className="mb-8">
        <Badge tone="accent">Catalogue</Badge>
        <h1 className="mt-4 text-4xl font-extrabold sm:text-5xl">Produits numériques</h1>
        <p className="mt-2 text-cream/55">
          {resultats.length} produit{resultats.length > 1 ? 's' : ''} publié{resultats.length > 1 ? 's' : ''} et disponible
          {resultats.length > 1 ? 's' : ''} immédiatement.
        </p>
      </div>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            appliquer(q, cat)
          }}
          className="flex flex-1 items-center gap-3 rounded-full border border-line bg-ink-2/70 px-5 py-3"
        >
          <Search size={17} className="shrink-0 text-cream/40" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Rechercher un titre, un thème, un format…"
            className="w-full bg-transparent text-[15px] placeholder:text-cream/30"
          />
          {q && (
            <button type="button" onClick={() => { setQ(''); appliquer('', cat) }} className="text-cream/40 hover:text-cream">
              <X size={16} />
            </button>
          )}
        </form>
        <button
          onClick={() => setFiltres((f) => !f)}
          className="flex items-center justify-center gap-2 rounded-full border border-line px-5 py-3 text-sm font-semibold text-cream/75 hover:border-mandarine/50 hover:text-cream"
        >
          <SlidersHorizontal size={16} /> Filtres
        </button>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        <button
          onClick={() => { setCat(''); appliquer(q, '') }}
          className={`rounded-full border px-4 py-1.5 text-[13px] font-semibold transition ${
            !cat ? 'border-mandarine bg-mandarine text-ink' : 'border-line text-cream/60 hover:text-cream'
          }`}
        >
          Toutes
        </button>
        {CATEGORIES.map((c) => (
          <button
            key={c.id}
            onClick={() => { setCat(c.id); appliquer(q, c.id) }}
            className={`rounded-full border px-4 py-1.5 text-[13px] font-semibold transition ${
              cat === c.id ? 'border-mandarine bg-mandarine text-ink' : 'border-line text-cream/60 hover:text-cream'
            }`}
          >
            {c.emoji} {c.nom}
          </button>
        ))}
      </div>

      {filtres && (
        <div className="mb-8 grid gap-6 rounded-2xl border border-line bg-ink-2/50 p-5 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-[12.5px] font-semibold uppercase tracking-wider text-cream/55">
              Prix maximum : {fcfa(prixMax)}
            </label>
            <input
              type="range" min={0} max={50000} step={500}
              value={prixMax}
              onChange={(e) => setPrixMax(Number(e.target.value))}
              className="w-full accent-[#FF6A1F]"
            />
            <div className="mt-1 flex justify-between text-[11.5px] text-cream/35"><span>0 FCFA</span><span>50 000 FCFA</span></div>
          </div>
          <div>
            <label className="mb-2 block text-[12.5px] font-semibold uppercase tracking-wider text-cream/55">Trier par</label>
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'populaire', l: 'Popularité' },
                { id: 'recent', l: 'Nouveautés' },
                { id: 'prix_asc', l: 'Prix croissant' },
                { id: 'prix_desc', l: 'Prix décroissant' },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTri(t.id)}
                  className={`rounded-full border px-3.5 py-1.5 text-[13px] ${
                    tri === t.id ? 'border-emeraude bg-emeraude/15 text-emeraude-soft' : 'border-line text-cream/60'
                  }`}
                >
                  {t.l}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {resultats.length === 0 ? (
        <Empty
          titre="Aucun produit trouvé"
          texte="Essayez un autre mot-clé, élargissez le prix maximum ou explorez une autre catégorie."
          action={<Btn onClick={() => { setQ(''); setCat(''); setPrixMax(50000); setParams({}, { replace: true }) }}>Réinitialiser les filtres</Btn>}
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {resultats.map((p, i) => <ProductCard key={p.id} p={p} index={i} />)}
        </div>
      )}
    </Section>
  )
}
