import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Store, Check } from 'lucide-react'
import { useStore } from '../lib/store'
import { Btn, Field, Area, Panel, Section, Select, Badge } from '../components/ui'
import { useToast } from '../components/Toast'
import { CATEGORIES } from '../lib/constants'
import { slugify } from '../lib/format'

const EMOJIS = ['🚀', '🎨', '📊', '📚', '🎧', '🎬', '💡', '✨', '🛠️', '👑', '🌿', '🔥']
const COULEURS = ['#FF6A1F', '#0E9F6E', '#C9A227', '#2B2A6B', '#B91C1C', '#7C3AED']
const BANNIERES = ['/img/p2.jpg', '/img/p3.jpg', '/img/p5.jpg', '/img/p6.jpg', '/img/p8.jpg', '/img/p4.jpg']

export default function CreerBoutique() {
  const { creerBoutique, maBoutique } = useStore()
  const toast = useToast()
  const nav = useNavigate()
  const existante = maBoutique()

  const [nom, setNom] = useState('')
  const [desc, setDesc] = useState('')
  const [cat, setCat] = useState(CATEGORIES[0].id)
  const [logo, setLogo] = useState(EMOJIS[0])
  const [couleur, setCouleur] = useState(COULEURS[0])
  const [banniere, setBanniere] = useState(BANNIERES[0])
  const [whatsapp, setWhatsapp] = useState('')
  const [erreur, setErreur] = useState('')

  if (existante) return <Navigate to="/vendeur" replace />

  const creer = () => {
    setErreur('')
    if (desc.trim().length < 30) return setErreur('La description doit contenir au moins 30 caractères.')
    const r = creerBoutique({ nom, description: desc, categorie: cat, logo, couleur, banniere, whatsapp })
    if (!r.ok) return setErreur(r.message ?? 'Erreur')
    toast('Votre boutique est en ligne !', 'ok')
    nav('/vendeur')
  }

  return (
    <Section className="py-12">
      <div className="mx-auto max-w-5xl">
        <Badge tone="accent"><Store size={12} /> Nouvelle boutique</Badge>
        <h1 className="mt-4 text-4xl font-extrabold sm:text-5xl">Créer ma boutique</h1>
        <p className="mt-2 max-w-xl text-cream/55">
          Votre vitrine publique sur KREATIVA. Vous pourrez tout modifier plus tard depuis votre espace vendeur.
        </p>

        <div className="mt-9 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <Panel>
            <div className="space-y-5">
              <Field label="Nom de la boutique" value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Awa Digital Academy" hint={nom ? `Adresse publique : kreativa.ci/boutique/${slugify(nom) || '…'}` : undefined} />
              <Area label="Description" rows={5} value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Présentez votre activité, votre expérience et ce que vos clients vont y trouver…" hint={`${desc.length} caractères · 30 minimum`} />
              <Select label="Catégorie principale" value={cat} onChange={(e) => setCat(e.target.value)}>
                {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
              </Select>
              <Field label="WhatsApp (optionnel)" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="+225 07 00 00 00 00" hint="Affiché publiquement pour que vos clients vous contactent." />

              <div>
                <p className="mb-2 text-[12.5px] font-semibold uppercase tracking-wider text-cream/55">Logo</p>
                <div className="flex flex-wrap gap-2">
                  {EMOJIS.map((e) => (
                    <button key={e} onClick={() => setLogo(e)} className={`flex h-11 w-11 items-center justify-center rounded-xl border text-xl transition ${logo === e ? 'border-mandarine bg-mandarine/12' : 'border-line hover:border-cream/25'}`}>
                      {e}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-2 text-[12.5px] font-semibold uppercase tracking-wider text-cream/55">Couleur d’accent</p>
                <div className="flex flex-wrap gap-2">
                  {COULEURS.map((c) => (
                    <button key={c} onClick={() => setCouleur(c)} className={`h-9 w-9 rounded-full border-2 transition ${couleur === c ? 'border-cream' : 'border-transparent'}`} style={{ background: c }} />
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-2 text-[12.5px] font-semibold uppercase tracking-wider text-cream/55">Bannière</p>
                <div className="grid grid-cols-3 gap-2">
                  {BANNIERES.map((b) => (
                    <button key={b} onClick={() => setBanniere(b)} className={`relative h-16 overflow-hidden rounded-xl border-2 transition ${banniere === b ? 'border-mandarine' : 'border-transparent opacity-60 hover:opacity-100'}`}>
                      <img src={b} alt="" className="h-full w-full object-cover" />
                      {banniere === b && <span className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-mandarine text-ink"><Check size={12} /></span>}
                    </button>
                  ))}
                </div>
              </div>

              {erreur && <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-3.5 py-2.5 text-[13.5px] text-red-300">{erreur}</p>}
              <Btn size="lg" full onClick={creer}>Publier ma boutique</Btn>
            </div>
          </Panel>

          <div className="lg:sticky lg:top-24 lg:self-start">
            <p className="mb-3 text-[12.5px] font-semibold uppercase tracking-wider text-cream/45">Aperçu en direct</p>
            <div className="overflow-hidden rounded-2xl border border-line bg-ink-2/60">
              <div className="relative h-28">
                <img src={banniere} alt="" className="h-full w-full object-cover opacity-60" />
                <div className="absolute inset-0 bg-gradient-to-t from-ink-2 to-transparent" />
              </div>
              <div className="relative -mt-8 px-5 pb-5">
                <span className="flex h-16 w-16 items-center justify-center rounded-2xl border border-line text-3xl" style={{ background: `linear-gradient(135deg, ${couleur}44, #1C1917)` }}>{logo}</span>
                <h3 className="display mt-3 text-lg font-bold">{nom || 'Nom de votre boutique'}</h3>
                <p className="text-[12px] text-cream/40">kreativa.ci/boutique/{slugify(nom) || 'votre-boutique'}</p>
                <p className="mt-2 line-clamp-4 text-[13.5px] leading-relaxed text-cream/55">{desc || 'Votre description apparaîtra ici. Expliquez qui vous êtes et ce que vous vendez.'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Section>
  )
}
