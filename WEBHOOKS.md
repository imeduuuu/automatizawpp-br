# 🔗 Configuración de Webhooks - Sales OS

## Quick Start

**Endpoint:** `POST /api/webhooks/bird`

**URL Producción:** `https://automatizawpp.com/api/webhooks/bird`

---

## 📧 Email (Bird API)

### Payload Structure

```json
{
  "type": "message.inbound",
  "workspace": {
    "id": "5996a896-da81-4c26-a3e9-7e9cf949228f"
  },
  "channel": {
    "id": "2df369b3-1b9a-52b0-89b2-0cd1fb68082e",
    "platform": "email"
  },
  "message": {
    "id": "msg-12345",
    "body": {
      "type": "text",
      "text": {
        "text": "Contenido del mensaje"
      }
    },
    "createdAt": "2026-04-29T10:30:00Z"
  },
  "conversation": {
    "id": "conv-abc123"
  },
  "contact": {
    "id": "contact-xyz789",
    "displayName": "Nombre Cliente",
    "identifiers": [
      {"key": "email", "value": "cliente@empresa.com"},
      {"key": "phone", "value": "+34612345678"}
    ]
  }
}
```

---

## 💬 WhatsApp (Bird API)

### Cambios vs Email:

- `channel.platform`: `"whatsapp"` (en lugar de "email")
- No incluir subject
- `contact.identifiers`: típicamente solo phone
- `message.id`: prefijo "wa-" (ej: `wa-msg-12345`)

### Payload Example

```json
{
  "type": "message.inbound",
  "workspace": {"id": "5996a896-da81-4c26-a3e9-7e9cf949228f"},
  "channel": {"id": "2df369b3-1b9a-52b0-89b2-0cd1fb68082e", "platform": "whatsapp"},
  "message": {
    "id": "wa-msg-98765",
    "body": {"type": "text", "text": {"text": "Hola 👋 ¿Cuál es el precio?"}},
    "createdAt": "2026-04-29T10:45:00Z"
  },
  "conversation": {"id": "wa-conv-456"},
  "contact": {
    "id": "wa-contact-111",
    "displayName": "María López",
    "identifiers": [{"key": "phone", "value": "+34698765432"}]
  }
}
```

---

## 🔧 n8n Configuration

### Option 1: Direct HTTP Request

```
HTTP Request Node:
├─ Method: POST
├─ URL: http://localhost:3000/api/webhooks/bird
├─ Headers:
│  └─ Content-Type: application/json
└─ Body: Map fields from Bird webhook
```

### Option 2: Using n8n Webhook

```
Webhook Trigger (Bird events)
    ↓
Transform/Map data
    ↓
HTTP Request (POST to /api/webhooks/bird)
```

---

## 🧪 Testing

### Email Test
```bash
curl -X POST http://localhost:3000/api/webhooks/bird \
  -H "Content-Type: application/json" \
  -d '{"type":"message.inbound","workspace":{"id":"test"},"channel":{"id":"email","platform":"email"},"message":{"id":"msg-1","body":{"type":"text","text":{"text":"Test email"}},"createdAt":"2026-04-29T10:00:00Z"},"conversation":{"id":"conv-1"},"contact":{"id":"c1","displayName":"Test User","identifiers":[{"key":"email","value":"test@example.com"}]}}'
```

### Expected Response
```json
{
  "ok": true,
  "leadId": "clxx...yyyy",
  "agent": "ORCHESTRATOR",
  "summary": "Orchestrator selected action: RESPOND",
  "delivery": {
    "sent": true,
    "messageId": "brevo-msg-id"
  }
}
```

---

## 📊 Flow Diagram

```
Bird Platform (Email/WhatsApp)
    ↓
[External Webhook] → n8n (optional transform)
    ↓
POST /api/webhooks/bird
    ↓
normalizeBirdEvent()  // Parse + validate
    ↓
runSalesOrchestration()
    ├─ Find/Create Lead
    ├─ Store Message
    ├─ Check Compliance (opt-out, touches, quiet hours)
    ├─ Run Orchestrator Agent
    ├─ Execute Action Agent
    └─ Route Response (Email/WhatsApp)
    ↓
Response sent back via Brevo/Bird
```

---

## ✅ Supported Platforms

| Platform | Detected by | Example |
|----------|------------|---------|
| Email | `platform: "email"` or has subject | Business inquiry |
| WhatsApp | `platform: "whatsapp"` or "wa" | Customer question |
| SMS | `platform: "sms"` | Text message |

---

## 🔐 Security Notes

- Validate `workspace.id` matches configured workspace
- Verify webhook origin (Bird IP whitelist)
- Rate limit: 100 req/min per workspace
- Retry strategy: 3 attempts with exponential backoff

---

## 📝 Required Environment Variables

```
BIRD_API_KEY=your_bird_api_key
BIRD_WORKSPACE_ID=5996a896-da81-4c26-a3e9-7e9cf949228f
BIRD_CHANNEL_ID=2df369b3-1b9a-52b0-89b2-0cd1fb68082e
BIRD_EMAIL_CHANNEL_ID=email-channel-id
BREVO_API_KEY=your_brevo_key
```

---

## 🐛 Debugging

Enable debug logs:
```bash
DEBUG=sales-os:* npm run dev
```

Check webhook deliveries:
```sql
SELECT * FROM "Conversation" WHERE createdAt > NOW() - INTERVAL '1 hour';
SELECT * FROM "Message" WHERE direction = 'INBOUND' ORDER BY createdAt DESC;
```

---

## 📚 References

- [Bird API Docs](https://docs.bird.com/)
- [n8n HTTP Node](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base-httprequest/)
- [Sales OS Architecture](./ESTRUCTURA-MAESTRA.md)
