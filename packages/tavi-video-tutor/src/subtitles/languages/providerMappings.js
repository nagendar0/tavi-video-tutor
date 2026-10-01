export const defaultProviderLanguageMap = {
  zh: 'zh-CN',
  yue: 'zh-HK',
  tl: 'fil'
};

export const mapAITutorCodeToProvider = (code, _providerName = 'default') => {
  if (!code) return code;
  const clean = String(code).toLowerCase();
  return defaultProviderLanguageMap[clean] || clean;
};
