#!/usr/bin/env node

import { main } from '../src/cli/cli.js';
import { formatErrorCli, getExitCodeForError } from '../src/subtitles/errors/index.js';

main().catch((err) => {
  console.error('\nAITutor CLI Error:\n' + formatErrorCli(err));
  process.exit(getExitCodeForError(err) || 1);
});
