# ADR-0008: Autenticação Unificada com Google OAuth (Web e Android) e Tokens JWT/Argon2id

* **Status:** Aceito
* **Data:** 2026-10-23
* **Decisores:** Thiago Oliveira & Equipe de Arquitetura de Software

---

## Contexto
O produto visa tanto o público web quanto usuários de smartphones Android na Google Play Store. O cadastro tradicional por e-mail e senha apresenta alta fricção no mobile (abandono superior a 50% na tela de registro). Ao mesmo tempo, era mandatório que um usuário pudesse alternar livremente entre o computador e o celular sem duplicar sua conta ou perder o progresso de leitura.

## Decisão
Implementar um sistema de autenticação híbrido e unificado centrado em **Google Sign-In (OAuth 2.0 / OpenID Connect)** e tokens JWT:
1. **Google Sign-In Nativo no Android (Flutter):** Utiliza o SDK oficial do Google Sign-In / Credential Manager, capturando com 1 toque o `id_token` do Google assinado.
2. **Google Identity Services no Web (Angular):** Utiliza o Google Identity Services (GIS) oficial com suporte a Google One Tap, gerando o mesmo formato de `id_token`.
3. **Validação Criptográfica no Backend em Go (`POST /api/auth/google`):**
   * O backend valida a assinatura do token diretamente contra as chaves públicas oficiais do Google (`https://www.googleapis.com/oauth2/v3/certs`);
   * Extrai o identificador único permanente (`sub`), e-mail verificado, nome e avatar;
   * Cria ou vincula a conta na tabela `users` (`auth_provider = 'google'`);
   * Emite o par de tokens canônicos da plataforma: Access Token JWT (15 minutos) e Refresh Token (30 dias).
4. **Suporte a E-mail/Senha Tradicional:** Usuários que não desejarem vincular o Google podem criar credenciais locais protegidas por hash **Argon2id**.

## Consequências
### Positivas
* **Experiência de 1 Toque:** Onboarding imediato na Google Play Store, aumentando drasticamente a taxa de conversão.
* **Sincronização Perfeita:** Login com o mesmo Google no computador e celular reflete a biblioteca e os favoritos instantaneamente.
* **Segurança e Veracidade:** E-mails já vêm verificados pelo Google, prevenindo contas falsas e spams em votações.

### Negativas / Mitigações
* Dependência da disponibilidade dos serviços de OAuth do Google. **Mitigação:** Manutenção da rota tradicional de e-mail e senha como opção alternativa de contingência.
