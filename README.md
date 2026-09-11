# Site BLESSLEV — avec serveur (MongoDB + Resend)

Cette version n'est plus un simple site statique : c'est une petite application
avec un serveur (Node.js), une vraie base de données (MongoDB) et un vrai envoi
d'email (Resend). Il faut donc l'installer une fois avant de pouvoir l'utiliser.

## Structure des fichiers

```
public/            → tout ce que le visiteur voit (identique à avant)
  index.html
  style.css
  data.js
  app.js
  img/
server.js          → point d'entrée du serveur
db.js              → connexion à MongoDB
mailer.js          → envoi d'email via Resend
auth.js            → connexion admin sécurisée (identifiant + mot de passe)
routes/
  orders.js        → route publique : créer une commande
  admin.js         → routes protégées : connexion, liste des commandes, statut
.env.example        → modèle à copier en ".env" avec vos identifiants
package.json
```

## Installation (une seule fois)

Il faut [Node.js](https://nodejs.org) installé sur votre ordinateur (version 18 ou plus).

1. Ouvrez le dossier du projet dans un terminal (ou dans VS Code : `Terminal` → `Nouveau terminal`).
2. Installez les dépendances :
   ```
   npm install
   ```
3. Copiez `.env.example` en `.env` :
   ```
   cp .env.example .env
   ```
4. Ouvrez `.env` et remplissez les valeurs — chaque ligne du fichier explique comment l'obtenir (MongoDB Atlas, Resend, identifiant/mot de passe admin). Ça prend environ 10-15 minutes la première fois, uniquement.
5. Démarrez le site :
   ```
   npm start
   ```
6. Ouvrez votre navigateur sur **http://localhost:3000**

## Configurer MongoDB (base de données des commandes)

1. Créez un compte gratuit sur [mongodb.com/cloud/atlas/register](https://www.mongodb.com/cloud/atlas/register).
2. Créez un cluster gratuit (choisissez l'option "M0", gratuite).
3. **Database Access** → créez un utilisateur avec un mot de passe.
4. **Network Access** → autorisez votre IP (ou `0.0.0.0/0` pour autoriser depuis n'importe où — pratique le temps de déployer, à resserrer ensuite si possible).
5. **Connect** → **Drivers** → copiez l'URI fournie, remplacez `<password>` par le mot de passe créé à l'étape 3, et collez le tout dans `MONGODB_URI` du fichier `.env`.

Les commandes sont maintenant partagées entre tous les appareils : un client qui commande depuis son téléphone apparaîtra bien dans votre espace commerçant, où que vous soyez.

## Configurer Resend (email automatique à chaque commande)

1. Créez un compte gratuit sur [resend.com](https://resend.com) (200 emails/mois gratuits).
2. **API Keys** → créez une clé → collez-la dans `RESEND_API_KEY`.
3. **Domains** → ajoutez et vérifiez votre propre nom de domaine si vous en avez un (recommandé pour la production), ou utilisez temporairement l'adresse de test fournie par Resend pour essayer tout de suite.
4. `RESEND_FROM_EMAIL` doit être une adresse de ce domaine vérifié (ex : `commandes@votredomaine.com`).
5. `MERCHANT_EMAIL` est l'adresse qui recevra la notification à chaque commande — la vôtre.

Tant que ces variables ne sont pas remplies, le site fonctionne normalement (la commande est bien enregistrée dans MongoDB), simplement aucun email n'est envoyé — rien ne casse.

## Se connecter à l'espace commerçant

**Cette page n'apparaît nulle part sur le site visible.** Pour y accéder, ajoutez `#admin` à la fin de l'adresse du site :

```
http://localhost:3000/#admin
```

Connectez-vous avec l'**identifiant** (`ADMIN_USERNAME`) et le **mot de passe** que vous avez choisis dans `.env`.

### Comment définir votre mot de passe

Le mot de passe n'est jamais écrit en clair nulle part dans le projet — seul son "empreinte" (hash) figure dans `.env`. Pour la générer :

```
node -e "console.log(require('bcryptjs').hashSync('VotreMotDePasse', 10))"
```

Copiez le résultat (il commence par `$2a$` ou `$2b$`) dans `ADMIN_PASSWORD_HASH`.

### Niveau de sécurité

- Le mot de passe est hashé (bcrypt) — jamais stocké en clair.
- La session de connexion utilise un cookie sécurisé (`httpOnly`), invisible et inaccessible depuis JavaScript — donc protégé contre le vol de session par un script malveillant. Elle expire après 12h.
- Après **5 tentatives de connexion incorrectes**, le serveur bloque automatiquement les nouvelles tentatives pendant **10 minutes** — et cette fois, comme la vérification a lieu sur le serveur (pas dans le navigateur), il n'est pas possible de contourner ce blocage en modifiant le code JavaScript de la page.
- C'est un niveau de sécurité tout à fait sérieux, comparable à ce qu'utilisent beaucoup de petites boutiques en ligne.

## Une fois dans l'espace commerçant

- Toutes les commandes (de tous vos clients, tous appareils confondus) sont listées avec leur statut, triables par onglet (En attente de contact / En impression / Finis) et par pays (Tous pays / France / Israël) — les deux filtres se combinent.
- Cliquez sur une commande pour voir un **aperçu visuel exact** du calendrier personnalisé, avec un bouton pour télécharger l'image.
- Cochez plusieurs commandes et cliquez sur **"Télécharger la sélection"** pour recevoir un fichier `.zip` avec les visuels et une fiche récapitulative pour chacune.
- Bouton **"Se déconnecter"** en haut de la page pour fermer votre session à tout moment.

## Déployer sur Vercel

Vercel ne fait pas tourner un serveur classique en continu comme `npm start` —
il exécute le code à la demande, à chaque requête ("fonctions serverless").
Ce projet est déjà structuré pour ça : `api/index.js` est le point d'entrée
que Vercel utilise, et `vercel.json` lui indique de faire passer toutes les
requêtes (site + API) par ce fichier.

### Étapes

1. Poussez ce dossier sur un dépôt GitHub (ou GitLab/Bitbucket), **sans le fichier `.env`** (il est déjà ignoré automatiquement).
2. Sur [vercel.com](https://vercel.com) → **Add New** → **Project** → importez ce dépôt.
3. Vercel détecte le projet Node automatiquement grâce à `vercel.json` — pas besoin de changer les réglages de build.
4. **Avant de déployer**, allez dans **Settings** → **Environment Variables** et ajoutez, une par une, toutes les variables qui sont dans `.env.example` (mêmes noms, avec vos vraies valeurs) :
   - `MONGODB_URI`, `MONGODB_DB_NAME`
   - `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `MERCHANT_EMAIL`
   - `ADMIN_USERNAME`, `ADMIN_PASSWORD_HASH`
   - `JWT_SECRET`
   - (`NODE_ENV` et `PORT` ne sont pas nécessaires sur Vercel — Vercel les gère lui-même)
5. Cliquez sur **Deploy**.
6. Votre site est en ligne à une adresse du type `https://votre-projet.vercel.app`. L'espace commerçant reste accessible via `https://votre-projet.vercel.app/#admin`.

### Après un changement de variable d'environnement

Si vous modifiez une variable dans **Settings → Environment Variables** après coup, il faut **redéployer** (bouton "Redeploy" sur le dernier déploiement) pour que le changement soit pris en compte — Vercel ne recharge pas les variables toutes seules sur un déploiement déjà en ligne.

### MongoDB Atlas et Vercel

Dans **Network Access** sur MongoDB Atlas, comme Vercel change d'adresse IP à chaque exécution, il faut autoriser **0.0.0.0/0** (« depuis n'importe où ») plutôt qu'une IP fixe — sinon la connexion échouera de façon imprévisible.

### Limite à connaître avec Vercel

Le blocage anti-force-brute (5 tentatives puis blocage 10 min) repose sur une mémoire partagée entre les requêtes. Sur un serveur classique (comme en local avec `npm start`), c'est toujours fiable à 100%. Sur Vercel, comme chaque requête peut être traitée par une instance différente, cette protection reste active et utile, mais peut occasionnellement être un peu moins stricte qu'annoncé (par exemple, autoriser 6 ou 7 tentatives au lieu de 5 pile, si plusieurs instances démarrent en même temps). Ce n'est pas un problème pour un usage normal — dites-le-moi si vous voulez une version encore plus stricte (stockée dans MongoDB plutôt qu'en mémoire).

## Ce qui est facile à modifier soi-même

- **Prix / descriptions / produits** → `public/data.js` (`PRODUCTS`).
- **Photos** → fichiers dans `public/img/`.
- **Cadres et polices du calendrier** → `public/data.js` (`FRAMES`, `FONTS`).
- **Couleurs du site** → tout en haut de `public/style.css`.
- **Identifiant / mot de passe admin, clés MongoDB et Resend** → fichier `.env` (jamais dans le code lui-même).

## Le calque du calendrier (rappel)

`public/img/ink_overlay.png` et `public/img/black_mask.png` sont générés à partir de votre PDF modèle. Si vous changez un jour ce modèle, ces deux images doivent être régénérées — prévenez-moi et je m'en occupe.

## Limites actuelles à connaître

- Les photos envoyées par les clients ne sont pas compressées avant l'enregistrement — une photo de téléphone très haute résolution peut faire plusieurs Mo. Ce n'est pas bloquant (la limite technique actuelle est fixée à 15 Mo par commande), mais si vous voyez le stockage MongoDB se remplir vite, on pourra ajouter une compression automatique des photos avant envoi.
- La suppression manuelle d'une commande n'est pas encore possible depuis l'espace commerçant (seul le changement de statut l'est) — dites-le-moi si vous en avez besoin.
