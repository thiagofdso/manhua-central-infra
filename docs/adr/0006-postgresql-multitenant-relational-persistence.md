# ADR-0006: Persistência Relacional em PostgreSQL com Segregação Multi-Tenant e Catálogo Canônico

* **Status:** Aceito
* **Data:** 2026-10-23
* **Decisores:** Thiago Oliveira & Equipe de Arquitetura de Software

---

## Contexto
O protótipo legado persistia dados diretamente em arquivos `database.json` e `notifications.json`. As operações liam o JSON inteiro em memória e regravavam o arquivo completo a cada alteração de capítulo. Sob múltiplos usuários, tarefas simultâneas de download ou agendamento de rotinas, essa abordagem gerava condições de corrida (*race conditions*), bloqueios de I/O e risco de corrupção total de dados. Além disso, não permitia suporte multi-usuário com bibliotecas individuais.

## Decisão
Substituir a persistência em JSON por um banco relacional transacional robusto em **PostgreSQL 16+**:
1. **Segregação Multi-Tenant Lógica:** Separação entre a tabela de catálogo global (`canonical_manhuas`) e a tabela de biblioteca pessoal do usuário (`user_libraries`), garantindo que o progresso de leitura, a ordenação e os favoritos sejam estritamente isolados por `user_id`.
2. **Transações ACID:** Operações críticas (ex: ler capítulo + promover ao topo do grupo + emitir notificação) executadas sob blocos transacionais com isolamento garantido.
3. **Migrações Versionadas:** Utilização de ferramenta de migração profissional (ex: `golang-migrate`) com scripts SQL versionados e determinísticos.

## Consequências
### Positivas
* Impossibilidade de corrupção de dados ou sobrescrita acidental por requisições simultâneas.
* Índices B-Tree compostos garantem ordenação da biblioteca (Favoritos no topo) em menos de **2 ms**.
* Suporte nativo a tipos JSONB para armazenar metadados flexíveis de provedores sem quebrar o esquema relacional.

### Negativas / Mitigações
* Exige a execução de um contêiner ou serviço gerenciado de PostgreSQL. **Mitigação:** Orquestração automatizada via Docker Compose em ambientes de desenvolvimento e produção.
