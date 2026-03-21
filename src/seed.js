// prisma/seed.js
// Rodar com: npx prisma db seed
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed...')

  await prisma.chartPoint.deleteMany()
  await prisma.chart.deleteMany()
  await prisma.study.deleteMany()
  await prisma.tag.deleteMany()
  await prisma.user.deleteMany()

  // ─── Tags ────────────────────────────────────────────────────────────────
  await Promise.all([
    prisma.tag.create({ data: { name: 'análise-técnica' } }),
    prisma.tag.create({ data: { name: 'renda-variável' } }),
    prisma.tag.create({ data: { name: 'cripto' } }),
    prisma.tag.create({ data: { name: 'macro' } }),
  ])
  console.log('✅ Tags criadas')

  // ─── Usuário ─────────────────────────────────────────────────────────────
  const user = await prisma.user.create({
    data: {
      email: 'joao@exemplo.com',
      name: 'João Silva',
      username: 'joao-silva',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=joao',
      bio: 'Analista técnico independente. Foco em ações brasileiras.',
      googleId: 'google-seed-123',
    },
  })
  console.log(`✅ Usuário criado: @${user.username}`)

  // ─── Estudo: PETR4 ───────────────────────────────────────────────────────
  const study = await prisma.study.create({
    data: {
      title: 'Análise PETR4 — Março 2024',
      description: 'Acompanhamento intraday de Petrobras ao longo de março de 2024.',
      published: true,
      slug: 'analise-petr4-marco-2024',
      ticker: 'PETR4',
      timeframe: '1H',
      assetClass: 'STOCK',
      userId: user.id,
      tags: { connect: [{ name: 'análise-técnica' }, { name: 'renda-variável' }] },
    },
  })

  // ─── Gráfico 1 com pontos hora + fechamento ───────────────────────────────
  const chart1 = await prisma.chart.create({
    data: {
      title: 'Preço de fechamento — 01/03/2024',
      type: 'LINE',
      order: 0,
      studyId: study.id,
      analysis: `## Observações do dia 01/03

O ativo abriu em **R$ 37,20** e apresentou leve pressão vendedora nas primeiras horas do pregão.

**Pontos de atenção:**
- Suporte testado às 11h no nível de R$ 36,90
- Recuperação consistente no período da tarde
- Fechamento acima da média do dia é sinal positivo

> Manter posição com stop em R$ 36,50`,
      config: {
        colors: ['#00C805'],
        yAxis: { prefix: 'R$' },
        annotations: [
          { type: 'line', y: 38.50, label: 'Resistência', color: '#FF3B30' },
          { type: 'line', y: 36.90, label: 'Suporte',     color: '#00C805' },
        ],
      },
    },
  })

  // Entradas hora + fechamento do gráfico 1
  const points1 = [
    { timestamp: '2024-03-01T09:00:00', close: '37.20' },
    { timestamp: '2024-03-01T10:00:00', close: '37.45' },
    { timestamp: '2024-03-01T11:00:00', close: '36.90' },
    { timestamp: '2024-03-01T12:00:00', close: '37.10' },
    { timestamp: '2024-03-01T13:00:00', close: '37.60' },
    { timestamp: '2024-03-01T14:00:00', close: '37.95' },
    { timestamp: '2024-03-01T15:00:00', close: '38.20' },
    { timestamp: '2024-03-01T16:00:00', close: '38.05' },
    { timestamp: '2024-03-01T17:00:00', close: '38.30' },
  ]

  await prisma.chartPoint.createMany({
    data: points1.map((p) => ({
      chartId: chart1.id,
      timestamp: new Date(p.timestamp),
      close: p.close,
    })),
  })

  console.log(`✅ Gráfico "${chart1.title}" criado com ${points1.length} pontos`)

  // ─── Gráfico 2 ───────────────────────────────────────────────────────────
  const chart2 = await prisma.chart.create({
    data: {
      title: 'Preço de fechamento — 04/03/2024',
      type: 'AREA',
      order: 1,
      studyId: study.id,
      analysis: `## Observações do dia 04/03

Sessão de **continuação de alta** após o fechamento positivo da semana anterior.

**Destaques:**
- Gap de abertura acima de R$ 38,50 (rompimento da resistência anterior)
- Volume acima da média nas primeiras duas horas
- Pullback saudável às 13h antes da retomada

A estrutura de topos e fundos ascendentes permanece intacta.`,
      config: {
        colors: ['#378ADD'],
        yAxis: { prefix: 'R$' },
        fill: true,
      },
    },
  })

  const points2 = [
    { timestamp: '2024-03-04T09:00:00', close: '38.60' },
    { timestamp: '2024-03-04T10:00:00', close: '39.10' },
    { timestamp: '2024-03-04T11:00:00', close: '39.40' },
    { timestamp: '2024-03-04T12:00:00', close: '39.20' },
    { timestamp: '2024-03-04T13:00:00', close: '38.95' },
    { timestamp: '2024-03-04T14:00:00', close: '39.30' },
    { timestamp: '2024-03-04T15:00:00', close: '39.80' },
    { timestamp: '2024-03-04T16:00:00', close: '39.65' },
    { timestamp: '2024-03-04T17:00:00', close: '39.90' },
  ]

  await prisma.chartPoint.createMany({
    data: points2.map((p) => ({
      chartId: chart2.id,
      timestamp: new Date(p.timestamp),
      close: p.close,
    })),
  })

  console.log(`✅ Gráfico "${chart2.title}" criado com ${points2.length} pontos`)
  console.log('\n🎉 Seed concluído!\n')
  console.log('   Visualizar dados: npx prisma studio')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
