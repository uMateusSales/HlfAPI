const express = require('express')
const router = express.Router()
const {authGuard} = require('../middlewares/authGuard')
const chartController = require('../controllers/chart.controller')
const adminOnly = require('../middlewares/adminOnly')

// ─── Rotas públicas ───────────────────────────────────────────────────────────
router.get('/:studyId/charts', chartController.listByStudy)
router.get('/:studyId/charts/:chartId', chartController.getById)

// ─── Rotas protegidas ─────────────────────────────────────────────────────────
router.use(authGuard)
router.use(adminOnly)

router.post('/:studyId/charts', chartController.create)
router.put('/:studyId/charts/:chartId', chartController.update)
router.delete('/:studyId/charts/:chartId', chartController.remove)

router.post('/:studyId/charts/:chartId/points', chartController.addPoints)
router.put('/:studyId/charts/:chartId/points', chartController.replacePoints)
router.delete('/:studyId/charts/:chartId/points', chartController.clearPoints)

module.exports = router