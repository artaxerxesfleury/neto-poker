import { useEffect, useState } from 'react'
import { socket } from './socket'
import './App.css'

function App() {
  const [connected, setConnected] = useState(false)
  const [pongReceived, setPongReceived] = useState(false)

  useEffect(() => {
    socket.on('connect', () => setConnected(true))
    socket.on('disconnect', () => setConnected(false))
    socket.on('pong', () => setPongReceived(true))

    return () => {
      socket.off('connect')
      socket.off('disconnect')
      socket.off('pong')
    }
  }, [])

  return (
    <div>
      <h1>poker-online</h1>
      <p>Socket status: {connected ? 'connected' : 'disconnected'}</p>
      <button type="button" onClick={() => socket.emit('ping')} disabled={!connected}>
        Send ping
      </button>
      {pongReceived && <p>pong received</p>}
    </div>
  )
}

export default App
