# Especificação Técnica de Design — Importação de Obras e Carga Inicial de Catálogo

**Data:** 2026-10-26  
**Status:** Aprovado para Planejamento  
**Contexto:** `manhua-manager-pro` (Sprint 2 / Expansão de Catálogo e Descoberta)  
**Governança & Design:** Em estrita conformidade com [`PRODUCT.md`](file:///home/thiagofdso/Projetos/manhua-manager-pro/PRODUCT.md) e [`DESIGN.md`](file:///home/thiagofdso/Projetos/manhua-manager-pro/DESIGN.md).

---

## 1. Visão Geral e Objetivos

O **Manhua Manager Pro** atualmente possui um banco PostgreSQL com tabela `canonical_manhuas`, mas conta apenas com poucas obras de teste (*seed*), sem um mecanismo para que o usuário explore e importe ativamente obras de plataformas externas ou para que o catálogo já nasça preenchido com obras populares.

Inspirado na arquitetura do projeto de referência ([`/home/thiagofdso/Projetos/manhua-manager/`](file:///home/thiagofdso/Projetos/manhua-manager/)), esta funcionalidade introduz:
1. **Modal de Importação Dedicado no Frontend Web:** Interface ergonômica e moderna para explorar provedores externos (`asurascans.com`, `ravenscans.org`, `mangak.io`, `manhuatop.org`, etc.), pesquisar títulos, selecionar itens em lote e importá-los diretamente para o Catálogo Canônico Global e para a Biblioteca Pessoal do usuário.
2. **Camada de API e Provedores em Go com Cache Redis (7 dias):** Endpoints REST para listar domínios, navegar/pesquisar com cache em memória no Redis e realizar a importação atômica em lote com `canonicalRepo.UpsertBatch` e criação de vínculo em `user_libraries`.
3. **Carga Inicial de Obras Populares (`sync-catalog`):** Rotina de sincronização idempotente que popula o banco com as obras em alta das principais plataformas (~80 a 120 obras completas com capas reais e templates de URL).

---

## 2. Requisitos de Design e UI/UX (Conformidade com PRODUCT.md e DESIGN.md)

### 2.1 Filosofia Visual (Content-First & Impeccable)
- **A Arte como Protagonista:** Fundo escuro profundo `#090d16` (Dark 950) e superfícies `#0f172a` (Slate 900) com bordas precisas `#1e293b`.
- **Acento Energético Funcional:** Roxo/Índigo sólido `#6366f1` (hover `#4f46e5`, subtle `#1e1b4b`) para ações primárias.
- **Anti-Padrões Proibidos (AI Slop):**
  - PROIBIDO uso de gradientes em texto (`bg-clip-text` com degradê).
  - PROIBIDO botões com gradiente roxo-para-roxo.
  - PROIBIDO bordas decorativas coloridas na lateral de cards (`border-left` acentuado).
  - PROIBIDO glassmorphism arbitrário sem motivo funcional de sobreposição.
- **Acessibilidade (WCAG 2.1 AA):**
  - Contraste de texto $\ge 4.5:1$ em todos os elementos secundários (`#94a3b8` sobre `#0f172a` ou `#090d16`).
  - Áreas de clique e toque mínimas de $44\times 44\text{px}$ para botões e checkboxes móveis.
  - Suporte total a `prefers-reduced-motion: reduce`.
  - Navegação e fechamento via teclado (`Escape`, `Enter`).

---

## 3. Arquitetura da Solução e Componentes

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Web Client (Angular 18)                         │
│  ┌────────────────────────┐      ┌──────────────────────────────────┐  │
│  │ CatalogListComponent   │ ───> │ ImportDialogComponent            │  │
│  │ (Botão "📥 Importar")  │      │ (Seleção, busca, lote, status)   │  │
│  └────────────────────────┘      └──────────────────────────────────┘  │
└────────────────────────────────────┬───────────────────────────────────┘
                                     │ HTTP REST
                                     ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        Go API Gateway (:8080)                          │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ ImportHandler (/api/import/*)                                    │  │
│  └───────────────┬──────────────────────────────────┬───────────────┘  │
│                  ▼                                  ▼                  │
│  ┌───────────────────────────────┐  ┌───────────────────────────────┐  │
│  │ Redis Cache Service           │  │ ProviderRegistry (Go)         │  │
│  │ (TTL 7 dias por busca/página) │  │ • AsuraScans (HTML/goquery)   │  │
│  └───────────────┬───────────────┘  │ • RavenScans (HTML/goquery)   │  │
│                  │                  │ • MangaK (HTML/goquery)       │  │
│                  │                  │ • ManhuaTop (HTML/goquery)    │  │
│                  │                  │ • AllCacheProvider (Agregador)│  │
│                  │                  └───────────────┬───────────────┘  │
│                  ▼                                  │                  │
│  ┌──────────────────────────────────────────────────▼───────────────┐  │
│  │ CanonicalRepository & LibraryService                             │  │
│  │ (UpsertBatch no Postgres + Inserção em user_libraries)           │  │
│  └──────────────────────────────────────────────────┬───────────────┘  │
└─────────────────────────────────────────────────────┼──────────────────┘
                                                      ▼
                            ┌───────────────────────────────────┐
                            │      PostgreSQL 16 (:5432)        │
                            │ • canonical_manhuas               │
                            │ • user_libraries                  │
                            └───────────────────────────────────┘
```

---

## 4. Contratos de API (Endpoints REST)

### 4.1 `GET /api/import/domains`
Retorna a lista de fontes suportadas para navegação e importação.
- **Resposta HTTP 200:**
  ```json
  [
    { "domain": "all", "name": "Todos", "supported": true },
    { "domain": "asurascans.com", "name": "Asura Scans", "supported": true },
    { "domain": "ravenscans.org", "name": "RavenScans", "supported": true },
    { "domain": "mangak.io", "name": "MangaK", "supported": true },
    { "domain": "manhuatop.org", "name": "ManhuaTop", "supported": true }
  ]
  ```

### 4.2 `GET /api/import/browse?domain={domain}&q={query}&page={page}`
Navega ou pesquisa obras em um domínio específico ou no agregador `all`.
- **Query Params:**
  - `domain`: slug do domínio (obrigatório, ex: `asurascans.com` ou `all`).
  - `q`: termo de busca textual (opcional).
  - `page`: número da página (padrão: 1).
- **Lógica de Cache:**
  - Chave Redis: `import:cache:{domain}:{sanitized_q}:{page}` com TTL de 7 dias (`604800s`).
- **Anotação de Existência:**
  - Cruza cada item retornado com o banco local para definir:
    - `alreadyInCatalog`: `true` se já existe em `canonical_manhuas`.
    - `alreadyInLibrary`: `true` se já pertence à biblioteca do usuário autenticado no cabeçalho `Authorization: Bearer <token>`.
- **Resposta HTTP 200:**
  ```json
  {
    "domain": "asurascans.com",
    "page": 1,
    "totalPages": 25,
    "items": [
      {
        "title": "The Extra's Academy Survival Guide",
        "slug": "the-extras-academy-survival-guide",
        "urlTemplate": "https://asurascans.com/comics/the-extras-academy-survival-guide-11fe7da3/chapter/{chapter}",
        "coverUrl": "https://...",
        "lastChapter": 130,
        "primaryDomain": "asurascans.com",
        "alreadyInCatalog": true,
        "alreadyInLibrary": false
      }
    ]
  }
  ```

### 4.3 `POST /api/import`
Importa uma lista de obras selecionadas para o catálogo canônico e para a biblioteca pessoal do usuário autenticado.
- **Autenticação:** Requer token JWT no header `Authorization: Bearer <token>`.
- **Request Body:**
  ```json
  {
    "items": [
      {
        "title": "The Extra's Academy Survival Guide",
        "slug": "the-extras-academy-survival-guide",
        "urlTemplate": "https://asurascans.com/comics/the-extras-academy-survival-guide-11fe7da3/chapter/{chapter}",
        "coverUrl": "https://...",
        "lastChapter": 130,
        "primaryDomain": "asurascans.com",
        "synopsis": "..."
      }
    ]
  }
  ```
- **Processamento:**
  1. Converte itens para `[]*domain.CanonicalManhua`.
  2. Executa `canonicalRepo.UpsertBatch(ctx, manhuas)` (inserção ou atualização no PostgreSQL).
  3. Para cada obra inserida/atualizada, adiciona na biblioteca do usuário via `libraryService.AddToLibrary` com:
     - `current_chapter = 1`
     - `is_favorite = false`
     - Promoção automática de ordenação (RN-03.3).
- **Resposta HTTP 200:**
  ```json
  {
    "status": "ok",
    "importedCount": 1,
    "addedToLibraryCount": 1
  }
  ```

---

## 5. Rotina de Carga Inicial de Catálogo (`sync-catalog`)

Para que o catálogo já possua centenas de obras populares prontas para consumo:
1. **Comando no Makefile:**
   ```bash
   make sync-catalog
   ```
2. **Funcionamento Interno (`cmd/sync-catalog/main.go`):**
   - Conecta ao PostgreSQL e aos scrapers de `asurascans.com`, `ravenscans.org`, `mangak.io` e `manhuatop.org`.
   - Consulta as páginas populares/recentes (páginas 1 e 2 de cada site).
   - Extrai metadados completos (título, capa real, URL template com placeholder `{chapter}`, último capítulo).
   - Realiza `UpsertBatch` com tratamento de conflitos no banco PostgreSQL.
   - Atualiza `last_chapter` de obras existentes sem apagar progresso ou avaliações.

---

## 6. Especificação da Interface Web Angular (`ImportDialogComponent`)

### 6.1 Estrutura e Ergonomia do Componente
- **Backdrop:** Fundo escurecido `#00000080` com `backdrop-blur-sm`.
- **Card Principal:** `#0f172a` (Slate 900), borda `#1e293b` (Slate 800), cantos `rounded-2xl` (16px), sombra difusa `shadow-2xl`. Largura máxima de 720px, altura até 90vh com layout flex vertical.
- **Cabeçalho:**
  - Título editorial limpo em branco (`#ffffff`), peso 700: *"Importar Obras de Plataformas Externas"*.
  - Botão de fechar circular `rounded-full` em `#141c2e` com ícone sutil e foco acessível.
- **Controles de Busca:**
  - Dropdown estilizado em `#141c2e` com borda `#1e293b` para selecionar o domínio.
  - Input de busca com ícone de lupa e ação ao pressionar `Enter`.
- **Barra de Ações em Lote:**
  - Fundo `#141c2e`, borda `#1e293b`, `rounded-xl`.
  - Checkbox nativa acessível para "Selecionar todas as obras desta página".
  - Contador: *"X selecionadas"*.
- **Lista de Obras (Scrollável):**
  - Cada item em cartão `#141c2e` com borda suave `#1e293b/60` e `rounded-xl`.
  - Checkbox grande ($\ge 44\times 44\text{px}$ área de toque).
  - Capa de proporção 3:4 com fallback elegante caso falhe o carregamento.
  - Título em destaque com linha clampada em 2 linhas.
  - Badges semânticos:
    - `Cap. X` em `#6366f1` (Indigo).
    - `Fonte` em `#1e293b` com texto secundário `#94a3b8`.
    - Se `alreadyInLibrary`: badge esmeralda `#10b981` (fundo `#052e16`, borda `#166534`) escrito *"Na sua biblioteca"* e checkbox desabilitada.
    - Se `alreadyInCatalog`: badge azul claro escrito *"No Catálogo"*.
- **Rodapé:**
  - Botão secundário *"Cancelar"*.
  - Botão primário: **`Importar (X)`** em `#6366f1` sólido (hover `#4f46e5`), sem degradês de IA, com indicador de carregamento durante a requisição.

---

## 7. Estratégia de Testes e Validação

1. **Testes Unitários Go (`internal/providers` e `internal/handlers`):**
   - Teste de parsing do provider MangaK / ManhuaTop com mock HTTP.
   - Teste de `ImportHandler` validando cache Redis e injeção de flags `alreadyInLibrary` / `alreadyInCatalog`.
   - Teste do endpoint `POST /api/import` validando persistência dupla (Postgres e Biblioteca).
2. **Testes Unitários Angular (`import-dialog.component.spec.ts`):**
   - Teste de abertura e fechamento do modal.
   - Teste de seleção individual e seleção em lote.
   - Teste de chamada do serviço `importWorks` e feedback visual.
3. **Validação Manual Ponta a Ponta:**
   - Execução do `make sync-catalog` no terminal e verificação no banco PostgreSQL.
   - Abertura da interface Web em `http://localhost:4200/catalog`, clique em "📥 Importar Obras", busca por título, seleção e importação com sucesso.
   - Confirmação de que a obra aparece imediatamente na Biblioteca Pessoal (`/library`) com capítulo 1 e no Catálogo Canônico (`/catalog`).
