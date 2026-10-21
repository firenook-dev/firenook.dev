// Structured data (schema.org JSON-LD) that search engines read: who makes
// Firenook, the site, and Firenook itself. Pages link to these by @id.

import { site } from './site';

export const organization = {
  '@type': 'Organization',
  '@id': `${site.url}/#organization`,
  name: site.name,
  url: `${site.url}/`,
  logo: `${site.url}/icon-512.png`,
  sameAs: [site.repo, site.npm],
};

export const website = {
  '@type': 'WebSite',
  '@id': `${site.url}/#website`,
  name: site.name,
  url: `${site.url}/`,
  inLanguage: 'en',
  publisher: { '@id': `${site.url}/#organization` },
};

export const application = {
  '@type': 'SoftwareApplication',
  '@id': `${site.url}/#software`,
  name: site.name,
  description: site.description,
  url: `${site.url}/`,
  applicationCategory: 'DeveloperApplication',
  operatingSystem: 'macOS, Linux, Windows',
  softwareVersion: site.version,
  license: 'https://www.apache.org/licenses/LICENSE-2.0',
  downloadUrl: site.npm,
  codeRepository: site.repo,
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  publisher: { '@id': `${site.url}/#organization` },
};

export function faqPage(faqs: { question: string; answer: string }[]) {
  return {
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: { '@type': 'Answer', text: faq.answer },
    })),
  };
}

export function breadcrumbs(crumbs: { name: string; path: string }[]) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: `${site.url}${crumb.path}`,
    })),
  };
}

/** One script's worth of structured data. */
export const graph = (...nodes: object[]) => ({ '@context': 'https://schema.org', '@graph': nodes });

/** JSON for a <script> tag, kept from closing it early. */
export const jsonLd = (data: object) => JSON.stringify(data).replace(/</g, '\\u003c');
