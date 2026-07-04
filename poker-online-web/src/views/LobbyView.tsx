import { useEffect, useRef, useState } from 'react'
import { socket } from '../socket'
import type { RoomSummary } from '../types'

interface Props {
  onJoined: (playerId: string) => void
}

export function LobbyView({ onJoined }: Props) {
  const [name, setName] = useState('')
  const [rooms, setRooms] = useState<RoomSummary[]>([])
  const [connected, setConnected] = useState(socket.connected)
  const nameRef = useRef(name)
  nameRef.current = name

  useEffect(() => {
    // Re-check in case socket connected before this effect registered
    setConnected(socket.connected)

    const onConnect = () => setConnected(true)
    const onDisconnect = () => setConnected(false)
    const onRoomsList = (list: RoomSummary[]) => setRooms(list)
    const onRoomCreated = (data: { roomId: string }) => {
      socket.emit('join_room', { roomId: data.roomId, playerName: nameRef.current.trim() })
    }
    const onRoomJoined = (data: { playerId: string }) => {
      onJoined(data.playerId)
    }

    socket.on('connect', onConnect)
    socket.on('disconnect', onDisconnect)
    socket.on('rooms_list', onRoomsList)
    socket.on('room_created', onRoomCreated)
    socket.on('room_joined', onRoomJoined)
    socket.emit('list_rooms')

    return () => {
      socket.off('connect', onConnect)
      socket.off('disconnect', onDisconnect)
      socket.off('rooms_list', onRoomsList)
      socket.off('room_created', onRoomCreated)
      socket.off('room_joined', onRoomJoined)
    }
  }, [onJoined])

  const trimmed = name.trim()

  return (
    <div className="lobby">
      <h1>♠ Poker Online</h1>

      <div className="connection-status">
        <span className={connected ? 'dot green' : 'dot red'} />
        {connected ? 'Connected' : 'Connecting…'}
      </div>

      <div className="name-input">
        <input
          type="text"
          placeholder="Your name"
          value={name}
          maxLength={20}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && trimmed) socket.emit('create_room', {})
          }}
        />
      </div>

      <div className="lobby-actions">
        <button
          className="btn-primary"
          disabled={!trimmed || !connected}
          onClick={() => socket.emit('create_room', {})}
        >
          + Create Room
        </button>
        <button
          className="btn-secondary"
          onClick={() => socket.emit('list_rooms')}
        >
          Refresh
        </button>
      </div>

      <div className="room-list">
        <h2>Rooms</h2>
        {rooms.length === 0 ? (
          <p className="empty">No rooms yet. Create one!</p>
        ) : (
          rooms.map((room) => (
            <div key={room.id} className="room-card">
              <div className="room-info">
                <span className="room-id-short">{room.id.slice(0, 8)}…</span>
                <span className="room-players">{room.playerCount}/{room.maxSeats} players</span>
                <span className={`status ${room.status}`}>{room.status}</span>
              </div>
              <button
                className="btn-join"
                disabled={!trimmed || !connected || room.status === 'playing'}
                onClick={() => socket.emit('join_room', { roomId: room.id, playerName: trimmed })}
              >
                Join
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
