// src/controllers/study.controller.js
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

// Gera slug a partir do título
// Ex: "Análise PETR4 — Q1 2024" → "analise-petr4-q1-2024"
function toSlug(text) {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

// Garante slug único adicionando sufixo numérico se necessário
async function uniqueSlug(title, excludeId = null) {
  const base = toSlug(title)
  let slug = base
  let counter = 2

  while (true) {
    const existing = await prisma.study.findUnique({ where: { slug } })
    if (!existing || existing.id === excludeId) return slug
    slug = `${base}-${counter++}`
  }
}

// ─────────────────────────────────────────────────────────────────────────────

// GET /api/studies
// Parâmetros: ?page=1 &limit=12 &tag=análise-técnica &ticker=PETR4
async function listPublic(req, res, next) {
  try {
    const { page = 1, limit = 12, tag, ticker } = req.query

    const where = {
      published: true,
      ...(tag    && { tags:   { some: { name: tag } } }),
      ...(ticker && { ticker: { equals: ticker, mode: 'insensitive' } }),
    }

    const [studies, total] = await Promise.all([
      prisma.study.findMany({
        where,
        include: {
          user:   { select: { name: true, username: true, avatarUrl: true } },
          tags:   true,
          _count: { select: { charts: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip:    (Number(page) - 1) * Number(limit),
        take:    Number(limit),
      }),
      prisma.study.count({ where }),
    ])

    res.json({
      data: studies,
      meta: {
        total,
        page:       Number(page),
        limit:      Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    })
  } catch (err) {
    next(err)
  }
}

// GET /api/studies/:slug
// Aceita tanto o slug ("analise-petr4") quanto o id (cuid) para flexibilidade
async function getBySlug(req, res, next) {
  try {
    const { slug } = req.params

    const study = await prisma.study.findFirst({
      where: { OR: [{ slug }, { id: slug }] },
      include: {
        user:   { select: { name: true, username: true, avatarUrl: true } },
        tags:   true,
        charts: {
          orderBy: { order: 'asc' },
          include: {
            // Inclui os pontos ordenados por tempo — prontos para o gráfico
            points: { orderBy: { timestamp: 'asc' } },
          },
        },
      },
    })

    // Rascunho só é visível para o dono
    if (!study || (!study.published && study.userId !== req.user?.id)) {
      return res.status(404).json({ error: 'Estudo não encontrado.' })
    }

    res.json(study)
  } catch (err) {
    next(err)
  }
}

// POST /api/studies
// Body: { title, description?, ticker?, timeframe?, assetClass?, tags?: string[] }
async function create(req, res, next) {
  try {
    const { title, description, ticker, timeframe, assetClass, tags = [] } = req.body

    if (!title?.trim()) {
      return res.status(400).json({ error: 'Título é obrigatório.' })
    }

    const slug = await uniqueSlug(title)

    const study = await prisma.study.create({
      data: {
        title: title.trim(),
        description,
        slug,
        ticker:     ticker?.toUpperCase(),
        timeframe,
        assetClass,
        userId:     req.user.id,
        tags: {
          connectOrCreate: tags.map((name) => ({
            where:  { name },
            create: { name },
          })),
        },
      },
      include: { tags: true },
    })

    res.status(201).json(study)
  } catch (err) {
    next(err)
  }
}

// PUT /api/studies/:id
async function update(req, res, next) {
  try {
    const study = await prisma.study.findUnique({ where: { id: req.params.id } })

    if (!study)                        return res.status(404).json({ error: 'Estudo não encontrado.' })
    if (study.userId !== req.user.id)  return res.status(403).json({ error: 'Sem permissão.' })

    const { title, description, ticker, timeframe, assetClass, tags } = req.body

    // Regenera slug apenas se o título mudou
    const slug = title && title !== study.title
      ? await uniqueSlug(title, study.id)
      : undefined

    const updated = await prisma.study.update({
      where: { id: req.params.id },
      data: {
        ...(title       && { title: title.trim() }),
        ...(slug        && { slug }),
        ...(description !== undefined && { description }),
        ...(ticker      && { ticker: ticker.toUpperCase() }),
        ...(timeframe   && { timeframe }),
        ...(assetClass  && { assetClass }),
        ...(tags && {
          tags: {
            set: [], // remove todas as tags atuais
            connectOrCreate: tags.map((name) => ({
              where:  { name },
              create: { name },
            })),
          },
        }),
      },
      include: { tags: true },
    })

    res.json(updated)
  } catch (err) {
    next(err)
  }
}

// DELETE /api/studies/:id
// O Prisma já deleta Charts e ChartPoints em cascata (onDelete: Cascade no schema)
async function remove(req, res, next) {
  try {
    const study = await prisma.study.findUnique({ where: { id: req.params.id } })

    if (!study)                        return res.status(404).json({ error: 'Estudo não encontrado.' })
    if (study.userId !== req.user.id)  return res.status(403).json({ error: 'Sem permissão.' })

    await prisma.study.delete({ where: { id: req.params.id } })
    res.status(204).send()
  } catch (err) {
    next(err)
  }
}

// PATCH /api/studies/:id/publish
async function togglePublish(req, res, next) {
  try {
    const study = await prisma.study.findUnique({
      where:   { id: req.params.id },
      include: { _count: { select: { charts: true } } },
    })

    if (!study)                       return res.status(404).json({ error: 'Estudo não encontrado.' })
    if (study.userId !== req.user.id) return res.status(403).json({ error: 'Sem permissão.' })

    // Impede publicar um estudo sem nenhum gráfico
    if (!study.published && study._count.charts === 0) {
      return res.status(400).json({ error: 'Adicione ao menos um gráfico antes de publicar.' })
    }

    const updated = await prisma.study.update({
      where: { id: req.params.id },
      data:  { published: !study.published },
    })

    res.json({ published: updated.published })
  } catch (err) {
    next(err)
  }
}

async function listMine(req, res, next) {
  try {
    const { page = 1, limit = 50 } = req.query

    const [studies, total] = await Promise.all([
      prisma.study.findMany({
        where: { userId: req.user.id },
        include: {
          tags:   true,
          _count: { select: { charts: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip:    (Number(page) - 1) * Number(limit),
        take:    Number(limit),
      }),
      prisma.study.count({ where: { userId: req.user.id } }),
    ])

    res.json({
      data: studies,
      meta: { total, page: Number(page), limit: Number(limit) },
    })
  } catch (err) {
    next(err)
  }
}
async function listMine(req, res, next) {
  try {
    const [studies, total] = await Promise.all([
      prisma.study.findMany({
        where:   { userId: req.user.id },
        include: { tags: true, _count: { select: { charts: true } } },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
      prisma.study.count({ where: { userId: req.user.id } }),
    ])
    res.json({ data: studies, meta: { total } })
  } catch (err) { next(err) }
}

module.exports = { listPublic, listMine, getBySlug, create, update, listMine, remove, togglePublish }