# Manhua Manager Pro — Plano Técnico de Implementação em Sprints Transversais

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir a plataforma comercial completa Manhua Manager Pro através de **Sprints Transversais (Ponta a Ponta)**, desenvolvendo e testando cada funcionalidade de forma vertical (Banco/Redis $\rightarrow$ API Go $\rightarrow$ Web Angular $\rightarrow$ Teste E2E), reservando as Sprints Finais para a publicação do aplicativo móvel Flutter na Google Play Store.

**Architecture:** Monorepositório segregado em microsserviços e clientes multiplataforma desacoplados. O backend Go atua como API Gateway transacional e proxy de streaming direto de imagens de zero-buffer com proteção anti-SSRF; o Redis gerencia leaderboards e contadores em tempo real; o PostgreSQL garante a integridade multi-tenant das bibliotecas; um pool de workers Node.js isolado executa automações de browser com Puppeteer; o frontend Angular provê leitura contínua com virtual scrolling e o app Flutter entrega leitura offline radical para publicação na Play Store.

**Tech Stack:** Go 1.23, Node.js 20 (TypeScript/Puppeteer), Angular 18+, Flutter 3.x, PostgreSQL 16, Redis 7, Docker, Docker Compose, Firebase Cloud Messaging (FCM), Google Identity Services / Google Sign-In SDK.

## Global Constraints

- **Metodologia Transversal Mandatória:** Cada sprint entrega uma fatia vertical completa (Banco + Backend Go + Web Angular + Testes) antes de avançar para a próxima funcionalidade.
- **Mobile Concentrado no Final:** O app Flutter é desenvolvido e integrado nas Sprints 8 e 9, quando todo o ecossistema de APIs estiver estabilizado.
- Backend Core implementado estritamente em Go (compilação estática `CGO_ENABLED=0`).
- Imagens Docker finais do Go devem utilizar `gcr.io/distroless/static-debian12:nonroot`.
- Imagens Docker de workers devem rodar com usuário sem privilégios e PID 1 sob `dumb-init`.
- PostgreSQL 16 com suporte obrigatório a transações ACID e extensão `uuid-ossp`.
- Redis 7 com persistência AOF para contadores e Sorted Sets (`ZSET`) de rankings.
- Toda comunicação de rede em produção deve utilizar TLS 1.3/HTTPS rigoroso (sem cleartext).
- Proibição absoluta de evicção automática de downloads offline por LRU ou TTL (ADR-0011).
- Regra de Ouro dos Favoritos inviolável: obras favoritas sempre precedem não-favoritas (RN-04).
- Proxy de imagens com streaming direto em chunks de 32 KB sem retenção de imagem em memória RAM.
- Validação estrita de DNS no proxy com bloqueio de endereços IP privados, loopback e metadados.
- Exclusão de conta in-app obrigatória em conformidade com as diretrizes da Google Play Store (RN-10.1).

---

## Sprint 0: Fundação de Infraestrutura e Orquestração Cloud-Native

> **Requisitos:** ADR-0001, ADR-0010  
> **User Stories:** US-PRO-DOCK-01, US-PRO-DOCK-02  
> **Objetivo:** Estabelecer a fundação do monorepositório, ambiente Docker Compose (Dev/Prod), contratos OpenAPI e pools de dados locais.

### Subtarefa 0.1: Scaffolding do Monorepo e Configurações de Ambiente
**Files:**
- Create: `Makefile`
- Create: `packages/contracts/openapi.yaml`
- Create: `deployments/docker-compose.yml`
- Create: `deployments/docker-compose.prod.yml`
- Create: `deployments/nginx/nginx.conf`
- Create: `.env.example`

- [ ] **Step 1: Criar arquivo `.env.example` com credenciais e portas padronizadas**
- [ ] **Step 2: Criar `Makefile` com comandos de automação (`make dev`, `make prod`, `make test`, `make clean`)**
- [ ] **Step 3: Criar manifestos `docker-compose.yml` (dev) e `docker-compose.prod.yml` (prod)**
- [ ] **Step 4: Validar sintaxe dos arquivos de orquestração com `docker compose config`**
- [ ] **Step 5: Commit:** `chore: setup monorepo scaffolding and docker compose orchestration`

