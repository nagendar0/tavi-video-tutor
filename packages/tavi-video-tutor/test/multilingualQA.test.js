import test from 'node:test';
import assert from 'node:assert/strict';
import { AITUTOR_LANGUAGES } from '../src/subtitles/languages/registry.js';
import { TranslationValidator } from '../src/subtitles/translation/TranslationValidator.js';

test('Multilingual 109-Language QA Validation', () => {
  const validator = new TranslationValidator();

  const sourceCue = {
    start: 0.5,
    end: 4.0,
    text: 'Welcome to Anthropic Claude lecture on React and Python APIs.'
  };

  let passCount = 0;
  let suspiciousCount = 0;
  let failCount = 0;
  let unsupportedCount = 0;

  for (const lang of AITUTOR_LANGUAGES) {
    // Simulated/Real translation output with protected terms preserved
    let translatedText = sourceCue.text;
    if (lang.code === 'te') {
      translatedText = 'React మరియు Python APIs పై Anthropic Claude పాఠ్యానికి స్వాగతం';
    } else if (lang.code === 'hi') {
      translatedText = 'React और Python APIs पर Anthropic Claude व्याख्यान में आपका स्वागत है';
    } else if (lang.code === 'es') {
      translatedText = 'Bienvenido a la conferencia de Anthropic Claude sobre React y Python APIs';
    } else if (lang.code === 'fr') {
      translatedText = 'Bienvenue au cours Anthropic Claude sur les APIs React et Python';
    } else if (lang.code === 'ja') {
      translatedText = 'ReactとPython APIに関するAnthropic Claudeの講義へようこそ';
    } else if (lang.code === 'zh') {
      translatedText = '欢迎来到关于React和Python API Stack的Anthropic Claude讲座';
    }

    const res = validator.validateTranslation(sourceCue.text, translatedText, lang.code);
    if (res.status === 'PASS') passCount++;
    else if (res.status === 'SUSPICIOUS') suspiciousCount++;
    else if (res.status === 'FAIL') failCount++;
    else if (res.status === 'UNSUPPORTED') unsupportedCount++;
  }

  console.log(`\nMULTILINGUAL 109-LANGUAGE QA SMOKE RESULT:`);
  console.log(`Total Registry Languages: ${AITUTOR_LANGUAGES.length}`);
  console.log(`PASS:        ${passCount}`);
  console.log(`SUSPICIOUS:  ${suspiciousCount}`);
  console.log(`FAIL:        ${failCount}`);
  console.log(`UNSUPPORTED: ${unsupportedCount}\n`);

  assert.equal(AITUTOR_LANGUAGES.length, 109);
  assert.ok(passCount > 0);
  assert.equal(failCount, 0);
});
