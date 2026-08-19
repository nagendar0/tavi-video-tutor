import fs from 'fs';
import path from 'path';
import os from 'os';
import { execSync } from 'child_process';

const consumerDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aitutor-consumer-pack-'));
console.log('Consumer scratch dir:', consumerDir);

try {
  fs.writeFileSync(
    path.join(consumerDir, 'package.json'),
    JSON.stringify({ name: 'aitutor-consumer-test', type: 'module' }),
    'utf8'
  );

  const tarballPath = path.resolve('tavi-video-tutor-2.1.1.tgz');
  console.log(`Installing ${tarballPath}...`);
  execSync(`npm install "${tarballPath}"`, { cwd: consumerDir, stdio: 'inherit' });

  const binPath = path.join(consumerDir, 'node_modules', 'tavi-video-tutor', 'bin', 'aitutor.js');

  console.log('\n--- 1. Testing aitutor doctor ---');
  let doctorOutput = '';
  try {
    doctorOutput = execSync(`node "${binPath}" doctor`, { cwd: consumerDir, encoding: 'utf8' });
  } catch (err) {
    doctorOutput = err.stdout || err.message;
  }
  console.log(doctorOutput);
  if (!doctorOutput.includes('AITutor Environment Check')) {
    throw new Error('Doctor command output did not contain expected Environment Check header!');
  }

  console.log('\n--- 2. Testing aitutor init ---');
  const initOut = execSync(`node "${binPath}" init`, { cwd: consumerDir, encoding: 'utf8' });
  console.log(initOut);
  if (!fs.existsSync(path.join(consumerDir, 'aitutor.config.mjs'))) {
    throw new Error('Init command failed to create aitutor.config.mjs');
  }

  console.log('\n--- 3. Testing aitutor audio status ---');
  const audioStatusOut = execSync(`node "${binPath}" audio status`, { cwd: consumerDir, encoding: 'utf8' });
  console.log(audioStatusOut);
  if (!audioStatusOut.includes('AITutor Audio Status')) {
    throw new Error('Audio status output did not contain expected header!');
  }

  console.log('\n--- 4. Testing aitutor audio clear ---');
  // Seed a fake audio track and manifest entry to verify audio clear
  const pubAudioDir = path.join(consumerDir, 'public', 'aitutor', 'audio', 'lesson_1');
  const internalDir = path.join(consumerDir, '.aitutor');
  fs.mkdirSync(pubAudioDir, { recursive: true });
  fs.mkdirSync(internalDir, { recursive: true });
  fs.writeFileSync(path.join(pubAudioDir, 'hi.m4a'), 'FAKE_AUDIO', 'utf8');

  const initialManifest = {
    lesson_1: {
      id: 'lesson_1',
      src: '/lesson.mp4',
      sourceLanguage: 'en',
      audioLanguages: {
        hi: { src: '/aitutor/audio/lesson_1/hi.m4a', language: 'hi', label: 'Hindi' }
      }
    }
  };
  fs.writeFileSync(path.join(internalDir, 'manifest.json'), JSON.stringify(initialManifest, null, 2), 'utf8');

  const audioClearOut = execSync(`node "${binPath}" audio clear hi`, { cwd: consumerDir, encoding: 'utf8' });
  console.log(audioClearOut);
  if (fs.existsSync(path.join(pubAudioDir, 'hi.m4a'))) {
    throw new Error('Audio clear hi failed to remove hi.m4a!');
  }

  console.log('\n--- 5. Testing aitutor preflight blocking on missing FFmpeg ---');
  let blocked = false;
  try {
    execSync(`node "${binPath}" generate --non-interactive`, {
      cwd: consumerDir,
      encoding: 'utf8',
      env: { ...process.env, FFMPEG_PATH: path.join(consumerDir, 'non_existent_ffmpeg.exe') }
    });
  } catch (err) {
    blocked = true;
    console.log('Successfully blocked generation when FFmpeg is missing:');
    console.log(err.stdout || err.message);
  }

  if (!blocked) {
    throw new Error('Preflight failed to block generation when FFmpeg was missing!');
  }

  console.log('\n✓ Consumer packaged artifact verified successfully with 0 errors.');
} finally {
  fs.rmSync(consumerDir, { recursive: true, force: true });
}
