# AGENTS.md — FGA Playground

Démo Fine-Grained Authorization (modèle Zanzibar-lite) avec documents, dossiers, groupes et
permissions héritées. Voir README.md pour l'architecture détaillée.

## Stack — ne pas changer sans accord explicite

- Backend : NestJS 11, TypeScript strict, PostgreSQL 17 via `pg` (SQL brut, pas d'ORM)
- Frontend : Next.js 15 App Router, React 19, Tailwind CSS v4, TypeScript strict
- Auth : Keycloak 26 (realm `fga`), OAuth 2.0 authorization code + PKCE côté Next,
  validation JWT (JWKS + issuer) côté Nest
- Conteneurs : Docker Compose uniquement — **rien ne s'installe en local**
- Ports : web 3000, api 3001, postgres 5433, keycloak 8180

## Commandes (depuis la racine du projet)

- Démarrer : `sudo -n -g docker docker compose -f /home/xt/dev/app-test/docker-compose.yml up -d`
  (le préfixe `sudo -n -g docker` est requis tant que la session n'a pas le groupe docker ; sinon `docker compose ...` directement)
- Rebuild : ajouter `--build`
- Logs : `sudo -n -g docker docker logs fga-api` / `fga-web`
- Tests backend : `sudo -n -g docker docker compose -f /home/xt/dev/app-test/docker-compose.yml exec api npm test`
- Typecheck frontend : `... exec web ./node_modules/.bin/tsc --noEmit`
- Arrêter : `... compose down` (volumes conservés) ; purge totale : `down -v`

## Règles du projet

- **Auth** : l'identité vient TOUJOURS du token Keycloak (guard global `backend/src/auth/`),
  jamais d'un paramètre de requête (`userId`, `actingUser` interdits dans les DTO).
  Le token d'accès ne touche jamais le navigateur : le proxy Next `/api/fga/*`
  (`frontend/src/app/api/fga/`) l'attache côté serveur depuis la session chiffrée httpOnly.
  Keycloak est joignable sous 2 URLs : `localhost:8180` (navigateur) et `keycloak:8080`
  (conteneurs) — voir `KC_HOSTNAME` et les variables `KEYCLOAK_*` du compose.
- Toute décision d'autorisation passe par le moteur FGA (`backend/src/fga/`) : jamais de
  filtrage de droits en SQL brut, en clause WHERE ou dans l'UI. L'UI reflète, l'API impose.
- Le modèle de permissions (unions, réécritures, héritage) se définit uniquement dans
  `backend/src/fga/config.ts`. `delete` n'est volontairement pas hérité du dossier parent.
- Le moteur doit rester testable sans base : dépendre de l'interface `TupleRepository`,
  tests sur `InMemoryTupleRepository`, pas d'import de `pg` dans `engine.ts`.
- Les traces d'évaluation (`trace` de `/check`) sont une fonctionnalité visible du produit :
  garder chaque ligne courte et lisible.
- Schéma : `backend/src/database/schema.service.ts` ; données de démo : `seed.ts`
  (le seed ne tourne que si la table `users` est vide).
- Écriture de tuples : toujours via `FgaService` (garde `share` côté API, 403 sinon),
  jamais de INSERT direct sur `relation_tuples`.

## Conventions code

- TypeScript strict, pas de `any`. Valider toutes les entrées API par DTO class-validator.
- Ids en clair : users `alice`..., folders `f-*`, documents `doc-*`, groupes sans préfixe.
  Les usernames Keycloak du realm (`keycloak/fga-realm.json`) doivent matcher les ids FGA.
- UI en français, code et identifiants en anglais.
- Ne pas ajouter de dépendance sans nécessité réelle (le projet assume `pg` + fetch natif).
- Mots de passe de démo Keycloak : `<user>123` (alice/alice123...). Le client `fga-web`
  a `directAccessGrantsEnabled` uniquement pour les tests automatisés.
