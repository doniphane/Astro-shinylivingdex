# Guide Docker - ShinyLivingDex

## Configuration initiale

1. **Installer les dépendances Astro**
   ```bash
   npm install
   ```

2. **Configurer les variables d'environnement**
   - Copier `.env.example` vers `.env`
   - Modifier les valeurs avec vos informations de connexion MongoDB distante
   ```bash
   cp .env.example .env
   ```

## Utilisation avec Docker

### Option 1 : Docker Compose (Recommandé)

```bash
# Construire et démarrer le conteneur
docker-compose up -d

# Voir les logs
docker-compose logs -f

# Arrêter le conteneur
docker-compose down
```

### Option 2 : Docker directement

```bash
# Construire l'image
docker build -t shinylivingdex .

# Lancer le conteneur
docker run -d \
  --name shinylivingdex \
  -p 4321:4321 \
  -e MONGODB_URI="mongodb://username:password@your-server:27017/database" \
  -e JWT_SECRET="your-secret-key" \
  shinylivingdex

# Voir les logs
docker logs -f shinylivingdex

# Arrêter le conteneur
docker stop shinylivingdex
docker rm shinylivingdex
```

## Variables d'environnement requises

- `MONGODB_URI` : URL de connexion à votre base MongoDB distante
- `JWT_SECRET` : Clé secrète pour les tokens JWT
- `NODE_ENV` : Environnement (production par défaut)
- `HOST` : Hôte (0.0.0.0 par défaut)
- `PORT` : Port (4321 par défaut)

## Accès à l'application

Une fois le conteneur démarré, l'application est accessible sur :
- http://localhost:4321

## Notes importantes

- Le conteneur utilise Node.js 22 Alpine pour une taille optimale
- La build se fait en multi-stage pour réduire la taille de l'image finale
- Seules les dépendances de production sont installées dans l'image finale
- L'application se connecte à votre base MongoDB distante (pas de base locale)
