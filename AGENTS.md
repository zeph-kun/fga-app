# AGENTS.md — FGA Playground

Démo Fine-Grained Authorization : **OpenFGA** (produit open-source inspiré de Zanzibar)
derrière une API NestJS, avec documents, dossiers, groupes et permissions héritées.
Voir README.md pour l'architecture détaillée.

## Stack — ne pas changer sans accord explicite

- Moteur d'autorisation : **OpenFGA v1.22** (REST, stockage dans notre PostgreSQL,
  playground sur http://localhost:8082/playground)
- Backend : NestJS 11, TypeScript strict, client REST OpenFGA maison
  (`backend/src/fga/openfga.client.ts`), PostgreSQL 17 via `pg` (annuaire + données app)
- Frontend : Next.js 15 App Router, React 19, Tailwind CSS v4, TypeScript strict
- Auth : Keycloak 26 (realm `fga`), OAuth 2.0 authorization code + PKCE côté Next,
  validation JWT (JWKS + issuer) côté Nest
- Conteneurs : Docker Compose uniquement — **rien ne s'installe en local**
- Ports : web 3000, api 3001, postgres 5433, keycloak 8180, openfga 8082 (API+playground)

## Commandes (depuis la racine du projet)

- Démarrer : `sudo -n -g docker docker compose -f /home/xt/dev/app-test/docker-compose.yml up -d`
  (le préfixe `sudo -n -g docker` est requis tant que la session n'a pas le groupe docker ; sinon `docker compose ...` directement)
- Rebuild : ajouter `--build`
- Logs : `sudo -n -g docker docker logs fga-api` / `fga-web`
- Tests backend : `sudo -n -g docker docker compose -f /home/xt/dev/app-test/docker-compose.yml exec api npm test`
- Typecheck frontend : `... exec web ./node_modules/.bin/tsc --noEmit`
- Arrêter : `... compose down` (volumes conservés) ; purge totale : `down -v`

## Règles du projet

- **Autorisation** : toute décision passe par OpenFGA (`client.check`). Jamais de logique
  de droits en SQL, dans l'UI, ou dans un moteur maison — l'ancien moteur a été supprimé.
- **Modèle** : `backend/src/fga/model/openfga-model.json` (format metadata requis par
  OpenFGA récent — les types inline dans `this` sont refusés). Le DSL équivalent lisible
  est dans `model.fga` : mettre les deux à jour ensemble. Le modèle est re-poussé à
  chaque boot de l'API ; le seed ne s'applique que si le store est vide.
- **Tuples** : identifiés par leur clé (user, relation, object) — pas d'id. L'API DELETE
  `/tuples` prend le tuple complet dans le body. Écriture toujours via `FgaService`
  (garde `share` côté API, 403 sinon).
- **Explication** : OpenFGA n'a pas d'API de trace ; `/check` renvoie `explanation`
  reconstruit par checks récursifs (relations directes → groupes → héritage parent).
  Garder ces lignes courtes et lisibles.
- **Auth** : l'identité vient TOUJOURS du token Keycloak (guard global `backend/src/auth/`),
  jamais d'un paramètre de requête. Le token d'accès ne touche jamais le navigateur :
  le proxy Next `/api/fga/*` l'attache côté serveur depuis la session chiffrée httpOnly.
- **Tests** : `openfga-integration.spec.ts` crée un store jetable par suite — ne jamais
  toucher le store principal `fga` dans les tests.
- Image OpenFGA distroless : pas de shell, pas de healthcheck CMD-SHELL possible ;
  le client retry jusqu'à disponibilité au bootstrap.
- Schéma Postgres : `backend/src/database/schema.service.ts` ; `documents.folder_id`
  miroir la relation `parent` (affichage uniquement).

## Conventions code

- TypeScript strict, pas de `any`. Valider toutes les entrées API par DTO class-validator.
- Ids en clair : users `alice`..., folders `f-*`, documents `doc-*`, groupes sans préfixe.
  Les usernames Keycloak du realm (`keycloak/fga-realm.json`) doivent matcher les ids FGA.
- UI en français, code et identifiants en anglais.
- Ne pas ajouter de dépendance sans nécessité réelle (le projet assume `pg` + fetch natif).
- Mots de passe de démo Keycloak : `<user>123` (alice/alice123...). Le client `fga-web`
  a `directAccessGrantsEnabled` uniquement pour les tests automatisés.
