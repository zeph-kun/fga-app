# FGA Playground

Petite application de démonstration de FGA (Fine-Grained Authorization) construite sur
**OpenFGA** — le moteur open-source inspiré du papier
[Zanzibar](https://research.google/pubs/zanzibar-googles-consistent-global-authorization-system/) de Google.

## Stack

| Composant | Technologie | Port |
|---|---|---|
| Frontend | Next.js 15 (App Router, React 19, Tailwind CSS v4, TypeScript strict) | http://localhost:3000 |
| API | NestJS 11, TypeScript strict, class-validator | http://localhost:3001 |
| Moteur d'autorisation | OpenFGA v1.22 (REST, playground) | http://localhost:8082 |
| Auth | Keycloak 26 (realm `fga`, OAuth 2.0 code + PKCE) | http://localhost:8180 |
| Base | PostgreSQL 17 (données app + stockage OpenFGA) | localhost:5433 |

Tout tourne dans Docker Compose. Rien n'est installé en local ; le code est monté en bind volume
pour le hot-reload des deux serveurs de dev. OpenFGA a besoin d'une étape de migration
(service one-shot `openfga-migrate`).

## Modèle d'autorisation

Les tuples de relations vivent dans OpenFGA : `(object, relation, user)` avec users et
usersets (`group:eng#member`) et liens `parent`. Le modèle est défini dans
`backend/src/fga/model/` (JSON déployé + DSL lisible, à garder synchrones) :

```text
document.view  = viewer | editor | owner | parent->view
document.edit  = editor | owner | parent->edit
document.share = owner | parent->share
document.delete = owner                 # volontairement NON hérité
group.member   = member                 # groupes imbriqués via usersets
```

- un `editor` a automatiquement `view` (union) mais pas `share` ;
- un document hérite des permissions de son dossier, et un dossier de son dossier parent ;
- les groupes imbriqués fonctionnent nativement (`staff` contient `eng` et `design`) ;
- la protection contre les cycles est gérée par OpenFGA lui-même.

L'API NestJS est un client REST d'OpenFGA : store bootstrappé au démarrage (modèle
re-poussé à chaque boot, tuples de seed écrits seulement si le store est vide), checks,
lectures et écritures de tuples. Comme OpenFGA n'expose pas de trace d'évaluation,
`/check` renvoie une `explanation` reconstruite par checks récursifs (tuple direct →
groupe → héritage parent).

## Authentification

- Flux OAuth 2.0 **authorization code + PKCE (S256)** implémenté dans
  `frontend/src/app/api/auth/` (login, callback, logout, session).
- La session (tokens Keycloak + identité) est chiffrée (AES-256-GCM via `jose`) dans un
  cookie **httpOnly** ; le token d'accès ne transite jamais par le navigateur.
- Le proxy serveur Next (`/api/fga/*`) attache le Bearer et gère le refresh token.
- Côté API : guard NestJS global (`backend/src/auth/jwt-auth.guard.ts`) — validation de la
  signature via JWKS, issuer, expiration et client autorisé. L'identité (`preferred_username`)
  est **dérivée du token** ; les utilisateurs Keycloak inconnus sont auto-provisionnés dans
  l'annuaire.
- Comptes de démo : alice/alice123, bob/bob123, carol/carol123, dave/dave123, eve/eve123.
- Console admin Keycloak : http://localhost:8180 (admin/admin).

Split-horizon Keycloak : les navigateurs joignent `localhost:8180` (`KC_HOSTNAME`), les
conteneurs parlent à `keycloak:8080` en interne (échanges de tokens, JWKS).

## Lancement

```bash
docker compose up --build
```

- Frontend : http://localhost:3000
- API : http://localhost:3001 (ex. `curl -X POST localhost:3001/check -H 'Content-Type: application/json' -d '{"userId":"bob","permission":"view","namespace":"document","objectId":"doc-rfc"}'`)
- Postgres exposé sur localhost:5433 (user `fga`, db `fga`)

Le schéma et un jeu de données de démonstration sont créés automatiquement au premier démarrage
de l'API (`backend/src/database/seed.ts`).

## API

Toutes les routes exigent un token d'accès Keycloak (`Authorization: Bearer ...`),
sauf mention contraire. L'identité de l'appelant vient du token, jamais d'un paramètre.

| Méthode | Route | Description |
|---|---|---|
| GET | `/users`, `/groups`, `/folders` | Annuaire (membres des groupes lus depuis OpenFGA) |
| GET | `/documents` | Documents + carte de permissions de l'utilisateur authentifié |
| POST | `/check` | `check(user, permission, namespace, object)` avec explication (playground : userId explicite) |
| GET | `/tuples?namespace=&objectId=` | Liste les tuples d'un objet |
| POST | `/tuples` | Crée un tuple — exige `share` pour l'utilisateur authentifié (403 sinon) |
| DELETE | `/tuples` | Supprime un tuple (clé complète dans le body) — même garde `share` |

Obtenir un token pour tester (password grant, activé pour les tests uniquement) :

```bash
curl -s -X POST http://localhost:8180/realms/fga/protocol/openid-connect/token \
  -d grant_type=password -d client_id=fga-web -d client_secret=fga-web-secret \
  -d username=alice -d password=alice123 | jq -r .access_token
```

## Scénarios de démo (seed)

| Qui | Quoi | Résultat attendu |
|---|---|---|
| alice | view/edit/share `doc-rfc` | autorisé (owner via parent folder `f-eng`) |
| alice | delete `doc-rfc` | refusé (delete non hérité : owner direct du document uniquement) |
| bob | view `doc-rfc` | autorisé (direct editor ; aussi via groupe `eng` + héritage) |
| bob | share `doc-rfc` | refusé (pas owner) |
| dave | view `doc-rfc` | autorisé (groupe `contractors` viewer sur le document) |
| dave | edit `doc-rfc` | refusé |
| carol | view `doc-onboarding` | autorisé (viewer direct) |
| carol | edit `doc-onboarding` | refusé |
| carol | edit `doc-logo` | autorisé (groupe `design` editor sur folder `f-design`) |
| bob | view `doc-roadmap` | refusé (dossier `f-private` : owner alice uniquement) |

## UI

- Sélecteur d'utilisateur simulé en haut : toute l'interface recalcule les permissions.
- Table des documents visibles avec badges view/edit/share/delete.
- Permission checker : teste n'importe quel triplet (utilisateur, permission, objet) et affiche la
  trace d'évaluation expliquant la décision.
- Panneau de partage d'un document : liste/ajout/révocation de tuples — bloqué côté API (403) si
  l'utilisateur courant n'a pas `share`.

## Tests

```bash
docker compose exec api npm test
```

Tests d'intégration contre OpenFGA (`backend/src/fga/openfga-integration.spec.ts`,
store jetable par suite) : tuples directs, unions, groupes, groupes imbriqués,
héritage par dossiers, delete non hérité, écriture/suppression idempotentes.

## Structure

```text
backend/
  src/database/       pool pg, schéma (+ migration one-shot vers OpenFGA), seed
  src/fga/            client REST OpenFGA (openfga.client), service + explication,
                      model/ (JSON déployé + DSL), tests d'intégration
  src/auth/           guard JWT Keycloak
  src/directory/      annuaire (users, groups via OpenFGA, folders)
  src/documents/      listing documents + permissions par utilisateur
frontend/
  src/lib/api.ts      client typé (via le proxy /api/fga)
  src/components/     LoginScreen, DocumentTable, PermissionChecker, SharePanel, GroupsOverview
```

## OpenFGA

- Playground : http://localhost:8082/playground (store `fga`, modèle du projet)
- API REST : http://localhost:8082 (stores, checks, writes — voir `openfga.client.ts`)
- Stockage : tables OpenFGA dans notre base PostgreSQL (ok pour la démo ; en prod,
  préférer une base dédiée)
- L'image est distroless : pas de shell, d'où le service one-shot `openfga-migrate`
  et l'absence de healthcheck
