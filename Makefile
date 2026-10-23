.PHONY: all dev prod down clean test test-backend test-workers test-web test-mobile dev-db lint help

# Default target
all: help

## ----------------------------------------------------------------------
## Ambientes e Orquestração Docker Compose
## ----------------------------------------------------------------------

dev: ## Inicia o ambiente de desenvolvimento completo com Docker Compose
	docker compose -f deployments/docker-compose.yml up --build

dev-d: ## Inicia o ambiente de desenvolvimento em segundo plano (detached)
	docker compose -f deployments/docker-compose.yml up -d --build

dev-db: ## Inicia apenas os serviços de infraestrutura (PostgreSQL e Redis) para dev local
	docker compose -f deployments/docker-compose.yml up -d postgres redis

prod: ## Inicia o ambiente de produção Cloud-Native otimizado
	docker compose -f deployments/docker-compose.prod.yml up -d --build

down: ## Encerra todos os contêineres e redes de desenvolvimento
	docker compose -f deployments/docker-compose.yml down

down-prod: ## Encerra os contêineres e redes de produção
	docker compose -f deployments/docker-compose.prod.yml down

clean: ## Remove todos os contêineres, redes e volumes persistentes locais
	docker compose -f deployments/docker-compose.yml down -v
	docker compose -f deployments/docker-compose.prod.yml down -v

## ----------------------------------------------------------------------
## Suítes de Testes por Camada
## ----------------------------------------------------------------------

test: test-backend test-workers test-web ## Executa todos os testes automatizados da plataforma

test-backend: ## Executa testes unitários e de integração no Backend Go com verificação de race conditions
	@if [ -d "apps/api-gateway" ]; then \
		cd apps/api-gateway && go test -race ./...; \
	fi

test-workers: ## Executa testes no pool de Scraping Workers (Node/TypeScript)
	@if [ -d "apps/scraping-workers" ] && [ -f "apps/scraping-workers/package.json" ]; then \
		cd apps/scraping-workers && npm test; \
	fi

test-web: ## Executa testes unitários no Frontend Web (Angular 18+)
	@if [ -d "apps/web-client" ] && [ -f "apps/web-client/package.json" ]; then \
		cd apps/web-client && npm test -- --watch=false --browsers=ChromeHeadless; \
	fi

test-mobile: ## Executa testes unitários e de cobertura no Mobile App (Flutter)
	@if [ -d "apps/mobile-app" ] && [ -f "apps/mobile-app/pubspec.yaml" ]; then \
		cd apps/mobile-app && flutter test --coverage; \
	fi

## ----------------------------------------------------------------------
## Qualidade e Linter
## ----------------------------------------------------------------------

lint: ## Executa verificações estáticas de código (Linters)
	@if [ -d "apps/api-gateway" ]; then \
		cd apps/api-gateway && go vet ./...; \
	fi

## ----------------------------------------------------------------------
## Ajuda
## ----------------------------------------------------------------------

help: ## Exibe esta mensagem de ajuda com os comandos disponíveis
	@echo "Manhua Manager Pro — Automação de Comandos Operacionais"
	@echo "--------------------------------------------------------"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-18s\033[0m %s\n", $$1, $$2}'
