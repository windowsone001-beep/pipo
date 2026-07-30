const express = require('express');
const axios = require('axios');
const router = express.Router();
const config = require('../../config/config');
const logger = require('../../utils/logger');

const MANAGE_GUILD = 0x20;

function isManageable(permissionsField) {
  // Discord sends guild.permissions as a stringified bitfield on the user's /users/@me/guilds response.
  const perms = BigInt(permissionsField || 0);
  return (perms & BigInt(MANAGE_GUILD)) === BigInt(MANAGE_GUILD) || (perms & BigInt(0x8)) === BigInt(0x8); // MANAGE_GUILD or ADMINISTRATOR
}

router.get('/login', (req, res) => {
  if (!config.oauth.clientId || !config.oauth.clientSecret) {
    return res.status(500).render('error', {
      title: 'Login unavailable',
      message: 'This dashboard has no CLIENT_ID / CLIENT_SECRET configured yet, so Discord login can\'t work. Set them in your environment and restart.'
    });
  }
  const params = new URLSearchParams({
    client_id: config.oauth.clientId,
    redirect_uri: config.oauth.callbackUrl,
    response_type: 'code',
    scope: config.oauth.scope,
    prompt: 'consent'
  });
  res.redirect(`https://discord.com/api/oauth2/authorize?${params.toString()}`);
});

router.get('/callback', async (req, res) => {
  const { code, error } = req.query;
  if (error) return res.redirect('/?error=' + encodeURIComponent(error));
  if (!code) return res.redirect('/?error=missing_code');

  try {
    const tokenRes = await axios.post(
      'https://discord.com/api/oauth2/token',
      new URLSearchParams({
        client_id: config.oauth.clientId,
        client_secret: config.oauth.clientSecret,
        grant_type: 'authorization_code',
        code,
        redirect_uri: config.oauth.callbackUrl
      }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    const accessToken = tokenRes.data.access_token;
    const authHeader = { headers: { Authorization: `Bearer ${accessToken}` } };

    const [userRes, guildsRes] = await Promise.all([
      axios.get('https://discord.com/api/users/@me', authHeader),
      axios.get('https://discord.com/api/users/@me/guilds', authHeader)
    ]);

   const manageableGuildIds = guildsRes.data
  .filter(guild => isManageable(guild.permissions))
  .map(guild => guild.id);
    const u = userRes.data;

    req.session.user = {
      id: u.id,
      username: u.global_name || u.username,
      handle: u.username,
      avatar: u.avatar
        ? `https://cdn.discordapp.com/avatars/${u.id}/${u.avatar}.png?size=256`
        : `https://cdn.discordapp.com/embed/avatars/${Number(u.discriminator || 0) % 5}.png`,
      banner: u.banner ? `https://cdn.discordapp.com/banners/${u.id}/${u.banner}.png?size=600` : null,
      bannerColor: u.banner_color || u.accent_color ? `#${(u.accent_color || 0).toString(16).padStart(6, '0')}` : null,
      publicFlags: u.public_flags || 0,
      manageableGuildIds,
      isOwner: config.ownerIds.includes(u.id)
    };

    res.redirect('/dashboard');
  } catch (err) {
    logger.error('[dashboard] OAuth2 callback failed', err.response?.data || err);
    res.redirect('/?error=oauth_failed');
  }
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/'));
});

module.exports = router;
