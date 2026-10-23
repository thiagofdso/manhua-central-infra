# ADR-0004: Frontend Web Corporativo em Angular 18+ com Standalone Components e Signals

* **Status:** Aceito
* **Data:** 2026-10-23
* **Decisores:** Thiago Oliveira & Equipe de Arquitetura de Software

---

## Contexto
O protótipo legado concentrava toda a interface web em um único arquivo `index.html` de mais de 2.000 linhas com CSS, templates e centenas de funções JavaScript inline. Essa estrutura impedia testes automatizados de interface, dificultava o trabalho em equipe e criava gargalos de re-renderização em capítulos de mangás longos com centenas de imagens.

## Decisão
Reconstruir a aplicação web como uma Single Page Application (SPA) moderna em **Angular 18+**:
1. **Arquitetura Baseada em Componentes Standalone:** Elimina a complexidade de `NgModules` legados, tornando cada componente desacoplado e fácil de testar.
2. **Reatividade Fina com Angular Signals:** Gerenciamento de estado de alta performance com Signals para atualização granular do DOM (ex: barras de progresso de download e alternância de favoritos sem re-renderizar a lista inteira).
3. **Virtual Scrolling (`@angular/cdk/scrolling`):** No leitor Webtoon contínuo, apenas as imagens visíveis na viewport (mais um buffer de segurança) são mantidas no DOM, garantindo rolagem a 60 fps em capítulos extensos.
4. **PWA e Suporte Offline:** Integração com Service Worker e **IndexedDB** para leitura offline de capítulos baixados.

## Consequências
### Positivas
* Manutenibilidade corporativa de longo prazo com tipagem estrita (TypeScript).
* Suíte robusta de testes unitários (Karma/Jasmine/Jest) e testes ponta a ponta (E2E com Playwright).
* Experiência de leitura fluida na web equivalente aos principais leitores comerciais do mercado.

### Negativas / Mitigações
* Curva de aprendizado superior em relação a soluções simples como jQuery ou HTML estático. **Mitigação:** Utilização de padrões limpos recomendados pela equipe oficial do Angular e componentes do Tailwind CSS.
