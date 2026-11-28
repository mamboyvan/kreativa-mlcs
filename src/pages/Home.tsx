import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Search, ArrowRight, Store, Upload, Wallet, ShieldCheck, Smartphone,
  Sparkles, ChevronDown, LifeBuoy, MessageCircle, Mail,
} from 'lucide-react'
import { useStore } from '../lib/store'
import { Badge, Btn, Panel, Section } from '../components/ui'
import ProductCard from '../components/ProductCard'
import { CATEGORIES } from '../lib/constants'
import { fcfa } from '../lib/format'

const FAQ = [
  {
    q: 'Combien coûte la création d’une boutique sur KREATIVA ?',
    r: "La création de la boutique et la publication des produits sont gratuites. La plateforme prélève une commission uniquement sur les ventes réellement encaissées. Aucun abonnement, aucun frais caché.",
  },
  {
    q: 'Quels moyens de paiement sont prévus ?',
    r: "L’architecture est prévue pour un prestataire agréé en Côte d’Ivoire (CinetPay ou PayDunya) : Orange Money, MTN MoMo, Moov Money, Wave et cartes bancaires. L’encaissement réel n’est actif qu’une fois le compte marchand validé et les clés installées côté serveur.",
  },
  {
    q: 'Quand et comment suis-je payé ?',
    r: "Les reversements s’effectuent vers votre compte Mobile Money ou bancaire selon le calendrier du prestataire, après confirmation du paiement de l’acheteur. Tant qu’aucune intégration marchande n’est active, les revenus affichés sont des estimations issues de vos commandes réelles.",
  },
  {
    q: 'Mes fichiers sont-ils protégés ?',
    r: "Oui. Un fichier payant n’est jamais exposé publiquement : le lien de téléchargement n’est généré que pour un acheteur dont la commande est au statut « payée », après vérification du montant et de la devise côté serveur.",
  },
  {
    q: 'Puis-je vendre depuis un autre pays d’Afrique francophone ?',
    r: "Oui. KREATIVA est ouvert au Sénégal, Bénin, Togo, Burkina Faso, Mali, Cameroun et au-delà. Les prix sont affichés en FCFA (XOF) et les moyens de paiement dépendent de la couverture du prestataire dans votre pays.",
  },
  {
    q: 'Que puis-je vendre exactement ?',
    r: "Tout produit numérique dont vous détenez les droits : e-books, PDF, formations vidéo, modèles de documents, fichiers graphiques, audios, presets. Les contenus illégaux, piratés ou trompeurs sont retirés par la modération.",
  },
]

