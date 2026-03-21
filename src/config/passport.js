// src/config/passport.js
// Configura as estratégias OAuth do Passport (Google + GitHub)
// O fluxo completo:
//   1. Usuário clica "Login com Google/GitHub" no Next.js
//   2. Front redireciona para GET /api/auth/google (ou /github)
//   3. Passport redireciona para o provedor OAuth
//   4. Usuário autoriza o app
//   5. Provedor redireciona para o callback com um `code`
//   6. Passport troca o `code` pelo perfil do usuário
//   7. Buscamos ou criamos o User no banco via Prisma
//   8. Geramos um JWT e enviamos de volta ao Next.js

const passport = require('passport')
const GoogleStrategy = require('passport-google-oauth20').Strategy
const { PrismaClient } = require('@prisma/client')
const { generateUsername } = require('../utils/generateUsername')

const prisma = new PrismaClient()

// ─── Google ───────────────────────────────────────────────────────────────────
passport.use(
  new GoogleStrategy(
    {
      clientID:     process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL:  process.env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email     = profile.emails?.[0]?.value
        const name      = profile.displayName
        const avatarUrl = profile.photos?.[0]?.value
        const googleId  = profile.id

        if (!email) {
          return done(new Error('Conta Google sem e-mail público.'), null)
        }

        // Busca por googleId primeiro, depois por e-mail (usuário pode já ter conta GitHub)
        let user = await prisma.user.findFirst({
          where: { OR: [{ googleId }, { email }] },
        })

        if (user) {
          // Atualiza googleId se entrou pela primeira vez via Google
          if (!user.googleId) {
            user = await prisma.user.update({
              where: { id: user.id },
              data: { googleId, avatarUrl: user.avatarUrl ?? avatarUrl },
            })
          }
        } else {
          // Primeiro login — cria o usuário
          const username = await generateUsername(name, prisma)
          user = await prisma.user.create({
            data: { email, name, avatarUrl, googleId, username },
          })
        }

        return done(null, user)
      } catch (err) {
        return done(err, null)
      }
    }
  )
)



module.exports = passport
