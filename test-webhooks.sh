#!/bin/bash

echo "🧪 Testeando webhook Bird → Sales OS"
echo "======================================"
echo ""

# Test 1: Email Inbound
echo "📧 Test 1: Email Inbound"
curl -X POST http://localhost:3000/api/webhooks/bird \
  -H "Content-Type: application/json" \
  -d '{
    "type": "message.inbound",
    "workspace": {"id": "test-workspace-123"},
    "channel": {"id": "email-channel", "platform": "email"},
    "message": {
      "id": "msg-email-001",
      "body": {"type": "text", "text": {"text": "Hola, me gustaría conocer más sobre vuestros servicios de automatización B2B"}},
      "createdAt": "2026-04-29T10:30:00Z"
    },
    "conversation": {"id": "conv-email-001"},
    "contact": {
      "id": "contact-email-001",
      "displayName": "Juan Martínez",
      "identifiers": [
        {"key": "email", "value": "juan@empresa.com"},
        {"key": "phone", "value": "+34612345678"}
      ]
    }
  }' -s | jq .

echo ""
echo "---"
echo ""

# Test 2: WhatsApp Inbound
echo "💬 Test 2: WhatsApp Inbound"
curl -X POST http://localhost:3000/api/webhooks/bird \
  -H "Content-Type: application/json" \
  -d '{
    "type": "message.inbound",
    "workspace": {"id": "test-workspace-456"},
    "channel": {"id": "wa-channel", "platform": "whatsapp"},
    "message": {
      "id": "msg-wa-002",
      "body": {"type": "text", "text": {"text": "¿Cuál es el precio? 💰"}},
      "createdAt": "2026-04-29T11:00:00Z"
    },
    "conversation": {"id": "conv-wa-002"},
    "contact": {
      "id": "contact-wa-002",
      "displayName": "María González",
      "identifiers": [
        {"key": "phone", "value": "+34698765432"}
      ]
    }
  }' -s | jq .

echo ""
echo "======================================"
echo "✅ Tests completados"
