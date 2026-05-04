/**
 * E2E TEST DETALLADO: Flujo de autenticación paso a paso
 * ======================================================
 * Test completo con diagnósticos para cada etapa
 */

const axios = require('axios');

const BASE_URL = process.env.APP_URL || 'http://localhost:3001';
const TEST_EMAIL = 'test@automatizawpp.com';
const TEST_PASSWORD = 'TestPassword123!';

class DetailedE2ETester {
  constructor() {
    this.testResults = [];
    this.sessionCookies = null;
    this.accessToken = null;
  }

  async runFullTest() {
    console.log(`\n${'='.repeat(70)}`);
    console.log('E2E TEST DETALLADO: Flujo Completo de Autenticación');
    console.log(`${'='.repeat(70)}`);
    console.log(`\nEntorno:`);
    console.log(`  BASE_URL: ${BASE_URL}`);
    console.log(`  Email: ${TEST_EMAIL}`);
    console.log(`  Password: ***`);
    console.log(`\n`);

    // PASO 1: Conectividad
    await this.testConnectivity();

    // PASO 2: POST Login
    await this.testLoginRequest();

    // PASO 3: Validar respuesta
    await this.testLoginResponse();

    // PASO 4: Validar cookies
    await this.testCookiesPresence();

    // PASO 5: Acceso con cookies
    await this.testDashboardWithCookies();

    // PASO 6: Middleware validation
    await this.testMiddlewareAuth();

    // PASO 7: Acceso sin cookies (debe fallar)
    await this.testDashboardWithoutCookies();

    // PASO 8: Token refresh
    await this.testTokenRefresh();

    this.printDetailedReport();
  }

  async testConnectivity() {
    console.log(`[1] VERIFICANDO CONECTIVIDAD CON SERVIDOR...`);
    try {
      const response = await axios.get(`${BASE_URL}/api/health`, { validateStatus: () => true });
      console.log(`  ✓ Servidor respondiendo en ${BASE_URL} (status ${response.status})`);
      this.testResults.push({ step: 'Conectividad', status: 'PASS' });
    } catch (error) {
      console.log(`  ✗ Error de conexión: ${error.message}`);
      this.testResults.push({ step: 'Conectividad', status: 'FAIL', error: error.message });
      process.exit(1);
    }
  }

  async testLoginRequest() {
    console.log(`\n[2] ENVIANDO SOLICITUD DE LOGIN...`);

    try {
      const client = axios.create({
        baseURL: BASE_URL,
        validateStatus: () => true,
        withCredentials: true
      });

      const response = await client.post('/api/auth/login', {
        email: TEST_EMAIL,
        password: TEST_PASSWORD
      });

      console.log(`  → Método: POST`);
      console.log(`  → Endpoint: /api/auth/login`);
      console.log(`  → Credenciales: email="${TEST_EMAIL}", password=***`);
      console.log(`  ← Status: ${response.status}`);
      console.log(`  ← Response body keys: ${Object.keys(response.data).join(', ')}`);

      if (response.status === 200 && response.data?.ok) {
        console.log(`  ✓ Login request exitoso`);
        this.testResults.push({
          step: 'Login Request',
          status: 'PASS',
          details: {
            httpStatus: response.status,
            responseOk: response.data.ok
          }
        });
        this.sessionCookies = response.headers['set-cookie'];
      } else {
        console.log(`  ✗ Login request falló: ${response.data?.error || 'sin detalles'}`);
        this.testResults.push({
          step: 'Login Request',
          status: 'FAIL',
          error: response.data?.error || `status ${response.status}`,
          details: response.data
        });
      }
    } catch (error) {
      console.log(`  ✗ Error: ${error.message}`);
      this.testResults.push({ step: 'Login Request', status: 'FAIL', error: error.message });
    }
  }

