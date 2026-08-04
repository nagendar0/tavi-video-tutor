export const defaultProviderLanguageMap = {
  zh: 'zh-CN',
  yue: 'zh-HK',
  tl: 'fil'
};

export const mapAITutorCodeToProvider = (code, providerName = 'default') => {
  if (!code) return code;
  const clean = String(code).toLowerCase();
  return defaultProviderLanguageMap[clean] || clean;
};
