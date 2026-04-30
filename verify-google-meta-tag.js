#!/usr/bin/env node

/**
 * Script para verificar se a meta tag "google-site-verification" foi adicionada com sucesso
 * Uso: node verify-google-meta-tag.js <url> [código-esperado]
 * Exemplo: node verify-google-meta-tag.js https://meusite.com.br
 * Exemplo com validação: node verify-google-meta-tag.js https://meusite.com.br "abc123xyz456"
 */

const https = require('https');
const http = require('http');

// Cores para output
const colors = {
  red: '\033[0;31m',
  green: '\033[0;32m',
  yellow: '\033[1;33m',
  blue: '\033[0;34m',
  reset: '\033[0m',
};

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function getHTML(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;

    const req = protocol.get(url, { 
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; GoogleVerificationChecker/1.0)',
      }
    }, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        resolve({ statusCode: res.statusCode, html: data });
      });
    });

    req.on('error', (err) => {
      reject(new Error(`Erro na requisição: ${err.message}`));
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Timeout na requisição (10s)'));
    });
  });
}

async function verifyGoogleMetaTag(siteUrl, expectedCode) {
  const timestamp = new Date().toLocaleString('pt-BR');

  log('blue', '========================================');
  log('blue', 'Verificador de Meta Tag Google');
  log('blue', '========================================');
  console.log(`Data/Hora: ${timestamp}`);
  console.log(`URL: ${siteUrl}`);
  if (expectedCode) {
    console.log(`Código esperado: ${expectedCode}`);
  }
  console.log('');

  try {
    // Passo 1: Fazer requisição HTTP
    log('yellow', '1. Fazendo requisição para o site...');
    const { statusCode, html } = await getHTML(siteUrl);

    if (statusCode !== 200) {
      log('red', `✗ Erro na requisição HTTP`);
      console.log(`Código HTTP: ${statusCode}`);
      process.exit(1);
    }

    log('green', `✓ Requisição bem-sucedida (HTTP ${statusCode})`);
    console.log('');

    // Passo 2: Procurar pela meta tag
    log('yellow', '2. Procurando pela meta tag google-site-verification...');

    const metaTagRegex = /<meta[^>]*name=["']?google-site-verification["']?[^>]*>/gi;
    const metaTags = html.match(metaTagRegex);

    if (!metaTags || metaTags.length === 0) {
      log('red', '✗ Meta tag google-site-verification NÃO encontrada');
      console.log('');
      log('yellow', 'Dicas:');
      console.log('- Verifique se o arquivo foi publicado corretamente no deploy');
      console.log('- Aguarde alguns minutos (cache pode estar ativo)');
      console.log('- Confirme que a meta tag está em _document.tsx ou pages/_document.tsx');
      console.log('- Use: curl -s https://seu-site.com.br | grep -i google-site-verification');
      console.log('');
      process.exit(1);
    }

    log('green', '✓ Meta tag encontrada!');
    console.log('');

    // Passo 3: Exibir detalhes da meta tag
    log('yellow', '3. Detalhes da meta tag encontrada:');
    metaTags.forEach((tag, index) => {
      if (metaTags.length > 1) {
        console.log(`   Meta tag ${index + 1}:`);
      }
      console.log(`   ${tag}`);
    });
    console.log('');

    // Passo 4: Validar o código se fornecido
    if (expectedCode) {
      log('yellow', '4. Validando código...');

      const foundCode = metaTags.find(tag => tag.includes(expectedCode));

      if (foundCode) {
        log('green', '✓ Código corresponde ao esperado');
        log('green', `Código encontrado: ${expectedCode}`);
      } else {
        log('red', '✗ Código NÃO corresponde ao esperado');
        console.log(`Código esperado: ${expectedCode}`);

        // Extrair o código encontrado
        const contentMatch = metaTags[0].match(/content=["']?([^"'>\s]+)["']?/i);
        if (contentMatch) {
          console.log(`Código encontrado: ${contentMatch[1]}`);
        }

        process.exit(1);
      }
    }

    console.log('');
    log('blue', '========================================');
    log('green', '✓ Verificação concluída com sucesso!');
    log('blue', '========================================');
    console.log('');
  } catch (error) {
    log('red', `✗ Erro: ${error.message}`);
    process.exit(1);
  }
}

// Validar argumentos
const args = process.argv.slice(2);

if (args.length < 1) {
  log('red', 'Erro: URL do site é obrigatória');
  console.log('Uso: node verify-google-meta-tag.js <url-do-site> [código-esperado-opcional]');
  console.log('Exemplo: node verify-google-meta-tag.js https://meusite.com.br');
  console.log('Exemplo com validação: node verify-google-meta-tag.js https://meusite.com.br "abc123xyz456"');
  process.exit(1);
}

const siteUrl = args[0];
const expectedCode = args[1] || null;

verifyGoogleMetaTag(siteUrl, expectedCode);
