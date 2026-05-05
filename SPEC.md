# SPEC.md — Gestionnaire de Collection de Cartes à Jouer

## Vision du projet

Application web permettant aux collectionneurs de cartes à jouer de gérer leur collection via des **classeurs virtuels** personnalisables. Les données des cartes proviennent d'APIs externes (pas de stockage local des cartes). L'utilisateur crée des classeurs, y range ses cartes, et visualise sa collection de façon organisée.

---

## Stack technique

| Couche | Technologie |
|---|---|
| Frontend | React + TypeScript + Tailwind CSS |
| Framework full-stack | Next.js (App Router) |
| Base de données | PostgreSQL via Supabase |
| Authentification | Clerk |
| Hébergement | Vercel |
| Outillage local | Visual Studio Code |
| Assistant IA | Claude Code |

---

## Architecture générale

```
┌─────────────────────────────────────────────────────┐
│                    Vercel (hosting)                  │
│  ┌───────────────────────────────────────────────┐  │
│  │              Next.js App Router               │  │
│  │  ┌─────────────────┐  ┌────────────────────┐  │  │
│  │  │   Frontend React │  │   API Routes       │  │  │
│  │  │   + Tailwind CSS │  │   /api/*           │  │  │
│  │  └────────┬─────────┘  └────────┬───────────┘  │  │
│  └───────────┼───────────────────── ┼──────────────┘  │
└─────────────────────────────────────────────────────┘
              │                       │
     ┌────────▼────────┐    ┌─────────▼──────────┐
     │  APIs externes  │    │  Supabase (Postgres)│
     │  PokémonTCG     │    │  Clerk (Auth)       │
     │  Scryfall/Magic │    └────────────────────┘
     │  DragonBall, …  │
     └─────────────────┘
```

---

## Modèle de données (PostgreSQL / Supabase)

### Table `binders` — Classeurs
```sql
CREATE TABLE binders (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     TEXT NOT NULL,           -- Clerk user ID
  name        VARCHAR(100) NOT NULL,
  description TEXT,
  color       VARCHAR(7) NOT NULL,     -- Couleur HEX (#RRGGBB)
  page_format INT NOT NULL CHECK (page_format IN (4, 9, 12)), -- cartes/page
  cover_image TEXT,                    -- URL optionnelle image de couverture
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);
```

### Table `binder_cards` — Cartes dans les classeurs
```sql
CREATE TABLE binder_cards (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  binder_id   UUID REFERENCES binders(id) ON DELETE CASCADE,
  user_id     TEXT NOT NULL,           -- Clerk user ID
  card_id     TEXT NOT NULL,           -- ID externe (API source)
  game        VARCHAR(50) NOT NULL,    -- 'pokemon', 'magic', 'dragonball', 'swu', ...
  page_number INT NOT NULL DEFAULT 1,
  slot        INT NOT NULL,            -- position dans la page (1 à page_format)
  quantity    INT NOT NULL DEFAULT 1,
  condition   VARCHAR(20),             -- 'mint', 'near_mint', 'excellent', 'good', 'poor'
  is_foil     BOOLEAN DEFAULT false,
  notes       TEXT,
  added_at    TIMESTAMPTZ DEFAULT now(),
  UNIQUE (binder_id, page_number, slot)
);
```

### Table `user_settings` — Préférences utilisateur
```sql
CREATE TABLE user_settings (
  user_id     TEXT PRIMARY KEY,        -- Clerk user ID
  default_game VARCHAR(50) DEFAULT 'pokemon',
  theme       VARCHAR(20) DEFAULT 'light',
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);
```

### Politiques RLS (Row Level Security)
```sql
-- Activer RLS sur toutes les tables
ALTER TABLE binders ENABLE ROW LEVEL SECURITY;
ALTER TABLE binder_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Chaque utilisateur ne voit que ses propres données
CREATE POLICY "users_own_binders" ON binders
  USING (user_id = auth.jwt() ->> 'sub');

CREATE POLICY "users_own_cards" ON binder_cards
  USING (user_id = auth.jwt() ->> 'sub');

CREATE POLICY "users_own_settings" ON user_settings
  USING (user_id = auth.jwt() ->> 'sub');
```

