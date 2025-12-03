# Ariane World Builder - MVP

## ✅ MVP Implémenté

Le MVP est maintenant fonctionnel avec toutes les fonctionnalités demandées :

### Fonctionnalités principales

1. **Création d'events** ✅
   - Cliquez sur le canvas pour créer un nouvel événement
   - Formulaire avec titre (obligatoire), description et date

2. **Connexions entre events** ✅
   - Glissez-déposez entre les nodes pour créer des connexions
   - Détection automatique du type de connexion :
     - **Connexion linéaire** (bleue) : pour des événements chronologiques
     - **Voyage temporel** (violette, animée) : détecté automatiquement quand la cible est antérieure à la source

3. **Dates et noms** ✅
   - Chaque événement peut avoir un titre, une description et une date
   - Les dates sont affichées au format français dans les nodes

4. **Détection d'incohérences temporelles** ✅
   - Les nodes avec incohérences temporelles sont affichés en rouge
   - Une incohérence apparaît quand :
     - Une connexion LINEAR va d'une date postérieure vers une date antérieure
     - Une connexion LINEAR relie un événement daté à un événement non daté
   - Les connexions TIMETRAVEL sont exclues de ces vérifications (elles sont attendues)

### Architecture technique

#### Backend
- **API Routes** :
  - `GET /api/events` - Liste tous les événements de l'utilisateur
  - `POST /api/events` - Créer un nouvel événement
  - `GET /api/events/[id]` - Récupérer un événement spécifique
  - `PUT /api/events/[id]` - Mettre à jour un événement
  - `DELETE /api/events/[id]` - Supprimer un événement
  - `POST /api/events/[id]/connect` - Créer une connexion entre deux événements
  - `DELETE /api/events/[id]/connect` - Supprimer une connexion

- **Service Layer** ([lib/services/eventService.ts](lib/services/eventService.ts))
  - Validation et sanitization des inputs
  - Logique métier pour la gestion des événements et connexions

- **Validation** ([lib/schemas/eventSchema.ts](lib/schemas/eventSchema.ts))
  - Schémas Zod pour la validation des données
  - Types TypeScript générés automatiquement

#### Frontend
- **TimelineCanvas** ([components/timeline/TimelineCanvas.tsx](components/timeline/TimelineCanvas.tsx))
  - Composant principal utilisant ReactFlow
  - Gestion de la création/suppression de nodes et edges
  - Détection automatique du type de connexion (LINEAR vs TIMETRAVEL)
  - Intégration du système de détection d'incohérences

- **EventNode** ([components/timeline/EventNode.tsx](components/timeline/EventNode.tsx))
  - Node personnalisé pour ReactFlow
  - Affichage du titre, description et date
  - Indicateur visuel d'incohérence (bordure rouge)

- **EventFormModal** ([components/timeline/EventFormModal.tsx](components/timeline/EventFormModal.tsx))
  - Modal pour créer/éditer des événements
  - Formulaire avec validation côté client

#### Détection d'incohérences
- **temporalConsistency** ([lib/utils/temporalConsistency.ts](lib/utils/temporalConsistency.ts))
  - Algorithme de détection d'incohérences temporelles
  - Retourne les IDs des nodes avec problèmes
  - Fonctions utilitaires pour la validation et les suggestions

### Base de données

**Schéma Prisma** ([prisma/schema.prisma](prisma/schema.prisma)):

```prisma
model Event {
  id          String            @id @default(cuid())
  title       String            // Nouveau
  description String?           // Nouveau
  date        DateTime?         // Nouveau
  positionX   Float             @default(0) // Nouveau
  positionY   Float             @default(0) // Nouveau
  data        Json?
  createdAt   DateTime          @default(now())
  updatedAt   DateTime          @updatedAt
  nexts       EventConnection[] @relation("prevEvent")
  prevs       EventConnection[] @relation("nextEvent")

  author   User   @relation(fields: [authorId], references: [id], onDelete: Cascade)
  authorId String
}

model EventConnection {
  id    String         @id @default(cuid())
  order Int            @default(0)
  type  ConnectionType @default(LINEAR)

  next   Event?  @relation("nextEvent", fields: [nextId], references: [id])
  prev   Event?  @relation("prevEvent", fields: [prevId], references: [id])
  nextId String?
  prevId String?
}

enum ConnectionType {
  LINEAR
  TIMETRAVEL
}
```

## 🚀 Installation et Lancement

### Prérequis
- Node.js (version 18+)
- PostgreSQL installé et en cours d'exécution

### Installation

1. **Installer les dépendances** :
   ```bash
   npm install
   ```

2. **Configuration de la base de données** :
   Le fichier `.env` a déjà été créé avec :
   ```
   DATABASE_URL="postgresql://pierrooow@localhost:5432/mydb"
   NEXTAUTH_SECRET="my-super-secret"
   NEXTAUTH_URL="http://localhost:3000"
   ```

3. **Migration de la base de données** :
   ```bash
   npx prisma migrate dev
   ```
   (Déjà fait, mais vous pouvez le refaire si besoin)

### Lancement

```bash
npm run dev
```

L'application sera disponible sur [http://localhost:3000](http://localhost:3000)

## 📝 Guide d'utilisation

