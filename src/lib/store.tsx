import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { DB, Order, OrderStatut, Product, Role, Shop, User } from './types'
import { buildSeed } from './seed'
import { genSalt, hashPassword, refCommande, uid, verifyPassword } from './crypto'
import { slugify } from './format'
import { definirUtilisateurCourant, track } from './analytics'

const KEY = 'kreativa.db.v1'

type Res = { ok: boolean; message?: string; data?: any }

type StoreValue = {
  db: DB
  pret: boolean
  user: User | null
  // auth
  inscrire: (p: { nom: string; email: string; motDePasse: string; role: Role }) => Promise<Res>
  connecter: (email: string, motDePasse: string) => Promise<Res>
  deconnecter: () => void
  reinitialiser: (email: string, nouveau: string) => Promise<Res>
  majProfil: (p: Partial<Pick<User, 'nom' | 'telephone' | 'bio' | 'ville'>>) => Res
  changerMotDePasse: (actuel: string, nouveau: string) => Promise<Res>
  // shops
  creerBoutique: (p: Omit<Shop, 'id' | 'ownerId' | 'slug' | 'verifiee' | 'createdAt'> & { slug?: string }) => Res
  majBoutique: (id: string, p: Partial<Shop>) => Res
  maBoutique: () => Shop | null
  // products
  creerProduit: (p: Omit<Product, 'id' | 'createdAt' | 'ventes'>) => Res
  majProduit: (id: string, p: Partial<Product>) => Res
  supprimerProduit: (id: string) => Res
  // cart
  panier: Product[]
  ajouterAuPanier: (productId: string) => Res
  retirerDuPanier: (productId: string) => void
  viderPanier: () => void
  // orders
  creerCommande: (methode: string) => Res
  annulerCommande: (orderId: string) => Res
  confirmerPaiement: (orderId: string, p: { transactionId: string; montant: number; devise: string }) => Res
  marquerEchec: (orderId: string, raison: string) => Res
  aAcces: (productId: string) => boolean
  // admin
  majParametres: (p: Partial<DB['settings']>) => Res
  basculerSuspension: (userId: string) => Res
  verifierBoutique: (shopId: string) => Res
  signaler: (productId: string, motif: string) => Res
  traiterSignalement: (id: string) => Res
  reinitialiserDemo: () => void
}

