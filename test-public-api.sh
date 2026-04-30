#!/bin/bash

# Test script for Public Dashboard API
# Substitua YOUR_TOKEN_HERE pelo valor de PUBLIC_DASHBOARD_TOKEN

TOKEN="YOUR_TOKEN_HERE"
BASE_URL="http://localhost:3000"

echo "Public Dashboard API - Test Script"
echo "==================================="
echo ""

# 1. Test /api/public/leads
echo "Test 1: GET /api/public/leads"
echo "Command:"
echo "curl -X GET '$BASE_URL/api/public/leads?status=QUALIFIED&page=1&limit=5' \\"
echo "  -H 'Authorization: Bearer $TOKEN'"
echo ""
echo "Response:"
curl -X GET "$BASE_URL/api/public/leads?status=QUALIFIED&page=1&limit=5" \
  -H "Authorization: Bearer $TOKEN" | jq .
echo ""
echo "---"
echo ""

# 2. Test /api/public/conversations
echo "Test 2: GET /api/public/conversations"
echo "Command:"
echo "curl -X GET '$BASE_URL/api/public/conversations?channel=EMAIL&page=1' \\"
echo "  -H 'Authorization: Bearer $TOKEN'"
echo ""
echo "Response:"
curl -X GET "$BASE_URL/api/public/conversations?channel=EMAIL&page=1" \
  -H "Authorization: Bearer $TOKEN" | jq .
echo ""
echo "---"
echo ""

# 3. Test /api/public/analytics
echo "Test 3: GET /api/public/analytics"
echo "Command:"
echo "curl -X GET '$BASE_URL/api/public/analytics' \\"
echo "  -H 'Authorization: Bearer $TOKEN'"
echo ""
echo "Response:"
curl -X GET "$BASE_URL/api/public/analytics" \
  -H "Authorization: Bearer $TOKEN" | jq .
echo ""
echo "---"
echo ""

# 4. Test unauthorized access
echo "Test 4: GET /api/public/leads without token (should fail with 401)"
echo "Command:"
echo "curl -X GET '$BASE_URL/api/public/leads'"
echo ""
echo "Response:"
curl -X GET "$BASE_URL/api/public/leads" | jq .
echo ""

echo "Test completed!"
