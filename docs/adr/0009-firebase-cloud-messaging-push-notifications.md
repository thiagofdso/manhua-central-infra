# ADR-0009: Notificações Push Remotas em Dispositivos Móveis via Firebase Cloud Messaging (FCM)

* **Status:** Aceito
* **Data:** 2026-10-23
* **Decisores:** Thiago Oliveira & Equipe de Arquitetura de Software

---

## Contexto
O protótipo legado possuía um agendador às 23:50 que persistia notificações em um arquivo local `notifications.json`. No entanto, em um aplicativo publicado na Google Play Store, salvar registros no servidor não alerta o usuário se o aplicativo estiver fechado no celular. O usuário precisava abrir o app ativamente para descobrir se novos capítulos haviam sido lançados.

## Decisão
Integrar o serviço de **Firebase Cloud Messaging (FCM)** para despacho de notificações push remotas aos smartphones Android e iOS:
1. **Captura de Tokens de Dispositivo:** Ao inicializar a sessão no aplicativo Flutter, o token de registro FCM é capturado e enviado à API Go (`POST /api/users/device-token`).
2. **Integração com a Rotina Noturna das 23:50:** Ao detectar um novo capítulo de uma obra, o agendador em Go consulta todos os usuários que possuem aquela obra em sua biblioteca (`user_libraries`) e despacha em lote payloads de push via API REST v1 do FCM.
3. **Navegação Direta para o Capítulo:** O payload inclui `{ "manhua_id": 123, "chapter": 245 }`. Ao tocar na notificação na bandeja do Android, o aplicativo abre imediatamente a tela do leitor no capítulo correspondente.

## Consequências
### Positivas
* Aumento substancial na retenção de usuários (D7 e D30) e consumo de novos episódios.
* Notificações entregues de forma confiável pelo serviço oficial do Google sem drenar a bateria do smartphone.

### Negativas / Mitigações
* Exigência de configuração do projeto Firebase Console e credenciais de conta de serviço. **Mitigação:** Variáveis de ambiente seguras no contêiner Go e no CI/CD para armazenar as credenciais da Service Account do Firebase.
