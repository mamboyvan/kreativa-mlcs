import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Download, Star } from 'lucide-react'
import type { Product } from '../lib/types'
import { fcfa } from '../lib/format'
import { catEmoji, catNom } from '../lib/constants'
import { useStore } from '../lib/store'

export default function ProductCard({ p, index = 0 }: { p: Product; index?: number }) {
  const { db } = useStore()
  const shop = db.shops.find((s) => s.id === p.shopId)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.5, delay: Math.min(index * 0.05, 0.4) }}
    >
      <Link
        to={`/produit/${p.id}`}
        className="card-hover group flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-ink-2/60 hover:border-mandarine/40"
      >
        <div className="relative aspect-[16/10] overflow-hidden bg-ink-3">
          <img
            src={p.image}
            alt={p.titre}
            loading="lazy"
            className="h-full w-full object-cover opacity-85 transition duration-700 group-hover:scale-105 group-hover:opacity-100"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/20 to-transparent" />
          <span className="absolute left-3 top-3 rounded-full bg-ink/80 px-2.5 py-1 text-[11px] font-semibold backdrop-blur">
            {catEmoji(p.categorie)} {catNom(p.categorie)}
          </span>
          {p.statut === 'brouillon' && (
            <span className="absolute right-3 top-3 rounded-full bg-sable px-2.5 py-1 text-[11px] font-bold text-ink">Brouillon</span>
          )}
        </div>

        <div className="flex flex-1 flex-col p-4">
          <h3 className="display text-[16.5px] font-bold leading-snug text-cream group-hover:text-mandarine">{p.titre}</h3>
          <p className="mt-1.5 line-clamp-2 text-[13px] leading-relaxed text-cream/50">{p.description}</p>

          <div className="mt-3 flex items-center gap-2 text-[12px] text-cream/45">
            <span>{shop?.logo}</span>
            <span className="truncate">{shop?.nom ?? 'Boutique'}</span>
            {shop?.verifiee && <Star size={11} className="shrink-0 fill-sable text-sable" />}
          </div>

          <div className="mt-4 flex items-end justify-between border-t border-line pt-3.5">
            <span className="display text-lg font-extrabold text-cream">{p.prix === 0 ? 'Gratuit' : fcfa(p.prix)}</span>
            <span className="flex items-center gap-1 text-[12px] text-cream/40">
              <Download size={12} /> {p.ventes} ventes
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
