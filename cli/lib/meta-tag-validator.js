export class MetaTagValidator {
  constructor(logger) {
    this.logger = logger;
  }

  async validate(url) {
    this.logger.info(`Validating meta tags at ${url}`);

    try {
      const response = await fetch(url, { timeout: 10000 });
      const html = await response.text();

      const requiredTags = [
        { name: 'viewport', content: 'width=device-width' },
        { name: 'charset', content: 'utf-8' },
        { name: 'description', content: null }, // Just check existence
        { name: 'og:title', content: null },
        { name: 'og:description', content: null },
        { name: 'og:url', content: url },
      ];

      const foundTags = [];
      const missingTags = [];

      for (const tag of requiredTags) {
        const found = this.findMetaTag(html, tag);
        if (found) {
          foundTags.push(tag.name);
          this.logger.debug(`Found meta tag: ${tag.name}`);
        } else {
          missingTags.push(tag.name);
          this.logger.warn(`Missing meta tag: ${tag.name}`);
        }
      }

      const valid = missingTags.length === 0;
      return {
        valid,
        tags: foundTags,
        missing: missingTags,
        url,
      };
    } catch (error) {
      this.logger.error(`Meta tag validation failed: ${error.message}`);
      return {
        valid: false,
        tags: [],
        missing: [],
        error: error.message,
      };
    }
  }

  findMetaTag(html, tag) {
    if (tag.name === 'charset') {
      return /<meta\s+charset/i.test(html);
    }

    if (tag.name === 'viewport') {
      return /<meta\s+name=["\']viewport["\']/i.test(html);
    }

    if (tag.name.startsWith('og:')) {
      const ogPattern = new RegExp(
        `<meta\\s+property=["\']${tag.name}["\']\\s+content=["'][^"']*["']`,
        'i'
      );
      return ogPattern.test(html);
    }

    // Generic meta name tag
    const pattern = new RegExp(
      `<meta\\s+name=["\']${tag.name}["\']\\s+content=["'][^"']*["']`,
      'i'
    );
    return pattern.test(html);
  }
}
