const express = require('express')
const router = express.Router()
const {authGuard} = require('../middlewares/authGuard')

// GET /api/users/:username/studies — perfil público de um usuário
router.get('/:username/studies', (req, res) => {
  res.json({ message: `Estudos de @${req.params.username} — em construção` })
})

// GET /api/users/me — perfil do usuário logado
router.get('/me', authGuard, (req, res) => {
  res.json({ user: req.user })
})

module.exports = router
