const config = require('../../config/config');

function requireAuth(req, res, next) {
  if (!req.session.user) return res.redirect('/');
  res.locals.user = req.session.user;
  next();
}

function requireOwner(req, res, next) {
  if (!req.session.user) return res.redirect('/');
  if (!req.session.user.isOwner) {
    return res.status(403).render('error', {
      title: 'Admins only',
      message: "This area is restricted to the bot's owner(s)."
    });
  }
  res.locals.user = req.session.user;
  next();
}

function requireGuildAccess(req, res, next) {
  const { user } = req.session;
  if (!user) return res.redirect('/');
  const guildId = req.params.guildId;
  if (!user.isOwner && !user.manageableGuildIds.includes(guildId)) {
    return res.status(403).render('error', {
      title: 'No access to this server',
      message: "You don't have the Manage Server permission on this Discord server, so you can't view or change its settings here."
    });
  }
  res.locals.user = user;
  next();
}

module.exports = { requireAuth, requireOwner, requireGuildAccess };
