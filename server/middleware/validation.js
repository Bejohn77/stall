const { body, validationResult } = require('express-validator')

function validateRequest(req, res, next) {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: errors.array()[0].msg })
  }
  next()
}

const registerValidation = [
  body('fullName').trim().notEmpty().withMessage('Full name is required.'),
  body('username').trim().isLength({ min: 3 }).withMessage('Username must be at least 3 characters.'),
  body('password').custom((value) => {
    if (typeof value !== 'string' || !value.trim()) {
      throw new Error('Password is required.')
    }
    if (value.length < 8) {
      throw new Error('Password must be at least 8 characters long.')
    }
    if (!/[A-Za-z]/.test(value) || !/\d/.test(value)) {
      throw new Error('Password must include at least one letter and one number.')
    }
    return true
  }),
  body('role').optional().isIn(['admin', 'salesman']).withMessage('Role must be admin or salesman.'),
  body('status').optional().isIn(['active', 'inactive']).withMessage('Status must be active or inactive.'),
]

const loginValidation = [
  body('username').trim().notEmpty().withMessage('Username is required.'),
  body('password').notEmpty().withMessage('Password is required.'),
]

module.exports = { validateRequest, registerValidation, loginValidation }