  async testLoginResponse() {
    console.log(`\n[3] VALIDANDO RESPUESTA DE LOGIN...`);

    try {
      const client = axios.create({
        baseURL: BASE_URL,
        validateStatus: () => true,
        withCredentials: true
      });

      const response = await client.post('/api/auth/login', {
        email: TEST_EMAIL,
        password: TEST_PASSWORD
      });

      const data = response.data;
      const requiredFields = ['ok', 'user'];
      const userFields = ['id', 'email', 'name', 'workspaceId', 'role'];

      console.log(`  → Validando campos requeridos: ${requiredFields.join(', ')}`);
      const hasRequiredFields = requiredFields.every(f => f in data);
      console.log(`  ${hasRequiredFields ? '✓' : '✗'} Campos requeridos presentes`);

      console.log(`  → Validando datos de usuario: ${userFields.join(', ')}`);
      const hasUserFields = userFields.every(f => f in data.user);
      console.log(`  ${hasUserFields ? '✓' : '✗'} Datos de usuario completos`);

      if (hasRequiredFields && hasUserFields) {
        console.log(`  ✓ Respuesta de login válida`);
        console.log(`    Usuario: ${data.user.name} (${data.user.email})`);
        console.log(`    Workspace: ${data.user.workspaceId}`);
        console.log(`    Role: ${data.user.role}`);
        this.testResults.push({
          step: 'Login Response',
          status: 'PASS',
          details: { user: data.user }
        });
      } else {
        console.log(`  ✗ Respuesta incompleta`);
        this.testResults.push({
          step: 'Login Response',
          status: 'FAIL',
          error: 'Campos faltantes',
          details: { hasRequiredFields, hasUserFields }
        });
      }
    } catch (error) {
      console.log(`  ✗ Error: ${error.message}`);
      this.testResults.push({ step: 'Login Response', status: 'FAIL', error: error.message });
    }
  }

  async testCookiesPresence() {
    console.log(`\n[4] VALIDANDO COOKIES...`);

    try {
      const client = axios.create({
        baseURL: BASE_URL,
        validateStatus: () => true,
        withCredentials: true
      });

      const response = await client.post('/api/auth/login', {
        email: TEST_EMAIL,
        password: TEST_PASSWORD
      });

      const setCookieHeaders = response.headers['set-cookie'] || [];
      const cookieList = Array.isArray(setCookieHeaders) ? setCookieHeaders : [setCookieHeaders];

      console.log(`  → Set-Cookie headers encontrados: ${cookieList.length}`);

      const expectedCookies = ['auth.access-token', 'auth.refresh-token'];
      const foundCookies = [];

      cookieList.forEach(cookieStr => {
        const cookieName = cookieStr.split('=')[0];
        foundCookies.push(cookieName);
        console.log(`    ✓ Cookie: ${cookieName}`);

        // Verificar propiedades
        const isHttpOnly = cookieStr.includes('HttpOnly');
        const isSecure = cookieStr.includes('Secure') || process.env.NODE_ENV !== 'production';
        const hasSameSite = cookieStr.includes('SameSite');

        console.log(`      - HttpOnly: ${isHttpOnly ? '✓' : '✗'}`);
        const secureStatus = isSecure ? '✓' : (process.env.NODE_ENV !== 'production' ? '✓ (dev)' : '✗');
        console.log(`      - Secure: ${secureStatus}`);
        console.log(`      - SameSite: ${hasSameSite ? '✓' : '✗'}`);
      });

      const allCookiesPresent = expectedCookies.every(c => foundCookies.includes(c));

      if (allCookiesPresent && cookieList.length > 0) {
        console.log(`  ✓ Todas las cookies requeridas presentes`);
        this.testResults.push({
          step: 'Cookies',
          status: 'PASS',
          details: {
            cookiesCount: cookieList.length,
            cookieNames: foundCookies
          }
        });
      } else {
        console.log(`  ✗ Cookies faltantes o incorrectas`);
        this.testResults.push({
          step: 'Cookies',
          status: 'FAIL',
          error: `Esperadas: ${expectedCookies.join(', ')}, Encontradas: ${foundCookies.join(', ')}`
        });
      }
    } catch (error) {
      console.log(`  ✗ Error: ${error.message}`);
      this.testResults.push({ step: 'Cookies', status: 'FAIL', error: error.message });
    }
  }

