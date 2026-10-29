# Makefile `stop` Command Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adicionar o target `stop` no `Makefile` raiz para derrubar todos os contêineres e redes da aplicação via Docker Compose preservando volumes persistentes.

**Architecture:** Adição do target `stop` no `Makefile` apontando para `deployments/docker-compose.yml down`, atualização de `.PHONY` e autodocumentação no `make help`.

**Tech Stack:** GNU Make, Docker Compose v2.

## Global Constraints

- Preservar a sintaxe padrão de Makefiles (tabs obrigatórios para comandos sob alvos).
- Manter o formato de documentação `## Descrição` compatível com o parser awk do target `help`.
- Garantir que `.PHONY` contenha todos os comandos virtuais.

---

### Task 1: Adicionar target `stop` e ajustar `.PHONY` no Makefile

**Files:**
- Modify: `Makefile:1-55`

**Interfaces:**
- Consumes: Arquivo `deployments/docker-compose.yml`
- Produces: Target `stop` executável via `make stop`

- [ ] **Step 1: Verificar que o comando `make -n stop` atualmente falha**

Run:
```bash
make -n stop
```
Expected output:
`make: *** No rule to make target 'stop'.  Stop.`

- [ ] **Step 2: Modificar o `Makefile`**

1. Adicionar `stop` na linha `.PHONY`:
```makefile
.PHONY: all run stop dev dev-d prod down down-prod clean test test-backend test-workers test-web test-mobile dev-db lint help clone-all pull-all status-all sync-catalog
```

2. Adicionar o target `stop` logo após o target `run`:
```makefile
stop: ## Encerra e remove todos os contêineres e redes de desenvolvimento
	docker compose -f deployments/docker-compose.yml down
```

- [ ] **Step 3: Verificar sintaxe e execução simulada (`dry-run`)**

Run:
```bash
make -n stop
```
Expected output:
`docker compose -f deployments/docker-compose.yml down`

Run:
```bash
make help | grep stop
```
Expected output:
Linha exibindo `stop` e a descrição `Encerra e remove todos os contêineres e redes de desenvolvimento`.

- [ ] **Step 4: Commitar as alterações**

Run:
```bash
git add Makefile
git commit -m "feat(infra): add make stop command to teardown all dev containers"
```