---

## APIs externes de cartes

### Jeux supportés (phase 1)

| Jeu | API | Base URL | Auth |
|---|---|---|---|
| Pokémon TCG | pokemontcg.io | `https://api.pokemontcg.io/v2` | API Key (header) |
| Magic: The Gathering | Scryfall | `https://api.scryfall.com` | Aucune |
| Dragon Ball Super | DBSCG API | `https://www.dbscg.net/api` | À confirmer |
| Star Wars Unlimited | SWU API | À identifier | À confirmer |

### Interface commune (adapter pattern)
Chaque API est wrappée dans un adaptateur uniforme :
```typescript
interface CardAdapter {
  search(query: string, options?: SearchOptions): Promise<CardResult[]>
  getById(id: string): Promise<Card>
  getImage(card: Card): string   // URL image recto
  getSet(card: Card): string
  getName(card: Card): string
}

interface Card {
  id: string
  game: GameType
  name: string
  setName: string
  setCode: string
  number: string
  imageUrl: string
  imageUrlHiRes?: string
  rarity?: string
  types?: string[]
  artist?: string
  rawData: unknown   // données brutes de l'API source
}
```

---

## Structure du projet Next.js

```
/
├── app/
│   ├── (auth)/
│   │   ├── sign-in/[[...sign-in]]/page.tsx
│   │   └── sign-up/[[...sign-up]]/page.tsx
│   ├── (app)/
│   │   ├── layout.tsx              # Layout avec sidebar + header
│   │   ├── dashboard/page.tsx      # Vue d'ensemble des classeurs
│   │   ├── binders/
│   │   │   ├── page.tsx            # Liste des classeurs
│   │   │   ├── new/page.tsx        # Créer un classeur
│   │   │   └── [id]/
│   │   │       ├── page.tsx        # Vue classeur (pages + cartes)
│   │   │       └── edit/page.tsx   # Modifier le classeur
│   │   ├── search/page.tsx         # Recherche de cartes (toutes APIs)
│   │   └── settings/page.tsx       # Préférences utilisateur
│   ├── api/
│   │   ├── binders/
│   │   │   ├── route.ts            # GET list, POST create
│   │   │   └── [id]/
│   │   │       ├── route.ts        # GET, PUT, DELETE
│   │   │       └── cards/route.ts  # GET cards, POST add card
│   │   ├── cards/
│   │   │   └── [binderId]/[cardId]/route.ts  # PUT, DELETE card
│   │   └── search/
│   │       └── [game]/route.ts     # Proxy vers APIs externes
│   ├── layout.tsx                  # Root layout (Clerk Provider)
│   └── globals.css
├── components/
│   ├── ui/                         # Composants de base (shadcn/ui)
│   ├── binders/
│   │   ├── BinderCard.tsx          # Vignette d'un classeur
│   │   ├── BinderForm.tsx          # Formulaire création/édition
│   │   ├── BinderPage.tsx          # Une page du classeur (grille 4/9/12)
│   │   └── BinderViewer.tsx        # Visualiseur multi-pages
│   ├── cards/
│   │   ├── CardSlot.tsx            # Emplacement dans une page
│   │   ├── CardThumbnail.tsx       # Miniature de carte
│   │   ├── CardDetail.tsx          # Modal détail d'une carte
│   │   └── CardSearch.tsx          # Barre de recherche + résultats
│   └── layout/
│       ├── Header.tsx
│       ├── Sidebar.tsx
│       └── GameSelector.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts               # Client Supabase (browser)
│   │   └── server.ts               # Client Supabase (server)
│   ├── adapters/
│   │   ├── index.ts                # Factory : getAdapter(game)
│   │   ├── pokemon.ts              # Adaptateur PokémonTCG
│   │   ├── magic.ts                # Adaptateur Scryfall
│   │   ├── dragonball.ts
│   │   └── swu.ts
│   └── utils.ts
├── types/
│   ├── binder.ts
│   ├── card.ts
│   └── database.ts                 # Types générés par Supabase CLI
├── hooks/
│   ├── useBinders.ts
│   ├── useCards.ts
│   └── useCardSearch.ts
├── middleware.ts                    # Clerk auth middleware
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── .env.local                      # Variables d'environnement (ne pas committer)
```

