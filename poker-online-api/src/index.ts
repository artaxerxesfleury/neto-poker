import express from 'express'
import cors from 'cors'
import { createServer } from 'node:http'
import { Server } from 'socket.io'

const app = express()
app.use(cors())

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' })
})

const httpServer = createServer(app)
const io = new Server(httpServer, {
  cors: { origin: '*' }
})

io.on('connection', (socket) => {
  socket.on('ping', () => {
    socket.emit('pong')
  })

  socket.on('disconnect', () => {
    // noop for now
  })
})

const PORT = process.env.PORT || 8082
httpServer.listen(PORT, () => {
  console.log(`poker-online-api listening on :${PORT}`)
})
