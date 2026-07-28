module.exports = function errorHandler(err, req, res, next) {
  if (err?.type === 'entity.parse.failed') {
    return res.status(400).json({ success: false, message: 'Invalid JSON payload.' })
  }

  console.error(err)
  res.status(err?.status || 500).json({ success: false, message: err?.message || 'Something went wrong' })
}
