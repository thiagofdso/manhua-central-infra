# Product Requirements Document (PRD) — Manhua Manager Pro (SaaS & Mobile)
**Versão:** 3.0.0-COMMERCIAL  
**Status:** Aprovado para Arquitetura e Engenharia de Produto  
**Data:** Outubro de 2026  
**Autor:** Thiago Oliveira & Equipe de Arquitetura de Software  
**Mercado Alvo:** B2C (Consumidor Final) — Web Global & Google Play Store  

---

## 1. Visão Executiva e Estratégia de Produto

### 1.1 Declaração de Visão
O **Manhua Manager Pro** é uma plataforma comercial moderna de consumo e rastreamento de quadrinhos asiáticos (manhuas, manhwas e mangás), desenhada para operação em escala na nuvem e publicação oficial na **Google Play Store** (Android) e Web Desktop/Mobile.

Diferente de um projeto meramente pessoal ou homelab self-hosted, o Manhua Manager Pro é estruturado como um **produto B2C multi-tenant de alto engajamento**, oferecendo autenticação de usuários, bibliotecas individuais isoladas, catálogo global centralizado com agregação de fontes, sistema comunitário de **avaliação/votação**, **rankings em tempo real dos mais acessados e melhor votados**, notificações push remotas (FCM) e leitura contínua com suporte avançado a downloads offline sem anúncios.

### 1.2 Proposta de Valor para o Usuário Final
* **Tudo em um só Lugar sem Anúncios:** Centraliza títulos de múltiplos agregadores em uma interface limpa, sem pop-ups, malwares ou redirecionamentos forçados.
* **Comunidade Ativa e Descoberta Inteligente:** Rankings dinâmicos de popularidade (diário, semanal e geral), notas da comunidade e recomendações das obras mais em alta.
* **Sincronização em Nuvem:** Progresso de leitura, histórico, favoritos e notas salvos com segurança na nuvem do usuário, sincronizados entre o app da Play Store e a Web.
* **Downloads Offline Reais para o Dia a Dia:** Permite baixar pacotes de episódios para leitura no metrô, ônibus ou viagens sem internet, com retenção permanente sob controle do usuário.

### 1.3 Estratégia de Distribuição e Monetização Futura
* **Canal Principal Mobile:** Publicação como aplicativo oficial na **Google Play Store**, em conformidade com as diretrizes do Google (Android App Bundle, Target SDK 34+, política de privacidade e exclusão de conta).
* **Canal Web:** Aplicação Web SPA corporativa em **Angular** de alto desempenho com suporte a PWA.
* **Modelo de Negócio (Evolutivo):**
  * *Fase Inicial (Aquisição e Engajamento):* 100% Gratuito com registro de usuário, catálogo comunitário completo, leitura contínua e limites generosos de download offline.
  * *Fase de Monetização (Freemium/Pro):* Assinatura Pro / VIP opcional via Google Play Billing e Stripe (downloads ilimitados em lote, sincronização prioritária, temas exclusivos e selo de apoiador) ou anúncios nativos não-invasivos.

---

## 2. Personas de Usuário e Jornadas de Negócio

### 2.1 Persona 1: Gabriel — O "Explorador de Tendências" (Community & Discovery)
* **Perfil:** Estudante de 20 anos, sempre em busca dos melhores manhwas da temporada. Gosta de ver o que a comunidade está lendo e avalia os capítulos com frequência.
* **Jornada de Valor:** Abre o app no celular, consulta a aba **"Rankings"** para conferir as obras mais lidas da semana e os títulos mais bem votados. Adiciona o líder do ranking à sua biblioteca com 1 clique e atribui nota 9/10 após ler o arco inicial.

### 2.2 Persona 2: Beatriz — A "Leitora Móvel Offline" (Play Store Commuter)
* **Perfil:** Profissional de 26 anos, baixou o app diretamente pela Play Store. Utiliza transporte público diário sem conexão de dados confiável.
* **Jornada de Valor:** Recebe uma notificação push no celular informando o lançamento do capítulo novo de sua obra favorita. Conectada ao Wi-Fi do trabalho, baixa os últimos 5 episódios em 30 segundos. Durante o trajeto de volta no metrô, lê todos os episódios sem consumir plano de celular e sem travamentos.

### 2.3 Persona 3: Roberto — O "Administrador da Plataforma" (SaaS Ops)
* **Perfil:** Administrador do sistema responsável pela saúde do backend, moderação do catálogo global e monitoramento de tráfego.
* **Jornada de Valor:** Acompanha métricas de acessos, latência do proxy de streaming, taxa de sucesso de scrapers por domínio e modera títulos reportados pelos usuários através de um painel administrativo exclusivo.