const Ctx = createContext<StoreValue | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [db, setDb] = useState<DB | null>(null)

  useEffect(() => {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      try {
        setDb(JSON.parse(raw) as DB)
        return
      } catch {
        /* reconstruction */
      }
    }
    buildSeed().then((seed) => {
      localStorage.setItem(KEY, JSON.stringify(seed))
      setDb(seed)
    })
  }, [])

  useEffect(() => {
    definirUtilisateurCourant(db?.sessionUserId ?? null)
  }, [db?.sessionUserId])

  const save = (next: DB) => {
    setDb(next)
    localStorage.setItem(KEY, JSON.stringify(next))
  }

  const value = useMemo<StoreValue>(() => {
    const d = db ?? ({
      users: [], shops: [], products: [], orders: [], signalements: [],
      settings: { commission: 8, prestataire: 'CinetPay', modePaiement: 'non_connecte', nomPlateforme: 'KREATIVA' },
      sessionUserId: null, cart: {},
    } as DB)

    const user = d.users.find((u) => u.id === d.sessionUserId) ?? null
    const cartKey = user ? user.id : 'invite'
    const cartIds = d.cart[cartKey] ?? []
    const panier = cartIds
      .map((id) => d.products.find((p) => p.id === id))
      .filter((p): p is Product => !!p && p.statut === 'publie')

    const maBoutique = () => (user ? d.shops.find((s) => s.ownerId === user.id) ?? null : null)

    const aAcces = (productId: string) => {
      if (!user) return false
      if (user.role === 'admin') return true
      const shop = maBoutique()
      const prod = d.products.find((p) => p.id === productId)
      if (shop && prod && prod.shopId === shop.id) return true
      return d.orders.some(
        (o) => o.buyerId === user.id && o.statut === 'payee' && o.items.some((i) => i.productId === productId),
      )
    }

    return {
      db: d,
      pret: !!db,
      user,
      panier,
      maBoutique,
      aAcces,

      async inscrire({ nom, email, motDePasse, role }) {
        const mail = email.trim().toLowerCase()
        if (nom.trim().length < 2) return { ok: false, message: 'Veuillez indiquer votre nom complet.' }
        if (!/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(mail)) return { ok: false, message: 'Adresse e-mail invalide.' }
        if (motDePasse.length < 8) return { ok: false, message: 'Le mot de passe doit contenir au moins 8 caractères.' }
        if (!/[A-Z]/.test(motDePasse) || !/[0-9]/.test(motDePasse))
          return { ok: false, message: 'Le mot de passe doit contenir une majuscule et un chiffre.' }
        if (d.users.some((u) => u.email.toLowerCase() === mail))
          return { ok: false, message: 'Un compte existe déjà avec cette adresse e-mail.' }
        const salt = genSalt()
        const hash = await hashPassword(motDePasse, salt)
        const u: User = {
          id: uid('u'), nom: nom.trim(), email: mail, salt, hash,
          role: role === 'admin' ? 'acheteur' : role, createdAt: Date.now(),
        }
        save({ ...d, users: [...d.users, u], sessionUserId: u.id })
        track('compte_cree', { userId: u.id, meta: { role: u.role } })
        return { ok: true, data: u }
      },

      async connecter(email, motDePasse) {
        const u = d.users.find((x) => x.email.toLowerCase() === email.trim().toLowerCase())
        if (!u) {
          track('connexion_echouee', { userId: null, meta: { motif: 'compte inexistant' } })
          return { ok: false, message: 'Identifiants incorrects.' }
        }
        if (u.suspendu) {
          track('connexion_echouee', { userId: null, meta: { compte: u.id, motif: 'compte suspendu' } })
          return { ok: false, message: 'Ce compte est suspendu. Contactez le support.' }
        }
        const ok = await verifyPassword(motDePasse, u.salt, u.hash)
        if (!ok) {
          // Seul le fait de l'échec est journalisé : jamais le mot de passe saisi.
          track('connexion_echouee', { userId: null, meta: { compte: u.id, motif: 'identifiants invalides' } })
          return { ok: false, message: 'Identifiants incorrects.' }
        }
        save({ ...d, sessionUserId: u.id })
        definirUtilisateurCourant(u.id)
        track('connexion', { userId: u.id, meta: { role: u.role } })
        return { ok: true, data: u }
      },

      deconnecter() {
        track('deconnexion', { userId: user?.id ?? null })
        definirUtilisateurCourant(null)
        save({ ...d, sessionUserId: null })
      },

      async reinitialiser(email, nouveau) {
        const u = d.users.find((x) => x.email.toLowerCase() === email.trim().toLowerCase())
        if (nouveau.length < 8 || !/[A-Z]/.test(nouveau) || !/[0-9]/.test(nouveau))
          return { ok: false, message: 'Mot de passe trop faible : 8 caractères minimum, une majuscule et un chiffre.' }
        if (!u) return { ok: true, message: 'Si un compte existe, les instructions ont été envoyées.' }
        const salt = genSalt()
        const hash = await hashPassword(nouveau, salt)
        save({ ...d, users: d.users.map((x) => (x.id === u.id ? { ...x, salt, hash } : x)) })
        return { ok: true, message: 'Mot de passe mis à jour. Vous pouvez vous connecter.' }
      },

      majProfil(p) {
        if (!user) return { ok: false, message: 'Non authentifié.' }
        save({ ...d, users: d.users.map((u) => (u.id === user.id ? { ...u, ...p } : u)) })
        return { ok: true, message: 'Profil mis à jour.' }
      },

      async changerMotDePasse(actuel, nouveau) {
        if (!user) return { ok: false, message: 'Non authentifié.' }
        const ok = await verifyPassword(actuel, user.salt, user.hash)
        if (!ok) return { ok: false, message: 'Mot de passe actuel incorrect.' }
        if (nouveau.length < 8 || !/[A-Z]/.test(nouveau) || !/[0-9]/.test(nouveau))
          return { ok: false, message: 'Nouveau mot de passe trop faible.' }
        const salt = genSalt()
        const hash = await hashPassword(nouveau, salt)
        save({ ...d, users: d.users.map((u) => (u.id === user.id ? { ...u, salt, hash } : u)) })
        return { ok: true, message: 'Mot de passe modifié.' }
      },

      creerBoutique(p) {
        if (!user) return { ok: false, message: 'Connectez-vous pour créer une boutique.' }
        if (d.shops.some((s) => s.ownerId === user.id)) return { ok: false, message: 'Vous possédez déjà une boutique.' }
        if (p.nom.trim().length < 3) return { ok: false, message: 'Le nom de la boutique est trop court.' }
        let slug = slugify(p.slug || p.nom)
        if (!slug) return { ok: false, message: 'Adresse de boutique invalide.' }
        if (d.shops.some((s) => s.slug === slug)) slug = `${slug}-${Math.floor(Math.random() * 900 + 100)}`
        const shop: Shop = {
          ...p, slug, id: uid('s'), ownerId: user.id, verifiee: false, createdAt: Date.now(),
        }
        save({
          ...d,
          shops: [...d.shops, shop],
          users: d.users.map((u) => (u.id === user.id && u.role === 'acheteur' ? { ...u, role: 'vendeur' } : u)),
        })
        return { ok: true, data: shop }
      },

      majBoutique(id, p) {
        if (!user) return { ok: false, message: 'Non authentifié.' }
        const shop = d.shops.find((s) => s.id === id)
        if (!shop) return { ok: false, message: 'Boutique introuvable.' }
        if (shop.ownerId !== user.id && user.role !== 'admin')
          return { ok: false, message: "Accès refusé : cette boutique ne vous appartient pas." }
        const patch = { ...p }
        delete (patch as any).ownerId
        delete (patch as any).id
        if (user.role !== 'admin') delete (patch as any).verifiee
        if (patch.slug) {
          const s2 = slugify(patch.slug)
          patch.slug = d.shops.some((s) => s.slug === s2 && s.id !== id) ? `${s2}-${Math.floor(Math.random() * 900 + 100)}` : s2
        }
        save({ ...d, shops: d.shops.map((s) => (s.id === id ? { ...s, ...patch } : s)) })
        return { ok: true, message: 'Boutique mise à jour.' }
      },

      creerProduit(p) {
        if (!user) return { ok: false, message: 'Non authentifié.' }
        const shop = d.shops.find((s) => s.id === p.shopId)
        if (!shop) return { ok: false, message: 'Boutique introuvable.' }
        if (shop.ownerId !== user.id && user.role !== 'admin') return { ok: false, message: 'Accès refusé.' }
        if (p.titre.trim().length < 4) return { ok: false, message: 'Le titre est trop court.' }
        if (!Number.isFinite(p.prix) || p.prix < 0) return { ok: false, message: 'Prix invalide.' }
        if (p.prix > 0 && p.prix < 500) return { ok: false, message: 'Le prix minimum est de 500 FCFA (ou 0 pour un produit gratuit).' }
        const prod: Product = { ...p, id: uid('p'), ventes: 0, createdAt: Date.now() }
        save({ ...d, products: [prod, ...d.products] })
        return { ok: true, data: prod, message: 'Produit enregistré.' }
      },

      majProduit(id, p) {
        if (!user) return { ok: false, message: 'Non authentifié.' }
        const prod = d.products.find((x) => x.id === id)
        if (!prod) return { ok: false, message: 'Produit introuvable.' }
        const shop = d.shops.find((s) => s.id === prod.shopId)
        if (!shop || (shop.ownerId !== user.id && user.role !== 'admin'))
          return { ok: false, message: 'Accès refusé : ce produit appartient à une autre boutique.' }
        const patch = { ...p }
        delete (patch as any).id
        delete (patch as any).shopId
        delete (patch as any).ventes
        save({ ...d, products: d.products.map((x) => (x.id === id ? { ...x, ...patch } : x)) })
        return { ok: true, message: 'Produit mis à jour.' }
      },

      supprimerProduit(id) {
        if (!user) return { ok: false, message: 'Non authentifié.' }
        const prod = d.products.find((x) => x.id === id)
        if (!prod) return { ok: false, message: 'Produit introuvable.' }
        const shop = d.shops.find((s) => s.id === prod.shopId)
        if (!shop || (shop.ownerId !== user.id && user.role !== 'admin')) return { ok: false, message: 'Accès refusé.' }
        const nextCart = { ...d.cart }
        Object.keys(nextCart).forEach((k) => (nextCart[k] = nextCart[k].filter((x) => x !== id)))
        save({ ...d, products: d.products.filter((x) => x.id !== id), cart: nextCart })
        return { ok: true, message: 'Produit supprimé.' }
      },

      ajouterAuPanier(productId) {
        const prod = d.products.find((p) => p.id === productId)
        if (!prod || prod.statut !== 'publie') return { ok: false, message: 'Produit indisponible.' }
        if (user) {
          const shop = d.shops.find((s) => s.id === prod.shopId)
          if (shop?.ownerId === user.id) return { ok: false, message: 'Vous ne pouvez pas acheter votre propre produit.' }
          const possede = d.orders.some(
            (o) => o.buyerId === user.id && o.statut === 'payee' && o.items.some((i) => i.productId === productId),
          )
          if (possede) return { ok: false, message: 'Vous possédez déjà ce produit.' }
        }
        const list = d.cart[cartKey] ?? []
        if (list.includes(productId)) return { ok: false, message: 'Déjà dans votre panier.' }
        save({ ...d, cart: { ...d.cart, [cartKey]: [...list, productId] } })
        track('panier_ajout', {
          productId, shopId: prod.shopId,
          meta: { prix: prod.prix, categorie: prod.categorie, titre: prod.titre },
        })
        return { ok: true, message: 'Ajouté au panier.' }
      },

      retirerDuPanier(productId) {
        const list = d.cart[cartKey] ?? []
        const prod = d.products.find((p) => p.id === productId)
        save({ ...d, cart: { ...d.cart, [cartKey]: list.filter((x) => x !== productId) } })
        track('panier_retrait', { productId, shopId: prod?.shopId, meta: { prix: prod?.prix ?? 0 } })
      },

      viderPanier() {
        save({ ...d, cart: { ...d.cart, [cartKey]: [] } })
      },

      creerCommande(methode) {
        if (!user) return { ok: false, message: 'Connectez-vous pour commander.' }
        if (user.role === 'admin') return { ok: false, message: "Un compte administrateur ne peut pas passer commande." }
        if (panier.length === 0) return { ok: false, message: 'Votre panier est vide.' }
        const items = panier.map((p) => ({ productId: p.id, titre: p.titre, prix: p.prix, shopId: p.shopId, image: p.image }))
        const total = items.reduce((s, i) => s + i.prix, 0)
        const order: Order = {
          id: uid('o'),
          reference: refCommande(),
          buyerId: user.id,
          items,
          total,
          devise: 'XOF',
          statut: 'en_attente',
          methode,
          commission: Math.round((total * d.settings.commission) / 100),
          createdAt: Date.now(),
          updatedAt: Date.now(),
          journal: [{ at: Date.now(), message: `Commande créée — ${total} XOF — moyen choisi : ${methode}` }],
        }
        save({ ...d, orders: [order, ...d.orders], cart: { ...d.cart, [cartKey]: [] } })
        track('checkout_debut', { meta: { articles: items.length, montant: total, methode } })
        track('commande_creee', { meta: { reference: order.reference, montant: total, methode } })
        return { ok: true, data: order }
      },

      annulerCommande(orderId) {
        if (!user) return { ok: false, message: 'Non authentifié.' }
        const o = d.orders.find((x) => x.id === orderId)
        if (!o) return { ok: false, message: 'Commande introuvable.' }
        if (o.buyerId !== user.id && user.role !== 'admin') return { ok: false, message: 'Accès refusé.' }
        if (o.statut !== 'en_attente') return { ok: false, message: 'Seule une commande en attente peut être annulée.' }
        const next: Order = {
          ...o, statut: 'annulee' as OrderStatut, updatedAt: Date.now(),
          journal: [...o.journal, { at: Date.now(), message: 'Commande annulée par ' + (o.buyerId === user.id ? "l'acheteur" : "l'administrateur") }],
        }
        save({ ...d, orders: d.orders.map((x) => (x.id === orderId ? next : x)) })
        return { ok: true, message: 'Commande annulée.' }
      },

      // Enregistrement d'une confirmation de paiement. Dans l'architecture cible,
      // cette fonction est l'équivalent du traitement de la notification (webhook)
      // du prestataire, exécuté côté serveur après vérification de la signature.
      confirmerPaiement(orderId, p) {
        if (!user || user.role !== 'admin')
          return { ok: false, message: "Seul le serveur de paiement (espace administrateur) peut confirmer un règlement." }
        const o = d.orders.find((x) => x.id === orderId)
        if (!o) return { ok: false, message: 'Commande introuvable.' }
        if (o.statut === 'payee') return { ok: false, message: 'Notification ignorée : commande déjà payée (idempotence).' }
        if (o.statut !== 'en_attente') return { ok: false, message: `Commande au statut « ${o.statut} » : confirmation refusée.` }
        if (d.orders.some((x) => x.transactionId && x.transactionId === p.transactionId)) {
          track('erreur', { meta: { contexte: 'webhook', motif: 'transaction déjà traitée', commande: o.reference } })
          return { ok: false, message: 'Notification ignorée : identifiant de transaction déjà traité.' }
        }
        if (p.devise !== 'XOF') {
          track('erreur', { meta: { contexte: 'webhook', motif: 'devise non conforme', commande: o.reference } })
          return { ok: false, message: 'Devise non conforme : XOF attendu.' }
        }
        if (Math.round(p.montant) !== Math.round(o.total)) {
          track('erreur', { meta: { contexte: 'webhook', motif: 'montant non conforme', commande: o.reference } })
          return { ok: false, message: `Montant non conforme : ${p.montant} reçu, ${o.total} attendu.` }
        }
        const next: Order = {
          ...o, statut: 'payee', transactionId: p.transactionId, updatedAt: Date.now(),
          journal: [...o.journal, { at: Date.now(), message: `Paiement confirmé et vérifié — transaction ${p.transactionId}` }],
        }
        const ids = new Set(o.items.map((i) => i.productId))
        save({
          ...d,
          orders: d.orders.map((x) => (x.id === orderId ? next : x)),
          products: d.products.map((pr) => (ids.has(pr.id) ? { ...pr, ventes: pr.ventes + 1 } : pr)),
        })
        track('paiement_confirme', {
          userId: o.buyerId,
          meta: { reference: o.reference, montant: o.total, transaction: p.transactionId },
        })
        track('admin_action', { meta: { action: 'validation notification paiement', commande: o.reference } })
        return { ok: true, message: 'Paiement vérifié. Accès aux fichiers débloqué pour l’acheteur.' }
      },

      marquerEchec(orderId, raison) {
        if (!user || user.role !== 'admin') return { ok: false, message: 'Accès refusé.' }
        const o = d.orders.find((x) => x.id === orderId)
        if (!o || o.statut !== 'en_attente') return { ok: false, message: 'Opération impossible.' }
        const next: Order = {
          ...o, statut: 'echouee', updatedAt: Date.now(),
          journal: [...o.journal, { at: Date.now(), message: 'Paiement échoué — ' + raison }],
        }
        save({ ...d, orders: d.orders.map((x) => (x.id === orderId ? next : x)) })
        track('paiement_echoue', { userId: o.buyerId, meta: { reference: o.reference, montant: o.total, motif: raison } })
        return { ok: true, message: 'Commande marquée comme échouée.' }
      },

      majParametres(p) {
        if (!user || user.role !== 'admin') return { ok: false, message: 'Accès refusé.' }
        save({ ...d, settings: { ...d.settings, ...p } })
        track('admin_action', { meta: { action: 'modification des paramètres de la plateforme' } })
        return { ok: true, message: 'Paramètres enregistrés.' }
      },

      basculerSuspension(userId) {
        if (!user || user.role !== 'admin') return { ok: false, message: 'Accès refusé.' }
        if (userId === user.id) return { ok: false, message: 'Impossible de suspendre votre propre compte.' }
        save({ ...d, users: d.users.map((u) => (u.id === userId ? { ...u, suspendu: !u.suspendu } : u)) })
        track('admin_action', { meta: { action: 'changement de statut de compte', compte: userId } })
        return { ok: true, message: 'Statut du compte mis à jour.' }
      },

      verifierBoutique(shopId) {
        if (!user || user.role !== 'admin') return { ok: false, message: 'Accès refusé.' }
        save({ ...d, shops: d.shops.map((s) => (s.id === shopId ? { ...s, verifiee: !s.verifiee } : s)) })
        return { ok: true, message: 'Certification mise à jour.' }
      },

      signaler(productId, motif) {
        if (!user) return { ok: false, message: 'Connectez-vous pour signaler un produit.' }
        if (motif.trim().length < 5) return { ok: false, message: 'Merci de préciser le motif.' }
        save({
          ...d,
          signalements: [
            { id: uid('r'), productId, userId: user.id, motif: motif.trim(), traite: false, createdAt: Date.now() },
            ...d.signalements,
          ],
        })
        return { ok: true, message: 'Signalement transmis à la modération.' }
      },

      traiterSignalement(id) {
        if (!user || user.role !== 'admin') return { ok: false, message: 'Accès refusé.' }
        save({ ...d, signalements: d.signalements.map((s) => (s.id === id ? { ...s, traite: true } : s)) })
        return { ok: true, message: 'Signalement traité.' }
      },

      reinitialiserDemo() {
        localStorage.removeItem(KEY)
        buildSeed().then((seed) => {
          localStorage.setItem(KEY, JSON.stringify(seed))
          setDb(seed)
        })
      },
    }
  }, [db])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useStore() {
  const v = useContext(Ctx)
  if (!v) throw new Error('useStore doit être utilisé dans StoreProvider')
  return v
}
