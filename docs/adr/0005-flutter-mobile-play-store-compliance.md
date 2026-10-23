# ADR-0005: Aplicativo Móvel em Flutter com Conformidade Total para a Google Play Store

* **Status:** Aceito
* **Data:** 2026-10-23
* **Decisores:** Thiago Oliveira & Equipe de Arquitetura de Software

---

## Contexto
O protótipo mobile desenvolvido em Flutter já possuía uma excelente estrutura visual e de navegação por gestos, porém encontrava-se em estado inadequado para publicação na Google Play Store:
* Usava assinatura de debug para o build release (`signingConfigs.getByName("debug")`);
* Dependia de IP hardcoded na LAN (`100.84.57.79:5000`);
* Habilitava tráfego em texto puro globalmente (`usesCleartextTraffic=true`);
* Não possuía suporte a notificações push nativas em background;
* Não contemplava o botão obrigatório de exclusão de conta do usuário exigido pelas políticas da Google Play Console.

## Decisão
Manter o ecossistema mobile em **Flutter (Dart)**, aplicando um plano de hardening e conformidade para publicação oficial na **Google Play Store**:
1. **Compilação Exclusiva em Android App Bundle (.aab):** Target SDK configurado para API 34+ (Android 14) com assinatura via **Google Play App Signing**.
2. **Onboarding Dinâmico e TLS Obrigatório:** Conexão estritamente sob HTTPS/TLS 1.3, removendo cleartext traffic e permitindo ao usuário conectar à nuvem pública ou a instâncias customizadas.
3. **Downloads em Background com WorkManager:** Uso do motor nativo do Android (`workmanager`) para permitir que downloads em lote continuem executando com a tela apagada ou app minimizado.
4. **Exclusão de Conta In-App (Regra Mandatória Play Store):** Implementação de fluxo direto nas configurações para exclusão imediata e definitiva da conta do usuário (`DELETE /api/users/me`).

## Consequências
### Positivas
* Preserva o investimento no código Flutter existente, elevando-o a padrão comercial.
* Publicação descomplicada e aprovação garantida na Google Play Console.
* Experiência de uso nativa com taxa de quadros de 120Hz em telas de alta taxa de atualização.

### Negativas / Mitigações
* Exigência de manutenção de segredos de compilação (Keystore de release) em CI. **Mitigação:** Armazenamento seguro de certificados codificados em Base64 nos GitHub Secrets.
