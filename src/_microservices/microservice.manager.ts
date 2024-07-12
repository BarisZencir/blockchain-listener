// manager/process-manager.ts
import { spawn } from 'child_process';

function startMicroservice(path: string, port: number) {
    const childProcess = spawn('node', [path], {
      env: { ...process.env, PORT: port.toString() },
    });
  
    childProcess.stdout.on('data', (data) => {
      console.log(`stdout: ${data}`);
    });
  
    childProcess.stderr.on('data', (data) => {
      console.error(`stderr: ${data}`);
    });
  
    childProcess.on('close', (code) => {
      console.log(`child process exited with code ${code}`);
    });
  
    return childProcess;
}

export function startMicroservices() {
    const services = [
        { path: 'dist/_microservices/bitcoin/main.js', port: 3001 },
        { path: 'dist/_microservices/ethereum/main.js', port: 3002 },
    ];

    services.forEach(service => startMicroservice(service.path, service.port));
}1