### Subtarefa 0.2: Conexão e Migrações do Banco PostgreSQL e Redis
**Files:**
- Create: `apps/api-gateway/migrations/000001_initial_schema.up.sql`
- Create: `apps/api-gateway/migrations/000001_initial_schema.down.sql`
- Create: `apps/api-gateway/internal/repository/postgres.go`
- Create: `apps/api-gateway/internal/repository/redis.go`
- Test: `apps/api-gateway/internal/repository/postgres_test.go`

- [ ] **Step 1: Escrever teste de integração com Testcontainers verificando criação do schema inicial**
- [ ] **Step 2: Executar teste e validar falha**
- [ ] **Step 3: Criar arquivo SQL de migração com as tabelas `users`, `canonical_manhuas`, `user_libraries`, `user_ratings`, `fcm_device_tokens`**
- [ ] **Step 4: Implementar clientes `postgres.go` (com `golang-migrate`) e `redis.go`**
- [ ] **Step 5: Executar testes de repositório e validar aprovação**
- [ ] **Step 6: Commit:** `feat(db): implement initial postgresql migrations and redis connection pool`

---

## Sprint 1: Autenticação Unificada e Gestão de Contas (Ponta a Ponta)

> **Requisitos:** RN-10.1, ADR-0008  
> **User Stories:** US-PRO-PLAY-01, US-PRO-PLAY-02  
> **Objetivo:** Entregar o fluxo completo de autenticação (Cadastro, Login JWT e Google OAuth) e exclusão definitiva de conta no Backend e no Web Angular.

### Subtarefa 1.1: Backend Core — Serviços e Handlers de Autenticação (Go)
**Files:**
- Create: `apps/api-gateway/internal/auth/jwt.go`
- Create: `apps/api-gateway/internal/auth/google.go`
- Create: `apps/api-gateway/internal/auth/service.go`
- Create: `apps/api-gateway/internal/handlers/auth_handler.go`
- Test: `apps/api-gateway/internal/auth/auth_test.go`

- [ ] **Step 1: Escrever teste unitário para emissão de JWT e validação de Google ID Token**
- [ ] **Step 2: Executar teste e validar falha**
- [ ] **Step 3: Implementar validação criptográfica do Google Token com `google.golang.org/api/idtoken` e Argon2id para senhas**
- [ ] **Step 4: Implementar rota de exclusão de conta `DELETE /api/users/me` com deleção em cascata**
- [ ] **Step 5: Validar testes do módulo de autenticação**
- [ ] **Step 6: Commit:** `feat(auth): implement go jwt service, google oauth validation and account deletion`

### Subtarefa 1.2: Frontend Web — Telas de Login, Cadastro e Perfil (Angular 18+)
**Files:**
- Create: `apps/web-client/src/app/core/auth/auth.service.ts`
- Create: `apps/web-client/src/app/core/auth/auth.interceptor.ts`
- Create: `apps/web-client/src/app/features/auth/login.component.ts`
- Create: `apps/web-client/src/app/features/auth/register.component.ts`
- Create: `apps/web-client/src/app/features/profile/profile.component.ts`
- Test: `apps/web-client/src/app/features/auth/login.component.spec.ts`

- [ ] **Step 1: Escrever teste unitário para o serviço de autenticação e interceptor HTTP de JWT**
- [ ] **Step 2: Executar teste no Angular e validar falha**
- [ ] **Step 3: Implementar componentes standalone com Tailwind CSS e botão Google One Tap / GIS**
- [ ] **Step 4: Implementar tela de perfil com botão de exclusão de conta com modal de confirmação**
- [ ] **Step 5: Executar testes unitários do Angular e validar aprovação**
- [ ] **Step 6: Commit:** `feat(web): implement angular login, google one-tap and account deletion views`

### Subtarefa 1.3: Verificação de Integração Ponta a Ponta
**Files:**
- Test: `apps/web-client/e2e/auth.spec.ts` (Playwright)

- [ ] **Step 1: Escrever teste E2E do fluxo de registro $\rightarrow$ login $\rightarrow$ visualização de perfil $\rightarrow$ exclusão de conta**
- [ ] **Step 2: Executar teste E2E com Playwright contra os contêineres ativos**
- [ ] **Step 3: Commit:** `test(e2e): add end-to-end authentication and account deletion test`

