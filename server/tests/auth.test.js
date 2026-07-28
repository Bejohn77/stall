const test = require('node:test')
const assert = require('node:assert/strict')
const bcrypt = require('bcrypt')
const { validatePasswordStrength, verifyCurrentPassword } = require('../utils/auth')

test('rejects empty or weak passwords', () => {
  assert.equal(validatePasswordStrength(''), 'Password is required.')
  assert.equal(validatePasswordStrength('short'), 'Password must be at least 8 characters long.')
  assert.equal(validatePasswordStrength('abcdefgh'), 'Password must include at least one letter and one number.')
})

test('accepts strong passwords and verifies current password hashes', async () => {
  const valid = validatePasswordStrength('StrongPass1')
  assert.equal(valid, null)

  const hash = await bcrypt.hash('StrongPass1', 10)
  const isValid = await verifyCurrentPassword('StrongPass1', hash)
  assert.equal(isValid, true)
})
