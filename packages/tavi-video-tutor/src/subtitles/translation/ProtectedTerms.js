import { DEFAULT_GLOSSARY } from '../transcript/glossary.js';

export const COMMON_PROTECTED_TERMS = [
  'AI', 'API', 'URL', 'HTTP', 'HTTPS', 'HTML', 'CSS', 'JSON', 'REST', 'GraphQL',
  'SDK', 'UI', 'UX', 'IP', 'DNS', 'SQL', 'NoSQL', 'ORM', 'WASM', 'ONNX', 'DOM',
  'CLI', 'QA', 'VSCode', 'Git', 'GitHub', 'GitLab', 'Vercel', 'Supabase', 'Firebase',
  'Docker', 'Kubernetes', 'AWS', 'GCP', 'Azure', 'Linux', 'Windows', 'macOS', 'iOS', 'Android',
  'Python', 'JavaScript', 'TypeScript', 'C++', 'Rust', 'Go', 'Java', 'PHP', 'Ruby',
  'React', 'Next.js', 'Node.js', 'Vue', 'Angular', 'Svelte', 'Express', 'Django',
  'Claude', 'Anthropic', 'OpenAI', 'ChatGPT', 'GPT-4', 'GPT-5', 'Gemini', 'Whisper',
  'WhatsApp', 'YouTube', 'Google', 'Microsoft', 'Apple', 'Meta', 'NVIDIA'
];

export class ProtectedTerms {
  constructor(customTerms = []) {
    const combined = new Set([...COMMON_PROTECTED_TERMS, ...DEFAULT_GLOSSARY, ...customTerms]);
    this.terms = Array.from(combined);
  }

  isProtectedTerm(token) {
    if (!token || typeof token !== 'string') return false;
    const cleanToken = token.replace(/^[^\w]+|[^\w]+$/g, '');
    if (!cleanToken) return false;

    // Check version numbers (e.g. v1.2, 3.5), URLs, emails
    if (/^(v?\d+(\.\d+)*|https?:\/\/.*|[\w.-]+@[\w.-]+\.\w+)$/i.test(cleanToken)) {
      return true;
    }

    // Check exact or case-insensitive match against registered terms
    return this.terms.some(term => term.toLowerCase() === cleanToken.toLowerCase());
  }

  extractProtectedTerms(text) {
    if (!text || typeof text !== 'string') return [];
    const words = text.split(/\s+/);
    return words.filter(w => this.isProtectedTerm(w));
  }
}

export const protectTokens = (text, customTerms = []) => {
  if (!text || typeof text !== 'string') {
    return { text: '', map: new Map() };
  }

  const protector = new ProtectedTerms(customTerms);
  const words = text.split(/(\s+)/);
  const tokenMap = new Map();
  let count = 0;

  const protectedWords = words.map(word => {
    if (protector.isProtectedTerm(word)) {
      const placeholder = `__PROT_${count}__`;
      tokenMap.set(placeholder, word);
      count++;
      return placeholder;
    }
    return word;
  });

  return {
    text: protectedWords.join(''),
    map: tokenMap
  };
};

export const restoreTokens = (text, tokenMap) => {
  if (!text || !tokenMap || tokenMap.size === 0) return text;
  let restored = text;
  tokenMap.forEach((originalWord, placeholder) => {
    restored = restored.replace(new RegExp(placeholder, 'g'), originalWord);
  });
  return restored;
};

