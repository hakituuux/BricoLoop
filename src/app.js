import express from 'express'
import { tools, users } from './data.js'

export function createApp() {
  const app = express()
  app.use(express.json())

  app.get('/api/users', (_req, res) => {
    res.json(users)
  })

  app.get('/api/tools', (_req, res) => {
    const liste = []
    for (let i = 0; i < tools.length; i++) {
      if (tools[i].status === 'available') {
        liste.push(tools[i])
      }
    }
    for (let i = 0; i < tools.length; i++) {
      if (tools[i].status !== 'available') {
        liste.push(tools[i])
      }
    }
    res.json(liste)
  })

  return app
}