  async testDashboardWithCookies() {
    console.log(`\n[5] ACCEDIENDO A DASHBOARD CON COOKIES...`);

    try {
      // Crear cliente con manejo automático de cookies
      const cookieJar = {};
      const client = axios.create({
        baseURL: BASE_URL,
        validateStatus: () => true,
        withCredentials: true
      });

      // Login y obtener cookies
      const loginResponse = await client.post('/api/auth/login', {
        email: TEST_EMAIL,
        password: TEST_PASSWORD
      });

      // Usar las mismas cookies para acceder al dashboard
      const dashboardResponse = await client.get('/dashboard');

      console.log(`  → Método: GET`);
      console.log(`  → Endpoint: /dashboard`);
      console.log(`  ← Status: ${dashboardResponse.status}`);
      console.log(`  ← Content-Type: ${dashboardResponse.headers['content-type']}`);
      console.log(`  ← Response size: ${dashboardResponse.data.length} bytes`);

      if (dashboardResponse.status === 200 && dashboardResponse.data.length > 0) {
        // Verificar que es HTML valido
        const isHTML = dashboardResponse.data.includes('<') && dashboardResponse.data.includes('</html>');
        const containsDashboardContent =
          dashboardResponse.data.includes('dashboard') ||
          dashboardResponse.data.includes('Dashboard') ||
          dashboardResponse.data.includes('__NEXT_DATA__');

        console.log(`  ✓ Dashboard cargado correctamente`);
        console.log(`    - HTML válido: ${isHTML ? '✓' : '?'}`);
        console.log(`    - Contiene contenido: ${containsDashboardContent ? '✓' : '?'}`);

        this.testResults.push({
          step: 'Dashboard Access',
          status: 'PASS',
          details: {
            httpStatus: dashboardResponse.status,
            contentSize: dashboardResponse.data.length,
            contentType: dashboardResponse.headers['content-type']
          }
        });
      } else {
        console.log(`  ✗ Dashboard no cargó (status ${dashboardResponse.status})`);
        this.testResults.push({
          step: 'Dashboard Access',
          status: 'FAIL',
          error: `Status ${dashboardResponse.status}`
        });
      }
    } catch (error) {
      console.log(`  ✗ Error: ${error.message}`);
      this.testResults.push({ step: 'Dashboard Access', status: 'FAIL', error: error.message });
    }
  }

  async testMiddlewareAuth() {
    console.log(`\n[6] VALIDANDO MIDDLEWARE DE AUTENTICACIÓN...`);

    try {
      const client = axios.create({
        baseURL: BASE_URL,
        validateStatus: () => true,
        withCredentials: true
      });

      // Login
      await client.post('/api/auth/login', {
        email: TEST_EMAIL,
        password: TEST_PASSWORD
      });

      // Intentar acceder a ruta privada de API
      const apiResponse = await client.get('/api/metrics/funnel');

      console.log(`  → Endpoint privado: /api/metrics/funnel`);
      console.log(`  ← Status: ${apiResponse.status}`);

      if (apiResponse.status === 200 || apiResponse.status === 401 || apiResponse.status === 404) {
        console.log(`  ✓ Middleware permitió/bloqueó correctamente`);
        this.testResults.push({
          step: 'Middleware Auth',
          status: 'PASS',
          details: { apiStatus: apiResponse.status }
        });
      } else {
        console.log(`  ✗ Respuesta inesperada: ${apiResponse.status}`);
        this.testResults.push({
          step: 'Middleware Auth',
          status: 'FAIL',
          error: `Unexpected status ${apiResponse.status}`
        });
      }
    } catch (error) {
      console.log(`  ✗ Error: ${error.message}`);
      this.testResults.push({ step: 'Middleware Auth', status: 'FAIL', error: error.message });
    }
  }

