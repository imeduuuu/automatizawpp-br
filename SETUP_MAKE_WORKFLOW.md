# Configuração Make.com: GitHub → Deploy → Verify Meta Tag → Notify

## Passo 1: Criar Novo Cenário no Make

1. Acesse **Make.com**
2. Clique em **Create a new scenario**
3. Nomeie: "GitHub Push Deploy & Verify"
4. Salve

---

## Passo 2: Adicionar Módulo GitHub Webhook

1. Clique no ícone **+** para adicionar módulo
2. Procure por **GitHub**
3. Selecione **Watch commits**
4. Configure:
   - **Connection**: Conecte sua conta GitHub
   - **Repository**: Seu repositório
   - **Branch**: `main`
   - **Event type**: `Push`

5. Salve

---

## Passo 3: Adicionar Módulo HTTP Request (Deploy)

1. Adicione novo módulo: **+** → **HTTP**
2. Selecione **Make a request**
3. Configure:
   - **URL**: `{{ env.DO_DEPLOY_WEBHOOK_URL }}`
   - **Method**: POST
   - **Headers**:
     ```
     Authorization: Bearer {{ env.DO_API_TOKEN }}
     Content-Type: application/json
     ```
   - **Body** (Raw):
     ```json
     {
       "branch": "main",
       "action": "deploy",
       "repository": "{{ github.repository }}",
       "commit": "{{ github.commit.sha }}"
     }
     ```

4. Salve

---

## Passo 4: Adicionar Delay (30 segundos)

1. Adicione novo módulo: **+** → **Sleep**
2. Configure: **30 seconds**
3. Salve

---

## Passo 5: Adicionar Módulo HTTP Request (Fetch Website)

1. Adicione novo módulo: **+** → **HTTP**
2. Selecione **Make a request**
3. Configure:
   - **URL**: `{{ env.SITE_URL }}`
   - **Method**: GET
   - **Headers**:
     ```
     User-Agent: Meta-Tag-Checker/1.0
     ```

4. Salve

---

## Passo 6: Adicionar Módulo Text Parser (Verificar Meta Tag)

1. Adicione novo módulo: **+** → **Text Parser**
2. Selecione **Match pattern**
3. Configure:
   - **Text**: `{{ http.body }}`
   - **Pattern**: 
     ```
     <meta[^>]*google-site-verification[^>]*>
     ```
   - **Global match**: ON

4. Salve

---

## Passo 7: Adicionar Conditional Router

1. Adicione novo módulo: **+** → **Router**
2. Configure primeira rota:
   - **Condition**: `{{ text-parser.matches.length > 0 }}`
   - **Label**: "Meta Tag Found"

3. Configure segunda rota:
   - **Condition**: Negue a primeira (use "Does not equal")
   - **Label**: "Meta Tag Not Found"

---

## Passo 8: Adicionar Slack (Sucesso)

Na rota "Meta Tag Found":

1. Adicione módulo: **+** → **Slack**
2. Selecione **Send a message**
3. Configure:
   - **Connection**: Conecte seu Slack
   - **Channel**: Seu canal (ex: `#deployments`)
   - **Message Type**: Rich
   - **Blocks**:
     ```json
     [
       {
         "type": "header",
         "text": {
           "type": "plain_text",
           "text": ":white_check_mark: Deploy Successful"
         }
       },
       {
         "type": "section",
         "fields": [
           {
             "type": "mrkdwn",
             "text": "*Repository:*\n{{ github.repository }}"
           },
           {
             "type": "mrkdwn",
             "text": "*Branch:*\nmain"
           },
           {
             "type": "mrkdwn",
             "text": "*Commit:*\n{{ github.commit.sha | slice(0,7) }}"
           },
           {
             "type": "mrkdwn",
             "text": "*Status:*\n✓ Meta Tag Found"
           }
         ]
       }
     ]
     ```

4. Salve

---

## Passo 9: Adicionar Email (Sucesso)

Na mesma rota "Meta Tag Found":

1. Adicione módulo: **+** → **Gmail** (ou seu provedor de email)
2. Selecione **Send an email**
3. Configure:
   - **Connection**: Conecte Gmail
   - **To**: `{{ env.NOTIFICATION_EMAIL }}`
   - **Subject**: `✅ Deploy Successful - Meta Tag Verified`
   - **Body (HTML)**:
     ```html
     <h2>Deploy Successful!</h2>
     <p>Your site has been deployed and the meta tag is verified.</p>
     <h3>Details:</h3>
     <ul>
       <li><strong>Repository:</strong> {{ github.repository }}</li>
       <li><strong>Branch:</strong> main</li>
       <li><strong>Commit:</strong> {{ github.commit.sha }}</li>
       <li><strong>Author:</strong> {{ github.author }}</li>
       <li><strong>Meta Tag:</strong> ✓ Found</li>
       <li><strong>URL:</strong> {{ env.SITE_URL }}</li>
       <li><strong>Time:</strong> {{ now | formatDate("dd/MM/yyyy HH:mm") }}</li>
     </ul>
     <p><a href="{{ env.SITE_URL }}">Visit Site</a></p>
     ```

4. Salve

---

## Passo 10: Adicionar Slack (Erro)

Na rota "Meta Tag Not Found":

