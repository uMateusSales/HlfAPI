const express = require('express')
const router = express.Router()
const authGuard = require('../src/middlewares/authGuard')
const studyController = require('../src/controllers/study.controller')

// ─── Rotas públicas ───────────────────────────────────────────────────────────
router.get('/', studyController.listPublic)            // lista estudos públicos
router.get('/:slug', studyController.getBySlug)        // aceita slug ou id

// ─── Rotas protegidas (requer JWT) ────────────────────────────────────────────
router.use(authGuard)

router.post('/', studyController.create)               // criar novo estudo
router.put('/:id', studyController.update)             // editar estudo (dono apenas)
router.delete('/:id', studyController.remove)          // deletar estudo (dono apenas)
router.patch('/:id/publish', studyController.togglePublish) // publicar/despublicar

module.exports = router