---

## 3. Arquitetura Funcional do Produto Comercial

A plataforma organiza suas capacidades em 7 pilares de produto:

```
┌────────────────────────────────────────────────────────────────────────┐
│                   MANHUA MANAGER PRO — SAAS & STORE                    │
├────────────────────────────────┬───────────────────────────────────────┤
│ 1. Catálogo Global & Rankings  │ 4. Downloads & Motor Offline Local    │
│ 2. Biblioteca Pessoal Isolada  │ 5. Notificações Push & Agendamento    │
│ 3. Leitura Contínua & Proxy    │ 6. Conformidade Google Play Store     │
│                                │ 7. Containerização & Cloud-Native     │
└────────────────────────────────┴───────────────────────────────────────┘
```

### 3.1 Pilar 1: Catálogo Canônico Global, Votações e Rankings
* **Catálogo Global Unificado:** As obras não existem apenas isoladas por usuário. O backend mantém uma entidade canônica compartilhada (`CanonicalManhua`) contendo título, títulos alternativos, capa otimizada, sinopse, status de publicação, gênero e provedores de extração associados.
* **Sistema de Votação Comunitária (Rating):**
  * Usuários autenticados podem atribuir notas de 1 a 10 estrelas para cada obra.
  * O score público da obra é calculado via **Média Ponderada Bayesiana**, impedindo que obras com apenas 1 voto de nota 10 ultrapassem obras aclamadas com milhares de avaliações.
* **Motor de Rankings em Tempo Real (Powered by Redis):**
  * **Mais Acessados / Mais Lidos:** Rastreamento atômico de visualizações utilizando Redis Sorted Sets (`ZINCRBY` / `ZREVRANGE`), segmentado em:
    * *Top Hoje (Diário)*
    * *Top da Semana (Últimos 7 dias)*
    * *Top Geral (All-time)*
  * **Melhor Votados:** Ranking ordenado pelo score ponderado da comunidade com contagem mínima de votos.
  * **Mais Populares / Mais Adicionados:** Ranking baseado no total de usuários que mantêm a obra salva em suas bibliotecas ativas.

### 3.2 Pilar 2: Biblioteca Pessoal Isolada do Usuário
* **Segregação Estrita de Dados (Multi-Tenancy Lógico):** Cada usuário possui seu próprio registro de biblioteca (`UserLibraryItem`). O progresso de leitura (`currentChapter`), o ordenamento customizado (`customOrder`), os favoritos (`isFavorite`), as anotações e os capítulos baixados são estritamente individuais e isolados.
* **Regra de Ouro dos Favoritos Preservada:** Obras marcadas como favoritas pelo usuário permanecem permanentemente no topo de sua biblioteca pessoal, com segregação estrita e promoção automática ao topo do grupo ao ler ou atualizar capítulos.
* **Importação Fácil do Catálogo para a Biblioteca:** Com 1 clique no card do catálogo ou ranking, a obra é incorporada à biblioteca pessoal do usuário com configurações inteligentes padrão.

### 3.3 Pilar 3: Leitura Contínua de Alta Performance e Proxy Streaming
* **Leitor Vertical Webtoon:** Renderização de rolagem contínua fluida, com carregamento sob demanda de imagens e prefetching inteligente.
* **Proxy de Imagens Seguro de Zero-Buffer em Go:**
  * Streaming progressivo de bytes direto da scan/CDN para o cliente web/mobile (`io.Copy`), mantendo consumo de RAM irrisório.
  * Bloqueio rigoroso de **SSRF (Server-Side Request Forgery)** contra destinos internos e redes privadas.
  * Otimização de entrega com cache de cabeçalhos HTTP (`Cache-Control: public, max-age=86400`).
* **Cache em Nuvem de Capas (CDN / S3 / R2):** Capas de obras do catálogo global são cacheadas e otimizadas em Object Storage próprio para carregamento imediato nas listagens e rankings, sem sobrecarregar as fontes externas.

### 3.4 Pilar 4: Motor de Downloads e Leitura Offline
* **Downloads por Intervalo (Range Batching):** Suporte a download de faixas de capítulos (até 50 capítulos por lote), validando o teto de `lastChapter`.
* **Prioridade Offline Absoluta no Leitor:** O leitor verifica localmente a presença do capítulo antes de tentar a rede. Se baixado, consome 0 bytes de dados móveis.
* **Retenção Perpétua Controlada pelo Usuário:** Nenhum algoritmo de expiração automática ou LRU apaga capítulos sem consentimento do leitor.
* **Gerenciador de Fila com Cancelamento Seguro:** Processamento em segundo plano desvinculado da tela ativa, permitindo cancelamento instantâneo preservando capítulos completos.

