// Decodes a Discord user's `public_flags` bitfield (returned by the OAuth2
// /users/@me endpoint) into real badges — same flags Discord's own client uses.
// Reference: https://discord.com/developers/docs/resources/user#user-object-user-flags
const FLAGS = [
  { bit: 1 << 0, key: 'staff', label: 'Discord Employee', icon: 'fa-solid fa-user-tie' },
  { bit: 1 << 1, key: 'partner', label: 'Partnered Server Owner', icon: 'fa-solid fa-handshake' },
  { bit: 1 << 2, key: 'hypesquad', label: 'HypeSquad Events', icon: 'fa-solid fa-bolt' },
  { bit: 1 << 3, key: 'bug_hunter_1', label: 'Bug Hunter', icon: 'fa-solid fa-bug' },
  { bit: 1 << 6, key: 'hypesquad_bravery', label: 'HypeSquad Bravery', icon: 'fa-solid fa-shield-halved' },
  { bit: 1 << 7, key: 'hypesquad_brilliance', label: 'HypeSquad Brilliance', icon: 'fa-solid fa-gem' },
  { bit: 1 << 8, key: 'hypesquad_balance', label: 'HypeSquad Balance', icon: 'fa-solid fa-scale-balanced' },
  { bit: 1 << 9, key: 'early_supporter', label: 'Early Supporter', icon: 'fa-solid fa-star' },
  { bit: 1 << 14, key: 'bug_hunter_2', label: 'Bug Hunter Gold', icon: 'fa-solid fa-bug-slash' },
  { bit: 1 << 17, key: 'verified_bot_dev', label: 'Early Verified Bot Developer', icon: 'fa-solid fa-code' },
  { bit: 1 << 18, key: 'certified_mod', label: 'Certified Moderator', icon: 'fa-solid fa-gavel' },
  { bit: 1 << 22, key: 'active_developer', label: 'Active Developer', icon: 'fa-solid fa-laptop-code' }
];

function getBadges(publicFlags) {
  const flags = Number(publicFlags) || 0;
  return FLAGS.filter(f => (flags & f.bit) === f.bit).map(({ key, label, icon }) => ({ key, label, icon }));
}

module.exports = { getBadges };