---

## Variables d'environnement

```bash
# .env.local

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...   # Côté serveur uniquement

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# APIs externes
POKEMON_TCG_API_KEY=...            # pokemontcg.io (optionnel mais recommandé)
```

---

## Fonctionnalités — Classeurs

### Création / édition d'un classeur
- **Nom** : texte libre (max 100 caractères)
- **Couleur** : color picker (couleur de la tranche/couverture)
- **Description** : texte libre (max 500 caractères)
- **Format de page** : 4 / 9 / 12 cartes par page
  - 4 cartes → grille 2×2
  - 9 cartes → grille 3×3
  - 12 cartes → grille 4×3
- **Image de couverture** : upload optionnel (stocké dans Supabase Storage)

### Visualisation d'un classeur
- Navigation page par page (flèches, minimap)
- Vue double-page (optionnelle, à implémenter en v2)
- Drag & drop des cartes entre slots
- Clic sur une carte → modal de détail
- Clic sur un slot vide → ouverture de la recherche

### Gestion des cartes dans un classeur
- Ajouter une carte dans un slot précis
- Déplacer une carte (drag & drop)
- Retirer une carte
- Annoter : condition, foil, notes personnelles

---

## Fonctionnalités — Recherche de cartes

- Sélection du jeu (Pokémon / Magic / Dragon Ball / Star Wars)
- Barre de recherche textuelle (nom de carte, set, numéro)
- Filtres avancés (type, rareté, extension)
- Résultats avec image, nom, set
- Clic pour ajouter au classeur courant (sélection du slot)
- Pagination ou scroll infini

---

## Roadmap

### v1 — MVP
- [x] Setup projet (Next.js + Tailwind + Clerk + Supabase)
- [x] Authentification (sign-in / sign-up via Clerk)
- [x] CRUD classeurs
- [x] Visualiseur de classeur avec pages
- [x] Recherche Pokémon TCG + ajout dans un classeur
- [ ] Déploiement Vercel

### v2
- [ ] Support Magic: The Gathering (Scryfall)
- [ ] Support Dragon Ball Super Card Game
- [ ] Support Star Wars Unlimited
- [ ] Drag & drop entre slots
- [ ] Export PDF d'un classeur
- [ ] Partage de classeur (lien public)

### v3
- [ ] Stats de collection (valeur estimée, raretés)
- [ ] Mode "want list" / "trade list"
- [ ] Scan de carte (OCR / reconnaissance d'image)
- [ ] Application mobile (React Native ou PWA)

---

## Conventions de code

- **Langage** : TypeScript strict (`"strict": true` dans tsconfig)
- **Style** : ESLint + Prettier
- **Composants** : fonctionnels, hooks uniquement (pas de classes)
- **Nommage** :
  - Composants : `PascalCase`
  - Fonctions/variables : `camelCase`
  - Fichiers composants : `PascalCase.tsx`
  - Fichiers utilitaires : `camelCase.ts`
- **API routes** : RESTful, retournent toujours `{ data, error }`
- **Gestion d'état** : React Query (TanStack Query) pour le cache serveur, useState/useReducer pour l'état local

---

## Commandes utiles

```bash
# Installation des dépendances
npm install

# Développement local
npm run dev

# Build production
npm run build

# Génération des types Supabase
npx supabase gen types typescript --project-id <project-id> > types/database.ts

# Lint
npm run lint

# Tests (à configurer)
npm run test
```

---

## Références

- [Next.js App Router](https://nextjs.org/docs/app)
- [Supabase + Next.js](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)
- [Clerk + Next.js](https://clerk.com/docs/quickstarts/nextjs)
- [PokémonTCG API](https://docs.pokemontcg.io/)
- [Scryfall API](https://scryfall.com/docs/api)
- [TanStack Query](https://tanstack.com/query/latest)
- [Tailwind CSS](https://tailwindcss.com/docs)
