import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';
export const root=path.dirname(fileURLToPath(import.meta.url));
// Explicit environment always wins. Never print values from a secret-bearing file.
const envFile=path.join(root,'../.env.local');
if(existsSync(envFile))process.loadEnvFile(envFile);
function integer(name,fallback,min,max) {
  const n=Number(process.env[name]??fallback);
  if(!Number.isInteger(n)||n<min||n>max)throw new Error(`Invalid configuration: ${name}`);
  return n;
}
export const config=Object.freeze({
  dataDir:path.resolve(process.env.PAPERPOP_DATA_DIR||path.join(root,'.data')),
  port:integer('PORT',8787,0,65535),host:process.env.HOST||'127.0.0.1',
  modelBaseURL:process.env.PAPERPOP_MODEL_BASE_URL||'https://api.openai.com/v1',
  modelName:process.env.PAPERPOP_MODEL_NAME||'',modelKey:process.env.PAPERPOP_MODEL_KEY||process.env.OPENAI_API_KEY||'',
  arxivURL:'https://export.arxiv.org/api/query',
  arxivIntervalMs:integer('PAPERPOP_ARXIV_INTERVAL_MS',3100,3000,3600000),
  taskTimeoutMs:integer('PAPERPOP_TASK_TIMEOUT_MS',120000,1000,3600000),
  workerPollMs:integer('PAPERPOP_WORKER_POLL_MS',1000,100,60000)
});