---

## Sprint 2: Catálogo Canônico Global e Scraping Rápido (Ponta a Ponta)

> **Requisitos:** RN-01, RN-02, ADR-0006  
> **User Stories:** US-CURR-02, US-CURR-11, US-PRO-CORE-02  
> **Objetivo:** Disponibilizar o catálogo público global de obras no backend e uma interface rica de busca e visualização de obras no frontend Angular.

### Subtarefa 2.1: Backend Core — Repositório Canônico e Extratores Estáticos Go
**Files:**
- Create: `apps/api-gateway/internal/domain/canonical.go`
- Create: `apps/api-gateway/internal/repository/canonical_repo.go`
- Create: `apps/api-gateway/internal/providers/asurascans.go`
- Create: `apps/api-gateway/internal/providers/ravenscans.go`
- Create: `apps/api-gateway/internal/handlers/catalog_handler.go`
- Test: `apps/api-gateway/internal/providers/providers_test.go`

- [x] **Step 1: Escrever teste unitário de parsing HTML contra fixtures gravadas de AsuraScans e RavenScans**
- [x] **Step 2: Executar testes de providers e validar falha**
- [x] **Step 3: Implementar extratores de catálogo e capítulos em Go com regex otimizada**
- [x] **Step 4: Implementar endpoints `GET /api/catalog` e `GET /api/catalog/{slug}` com paginação**
- [x] **Step 5: Executar testes e validar aprovação**
- [x] **Step 6: Commit:** `feat(catalog): implement canonical repository and fast-path go extractors`

### Subtarefa 2.2: Frontend Web — Tela de Catálogo Global e Busca (Angular)
**Files:**
- Create: `apps/web-client/src/app/features/catalog/catalog.service.ts`
- Create: `apps/web-client/src/app/features/catalog/catalog-list.component.ts`
- Create: `apps/web-client/src/app/features/catalog/catalog-detail.component.ts`
- Test: `apps/web-client/src/app/features/catalog/catalog-list.component.spec.ts`

- [x] **Step 1: Escrever teste de componente para paginação reativa e busca instantânea via Signals**
- [x] **Step 2: Implementar cards de obras com imagem de capa, títulos alternativos, último capítulo e status**
- [x] **Step 3: Implementar página de detalhes da obra com sinopse e lista de capítulos**
- [x] **Step 4: Validar testes do Angular**
- [x] **Step 5: Commit:** `feat(web): implement global catalog browsing and search views in angular`

### Subtarefa 2.3: Verificação de Integração Ponta a Ponta
**Files:**
- Test: `apps/web-client/e2e/catalog.spec.ts`

- [x] **Step 1: Testar fluxo de pesquisa textual $\rightarrow$ carregamento de detalhes da obra $\rightarrow$ visualização de lista de episódios**
- [x] **Step 2: Commit:** `test(e2e): add catalog browsing and detail page integration test`

---

## Sprint 3: Biblioteca Pessoal, Favoritos e Regra de Ouro (Ponta a Ponta)

> **Requisitos:** RN-03.3, RN-04, ADR-0006  
> **User Stories:** US-CURR-01, US-CURR-05, US-PRO-COMM-04  
> **Objetivo:** Permitir ao usuário gerenciar sua biblioteca pessoal, reordenar obras com drag-and-drop e garantir a Regra de Ouro dos Favoritos em ambas as pontas.

### Subtarefa 3.1: Backend Core — Regras de Biblioteca e Ordenação Canônica (Go)
**Files:**
- Create: `apps/api-gateway/internal/domain/library.go`
- Create: `apps/api-gateway/internal/repository/library_repo.go`
- Create: `apps/api-gateway/internal/service/library_service.go`
- Create: `apps/api-gateway/internal/handlers/library_handler.go`
- Test: `apps/api-gateway/internal/service/library_test.go`

