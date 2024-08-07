// manager/process-manager.ts
import { spawn } from 'child_process';

function startMicroservice(path: string, port: number, envSettings?: any) {

    envSettings = envSettings || {}
    const childProcess = spawn('node', [path], {
        env: { ...process.env, ...envSettings, PORT: port.toString() },
    });

    childProcess.stdout.on('data', (data) => {
        // console.log(`stdout: ${data}`);
    });

    childProcess.stderr.on('data', (data) => {
        console.error(`stderr: ${data}`);
    });

    childProcess.on('close', (code) => {
        console.log(`child process exited with code ${code}`);
    });

    return childProcess;
}

export function startMicroservices(starterPort: number) {

    //todo : micro servis starter
    const services = [
    ];

    // services.push({
    //     path: 'dist/_microservices/bitcoin/main.js', port: starterPort++, envSettings: {
    //         LOGGER_FILE_PREFIX: "bitcoin"
    //     }
    // })

    // services.push({
    //     path: 'dist/_microservices/ethereum/main.js', port: starterPort++, envSettings: {
    //         LOGGER_FILE_PREFIX: "ethereum"
    //     }
    // })

    services.push({
        path: 'dist/_microservices/tron/main.js', port: starterPort++, envSettings: {
            LOGGER_FILE_PREFIX: "tron"
        }
    })

    // services.push({
    //     path: 'dist/_microservices/avalanche/main.js', port: starterPort++, envSettings: {
    //         LOGGER_FILE_PREFIX: "avalanche"
    //     }
    // })

    // services.push({
    //     path: 'dist/_microservices/ethereum-contract/main.js', port: starterPort++, envSettings: {
    //         NETWORK_ETHEREUM_TOKEN_GROUP_INDEX: 0,
    //         LOGGER_FILE_PREFIX: "ethereum_contract_g0"
    //     }
    // })

    // services.push({
    //     path: 'dist/_microservices/ethereum-contract/main.js', port: starterPort++, envSettings: {
    //         NETWORK_ETHEREUM_TOKEN_GROUP_INDEX: 1,
    //         LOGGER_FILE_PREFIX: "ethereum_contract_g1"
    //     }
    // })

    services.push({
        path: 'dist/_microservices/tron-contract/main.js', port: starterPort++, envSettings: {
            NETWORK_TRON_TOKEN_GROUP_INDEX: 0,
            LOGGER_FILE_PREFIX: "tron_contract_g0"
        }
    })


    services.forEach(service => startMicroservice(service.path, service.port, service.envSettings));
}