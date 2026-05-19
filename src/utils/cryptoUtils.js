const crypto = require('crypto');

/**
 * Hash a password using secure native PBKDF2
 * @param {string} password 
 * @returns {string} salt:hash format
 */
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

/**
 * Verify a password against a stored PBKDF2 salt:hash
 * @param {string} password 
 * @param {string} storedPassword 
 * @returns {boolean}
 */
function verifyPassword(password, storedPassword) {
  if (!storedPassword || !storedPassword.includes(':')) {
    return false;
  }
  const [salt, hash] = storedPassword.split(':');
  const checkHash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return hash === checkHash;
}

module.exports = {
  hashPassword,
  verifyPassword,
};