- [ ] **Step 1: Escrever teste unitário validando que favoritos nunca ficam abaixo de não-favoritos e promoção automática**
- [ ] **Step 2: Implementar endpoints `/api/library` (GET, POST, PATCH, PUT reorder, DELETE)**
- [ ] **Step 3: Implementar autocorreção de reordenação no backend em `PUT /api/library/reorder`**
- [ ] **Step 4: Executar testes unitários e de integração**
- [ ] **Step 5: Commit:** `feat(library): enforce golden rule of favorites and library management in go`

### Subtarefa 3.2: Frontend Web — Biblioteca com Drag-and-Drop e Favoritos (Angular)
**Files:**
- Create: `apps/web-client/src/app/features/library/library.service.ts`
- Create: `apps/web-client/src/app/features/library/library.component.ts`
- Create: `apps/web-client/src/app/features/library/components/library-item.component.ts`
- Test: `apps/web-client/src/app/features/library/library.component.spec.ts`

- [ ] **Step 1: Escrever teste de componente validando separação visual de seções "★ Favoritas" e "Todas as Obras"**
- [ ] **Step 2: Implementar reordenação via Angular CDK (`@angular/cdk/drag-drop`) bloqueando arraste cruzado**
- [ ] **Step 3: Implementar botão de estrela com alternância instantânea e promoção automática reativa**
- [ ] **Step 4: Adicionar botão "+ Minha Biblioteca" integrado aos cards do catálogo global**
- [ ] **Step 5: Validar testes do Angular**
- [ ] **Step 6: Commit:** `feat(web): implement drag-and-drop personal library with favorites segregation`

### Subtarefa 3.3: Verificação de Integração Ponta a Ponta
**Files:**
- Test: `apps/web-client/e2e/library.spec.ts`

- [ ] **Step 1: Validar adicionar obra do catálogo $\rightarrow$ favoritar na biblioteca $\rightarrow$ reordenar $\rightarrow$ recarregar página e verificar persistência**
- [ ] **Step 2: Commit:** `test(e2e): add personal library reordering and favorites persistence test`

---

## Sprint 4: Leitor Webtoon e Streaming Proxy Anti-SSRF (Ponta a Ponta)

> **Requisitos:** RN-01.2, RN-02, RN-03.2, ADR-0002  
> **User Stories:** US-CURR-03, US-CURR-04, US-PRO-CORE-01, US-PRO-WEB-02  
> **Objetivo:** Entregar a experiência de leitura contínua vertical a 60 fps na Web servida por streaming proxy de zero-buffer com blindagem contra SSRF.

### Subtarefa 4.1: Backend Core — Proxy de Streaming e Proteção SSRF em Go
**Files:**
- Create: `apps/api-gateway/internal/proxy/ssrf_guard.go`
- Create: `apps/api-gateway/internal/proxy/streamer.go`
- Create: `apps/api-gateway/internal/handlers/reader_handler.go`
- Test: `apps/api-gateway/internal/proxy/proxy_test.go`

- [ ] **Step 1: Escrever teste unitário bloqueando IPs privados (RFC 1918), loopback e metadados de nuvem**
- [ ] **Step 2: Implementar streaming `io.Copy` em blocos de 32 KB com headers específicos por domínio (Referer/User-Agent)**
- [ ] **Step 3: Implementar endpoints `GET /api/reader/chapter-images` e `GET /api/reader/proxy-image`**
- [ ] **Step 4: Executar testes de proxy e validar aprovação**
- [ ] **Step 5: Commit:** `feat(proxy): add zero-buffer streaming proxy with strict anti-ssrf guard`

### Subtarefa 4.2: Frontend Web — Leitor Webtoon Contínuo com Virtual Scrolling (Angular)
**Files:**
- Create: `apps/web-client/src/app/features/reader/reader.service.ts`
- Create: `apps/web-client/src/app/features/reader/reader.component.ts`
- Test: `apps/web-client/src/app/features/reader/reader.component.spec.ts`

- [ ] **Step 1: Escrever teste de rolagem contínua e atalhos de teclado (Setas Esquerda/Direita)**
- [ ] **Step 2: Implementar Virtual Scrolling (`@angular/cdk/scrolling`) mantendo apenas imagens da viewport no DOM**
- [ ] **Step 3: Implementar bloqueio visual e desabilitação do botão "Próximo" ao atingir `lastChapter`**
- [ ] **Step 4: Implementar atualização dinâmica do título da aba (`{Obra} - Cap. {N}`)**
- [ ] **Step 5: Validar testes do leitor no Angular**
- [ ] **Step 6: Commit:** `feat(web): implement continuous webtoon reader with virtual scrolling and keyboard shortcuts`

