// src/utils/generateUsername.js
// Gera um username único a partir do nome do usuário.
// Ex: "João Silva" → "joao-silva" (ou "joao-silva-2" se já existir)

async function generateUsername(name, prisma) {
  // Normaliza: remove acentos, converte para minúsculas, troca espaços por hífen
  const base = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove acentos
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')    // caracteres não alfanuméricos → hífen
    .replace(/^-|-$/g, '')           // remove hífens nas pontas

  // Verifica se o username base já existe
  const exists = await prisma.user.findUnique({ where: { username: base } })
  if (!exists) return base

  // Se existir, adiciona um sufixo numérico até encontrar um disponível
  let counter = 2
  while (true) {
    const candidate = `${base}-${counter}`
    const taken = await prisma.user.findUnique({ where: { username: candidate } })
    if (!taken) return candidate
    counter++
  }
}

module.exports = { generateUsername }
