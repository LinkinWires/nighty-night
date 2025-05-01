import * as mc from 'minecraft-protocol';
import { getProperties } from 'properties-file';

export interface Config {
    version: string,
    serverDir?: string,
    launchCmd: string,
    serverVersion: string,
    serverIp: string,
    serverPort: number,
    serverMotd: string,
    maxPlayers: number,
    favicon: string,
}

const localeFile = Bun.file('locale.json');
const locale = await localeFile.json();
const language = process.env.LANGUAGE ? process.env.LANGUAGE : 'en_US';

function readEnvironmentalVariables() {
    return {
        serverDir: process.env.SERVER_DIR ? process.env.SERVER_DIR : undefined,
        launchCmd: process.env.LAUNCH_CMD ? process.env.LAUNCH_CMD : undefined,
        serverVersion: process.env.SERVER_VERSION ? process.env.SERVER_VERSION : undefined,
        serverIp: process.env.SERVER_IP ? process.env.SERVER_IP : undefined,
        serverPort: process.env.SERVER_PORT && !isNaN(parseInt(process.env.SERVER_PORT)) ? parseInt(process.env.SERVER_PORT) : undefined,
        serverMotd: process.env.SERVER_MOTD ? process.env.SERVER_MOTD : undefined,
        maxPlayers: process.env.MAX_PLAYERS && !isNaN(parseInt(process.env.MAX_PLAYERS)) ? parseInt(process.env.MAX_PLAYERS) : undefined,
    };
}

async function readConfig() {
    try {
        const configTomlFile = Bun.file('config.toml');
        const configTomlText = await configTomlFile.text();
        const config: any = Bun.TOML.parse(configTomlText);
        
        return {
            serverDir: config.launch_settings.server_directory && typeof config.launch_settings.server_directory === 'string' ? config.launch_settings.server_directory : undefined,
            launchCmd: config.launch_settings.launch_command && typeof config.launch_settings.launch_command === 'string' ? config.launch_settings.launch_command : undefined,
            serverVersion: config.server_properties.server_version && typeof config.server_properties.server_version === 'string' ? config.server_properties.server_version : undefined,
            serverIp: config.server_properties.server_ip && typeof config.server_properties.server_ip === 'string' ? config.server_properties.server_ip : undefined,
            serverPort: config.server_properties.server_port && typeof config.server_properties.server_port === 'number' ? config.server_properties.server_port : undefined,
            serverMotd: config.server_properties.server_motd && typeof config.server_properties.server_motd === 'string' ? config.server_properties.server_motd : undefined,
            maxPlayers: config.server_properties.max_players && typeof config.server_properties.max_players === 'number' ? config.server_properties.max_players : undefined,
        }
    } catch (e) {
        console.error(locale[language].error.configTomlParseError, e);
        return {};
    }
}

async function readServerProperties(cwd?: string): Promise<any> {
    try {
        const serverPropertiesFile = Bun.file(`${cwd}server.properties`);
        const serverPropertiesText = await serverPropertiesFile.text();
        const serverProperties = getProperties(serverPropertiesText);

        const serverPropertiesConfig = {
            serverIp: serverProperties['server-ip'] ? serverProperties['server-ip'] : '',
            serverPort: serverProperties['server-port'] && !isNaN(parseInt(serverProperties['server-port'])) ? parseInt(serverProperties['server-port']) : 0,
            serverMotd: serverProperties['motd'] ? serverProperties['motd'] : '',
            maxPlayers: serverProperties['max-players'] && !isNaN(parseInt(serverProperties['max-players'])) ? parseInt(serverProperties['max-players']) : 0,
        }

        return serverPropertiesConfig;
    } catch (e) {
        console.error(locale[language].error.serverPropertiesParseError, e);
        return {};
    }
}

async function readServerIcon(cwd?: string): Promise<string> {
    try {
        const serverIconFile = Bun.file(`${cwd}server-icon.png`);
        const serverIconBytes = await serverIconFile.bytes();
        return `data:image/png;base64,${serverIconBytes.toBase64()}`
    } catch (e) {
        console.error(locale[language].error.serverIconReadError, e);
        return '';
    }
}

