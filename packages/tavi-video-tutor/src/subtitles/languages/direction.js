export const RTL_LANGUAGES = new Set([
  'ar', // Arabic
  'he', // Hebrew
  'fa', // Persian
  'ur', // Urdu
  'ps', // Pashto
  'sd', // Sindhi
  'ks'  // Kashmiri
]);

export const isRTL = (langCode) => {
  if (!langCode) return false;
  const clean = String(langCode).toLowerCase().split('-')[0].split('_')[0];
  return RTL_LANGUAGES.has(clean);
};

export const getLanguageDirection = (langCode) => {
  return isRTL(langCode) ? 'rtl' : 'ltr';
};
