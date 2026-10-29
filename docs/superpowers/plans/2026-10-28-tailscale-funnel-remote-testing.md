# Tailscale Funnel Remote Testing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Configurar a automação no `Makefile` e atualizar o guia `docs/remote-testing-guide.md` para testes remotos do app mobile via Tailscale Funnel com terminação HTTPS na porta 8080.

**Architecture:** Comandos operacionais Make para ativar/desativar o Funnel, rodar e compilar o app mobile com `API_BASE_URL=https://pop-os.tail75c396.ts.net`, e documentação técnica atualizada.

**Tech Stack:** GNU Make, Tailscale CLI, Flutter SDK, Markdown.

## Global Constraints

- Preservar a sintaxe padrão de Makefiles (tabs obrigatórios para comandos sob alvos).
- Manter o formato de documentação `## Descrição` compatível com o parser awk do target `help`.
- Garantir que `.PHONY` contenha todos os comandos virtuais.

---

### Task 1: Adicionar comandos do Tailscale Funnel e Mobile no Makefile

**Files:**
- Modify: `Makefile`

**Interfaces:**
- Consumes: Tailscale CLI e Flutter CLI
- Produces: Comandos `make funnel`, `make funnel-status`, `make funnel-off`, `make run-mobile-funnel`, `make build-apk-funnel`

- [x] **Step 1: Verificar que `make -n funnel` falha atualmente**

Run:
```bash
make -n funnel
```
Expected output:
`make: *** No rule to make target 'funnel'.  Stop.`

- [x] **Step 2: Adicionar os novos targets no `Makefile`**

1. Adicionar `funnel`, `funnel-status`, `funnel-off`, `run-mobile-funnel`, `build-apk-funnel` ao `.PHONY`.
2. Adicionar a seção `Testes Remotos e Tailscale Funnel`:
```makefile
## ----------------------------------------------------------------------
## Testes Remotos e Tailscale Funnel
## ----------------------------------------------------------------------

funnel: ## Inicia o Tailscale Funnel expondo a API Gateway (porta 8080) com HTTPS público
	tailscale funnel --bg 8080

funnel-status: ## Exibe o status e a URL pública HTTPS do Tailscale Funnel
	tailscale funnel status

funnel-off: ## Encerra a exposição pública do Tailscale Funnel
	tailscale funnel reset

run-mobile-funnel: ## Executa o app Flutter apontando para a API pública HTTPS do Tailscale Funnel
	cd apps/mobile-app && flutter run --dart-define=API_BASE_URL=https://pop-os.tail75c396.ts.net

build-apk-funnel: ## Gera APK release do Flutter configurado com a API pública do Funnel
	cd apps/mobile-app && flutter build apk --release --dart-define=API_BASE_URL=https://pop-os.tail75c396.ts.net
```

- [x] **Step 3: Testar dry-run e help dos novos comandos**

Run:
```bash
make -n funnel && make -n run-mobile-funnel && make -n build-apk-funnel
make help | grep funnel
```
Expected output:
Comandos exibem os comandos esperados e `make help` lista todas as ações com descrição.

- [x] **Step 4: Commitar as alterações no Makefile**

Run:
```bash
git add Makefile
git commit -m "feat(infra): add tailscale funnel and mobile testing commands to Makefile"
```

---

### Task 2: Atualizar documentação em `docs/remote-testing-guide.md`

**Files:**
- Modify: `docs/remote-testing-guide.md`

**Interfaces:**
- Consumes: Arquivo de documentação existente
- Produces: Documentação revisada com a porta correta `:8080`, comandos Make e URL pública oficial

- [x] **Step 1: Atualizar `docs/remote-testing-guide.md`**

1. Substituir todas as referências à porta legada `:5000` pela porta real `:8080`.
2. Incluir a instrução `sudo tailscale set --operator=$$USER` para evitar necessidade de sudo no CLI do Tailscale.
3. Atualizar a seção 2.3 com os atalhos `make funnel`, `make run-mobile-funnel` e `make build-apk-funnel`.
4. Atualizar a tabela de mapeamento de portas na Seção 5.

- [x] **Step 2: Commitar as alterações na documentação**

Run:
```bash
git add docs/remote-testing-guide.md
git commit -m "docs: update remote testing guide with port 8080 and make funnel commands"
```
