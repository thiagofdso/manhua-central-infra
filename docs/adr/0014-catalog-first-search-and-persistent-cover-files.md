# ADR-0014: Busca pelo Catálogo Local e Armazenamento de Capas em Volume Persistente

* **Status:** Aceito
* **Data:** 2026-10-29
* **Decisores:** Thiago Oliveira

## Contexto

A importação consulta provedores externos e caches locais para descobrir obras. As capas são referenciadas por URLs desses provedores, fazendo o cliente depender da disponibilidade do site e de suas restrições de acesso em cada exibição.

Alguns domínios exigem navegador, sessão persistente, cookie de verificação e cabeçalhos específicos. Repetir essas consultas durante buscas e carregamentos de imagens aumenta a latência, o consumo dos coletores e a exposição a bloqueios do Cloudflare. Mesmo uma URL de capa válida pode não funcionar fora da sessão que a obteve.

Precisamos preservar os resultados das descobertas no catálogo e servir cópias das capas pela própria aplicação, com armazenamento que sobreviva à recriação dos contêineres.

## Decisão

**Escopo inicial:** a importação automática, a consulta prioritária ao catálogo e a coleta de capas em volume serão habilitadas somente para `manhuaus.com` e `ravenscans.org`. Os demais domínios manterão o fluxo existente. Esta limitação evita iniciar coletas e ocupar armazenamento desnecessariamente; uma ampliação de escopo deverá ser uma decisão explícita.

### 1. Catálogo como fonte das buscas

As obras descobertas nas consultas aos provedores serão persistidas automaticamente no catálogo compartilhado. A inclusão na biblioteca pessoal continuará sendo uma ação explícita do usuário.

As buscas consultarão primeiro o catálogo local. Consultas inéditas ou com dados desatualizados poderão solicitar sincronização em segundo plano. A interface deverá indicar quando uma coleta estiver em andamento, sem apresentar a ausência temporária de resultados como um catálogo externo definitivamente vazio.

A sincronização será idempotente e deduplicará trabalhos equivalentes por domínio, consulta e página. Ela atualizará metadados sem sobrescrever dados locais válidos com respostas vazias ou falhas do provedor.

O modelo deverá distinguir a obra de suas fontes, preservando identificador e URL de cada provedor. Títulos iguais ou slugs semelhantes não serão suficientes, isoladamente, para unir obras de fontes diferentes.

### 2. Capas como arquivos em volume persistente

Os bytes das capas serão armazenados em arquivos dentro de um volume nomeado do Docker, separado do sistema de arquivos efêmero da imagem. O diretório interno será configurável; a referência inicial é `/data/covers`.

Os arquivos serão identificados pelo hash SHA-256 de seu conteúdo, com extensão correspondente ao formato validado. O prefixo do hash organizará os subdiretórios. Exemplo:

```text
/data/covers/ab/ab12cd34…hash-completo….webp
```

Conteúdos idênticos compartilharão o mesmo arquivo. Os nomes não serão derivados diretamente de títulos ou caminhos fornecidos pelo provedor.

O PostgreSQL armazenará a referência ao arquivo e os metadados necessários:

* Chave relativa do arquivo, independente do ponto de montagem e do host público.
* Hash do conteúdo, tipo da imagem e tamanho em bytes.
* URL e domínio de origem.
* Data de download e estado da coleta, incluindo falhas e tentativas.
* Associação entre a capa, a obra e sua fonte.

Não serão armazenados bytes de imagens nem representações Base64 no banco de dados.

### 3. Coleta assíncrona e preservação da sessão

O download das capas ocorrerá em trabalhos de segundo plano, com concorrência limitada por domínio, deduplicação e novas tentativas com intervalo crescente. O carregamento de uma busca não deverá aguardar o download individual de todas as suas capas.

Quando necessário, o coletor usará a mesma sessão de navegador que obteve acesso ao site, mantendo cookies e cabeçalhos consistentes durante o download. A obtenção do endereço da imagem e a transferência dos bytes serão tratadas como etapas do mesmo fluxo de coleta.

