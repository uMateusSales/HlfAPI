const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function assertOwner(chartId, userId) {
  const chart = await prisma.chart.findUnique({
    where:   { id: chartId },
    include: { study: { select: { userId: true } } },
  })
  if (!chart)                        throw { statusCode: 404, message: 'Gráfico não encontrado.' }
  if (chart.study.userId !== userId) throw { statusCode: 403, message: 'Sem permissão.' }
  return chart
}

async function listByStudy(req, res, next) {
  try {
    const charts = await prisma.chart.findMany({
      where:   { studyId: req.params.studyId },
      orderBy: { order: 'asc' },
      include: { points: { orderBy: { timestamp: 'asc' } } },
    })
    res.json(charts)
  } catch (err) { next(err) }
}

async function getById(req, res, next) {
  try {
    const chart = await prisma.chart.findUnique({
      where:   { id: req.params.chartId },
      include: { points: { orderBy: { timestamp: 'asc' } } },
    })
    if (!chart || chart.studyId !== req.params.studyId) {
      return res.status(404).json({ error: 'Gráfico não encontrado.' })
    }
    res.json(chart)
  } catch (err) { next(err) }
}

async function create(req, res, next) {
  try {
    const { studyId } = req.params
    const { title, type, analysis, config, order, points = [] } = req.body

    if (!title?.trim()) return res.status(400).json({ error: 'Título é obrigatório.' })

    const study = await prisma.study.findUnique({ where: { id: studyId } })
    if (!study)                       return res.status(404).json({ error: 'Estudo não encontrado.' })
    if (study.userId !== req.user.id) return res.status(403).json({ error: 'Sem permissão.' })

    const validationError = validatePoints(points)
    if (validationError) return res.status(400).json({ error: validationError })

    const chart = await prisma.chart.create({
      data: {
        title: title.trim(),
        type:     type     ?? 'LINE',
        analysis: analysis ?? null,
        config:   config   ?? {},
        order:    order    ?? 0,
        studyId,
        points: {
          create: points.map((p) => ({
            timestamp: new Date(p.timestamp),
            close:     String(p.close),
          })),
        },
      },
      include: { points: { orderBy: { timestamp: 'asc' } } },
    })
    res.status(201).json(chart)
  } catch (err) { next(err) }
}

async function update(req, res, next) {
  try {
    await assertOwner(req.params.chartId, req.user.id)
    const { title, type, analysis, config, order } = req.body
    const updated = await prisma.chart.update({
      where: { id: req.params.chartId },
      data: {
        ...(title    !== undefined && { title: title.trim() }),
        ...(type     !== undefined && { type }),
        ...(analysis !== undefined && { analysis }),
        ...(config   !== undefined && { config }),
        ...(order    !== undefined && { order }),
      },
      include: { points: { orderBy: { timestamp: 'asc' } } },
    })
    res.json(updated)
  } catch (err) { next(err) }
}

async function remove(req, res, next) {
  try {
    await assertOwner(req.params.chartId, req.user.id)
    await prisma.chart.delete({ where: { id: req.params.chartId } })
    res.status(204).send()
  } catch (err) { next(err) }
}

async function addPoints(req, res, next) {
  try {
    const { chartId } = req.params
    await assertOwner(chartId, req.user.id)
    const { points = [] } = req.body
    if (!points.length) return res.status(400).json({ error: 'Envie ao menos um ponto.' })
    const validationError = validatePoints(points)
    if (validationError) return res.status(400).json({ error: validationError })
    await prisma.chartPoint.createMany({
      data: points.map((p) => ({
        chartId,
        timestamp: new Date(p.timestamp),
        close:     String(p.close),
      })),
      skipDuplicates: true,
    })
    const count = await prisma.chartPoint.count({ where: { chartId } })
    res.status(201).json({ inserted: points.length, total: count })
  } catch (err) { next(err) }
}

async function replacePoints(req, res, next) {
  try {
    const { chartId } = req.params
    await assertOwner(chartId, req.user.id)
    const { points = [] } = req.body
    const validationError = validatePoints(points)
    if (validationError) return res.status(400).json({ error: validationError })
    await prisma.$transaction([
      prisma.chartPoint.deleteMany({ where: { chartId } }),
      prisma.chartPoint.createMany({
        data: points.map((p) => ({
          chartId,
          timestamp: new Date(p.timestamp),
          close:     String(p.close),
        })),
      }),
    ])
    res.json({ replaced: points.length })
  } catch (err) { next(err) }
}

async function clearPoints(req, res, next) {
  try {
    const { chartId } = req.params
    await assertOwner(chartId, req.user.id)
    const { count } = await prisma.chartPoint.deleteMany({ where: { chartId } })
    res.json({ deleted: count })
  } catch (err) { next(err) }
}

function validatePoints(points) {
  if (!Array.isArray(points)) return 'O campo points deve ser um array.'
  for (let i = 0; i < points.length; i++) {
    const p = points[i]
    if (!p.timestamp) return `Ponto [${i}]: timestamp é obrigatório.`
    if (isNaN(Date.parse(p.timestamp))) return `Ponto [${i}]: timestamp inválido. Use ISO 8601.`
    if (p.close === undefined || p.close === null) return `Ponto [${i}]: close é obrigatório.`
    if (isNaN(Number(p.close))) return `Ponto [${i}]: close deve ser um número.`
  }
  return null
}

module.exports = {
  listByStudy,
  getById,
  create,
  update,
  remove,
  addPoints,
  replacePoints,
  clearPoints,
}