export function runWorker<TInput, TOutput>(
  WorkerClass: new () => Worker,
  input: TInput,
  transferables: Transferable[] = [],
  onProgress?: (percent: number, message: string) => void
): Promise<TOutput> {
  return new Promise((resolve, reject) => {
    const worker = new WorkerClass();
    worker.onmessage = (e: MessageEvent) => {
      const data = e.data;
      if (data.type === 'progress') {
        onProgress?.(data.percent, data.message);
      } else if (data.type === 'result') {
        resolve(data.payload as TOutput);
        worker.terminate();
      } else if (data.type === 'error') {
        reject(new Error(data.message));
        worker.terminate();
      }
    };
    worker.onerror = (e) => {
      reject(new Error(e.message));
      worker.terminate();
    };
    worker.postMessage({ type: 'run', payload: input }, transferables);
  });
}
