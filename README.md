# Nighty Night

Minecraft mini server, which wakes up a real Minecraft server upon receiving connection.

## Installing:

### Regular server
0. Make sure you have [Bun](https://bun.sh/) installed
1. Either download the latest release or clone the repository into any directory (i. e. your Minecraft server directory)
2. Go to the Nighty Night directory and run `bun i` to install all dependencies
3. Edit `config.toml` to your liking
    - At the very least you need to check if `launch_settings.server_directory`, `launch_settings.launch_command` and `server_properties.server_version` have the right values for you
4. Launch Nighty Night by running `bun run index.ts`

### [Crafty Controller](https://craftycontrol.com/)
Although it is possible to use Nighty Night in Crafty, it's hacky, so it is recommended to backup Crafty (as it has a tendency to break at the slightest inconveniences) and either backup your Minecraft server or install Nighty Night on a new Minecraft server.

0. If you don't have a Minecraft server in Crafty, create one
1. Install [Bun](https://bun.sh/)
   - The recommended way is [downloading the binary](https://bun.sh/docs/installation#downloading-bun-binaries-directly) and putting it in `/usr/bin`, so that every user in the system can have access to the binary. The [official install script](https://bun.sh/docs/installation#installing) installs Bun into `~/.bun`, so if using that, make sure that `crafty` user has access to the binary
2. Locate your Minecraft server directory. You can do that in the Config tab of your Minecraft server in Crafty
3. Either download the latest release or clone the repository into the Minecraft server directory
4. Run `bun i` to install all dependencies
5. Edit `config.toml`:
    - `launch_settings.server_directory` must be empty
    - `launch_settings.launch_command` should use the Server Execution Command value from the Config tab
    - `server_properties.server_version` should be equal to the Minecraft server version (as long as it's supported by the Nighty Night)
6. Edit Server Execution Command value in the Config tab to `*full path to Bun binary*/bun run index.ts`

Any installs involving Docker are not supported for the time being.