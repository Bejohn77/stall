const jwt = require('jsonwebtoken')
const User = require('../models/User')

function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization || ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : req.cookies?.token || req.headers['x-access-token'] || ''

  if (!token) {
    return res.status(401).json({ success: false, message: 'Authentication required.' })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'stall-secret')
    req.user = decoded
    next()
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token.' })
  }
}

function authorizeRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required.' })
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'You do not have permission to perform this action.' })
    }

    next()
  }
}

async function attachUser(req, res, next) {
  const authHeader = req.headers.authorization || ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : req.cookies?.token || req.headers['x-access-token'] || ''

  if (!token) return next()

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'stall-secret')
    const user = await User.findById(decoded.userId).select('-password')
    req.user = decoded
    req.authUser = user
  } catch (error) {
    req.user = null
    req.authUser = null
  }

  next()
}

module.exports = { verifyToken, authorizeRole, attachUser }
