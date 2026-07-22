module.exports = function errorHandler(err, req, res, next) {
  console.error(err)
  res.status(err.status || 500).json({ message: err.message || 'Something went wrong' })
}
