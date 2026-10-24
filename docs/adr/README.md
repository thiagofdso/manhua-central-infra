# Architecture Decision Records (ADRs) — Manhua Manager Pro

Este diretório contém o registro formal de todas as decisões arquiteturais tomadas para o **Manhua Manager Pro**, documentando o contexto, as alternativas avaliadas, as decisões tomadas e suas consequências operacionais e de engenharia.

---

## Índice de Decisões Arquiteturais

| ADR | Título | Status | Data |
| :---: | :--- | :---: | :---: |
| [0001](0001-monorepo-architecture.md) | Adoção de Monorepositório para o Ecossistema Completo | **Aceito** | Outubro 2026 |
| [0002](0002-go-backend-streaming-proxy-ssrf.md) | Backend Core e Proxy de Imagens com Streaming de Zero-Buffer e Proteção Anti-SSRF em Go | **Aceito** | Outubro 2026 |
| [0003](0003-nodejs-puppeteer-scraping-worker-pool.md) | Worker Pool Desacoplado em Node.js/Puppeteer para Contorno de Cloudflare e Polyfills | **Aceito** | Outubro 2026 |
| [0004](0004-angular-standalone-signals-web-spa.md) | Frontend Web Corporativo em Angular 18+ com Standalone Components e Signals | **Aceito** | Outubro 2026 |
| [0005](0005-flutter-mobile-play-store-compliance.md) | Aplicativo Móvel em Flutter com Conformidade Total para a Google Play Store | **Aceito** | Outubro 2026 |
| [0006](0006-postgresql-multitenant-relational-persistence.md) | Persistência Relacional em PostgreSQL com Segregação Multi-Tenant e Catálogo Canônico | **Aceito** | Outubro 2026 |
| [0007](0007-redis-sorted-sets-realtime-rankings.md) | Motor de Rankings em Tempo Real e Cache de Acessos com Redis Sorted Sets (ZSET) | **Aceito** | Outubro 2026 |
| [0008](0008-unified-google-oauth-and-jwt-auth.md) | Autenticação Unificada com Google OAuth (Web e Android) e Tokens JWT/Argon2id | **Aceito** | Outubro 2026 |
| [0009](0009-firebase-cloud-messaging-push-notifications.md) | Notificações Push Remotas em Dispositivos Móveis via Firebase Cloud Messaging (FCM) | **Aceito** | Outubro 2026 |
| [0010](0010-docker-containerization-distroless-compose.md) | Containerização Total com Docker Multi-Estágio, Imagens Distroless e Docker Compose | **Aceito** | Outubro 2026 |
| [0011](0011-perpetual-offline-downloads-no-auto-eviction.md) | Política Rígida de Downloads Offline Perpétuos sem Evicção Automática por LRU/TTL | **Aceito** | Outubro 2026 |
| [0012](0012-polyrepo-workspace-with-local-orchestrator.md) | Adoção de Workspace Polyrepo com Orquestrador Local e Repositórios Remotos Independentes | **Aceito** | Outubro 2026 |
