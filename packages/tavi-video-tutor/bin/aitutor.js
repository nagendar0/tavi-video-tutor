#!/usr/bin/env node

import { main } from '../src/cli/cli.js';

main().catch((err) => {
  console.error('\nAITutor CLI Error:', err.message || err);
  process.exit(1);
});
