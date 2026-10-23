# ADR-0007: Motor de Rankings em Tempo Real e Cache de Acessos com Redis Sorted Sets (ZSET)

* **Status:** Aceito
* **Data:** 2026-10-23
* **Decisores:** Thiago Oliveira & Equipe de Arquitetura de Software

---

## Contexto
A plataforma comercial exige o cálculo contínuo de rankings de alta frequência de leitura e consulta:
* Obras mais lidas hoje (diário);
* Obras mais lidas na semana;
* Obras mais lidas de todos os tempos;
* Obras com melhor pontuação/avaliação ponderada da comunidade.

Executar agregações (`COUNT(*)`, `GROUP BY`, `ORDER BY`) diretamente no PostgreSQL a cada abertura de capítulo e consulta de página principal degradaria rapidamente a CPU do banco relacional sob milhares de usuários simultâneos.

## Decisão
Implementar o motor de rankings em tempo real e cache de contadores utilizando **Redis 7+** e sua estrutura de dados nativa de **Sorted Sets (`ZSET`)**, integrando-o de forma híbrida com o **PostgreSQL 16**:

1. **Divisão Estrita de Responsabilidades (Dual-Storage Pattern):**
   * **PostgreSQL:** Fonte da verdade definitiva (*Single Source of Truth*), garantindo persistência transacional ACID de cada voto (`user_ratings`), metadados canônicos de obras (`canonical_manhuas`) e histórico de usuários.
   * **Redis:** Motor em memória para ordenação instantânea e absorção de altíssimo volume de leituras sem onerar o banco relacional.

2. **Incremento Atômico de Visualizações:**
   * A cada capítulo consumido, o backend executa `ZINCRBY rankings:views:daily:{YYYY-MM-DD} 1 {manhua_id}` em tempo $\mathcal{O}(\log N)$, com chaves configuradas para expiração automática (TTL 48h para diário, 14 dias para semanal).

3. **Ranking Ponderado de Notas (Score Bayesiano):**
   * Ao registrar uma avaliação, a nota é gravada no PostgreSQL com `UNIQUE(user_id, canonical_manhua_id)`. O backend calcula o novo score ponderado Bayesiano ($WR$) e atualiza atomicamente o Sorted Set do Redis: `ZADD rankings:top_rated <WR> <manhua_id>`.

4. **Padrão de Consulta em Duas Etapas (Two-Step Fetch):**
   * O cliente requisita o ranking (Top 20).
   * O backend consulta o Redis em $\le 1\text{ ms}$: `ZREVRANGE <ranking_key> 0 19 WITHSCORES` retornando apenas os IDs das obras ordenadas.
   * O backend faz uma busca direta indexada no PostgreSQL para enriquecer com títulos e capas: `SELECT id, title, slug, cover_url FROM canonical_manhuas WHERE id IN (...)`.

5. **Sincronização Periódica em Lote (Batching Sync):**
   * Um worker em background em Go (executando a cada 15 minutos) consolida os contadores de visualizações do Redis e atualiza o campo `total_views` no PostgreSQL, garantindo que o histórico nunca seja perdido.

6. **Recuperação de Desastres e Warm-Up:**
   * Caso o Redis reinicie ou perca sua memória, uma rotina de inicialização no backend Go (*warm-up*) lê os dados consolidados do PostgreSQL, recalcula os scores e popula os Sorted Sets do Redis em poucos segundos.

## Consequências
### Positivas
* **Desoneração Massiva do Banco Relacional:** O PostgreSQL fica livre de consultas pesadas com `GROUP BY`, `COUNT(*)` e `ORDER BY` sobre milhões de registros de visualizações.
* **Latência de Resposta Extrema:** Rankings respondem no aplicativo móvel em menos de **5 milissegundos**.
* **Integridade Absoluta:** O PostgreSQL continua como dono soberano dos dados auditáveis de votos e usuários.

### Negativas / Mitigações
* Necessidade de gerenciar a consistência eventual de contadores entre Redis e PostgreSQL. **Mitigação:** O worker periódico de reconciliação a cada 15 minutos e a rotina de warm-up eliminam qualquer risco de divergência.
