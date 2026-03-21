function adminOnly(req, res, next) {
  if (req.user?.email !== process.env.ADMIN_EMAIL) {
    return res.status(403).json({ error: 'Acesso restrito.' })
  }
  next()
}

module.exports = adminOnly