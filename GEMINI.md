# Manhua Manager Pro — Diretrizes, Padrões de Projeto e Governança Técnica

Este documento define as diretrizes operacionais, mandamentos arquiteturais e padrões de engenharia obrigatórios para qualquer desenvolvedor ou agente de IA que atue no repositório **Manhua Manager Pro**.

---

## 1. Governança Mandatória de ADRs (Architecture Decision Records)

> [!IMPORTANT]
> **REGRA DE OURO DA ARQUITETURA:** Toda e qualquer decisão arquitetural relevante — seja introdução de novas tecnologias, alteração no modelo de dados, mudanças em estratégias de autenticação, substituição de bibliotecas de infraestrutura, novas regras de negócio transversais ou inclusão de novos provedores de scraping — **DEVE OBRIGATORIAMENTE ser registrada ou atualizada na pasta [`docs/adr/`](docs/adr/)**.

### Regras para Manutenção de ADRs:
1. **Consulte Antes de Codificar:** Antes de propor refatorações ou implementar novos módulos, leia os ADRs existentes ([`docs/adr/README.md`](docs/adr/README.md)) para respeitar as decisões consolidadas (ex: ADR-0002 sobre streaming de proxy de imagens, ADR-0006 sobre PostgreSQL, ADR-0008 sobre Google OAuth, ADR-0010 sobre Docker Distroless, ADR-0011 sobre retenção perpétua de downloads).
2. **Registro de Novas Decisões:** Caso uma nova decisão arquitetural seja tomada:
   * Crie o arquivo numerado sequencialmente em `docs/adr/XXXX-<nome-da-decisao>.md` seguindo o formato Michael Nygard (*Contexto*, *Decisão*, *Consequências*).
   * Atualize imediatamente o sumário em [`docs/adr/README.md`](docs/adr/README.md).
3. **Atualização de Decisões Anteriores:** Se uma decisão arquitetural for revogada, ajustada ou substituída, atualize o status da ADR antiga para `Substituído por ADR-XXXX` ou `Em Revisão`, mantendo o histórico de evolução do sistema auditável e transparente.

---

## 2. Comandos Operacionais e Ambiente de Desenvolvimento

O projeto é estruturado em um **Monorepositório** e **100% containerizado**:

### 2.1 Gestão de Ambientes via Docker Compose
* **Iniciar Ambiente Local de Desenvolvimento:**
  ```bash
  make dev
  # ou: docker compose -f deployments/docker-compose.yml up --build
  ```
* **Iniciar Ambiente de Produção Cloud-Native:**
  ```bash
  make prod
  # ou: docker compose -f deployments/docker-compose.prod.yml up -d --build
  ```
* **Parar Todos os Serviços:**
  ```bash
  make down
  # ou: docker compose -f deployments/docker-compose.yml down
  ```
* **Limpar Volumes e Banco:**
  ```bash
  make clean
  # ou: docker compose -f deployments/docker-compose.yml down -v
  ```

### 2.2 Suítes de Testes por Camada
* **Backend Core (Go):**
  ```bash
  cd apps/api-gateway && go test -race -covermode=atomic ./...
  ```
* **Scraping Worker Pool (Node.js/TypeScript):**
  ```bash
  cd apps/scraping-workers && npm test
  ```
* **Frontend Web (Angular 18+):**
  ```bash
  cd apps/web-client && npm test -- --watch=false --browsers=ChromeHeadless
  ```
* **Mobile App (Flutter):**
  ```bash
  cd apps/mobile-app && flutter test --coverage
  ```

### 2.3 Compilação e Empacotamento
* **Gerar Build de Produção da Web:**
  ```bash
  cd apps/web-client && npm run build -- --configuration=production
  ```
* **Gerar Android App Bundle (.aab) para a Google Play Store:**
  ```bash
  cd apps/mobile-app && flutter build appbundle --release
  ```

---

## 3. Invariantes e Regras de Negócio Invioláveis

Todo código adicionado ou refatorado deve respeitar estritamente as regras de negócio consolidadas em [`docs/specs.md`](docs/specs.md):

1. **A Regra de Ouro dos Favoritos (RN-04):**
   * Obras com `isFavorite: true` residem estritamente no topo da biblioteca pessoal do usuário. Uma obra favorita **NUNCA** pode ser listada abaixo de uma não-favorita.
   * A ordenação canônica de saída da biblioteca é sempre: `(isFavorite DESC, customOrder ASC, updatedAt DESC)`.
