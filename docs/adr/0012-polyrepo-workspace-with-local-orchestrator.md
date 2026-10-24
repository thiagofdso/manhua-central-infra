# ADR-0012: Adoção de Workspace Polyrepo com Orquestrador Local e Repositórios Remotos Independentes

## Status
**Aceito** (Substitui e estende a premissa de repositório único do [ADR-0001](0001-monorepo-architecture.md))

## Data
Outubro de 2026

## Contexto
O ecossistema **Manhua Central / Manhua Manager Pro** é composto por camadas com ciclos de vida, linguagens e destinos de publicação profundamente heterogêneos:
1. **Backend Core (`api-gateway`):** Desenvolvido em Go, com container distroless e foco em alta concorrência e estabilidade de API.
2. **Frontend Web (`web-client`):** Aplicação SPA corporativa em Angular 18, com deploy contínuo em nuvem.
3. **Scraping Workers (`scraping-workers`):** Pool em Node.js/Puppeteer para bypass dinâmico de Cloudflare.
4. **Mobile App (`mobile-app`):** Aplicativo Flutter multiplataforma (Android/iOS) direcionado para publicação oficial na Google Play Store.

No modelo de monorepo tradicional em um único repositório remoto:
- O versionamento semântico exigia tags com prefixo e lógica complexa de detecção de escopo para evitar triggers acidentais de CI/CD.
- Qualquer alteração na Web ou documentação podia disparar pipelines mobile ou exigir bumps de versão desnecessários.
- A Google Play Console exige um `versionCode` estritamente incremental a cada upload e possui tempo de revisão humano de dias, incompatível com o ritmo de releases ágeis do frontend web.

## Decisão
Adotar o modelo de **Workspace Polyrepo com Orquestrador Local (Option 1 / Meta-Repo)**:
1. **Orquestrador Central (`manhua-central-infra`):**
   * Repositório central contendo os manifestos de orquestração Docker Compose (`deployments/`), documentação unificada (`docs/`), contratos de API OpenAPI (`packages/contracts/`) e comandos operacionais (`Makefile`).
   * A pasta `apps/` é ignorada no `.gitignore` do orquestrador (`apps/`), permitindo que cada subpasta funcione como um repositório Git autônomo.
2. **Repositórios Remotos Independentes no GitHub (Prefixo `manhua-central-*`):**
   * `thiagofdso/manhua-central-infra`: Infraestrutura, orquestração local e governança técnica.
   * `thiagofdso/manhua-central-api`: Backend Core em Go com pipeline `ci.yml` (testes `-race` e build).
   * `thiagofdso/manhua-central-web`: Frontend Web em Angular 18 com pipeline `ci.yml` (testes unitários e build prod).
   * `thiagofdso/manhua-central-workers`: Pool de Scraping em Node.js com pipeline `ci.yml`.
   * `thiagofdso/manhua-central-mobile`: Mobile em Flutter com pipeline `pr-check.yml` (analyze e test pré-PR).
3. **Estratégia de Branches e Versionamento Semântico:**
   * Cada repositório adota branches `main` (produção) e `desenv` (desenvolvimento).
   * Versionamento SemVer 2.0.0 independente e limpo (`v1.0.0`, `v1.0.1`) em cada repositório remoto.
   * No Flutter, padrão `versionName+versionCode` sincronizado com a Play Console.
4. **Experiência do Desenvolvedor Local Mantida:**
   * Os comandos `make dev`, `make prod`, `make down` e `make clean` permanecem idênticos, utilizando os caminhos relativos em `apps/` sem qualquer overhead.
   * Novos comandos `make clone-all`, `make pull-all` e `make status-all` automatizam o gerenciamento em lote dos repositórios filhos.

## Consequências

### Positivas:
* **Esteiras CI/CD 100% Isoladas:** Cada commit aciona estritamente a esteira correspondente no GitHub Actions, economizando minutos de runner e eliminando falsos positivos.
* **Versionamento Puro e Desacoplado:** Sem poluição de tags; cada projeto mantém seus próprios releases e changelogs.
* **Segurança e Controle de Acesso:** Possibilidade de conceder acesso a desenvolvedores externos apenas no repositório mobile ou frontend sem expor o backend core e scrapers.
* **Zero Atrito no Ambiente Local:** O desenvolvedor continua abrindo uma única janela no VS Code / Antigravity e executando `make dev` para subir todos os containers.

### Negativas / Mitigações:
* **Commits Transversais Exigem Múltiplos Pushes:** Alterações na API que afetam o frontend exigem um commit no repositório da API e outro no do frontend.
  * *Mitigação:* Adoção de contratos de API estáveis e versionados (`packages/contracts/openapi.yaml`), garantindo que o backend sempre forneça retrocompatibilidade antes de o frontend consumir novas propriedades.
