import { Worker } from "worker_threads";
import { cpus } from "os";
import { EventEmitter } from "events";

// Thread pool for parallel processing
interface Task {
  id: string;
  type: "research" | "sheet" | "slide";
  data: any;
  resolve: (value: any) => void;
  reject: (reason: any) => void;
}

interface WorkerInfo {
  worker: Worker;
  busy: boolean;
  taskId?: string;
}

export class ThreadPool extends EventEmitter {
  private workers: WorkerInfo[] = [];
  private queue: Task[] = [];
  private maxWorkers: number;

  constructor(maxWorkers: number = cpus().length) {
    super();
    this.maxWorkers = maxWorkers;
    this.initializeWorkers();
  }

  private initializeWorkers() {
    for (let i = 0; i < this.maxWorkers; i++) {
      this.createWorker();
    }
  }

  private createWorker() {
    const worker = new Worker(`
      const { parentPort } = require('worker_threads');
      
      parentPort.on('message', async (task) => {
        try {
          let result;
          
          switch (task.type) {
            case 'research':
              result = await processResearchTask(task.data);
              break;
            case 'sheet':
              result = await processSheetTask(task.data);
              break;
            case 'slide':
              result = await processSlideTask(task.data);
              break;
            default:
              throw new Error('Unknown task type');
          }
          
          parentPort.postMessage({ success: true, result, taskId: task.id });
        } catch (error) {
          parentPort.postMessage({ success: false, error: error.message, taskId: task.id });
        }
      });
      
      async function processResearchTask(data) {
        // Simulate research processing
        return { processed: true, type: 'research', data };
      }
      
      async function processSheetTask(data) {
        // Simulate sheet processing
        return { processed: true, type: 'sheet', data };
      }
      
      async function processSlideTask(data) {
        // Simulate slide processing
        return { processed: true, type: 'slide', data };
      }
    `, { eval: true });

    const workerInfo: WorkerInfo = { worker, busy: false };
    
    worker.on("message", (message) => {
      this.handleMessage(workerInfo, message);
    });

    worker.on("error", (error) => {
      this.emit("error", error);
      this.replaceWorker(workerInfo);
    });

    this.workers.push(workerInfo);
  }

  private handleMessage(workerInfo: WorkerInfo, message: any) {
    workerInfo.busy = false;
    
    const task = this.queue.find(t => t.id === message.taskId);
    if (task) {
      this.queue = this.queue.filter(t => t.id !== message.taskId);
      
      if (message.success) {
        task.resolve(message.result);
      } else {
        task.reject(new Error(message.error));
      }
    }
    
    this.processQueue();
  }

  private replaceWorker(workerInfo: WorkerInfo) {
    const index = this.workers.indexOf(workerInfo);
    if (index > -1) {
      workerInfo.worker.terminate();
      this.workers.splice(index, 1);
      this.createWorker();
    }
  }

  private processQueue() {
    if (this.queue.length === 0) return;
    
    const availableWorker = this.workers.find(w => !w.busy);
    if (!availableWorker) return;
    
    const task = this.queue[0];
    availableWorker.busy = true;
    availableWorker.taskId = task.id;
    
    availableWorker.worker.postMessage({
      id: task.id,
      type: task.type,
      data: task.data,
    });
  }

  execute(type: "research" | "sheet" | "slide", data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const task: Task = {
        id: `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type,
        data,
        resolve,
        reject,
      };
      
      this.queue.push(task);
      this.processQueue();
    });
  }

  // Parallel map - process array items in parallel
  async parallelMap<T, R>(
    items: T[],
    mapper: (item: T) => Promise<R>,
    concurrency: number = this.maxWorkers
  ): Promise<R[]> {
    const results: R[] = new Array(items.length);
    const executing: Promise<void>[] = [];
    
    for (let i = 0; i < items.length; i++) {
      const promise = mapper(items[i]).then(result => {
        results[i] = result;
      });
      
      executing.push(promise);
      
      if (executing.length >= concurrency) {
        await Promise.race(executing);
        executing.splice(executing.findIndex(p => p === promise), 1);
      }
    }
    
    await Promise.all(executing);
    return results;
  }

  // Fork-Join pattern
  async forkJoin<T, R>(
    tasks: Array<() => Promise<T>>,
    joiner: (results: T[]) => R
  ): Promise<R> {
    const results = await Promise.all(tasks.map(task => task()));
    return joiner(results);
  }

  terminate(): Promise<void> {
    return Promise.all(
      this.workers.map(w => w.worker.terminate())
    ).then(() => undefined);
  }
}

// Singleton instance
let threadPool: ThreadPool | null = null;

export function getThreadPool(): ThreadPool {
  if (!threadPool) {
    threadPool = new ThreadPool();
  }
  return threadPool;
}
