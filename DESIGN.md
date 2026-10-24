---
name: "Manhua Manager Pro"
description: "Plataforma B2C moderna de leitura contínua, catalogação e rankings de quadrinhos asiáticos"
colors:
  primary: "#6366f1"
  primary-hover: "#4f46e5"
  primary-subtle: "#1e1b4b"
  neutral-bg: "#090d16"
  surface: "#0f172a"
  surface-elevated: "#141c2e"
  surface-border: "#1e293b"
  text-primary: "#ffffff"
  text-secondary: "#94a3b8"
  text-muted: "#64748b"
  status-danger: "#ef4444"
  status-danger-bg: "#450a0a"
  status-danger-border: "#991b1b"
  status-success: "#10b981"
  status-success-bg: "#052e16"
  status-success-border: "#166534"
typography:
  display:
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: "clamp(2rem, 5vw, 3rem)"
    fontWeight: 800
    lineHeight: 1.15
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "-0.02em"
  title:
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "-0.01em"
  body:
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  label:
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    lineHeight: 1.35
    letterSpacing: "0.025em"
rounded:
  sm: "6px"
  md: "10px"
  lg: "14px"
  xl: "20px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  xxl: "48px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.lg}"
    padding: "12px 20px"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
  input:
    backgroundColor: "{colors.surface-elevated}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.lg}"
    padding: "12px 16px"
  card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.xl}"
    padding: "24px"
---

# Design System — Manhua Manager Pro

## Overview
O sistema de design do **Manhua Manager Pro** é guiado pelo princípio **Content-First**: a interface atua como uma moldura escura e imersiva para que a arte dos manhuas, manhwas e mangás seja o protagonista absoluto. A estética combina elementos de leitores de referência (*Mihon, Tachiyomi, Webtoon*) com a agilidade e nitidez de plataformas modernas (*Discord*), eliminando ruídos visuais, anúncios e padrões artificiais.

## Colors
- **Fundo Principal (Ground):** `#090d16` (Dark 950). Profundo, sem reflexos cinzas lavados, ideal para leitura prolongada em qualquer ambiente de iluminação.
- **Superfícies de Conteúdo (Cards & Modais):** `#0f172a` (Slate 900 / Dark 900) com bordas precisas em `#1e293b` (Slate 800).
- **Superfícies Elevadas (Inputs & Badges Secundários):** `#141c2e` (Dark 850) com anéis de foco nítidos.
- **Cor Primária da Marca:** `#6366f1` (Indigo 500 sólido) e `#4f46e5` (Indigo 600 em hover). Fornece energia vibrante para botões de ação e estados ativos sem o clichê do degradê roxo de IA.
- **Contraste de Texto:**
  - Primário: `#ffffff` / `#f8fafc` (Contraste $\ge 14:1$ sobre o fundo).
  - Secundário: `#94a3b8` (Slate 400, Contraste $\approx 6.5:1$, excedendo o requisito WCAG AA de $4.5:1$).
  - Muted / Placeholders: `#64748b` (Slate 500, Contraste $\ge 4.5:1$).
- **Estados Semânticos:**
  - Perigo / Erro: Vermelho carmim (`#ef4444` / fundo `#450a0a` / borda `#991b1b`).
  - Sucesso: Esmeralda puro (`#10b981` / fundo `#052e16` / borda `#166534`).

## Typography
- **Família Tipográfica:** Pilha nativa moderna sans-serif (`system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`) para renderização instantânea sem layout shifts (CLS = 0).
- **Hierarquia:**
  - Headings sólidos em branco com `text-wrap: balance` e tracking levemente negativo (`-0.02em` a `-0.025em`) para densidade editorial elegante.
  - Labels funcionais e legíveis com peso `font-medium` ou `font-semibold`.
  - Corpo de texto limitado a 65–75 caracteres por linha para conforto visual.

## Layout
- **Alinhamento e Ritmo:** Espaçamentos consistentes baseados no módulo de 8px (8px, 16px, 24px, 32px, 48px).
- **Áreas de Toque Móveis:** Alvos de clique e toque com altura mínima de 44px (`min-h-[44px]`), otimizados para uso confortável com uma mão no celular.
- **App Shell:** Cabeçalho da aplicação fixo ou contido, provendo ancoragem visual rápida, identidade da marca e navegação intuitiva.

## Elevation & Depth
- **Camadas Tonais (Tonal Layering):** A profundidade é criada primariamente por contraste de valor entre superfícies (`#090d16` $\rightarrow$ `#0f172a` $\rightarrow$ `#141c2e`), complementada por bordas sutis (`border-slate-800/80`).
- **Sombras Funcionais:** Sombras suaves e difusas (`shadow-xl` / `shadow-2xl`) reservadas para modais, cartões flutuantes e menus dropdown para destacar elevação sem parecer carregado.

## Shapes
- **Raios de Borda (Border Radius):**
  - Cartões principais e modais: `rounded-2xl` (16px a 20px).
  - Inputs e botões: `rounded-xl` (12px) para toque ergonômico.
  - Badges e tags: `rounded-full` (pílula) para diferenciação imediata de dados (gênero, status, ranking).

## Components
- **Botões:**
  - Primário: Sólido (`bg-indigo-600 hover:bg-indigo-500`), texto branco com contraste total, transição suave de cor (`transition-colors duration-150`).
  - Secundário / Neutro: Superfície escura (`bg-slate-800 hover:bg-slate-700`), texto em `slate-200`.
  - Perigo: Sólido ou contido (`bg-red-600 hover:bg-red-700` ou `bg-red-950/40 text-red-400 border border-red-900/60`).
- **Campos de Entrada (Inputs):** Fundo `#141c2e`, borda `#1e293b`, foco nítido via anel `focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500`, ícones de apoio internos e labels semânticas associadas.
- **Badges:** Pequenos, legíveis, com contraste validado $\ge 4.5:1$ e bordas translúcidas reforçando a silhueta.

## Do's and Don'ts
- ✅ **DO:** Usar cores sólidas de alto contraste nos títulos e textos.
- ✅ **DO:** Testar a legibilidade de textos secundários para garantir que nenhum cinza fique abaixo de 4.5:1.
- ✅ **DO:** Garantir suporte a `prefers-reduced-motion` em qualquer transição ou micro-animação.
- ❌ **DON'T:** Usar textos com gradiente artificial (`bg-clip-text` com degradê).
- ❌ **DON'T:** Usar degradês roxo-para-roxo em botões ou cartões (marca registrada de AI slop).
- ❌ **DON'T:** Inserir bordas laterais coloridas decorativas em cards (`border-left` de 3px ou mais).
- ❌ **DON'T:** Aplicar glassmorphism ou fundos translúcidos borrados sem propósito funcional de sobreposição.
