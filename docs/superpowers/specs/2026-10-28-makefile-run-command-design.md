# Design Spec: Comando `make run` no Makefile

- **Data:** 2026-10-28
- **Status:** Aprovado
- **Escopo:** Adição do comando `run` no `Makefile` raiz para orquestração de todos os serviços locais.

## 1. Contexto e Motivação

O projeto Manhua Manager Pro é composto por múltiplos serviços integrados via Docker Compose sob `deployments/docker-compose.yml` (`postgres`, `redis`, `api-gateway`, `scraping-workers`, `web-client`). Atualmente, o `Makefile` contém comandos como `make dev` (modo foreground) e `make dev-d` (modo background), mas para conveniência e conformidade com o fluxo de trabalho do usuário, é necessário fornecer o comando padrão `make run` que inicia todos os serviços em segundo plano (*detached* com *rebuild*).

## 2. Requisitos e Escopo

1. **Adição do target `run`:**
   - Comando: `make run`
   - Comportamento: Executar `docker compose -f deployments/docker-compose.yml up -d --build`
   - Auto-documentação: Exibir no output de `make help`.
2. **Atualização de `.PHONY`:**
   - Adicionar `run` aos alvos `.PHONY` para garantir execução consistente independentemente de arquivos no filesystem.
3. **Limpeza de Linha Residual:**
   - Remover comando acidental `docker compose -f deployments/docker-compose.prod.yml down -v` presente sob o target `sync-catalog`.

## 3. Detalhes de Implementação

### 3.1 Alterações no `Makefile`

```makefile
.PHONY: all run dev dev-d prod down clean test test-backend test-workers test-web test-mobile dev-db lint help clone-all pull-all status-all sync-catalog

...

run: ## Inicia todos os serviços em segundo plano (detached) com Docker Compose
	docker compose -f deployments/docker-compose.yml up -d --build
```

## 4. Verificação e Critérios de Aceite

- Execução de `make help` lista `run` com descrição correta.
- Sintaxe do Makefile válida (`make -n run` não gera erros de sintaxe e exibe o comando planejado).
