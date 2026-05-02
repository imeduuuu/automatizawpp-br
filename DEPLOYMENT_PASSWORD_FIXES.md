# Deployment Guide: Password Verification Security Fixes

**Status:** Ready for deployment  
**Created:** 2026-05-02  
**Test Coverage:** 22/22 passing  

---

## Pre-Deployment Checklist

### Code Review
- [x] src/lib/auth/password.ts — Reviewed and validated
- [x] src/auth.ts — Reviewed and validated  
- [x] src/app/api/account/password/route.ts — Reviewed and validated
- [x] src/lib/actions/account-actions.ts — Reviewed and validated
- [x] Tests created and passing (22/22)

### Build Verification
```bash
npm run build  # ✅ Success
npm test -- src/lib/auth/__tests__/password.test.ts  # ✅ 22/22 passing
```

### Backward Compatibility
- ✅ `verifyPassword()` signature unchanged (string, string) -> Promise<boolean>
- ✅ `hashPassword()` signature unchanged (string) -> Promise<string>
- ✅ All existing callers compatible
- ✅ No database migrations required
- ✅ No API changes

---

## Deployment Steps

### Step 1: Staging Deployment
```bash
# Pull the latest changes
git pull origin main

# Verify tests pass
npm test -- src/lib/auth/__tests__/password.test.ts

# Deploy to staging
npm run build
# Deploy to staging environment
```

### Step 2: Staging Testing (Manual)

**Test Scenarios:**

1. **Valid Login**
   - Email: test@example.com
   - Password: Test123456!
   - Expected: Login successful

2. **Invalid Password**
   - Email: test@example.com  
   - Password: WrongPassword123
   - Expected: "Invalid password" error

3. **Change Password**
   - Current: Test123456!
   - New: NewPassword123!
   - Expected: Password changed successfully

4. **Edge Cases**
   - Very long password (>72 chars): Should be rejected by form validation
   - Special characters: Should work (é, ñ, @, #, etc)
   - Password with spaces: Should work
   - Case sensitive: "Test123" != "test123" (should both work but be different)

5. **Error Scenarios**
   - Non-existent user: Should show generic "Invalid credentials"
   - Database connection failure: Should show clear error message
   - Hash corruption: Should log error, show "Unable to verify password"

### Step 3: Performance Testing

**Expectations:**
- Login time: ~250-300ms (bcrypt.compare() with SALT_ROUNDS=12)
- Password change: ~250-300ms (bcrypt.hash() + bcrypt.compare())
- Should NOT timeout at 5 seconds

**Test with Load Generator:**
```bash
# Simulate 10 concurrent login attempts
# Expected: All succeed within 2 seconds
```

### Step 4: Logging Verification

**Check logs for:**
```
[Auth.authorize] Hash bcrypt inválido en BD
[Password.verify] Password debe ser string
[Password.verify] Hash no es un formato bcrypt válido
[changePasswordAction] Error al hashear
```

These should only appear in error cases. Normal logins should NOT produce these logs.

### Step 5: Production Deployment

Once staging tests pass:

```bash
# Deploy to production
git push origin main
# Production deployment pipeline runs
```

---

## Rollback Plan

If issues occur in production:

1. **Revert commit (if needed):**
   ```bash
   git revert <commit-hash>
   git push origin main
   ```

2. **Restore previous behavior:**
   - The old password.ts is minimal, no breaking changes
   - All auth endpoints remain functional
   - Users can still login during rollback

3. **Affected systems:**
   - Login page: Not affected
   - Password change: May log errors, but will work
   - Password reset: Not directly affected

---

## Monitoring Post-Deployment

### Key Metrics to Track

1. **Authentication Success Rate**
   - Expected: No change (same pass/fail behavior)
   - Monitor: Login success % for 24 hours

2. **Response Times**
   - Expected: ~250-300ms per login
   - Monitor: P50, P95, P99 latency

3. **Error Logs**
   - Expected: No new error patterns
   - Monitor: "[Password.verify]" entries
   - Monitor: "[Auth.authorize]" entries

4. **Timeout Events**
   - Expected: 0 timeouts (5s timeout only if bcrypt.compare hangs)
   - Monitor: "Timeout en bcrypt.compare" errors

### Alerts to Create

```yaml
Alert 1: Password verification timeout
  Metric: "[Password.verify] Timeout" in logs
  Condition: > 0 errors in 5 min
  Action: Page on-call engineer

Alert 2: Invalid hash in database
  Metric: "[Auth.authorize] Hash bcrypt inválido" in logs
  Condition: > 5 errors in 5 min
  Action: Page DBA for data integrity check

Alert 3: bcrypt.compare errors
  Metric: "[Password.verify] Error de bcrypt" in logs
  Condition: > 10 errors in 5 min
  Action: Investigate bcrypt version/system resources
```

---

## Known Limitations / Considerations

1. **Timeout of 5 seconds**
   - If bcrypt.compare() takes > 5s, password check fails
   - This is extremely unlikely (would indicate system issues)
   - Timeout is intentional DoS mitigation

2. **Hash validation regex**
   - Validates bcrypt format ($2a$, $2b$, $2y$)
   - Does NOT validate the hash will successfully compute
   - This is by design (early detection of corrupted hashes)

3. **Password length limit of 72 characters**
   - bcrypt only processes first 72 chars
   - Longer passwords are rejected early
   - Prevents silent truncation

4. **No automatic password hash upgrade**
   - Hashes stored with SALT_ROUNDS=12
   - If bcrypt version changes, hashes remain valid
   - No migration needed

---

## Success Criteria

Deployment is successful when:

- [x] All 22 tests passing locally
- [ ] All 22 tests passing in CI/CD pipeline
- [ ] Staging deployment successful
- [ ] Manual testing passes all scenarios
- [ ] Performance tests show ~250-300ms per auth operation
- [ ] No new error logs after 24 hours in staging
- [ ] Production deployment completes without errors
- [ ] Login success rate same as baseline after 24 hours
- [ ] No timeout alerts triggered
- [ ] No hash corruption alerts triggered

---

## Files Changed Summary

| File | Type | Impact |
|------|------|--------|
| src/lib/auth/password.ts | Rewrite | Core auth functions, better error handling |
| src/auth.ts | Update | Hash validation, improved logging |
| src/app/api/account/password/route.ts | Update | Hash validation, error handling |
| src/lib/actions/account-actions.ts | Update | Hash validation, error handling |
| src/lib/auth/__tests__/password.test.ts | New | 22 comprehensive tests |
| SECURITY_AUDIT_PASSWORD_VERIFICATION.md | New | Documentation |

---

## Questions / Support

**If password verification fails in staging:**
1. Check logs for "[Password.verify]" errors
2. Verify hash in database is valid bcrypt format
3. Check system resources (CPU, memory) during auth spike
4. Verify bcryptjs package version (^2.4.3)

**If performance is degraded:**
1. 250-300ms per login is NORMAL (bcrypt is intentionally slow)
2. Check system CPU usage
3. Verify SALT_ROUNDS=12 in password.ts
4. Monitor with load test to identify bottleneck

**For urgent issues:**
- Contact: [On-call engineer]
- Rollback available at git history

---

## Appendix: Test Results

```
Test Suites: 1 passed, 1 total
Tests:       22 passed, 22 total
Time:        5.982 s

Coverage:
- isValidBcryptHash: 6 tests
- hashPassword: 4 tests  
- verifyPassword: 8 tests
- Edge cases: 4 tests

All tests ✅ PASSING
```

---

**Deployment ready. Proceed when staged testing complete.**
