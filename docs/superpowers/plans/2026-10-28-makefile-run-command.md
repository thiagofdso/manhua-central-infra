# Makefile `run` Command Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adicionar o target `run` no `Makefile` raiz para subir todos os contêineres e serviços da aplicação em segundo plano (detached) via Docker Compose, além de corrigir linha acidental em `sync-catalog`.

**Architecture:** Atualização da especificação do `Makefile` raiz do repositório, incluindo o target `run` apontando para `deployments/docker-compose.yml` com as flags `-d --build`, registro no `.PHONY`, suporte a autodocumentação no `make help` e remoção da linha residual em `sync-catalog`.

**Tech Stack:** GNU Make, Docker Compose v2.

## Global Constraints

- Preservar a sintaxe padrão de Makefiles (tabs obrigatórios para comandos sob alvos).
- Manter o formato de documentação `## Descrição` compatível com o parser awk do target `help`.
- Garantir que `.PHONY` contenha todos os comandos virtuais.

---

### Task 1: Adicionar target `run` e ajustar `.PHONY` e `sync-catalog` no Makefile

**Files:**
- Modify: `Makefile:1-66`

**Interfaces:**
- Consumes: Arquivo `deployments/docker-compose.yml`
- Produces: Target `run` executável via `make run`

- [x] **Step 1: Verificar que o comando `make -n run` atualmente falha**

Run:
```bash
make -n run
```
Expected output:
`make: *** No rule to make target 'run'.  Stop.`

- [x] **Step 2: Modificar o `Makefile`**

1. Adicionar `run` e `sync-catalog` na linha `.PHONY`:
```makefile
.PHONY: all run dev dev-d prod down down-prod clean test test-backend test-workers test-web test-mobile dev-db lint help clone-all pull-all status-all sync-catalog
```

2. Adicionar o target `run` logo após o comentário `## Ambientes e Orquestração Docker Compose`:
```makefile
run: ## Inicia todos os serviços em segundo plano (detached) com Docker Compose
	docker compose -f deployments/docker-compose.yml up -d --build
```

3. Remover a linha `docker compose -f deployments/docker-compose.prod.yml down -v` acidental dentro do target `sync-catalog`.

- [x] **Step 3: Verificar sintaxe e execução simulada (`dry-run`)**

Run:
```bash
make -n run
```
Expected output:
`docker compose -f deployments/docker-compose.yml up -d --build`

Run:
```bash
make help | grep run
```
Expected output:
Linha exibindo `run` e a descrição `Inicia todos os serviços em segundo plano (detached) com Docker Compose`.

- [x] **Step 4: Commitar as alterações**

Run:
```bash
git add Makefile
git commit -m "feat(infra): add make run command to start all services in detached mode"
```
