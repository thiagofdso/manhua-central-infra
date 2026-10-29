# Design Spec: Configuração de Testes Móveis via Tailscale Funnel (HTTPS Público)

- **Data:** 2026-10-28
- **Status:** Aprovado
- **Escopo:** Integração e comandos operacionais para testes remotos no aplicativo móvel Flutter utilizando Tailscale Funnel com HTTPS automático do Let's Encrypt.

## 1. Contexto e Motivação

Para testar o aplicativo **Manhua Central Mobile** em dispositivos físicos (Android/iOS) sob redes celulares (4G/5G) ou compartilhar builds `.apk` com testadores sem exigir que estes instalem VPN ou possuam IP público dedicado (bypassing CGNAT), utiliza-se o **Tailscale Funnel**.
O túnel expõe a porta `8080` (API Gateway Go) sob a terminação HTTPS oficial `https://pop-os.tail75c396.ts.net`.
Por possuir certificado TLS válido emitido pela autoridade certificadora Let's Encrypt, o Android aceita as conexões nativamente sem necessidade de `usesCleartextTraffic="true"`, mantendo estrita conformidade com as diretrizes da Google Play Store.

## 2. Requisitos e Escopo

1. **Automação no Makefile Raiz:**
   - `make funnel`: Ativa a exposição pública da porta `:8080` em segundo plano (`tailscale funnel --bg 8080`).
   - `make funnel-status`: Exibe a URL e o status da conexão ativa (`tailscale funnel status`).
   - `make funnel-off`: Encerra a exposição pública com segurança (`tailscale funnel reset`).
   - `make run-mobile-funnel`: Executa o app Flutter passando a URL HTTPS da Tailnet via `--dart-define=API_BASE_URL=https://pop-os.tail75c396.ts.net`.
   - `make build-apk-funnel`: Compila o `.apk` release do Flutter configurado com a URL HTTPS pública.
2. **Atualização da Documentação (`docs/remote-testing-guide.md`):**
   - Atualizar a porta padrão da API de `:5000` (antiga/legada) para `:8080` (porta real do Compose e do Gateway Go).
   - Documentar os comandos Makefile dedicados e o fluxo com a URL canônica `https://pop-os.tail75c396.ts.net`.
   - Incluir a instrução de permissão de operador (`sudo tailscale set --operator=$USER`) para dispensar `sudo` no dia a dia.
3. **Compatibilidade de Código Móvel:**
   - O app Flutter (`apps/mobile-app/lib/main.dart`) já consome `String.fromEnvironment('API_BASE_URL')`.
   - `usesCleartextTraffic="false"` é preservado no `AndroidManifest.xml` porque HTTPS Let's Encrypt é tráfego criptografado padrão.

## 3. Verificação e Critérios de Aceite

- `make help` lista todos os novos comandos `funnel`, `funnel-status`, `funnel-off`, `run-mobile-funnel` e `build-apk-funnel`.
- `make -n funnel` e `make -n run-mobile-funnel` exibem os comandos esperados sem erros.
- `docs/remote-testing-guide.md` contém o mapeamento de portas correto (`:8080`) e os exemplos atualizados.
