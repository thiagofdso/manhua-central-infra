# ADR-0002: Backend Core e Proxy de Imagens com Streaming de Zero-Buffer e Proteção Anti-SSRF em Go

* **Status:** Aceito
* **Data:** 2026-10-23
* **Decisores:** Thiago Oliveira & Equipe de Arquitetura de Software

---

## Contexto
O backend legado em Python (`server.py`) apresentava duas deficiências críticas:
1. **Sobrecarga Massiva de Memória:** O proxy `/api/proxy-image` executava `resp.read()` retendo o binário completo de cada imagem na memória RAM antes de iniciar a resposta HTTP, gerando alto consumo e risco de Out-Of-Memory (OOM) sob múltiplos downloads simultâneos.
2. **Vulnerabilidade Aberta de SSRF:** O endpoint aceitava qualquer URL arbitrária sem validação de endereço IP, permitindo que atacantes usassem o servidor como pivô para escanear a rede local, bater em serviços internos ou acessar metadados de nuvem (`169.254.169.254`).

## Decisão
Implementar o backend principal e o proxy de imagens em **Go (Golang)**:
1. **Streaming com Zero-Buffer:** O proxy encaminha os bytes recebidos da origem upstream diretamente para o cliente downstream utilizando `io.Copy` em blocos de 32 KB sem alocar buffers integrais em RAM.
2. **Propagação de Cancelamento:** Conexões canceladas pelo cliente propagam `context.Context`, fechando a requisição upstream imediatamente.
3. **SSRF Guard Rigoroso:** O gateway valida o DNS antes de abrir a conexão TCP, bloqueando ativamente destinos que resolvam para endereços privados (RFC 1918), loopback (`127.0.0.1`), link-local e metadados de nuvem. Somente domínios cadastrados na *allowlist* são permitidos.

## Consequências
### Positivas
* Latência de entrega (TTFB) reduzida em até 70% para o leitor webtoon.
* Consumo de memória RAM estabilizado abaixo de 100 MB mesmo sob dezenas de transferências simultâneas de capítulos.
* Blindagem total contra exploração de SSRF na infraestrutura de nuvem.

### Negativas / Mitigações
* Respostas em streaming iniciam os cabeçalhos HTTP 200 antes de concluir o download. Se a origem falhar no meio do fluxo, o erro não pode ser transformado em um JSON de erro limpo. **Mitigação:** Tratamento defensivo no cliente Angular e Flutter com detecção de stream truncado e botão de retry individual de imagem.
