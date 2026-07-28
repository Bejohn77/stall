const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const User = require('../models/User')
const { getMode, getStore, createId } = require('../utils/store')
const { validatePasswordStrength, hashPassword, verifyCurrentPassword } = require('../utils/auth')

function normalizeRole(role) {
  return role === 'staff' ? 'salesman' : role
}

function normalizeStatus(status) {
  return status === 'inactive' ? 'inactive' : 'active'
}

function getAccountStatus(user) {
  return user?.status || (user?.isActive === false ? 'inactive' : 'active')
}

function isAccountActive(user) {
  return getAccountStatus(user) === 'active' && user?.isActive !== false
}

function signToken(user) {
  return jwt.sign({ userId: user._id, username: user.username, role: normalizeRole(user.role) }, process.env.JWT_SECRET || 'stall-secret', { expiresIn: '7d' })
}

async function ensureDefaultAdmin() {
  return null
}

async function login(req, res, next) {
  try {
    const { username, password } = req.body
    const user = await User.findOne({ username: username?.toLowerCase() })

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid username or password.' })
    }

    if (!isAccountActive(user)) {
      return res.status(401).json({ success: false, message: 'This account is inactive.' })
    }

    if (user.role === 'salesman' && user.isApproved === false) {
      return res.status(403).json({ success: false, message: 'Your salesman account is pending admin approval.' })
    }

    const isPasswordValid = await bcrypt.compare(password || '', user.password)
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: 'Invalid username or password.' })
    }

    const token = signToken(user)
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    })

    return res.json({ success: true, token, user: { id: user._id, fullName: user.fullName, username: user.username, role: normalizeRole(user.role), isActive: isAccountActive(user), status: getAccountStatus(user) } })
  } catch (error) {
    next(error)
  }
}

async function logout(req, res) {
  res.clearCookie('token', { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production' })
  return res.json({ success: true, message: 'Logged out successfully.' })
}

async function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body || {}
    const user = await User.findById(req.user?.userId)

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' })
    }

    const passwordError = validatePasswordStrength(newPassword)
    if (passwordError) {
      return res.status(400).json({ success: false, message: passwordError })
    }

    const isCurrentPasswordValid = await verifyCurrentPassword(currentPassword, user.password)
    if (!isCurrentPasswordValid) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect.' })
    }

    user.password = await hashPassword(newPassword)
    user.updatedAt = new Date()
    await user.save()

    return res.json({ success: true, message: 'Password changed successfully.' })
  } catch (error) {
    next(error)
  }
}

async function getProfile(req, res) {
  try {
    const user = await User.findById(req.user.userId).select('-password')
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' })
    return res.json({ success: true, user })
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Unable to fetch profile.' })
  }
}

async function listUsers(req, res, next) {
  try {
    const users = await User.find({}).select('-password').sort({ createdAt: -1 })
    return res.json(users.map((user) => ({ ...user.toObject(), role: normalizeRole(user.role), status: getAccountStatus(user) })))
  } catch (error) {
    next(error)
  }
}

async function createUser(req, res, next) {
  try {
    const { fullName, username, password, phone, role = 'salesman' } = req.body
    const existing = await User.findOne({ username: username?.toLowerCase() })
    if (existing) return res.status(400).json({ success: false, message: 'Username already exists.' })

    const normalizedRole = normalizeRole(role)
    const normalizedStatus = normalizeStatus(req.body.status || 'active')
    const passwordError = validatePasswordStrength(password)
    if (passwordError) {
      return res.status(400).json({ success: false, message: passwordError })
    }
    const hashedPassword = await hashPassword(password)
    const isApproved = normalizedRole === 'admin' || req.user?.role === 'admin'
    const user = await User.create({
      fullName,
      username: username.toLowerCase(),
      password: hashedPassword,
      phone,
      role: normalizedRole,
      status: normalizedStatus,
      isActive: normalizedStatus === 'active',
      isApproved,
    })
    return res.status(201).json({ success: true, user: { id: user._id, fullName: user.fullName, username: user.username, role: normalizeRole(user.role), isActive: user.isActive, status: user.status, isApproved: user.isApproved } })
  } catch (error) {
    next(error)
  }
}

async function requestSalesmanSignup(req, res, next) {
  try {
    const { fullName, username, password, phone } = req.body
    const existing = await User.findOne({ username: username?.toLowerCase() })
    if (existing) return res.status(400).json({ success: false, message: 'Username already exists.' })

    const passwordError = validatePasswordStrength(password)
    if (passwordError) {
      return res.status(400).json({ success: false, message: passwordError })
    }
    const hashedPassword = await hashPassword(password)
    const user = await User.create({
      fullName,
      username: username.toLowerCase(),
      password: hashedPassword,
      phone,
      role: 'salesman',
      status: 'active',
      isActive: true,
      isApproved: false,
    })

    return res.status(201).json({ success: true, message: 'Salesman signup submitted. Waiting for admin approval.' })
  } catch (error) {
    next(error)
  }
}

async function updateUser(req, res, next) {
  try {
    const user = await User.findById(req.params.id)
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' })

    if (req.body.fullName) user.fullName = req.body.fullName
    if (req.body.phone) user.phone = req.body.phone
    if (req.body.role) user.role = normalizeRole(req.body.role)
    if (req.body.status) {
      user.status = normalizeStatus(req.body.status)
      user.isActive = user.status === 'active'
    } else if (typeof req.body.isActive === 'boolean') {
      user.isActive = req.body.isActive
      user.status = req.body.isActive ? 'active' : 'inactive'
    }
    if (typeof req.body.isApproved === 'boolean') user.isApproved = req.body.isApproved
    if (req.body.password) {
      const passwordError = validatePasswordStrength(req.body.password)
      if (passwordError) {
        return res.status(400).json({ success: false, message: passwordError })
      }
      user.password = await hashPassword(req.body.password)
    }
    user.updatedAt = new Date()
    await user.save()
    return res.json({ success: true, user: { id: user._id, fullName: user.fullName, username: user.username, role: normalizeRole(user.role), isActive: user.isActive, status: user.status, isApproved: user.isApproved } })
  } catch (error) {
    next(error)
  }
}

async function resetPassword(req, res, next) {
  try {
    const user = await User.findById(req.params.id)
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' })

    const newPassword = req.body.password
    const passwordError = validatePasswordStrength(newPassword)
    if (passwordError) {
      return res.status(400).json({ success: false, message: passwordError })
    }

    user.password = await hashPassword(newPassword)
    user.updatedAt = new Date()
    await user.save()
    return res.json({ success: true, message: 'Password reset successfully.' })
  } catch (error) {
    next(error)
  }
}

async function deleteUser(req, res, next) {
  try {
    if (req.user?.userId === req.params.id) {
      return res.status(400).json({ success: false, message: 'You cannot delete your own account.' })
    }

    const user = await User.findById(req.params.id)
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' })

    if (user.role === 'admin') {
      return res.status(403).json({ success: false, message: 'Admin accounts cannot be deleted.' })
    }

    await User.findByIdAndDelete(req.params.id)
    return res.json({ success: true, message: 'User deleted successfully.' })
  } catch (error) {
    next(error)
  }
}

module.exports = { login, logout, changePassword, getProfile, listUsers, createUser, updateUser, resetPassword, deleteUser, requestSalesmanSignup, ensureDefaultAdmin }
