# Design Spec: Comando `make stop` no Makefile

- **Data:** 2026-10-28
- **Status:** Aprovado
- **Escopo:** Adição do comando `stop` no `Makefile` raiz para derrubar todos os contêineres e redes da aplicação preservando volumes persistentes.

## 1. Contexto e Motivação

Com a introdução do comando `make run` para iniciar os contêineres e microsserviços via Docker Compose, faz-se necessário um comando simétrico e intuitivo `make stop` para encerrar e derrubar a infraestrutura (`docker compose down`). O comando deve remover os contêineres e redes criadas, mas manter os volumes persistentes (`postgres_data_dev` e `redis_data_dev`) intactos para que o progresso de dados locais não seja perdido.

## 2. Requisitos e Escopo

1. **Adição do target `stop`:**
   - Comando: `make stop`
   - Comportamento: Executar `docker compose -f deployments/docker-compose.yml down`
   - Auto-documentação: Exibir no output de `make help`.
2. **Atualização de `.PHONY`:**
   - Adicionar `stop` aos alvos `.PHONY`.
3. **Compatibilidade:**
   - Manter `down` intacto como comando suportado.

## 3. Detalhes de Implementação

### 3.1 Alterações no `Makefile`

```makefile
.PHONY: all run stop dev dev-d prod down down-prod clean test test-backend test-workers test-web test-mobile dev-db lint help clone-all pull-all status-all sync-catalog

...

stop: ## Encerra e remove todos os contêineres e redes de desenvolvimento
	docker compose -f deployments/docker-compose.yml down
```

## 4. Verificação e Critérios de Aceite

- Execução de `make help` lista `stop` com a respectiva descrição.
- Execução simulada `make -n stop` exibe `docker compose -f deployments/docker-compose.yml down` com código de retorno 0.