function setDefaultValues(): Config {
    const index = mc.supportedVersions.length - 1;
    return {
        version: '1.0',
        serverDir: undefined,
        launchCmd: 'java -jar server.jar nogui',
        serverVersion: mc.supportedVersions[index] ? mc.supportedVersions[index] : mc.defaultVersion,
        serverIp: '0.0.0.0',
        serverPort: 25565,
        serverMotd: 'A Minecraft Server',
        maxPlayers: 20,
        favicon: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAACXBIWXMAAA9hAAAPYQGoP6dpAAADPUlEQVR4AWIYBaNgZANGXN7///8/uhQ/AwNDCAMDgwUDA4MguuQg4b9nYGA4wcDAsIaBgeEjspsYGXF6FTsABQAS9vn///+L/0MHgNzqjeR+7J5kYGBgAhF4MCjYJjMwMGxmYGAQx6NusEmB3LqFgYEB5HaQH0h3HzT00oZOpON0aSrIL7hCAGfo/P//X5WBgeECAwMDF5LmIwwMDMsZGBheMzAwYBQSSOoGggnyiygDA0MkAwODDZIDvjEwMBgwMjLeRhIjzPz///9ctDBd9v//fyZQaA5yDHIjyK3Izp+Ly8egUMMq9////0cMDAyySJJaDAwM15H4g5mpycDAcA3JgY8ZGRnlkPhwJr4A+MfAgCLPwsDA8Beuc3AzmBkYGP4gOfE/IyMj1gIfqyBUI3rgDBXPg5yP7lZ0v4DUgDG+AAArGO7EaADQOYZlGBgYTjEwMPxgYGCYBi1jQMkTxAaJgeRAaujsLCwAuQ6BskFVI6V4KtQsGOXw//9/EIbxQTRIDaX2gPSDzIJjLF4EC4FKdjCDTgSoiYpslQgyB8pGVwMVpg1F7yxAG19QYOqIDwBSsgCoj01BWIO1BoNJ/ARIDTXswm8LVJaUAAA5DKqN5hTd7CIlAGjh69+0MJQUMwcyAO4xMDDshzoWxFaCsulKgRohWC0EVaBoEqFofEq4oJgHef4T1BA+BgYGRwYGBlYonxrUamRDGHEMCpISADjVIls0iNgoAza4AmDEV4OjATCIkuyAOGU0AAYk2AeRpaMBMIgiY0CcMhoAAxLsg8jS0QAYRJExIE4ZDYABCfZBZOloAAyiyBgQp4wGwIAE+yCydDQABlFkDIhTRgNgQIJ9EFk6GgCDKDIGxCmjATAgwT6ILB0NgEEUGQPilNEAwBPsKJOLDAwMoOWneJQPKil0t6L7Be5YfAHwBK4KwlCDUEOCRHcrul/gnsAXALvhqiCMWiJ2mEBUDiwJ8hPIrciuQPcLXA7nnP8w2jDxFbph4g7c18QwoJsihv2WGVBywRcesxkYGKbgUzDI5UCbpuaQ5UZoCoDRoC1ooK1ooKVDQwGD3ApyM8z9OMMAXxmArmlkbZwcBaMAsJERAgB4u8zZmSS5KgAAAABJRU5ErkJggg==',
    }
}

export async function setupValues(): Promise<Config> {
    const envVars = readEnvironmentalVariables();
    const configToml = await readConfig();
    const serverProps = await readServerProperties(envVars.serverDir ? envVars.serverDir : configToml.serverDir ? configToml.serverDir : undefined);
    const defaults = setDefaultValues();
    const serverIcon = await readServerIcon(envVars.serverDir ? envVars.serverDir : configToml.serverDir ? configToml.serverDir : undefined);

    return {
        version: defaults.version,
        serverDir: envVars.serverDir ? envVars.serverDir : configToml.serverDir ? configToml.serverDir : defaults.serverDir,
        launchCmd: envVars.launchCmd ? envVars.launchCmd : configToml.launchCmd ? configToml.launchCmd : defaults.launchCmd,
        serverVersion: envVars.serverVersion ? envVars.serverVersion : configToml.serverVersion ? configToml.serverVersion : defaults.serverVersion,
        serverIp: envVars.serverIp ? envVars.serverIp : configToml.serverIp ? configToml.serverIp : serverProps.serverIp ? serverProps.serverIp : defaults.serverIp,
        serverPort: envVars.serverPort ? envVars.serverPort : configToml.serverPort ? configToml.serverPort : serverProps.serverPort ? serverProps.serverPort : defaults.serverPort,
        serverMotd: envVars.serverMotd ? envVars.serverMotd : configToml.serverMotd ? configToml.serverMotd : serverProps.serverMotd ? serverProps.serverMotd : defaults.serverMotd,
        maxPlayers: envVars.maxPlayers ? envVars.maxPlayers : configToml.maxPlayers ? configToml.maxPlayers : serverProps.maxPlayers ? serverProps.maxPlayers : defaults.maxPlayers,
        favicon: serverIcon ? serverIcon : defaults.favicon,
    }
}