1. Adicione módulo: **+** → **Slack**
2. Selecione **Send a message**
3. Configure:
   - **Channel**: Seu canal
   - **Message Type**: Rich
   - **Blocks**:
     ```json
     [
       {
         "type": "header",
         "text": {
           "type": "plain_text",
           "text": ":x: Deploy Failed - Meta Tag NOT Found"
         }
       },
       {
         "type": "section",
         "text": {
           "type": "mrkdwn",
           "text": "The deploy completed but the Google site verification meta tag was NOT found on the site."
         }
       },
       {
         "type": "section",
         "fields": [
           {
             "type": "mrkdwn",
             "text": "*Repository:*\n{{ github.repository }}"
           },
           {
             "type": "mrkdwn",
             "text": "*Commit:*\n{{ github.commit.sha | slice(0,7) }}"
           },
           {
             "type": "mrkdwn",
             "text": "*Status:*\n✗ NOT Found"
           },
           {
             "type": "mrkdwn",
             "text": "*Action:*\nCheck logs"
           }
         ]
       }
     ]
     ```

4. Salve

---

## Passo 11: Adicionar Email (Erro)

Na mesma rota "Meta Tag Not Found":

1. Adicione módulo: **+** → **Gmail**
2. Selecione **Send an email**
3. Configure:
   - **To**: `{{ env.NOTIFICATION_EMAIL }}`
   - **Subject**: `❌ Deploy Failed - Meta Tag NOT Found`
   - **Body (HTML)**:
     ```html
     <h2>Deploy Issue - Meta Tag Missing</h2>
     <p>The deployment completed but the Google site verification meta tag was NOT found.</p>
     <h3>Details:</h3>
     <ul>
       <li><strong>Repository:</strong> {{ github.repository }}</li>
       <li><strong>Commit:</strong> {{ github.commit.sha }}</li>
       <li><strong>Status:</strong> FAILED ✗</li>
     </ul>
     <h3>Troubleshooting:</h3>
     <ol>
       <li>Check if the deployment was successful</li>
       <li>Wait 5 minutes and manually check the site</li>
       <li>Verify _document.tsx has the meta tag in the head</li>
       <li>Check for redirect issues</li>
       <li>View logs: {{ env.DEPLOY_LOGS_URL }}</li>
     </ol>
     ```

4. Salve

---

## Passo 12: Testar o Cenário

1. Clique em **Run once** no canto inferior esquerdo
2. Simule um push do GitHub:
   - Ou faça um commit real na branch `main`
   - Ou use a opção de teste manual do módulo GitHub

3. Monitorar a execução:
   - Vá para **History**
   - Veja cada passo do workflow

---

## Passo 13: Configurar Variáveis de Ambiente

No Make, você pode usar variáveis de duas formas:

### Opção A: Data Store (Recomendado)

1. Vá para **Data → Data Stores**
2. Clique em **Create a new data store**
3. Nomeie: `deployment-config`
4. Adicione chaves:
   - `SITE_URL`: `https://seu-site.com.br`
   - `NOTIFICATION_EMAIL`: `seu-email@gmail.com`
   - `DO_DEPLOY_WEBHOOK_URL`: `https://seu-droplet.com/api/deploy`
   - `DO_API_TOKEN`: `dop_v1_xxx...`
   - `DEPLOY_LOGS_URL`: `https://seu-site.com.br/logs`

5. No cenário, referencia: `{{ data:key }}`

### Opção B: Módulo Set Variable

1. Adicione módulo: **+** → **Tools**
2. Selecione **Set variable**
3. Configure cada variável antes do primeiro uso

---

## Passo 14: Ativar Cenário

1. No canto superior esquerdo, clique em **OFF** → **ON**
2. Agora o cenário está ativo e aguarda pushes do GitHub

---

## Troubleshooting Make

### Cenário não ativa com GitHub

1. Verifique se o webhook do GitHub foi criado:
   - GitHub Settings → Webhooks
   - Deve haver uma entrada do Make.com

2. Teste manualmente:
   - No módulo GitHub, clique em **Choose Data**
   - Selecione um commit recente

### Deploy não executa

1. Verifique o endpoint:
   ```bash
   curl -X POST https://seu-droplet.com/api/deploy \
     -H "Authorization: Bearer seu-token" \
     -d '{"branch":"main"}'
   ```

2. Verifique a resposta HTTP no módulo

### Meta tag não é encontrada

1. Teste o padrão regex manualmente:
   - Pattern: `<meta[^>]*google-site-verification[^>]*>`
   - Texto: Cole o HTML do seu site

2. Se não encontrar, verifique se a meta tag está no HTML

---

## Estrutura do Cenário Make

```
GitHub Webhook (Push)
    ↓
HTTP Request (Deploy)
    ↓
Sleep (30 sec)
    ↓
HTTP Request (Fetch HTML)
    ↓
Text Parser (Check Meta Tag)
    ↓
Router (Conditional)
    ├─ Sucesso
    │   ├─ Slack (Success)
    │   └─ Email (Success)
    └─ Erro
        ├─ Slack (Error)
        └─ Email (Error)
```

---

## Comparação: n8n vs Make

| Aspecto | n8n | Make |
|---------|-----|------|
| **Usabilidade** | Técnica, JSON | Visual, arrastar-soltar |
| **Custo** | Auto-hosted (grátis) | SaaS (começa $0) |
| **Flexibilidade** | Muito alta | Alta |
| **Escalabilidade** | Excelente | Boa |
| **Suporte** | Community | 24/7 |

---

## Próximas Melhorias

- Adicionar verificação de status HTTP (200 OK)
- Notify no Discord/Telegram
- Guardar histórico em planilha Google Sheets
- Retry automático se meta tag não for encontrada
- Alertas se deploy demorar mais de 60s

