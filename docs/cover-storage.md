# Capas persistentes de ManhuaUS e RavenScans

Implementação da [ADR-0014](adr/0014-catalog-first-search-and-persistent-cover-files.md). O fluxo está habilitado exclusivamente para `manhuaus.com` e `ravenscans.org`. Os demais provedores continuam usando sua importação existente.

## Funcionamento

Ao buscar um dos dois domínios, a API entrega os resultados locais e agenda uma consulta deduplicada em `catalog_discovery_queries`. Uma consulta já sincronizada é reutilizada por um dia; após esse prazo, seus dados continuam disponíveis durante a atualização. Consultas inéditas podem inicialmente retornar uma lista vazia com `syncing: true`; a interface atualiza os resultados automaticamente.

As obras descobertas entram no catálogo compartilhado, sem inclusão automática na biblioteca pessoal. A identificação usa domínio e URL da fonte. Uma fonte nova recebe um slug com sufixo derivado dessa identidade, evitando unir obras de provedores diferentes apenas pelo título.

O total de páginas conhecido para o mesmo domínio e consulta é preservado em todos os estados, inclusive quando uma página concluída traz metadados de paginação incompletos. A quantidade de páginas disponíveis no banco ou no cache parcial não substitui esse total. Páginas ou consultas ausentes no cache são coletadas pelo endpoint interno `/collect-catalog`, reutilizando a sessão e a fila serial do navegador. Somente as páginas consultadas são coletadas.

`catalog_sources` registra a origem, as tentativas, o erro mais recente e os metadados da capa. Existe um consumidor de descoberta e um consumidor de capas por instância da API. As tarefas são reivindicadas com bloqueio no banco e prazo de recuperação; reinícios não descartam a fila. Falhas têm novas tentativas com intervalo crescente, até aproximadamente 17 horas. Para manter esses limites globais, a implantação inicial deve executar uma única instância da API.

As capas da página aberta recebem prioridade por `last_requested_at`, sem aumentar a concorrência. O acesso à página atualiza essa prioridade no máximo uma vez a cada dez segundos por obra e respeita o intervalo de retentativa de falhas. Enquanto o download estiver pendente, a API de importação informa `coverState` e não publica uma URL externa; o catálogo canônico só recebe a URL local depois da gravação completa. Isso evita que o navegador tente acessar diretamente a fonte protegida ou dispare o proxy comum a cada atualização da lista.

O download usa primeiro o proxy com proteção SSRF. Quando necessário, solicita `/collect-cover` ao worker, que usa Chrome em headless, perfil persistente por domínio e a mesma sessão para ler a página e baixar a imagem. O navegador é iniciado sob demanda e fechado após um minuto ocioso. O coletor não clica em desafios de verificação; uma verificação que exija intervenção continuará registrada como falha até que o acesso seja restabelecido.

Arquivos são gravados temporariamente, limitados por tamanho, identificados pelo conteúdo e publicados por renomeação atômica. HTML de verificações não é aceito como capa. Os formatos iniciais são JPEG, PNG, WebP e GIF. O banco armazena chave relativa, SHA-256, tipo, tamanho, origem e data. A URL pública é `/api/media/covers/<prefixo>/<hash>.<extensão>` e funciona pelo proxy web existente.

## Volumes e configuração

### Coletor no host

Para ManhuaUS e RavenScans, o catálogo e as capas podem usar um serviço local separado do worker Docker. Instale-o a partir de uma sessão gráfica Linux com Node, dependências do worker e Chrome disponíveis:

```sh
make collector-install
make run
make collector-status
journalctl --user -u manhua-catalog-collector.service -f
```

O instalador usa o Chrome 150 previamente instalado no cache Puppeteer; `COVER_BROWSER_EXECUTABLE=/caminho/chrome make collector-install` permite escolher outro executável. A API usa `CATALOG_COLLECTOR_URL` e `CATALOG_COLLECTOR_TOKEN`, configurados nos arquivos `.env` locais da raiz e de `deployments`. O endpoint usa a porta 50052, exige o token e aceita somente catálogo/capas dos dois domínios. Os outros provedores e a leitura de capítulos continuam no worker existente.

O serviço `systemd --user` usa Chrome gráfico, com perfis dedicados em `~/.local/share/manhua-manager/collector-profiles`. Quando aparecer uma verificação, o usuário deve concluí-la nessa janela; no modo local o coletor aguarda até dez minutos e não clica no desafio. A requisição da API pode expirar antes disso, mas a sessão validada fica disponível para a próxima tentativa. O funcionamento exige a sessão gráfica do usuário; não é um serviço independente do login.

O arquivo `~/.config/manhua-manager/collector.env` contém a configuração e o token, com acesso restrito ao usuário. As consultas compartilham uma fila serial com intervalo mínimo de três segundos entre navegações de origem. Os arquivos de capa continuam sendo gravados pela API no volume Docker. Mover o navegador para o host não garante que a origem deixará de exigir validações.

Para interromper o coletor, use `systemctl --user stop manhua-catalog-collector.service`. Não há fallback automático para o navegador no contêiner quando o endereço local está configurado: falhas permanecem na fila com retentativa. Para voltar ao modo anterior, configure `CATALOG_COLLECTOR_URL=http://scraping-workers:50051`, remova o token nos `.env` e recrie a API.

| Recurso | Desenvolvimento | Produção | Caminho interno |
| --- | --- | --- | --- |
| Arquivos das capas | `covers_data_dev` | `covers_data` | `/data/covers` |
| Perfis do navegador | `cover_profiles_dev` | `cover_profiles` | `/data/cover-profiles` |