2. **Promoção Automática de Leitura (RN-03.3):**
   * Ao avançar, recuar ou ler um capítulo, a obra do usuário deve ser promovida ao topo de seu grupo (`customOrder = min_order_do_grupo - 1`).
3. **Teto Inviolável por `lastChapter` (RN-03.2):**
   * Se `lastChapter` estiver definido na obra, o avanço manual, os botões de próximo e o gesto de swipe no leitor móvel são bloqueados se $\text{currentChapter} \ge \text{lastChapter}$. Requisições de download com `end > lastChapter` retornam HTTP 400.
4. **Downloads Offline Perpétuos sem Evicção Automática (RN-05.4 & ADR-0011):**
   * **PROIBIDO** implementar qualquer rotina de expiração automática por tempo (TTL) ou algoritmo LRU. Capítulos baixados permanecem no dispositivo indefinidamente até que o usuário solicite explicitamente sua exclusão.
5. **Leitor Offline-First Prioritário (RN-05.3):**
   * O leitor (tanto no Angular via IndexedDB quanto no Flutter via FileSystem) **DEVE** verificar localmente a presença das imagens antes de realizar qualquer chamada de rede externa. Existindo localmente, renderiza do disco sem requisições HTTP.
6. **Preservação de Templates de URL (RN-01):**
   * Todo template no banco e na API deve preservar o placeholder `{chapter}`. Fontes com numeração não-linear ou identificadores alfanuméricos opacos (MangaFire, Comix, ManhuaUS) devem utilizar os metadados `nextChapter` e `prevChapter`.

---

## 4. Diretrizes de Segurança, Proxy e Scraping

1. **Streaming Proxy com Zero-Buffer (ADR-0002):**
   * O proxy `/api/reader/proxy-image` deve encaminhar bytes diretamente ao cliente utilizando streaming (`io.Copy` em chunks de 32 KB). É proibido alocar o arquivo completo na memória RAM.
2. **Proteção Total contra SSRF (Server-Side Request Forgery):**
   * O gateway Go deve validar a resolução DNS de qualquer URL requisitada no proxy, bloqueando conexões que resolvam para endereços privados (RFC 1918), loopback (`127.0.0.1`), link-local (`169.254.169.254`) e metadados de nuvem.
   * Somente domínios cadastrados na *allowlist* oficial do sistema podem ser proxyados.
3. **Injeção de Cabeçalhos Especializados por Domínio:**
   * `asurascans.com` / `cdn.asurascans.com`: Injetar `Referer: https://asurascans.com/`.
   * `ravenscans.org`: Injetar `Referer: https://ravenscans.org/`.
   * `mangafire.to` / `mfcdn`: Injetar `Referer: https://mangafire.to/`.
   * `mangak.io` / `qvzr*.org`: Injetar `Referer: https://mangak.io/`.
   * `manhuaus.com`: Injetar `Referer: https://manhuaus.com/`, User-Agent compatível e cookie de sessão `cf_clearance`.
   * `comix.to`: Não enviar cabeçalho Referer (`referer = None`).
4. **Isolamento de Navegadores Headless (ADR-0003 & ADR-0010):**
   * O Puppeteer/Chromium deve rodar exclusivamente no microsserviço `apps/scraping-workers`, isolado sob o gerenciador de processos `dumb-init` e executando com usuário sem privilégios `pptruser`.

---

## 5. Autenticação, Multi-Tenancy e Google Play Store

1. **Segregação Multi-Tenant Estrita (ADR-0006):**
   * O catálogo público (`canonical_manhuas`) é compartilhado, mas as bibliotecas (`user_libraries`), avaliações (`user_ratings`) e notificações (`notifications`) são estritamente isoladas por `user_id`.
2. **Autenticação Híbrida e Google Sign-In Unificado (ADR-0008):**
   * Suporte nativo a Login com 1 toque no Google na Web (Angular GIS) e no aplicativo Android (Google Sign-In / Credential Manager), validado criptograficamente no backend Go via rota `POST /api/auth/google`.
   * Suporte alternativo a e-mail e senha convencional com hash criptográfico **Argon2id**.
3. **Exclusão de Conta In-App (Mandatório Google Play):**
   * O app móvel e o backend devem conter a rota e interface para exclusão imediata e definitiva da conta e dados do usuário (`DELETE /api/users/me`), garantindo conformidade com as políticas da Google Play Console.
