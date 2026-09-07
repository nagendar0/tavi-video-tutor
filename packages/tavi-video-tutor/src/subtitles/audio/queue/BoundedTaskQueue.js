/**
 * Bounded Task Queue with Failure Recovery & Retry Policy.
 * 
 * Prevents unbounded concurrency when synthesizing hundreds or thousands of speech segments.
 * Manages lifecycle: Pending -> Running -> Completed -> Failed.
 */
export class BoundedTaskQueue {
  constructor(options = {}) {
    this.concurrency = options.concurrency || 4;
    this.maxRetries = options.maxRetries !== undefined ? options.maxRetries : 2;
    this.retryDelayMs = options.retryDelayMs || 500;
    this.onProgress = options.onProgress || null;

    this.pending = [];
    this.running = new Map();
    this.completed = [];
    this.failed = [];
    this.retryingCount = 0;
  }

  /**
   * Add a task to the queue.
   * @param {string} id - Unique task identifier
   * @param {Function} executeFn - Async function to run: async (task) => result
   * @param {Object} [metadata] - Optional context metadata (segmentId, speakerId, etc.)
   */
  addTask(id, executeFn, metadata = {}) {
    this.pending.push({
      id,
      executeFn,
      metadata,
      status: 'pending',
      attempts: 0,
      error: null,
      result: null
    });
  }

  /**
   * Bulk add tasks.
   * @param {Array<{ id: string, executeFn: Function, metadata?: Object }>} tasks 
   */
  addTasks(tasks = []) {
    for (const t of tasks) {
      this.addTask(t.id, t.executeFn, t.metadata);
    }
  }

  /**
   * Run the queue to completion with bounded concurrency.
   * @returns {Promise<{
   *   total: number,
   *   completedCount: number,
   *   failedCount: number,
   *   completed: Array<Object>,
   *   failed: Array<Object>
   * }>}
   */
  async run() {
    return new Promise((resolve) => {
      const totalCount = this.pending.length;
      if (totalCount === 0) {
        resolve({
          total: 0,
          completedCount: 0,
          failedCount: 0,
          completed: [],
          failed: []
        });
        return;
      }

      const checkFinished = () => {
        if (this.pending.length === 0 && this.running.size === 0 && this.retryingCount === 0) {
          resolve({
            total: totalCount,
            completedCount: this.completed.length,
            failedCount: this.failed.length,
            completed: this.completed,
            failed: this.failed
          });
        }
      };

      const pump = () => {
        while (this.running.size < this.concurrency && this.pending.length > 0) {
          const task = this.pending.shift();
          task.status = 'running';
          task.attempts++;
          this.running.set(task.id, task);

          this.onProgress?.({
            type: 'task-started',
            taskId: task.id,
            metadata: task.metadata,
            runningCount: this.running.size,
            pendingCount: this.pending.length
          });

          this.executeTask(task)
            .then((res) => {
              task.status = 'completed';
              task.result = res;
              this.running.delete(task.id);
              this.completed.push(task);

              this.onProgress?.({
                type: 'task-completed',
                taskId: task.id,
                metadata: task.metadata,
                completedCount: this.completed.length,
                totalCount
              });

              pump();
              checkFinished();
            })
            .catch((err) => {
              task.error = err;
              this.running.delete(task.id);

              if (task.attempts <= this.maxRetries) {
                task.status = 'retrying';
                this.retryingCount++;
                this.onProgress?.({
                  type: 'task-retrying',
                  taskId: task.id,
                  metadata: task.metadata,
                  attempt: task.attempts,
                  maxRetries: this.maxRetries,
                  error: err.message
                });

                // Exponential backoff
                const delay = this.retryDelayMs * Math.pow(2, task.attempts - 1);
                setTimeout(() => {
                  this.retryingCount--;
                  this.pending.push(task);
                  pump();
                  checkFinished();
                }, delay);
              } else {
                task.status = 'failed';
                this.failed.push(task);

                this.onProgress?.({
                  type: 'task-failed',
                  taskId: task.id,
                  metadata: task.metadata,
                  attempts: task.attempts,
                  error: err.message
                });
                pump();
                checkFinished();
              }
            });
        }

        checkFinished();
      };

      pump();
    });
  }

  async executeTask(task) {
    return await task.executeFn(task);
  }

  getStatus() {
    return {
      pending: this.pending.length,
      running: this.running.size,
      completed: this.completed.length,
      failed: this.failed.length
    };
  }
}

export default BoundedTaskQueue;
