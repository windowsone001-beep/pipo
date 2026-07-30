const { writeBotGuilds } = require('../utils/botGuildsFile');

module.exports = {
  name: 'guildDelete',
  async execute(guild, client) {
    writeBotGuilds(client);
  }
};