4. **Eliminação de Tráfego Cleartext:**
   * Todo tráfego deve ser estritamente TLS 1.3/HTTPS. Não utilizar `usesCleartextTraffic=true` no Android nem chamadas HTTP inseguras.

---

## 6. Padrões de Código e Esteira CI/CD

1. **Desenvolvimento Orientado a Testes (TDD):**
   * Novas funcionalidades e correções de bugs devem começar pela escrita de testes que falham antes do código de implementação.
   * Manter cobertura mínima: $\ge 85\%$ no backend Go, $\ge 80\%$ no Angular e $\ge 80\%$ no Flutter.
2. **Containerização Distroless (ADR-0010):**
   * O backend Go em produção deve utilizar sempre a imagem base `gcr.io/distroless/static-debian12:nonroot`.
3. **Sincronização de Documentação:**
   * Toda mudança que altere requisitos de negócio, fluxos de usuário ou arquitetura técnica deve refletir em [`docs/PRD.md`](docs/PRD.md), [`docs/specs.md`](docs/specs.md) e [`docs/plan.md`](docs/plan.md).

---

## 7. Metodologia de Sprints Transversais (Ponta a Ponta)

> [!IMPORTANT]
> **DIRETRIZ MANDATÓRIA DE DESENVOLVIMENTO VERTICAL:**
> O desenvolvimento deste projeto **NÃO É LINEAR/HORIZONTAL** (não se desenvolve todo o backend para só depois construir o frontend). O fluxo de engenharia é estritamente organizado em **Sprints Transversais (Vertical Slices)**: cada funcionalidade deve ser implementada e testada **ponta a ponta** (Banco/Redis $\rightarrow$ API Go $\rightarrow$ Web Angular $\rightarrow$ Teste E2E).
> **O Aplicativo Mobile (Flutter) fica concentrado nas Sprints Finais**, garantindo que a API e o ecossistema de nuvem estejam 100% estáveis antes da publicação na Play Store.

### 7.1 Mapeamento Oficial de Sprints, Requisitos e User Stories

| Sprint | Foco Transversal da Funcionalidade | Requisitos Técnicos | Histórias de Usuário Atendidas | Escopo e Entregáveis Ponta a Ponta |
| :---: | :--- | :---: | :---: | :--- |
| **Sprint 0** | **Fundação e Orquestração Cloud-Native** | ADR-0001, ADR-0010 | US-PRO-DOCK-01, US-PRO-DOCK-02 | Monorepo scaffolding, `Makefile`, Docker Compose (Dev/Prod), PostgreSQL 16, Redis 7 e OpenAPI contracts. |
| **Sprint 1** | **Autenticação Unificada e Gestão de Contas** | RN-10.1, ADR-0008 | US-PRO-PLAY-01, US-PRO-PLAY-02 | **Ponta a Ponta:** Tabela `users`, validação Google ID Token em Go, JWT/Refresh tokens, login Google One Tap no Angular, tela de perfil e exclusão definitiva de conta (`DELETE /api/users/me`). |
| **Sprint 2** | **Catálogo Canônico Global e Scraping Rápido** | RN-01, RN-02, ADR-0006 | US-CURR-02, US-CURR-11, US-PRO-CORE-02 | **Ponta a Ponta:** Tabela `canonical_manhuas`, parsers estáticos em Go (AsuraScans, RavenScans), cache de capas em R2/S3, tela de Catálogo Global com busca paginada no Angular. |
| **Sprint 3** | **Biblioteca Pessoal, Favoritos e Regra de Ouro** | RN-03.3, RN-04, ADR-0006 | US-CURR-01, US-CURR-05, US-PRO-COMM-04 | **Ponta a Ponta:** Tabela `user_libraries`, ordenação canônica em Go, promoção atômica, tela de Biblioteca no Angular com Drag-and-Drop (CDK) segregando favoritas no topo e botão "+ Biblioteca". |
| **Sprint 4** | **Leitor Webtoon e Streaming Proxy Anti-SSRF** | RN-01.2, RN-02, RN-03.2, ADR-0002 | US-CURR-03, US-CURR-04, US-PRO-CORE-01, US-PRO-WEB-02 | **Ponta a Ponta:** Proxy de streaming em Go com `io.Copy` e bloqueio SSRF de IPs privados, Leitor Webtoon no Angular com Virtual Scrolling a 60 fps, bloqueio em `lastChapter` e atalhos de teclado. |
| **Sprint 5** | **Votações Comunitárias e Rankings em Tempo Real** | RN-07, RN-08, ADR-0007 | US-PRO-COMM-01, US-PRO-COMM-02, US-PRO-COMM-03 | **Ponta a Ponta:** Tabela `user_ratings`, cálculo Bayesiano no Go, Redis Sorted Sets (`ZSET`), tela de Rankings no Angular ("Mais Lidos Hoje/Semana", "Melhor Votados") e voto por estrelas com recálculo instantâneo. |
| **Sprint 6** | **Downloads em Lote e Leitura Offline na Web** | RN-05, RN-06, ADR-0011 | US-CURR-06, US-CURR-07, US-CURR-08, US-PRO-WEB-03, US-PRO-WEB-04 | **Ponta a Ponta:** Endpoint `/api/reader/batch` (máx 50 capítulos) com teto de `lastChapter`, painel de downloads ativos no Angular com cancelamento (`AbortController`), IndexedDB offline e leitor offline-first. |
| **Sprint 7** | **Scraping Avançado (Headless Pool) e Rotina 23:50** | RN-02 (MangaFire/Comix), RN-09, ADR-0003 | US-CURR-09, US-CURR-10, US-PRO-SCRAP-02 | **Ponta a Ponta:** Worker pool Node.js/Puppeteer com `dumb-init` (Brave engine / Turnstile bypass), cron idempotente das 23:50 no Go com lock transacional e sino de notificações reativo no Angular. |
| **Sprint 8** | **Aplicativo Móvel Flutter para Google Play Store** | Todas as RNs, ADR-0005, ADR-0009 | US-PRO-PLAY-01 a 04, US-PRO-MOB-01 a 05 | **Mobile Nativo:** Google Sign-In nativo, telas de catálogo/rankings/biblioteca, leitor por gestos com bloqueio no `lastChapter`, downloads em background via WorkManager, push FCM, exclusão de conta e pacote `.aab` assinado. |
| **Sprint 9** | **Esteira CI/CD Completa e Publicação Play Store** | ADR-0010 | US-PRO-CICD-01 a 03 | **Automação GitHub Actions:** Linting, testes unitários e de integração, Docker Buildx multi-arch para GHCR e upload automático do `.aab` para a Play Console via Google Play Developer API. |