### Subtarefa 4.3: Verificação de Integração Ponta a Ponta
**Files:**
- Test: `apps/web-client/e2e/reader.spec.ts`

- [ ] **Step 1: Abrir capítulo no leitor $\rightarrow$ verificar imagens renderizadas via proxy $\rightarrow$ avançar capítulo $\rightarrow$ checar bloqueio no lastChapter**
- [ ] **Step 2: Commit:** `test(e2e): add end-to-end reader navigation and image streaming test`

---

## Sprint 5: Votações Comunitárias e Rankings em Tempo Real (Ponta a Ponta)

> **Requisitos:** RN-07, RN-08, ADR-0007  
> **User Stories:** US-PRO-COMM-01, US-PRO-COMM-02, US-PRO-COMM-03  
> **Objetivo:** Implementar o sistema comunitário de avaliação (1-10 estrelas com fórmula Bayesiana) e leaderboards dinâmicos em tempo real no Redis.

### Subtarefa 5.1: Backend Core — Motor de Rankings Redis ZSET e Média Bayesiana
**Files:**
- Create: `apps/api-gateway/internal/ranking/calculator.go`
- Create: `apps/api-gateway/internal/ranking/service.go`
- Create: `apps/api-gateway/internal/handlers/ranking_handler.go`
- Test: `apps/api-gateway/internal/ranking/ranking_test.go`

- [ ] **Step 1: Escrever teste unitário para cálculo da Média Bayesiana ($WR$)**
- [ ] **Step 2: Implementar registro de votos no PostgreSQL com constraint `UNIQUE(user_id, canonical_manhua_id)`**
- [ ] **Step 3: Implementar comandos Redis Sorted Sets (`ZINCRBY`, `ZADD`, `ZREVRANGE`) e rota de ranking híbrida em 2 etapas**
- [ ] **Step 4: Implementar worker em background para sincronização periódica de views a cada 15 min e warm-up**
- [ ] **Step 5: Executar testes e validar aprovação**
- [ ] **Step 6: Commit:** `feat(ranking): implement bayesian rating calculations and redis zset leaderboards`

### Subtarefa 5.2: Frontend Web — Telas de Rankings e Avaliação Interativa (Angular)
**Files:**
- Create: `apps/web-client/src/app/features/rankings/rankings.service.ts`
- Create: `apps/web-client/src/app/features/rankings/rankings.component.ts`
- Create: `apps/web-client/src/app/shared/components/star-rating.component.ts`
- Test: `apps/web-client/src/app/features/rankings/rankings.component.spec.ts`

- [ ] **Step 1: Escrever teste de componente para alternância de abas "Hoje", "Semana", "Top Geral" e "Melhor Votados"**
- [ ] **Step 2: Implementar componente reutilizável de votação de 1 a 10 estrelas com feedback imediato**
- [ ] **Step 3: Renderizar cards de ranking com medalhas (1º, 2º, 3º lugar) e botão rápido de adicionar à biblioteca**
- [ ] **Step 4: Validar testes do Angular**
- [ ] **Step 5: Commit:** `feat(web): implement community rankings views and interactive star rating component`

### Subtarefa 5.3: Verificação de Integração Ponta a Ponta
**Files:**
- Test: `apps/web-client/e2e/rankings.spec.ts`

- [ ] **Step 1: Ler capítulo $\rightarrow$ checar incremento no ranking de mais lidos $\rightarrow$ votar com 10 estrelas $\rightarrow$ verificar atualização no ranking de melhor votados**
- [ ] **Step 2: Commit:** `test(e2e): add views tracking and bayesian rating leaderboard test`

---

## Sprint 6: Downloads em Lote e Leitura Offline na Web (Ponta a Ponta)

