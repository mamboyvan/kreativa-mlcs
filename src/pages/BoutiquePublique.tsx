import { useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { BadgeCheck, MessageCircle, Package, Star } from 'lucide-react'
import { useStore } from '../lib/store'
import { Badge, Btn, Empty, Section } from '../components/ui'
import ProductCard from '../components/ProductCard'
import { catNom } from '../lib/constants'
import { dateFr, fcfa } from '../lib/format'
import { track } from '../lib/analytics'

export default function BoutiquePublique() {
  const { slug } = useParams()
  const { db, user } = useStore()
  const shop = db.shops.find((s) => s.slug === slug)

  useEffect(() => {
    if (shop) track('boutique_vue', { shopId: shop.id, meta: { boutique: shop.nom, categorie: shop.categorie } })
  }, [shop?.id])

  if (!shop)
    return (
      <Section className="py-24">
        <Empty titre="Boutique introuvable" texte="Cette adresse de boutique n’existe pas ou a été modifiée." action={<Btn to="/boutiques">Voir toutes les boutiques</Btn>} />
      </Section>
    )

  const estProprio = user?.id === shop.ownerId
  const tous = db.products.filter((p) => p.shopId === shop.id)
  const publies = tous.filter((p) => p.statut === 'publie')
  const ventes = publies.reduce((a, p) => a + p.ventes, 0)
  const owner = db.users.find((u) => u.id === shop.ownerId)

  return (
    <>
      <div className="relative h-56 overflow-hidden sm:h-72">
        <img src={shop.banniere} alt="" className="h-full w-full object-cover opacity-55" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/50 to-transparent" />
      </div>

      <Section className="relative -mt-20 pb-16">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end">
          <span
            className="flex h-24 w-24 shrink-0 items-center justify-center rounded-3xl border border-line text-5xl shadow-2xl"
            style={{ background: `linear-gradient(135deg, ${shop.couleur}44, #1C1917)` }}
          >
            {shop.logo}
          </span>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-3xl font-extrabold sm:text-4xl">{shop.nom}</h1>
              {shop.verifiee && (
                <Badge tone="ok"><BadgeCheck size={12} /> Boutique vérifiée</Badge>
              )}
            </div>
            <p className="mt-1.5 text-[13.5px] text-cream/45">
              kreativa.ci/boutique/{shop.slug} · {catNom(shop.categorie)} · ouverte le {dateFr(shop.createdAt)}
            </p>
          </div>
          <div className="flex gap-2">
            {shop.whatsapp && (
              <Btn href={`https://wa.me/${shop.whatsapp.replace(/\D/g, '')}`} variant="outline" size="sm">
                <MessageCircle size={15} /> Contacter
              </Btn>
            )}
            {estProprio && <Btn to="/vendeur" size="sm">Gérer ma boutique</Btn>}
          </div>
        </div>

        <p className="mt-6 max-w-3xl text-[15px] leading-relaxed text-cream/65">{shop.description}</p>

        <div className="mt-7 flex flex-wrap gap-6 rounded-2xl border border-line bg-ink-2/50 px-6 py-5">
          {[
            { l: 'Produits en vente', v: publies.length, i: Package },
            { l: 'Téléchargements vendus', v: ventes, i: Star },
            { l: 'Prix moyen', v: publies.length ? fcfa(Math.round(publies.reduce((a, p) => a + p.prix, 0) / publies.length)) : '—', i: Package },
            { l: 'Créateur', v: owner?.nom ?? '—', i: Star },
          ].map((s) => (
            <div key={s.l} className="min-w-[130px]">
              <p className="display text-xl font-extrabold text-mandarine">{s.v}</p>
              <p className="text-[12.5px] text-cream/45">{s.l}</p>
            </div>
          ))}
        </div>

        <h2 className="mb-6 mt-12 text-2xl font-extrabold">Produits de la boutique</h2>
        {publies.length === 0 ? (
          <Empty
            titre="Aucun produit publié"
            texte={estProprio ? 'Publiez votre premier produit depuis votre espace vendeur.' : 'Cette boutique n’a pas encore publié de produit. Revenez bientôt !'}
            action={estProprio ? <Btn to="/vendeur">Ajouter un produit</Btn> : undefined}
          />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {publies.map((p, i) => <ProductCard key={p.id} p={p} index={i} />)}
          </div>
        )}

        {estProprio && tous.length > publies.length && (
          <p className="mt-6 text-sm text-cream/45">
            {tous.length - publies.length} produit(s) en brouillon ne sont visibles que par vous.{' '}
            <Link to="/vendeur" className="text-mandarine underline">Gérer</Link>
          </p>
        )}
      </Section>
    </>
  )
}
