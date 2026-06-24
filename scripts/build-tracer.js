import { spawn } from 'child_process';
import fs from 'fs';

console.log("Starting build tracer...");
const logStream = fs.createWriteStream('build-log.txt');

const child = spawn('npx', ['vite', 'build', '--debug'], {
  env: { ...process.env, NODE_ENV: 'production' }
});

child.stdout.on('data', (data) => {
  logStream.write(data);
  console.log(data.toString());
});

child.stderr.on('data', (data) => {
  logStream.write(data);
  console.error(data.toString());
});

child.on('close', (code) => {
  logStream.write(`\nProcess exited with code ${code}\n`);
  logStream.end();
});

setTimeout(() => {
  console.log("Terminating build process after 20 seconds...");
  child.kill();
  logStream.write(`\nTerminated by tracer after 20 seconds\n`);
  logStream.end();
  process.exit(0);
}, 20000);
