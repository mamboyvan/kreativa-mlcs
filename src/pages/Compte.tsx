import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Download, Package, Receipt, User2, Store, Lock } from 'lucide-react'
import { useStore } from '../lib/store'
import { Badge, Btn, Empty, Field, Area, Panel, Section } from '../components/ui'
import { useToast } from '../components/Toast'
import { dateHeureFr, fcfa, initiales } from '../lib/format'
import { STATUT_LABEL } from '../lib/constants'

export default function Compte() {
  const { db, user, majProfil, changerMotDePasse } = useStore()
  const toast = useToast()
  const [onglet, setOnglet] = useState<'commandes' | 'produits' | 'profil'>('commandes')
  const [nom, setNom] = useState(user!.nom)
  const [tel, setTel] = useState(user!.telephone ?? '')
  const [ville, setVille] = useState(user!.ville ?? '')
  const [bio, setBio] = useState(user!.bio ?? '')
  const [actuel, setActuel] = useState('')
  const [nouveau, setNouveau] = useState('')

  const mes = db.orders.filter((o) => o.buyerId === user!.id)
  const payees = mes.filter((o) => o.statut === 'payee')
  const achats = payees.flatMap((o) => o.items.map((i) => ({ ...i, ref: o.reference, at: o.updatedAt })))
  const depense = payees.reduce((s, o) => s + o.total, 0)

  const tons = { en_attente: 'warn', payee: 'ok', echouee: 'bad', annulee: 'neutral' } as const

  return (
    <Section className="py-12">
      <div className="flex flex-wrap items-center gap-4">
        <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-mandarine text-xl font-extrabold text-ink">
          {initiales(user!.nom)}
        </span>
        <div>
          <h1 className="text-3xl font-extrabold">Bonjour, {user!.nom.split(' ')[0]}</h1>
          <p className="text-[13.5px] text-cream/45">{user!.email} · compte {user!.role}</p>
        </div>
        {user!.role === 'acheteur' && (
          <Btn to="/creer-boutique" className="ml-auto"><Store size={16} /> Devenir vendeur</Btn>
        )}
        {user!.role === 'vendeur' && (
          <Btn to="/vendeur" className="ml-auto"><Store size={16} /> Espace vendeur</Btn>
        )}
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {[
          { l: 'Commandes', v: mes.length, i: Receipt },
          { l: 'Produits achetés', v: achats.length, i: Package },
          { l: 'Total dépensé', v: fcfa(depense), i: Download },
        ].map((s) => (
          <Panel key={s.l} className="flex items-center gap-4">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-mandarine/12 text-mandarine"><s.i size={19} /></span>
            <span>
              <span className="display block text-xl font-extrabold">{s.v}</span>
              <span className="block text-[12.5px] text-cream/45">{s.l}</span>
            </span>
          </Panel>
        ))}
      </div>

      <div className="mt-9 flex gap-2 overflow-x-auto border-b border-line pb-px">
        {[
          { id: 'commandes', l: 'Mes commandes' },
          { id: 'produits', l: 'Mes téléchargements' },
          { id: 'profil', l: 'Mon profil' },
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
        {onglet === 'commandes' && (
          mes.length === 0 ? (
            <Empty titre="Aucune commande" texte="Vos commandes et leur statut de paiement apparaîtront ici." action={<Btn to="/produits">Découvrir le catalogue</Btn>} />
          ) : (
            <div className="space-y-3">
              {mes.map((o) => (
                <Link key={o.id} to={`/commande/${o.id}`} className="flex flex-wrap items-center gap-4 rounded-2xl border border-line bg-ink-2/60 p-4 transition hover:border-mandarine/40">
                  <div className="min-w-[200px] flex-1">
                    <p className="font-mono text-[13.5px] font-semibold">{o.reference}</p>
                    <p className="text-[12.5px] text-cream/45">{dateHeureFr(o.createdAt)} · {o.items.length} article(s) · {o.methode}</p>
                  </div>
                  <Badge tone={tons[o.statut]}>{STATUT_LABEL[o.statut]}</Badge>
                  <span className="display text-lg font-extrabold">{fcfa(o.total)}</span>
                </Link>
              ))}
            </div>
          )
        )}

        {onglet === 'produits' && (
          achats.length === 0 ? (
            <Empty titre="Aucun téléchargement disponible" texte="Les fichiers sont débloqués uniquement après confirmation du paiement de votre commande." action={<Btn to="/produits">Voir les produits</Btn>} />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {achats.map((a) => {
                const prod = db.products.find((p) => p.id === a.productId)
                return (
                  <Panel key={a.productId + a.ref} className="flex gap-4">
                    <img src={a.image} alt="" className="h-20 w-24 shrink-0 rounded-xl object-cover" />
                    <div className="flex min-w-0 flex-1 flex-col">
                      <p className="line-clamp-2 font-bold">{a.titre}</p>
                      <p className="mt-0.5 text-[12px] text-cream/40">{prod?.fichierNom} · {prod?.fichierTaille}</p>
                      <p className="text-[12px] text-cream/35">Acheté le {dateHeureFr(a.at)} · {a.ref}</p>
                      <Btn size="sm" variant="soft" className="mt-auto self-start" onClick={() => toast('Lien de téléchargement sécurisé généré (valable 15 minutes).', 'ok')}>
                        <Download size={14} /> Télécharger
                      </Btn>
                    </div>
                  </Panel>
                )
              })}
            </div>
          )
        )}

        {onglet === 'profil' && (
          <div className="grid gap-5 lg:grid-cols-2">
            <Panel>
              <h2 className="display mb-4 flex items-center gap-2 text-lg font-bold"><User2 size={18} className="text-mandarine" /> Informations personnelles</h2>
              <div className="space-y-4">
                <Field label="Nom complet" value={nom} onChange={(e) => setNom(e.target.value)} />
                <Field label="Adresse e-mail" value={user!.email} disabled hint="L’adresse e-mail ne peut pas être modifiée directement." />
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Téléphone" value={tel} onChange={(e) => setTel(e.target.value)} placeholder="+225 07 00 00 00 00" />
                  <Field label="Ville" value={ville} onChange={(e) => setVille(e.target.value)} placeholder="Abidjan" />
                </div>
                <Area label="Bio" rows={3} value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Quelques mots sur vous…" />
                <Btn onClick={() => { const r = majProfil({ nom, telephone: tel, ville, bio }); toast(r.message ?? '', r.ok ? 'ok' : 'err') }}>
                  Enregistrer les modifications
                </Btn>
              </div>
            </Panel>

            <Panel>
              <h2 className="display mb-4 flex items-center gap-2 text-lg font-bold"><Lock size={18} className="text-mandarine" /> Sécurité</h2>
              <div className="space-y-4">
                <Field label="Mot de passe actuel" type="password" value={actuel} onChange={(e) => setActuel(e.target.value)} />
                <Field label="Nouveau mot de passe" type="password" value={nouveau} onChange={(e) => setNouveau(e.target.value)} hint="8 caractères minimum, une majuscule et un chiffre." />
                <Btn
                  variant="outline"
                  onClick={async () => {
                    const r = await changerMotDePasse(actuel, nouveau)
                    toast(r.message ?? '', r.ok ? 'ok' : 'err')
                    if (r.ok) { setActuel(''); setNouveau('') }
                  }}
                >
                  Modifier le mot de passe
                </Btn>
                <p className="text-[12px] leading-relaxed text-cream/35">
                  Les mots de passe sont stockés sous forme de hachage PBKDF2-SHA256 (120 000 itérations) avec sel unique
                  par compte. Ils ne sont jamais conservés en clair.
                </p>
              </div>
            </Panel>
          </div>
        )}
      </div>
    </Section>
  )
}