### 7.2 Critérios de Aceite para Conclusão de cada Sprint Transversal
Nenhuma Sprint pode ser considerada concluída sem que todas as suas camadas satisfaçam o seguinte checklist:
1. **Banco & Repositório:** Migração SQL executada e testada;
2. **Backend Core:** Handlers, middlewares e regras de negócio com testes de integração passando;
3. **Frontend Web:** Telas e componentes Angular desenvolvidos, integrados via HTTP e validados com testes unitários;
4. **Verificação Ponta a Ponta:** Teste E2E ou manual demonstrando a jornada completa funcionando entre o navegador e o banco de dados;
5. **Governança:** ADRs atualizadas e código commitado seguindo Conventional Commits.

---

## 8. Diretrizes de Design, UI/UX e Frontend (Impeccable)

As decisões de interface, ergonomia de uso e padrões visuais do frontend web e mobile são governadas por [`PRODUCT.md`](PRODUCT.md) e [`DESIGN.md`](DESIGN.md) (via skill Impeccable):

* **Registro de Produto:** `product` (Leitor Webtoon contínuo, biblioteca pessoal, catálogo comunitário e rankings).
* **Tom & Personalidade:** Vibrante, Imersivo e Confiável (*Content First*, modo escuro profundo, badges energéticos com alto contraste).
* **Anti-Padrões Proibidos (AI Slop / Bad Practices):** Poluição visual de agregadores piratas, frieza monocromática de dashboards corporativos, bordas laterais coloridas decorativas em cards (`border-left`), textos em gradiente artificial, glassmorphism gratuito e grades monótonas de cards idênticos sem hierarquia.
* **Acessibilidade (A11y):** Padrão WCAG 2.1 nível AA, contraste $\ge 4.5:1$ no texto, suporte estrito a `prefers-reduced-motion: reduce`, atalhos de teclado no leitor e áreas de toque confortáveis ($\ge 44\times 44\text{px}$).
* **Ferramental e Comandos:** Use `/impeccable document` para extrair/atualizar o `DESIGN.md`, `/impeccable craft <feature>` para construir novos módulos de UI, `/impeccable critique` / `/impeccable audit` para revisão de qualidade, e `/impeccable live` para prototipagem interativa no navegador.

