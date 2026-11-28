export type Role = 'acheteur' | 'vendeur' | 'admin'

export type User = {
  id: string
  nom: string
  email: string
  salt: string
  hash: string
  role: Role
  telephone?: string
  bio?: string
  ville?: string
  suspendu?: boolean
  createdAt: number
}

export type Shop = {
  id: string
  ownerId: string
  nom: string
  slug: string
  description: string
  logo: string // emoji
  couleur: string // hex accent
  banniere: string // image url or gradient key
  categorie: string
  whatsapp?: string
  verifiee: boolean
  createdAt: number
}

export type ProductType = 'ebook' | 'formation' | 'modele' | 'graphique' | 'audio' | 'video'

export type Product = {
  id: string
  shopId: string
  titre: string
  description: string
  categorie: string
  type: ProductType
  prix: number // FCFA
  image: string
  fichierNom: string
  fichierTaille: string
  statut: 'publie' | 'brouillon'
  ventes: number
  createdAt: number
}

export type OrderItem = {
  productId: string
  titre: string
  prix: number
  shopId: string
  image: string
}

export type OrderStatut = 'en_attente' | 'payee' | 'echouee' | 'annulee'

export type Order = {
  id: string
  reference: string
  buyerId: string
  items: OrderItem[]
  total: number
  devise: 'XOF'
  statut: OrderStatut
  methode: string
  transactionId?: string
  commission: number
  createdAt: number
  updatedAt: number
  journal: { at: number; message: string }[]
}

export type Signalement = {
  id: string
  productId: string
  userId: string
  motif: string
  traite: boolean
  createdAt: number
}

export type Settings = {
  commission: number // pourcentage
  prestataire: 'CinetPay' | 'PayDunya'
  modePaiement: 'non_connecte' | 'sandbox'
  nomPlateforme: string
}

export type DB = {
  users: User[]
  shops: Shop[]
  products: Product[]
  orders: Order[]
  signalements: Signalement[]
  settings: Settings
  sessionUserId: string | null
  cart: Record<string, string[]> // userId|guest -> productIds
}
