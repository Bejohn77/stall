const bcrypt = require('bcrypt')

function validatePasswordStrength(password) {
  if (typeof password !== 'string' || !password.trim()) {
    return 'Password is required.'
  }

  if (password.length < 8) {
    return 'Password must be at least 8 characters long.'
  }

  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    return 'Password must include at least one letter and one number.'
  }

  return null
}

async function hashPassword(password) {
  return bcrypt.hash(password, 10)
}

async function verifyCurrentPassword(password, storedHash) {
  if (!storedHash) {
    return false
  }

  return bcrypt.compare(password || '', storedHash)
}

module.exports = {
  validatePasswordStrength,
  hashPassword,
  verifyCurrentPassword,
}
