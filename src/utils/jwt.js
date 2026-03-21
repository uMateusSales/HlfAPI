// src/utils/jwt.js
const jwt = require('jsonwebtoken')

const SECRET  = process.env.JWT_SECRET
const EXPIRES = process.env.JWT_EXPIRES_IN || '7d'

// Gera um JWT com os dados essenciais do usuário no payload
function generateToken(user) {
  return jwt.sign(
    {
      id:       user.id,
      email:    user.email,
      name:     user.name,
      username: user.username,
    },
    SECRET,
    { expiresIn: EXPIRES }
  )
}

// Seta o JWT em um cookie httpOnly (mais seguro que localStorage)
function setTokenCookie(res, token) {
  res.cookie('token', token, {
    httpOnly: true,                                    // JavaScript do front não consegue ler
    secure:   process.env.NODE_ENV === 'production',   // HTTPS apenas em produção
    sameSite: 'lax',                                   // proteção CSRF básica
    maxAge:   7 * 24 * 60 * 60 * 1000,                // 7 dias em ms
  })
}

module.exports = { generateToken, setTokenCookie }