> **Requisitos:** RN-05, RN-06, ADR-0011  
> **User Stories:** US-CURR-06, US-CURR-07, US-CURR-08, US-PRO-WEB-03, US-PRO-WEB-04  
> **Objetivo:** Habilitar download em lote por faixas de episódios, fila de download em background com cancelamento e persistência offline radical no IndexedDB.

### Subtarefa 6.1: Backend Core — Extração em Lote Concorrente com Teto (Go)
**Files:**
- Create: `apps/api-gateway/internal/service/batch_service.go`
- Create: `apps/api-gateway/internal/handlers/batch_handler.go`
- Test: `apps/api-gateway/internal/service/batch_test.go`

- [ ] **Step 1: Escrever teste de validação de teto de `lastChapter` e limite máximo de 50 capítulos por lote**
- [ ] **Step 2: Implementar extração concorrente com `sync.WaitGroup` e semáforo limitador de conexões**
- [ ] **Step 3: Tratar falhas parciais por capítulo sem quebrar a resposta JSON do lote**
- [ ] **Step 4: Executar testes de batch e validar aprovação**
- [ ] **Step 5: Commit:** `feat(batch): implement bounded concurrent batch chapter extraction with ceiling checks`

### Subtarefa 6.2: Frontend Web — Painel de Background Downloads e IndexedDB (Angular)
**Files:**
- Create: `apps/web-client/src/app/core/services/indexed-db.service.ts`
- Create: `apps/web-client/src/app/features/downloads/download-manager.service.ts`
- Create: `apps/web-client/src/app/features/downloads/active-downloads-drawer.component.ts`
- Test: `apps/web-client/src/app/core/services/indexed-db.service.spec.ts`

- [ ] **Step 1: Escrever teste unitário para gravação e recuperação de Blobs binários de imagem no IndexedDB**
- [ ] **Step 2: Implementar gerenciador de fila com cancelamento atômico via `AbortController`**
- [ ] **Step 3: Implementar verificação offline-first no leitor: consultar IndexedDB antes de qualquer requisição externa**
- [ ] **Step 4: Adicionar painel de gerenciamento de disco (exclusão manual por capítulo/obra, sem limpeza automática)**
- [ ] **Step 5: Validar testes do Angular**
- [ ] **Step 6: Commit:** `feat(web): implement indexeddb offline storage and background download manager`

### Subtarefa 6.3: Verificação de Integração Ponta a Ponta
**Files:**
- Test: `apps/web-client/e2e/offline-downloads.spec.ts`

- [ ] **Step 1: Disparar download de lote $\rightarrow$ verificar progresso $\rightarrow$ cortar conexão de rede (modo offline) $\rightarrow$ abrir leitor e verificar renderização a partir do IndexedDB**
- [ ] **Step 2: Commit:** `test(e2e): add offline downloads and network-disconnected reading test`

---

## Sprint 7: Scraping Avançado (Headless Browser Pool) e Rotina 23:50 (Ponta a Ponta)

> **Requisitos:** RN-02 (MangaFire/Comix), RN-09, ADR-0003  
> **User Stories:** US-CURR-09, US-CURR-10, US-PRO-SCRAP-02  
> **Objetivo:** Adicionar suporte a fontes protegidas por Cloudflare e tokens dinâmicos via worker pool Puppeteer, integrando o agendador de novidades das 23:50 com notificações reativas na Web.

### Subtarefa 7.1: Scraping Workers — Pool de Contextos Puppeteer (Node.js)
**Files:**
- Create: `apps/scraping-workers/src/server.ts`
- Create: `apps/scraping-workers/src/browser-pool.ts`
- Create: `apps/scraping-workers/src/extractors/mangafire.ts`
- Create: `apps/scraping-workers/src/extractors/comix.ts`
- Create: `apps/scraping-workers/src/extractors/manhuaus.ts`
- Test: `apps/scraping-workers/test/extractors.test.ts`

- [ ] **Step 1: Escrever teste com fixtures gravadas para resolução de VRF no MangaFire e bypass Cloudflare no ManhuaUS**
- [ ] **Step 2: Implementar daemon Puppeteer reutilizando processo Chromium com contextos isolados e `dumb-init`**
- [ ] **Step 3: Implementar API interna de extração em `POST /extract-chapter`**
- [ ] **Step 4: Validar testes do worker pool**
- [ ] **Step 5: Commit:** `feat(workers): implement persistent puppeteer browser pool and specialized extractors`

