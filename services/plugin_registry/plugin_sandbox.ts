import { Worker } from "worker_threads";

// Function to execute plugin code in a sandbox
export function executePlugin(pluginCode: string, input: any): Promise<any> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(
      `
            const { parentPort } = require('worker_threads');

            parentPort.on('message', (data) => {
                try {
                    const pluginFunction = new Function('input', data.pluginCode);
                    const result = pluginFunction(data.input);
                    parentPort.postMessage({ result });
                } catch (error) {
                    parentPort.postMessage({ error: error.message });
                }
            });
        `,
      { eval: true },
    );

    worker.on("message", (message) => {
      if (message.error) {
        reject(new Error(message.error));
      } else {
        resolve(message.result);
      }
    });

    worker.on("error", reject);
    worker.on("exit", (code) => {
      if (code !== 0) {
        reject(new Error(`Worker stopped with exit code ${code}`));
      }
    });

    worker.postMessage({ pluginCode, input });
  });
}
