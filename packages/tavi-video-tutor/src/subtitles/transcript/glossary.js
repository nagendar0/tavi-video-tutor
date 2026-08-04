export const DEFAULT_GLOSSARY = [
  "Anthropic",
  "Claude",
  "OpenAI",
  "ChatGPT",
  "React",
  "Next.js",
  "Node.js",
  "JavaScript",
  "TypeScript",
  "Python",
  "C++",
  "PostgreSQL",
  "MongoDB",
  "Docker",
  "Kubernetes",
  "API",
  "REST",
  "GraphQL",
  "GitHub",
  "Vercel",
  "Supabase",
  "TensorFlow",
  "PyTorch"
];

// Known Whisper ASR misrecognitions mapped to standard canonical casing
export const ASR_MISRECOGNITION_MAP = new Map([
  [/\banthropoc\b/gi, 'Anthropic'],
  [/\banthro pic\b/gi, 'Anthropic'],
  [/\bantropic\b/gi, 'Anthropic'],
  [/\bcloud fable 5\b/gi, 'Claude 3.5'],
  [/\bclaud\b/gi, 'Claude'],
  [/\bopen ai\b/gi, 'OpenAI'],
  [/\bchat gpt\b/gi, 'ChatGPT'],
  [/\breact js\b/gi, 'React'],
  [/\bnext js\b/gi, 'Next.js'],
  [/\bnode js\b/gi, 'Node.js'],
  [/\bpostgres ql\b/gi, 'PostgreSQL'],
  [/\bmongo db\b/gi, 'MongoDB']
]);

// Context gates for ambiguous 1-word terms
export const AMBIGUOUS_CONTEXT_GATES = {
  React: {
    canonical: 'React',
    technicalWords: [
      'component', 'jsx', 'hook', 'usestate', 'useeffect', 'usecontext', 'frontend',
      'vite', 'next', 'props', 'render', 'app', 'ui', 'framework', 'library', 'dom',
      'state', 'reducer', 'router', 'native', 'web', 'virtual', 'element', 'code',
      'script', 'developer', 'single', 'page', 'video', 'lecture', 'using', 'build', 'building'
    ]
  },
  Go: {
    canonical: 'Go',
    technicalWords: [
      'language', 'lang', 'compiler', 'module', 'package', 'routine', 'goroutine',
      'channel', 'backend', 'golang', 'code', 'program', 'developer', 'struct', 'slice'
    ]
  },
  Rust: {
    canonical: 'Rust',
    technicalWords: [
      'language', 'compiler', 'crate', 'cargo', 'ownership', 'borrow', 'lifetimes',
      'memory', 'safety', 'project', 'code', 'program', 'developer', 'trait'
    ]
  },
  Swift: {
    canonical: 'Swift',
    technicalWords: [
      'ios', 'package', 'compiler', 'swiftui', 'apple', 'xcode', 'app', 'cocoa',
      'language', 'code', 'developer'
    ]
  },
  Apple: {
    canonical: 'Apple',
    technicalWords: [
      'developer', 'device', 'silicon', 'watch', 'vision', 'ecosystem', 'mac',
      'iphone', 'ipad', 'store', 'inc', 'tech', 'company'
    ]
  },
  Python: {
    canonical: 'Python',
    technicalWords: [
      'script', 'code', 'file', 'project', 'package', 'pip', 'import', 'django',
      'flask', 'fastapi', 'pandas', 'numpy', 'pytorch', 'tensorflow', 'scikit',
      'language', 'developer', 'notebook', 'def', 'class'
    ]
  }
};

export class TerminologyGlossary {
  constructor(customTerms = []) {
    const combined = new Set([...DEFAULT_GLOSSARY, ...customTerms.filter(Boolean)]);
    this.terms = Array.from(combined);
  }

  getTerms() {
    return [...this.terms];
  }

  /**
   * Evaluates if an ambiguous word occurrence at word index `idx` in `words`
   * is surrounded by technical context within a 5-word window.
   */
  hasTechnicalContext(words, targetIdx, technicalWords) {
    const startIdx = Math.max(0, targetIdx - 5);
    const endIdx = Math.min(words.length - 1, targetIdx + 5);

    for (let i = startIdx; i <= endIdx; i++) {
      if (i === targetIdx) continue;
      const cleanWord = words[i].toLowerCase().replace(/^[^\w]+|[^\w]+$/g, '');
      if (technicalWords.includes(cleanWord)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Safe case-preserving term normalization with context-gating
   */
  normalizeText(text) {
    if (!text || typeof text !== 'string') return text;
    let result = text;

    // 1. First apply known misrecognition fixes (e.g. react js -> React, anthropoc -> Anthropic)
    for (const [pattern, replacement] of ASR_MISRECOGNITION_MAP.entries()) {
      result = result.replace(pattern, replacement);
    }

    // 2. Tokenize words for window evaluation
    const rawTokens = result.split(/(\s+)/);

    // 3. Process each glossary term
    for (const term of this.terms) {
      const gate = AMBIGUOUS_CONTEXT_GATES[term];

      if (gate) {
        // Context-Gated Normalization for Ambiguous Terms
        const wordTokens = result.split(/\s+/);
        const pattern = new RegExp(`^${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');

        let wordCounter = 0;
        const newTokens = rawTokens.map((token) => {
          if (!/\s+/.test(token) && token.length > 0) {
            const cleanToken = token.replace(/^[^\w]+|[^\w]+$/g, '');
            const currentIdx = wordCounter;
            wordCounter++;

            if (pattern.test(cleanToken)) {
              // If already capitalized as canonical, keep as is
              if (token.includes(gate.canonical)) {
                return token;
              }
              // Check 5-word window context
              if (this.hasTechnicalContext(wordTokens, currentIdx, gate.technicalWords)) {
                return token.replace(new RegExp(cleanToken, 'i'), gate.canonical);
              }
              // Preserve original lowercase word when technical context is absent
              return token;
            }
          }
          return token;
        });

        result = newTokens.join('');
      } else {
        // Direct Safe Normalization for Unambiguous Terms (Node.js, JavaScript, TypeScript, etc.)
        const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const pattern = new RegExp(`\\b${escaped}\\b`, 'gi');
        result = result.replace(pattern, () => term);
      }
    }

    return result;
  }
}

