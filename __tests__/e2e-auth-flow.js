/**
 * E2E TEST: Flujo completo de autenticación
 * ==========================================
 * 1. POST /api/auth/login con credenciales correctas
 * 2. Verifica que retorna 200 y cookies
 * 3. GET /dashboard con esas cookies
 * 4. Verifica que el dashboard carga
 */

const axios = require('axios');

const BASE_URL = process.env.APP_URL || 'http://192.168.1.37:3000';

class AuthFlowTester {
  constructor() {
    this.results = [];
    this.accessToken = null;
    this.cookies = [];
    this.client = axios.create({
      baseURL: BASE_URL,
      validateStatus: () => true, // No lanzar errores por status codes
      withCredentials: true, // Incluir cookies automáticamente
      jar: new (require('tough-cookie')).CookieJar() // Mantener cookies entre requests
    });
  }

  async runAllTests() {
    console.log(`\n${'='.repeat(60)}`);
    console.log('E2E TEST: Flujo de Autenticación Completo');
    console.log(`BASE_URL: ${BASE_URL}`);
    console.log(`${'='.repeat(60)}\n`);

    // Test 1: POST /api/auth/login
    await this.testLoginEndpoint();

    // Test 2: Verificar cookies en respuesta
    await this.testLoginCookies();

    // Test 3: GET /dashboard con cookies
    if (this.accessToken) {
      await this.testDashboardAccess();
    } else {
      this.results.push({
        name: 'Test 3: GET /dashboard con cookies',
        status: 'FAIL',
        error: 'No se obtuvo access token en Test 1',
        details: {}
      });
    }

    // Imprimir resultados
    this.printResults();
  }

