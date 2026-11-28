import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { BadgeCheck, Store } from 'lucide-react'
import { useStore } from '../lib/store'
import { Badge, Btn, Section } from '../components/ui'
import { catNom } from '../lib/constants'
import { dateFr } from '../lib/format'

export default function Boutiques() {
  const { db } = useStore()

  return (
    <Section className="py-12">
      <div className="mb-10 flex flex-wrap items-end justify-between gap-5">
        <div>
          <Badge tone="accent"><Store size={12} /> Boutiques</Badge>
          <h1 className="mt-4 text-4xl font-extrabold sm:text-5xl">Les créateurs de KREATIVA</h1>
          <p className="mt-2 max-w-xl text-cream/55">
            {db.shops.length} boutiques ouvertes par des formateurs, designers et entrepreneurs d’Afrique francophone.
          </p>
        </div>
        <Btn to="/creer-boutique">Ouvrir ma boutique</Btn>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {db.shops.map((s, i) => {
          const prods = db.products.filter((p) => p.shopId === s.id && p.statut === 'publie')
          const ventes = prods.reduce((a, p) => a + p.ventes, 0)
          return (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: i * 0.07 }}
            >
              <Link to={`/boutique/${s.slug}`} className="card-hover group block overflow-hidden rounded-2xl border border-line bg-ink-2/60 hover:border-mandarine/40">
                <div className="relative h-32 overflow-hidden">
                  <img src={s.banniere} alt={s.nom} className="h-full w-full object-cover opacity-60 transition duration-700 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink-2 to-transparent" />
                </div>
                <div className="relative -mt-8 px-5 pb-5">
                  <span
                    className="flex h-16 w-16 items-center justify-center rounded-2xl border border-line text-3xl"
                    style={{ background: `linear-gradient(135deg, ${s.couleur}33, #1C1917)` }}
                  >
                    {s.logo}
                  </span>
                  <h3 className="display mt-3 flex items-center gap-1.5 text-lg font-bold group-hover:text-mandarine">
                    {s.nom}
                    {s.verifiee && <BadgeCheck size={16} className="text-emeraude-soft" />}
                  </h3>
                  <p className="mt-1.5 line-clamp-2 text-[13.5px] leading-relaxed text-cream/50">{s.description}</p>
                  <div className="mt-4 flex items-center justify-between border-t border-line pt-3 text-[12.5px] text-cream/45">
                    <span>{prods.length} produits · {ventes} ventes</span>
                    <span>{catNom(s.categorie)}</span>
                  </div>
                  <p className="mt-1 text-[11.5px] text-cream/30">Ouverte le {dateFr(s.createdAt)}</p>
                </div>
              </Link>
            </motion.div>
          )
        })}
      </div>
    </Section>
  )
}
