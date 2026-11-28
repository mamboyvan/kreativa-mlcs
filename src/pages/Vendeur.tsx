import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Plus, Pencil, Trash2, Eye, EyeOff, TrendingUp, Wallet, Package, ShoppingBag,
  ExternalLink, Sparkles, X, Store,
} from 'lucide-react'
import { useStore } from '../lib/store'
import { Badge, Btn, Empty, Field, Area, Panel, Section, Select } from '../components/ui'
import { useToast } from '../components/Toast'
import { CATEGORIES, STATUT_LABEL } from '../lib/constants'
import { dateFr, fcfa } from '../lib/format'
import { validerFichier } from '../lib/crypto'
import type { Product, ProductType } from '../lib/types'

const IMAGES = ['/img/p1.jpg', '/img/p2.jpg', '/img/p3.jpg', '/img/p4.jpg', '/img/p5.jpg', '/img/p6.jpg', '/img/p7.jpg', '/img/p8.jpg']

export default function Vendeur() {
  const { db, user, maBoutique, creerProduit, majProduit, supprimerProduit, majBoutique } = useStore()
  const toast = useToast()
  const shop = maBoutique()
  const [onglet, setOnglet] = useState<'bord' | 'produits' | 'ventes' | 'boutique'>('bord')
  const [edition, setEdition] = useState<Product | 'nouveau' | null>(null)

  if (!shop)
    return (
      <Section className="py-24">
        <Empty titre="Vous n’avez pas encore de boutique" texte="Créez votre boutique pour publier vos produits numériques et commencer à vendre." action={<Btn to="/creer-boutique"><Store size={16} /> Créer ma boutique</Btn>} />
      </Section>
    )

  const produits = db.products.filter((p) => p.shopId === shop.id)
  const ventes = db.orders
    .filter((o) => o.statut === 'payee' && o.items.some((i) => i.shopId === shop.id))
    .map((o) => ({
      ...o,
      mesItems: o.items.filter((i) => i.shopId === shop.id),
      montant: o.items.filter((i) => i.shopId === shop.id).reduce((s, i) => s + i.prix, 0),
    }))
  const enAttente = db.orders.filter((o) => o.statut === 'en_attente' && o.items.some((i) => i.shopId === shop.id))
  const ca = ventes.reduce((s, v) => s + v.montant, 0)
  const commission = Math.round((ca * db.settings.commission) / 100)
  const net = ca - commission

  return (
    <Section className="py-12">
      <div className="flex flex-wrap items-center gap-4">
        <span className="flex h-16 w-16 items-center justify-center rounded-2xl border border-line text-3xl" style={{ background: `linear-gradient(135deg, ${shop.couleur}44, #1C1917)` }}>
          {shop.logo}
        </span>
        <div>
          <h1 className="text-3xl font-extrabold">{shop.nom}</h1>
          <p className="text-[13.5px] text-cream/45">Espace vendeur · {user!.email}</p>
        </div>
        <div className="ml-auto flex gap-2">
          <Btn to={`/boutique/${shop.slug}`} variant="outline" size="sm"><ExternalLink size={15} /> Voir ma boutique</Btn>
          <Btn size="sm" onClick={() => { setOnglet('produits'); setEdition('nouveau') }}><Plus size={15} /> Nouveau produit</Btn>
        </div>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { l: 'Chiffre d’affaires', v: fcfa(ca), i: TrendingUp, c: 'text-emeraude-soft' },
          { l: `Commission (${db.settings.commission} %)`, v: fcfa(commission), i: Wallet, c: 'text-sable' },
          { l: 'Revenu net estimé', v: fcfa(net), i: Wallet, c: 'text-mandarine' },
          { l: 'Produits publiés', v: `${produits.filter((p) => p.statut === 'publie').length} / ${produits.length}`, i: Package, c: 'text-cream' },
        ].map((s) => (
          <Panel key={s.l}>
            <s.i size={19} className={s.c} />
            <p className="display mt-3 text-2xl font-extrabold">{s.v}</p>
            <p className="text-[12.5px] text-cream/45">{s.l}</p>
          </Panel>
        ))}
      </div>

      <div className="mt-9 flex gap-2 overflow-x-auto border-b border-line pb-px">
        {[
          { id: 'bord', l: 'Tableau de bord' },
          { id: 'produits', l: `Produits (${produits.length})` },
          { id: 'ventes', l: `Ventes (${ventes.length})` },
          { id: 'boutique', l: 'Ma boutique' },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setOnglet(t.id as any)}
            className={`shrink-0 border-b-2 px-4 py-2.5 text-[14px] font-semibold transition ${
              onglet === t.id ? 'border-mandarine text-cream' : 'border-transparent text-cream/45 hover:text-cream/75'
            }`}
          >
            {t.l}
          </button>
        ))}
      </div>

      <div className="mt-7">
        {onglet === 'bord' && <Bord shop={shop} produits={produits} ventes={ventes} enAttente={enAttente.length} ca={ca} />}

        {onglet === 'produits' && (
          <>
            <div className="mb-5 flex justify-between">
              <p className="text-sm text-cream/50">Gérez vos fiches produits : création, modification, publication, suppression.</p>
              <Btn size="sm" onClick={() => setEdition('nouveau')}><Plus size={15} /> Ajouter</Btn>
            </div>
            {produits.length === 0 ? (
              <Empty titre="Aucun produit" texte="Publiez votre premier produit numérique pour commencer à vendre." action={<Btn onClick={() => setEdition('nouveau')}>Créer un produit</Btn>} />
            ) : (
              <div className="space-y-3">
                {produits.map((p) => (
                  <div key={p.id} className="flex flex-wrap items-center gap-4 rounded-2xl border border-line bg-ink-2/60 p-3.5">
                    <img src={p.image} alt="" className="h-16 w-24 shrink-0 rounded-xl object-cover" />
                    <div className="min-w-[180px] flex-1">
                      <Link to={`/produit/${p.id}`} className="display font-bold hover:text-mandarine">{p.titre}</Link>
                      <p className="text-[12.5px] text-cream/45">{CATEGORIES.find((c) => c.id === p.categorie)?.nom} · {p.ventes} ventes · {dateFr(p.createdAt)}</p>
                    </div>
                    <span className="display text-lg font-extrabold">{fcfa(p.prix)}</span>
                    <Badge tone={p.statut === 'publie' ? 'ok' : 'warn'}>{p.statut === 'publie' ? 'Publié' : 'Brouillon'}</Badge>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => { const r = majProduit(p.id, { statut: p.statut === 'publie' ? 'brouillon' : 'publie' }); toast(r.ok ? (p.statut === 'publie' ? 'Produit dépublié.' : 'Produit publié.') : r.message!, r.ok ? 'ok' : 'err') }}
                        title={p.statut === 'publie' ? 'Dépublier' : 'Publier'}
                        className="rounded-lg border border-line p-2 text-cream/60 hover:border-mandarine/50 hover:text-mandarine"
                      >
                        {p.statut === 'publie' ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                      <button onClick={() => setEdition(p)} title="Modifier" className="rounded-lg border border-line p-2 text-cream/60 hover:border-mandarine/50 hover:text-mandarine">
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => { if (confirm(`Supprimer définitivement « ${p.titre} » ?`)) { const r = supprimerProduit(p.id); toast(r.message ?? '', r.ok ? 'ok' : 'err') } }}
                        title="Supprimer"
                        className="rounded-lg border border-line p-2 text-cream/60 hover:border-red-500/50 hover:text-red-300"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {onglet === 'ventes' && (
          ventes.length === 0 ? (
            <Empty titre="Aucune vente confirmée" texte={`Vos ventes apparaîtront ici dès qu’un paiement sera confirmé. ${enAttente.length} commande(s) sont actuellement en attente de paiement.`} />
          ) : (
            <div className="space-y-3">
              {ventes.map((v) => (
                <div key={v.id} className="flex flex-wrap items-center gap-4 rounded-2xl border border-line bg-ink-2/60 p-4">
                  <div className="min-w-[200px] flex-1">
                    <p className="font-mono text-[13.5px] font-semibold">{v.reference}</p>
                    <p className="text-[12.5px] text-cream/45">{v.mesItems.map((i) => i.titre).join(', ')}</p>
                    <p className="text-[12px] text-cream/35">{dateFr(v.updatedAt)} · {v.methode}</p>
                  </div>
                  <Badge tone="ok">{STATUT_LABEL[v.statut]}</Badge>
                  <div className="text-right">
                    <p className="display text-lg font-extrabold">{fcfa(v.montant)}</p>
                    <p className="text-[11.5px] text-cream/40">net {fcfa(v.montant - (v.montant * db.settings.commission) / 100)}</p>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {onglet === 'boutique' && <EditBoutique shop={shop} onSave={majBoutique} />}
      </div>

      {edition && (
        <FormProduit
          shopId={shop.id}
          produit={edition === 'nouveau' ? null : edition}
          onClose={() => setEdition(null)}
          onSubmit={(data, id) => {
            const r = id ? majProduit(id, data) : creerProduit({ ...data, shopId: shop.id } as any)
            toast(r.message ?? '', r.ok ? 'ok' : 'err')
            if (r.ok) setEdition(null)
          }}
        />
      )}
    </Section>
  )
}

function Bord({ shop, produits, ventes, enAttente, ca }: any) {
  const { db } = useStore()
  const top = [...produits].sort((a: Product, b: Product) => b.ventes - a.ventes).slice(0, 4)
  const max = Math.max(1, ...top.map((p: Product) => p.ventes))

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Panel>
        <h2 className="display mb-4 text-lg font-bold">Vos meilleurs produits</h2>
        {top.length === 0 ? (
          <p className="text-sm text-cream/45">Aucune donnée pour le moment.</p>
        ) : (
          <div className="space-y-4">
            {top.map((p: Product) => (
              <div key={p.id}>
                <div className="mb-1.5 flex justify-between text-[13.5px]">
                  <span className="line-clamp-1 font-semibold">{p.titre}</span>
                  <span className="shrink-0 text-cream/50">{p.ventes} ventes</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-ink-3">
                  <div className="h-full rounded-full bg-gradient-to-r from-mandarine to-sable" style={{ width: `${(p.ventes / max) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>

      <Panel>
        <h2 className="display mb-4 text-lg font-bold">Activité</h2>
        <ul className="space-y-3 text-[14px]">
          <li className="flex justify-between border-b border-line pb-2.5"><span className="text-cream/55">Commandes payées</span><span className="font-semibold">{ventes.length}</span></li>
          <li className="flex justify-between border-b border-line pb-2.5"><span className="text-cream/55">Commandes en attente</span><span className="font-semibold text-sable">{enAttente}</span></li>
          <li className="flex justify-between border-b border-line pb-2.5"><span className="text-cream/55">Chiffre d’affaires cumulé</span><span className="font-semibold">{fcfa(ca)}</span></li>
          <li className="flex justify-between border-b border-line pb-2.5"><span className="text-cream/55">Taux de commission</span><span className="font-semibold">{db.settings.commission} %</span></li>
          <li className="flex justify-between"><span className="text-cream/55">Statut boutique</span><span className="font-semibold">{shop.verifiee ? 'Vérifiée' : 'En attente de vérification'}</span></li>
        </ul>
        <div className="mt-5 rounded-xl border border-sable/25 bg-sable/8 p-3.5 text-[12.5px] leading-relaxed text-cream/60">
          Les reversements ne sont pas opérationnels tant qu’aucun compte marchand {db.settings.prestataire} n’est connecté.
          Les montants ci-dessus sont calculés à partir de vos commandes réelles enregistrées sur la plateforme.
        </div>
      </Panel>

      <Panel className="lg:col-span-2">
        <h2 className="display mb-2 flex items-center gap-2 text-lg font-bold"><Sparkles size={18} className="text-mandarine" /> Conseils de l’assistant IA</h2>
        <p className="text-[14px] leading-relaxed text-cream/60">
          {produits.length < 3
            ? 'Les boutiques qui publient au moins 3 produits vendent en moyenne 2,4 fois plus. Déclinez votre offre : une version courte, une version complète, un pack.'
            : ca === 0
            ? 'Vos fiches sont en ligne : lancez une offre de lancement 72 h et partagez le lien de votre boutique dans votre statut WhatsApp.'
            : 'Excellent départ ! Créez maintenant un pack combinant vos deux meilleurs produits pour augmenter le panier moyen.'}
          {' '}Ouvrez l’assistant en bas à droite pour générer titres et descriptions.
        </p>
      </Panel>
    </div>
  )
}

function EditBoutique({ shop, onSave }: any) {
  const toast = useToast()
  const [nom, setNom] = useState(shop.nom)
  const [desc, setDesc] = useState(shop.description)
  const [slug, setSlug] = useState(shop.slug)
  const [cat, setCat] = useState(shop.categorie)
  const [wa, setWa] = useState(shop.whatsapp ?? '')
  const [logo, setLogo] = useState(shop.logo)
  const [couleur, setCouleur] = useState(shop.couleur)
  const [banniere, setBanniere] = useState(shop.banniere)

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Panel>
        <h2 className="display mb-4 text-lg font-bold">Informations de la boutique</h2>
        <div className="space-y-4">
          <Field label="Nom" value={nom} onChange={(e) => setNom(e.target.value)} />
          <Field label="Adresse publique (slug)" value={slug} onChange={(e) => setSlug(e.target.value)} hint={`kreativa.ci/boutique/${slug}`} />
          <Area label="Description" rows={5} value={desc} onChange={(e) => setDesc(e.target.value)} />
          <Select label="Catégorie principale" value={cat} onChange={(e) => setCat(e.target.value)}>
            {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
          </Select>
          <Field label="WhatsApp" value={wa} onChange={(e) => setWa(e.target.value)} placeholder="+225 07 00 00 00 00" />
          <div>
            <p className="mb-2 text-[12.5px] font-semibold uppercase tracking-wider text-cream/55">Logo & couleur</p>
            <div className="flex flex-wrap gap-2">
              {['🚀', '🎨', '📊', '📚', '🎧', '🎬', '💡', '✨', '🛠️', '👑'].map((e) => (
                <button key={e} onClick={() => setLogo(e)} className={`flex h-10 w-10 items-center justify-center rounded-xl border text-lg ${logo === e ? 'border-mandarine bg-mandarine/12' : 'border-line'}`}>{e}</button>
              ))}
            </div>
            <div className="mt-3 flex gap-2">
              {['#FF6A1F', '#0E9F6E', '#C9A227', '#2B2A6B', '#B91C1C', '#7C3AED'].map((c) => (
                <button key={c} onClick={() => setCouleur(c)} className={`h-8 w-8 rounded-full border-2 ${couleur === c ? 'border-cream' : 'border-transparent'}`} style={{ background: c }} />
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-[12.5px] font-semibold uppercase tracking-wider text-cream/55">Bannière</p>
            <div className="grid grid-cols-3 gap-2">
              {IMAGES.slice(0, 6).map((b) => (
                <button key={b} onClick={() => setBanniere(b)} className={`h-14 overflow-hidden rounded-xl border-2 ${banniere === b ? 'border-mandarine' : 'border-transparent opacity-60'}`}>
                  <img src={b} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          </div>
          <Btn onClick={() => { const r = onSave(shop.id, { nom, description: desc, slug, categorie: cat, whatsapp: wa, logo, couleur, banniere }); toast(r.message ?? '', r.ok ? 'ok' : 'err') }}>
            Enregistrer
          </Btn>
        </div>
      </Panel>

      <div>
        <p className="mb-3 text-[12.5px] font-semibold uppercase tracking-wider text-cream/45">Aperçu</p>
        <div className="overflow-hidden rounded-2xl border border-line bg-ink-2/60">
          <div className="relative h-28">
            <img src={banniere} alt="" className="h-full w-full object-cover opacity-60" />
            <div className="absolute inset-0 bg-gradient-to-t from-ink-2 to-transparent" />
          </div>
          <div className="relative -mt-8 px-5 pb-5">
            <span className="flex h-16 w-16 items-center justify-center rounded-2xl border border-line text-3xl" style={{ background: `linear-gradient(135deg, ${couleur}44, #1C1917)` }}>{logo}</span>
            <h3 className="display mt-3 text-lg font-bold">{nom}</h3>
            <p className="text-[12px] text-cream/40">kreativa.ci/boutique/{slug}</p>
            <p className="mt-2 text-[13.5px] leading-relaxed text-cream/55">{desc}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function FormProduit({ produit, onClose, onSubmit }: { shopId: string; produit: Product | null; onClose: () => void; onSubmit: (d: any, id?: string) => void }) {
  const [titre, setTitre] = useState(produit?.titre ?? '')
  const [desc, setDesc] = useState(produit?.description ?? '')
  const [cat, setCat] = useState(produit?.categorie ?? CATEGORIES[0].id)
  const [prix, setPrix] = useState(String(produit?.prix ?? 5000))
  const [image, setImage] = useState(produit?.image ?? IMAGES[0])
  const [fichier, setFichier] = useState(produit?.fichierNom ?? '')
  const [taille, setTaille] = useState(produit?.fichierTaille ?? '')
  const [statut, setStatut] = useState<'publie' | 'brouillon'>(produit?.statut ?? 'publie')
  const [erreur, setErreur] = useState('')

  const valider = () => {
    setErreur('')
    if (titre.trim().length < 4) return setErreur('Le titre doit contenir au moins 4 caractères.')
    if (desc.trim().length < 40) return setErreur('La description doit contenir au moins 40 caractères.')
    const v = validerFichier(fichier)
    if (!v.ok) return setErreur(v.message!)
    const type = (CATEGORIES.find((c) => c.id === cat)?.type ?? 'ebook') as ProductType
    onSubmit(
      {
        titre: titre.trim(), description: desc.trim(), categorie: cat, type,
        prix: Number(prix), image, fichierNom: fichier.trim(),
        fichierTaille: taille.trim() || '— Mo', statut,
      },
      produit?.id,
    )
  }

  return (
    <div className="fixed inset-0 z-[75] flex items-start justify-center overflow-y-auto bg-ink/85 px-4 py-10 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-2xl rounded-3xl border border-line bg-ink-2 p-6 sm:p-8" onClick={(e) => e.stopPropagation()}>
        <div className="mb-6 flex items-center justify-between">
          <h2 className="display text-2xl font-extrabold">{produit ? 'Modifier le produit' : 'Nouveau produit'}</h2>
          <button onClick={onClose} className="rounded-full p-2 text-cream/50 hover:bg-cream/5 hover:text-cream"><X size={19} /></button>
        </div>

        <div className="space-y-4">
          <Field label="Titre du produit" value={titre} onChange={(e) => setTitre(e.target.value)} placeholder="Vendre sur WhatsApp : le guide complet" />
          <Area label="Description" rows={6} value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Décrivez le contenu, à qui il s’adresse et les résultats attendus…" hint={`${desc.length} caractères · 40 minimum · utilisez l’assistant IA pour générer un texte`} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Select label="Catégorie" value={cat} onChange={(e) => setCat(e.target.value)}>
              {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
            </Select>
            <Field label="Prix en FCFA" type="number" min={0} step={500} value={prix} onChange={(e) => setPrix(e.target.value)} hint="0 pour un produit gratuit, sinon 500 FCFA minimum." />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nom du fichier livré" value={fichier} onChange={(e) => setFichier(e.target.value)} placeholder="guide-whatsapp.pdf" hint="Formats autorisés : pdf, epub, zip, mp3, mp4, docx, xlsx…" />
            <Field label="Taille du fichier" value={taille} onChange={(e) => setTaille(e.target.value)} placeholder="12,4 Mo" />
          </div>

          <div>
            <p className="mb-2 text-[12.5px] font-semibold uppercase tracking-wider text-cream/55">Image de couverture</p>
            <div className="grid grid-cols-4 gap-2">
              {IMAGES.map((im) => (
                <button key={im} onClick={() => setImage(im)} className={`h-16 overflow-hidden rounded-xl border-2 transition ${image === im ? 'border-mandarine' : 'border-transparent opacity-55 hover:opacity-100'}`}>
                  <img src={im} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            {(['publie', 'brouillon'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatut(s)}
                className={`flex-1 rounded-xl border px-4 py-2.5 text-[13.5px] font-semibold transition ${
                  statut === s ? 'border-mandarine bg-mandarine/10 text-cream' : 'border-line text-cream/50'
                }`}
              >
                {s === 'publie' ? 'Publier immédiatement' : 'Enregistrer en brouillon'}
              </button>
            ))}
          </div>

          {erreur && <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-3.5 py-2.5 text-[13.5px] text-red-300">{erreur}</p>}

          <div className="flex gap-3 pt-2">
            <Btn full size="lg" onClick={valider}><ShoppingBag size={16} /> {produit ? 'Enregistrer les modifications' : 'Créer le produit'}</Btn>
            <Btn variant="ghost" size="lg" onClick={onClose}>Annuler</Btn>
          </div>
        </div>
      </div>
    </div>
  )
}
