# ADR-0011: Política Rígida de Downloads Offline Perpétuos sem Evicção Automática por LRU/TTL

* **Status:** Aceito
* **Data:** 2026-10-23
* **Decisores:** Thiago Oliveira & Equipe de Arquitetura de Software

---

## Contexto
Muitos aplicativos móveis de leitura e streaming implementam algoritmos de limpeza automática de cache (LRU - Least Recently Used) ou expiração por tempo (TTL de 7 a 30 dias) para economizar espaço de armazenamento no dispositivo. No entanto, para leitores pendulares e viajantes de áreas sem sinal, descobrir que capítulos baixados anteriormente foram apagados sem aviso é uma das maiores causas de frustração e avaliações negativas na Play Store.

## Decisão
Estabelecer como **regra de negócio inviolável** a política de **retenção perpétua de downloads offline sem evicção automática**:
1. **Proibição Absoluta de Limpeza por Tempo ou LRU:** O aplicativo mobile (Flutter) e a web (IndexedDB) **NUNCA DEVEM** apagar capítulos baixados de forma automática ou em segundo plano.
2. **Controle Exclusivo do Usuário:** A exclusão de capítulos baixados é realizada estritamente sob comando explícito do usuário através de:
   * Exclusão individual de um capítulo específico;
   * Exclusão de todos os capítulos de uma obra;
   * Limpeza global de armazenamento nas configurações.
3. **Painel de Gestão de Armazenamento:** A interface exibe o volume total ocupado em MB/GB e a contagem de capítulos armazenados para que o leitor tome decisões conscientes de limpeza.

## Consequências
### Positivas
* **Confiabilidade Inabalável:** O leitor tem 100% de certeza de que os capítulos baixados estarão disponíveis quando entrar em um avião ou metrô.
* Excelente percepção de valor e fidelização na Google Play Store.

### Negativas / Mitigações
* Risco de o dispositivo móvel ficar sem espaço caso o usuário baixe centenas de capítulos e esqueça de apagá-los. **Mitigação:** Alerta informativo preventivo quando o espaço livre do dispositivo atingir menos de 1 GB, orientando o usuário a acessar o painel de gerenciamento de disco.
