# ADR-0003: Worker Pool Desacoplado em Node.js/Puppeteer para Contorno de Cloudflare e Polyfills

* **Status:** Aceito
* **Data:** 2026-10-23
* **Decisores:** Thiago Oliveira & Equipe de Arquitetura de Software

---

## Contexto
Determinados provedores de mangá (ex: MangaFire, Comix e ManhuaUS) utilizam mecanismos agressivos de proteção:
* Desafios anti-bot Cloudflare Turnstile / WAF;
* Renderização pesada via canvas / client-side rendering (SPA);
* Criptografia dinâmica em tempo de execução via scripts polyfills JS proprietários (`window.__config`, `window.__build`, `globalThis.dynamicEncrypt`).

No protótipo legado, subprocessos avulsos chamando Node/Brave eram disparados para cada requisição, abrindo e fechando o browser do zero e compartilhando o mesmo diretório de perfil, causando contenção de disco e travamentos.

## Decisão
Criar um microsserviço isolado de **Worker Pool em Node.js (TypeScript)** utilizando Puppeteer / Chromium headless:
1. **Desacoplamento da API Core:** A API em Go comunica-se com o worker via gRPC ou Unix Domain Socket / HTTP interno.
2. **Context Pooling Persistente:** O navegador permanece aberto como um processo daemon; para cada extração, cria-se um contexto isolado (`browser.newContext()`), reaproveitando o processo base e reduzindo o tempo de inicialização de 4s para menos de 300ms.
3. **Gerenciamento de Zombies com `dumb-init`:** O contêiner do worker executa sob `dumb-init` para recolher adequadamente processos filhos do Chromium terminados.

## Consequências
### Positivas
* Go permanece leve e seguro, sem a necessidade de embutir V8 ou drivers complexos de automação de navegador.
* Reutilização de instâncias do Chromium acelera as extrações dinâmicas em mais de 10x.
* Isolamento de falhas: se um script Puppeteer travar ou sofrer timeout, a API principal continua respondendo normalmente.

### Negativas / Mitigações
* Navegadores headless consomem volumes consideráveis de CPU e RAM. **Mitigação:** Definição de limites estritos no Docker (`deploy.resources.limits`) e fila com semáforo controlando no máximo 5 navegadores concorrentes.