### Subtarefa 7.2: Backend Core & Web — Agendador 23:50 e Central de Notificações
**Files:**
- Create: `apps/api-gateway/internal/scheduler/scheduler.go`
- Create: `apps/api-gateway/internal/handlers/notifications_handler.go`
- Create: `apps/web-client/src/app/features/notifications/notification-bell.component.ts`
- Test: `apps/api-gateway/internal/scheduler/scheduler_test.go`

- [ ] **Step 1: Escrever teste de execução cron das 23:50 com lock transacional no PostgreSQL**
- [ ] **Step 2: Implementar detecção de novos episódios e criação de notificações com descarte ao ler**
- [ ] **Step 3: Implementar sino de notificações no cabeçalho do Angular com badge numérico em tempo real**
- [ ] **Step 4: Executar testes backend e frontend**
- [ ] **Step 5: Commit:** `feat(notifications): implement 23:50 release scheduler and angular notification bell`

### Subtarefa 7.3: Verificação de Integração Ponta a Ponta
**Files:**
- Test: `apps/web-client/e2e/notifications.spec.ts`

- [ ] **Step 1: Disparar verificação forçada (`POST /api/routine/run-check`) $\rightarrow$ checar badge de notificação no Angular $\rightarrow$ clicar na notificação e abrir o novo capítulo**
- [ ] **Step 2: Commit:** `test(e2e): add scheduled releases check and notification dismissal test`

---

## Sprint 8: Aplicativo Móvel Flutter para Google Play Store (Fase Mobile Final)

> **Requisitos:** Todas as RNs consolidadas, ADR-0005, ADR-0009, ADR-0011  
> **User Stories:** US-PRO-PLAY-01 a 04, US-PRO-MOB-01 a 05  
> **Objetivo:** Modernizar, integrar e empacotar o aplicativo Flutter consumindo a nova API comercial Go, com Google Sign-In nativo, WorkManager, push FCM, conformidade com a Play Store e compilação do `.aab` assinado.

### Subtarefa 8.1: Autenticação Google Sign-In Nativa e Armazenamento Seguro
**Files:**
- Modify: `apps/mobile-app/lib/services/api_service.dart`
- Modify: `apps/mobile-app/lib/controllers/auth_controller.dart`
- Modify: `apps/mobile-app/lib/screens/login_screen.dart`
- Test: `apps/mobile-app/test/services/api_service_auth_test.dart`

- [ ] **Step 1: Escrever teste para login com Google capturando `id_token` e persistindo JWT no `flutter_secure_storage`**
- [ ] **Step 2: Integrar SDK do Google Sign-In / Credential Manager nativo no Flutter**
- [ ] **Step 3: Executar testes de autenticação mobile e validar aprovação**
- [ ] **Step 4: Commit:** `feat(mobile): integrate native google sign-in and secure token storage in flutter`

### Subtarefa 8.2: Telas de Catálogo, Rankings Comunitários e Biblioteca
**Files:**
- Modify: `apps/mobile-app/lib/screens/home_screen.dart`
- Create: `apps/mobile-app/lib/screens/rankings_screen.dart`
- Create: `apps/mobile-app/lib/screens/catalog_screen.dart`
- Test: `apps/mobile-app/test/screens/rankings_screen_test.dart`

- [ ] **Step 1: Escrever teste de widget para exibição de abas de ranking e estrelas de avaliação**
- [ ] **Step 2: Implementar tela de Rankings dinâmicos consumindo `/api/rankings/views` e `/api/rankings/top-rated`**
- [ ] **Step 3: Ajustar tela de Biblioteca com `ReorderableListView` segregando rigorosamente obras favoritas no topo**
- [ ] **Step 4: Executar testes de widgets**
- [ ] **Step 5: Commit:** `feat(mobile): implement rankings, catalog and reorderable library screens in flutter`

### Subtarefa 8.3: Leitor com Gestos, Bloqueio no `lastChapter` e Offline-First
**Files:**
- Modify: `apps/mobile-app/lib/screens/reader_screen.dart`
- Test: `apps/mobile-app/test/screens/reader_screen_test.dart`