  async testLoginEndpoint() {
    const testName = 'Test 1: POST /api/auth/login con credenciales correctas';
    console.log(`\n[1/3] ${testName}...`);

    try {
      // Credenciales de prueba (admin por defecto)
      const credentials = {
        email: 'admin@automatizawpp.com',
        password: 'SecurePassword123!'
      };

      console.log(`  → Enviando POST ${BASE_URL}/api/auth/login`);
      console.log(`  → Credenciales: email=${credentials.email}, password=***`);

      const response = await this.client.post('/api/auth/login', credentials);

      const status = response.status;
      const statusOk = status === 200;
      const responseOk = response.data?.ok === true;

      console.log(`  ← Status: ${status}`);
      console.log(`  ← Response.ok: ${responseOk}`);
      console.log(`  ← User: ${response.data?.user?.email || 'N/A'}`);
      console.log(`  ← Set-Cookie: ${response.headers['set-cookie'] ? 'presente' : 'ausente'}`);

      if (statusOk && responseOk) {
        this.accessToken = response.data.accessToken || 'token-from-cookie';
        this.results.push({
          name: testName,
          status: 'PASS',
          details: {
            httpStatus: status,
            responseOk: responseOk,
            user: response.data.user,
            setCookieHeader: !!response.headers['set-cookie']
          }
        });
        console.log(`  ✓ PASS: Login exitoso (status ${status})`);
      } else {
        this.results.push({
          name: testName,
          status: 'FAIL',
          error: `Status ${status}, response.ok=${responseOk}`,
          details: {
            httpStatus: status,
            responseData: response.data,
            statusText: response.statusText
          }
        });
        console.log(`  ✗ FAIL: ${status} ${response.data?.error || 'sin detalles'}`);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.results.push({
        name: testName,
        status: 'FAIL',
        error: errorMsg,
        details: { errorType: error?.constructor?.name }
      });
      console.log(`  ✗ ERROR: ${errorMsg}`);
    }
  }

  async testLoginCookies() {
    const testName = 'Test 2: Verifica que retorna 200 y cookies';
    console.log(`\n[2/3] ${testName}...`);

    try {
      const credentials = {
        email: 'admin@automatizawpp.com',
        password: 'SecurePassword123!'
      };

      console.log(`  → Realizando nuevo POST para verificar cookies`);
      const response = await this.client.post('/api/auth/login', credentials);

      const setCookieHeaders = response.headers['set-cookie'];
      const hasCookies = !!setCookieHeaders;
      const cookieList = Array.isArray(setCookieHeaders) ? setCookieHeaders : (setCookieHeaders ? [setCookieHeaders] : []);

      console.log(`  ← Set-Cookie headers: ${cookieList.length} encontradas`);
      if (cookieList.length > 0) {
        cookieList.forEach((cookie, idx) => {
          const cookieName = cookie.split('=')[0];
          console.log(`    [${idx + 1}] ${cookieName}`);
        });
      }

      const status = response.status;
      const isStatus200 = status === 200;

      if (isStatus200 && hasCookies) {
        this.cookies = cookieList;
        this.results.push({
          name: testName,
          status: 'PASS',
          details: {
            httpStatus: status,
            cookiesCount: cookieList.length,
            cookieNames: cookieList.map(c => c.split('=')[0]).join(', ')
          }
        });
        console.log(`  ✓ PASS: Retorna 200 + ${cookieList.length} cookies`);
      } else {
        this.results.push({
          name: testName,
          status: 'FAIL',
          error: `Status ${status}, cookies=${hasCookies}`,
          details: {
            httpStatus: status,
            hasCookies,
            cookiesCount: cookieList.length
          }
        });
        console.log(`  ✗ FAIL: Status ${status}, cookies presentes=${hasCookies}`);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.results.push({
        name: testName,
        status: 'FAIL',
        error: errorMsg,
        details: {}
      });
      console.log(`  ✗ ERROR: ${errorMsg}`);
    }
  }

  async testDashboardAccess() {
    const testName = 'Test 3: GET /dashboard con esas cookies';
    console.log(`\n[3/3] ${testName}...`);

    try {
      // Primero loguearse para obtener cookies
      console.log(`  → Preparando cookies de sesión...`);
      const credentials = {
        email: 'admin@automatizawpp.com',
        password: 'SecurePassword123!'
      };

      const loginResponse = await this.client.post('/api/auth/login', credentials);
      const loginStatus = loginResponse.status;

      if (loginStatus !== 200) {
        this.results.push({
          name: testName,
          status: 'FAIL',
          error: `No se pudo completar login (status ${loginStatus})`,
          details: { loginStatus, error: loginResponse.data?.error }
        });
        console.log(`  ✗ FAIL: No se pudo completar login (${loginStatus})`);
        return;
      }

      // Ahora intentar acceder al dashboard
      console.log(`  → Enviando GET ${BASE_URL}/dashboard con cookies`);
      const dashboardResponse = await this.client.get('/dashboard');

      const dashboardStatus = dashboardResponse.status;
      const isDashboardLoaded =
        (dashboardStatus === 200 || dashboardStatus === 304) &&
        dashboardResponse.data &&
        dashboardResponse.data.length > 0;

      console.log(`  ← Status: ${dashboardStatus}`);
      console.log(`  ← Response type: ${typeof dashboardResponse.data}`);
      console.log(`  ← Response size: ${typeof dashboardResponse.data === 'string' ? dashboardResponse.data.length : 'N/A'} bytes`);

      // Diagnosticar qué pasó
      if (dashboardStatus === 401 || dashboardStatus === 403) {
        console.log(`  → Diagnosis: Acceso denegado (${dashboardStatus}) - Las cookies no se enviaron o no son válidas`);
      } else if (dashboardStatus === 404) {
        console.log(`  → Diagnosis: Ruta no encontrada (404)`);
      }

      if (isDashboardLoaded) {
        this.results.push({
          name: testName,
          status: 'PASS',
          details: {
            httpStatus: dashboardStatus,
            responseSize: typeof dashboardResponse.data === 'string' ? dashboardResponse.data.length : 0,
            hasContent: !!dashboardResponse.data
          }
        });
        console.log(`  ✓ PASS: Dashboard cargado (status ${dashboardStatus})`);
      } else {
        this.results.push({
          name: testName,
          status: 'FAIL',
          error: `Status ${dashboardStatus}, no hay contenido o acceso denegado`,
          details: {
            httpStatus: dashboardStatus,
            hasContent: !!dashboardResponse.data,
            dataType: typeof dashboardResponse.data,
            dataPreview: typeof dashboardResponse.data === 'string' ? dashboardResponse.data.substring(0, 200) : 'N/A'
          }
        });
        console.log(`  ✗ FAIL: Status ${dashboardStatus}`);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.results.push({
        name: testName,
        status: 'FAIL',
        error: errorMsg,
        details: {}
      });
      console.log(`  ✗ ERROR: ${errorMsg}`);
    }
  }

  printResults() {
    console.log(`\n${'='.repeat(60)}`);
    console.log('RESUMEN DE RESULTADOS');
    console.log(`${'='.repeat(60)}\n`);

    const passed = this.results.filter(r => r.status === 'PASS').length;
    const failed = this.results.filter(r => r.status === 'FAIL').length;
    const total = this.results.length;

    this.results.forEach((result, idx) => {
      const icon = result.status === 'PASS' ? '✓' : '✗';
      const color = result.status === 'PASS' ? '\x1b[32m' : '\x1b[31m';
      const reset = '\x1b[0m';

      console.log(`${color}${icon} ${result.name}${reset}`);
      if (result.error) {
        console.log(`  Error: ${result.error}`);
      }
      if (Object.keys(result.details).length > 0) {
        console.log(`  Detalles: ${JSON.stringify(result.details, null, 2)}`);
      }
      console.log('');
    });

    console.log(`${'='.repeat(60)}`);
    console.log(`Total: ${total} tests | Pasados: ${passed} | Fallidos: ${failed}`);
    console.log(`${'='.repeat(60)}\n`);

    if (failed > 0) {
      console.log('PROBLEMAS ENCONTRADOS:\n');
      this.results
        .filter(r => r.status === 'FAIL')
        .forEach(r => {
          console.log(`• ${r.name}`);
          if (r.error) console.log(`  Error: ${r.error}`);
        });
      console.log('');
    }

    process.exit(failed > 0 ? 1 : 0);
  }
}

// Ejecutar tests
const tester = new AuthFlowTester();
tester.runAllTests().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