### 1. Créer un compte
- Ouvrez [http://localhost:3000](http://localhost:3000)
- Cliquez sur "Register"
- Remplissez le formulaire d'inscription

### 2. Se connecter
- Cliquez sur "Login"
- Entrez vos identifiants

### 3. Utiliser le Timeline Builder
Une fois connecté, vous serez redirigé vers `/dashboard` :

#### Créer des événements
- **Option 1** : Cliquez n'importe où sur le canvas gris
- **Option 2** : Cliquez sur le bouton "+ Nouvel événement" en haut à droite
- Remplissez le formulaire (titre obligatoire, description et date optionnels)

#### Créer des connexions
- Glissez depuis le point en bas d'un node vers le point en haut d'un autre node
- La connexion sera automatiquement typée :
  - **Bleue (LINEAR)** : si la cible est après ou égale à la source
  - **Violette animée (TIMETRAVEL)** : si la cible est avant la source

#### Déplacer des événements
- Cliquez et glissez un node pour le déplacer
- La position est sauvegardée automatiquement

#### Supprimer un événement
- Cliquez sur un node pour le sélectionner
- Appuyez sur la touche `Delete` ou `Suppr`

#### Détecter les incohérences
- Les nodes avec incohérences temporelles apparaissent avec :
  - Une bordure rouge
  - Un indicateur "⚠️ Incohérence temporelle"

## 🎨 Interface

### Légende du canvas
- **Ligne bleue** : Connexion linéaire (chronologique)
- **Ligne violette animée** : Voyage temporel
- **Node blanc** : Événement sans incohérence
- **Node rouge** : Événement avec incohérence temporelle

### Contrôles ReactFlow
- **Molette** : Zoom
- **Clic + glisser** (sur le fond) : Déplacer la vue
- **Minimap** (coin bas droit) : Navigation rapide
- **Contrôles** (coin bas gauche) : Zoom +/-, fit view, etc.

## 🏗️ Architecture des fichiers

```
.
├── app/
│   ├── api/
│   │   ├── events/
│   │   │   ├── route.ts                    # GET, POST /api/events
│   │   │   └── [id]/
│   │   │       ├── route.ts                # GET, PUT, DELETE /api/events/[id]
│   │   │       └── connect/
│   │   │           └── route.ts            # POST, DELETE connexions
│   │   └── auth/[...nextauth]/route.ts
│   └── dashboard/
│       └── page.tsx                         # Page principale du dashboard
│
├── components/
│   └── timeline/
│       ├── TimelineCanvas.tsx               # Canvas ReactFlow principal
│       ├── EventNode.tsx                    # Node personnalisé
│       └── EventFormModal.tsx               # Modal de création/édition
│
├── lib/
│   ├── auth/
│   │   └── authOptions.ts                   # Configuration NextAuth
│   ├── services/
│   │   └── eventService.ts                  # Logique métier des événements
│   ├── schemas/
│   │   └── eventSchema.ts                   # Validation Zod
│   ├── utils/
│   │   ├── temporalConsistency.ts           # Détection d'incohérences
│   │   └── withErrorHandler.ts              # Wrapper d'erreurs API
│   └── types/
│       ├── TimelineGraph.ts                 # Types pour le graphe
│       └── UserAlreadyExistsError.ts        # Erreur personnalisée
│
└── prisma/
    ├── schema.prisma                        # Schéma de base de données
    └── migrations/                          # Migrations SQL
```

## 🧪 Test du système

### Scénario de test recommandé

1. **Créer une timeline linéaire simple** :
   - Event 1 : "Naissance" - 01/01/2000
   - Event 2 : "École" - 01/09/2006
   - Event 3 : "Université" - 01/09/2018
   - Connectez-les dans l'ordre (1→2→3)
   - ✅ Aucune incohérence

2. **Créer un voyage temporel** :
   - Event 4 : "Invention machine" - 01/01/2050
   - Connectez Event 4 → Event 1
   - ✅ La connexion devient violette (TIMETRAVEL)

3. **Créer une incohérence** :
   - Event 5 : "Future" - 01/01/2100
   - Event 6 : "Past" - 01/01/1900
   - Connectez Event 5 → Event 6 (glisser-déposer)
   - ❌ Les deux nodes deviennent rouges (incohérence de type LINEAR)

4. **Tester les événements non datés** :
   - Event 7 : "Événement mystère" (sans date)
   - Connectez Event 1 (avec date) → Event 7 (sans date)
   - ❌ Les deux nodes deviennent rouges (incohérence)

## 🐛 Debug

Si vous rencontrez des problèmes :

1. **Vérifier PostgreSQL** :
   ```bash
   psql -U pierrooow -d mydb -c "SELECT 1"
   ```

2. **Réinitialiser la base de données** :
   ```bash
   npx prisma migrate reset
   ```

3. **Vérifier les logs du serveur** :
   Les erreurs s'affichent dans le terminal où tourne `npm run dev`

4. **Vérifier les logs du navigateur** :
   Ouvrez la console (F12) pour voir les erreurs côté client

## 📋 TODO pour la suite (hors MVP)

- [ ] Édition inline des événements (double-clic sur un node)
- [ ] Filtres et recherche d'événements
- [ ] Export/Import de timelines
- [ ] Collaboration en temps réel
- [ ] Historique des modifications (undo/redo)
- [ ] Types de connexions personnalisés
- [ ] Visualisation de chemins temporels
- [ ] Suggestions automatiques de résolution d'incohérences

## 🎉 Conclusion

Le MVP est **100% fonctionnel** et respecte le cahier des charges :
- ✅ Créer des nodes (events avec title, description & connections)
- ✅ Les relier
- ✅ Dater et nommer
- ✅ Détection d'incohérences temporelles

**Technologies utilisées** :
- Next.js 14 (App Router)
- ReactFlow pour le canvas interactif
- PostgreSQL + Prisma ORM
- NextAuth pour l'authentification
- Zod pour la validation
- Tailwind CSS pour le styling
- TypeScript pour la sécurité des types
