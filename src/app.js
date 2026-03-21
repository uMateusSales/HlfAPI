const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const morgan = require('morgan')
const rateLimit = require('express-rate-limit')
const cookieParser = require('cookie-parser')
const passportConfig = require('./config/passport') // registra as estratégias OAuth
require('dotenv').config()

const authRoutes = require('./routes/auth.routes')
const studyRoutes = require('./routes/study.routes')
const chartRoutes = require('./routes/chart.routes')
const userRoutes = require('./routes/user.routes')
const errorHandler = require('./middlewares/errorHandler')
const notFound = require('./middlewares/notFound')

const app = express()

// ─── Segurança ────────────────────────────────────────────────────────────────
app.use(helmet())

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true, // necessário para enviar cookies com JWT
}))

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100,
  message: { error: 'Muitas requisições. Tente novamente em alguns minutos.' },
})
app.use('/api', limiter)

// ─── Parsing ──────────────────────────────────────────────────────────────────
app.use(cookieParser()) // necessário para ler o cookie do JWT
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// ─── Logs (apenas em desenvolvimento) ────────────────────────────────────────
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'))
}

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    env: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  })
})

// ─── Rotas ────────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/studies', studyRoutes)
app.use('/api/studies', chartRoutes) // /api/studies/:studyId/charts

// ─── Erros ────────────────────────────────────────────────────────────────────
app.use(notFound)
app.use(errorHandler)

module.exports = app
