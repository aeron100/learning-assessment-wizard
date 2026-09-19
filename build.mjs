import { copyFile,writeFile } from 'node:fs/promises';
await copyFile('node_modules/@mlc-ai/web-llm/lib/index.js','vendor/webllm.js');
await writeFile('vendor/ai-client.js',"export { CreateWebWorkerMLCEngine, prebuiltAppConfig, deleteModelAllInfoInCache } from './webllm.js';\n");
await writeFile('vendor/ai-worker.js',"import { WebWorkerMLCEngineHandler } from './webllm.js';\nconst handler = new WebWorkerMLCEngineHandler();\nself.onmessage = event => handler.onmessage(event);\n");
console.log('Local AI bundles ready. Serve this directory or deploy the static site.');