export default function Home() {
  const { db } = useStore()
  const [q, setQ] = useState('')
  const [faq, setFaq] = useState<number | null>(0)
  const nav = useNavigate()

  const publies = db.products.filter((p) => p.statut === 'publie')
  const populaires = [...publies].sort((a, b) => b.ventes - a.ventes).slice(0, 6)
  const ca = db.orders.filter((o) => o.statut === 'payee').reduce((s, o) => s + o.total, 0)

  const stats = [
    { v: `${db.shops.length}`, l: 'boutiques ouvertes' },
    { v: `${publies.length}`, l: 'produits publiés' },
    { v: `${publies.reduce((s, p) => s + p.ventes, 0)}`, l: 'téléchargements vendus' },
    { v: ca > 0 ? fcfa(ca) : '0 FCFA', l: 'encaissé sur la plateforme' },
  ]

  const etapes = [
    {
      n: '01', icon: Store, titre: 'Créez votre boutique',
      texte: 'Nom, logo, bannière, description. Vous obtenez une adresse publique unique du type kreativa.ci/boutique/votre-nom en moins de deux minutes.',
    },
    {
      n: '02', icon: Upload, titre: 'Publiez vos produits',
      texte: 'Ajoutez votre e-book, formation ou pack graphique, fixez votre prix en FCFA et publiez. L’assistant IA rédige la description à votre place si besoin.',
    },
    {
      n: '03', icon: Wallet, titre: 'Encaissez en FCFA',
      texte: 'Vos clients paient par Mobile Money ou carte. Dès le paiement confirmé, le fichier est débloqué automatiquement et la vente apparaît dans votre tableau de bord.',
    },
  ]

  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute -left-40 -top-40 h-[520px] w-[520px] rounded-full bg-mandarine/20 blur-[130px]" />
        <div className="pointer-events-none absolute -right-32 top-40 h-[420px] w-[420px] rounded-full bg-emeraude/15 blur-[120px]" />
        <div className="pointer-events-none absolute inset-0 pattern-kente opacity-[0.35]" />

        <Section className="relative grid items-center gap-12 py-16 lg:grid-cols-[1.08fr_0.92fr] lg:py-24">
          <div>
            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <Badge tone="accent">
                <Sparkles size={12} /> Marketplace des créateurs · Côte d’Ivoire & Afrique francophone
              </Badge>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, delay: 0.08 }}
              className="mt-6 text-[44px] font-extrabold leading-[1.02] sm:text-6xl lg:text-[68px]"
            >
              Créez votre boutique.
              <br />
              <span className="bg-gradient-to-r from-mandarine via-mandarine-soft to-sable bg-clip-text text-transparent">
                Vendez vos talents.
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.18 }}
              className="mt-6 max-w-xl text-[17px] leading-relaxed text-cream/60"
            >
              KREATIVA est la plateforme qui permet aux créateurs, formateurs et entrepreneurs d’Afrique francophone de
              vendre leurs produits numériques en FCFA, avec Mobile Money, sans site web ni compétences techniques.
            </motion.p>

            <motion.form
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.26 }}
              onSubmit={(e) => {
                e.preventDefault()
                nav(`/produits?q=${encodeURIComponent(q)}`)
              }}
              className="mt-8 flex items-center gap-2 rounded-full border border-line bg-ink-2/80 p-2 pl-5 backdrop-blur"
            >
              <Search size={18} className="shrink-0 text-cream/40" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Formation, e-book, template Canva…"
                className="w-full bg-transparent py-2 text-[15px] placeholder:text-cream/30"
              />
              <Btn type="submit" size="md" className="shrink-0">
                Rechercher
              </Btn>
            </motion.form>

            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.34 }}
              className="mt-6 flex flex-wrap items-center gap-3"
            >
              <Btn to="/inscription" size="lg">
                Créer ma boutique <ArrowRight size={17} />
              </Btn>
              <Btn to="/produits" variant="outline" size="lg">
                Explorer le catalogue
              </Btn>
            </motion.div>

            <div className="mt-9 grid max-w-lg grid-cols-2 gap-5 sm:grid-cols-4">
              {stats.map((s, i) => (
                <motion.div
                  key={s.l}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.45 + i * 0.07 }}
                >
                  <p className="display text-xl font-extrabold text-mandarine">{s.v}</p>
                  <p className="text-[12px] leading-tight text-cream/45">{s.l}</p>
                </motion.div>
              ))}
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative mx-auto w-full max-w-md"
          >
            <div className="relative overflow-hidden rounded-[28px] border border-line">
              <img src="/img/hero.jpg" alt="Créatrice entrepreneure" className="h-[480px] w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/25 to-transparent" />
              <div className="absolute bottom-5 left-5 right-5 rounded-2xl border border-line bg-ink/85 p-4 backdrop-blur-xl">
                <p className="text-[12px] uppercase tracking-wider text-cream/45">Boutique du moment</p>
                <p className="display mt-1 text-lg font-bold">Awa Digital Academy</p>
                <p className="mt-0.5 text-[13px] text-cream/55">168 formations vendues · Abidjan</p>
              </div>
            </div>

            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -left-4 top-10 hidden rounded-2xl border border-line bg-ink-2/95 px-4 py-3 shadow-xl backdrop-blur sm:block"
            >
              <p className="flex items-center gap-2 text-[13px] font-semibold">
                <Smartphone size={15} className="text-emeraude-soft" /> Paiement Mobile Money
              </p>
              <p className="mt-1 text-[11.5px] text-cream/45">Orange · MTN · Moov · Wave</p>
            </motion.div>

            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 0.6 }}
              className="absolute -right-3 bottom-28 hidden rounded-2xl border border-line bg-ink-2/95 px-4 py-3 shadow-xl backdrop-blur sm:block"
            >
              <p className="text-[11.5px] text-cream/45">Vente confirmée</p>
              <p className="display text-base font-extrabold text-mandarine">+ 35 000 FCFA</p>
            </motion.div>
          </motion.div>
        </Section>

        {/* bandeau défilant */}
        <div className="overflow-hidden border-y border-line bg-ink-2/40 py-3">
          <div className="marquee-track flex w-max gap-10 whitespace-nowrap text-[13px] uppercase tracking-[0.22em] text-cream/35">
            {[...Array(2)].map((_, k) => (
              <span key={k} className="flex gap-10">
                <span>Abidjan</span><span className="text-mandarine">◆</span><span>Dakar</span><span className="text-emeraude">◆</span>
                <span>Lomé</span><span className="text-mandarine">◆</span><span>Cotonou</span><span className="text-emeraude">◆</span>
                <span>Ouagadougou</span><span className="text-mandarine">◆</span><span>Bamako</span><span className="text-emeraude">◆</span>
                <span>Douala</span><span className="text-mandarine">◆</span><span>Conakry</span><span className="text-emeraude">◆</span>
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* CATÉGORIES */}
      <Section className="py-20">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-extrabold sm:text-4xl">Explorez par catégorie</h2>
            <p className="mt-2 max-w-lg text-cream/55">Six familles de produits numériques, toutes téléchargeables immédiatement après paiement.</p>
          </div>
          <Btn to="/produits" variant="outline" size="sm">Tout voir <ArrowRight size={15} /></Btn>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CATEGORIES.map((c, i) => {
            const n = publies.filter((p) => p.categorie === c.id).length
            return (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: i * 0.06 }}
              >
                <Link
                  to={`/produits?cat=${c.id}`}
                  className="card-hover group flex items-center gap-4 rounded-2xl border border-line bg-ink-2/50 p-5 hover:border-mandarine/40"
                >
                  <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-ink-3 text-2xl transition group-hover:bg-mandarine/15">
                    {c.emoji}
                  </span>
                  <span className="flex-1">
                    <span className="display block text-[17px] font-bold group-hover:text-mandarine">{c.nom}</span>
                    <span className="block text-[13px] text-cream/45">{c.desc}</span>
                  </span>
                  <span className="shrink-0 rounded-full bg-cream/7 px-2.5 py-1 text-[12px] font-semibold text-cream/60">{n}</span>
                </Link>
              </motion.div>
            )
          })}
        </div>
      </Section>

      {/* POPULAIRES */}
      <Section className="pb-20">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-extrabold sm:text-4xl">Produits populaires</h2>
            <p className="mt-2 text-cream/55">Les créations les plus téléchargées cette saison.</p>
          </div>
          <Btn to="/produits" variant="ghost" size="sm">Voir le catalogue <ArrowRight size={15} /></Btn>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {populaires.map((p, i) => <ProductCard key={p.id} p={p} index={i} />)}
        </div>
      </Section>

      {/* 3 ÉTAPES */}
      <Section className="pb-20">
        <div className="relative overflow-hidden rounded-[32px] border border-line bg-ink-2/50 px-6 py-14 sm:px-12">
          <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-mandarine/15 blur-[90px]" />
          <div className="relative">
            <Badge tone="accent">Vendre en 3 étapes</Badge>
            <h2 className="mt-5 max-w-2xl text-3xl font-extrabold sm:text-4xl">
              De l’idée à la première vente, sans développeur ni site web
            </h2>

            <div className="mt-12 grid gap-8 md:grid-cols-3">
              {etapes.map((e, i) => (
                <motion.div
                  key={e.n}
                  initial={{ opacity: 0, y: 22 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.12 }}
                  className="relative"
                >
                  <span className="display text-5xl font-extrabold text-cream/8">{e.n}</span>
                  <span className="mt-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-mandarine/12 text-mandarine">
                    <e.icon size={22} />
                  </span>
                  <h3 className="mt-4 text-xl font-bold">{e.titre}</h3>
                  <p className="mt-2 text-[14.5px] leading-relaxed text-cream/55">{e.texte}</p>
                </motion.div>
              ))}
            </div>

            <div className="mt-10 flex flex-wrap gap-3">
              <Btn to="/inscription" size="lg">Ouvrir ma boutique gratuitement</Btn>
              <Btn to="/boutiques" variant="outline" size="lg">Voir des boutiques existantes</Btn>
            </div>
          </div>
        </div>
      </Section>

      {/* CONFIANCE */}
      <Section className="pb-20">
        <div className="grid gap-5 md:grid-cols-3">
          {[
            { icon: ShieldCheck, t: 'Fichiers protégés', d: 'Aucun lien public sur les produits payants. Le téléchargement n’est débloqué qu’après vérification du paiement côté serveur.' },
            { icon: Smartphone, t: 'Pensé pour le mobile', d: 'Plus de 80 % des acheteurs africains achètent depuis un téléphone. Toute la plateforme est conçue mobile d’abord.' },
            { icon: Sparkles, t: 'Assistant IA intégré', d: 'Titres, descriptions, idées de promotion : Kaya vous aide à écrire des fiches produits qui convertissent.' },
          ].map((c, i) => (
            <motion.div key={c.t} initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
              <Panel className="h-full">
                <c.icon className="text-emeraude-soft" size={24} />
                <h3 className="mt-4 text-lg font-bold">{c.t}</h3>
                <p className="mt-2 text-[14px] leading-relaxed text-cream/55">{c.d}</p>
              </Panel>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* FAQ */}
      <Section className="pb-20" >
        <div id="faq" className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <Badge>FAQ</Badge>
            <h2 className="mt-5 text-3xl font-extrabold sm:text-4xl">Questions fréquentes</h2>
            <p className="mt-3 text-cream/55">
              Vous ne trouvez pas votre réponse ? Notre équipe répond en français, du lundi au samedi, de 8 h à 20 h (GMT).
            </p>
            <Btn to="/aide" variant="outline" className="mt-6">
              <LifeBuoy size={16} /> Centre d’aide
            </Btn>
          </div>

          <div className="space-y-3">
            {FAQ.map((f, i) => (
              <div key={f.q} className="overflow-hidden rounded-2xl border border-line bg-ink-2/50">
                <button
                  onClick={() => setFaq(faq === i ? null : i)}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                >
                  <span className="display text-[15.5px] font-bold">{f.q}</span>
                  <ChevronDown size={18} className={`shrink-0 text-cream/45 transition ${faq === i ? 'rotate-180 text-mandarine' : ''}`} />
                </button>
                {faq === i && (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="px-5 pb-5 text-[14.5px] leading-relaxed text-cream/60"
                  >
                    {f.r}
                  </motion.p>
                )}
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ASSISTANCE */}
      <Section className="pb-24">
        <div className="relative overflow-hidden rounded-[32px] border border-mandarine/25 bg-gradient-to-br from-mandarine/12 via-ink-2 to-ink px-6 py-14 text-center sm:px-12">
          <div className="pointer-events-none absolute inset-0 pattern-kente opacity-40" />
          <div className="relative mx-auto max-w-2xl">
            <h2 className="text-3xl font-extrabold sm:text-4xl">Une question avant de vous lancer ?</h2>
            <p className="mt-3 text-cream/60">
              L’équipe KREATIVA accompagne gratuitement les nouveaux vendeurs : choix du produit, fixation du prix,
              première campagne de lancement.
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <Btn to="/aide#contact" size="lg">
                <MessageCircle size={17} /> Parler à un conseiller
              </Btn>
              <Btn href="mailto:support@kreativa.ci" variant="outline" size="lg">
                <Mail size={17} /> support@kreativa.ci
              </Btn>
            </div>
          </div>
        </div>
      </Section>
    </>
  )
}
