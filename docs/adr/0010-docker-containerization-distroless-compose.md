# ADR-0010: Containerização Total com Docker Multi-Estágio, Imagens Distroless e Docker Compose

* **Status:** Aceito
* **Data:** 2026-10-23
* **Decisores:** Thiago Oliveira & Equipe de Arquitetura de Software

---

## Contexto
O protótipo legado dependia de instalação manual de pacotes Python (`pip`), navegadores locais (Brave), scripts Xvfb no sistema operacional host e inicialização de processos soltos. Essa abordagem dificultava o deploy em servidores de nuvem, criava incompatibilidades entre máquinas de desenvolvimento e impedia o escalonamento horizontal dos componentes.

## Decisão
Containerizar integralmente todo o ecossistema do Manhua Manager Pro utilizando **Docker**:
1. **Multi-Stage Builds com Distroless no Go:**
   * O backend Go é compilado estaticamente em imagem builder e empacotado na imagem final minimalista **`gcr.io/distroless/static-debian12:nonroot`**.
   * A imagem final possui menos de 25 MB, não contém shell, gerenciador de pacotes ou utilitários desnecessários e roda como usuário sem privilégios (`nonroot:nonroot`).
2. **Workers Node.js Isolados com `dumb-init`:**
   * Os workers de automação de browser rodam em contêiner Debian-slim com Chromium e `dumb-init` como PID 1 para colher processos zumbis.
3. **Frontend Angular com Nginx Alpine:**
   * A SPA é compilada em contêiner Node e servida por um contêiner ultra-leve `nginx:alpine` com compressão e headers de segurança.
4. **Padronização com Docker Compose:**
   * `deployments/docker-compose.yml`: Ambiente de desenvolvimento com live-reloading.
   * `deployments/docker-compose.prod.yml`: Ambiente de produção com segregação de redes (`public_net` e `internal_net`), limites de hardware (CPU/RAM) e healthchecks automáticos.

## Consequências
### Positivas
* Paridade completa e reprodutibilidade: o ambiente roda com exatidão idêntica em qualquer nuvem, VPS ou máquina local.
* Segurança reforçada: imagens distroless e non-root reduzem em mais de 90% as vulnerabilidades apontadas por scanners como Trivy.
* Implantação e orquestração simplificadas a um único comando `docker compose up -d`.

### Negativas / Mitigações
* Exige que os desenvolvedores tenham o Docker Engine / Docker Desktop instalado localmente. **Mitigação:** Documentação clara no README com instruções de setup rápido.
