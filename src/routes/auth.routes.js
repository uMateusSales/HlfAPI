// src/routes/auth.routes.js
const express  = require('express')
const passport = require('../config/passport')
const { generateToken, setTokenCookie } = require('../utils/jwt')
const {authGuard} = require('../middlewares/authGuard')

const router = express.Router()

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000'

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Callback compartilhado entre Google e GitHub:
// gera o JWT, seta o cookie e redireciona para o Next.js
function oauthCallback(req, res) {
  const token = generateToken(req.user)
  // Passa o token pela URL — o front salva no localStorage
  res.redirect(`${FRONTEND_URL}/admin?token=${token}`)
}

// ─── Google ───────────────────────────────────────────────────────────────────

// Passo 1: redireciona o usuário para a tela de login do Google
// GET /api/auth/google
router.get(
  '/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: false,
  })
)

// Passo 2: Google redireciona de volta aqui após o usuário autorizar
// GET /api/auth/google/callback
router.get(
  '/google/callback',
  passport.authenticate('google', {
    session: false,
    failureRedirect: `${FRONTEND_URL}/login?error=google_auth_failed`,
  }),
  oauthCallback
)

// ─── GitHub ───────────────────────────────────────────────────────────────────

/
// ─── Sessão atual ─────────────────────────────────────────────────────────────

// GET /api/auth/me — retorna o usuário logado (lido do JWT)
// Usado pelo Next.js para verificar se a sessão ainda é válida
router.get('/me', authGuard, (req, res) => {
  res.json({ user: req.user })
})

// ─── Logout ───────────────────────────────────────────────────────────────────

// POST /api/auth/logout — limpa o cookie do JWT
router.post('/logout', (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  })
  res.json({ message: 'Logout realizado com sucesso.' })
})

module.exports = router