Os nomes efetivos dos volumes incluem o prefixo do projeto Compose. As imagens Docker inicializam os diretórios com permissões para seus usuários sem privilégios.

`COVERS_MAX_BYTES` controla o limite por capa, entre 1024 e 8388608 bytes (padrão: 8 MiB). `COVERS_DIR` e `COVER_PROFILES_DIR` configuram os caminhos internos quando a API e o worker são executados fora do Compose. Alterações nesses caminhos no Compose precisam ser acompanhadas dos pontos de montagem correspondentes.

O coletor de capas usa Chrome for Testing `150.0.7871.24`, versão validada nos testes locais e no contêiner. O argumento de build `COVER_CHROME_VERSION` permite trocar essa versão, mas os perfis precisam ser revalidados após a troca. `COVER_BROWSER_EXECUTABLE` configura o executável; o navegador dos outros extratores permanece o Chromium fornecido pelo Puppeteer. Em headless, o User-Agent conserva a versão real do Chrome, substituindo somente o token `HeadlessChrome`. Os logs informam a versão iniciada e distinguem bloqueios de conteúdo de falhas de inicialização.

O worker executa sem Xvfb por padrão. `COVER_BROWSER_HEADLESS=false` ativa o modo gráfico com tela virtual para diagnóstico.

O volume de perfis pode conter cookies de sessão. Deve permanecer restrito ao worker e não é servido pela API nem incluído em respostas de descoberta.

O hostname do worker é estável (`manhua-workers`) e seu encerramento fecha os navegadores antes de sair, liberando as travas dos perfis. Em volumes criados antes dessa configuração, uma trava pode mencionar o hostname de um contêiner já removido. Remova somente `SingletonLock`, `SingletonCookie` e `SingletonSocket` do perfil afetado após parar o worker e confirmar que nenhuma outra instância usa esse volume; não apague o perfil nem remova travas de um navegador ativo.

## Inicialização das sessões

Os testes mostraram que perfis novos podem ser bloqueados mesmo com ferramentas stealth. A sessão deve ser validada antes de depender da coleta headless. Neste ambiente, o navegador local usava IPv6 e o contêiner usava IPv4; uma sessão do ManhuaUS validada localmente em IPv4 também autorizou o download em headless dentro do contêiner. Isso não garante reutilização em outra máquina ou rede.

O script de preparação usa modo gráfico, preserva a versão do navegador e resolve os domínios testados em IPv4, para reproduzir a rota da implantação atual:

```sh
cd apps/scraping-workers
xvfb-run -a node scripts/prepare-cover-profile.mjs manhuaus.com /caminho/chrome /tmp/manhuaus-cover-profile
xvfb-run -a node scripts/prepare-cover-profile.mjs ravenscans.org /caminho/chrome /tmp/ravenscans-cover-profile
```

Use perfis dedicados a esses sites, sem reutilizar o perfil pessoal do navegador. O script verifica o download de uma capa e não imprime cookies. Se a validação exigir interação, execute sem `xvfb-run` em um desktop e conclua a verificação no navegador aberto.

Se o bloqueio ocorrer especificamente numa listagem, informe sua URL como quarto argumento, por exemplo `https://manhuaus.com/manga/page/3/`. Validar apenas a página de uma obra não garante acesso às rotas de catálogo; confira também uma página posterior antes de importar o perfil.

Depois de encerrar o navegador e parar o worker, copie cada perfil validado para o subdiretório correspondente no volume (`manhuaus.com` ou `ravenscans.org`), preservando um backup do perfil anterior. Exclua da cópia apenas `SingletonLock`, `SingletonCookie`, `SingletonSocket` e `DevToolsActivePort`; mantenha os arquivos de cookies e estado do navegador, com permissões para o UID 1000 do worker. Reinicie o serviço e verifique `/collect-cover` e o estado das tarefas no banco.

A validade de uma sessão pode mudar ou expirar. Se isso ocorrer, os arquivos já baixados continuam disponíveis e as novas coletas entram em retentativa; pode ser necessário repetir a preparação na mesma rede do coletor. Não é necessário instalar ferramentas undetected para o fluxo que foi validado.

## Implantação e verificação

```sh
docker compose -f deployments/docker-compose.yml build api-gateway scraping-workers
docker compose -f deployments/docker-compose.yml up -d api-gateway scraping-workers
```

A migração `000004` cria a fila e registra as obras desses dois domínios que já estavam no catálogo. As fontes existentes só têm downloads ativados quando aparecem numa busca; iniciar a API não dispara a coleta de todo o acervo. A API não começa a coletar outros provedores.

Para verificar uma busca, consulte `/api/import/browse?domain=ravenscans.org&page=1`. Enquanto houver coleta ativa para os resultados, `syncing` será verdadeiro. Uma capa pronta terá URL iniciada por `/api/media/covers/`; sua resposta deverá ser uma imagem com cache imutável. Falhas de coleta ficam em `catalog_sources.last_error`, com a próxima tentativa em `next_attempt_at`.

## Backup e recuperação

Inclua PostgreSQL e o volume de capas no mesmo procedimento de backup. Os perfis são um recurso de sessão separado e exigem tratamento restrito. A API verifica arquivos prontos na inicialização e reagenda downloads de arquivos ausentes. A última capa válida é mantida se uma atualização falhar.

Recriar contêineres preserva os volumes. `docker compose down -v` e `make clean` removem os volumes e, portanto, as capas. Não existe limpeza automática dos arquivos publicados; arquivos sem referência podem permanecer após falhas ou exclusões, e uma futura limpeza deverá verificar referências antes de remover conteúdo compartilhado.

O armazenamento local suporta inicialmente um host. Para múltiplos hosts, use armazenamento compartilhado ou migre as chaves relativas para um bucket.
