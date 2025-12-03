# Ariane World Builder

Application de création et visualisation de timelines narratives avec gestion des voyages temporels.

---

## 📚 Documentation

### **[Ouvrir la documentation complète](docs/documentation.html)**

La documentation HTML interactive est disponible dans le dossier `docs/`. Ouvrez le fichier `docs/documentation.html` dans votre navigateur pour accéder à :
- Guide d'utilisation complet
- Fonctionnalités détaillées
- Architecture technique

---

## 🚀 Installation rapide

### Prérequis

| Outil | Requis | Téléchargement |
|-------|--------|----------------|
| **Docker** | Oui | [docker.com](https://www.docker.com/) |
| **Docker Compose** | Oui | Inclus avec Docker Desktop |
| **Git** | Oui | [git-scm.com](https://git-scm.com/) |

### Installation en une commande

**macOS / Linux / WSL :**
```bash
git clone https://github.com/VOTRE_USERNAME/Ariane-World-Builder.git && cd Ariane-World-Builder && chmod +x ./scripts/setup.sh && ./scripts/setup.sh
```

**Windows (PowerShell) :**
```powershell
git clone https://github.com/VOTRE_USERNAME/Ariane-World-Builder.git; cd Ariane-World-Builder; Set-ExecutionPolicy RemoteSigned -Scope CurrentUser; .\scripts\setup.ps1
```

---

## 📦 Installation détaillée

### macOS / Linux / WSL

```bash
# 1. Cloner le projet
git clone https://github.com/VOTRE_USERNAME/Ariane-World-Builder.git
cd Ariane-World-Builder

# 2. Lancer l'installation
chmod +x ./scripts/setup.sh
./scripts/setup.sh
```

### Windows (PowerShell)

```powershell
# 1. Cloner le projet
git clone https://github.com/VOTRE_USERNAME/Ariane-World-Builder.git
cd Ariane-World-Builder

# 2. Autoriser l'exécution des scripts (une seule fois)
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser

# 3. Lancer l'installation
.\scripts\setup.ps1
```

---

## ⚙️ Actions du script d'installation

1. Vérifie que Docker et Docker Compose sont installés
2. Crée le fichier `.env` avec les valeurs par défaut si absent
3. Lance les containers Docker (`docker compose up --build`)
4. Attend que PostgreSQL soit prêt
5. Génère le client Prisma et exécute les migrations

---

## 🔧 Configuration

Variables d'environnement par défaut (`.env`) :

```env
DATABASE_URL="postgresql://postgres:postgres@db:5432/mydb"
NEXTAUTH_SECRET="mon-super-secret"
```

Vous pouvez personnaliser ces valeurs avant de lancer le script.

---

## 🌐 Accès à l'application

Une fois l'installation terminée, accédez à :

- **Application** : [http://localhost:3000](http://localhost:3000)
- **Documentation** : Ouvrez `docs/documentation.html` dans votre navigateur