### 3.5 Pilar 5: Notificações Push e Agendador de Lançamentos
* **Notificações Push Remotas (Firebase Cloud Messaging - FCM):**
  * Disparo de push notifications nativas para os smartphones dos usuários quando um novo episódio de uma obra seguida for lançado.
  * Integração transparente com o app Flutter (notificação na bandeja do Android mesmo com o app fechado).
* **Agendador Noturno Idempotente (23:50):** Varredura inteligente de lançamentos executada em background com controle de concorrência por banco/Redis.

### 3.6 Pilar 6: Conformidade e Requisitos para a Google Play Store
* **Empacotamento e Compilação:** Distribuição exclusiva via **Android App Bundle (.aab)** compilado contra o Target SDK mais recente (API 34+), assinado com **Google Play App Signing**.
* **Mandatório Play Store — Exclusão de Conta In-App:** Botão e fluxo transparente dentro das configurações do app que permite ao usuário solicitar a exclusão total imediata de sua conta e todos os dados associados (biblioteca, histórico, avaliações).
* **Segurança de Dados e Privacidade:** Políticas de privacidade e termos de uso hospedados publicamente, preenchimento detalhado do formulário de *Data Safety* da Play Console.
* **Conformidade de Conteúdo e DMCA Safe Harbor:** A plataforma opera como um indexador/leitor de terceiros (estilo browser/leitor RSS inteligente), sem redistribuição de pirataria em massa, provendo canal formal de denúncia e remoção de links.

### 3.7 Pilar 7: Containerização Total e Infraestrutura Cloud-Native
* **Containerização Obrigatória de Todos os Serviços:** Nenhum componente de backend, worker ou web roda diretamente no bare-metal sem isolamento. Todo o ecossistema é empacotado em imagens Docker multi-estágio (*multi-stage builds*), seguras, leves e executadas como usuários não-root (*non-root*).
* **Padronização com Docker Compose:**
  * `docker-compose.yml` para ambiente de desenvolvimento local (com volumes de hot-reload, PostgreSQL e Redis locais).
  * `docker-compose.prod.yml` para implantação de produção em nuvem (com limites de CPU/memória, políticas de restart, redes isoladas e health checks).
* **Imagens Imutáveis e Distroless:** O binário em Go utiliza imagens finais estáticas/distroless (< 30 MB) sem shell ou ferramentas desnecessárias, reduzindo drasticamente a superfície de vulnerabilidades (CVEs).
* **Prontidão para Nuvem (Cloud-Ready):** Serviços stateless preparados para escalabilidade horizontal em orquestradores (Kubernetes, AWS ECS, Google Cloud Run ou Docker Swarm) com suporte a graceful shutdown e sondas de liveness/readiness.

---

## 4. Estratégia Tecnológica para Escala Comercial

Para atender a milhares de usuários simultâneos com custos operacionais controlados, a arquitetura substitui servidores caseiros por uma stack de nuvem de alta densidade:

```mermaid
flowchart TD
    subgraph Users["Acessos Multiplataforma"]
        PlayStoreApp["App Android (Google Play Store)\n[Flutter 3.x / FCM Push / SQLite Local]"]
        WebSPA["Web SPA (Desktop & Mobile)\n[Angular 18+ / Signals / PWA / Tailwind]"]
    end

    subgraph Edge["Camada de Borda & Segurança"]
        Cloudflare["Cloudflare Edge\n[WAF / SSL / DDoS Protection / R2 Covers]"]
    end

    subgraph BackendCluster["Cluster de Backend em Nuvem (Docker / VPS / K8s)"]
        API["Core API Gateway (Go)\n[Auth JWT / Business Rules / Proxy Streaming]"]
        WorkerPool["Headless Scraping Pool (Node.js)\n[Brave / Puppeteer / Cloudflare Bypass]"]
        Asynq["Queue & Scheduler Worker (Go)\n[Rotina 23:50 / FCM Push Dispatcher]"]
    end

    subgraph Persistence["Camada de Dados & Cache de Alta Performance"]
        Postgres[(PostgreSQL 16 Cluster)\n[Usuários / Obras Canônicas / Bibliotecas / Votos]]
        Redis[(Redis 7 Cluster)\n[Leaderboards ZSET / Sessões / Rate Limits / Fila]]
        S3Bucket[("Object Storage (Cloudflare R2 / S3)\n[Capas Otimizadas WebP]")]
    end

    PlayStoreApp --> Cloudflare
    WebSPA --> Cloudflare
    Cloudflare --> API
    API --> Postgres
    API --> Redis
    API --> S3Bucket
    API --> WorkerPool
    Asynq --> Redis
    Asynq --> Postgres
    Asynq -->|FCM Push API| PlayStoreApp
    API -->|Streaming Seguro| Scans[Fontes Externas]
    WorkerPool -->|Scraping Avançado| Scans
```

