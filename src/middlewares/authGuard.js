const jwt = require('jsonwebtoken')

function authGuard(req, res, next) {
  // Aceita token via header Authorization: Bearer <token>
  // ou via cookie httpOnly (mais seguro)
  const token =
    req.cookies?.token ||
    req.headers.authorization?.replace('Bearer ', '')

  if (!token) {
    return res.status(401).json({ error: 'Autenticação necessária.' })
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET)
    req.user = payload // { id, email, name } disponível nas rotas
    next()
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido ou expirado.' })
  }
}
function authOptional(req, res, next) {
  const token =
    req.cookies?.token ||
    req.headers.authorization?.replace('Bearer ', '')

  if (!token) return next() // sem token, continua sem user

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET)
    req.user = payload
  } catch {
    // token inválido, ignora e continua
  }
  next()
}

module.exports = {authGuard, authOptional}
