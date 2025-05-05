import * as mc from 'minecraft-protocol';
import { setupValues } from './configSetup';
import { sleep, type FileSink } from 'bun';

function sendCommandToServer(command: string) {
    if (serverProcess && serverProcess.stdin && typeof serverProcess.stdin !== 'number') {
        const std = serverProcess.stdin;
        const encoder = new TextEncoder();
        std.write(encoder.encode(`${command}\n`));
        std.flush();
    } else {
        console.error(`Failed to get Minecraft server process' stdin`);
    }
}

function serverInit(server: mc.Server) {
    server.on('login', initRealServer);
}

function spawnServerProcess() {
    try {
        serverProcess = Bun.spawn(config.launchCmd.trim().split(' '), {
            cwd: config.serverDir,
            stdin: 'pipe',
            stdout: 'inherit',
            async onExit(_proc, exitCode, _signalCode, error) {
                if (exitCode !== 0) {
                    if (config.watchdogDelay > 0) {
                        console.debug(locale[language].error.serverCrashed, config.watchdogDelay);
                        await sleep(config.watchdogDelay * 1000);
                        spawnServerProcess();
                    } else {
                        throw error;
                    }
                } else {
                    console.debug(locale[language].log.serverRestarting);
                    server = mc.createServer(serverConfig);
                    serverInit(server);
                }
            }
        });
    } catch (e) {
        console.debug(locale[language].error.serverLaunchError, e);
        server = mc.createServer(serverConfig);
        serverInit(server);
    }
}

function initRealServer(client?: mc.ServerClient) {
    console.debug(locale[language].log.realServerStarting, `${process.cwd()}/${config.serverDir}`, config.launchCmd);
    if (client) client.end(locale[language].serverActions.disconnectReason);
    server.close();
    spawnServerProcess();
}

async function exitProgram() {
    if (serverProcess) {
        console.debug(locale[language].log.serverStopMinecraft);
        sendCommandToServer('stop');
        await serverProcess.exited;
    } else {
        console.debug(locale[language].log.serverStop);
        server.close();
    }
    console.log(locale[language].log.nightyClose);
    process.exit();
}

async function reloadConfig() {
    console.debug(locale[language].log.serverStop);
    server.close();
    console.debug(locale[language].log.configInit);
    config = await setupValues();
    serverConfig.host = config.serverIp;
    serverConfig.port = config.serverPort;
    serverConfig.version = config.serverVersion;
    serverConfig.motd = `${locale[language].motd.sleepPrefix} ${config.serverMotd}
${locale[language].motd.wakeUpTip}`;
    serverConfig.maxPlayers = config.maxPlayers;
    serverConfig.favicon = config.favicon;
    console.debug(locale[language].log.serverRestarting);
    server = mc.createServer(serverConfig);
    serverInit(server);
}

console.debug('Reading the localization file...');

const localeFile = Bun.file('locale.json');
const locale = await localeFile.json();
const language = process.env.LANGUAGE ? process.env.LANGUAGE : 'en_US';

console.debug(locale[language].log.configInit);

let config = await setupValues();

const serverConfig = {
    host: config.serverIp,
    port: config.serverPort,
    version: config.serverVersion,
    'online-mode': false,
    motd: `${locale[language].motd.sleepPrefix} ${config.serverMotd}
${locale[language].motd.wakeUpTip}`,
    maxPlayers: config.maxPlayers,
    favicon: config.favicon,
}

console.debug(locale[language].log.nightyInit, config.version);

let serverProcess: Bun.Subprocess | null = null;

let server: mc.Server = mc.createServer(serverConfig);
serverInit(server);

process.on("SIGINT", async () => {
    console.log(locale[language].log.interrupt);
    await exitProgram();
});

console.log(locale[language].log.serverStarted, config.serverVersion, config.serverIp, config.serverPort, Bun.nanoseconds() / 1000000000);
while (1) {
    console.write('> ');
    for await (const line of console) {
        if (serverProcess && !(serverProcess as Bun.Subprocess).killed) {
            sendCommandToServer(line);
        } else {
            switch (line) {
                case 'exit':
                case 'stop':
                    await exitProgram();
                    break;
                case 'reloadConfig':
                    await reloadConfig();
                    break;
                case 'startServer':
                    initRealServer();
                    break;
                case 'help':
                    console.log(locale[language].serverActions.help);
                    break;
                default:
                    console.log(locale[language].serverActions.unknownCommand);
                    break;
            }
            console.write('> ');
        }
    }
}