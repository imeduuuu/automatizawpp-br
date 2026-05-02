# Bird Email -> AI -> Auto Reply

Use this mapping in n8n when Bird delivers an inbound email event.

## Target endpoint

`POST /api/events/inbound`

## Recommended payload

```json
{
  "workspaceId": "demo_workspace",
  "channel": "EMAIL",
  "message": "Hola, quiero saber como automatizar mi WhatsApp.",
  "subject": "Consulta sobre AutomatizaWPP",
  "threadRef": "bird-thread-123",
  "messageId": "bird-message-456",
  "receivedAt": "2026-04-28T10:32:00.000Z",
  "lead": {
    "fullName": "Joao Silva",
    "email": "joao@example.com",
    "source": "BIRD_EMAIL"
  },
  "metadata": {
    "provider": "bird",
    "from": "joao@example.com",
    "to": "hola@automatizawpp.com",
    "inReplyTo": "<prior-message-id>",
    "references": ["<prior-message-id>"],
    "birdConversationId": "bird-thread-123"
  }
}
```

## What the app now does

1. Resolves or creates the lead by email.
2. Creates or updates the open `EMAIL` conversation.
3. Persists the inbound message with subject, thread ref, message id and metadata.
4. Runs the AI orchestration.
5. Sends the outbound reply through the app email provider stack.
6. Returns delivery status so n8n can retry or alert.

## Response fields to watch in n8n

```json
{
  "ok": true,
  "leadId": "...",
  "route": { "action": "..." },
  "results": [],
  "delivery": {
    "channel": "EMAIL",
    "sent": true,
    "provider": "brevo",
    "externalId": "mail-...",
    "error": null
  }
}
```

If `delivery.sent !== true`, route the execution to retry, alert, or human review.

## n8n notes

- Strip quoted thread history if Bird provides the full email chain.
- Prefer the plain text body for `message`.
- Keep the original subject so the app can reply using `Re:`.
- Pass provider ids in `metadata` even if the app does not use them yet.