Cookies e outros dados de sessão permanecerão restritos à infraestrutura de coleta. Não serão incluídos na URL pública da capa nem enviados ao frontend. Um bloqueio de verificação deverá ser registrado como indisponibilidade da coleta; a existência de um cookie salvo não será tratada como garantia de acesso.

O arquivo será publicado somente após download completo e validação de formato e tamanho. A escrita usará arquivo temporário e publicação atômica. A referência no banco será atualizada apenas quando o arquivo final estiver disponível. Uma falha de atualização preservará a última capa válida.

Os downloads continuarão sujeitos à proteção contra SSRF da ADR-0002, incluindo validação do destino e de redirecionamentos. Respostas de verificação, páginas HTML e arquivos incompatíveis não serão publicados como imagens.

### 4. Entrega pela aplicação

O frontend receberá uma URL da aplicação, por exemplo:

```text
/media/covers/ab/ab12cd34…hash-completo….webp
```

O caminho público será resolvido a partir da chave armazenada, sem expor o caminho absoluto do volume. A entrega poderá ser feita pelo Nginx com montagem somente para leitura ou por um endpoint estático equivalente da API, conforme o ambiente.

Como o nome identifica o conteúdo, a entrega poderá usar cache de longa duração. Uma nova versão da imagem produzirá outra chave e outra URL. O acesso às capas já publicadas não dependerá de uma nova requisição ao provedor externo.

### 5. Operação e evolução

O volume deverá ter permissões de escrita compatíveis com o usuário do coletor, limite configurável para downloads e acompanhamento do espaço ocupado. Os backups deverão incluir banco e arquivos; restaurar apenas o banco não recuperará as capas.

A recriação dos contêineres preservará o volume. Sua exclusão explícita, inclusive por comandos como `docker compose down -v`, removerá os arquivos e deverá ser considerada na documentação operacional.

Arquivos compartilhados não poderão ser removidos enquanto houver referências. A recuperação de arquivos ausentes e a limpeza de arquivos órfãos deverão considerar falhas entre a publicação do arquivo e a gravação no banco.

A implantação inicial usará volume local em um único host. Se a aplicação passar a executar em vários hosts, o armazenamento deverá ser compartilhado ou migrado para um bucket. A chave relativa no banco permitirá essa evolução sem vincular o catálogo ao disco de uma instância específica.

## Alternativas Consideradas

* **Manter apenas URLs externas:** exige menos armazenamento, mas conserva a dependência de sessões, disponibilidade e políticas de hotlink dos provedores.
* **Base64 ou dados binários no PostgreSQL:** concentra os dados em um único backup, mas aumenta o volume do banco e o custo de sua operação; Base64 também acrescenta aproximadamente 33% ao tamanho dos bytes originais.
* **Arquivos dentro da imagem ou da camada gravável do contêiner:** não oferecem a persistência necessária durante atualizações e recriações.
* **Bucket desde o início:** facilita múltiplos hosts, mas acrescenta infraestrutura que não é necessária para a implantação inicial.

## Consequências

* Buscas repetidas e exibições de capas deixam de exigir consultas externas a cada acesso.
* O catálogo e as imagens já coletadas continuam disponíveis durante falhas dos provedores.
* A coleta inicial ainda depende de acesso válido à fonte; esta decisão não elimina verificações do Cloudflare.
* O sistema passa a administrar armazenamento, filas de coleta, consistência entre banco e arquivos e backups dos dois recursos.
* As primeiras consultas podem apresentar obras cuja capa ainda está pendente, exigindo um estado visual apropriado.

## Escopo e Relação com Outras ADRs

Esta decisão cobre metadados do catálogo e capas compartilhadas no servidor. O armazenamento de páginas dos capítulos não faz parte deste escopo.

Complementa as ADRs [0002](0002-go-backend-streaming-proxy-ssrf.md), [0003](0003-nodejs-puppeteer-scraping-worker-pool.md), [0006](0006-postgresql-multitenant-relational-persistence.md) e [0010](0010-docker-containerization-distroless-compose.md). A política de downloads pessoais offline da [ADR-0011](0011-perpetual-offline-downloads-no-auto-eviction.md) permanece aplicável ao seu próprio escopo.
