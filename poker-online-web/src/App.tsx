import { useCallback, useState } from 'react'
import { LobbyView } from './views/LobbyView'
import { TableView } from './views/TableView'
import './App.css'

type Screen = 'lobby' | 'table'

function App() {
  const [screen, setScreen] = useState<Screen>('lobby')
  const [myPlayerId, setMyPlayerId] = useState<string | null>(null)

  const handleJoined = useCallback((playerId: string) => {
    setMyPlayerId(playerId)
    setScreen('table')
  }, [])

  const handleLeave = useCallback(() => {
    setMyPlayerId(null)
    setScreen('lobby')
  }, [])

  if (screen === 'table' && myPlayerId) {
    return <TableView myPlayerId={myPlayerId} onLeave={handleLeave} />
  }

  return <LobbyView onJoined={handleJoined} />
}

export default App
