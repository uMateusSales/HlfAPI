// Middleware global de tratamento de erros
// Sempre deve ter 4 parâmetros (err, req, res, next) para o Express reconhecer como error handler
function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || err.status || 500

  // Erros do Prisma
  if (err.code === 'P2002') {
    return res.status(409).json({
      error: 'Já existe um registro com esses dados.',
      field: err.meta?.target,
    })
  }

  if (err.code === 'P2025') {
    return res.status(404).json({ error: 'Registro não encontrado.' })
  }

  // Log completo em desenvolvimento; em produção, log mínimo para debug nos logs da plataforma
  if (process.env.NODE_ENV !== 'production') {
    console.error('❌ Erro:', err)
  } else {
    console.error('[500]', err.message || 'Erro interno')
  }

  res.status(statusCode).json({
    error: err.message || 'Erro interno do servidor.',
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  })
}

module.exports = errorHandler
