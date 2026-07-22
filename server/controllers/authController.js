const bcrypt = require('bcrypt')

async function verifyProductsPassword(req, res) {
  try {
    const { password } = req.body || {}
    const expectedHash = process.env.PRODUCTS_PAGE_PASSWORD

    if (!expectedHash || typeof password !== 'string' || !password.trim()) {
      return res.status(400).json({ success: false })
    }

    const isMatch = await bcrypt.compare(password, expectedHash)
    return res.json({ success: isMatch })
  } catch (error) {
    console.error('Products password verification failed:', error.message)
    return res.status(500).json({ success: false })
  }
}

module.exports = {
  verifyProductsPassword,
}
