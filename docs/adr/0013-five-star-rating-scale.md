# ADR-0013: Adoção de Escala de Avaliação de 1 a 5 Estrelas para Votações Comunitárias

## Status
**Aceito** (Outubro 2026)

## Contexto
Originalmente, a especificação técnica (RN-07) e o modelo inicial de dados previam uma escala de avaliação de 1 a 10 estrelas (`score SMALLINT CHECK (score >= 1 AND score <= 10)`). No entanto, sob a ótica de usabilidade, ergonomia mobile e clareza cognitiva para os leitores de quadrinhos digitais (webtoons/manhuas), uma escala de 10 estrelas introduz fricção desnecessária, granularidade excessiva na interface e sobrecarga visual (especialmente em telas touch de smartphones).

A escala de 1 a 5 estrelas é o padrão canônico adotado por plataformas globais de consumo e conteúdo digital (Google Play Store, Goodreads, Webtoon, Amazon), oferecendo maior simplicidade de interação, affordance visual imediata em componentes reutilizáveis e distribuição estatística mais estável.

## Decisão
1. **Alteração da Escala de Votação (RN-07.1):** A nota concedida pelo usuário à obra passa a ser um número inteiro no intervalo $[1, 5]$.
2. **Ajuste na Constraint Relacional do Banco:** O campo `score` na tabela `user_ratings` terá sua constraint ajustada via migração para `CHECK (score >= 1 AND score <= 5)`.
3. **Recalibração da Média Bayesiana ($WR$ na RN-07.2):**
   - O score ponderado passa a operar no intervalo $[1.00, 5.00]$.
   - A fórmula permanece a clássica média Bayesiana:
     $$WR = \frac{v}{v + m} \cdot R + \frac{m}{v + m} \cdot C$$
     Onde $R \in [1.0, 5.0]$, $m = 10$ (votos mínimos confiáveis) e $C = 3.50$ (baseline da média global esperada).
4. **Interface e Componentes:** Os componentes web e mobile exibirão um seletor interativo de 5 estrelas (`★ ★ ★ ★ ★`) com precisão de meia estrela na exibição do score calculado.

## Consequências
- **Positivas:**
  - Interface mais limpa, acessível e amigável em telas mobile e desktop.
  - Elimina hesitação do usuário entre notas vizinhas redundantes (ex: 7 vs 8).
  - Alinhamento total com as expectativas visuais da comunidade leitora e das diretrizes do Google Play.
- **Negativas / Mitigações:**
  - Necessidade de migração SQL (`ALTER TABLE user_ratings DROP CONSTRAINT... ADD CONSTRAINT...`) para compatibilizar bancos já provisionados. Mitigado pela criação da migração versionada `000002_adjust_rating_to_5_stars.sql`.
