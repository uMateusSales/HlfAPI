const express = require('express')
const router = express.Router()
const { authGuard, authOptional } = require('../middlewares/authGuard')
const studyController = require('../controllers/study.controller')
const adminOnly = require('../middlewares/adminOnly')

// ─── Rotas públicas ───────────────────────────────────────────────────────────
// rotas públicas
router.get('/', studyController.listPublic)
router.get('/mine', authGuard, studyController.listMine)
router.get('/:slug', authOptional, studyController.getBySlug) // ← authOptional aqui

// rotas protegidas
router.use(authGuard)
router.use(adminOnly)
router.post('/', studyController.create)
router.put('/:id', studyController.update)
router.delete('/:id', studyController.remove)
router.patch('/:id/publish', studyController.togglePublish)



module.exports = router