- [ ] **Step 1: Escrever teste validando bloqueio do gesto de swipe caso `currentChapter >= lastChapter`**
- [ ] **Step 2: Garantir verificação local obrigatória no FileSystem antes de efetuar chamada HTTP**
- [ ] **Step 3: Implementar badge visual `"Salvo Localmente / Offline"` e renderização fluida via `Image.file`**
- [ ] **Step 4: Executar testes e validar aprovação**
- [ ] **Step 5: Commit:** `feat(mobile): enforce offline-first reading and lastChapter swipe blocking in reader`

### Subtarefa 8.4: Downloads em Background com Android WorkManager
**Files:**
- Modify: `apps/mobile-app/lib/services/download_manager.dart`
- Create: `apps/mobile-app/lib/services/background_worker.dart`
- Test: `apps/mobile-app/test/services/download_manager_background_test.dart`

- [ ] **Step 1: Escrever teste de cancelamento atômico e integridade de arquivos concluídos**
- [ ] **Step 2: Integrar plugin nativo `workmanager` para manter transferências ativas com o app minimizado**
- [ ] **Step 3: Criar painel de gerenciamento de espaço em disco (retenção perpétua sem auto-evicção)**
- [ ] **Step 4: Executar testes de downloads**
- [ ] **Step 5: Commit:** `feat(mobile): implement android workmanager background downloads and disk management`

### Subtarefa 8.5: Notificações Push FCM e Exclusão de Conta In-App (Play Store Mandatório)
**Files:**
- Modify: `apps/mobile-app/lib/services/fcm_service.dart`
- Modify: `apps/mobile-app/lib/screens/settings_screen.dart`
- Modify: `apps/mobile-app/android/app/build.gradle.kts`
- Modify: `apps/mobile-app/android/app/src/main/AndroidManifest.xml`

- [ ] **Step 1: Integrar Firebase Cloud Messaging capturando tokens e registrando no backend Go**
- [ ] **Step 2: Implementar tela de configurações com botão visível de Exclusão de Conta (`DELETE /api/users/me`)**
- [ ] **Step 3: Remover `usesCleartextTraffic=true` e garantir Target SDK 34+ (Android 14)**
- [ ] **Step 4: Configurar assinatura oficial de release no Gradle com variáveis seguras**
- [ ] **Step 5: Executar compilação do Android App Bundle:** `cd apps/mobile-app && flutter build appbundle --release`
- [ ] **Step 6: Executar `flutter analyze` e `flutter test` garantindo 100% de aprovação**
- [ ] **Step 7: Commit:** `feat(mobile): implement fcm push, in-app account deletion and release bundle signing`

---

## Sprint 9: Esteira de CI/CD Completa e Publicação Automatizada

> **Requisitos:** ADR-0010  
> **User Stories:** US-PRO-CICD-01, US-PRO-CICD-02, US-PRO-CICD-03  
> **Objetivo:** Automação total dos testes, geração de imagens Docker multi-arquitetura e upload automático do `.aab` para a Play Console via GitHub Actions.

### Subtarefa 9.1: Workflows de Validação e Imagens Docker Multi-Arch
**Files:**
- Create: `.github/workflows/ci.yml`
- Create: `.github/workflows/build-docker.yml`

- [ ] **Step 1: Criar workflow `ci.yml` cobrindo linting e suítes de testes de Go, Angular e Flutter**
- [ ] **Step 2: Criar workflow `build-docker.yml` com Docker Buildx para `linux/amd64` e `linux/arm64` com Trivy scan**
- [ ] **Step 3: Commit:** `ci: configure automated testing and multi-arch docker builds`

### Subtarefa 9.2: Workflow de Publicação na Google Play Store
**Files:**
- Create: `.github/workflows/release-playstore.yml`

- [ ] **Step 1: Configurar build do `.aab` assinado no GitHub Actions com segredos de Keystore**
- [ ] **Step 2: Integrar action `r0adkll/upload-google-play` para envio automático na track Internal Testing**
- [ ] **Step 3: Validar execução da pipeline completa**
- [ ] **Step 4: Commit:** `ci: add automated google play store release upload workflow`
