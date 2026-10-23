# ADR-0001: Adoção de Monorepositório para o Ecossistema Completo

* **Status:** Aceito
* **Data:** 2026-10-23
* **Decisores:** Thiago Oliveira & Equipe de Arquitetura de Software

---

## Contexto
O protótipo legado do Manhua Manager concentrava código de backend em Flask, um arquivo HTML de mais de 2.000 linhas, scripts soltos em Node.js e uma pasta `mobile_app` com Flutter na mesma raiz sem separação clara de dependências, contratos ou esteiras de integração contínua. Para transformar o projeto em uma plataforma comercial moderna (Web + Android Play Store + Backend na Nuvem), era necessário decidir entre gerenciar múltiplos repositórios separados (Polyrepo) ou unificar todo o ciclo de vida do software em um **Monorepositório**.

## Decisão
Decidimos adotar uma arquitetura de **Monorepositório** estruturada em:
* `apps/api-gateway`: Backend principal em Go.
* `apps/scraping-workers`: Pool de extração avançada em Node.js.
* `apps/web-client`: Frontend Web SPA corporativo em Angular 18+.
* `apps/mobile-app`: Aplicativo móvel multiplataforma em Flutter 3.x.
* `packages/contracts`: Especificações OpenAPI 3.1 compartilhadas.
* `deployments/`: Dockerfiles e manifests Docker Compose unificados.

## Consequências
### Positivas
* **Contratos Centralizados:** Modificações nos contratos da API (OpenAPI) geram tipos TypeScript para a Web e modelos Dart para o Flutter instantaneamente no mesmo commit.
* **Esteira de CI/CD Única:** Um único pipeline no GitHub Actions valida todo o sistema, evitando que versões incompatíveis de clientes e servidor sejam publicadas.
* **Refatoração Atômica:** Mudanças estruturais entre o Go API Gateway e os Scraping Workers ocorrem de forma coordenada e testada em conjunto.

### Negativas / Mitigações
* A esteira de CI pode se tornar lenta se recompilar todo o repositório a cada commit. **Mitigação:** Utilização de cache agressivo do GitHub Actions (`type=gha`), Docker Buildx e filtros de path para disparar apenas os jobs correspondentes às pastas alteradas em Pull Requests.