### 4.1 Tecnologias Selecionadas

| Camada | Tecnologia | Papel no Produto Comercial |
| :--- | :--- | :--- |
| **Backend Core** | **Go (Golang)** | API REST de altíssima performance, proxy de streaming direto de imagens sem retenção de memória, autenticação e regras de negócio. |
| **Worker Engine** | **Node.js (TypeScript) & Python** | Workers especializados com Puppeteer para contornar Cloudflare e gerar tokens criptográficos (MangaFire VRF). |
| **Banco Principal** | **PostgreSQL 16+** | Persistência transacional com suporte a JSONB, integridade referencial estrita e índices B-Tree e GIN. |
| **Cache & Rankings** | **Redis 7+** | Motor ultra-rápido para rankings em tempo real com Sorted Sets (`ZSET`), controle de rate limiting e filas assíncronas. |
| **Storage de Mídia** | **Cloudflare R2 / AWS S3** | Armazenamento de capas otimizadas em formato WebP com distribuição global por CDN. |
| **Push Notifications**| **Firebase Cloud Messaging (FCM)** | Entrega confiável de notificações de novos capítulos em celulares Android/iOS. |
| **Frontend Web** | **Angular 18+** | SPA corporativa rica com Signals, Tailwind CSS, leitor contínuo com Virtual Scrolling e suporte a PWA. |
| **Mobile App** | **Flutter (Dart)** | Aplicativo compilado nativo, fluido a 120Hz, empacotado em `.aab` para publicação na Google Play Store. |
| **Containerização** | **Docker & Docker Compose** | Multi-stage builds, imagens distroless non-root, orquestração local e produção cloud-native. |

---

## 5. Métricas de Negócio e KPIs de Sucesso

* **Engajamento e Retenção:**
  * Daily Active Users (DAU) e Monthly Active Users (MAU).
  * Taxa de retenção D7 e D30 acima de **40%**.
  * Média de capítulos lidos por sessão $\ge 8$.
* **Desempenho da Comunidade:**
  * Percentual de obras ativas avaliadas pela comunidade $\ge 70\%$.
  * Volume de votos atribuídos por usuário ativo por mês $\ge 5$.
* **Operação e Estabilidade na Play Store:**
  * Avaliação média na Play Store mantida acima de **4.5 estrelas**.
  * Crash-free users rate $\ge 99.5\%$.
  * Latência média de entrega do proxy de imagens $\le 120\text{ ms}$.

---

## 6. Roadmap Estratégico de Lançamento Comercial

### Fase 1: Fundação Multi-Tenant, Catálogo Global e Go Backend (P0)
* Monorepositório estruturado com contratos OpenAPI.
* Autenticação completa JWT (Cadastro, Login, Refresh, Exclusão de Conta).
* Banco PostgreSQL com entidades de Usuário, Catálogo Canônico e Biblioteca Pessoal.
* Proxy de streaming em Go com proteção anti-SSRF e cache de capas em Object Storage.
* Motor de Rankings e Estatísticas integrado com Redis (Mais Lidos, Top Votados).

### Fase 2: Aplicação Web em Angular & Painel Comunitário (P1)
* Interface Angular 18+ com telas de Exploração do Catálogo Global, Rankings dinâmicos e Biblioteca Pessoal com ordenação drag-and-drop.
* Sistema interativo de votação por estrelas (1 a 10) com recálculo Bayesiano imediato.
* Leitor contínuo Webtoon otimizado com rolagem virtual e preloading.

### Fase 3: Aplicativo Flutter para a Google Play Store (P1)
* App Flutter com design Material You / Material 3.
* Onboarding e Login seguro via API comercial.
* Notificações Push nativas integradas via Firebase Cloud Messaging (FCM).
* Downloads em background resilientes via Android WorkManager.
* Geração do pacote `.aab` assinado com release key e publicação na Google Play Console (Track fechada / Beta aberto).

### Fase 4: Recursos Sociais Avançados e Escala (P2)
* Sistema de comentários e discussões por capítulo.
* Listas personalizadas públicas criadas por usuários (ex: "Melhores de Cultivo 2026").
* Pipeline de CI/CD automatizado no GitHub Actions publicando direto na Play Store via Google Play Developer API.
