module.exports = function notFound(req, res) {
  res.status(404).json({ message: 'Route not found' })
}
