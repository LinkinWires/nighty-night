import * as mc from 'minecraft-protocol';
import { setupValues } from './configSetup';

console.debug('Reading the localization file...');

const localeFile = Bun.file('locale.json');
const locale = await localeFile.json();
const language = process.env.LANGUAGE ? process.env.LANGUAGE : 'en_US';

console.debug(locale[language].log.configInit);

const config = await setupValues();

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

console.debug(locale[language].log.serverInit, config.version);

let serverProcess: Bun.Subprocess | null = null;
let serverHandler = function (client: mc.ServerClient) {
    console.debug(locale[language].log.realServerStarting, `${process.cwd()}/${config.serverDir}`, config.launchCmd);
    client.end(locale[language].serverActions.disconnectReason);
    server.close();
    try {
        serverProcess = Bun.spawn(config.launchCmd.trim().split(' '), {
            cwd: config.serverDir,
            stdout: 'inherit',
            stdin: 'inherit',
            onExit(_proc, _exitCode, _signalCode, _error) {
                console.debug(locale[language].log.serverRestarting);
                server = mc.createServer(serverConfig);
                serverInit(server);
            }
        });
    } catch (e) {
        console.debug(locale[language].error.serverLaunchError);
        server = mc.createServer(serverConfig);
        serverInit(server);
    }
}
function serverInit(server: mc.Server) {
    server.on('login', serverHandler);
}

let server = mc.createServer(serverConfig);
serverInit(server);

process.on("SIGINT", async () => {
    console.log(locale[language].log.interrupt);
    if (serverProcess) serverProcess.kill();
    server.close();
    process.exit();
});

console.log(locale[language].log.serverStarted, config.serverVersion, config.serverIp, config.serverPort);