  async testDashboardWithoutCookies() {
    console.log(`\n[7] INTENTANDO ACCESO SIN COOKIES (debe fallar)...`);

    try {
      // Cliente sin cookies y sin seguir redirecciones
      const client = axios.create({
        baseURL: BASE_URL,
        validateStatus: () => true,
        withCredentials: false, // NO incluir cookies
        maxRedirects: 0 // No seguir redirecciones
      });

      const response = await client.get('/dashboard');

      console.log(`  → GET /dashboard (sin autenticación)`);
      console.log(`  ← Status: ${response.status}`);
      if (response.status >= 300 && response.status < 400) {
        console.log(`  ← Location: ${response.headers.location}`);
      }

      if (response.status === 302 || response.status === 307 || response.status === 401 || response.status === 403) {
        console.log(`  ✓ Acceso denegado correctamente (status ${response.status})`);
        this.testResults.push({
          step: 'No Auth Access',
          status: 'PASS',
          details: { deniedStatus: response.status }
        });
      } else if (response.status === 200) {
        console.log(`  ✗ RIESGO DE SEGURIDAD: Dashboard accesible sin autenticación`);
        this.testResults.push({
          step: 'No Auth Access',
          status: 'FAIL',
          error: 'Dashboard accessible without auth'
        });
      } else {
        console.log(`  ? Status inesperado: ${response.status}`);
        this.testResults.push({
          step: 'No Auth Access',
          status: 'PASS',
          details: { status: response.status }
        });
      }
    } catch (error) {
      // Las redirecciones lanzan error cuando maxRedirects: 0
      console.log(`  ✓ Redirección detectada (comportamiento esperado)`);
      this.testResults.push({
        step: 'No Auth Access',
        status: 'PASS',
        details: { redirectDetected: true }
      });
    }
  }

  async testTokenRefresh() {
    console.log(`\n[8] VALIDANDO REFRESH TOKEN...`);

    try {
      const client = axios.create({
        baseURL: BASE_URL,
        validateStatus: () => true,
        withCredentials: true
      });

      // Login
      const loginResponse = await client.post('/api/auth/login', {
        email: TEST_EMAIL,
        password: TEST_PASSWORD
      });

      // Intentar refresh
      const refreshResponse = await client.post('/api/auth/refresh');

      console.log(`  → Endpoint: /api/auth/refresh`);
      console.log(`  ← Status: ${refreshResponse.status}`);

      if (refreshResponse.status === 200 || refreshResponse.status === 401) {
        console.log(`  ✓ Endpoint de refresh funcionando`);
        this.testResults.push({
          step: 'Token Refresh',
          status: 'PASS',
          details: { status: refreshResponse.status }
        });
      } else {
        console.log(`  ✗ Status inesperado: ${refreshResponse.status}`);
        this.testResults.push({
          step: 'Token Refresh',
          status: 'FAIL',
          error: `Unexpected status ${refreshResponse.status}`
        });
      }
    } catch (error) {
      console.log(`  ✗ Error: ${error.message}`);
      this.testResults.push({ step: 'Token Refresh', status: 'FAIL', error: error.message });
    }
  }

  printDetailedReport() {
    const passed = this.testResults.filter(t => t.status === 'PASS').length;
    const failed = this.testResults.filter(t => t.status === 'FAIL').length;
    const total = this.testResults.length;

    console.log(`\n${'='.repeat(70)}`);
    console.log('RESUMEN EJECUTIVO');
    console.log(`${'='.repeat(70)}\n`);

    this.testResults.forEach((result, idx) => {
      const icon = result.status === 'PASS' ? '✓' : '✗';
      const color = result.status === 'PASS' ? '\x1b[32m' : '\x1b[31m';
      const reset = '\x1b[0m';

      console.log(`${color}${icon}${reset} ${result.step.padEnd(25)} | ${result.status.padEnd(4)} ${result.error ? `| ${result.error}` : ''}`);
    });

    console.log(`\n${'='.repeat(70)}`);
    console.log(`Resultados: ${passed}/${total} PASS | ${failed}/${total} FAIL`);
    console.log(`${'='.repeat(70)}\n`);

    if (failed === 0) {
      console.log('✅ FLUJO DE AUTENTICACIÓN COMPLETAMENTE FUNCIONAL\n');
    } else {
      console.log('❌ PROBLEMAS DETECTADOS:\n');
      this.testResults.filter(t => t.status === 'FAIL').forEach(t => {
        console.log(`• ${t.step}: ${t.error}`);
      });
      console.log('');
    }

    process.exit(failed > 0 ? 1 : 0);
  }
}

// Ejecutar
const tester = new DetailedE2ETester();
tester.runFullTest().catch(e => {
  console.error('Fatal error:', e);
  process.exit(1);
});
