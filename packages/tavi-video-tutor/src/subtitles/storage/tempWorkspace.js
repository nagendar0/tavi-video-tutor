import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export class TempWorkspace {
  constructor(jobName = 'job', cwd = process.cwd()) {
    this.cwd = cwd;
    this.jobId = `${jobName}-${crypto.randomBytes(4).toString('hex')}`;
    this.workspaceDir = path.join(this.cwd, '.aitutor', 'tmp', this.jobId);
    
    fs.mkdirSync(this.workspaceDir, { recursive: true });
  }

  getPath(filename) {
    return path.join(this.workspaceDir, filename);
  }

  cleanup() {
    try {
      if (fs.existsSync(this.workspaceDir)) {
        fs.rmSync(this.workspaceDir, { recursive: true, force: true });
      }
    } catch (err) {
      console.warn(`[TempWorkspace] Warning: Failed to clean temporary directory ${this.workspaceDir}:`, err.message);
    }
  }
}
