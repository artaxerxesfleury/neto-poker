import { useCallback, useEffect, useState } from 'react'
import { socket } from '../socket'
import type { GameState } from '../types'
import { CardFace, CardSlot } from '../components/Card'
import { PlayerSeat } from '../components/PlayerSeat'
import { Chat } from '../components/Chat'

interface Props {
  myPlayerId: string
  onLeave: () => void
}

export function TableView({ myPlayerId, onLeave }: Props) {
  const [state, setState] = useState<GameState | null>(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [showRaise, setShowRaise] = useState(false)
  const [raiseAmount, setRaiseAmount] = useState(0)

  const handleLeave = useCallback(() => onLeave(), [onLeave])

  useEffect(() => {
    const onGameState = (gs: GameState) => {
      setState(gs)
      setErrorMsg('')
      setShowRaise(false)
    }
    const onError = (e: { message: string }) => setErrorMsg(e.message)
    const onRoomLeft = () => handleLeave()

    socket.on('game_state', onGameState)
    socket.on('error', onError)
    socket.on('room_left', onRoomLeft)
    // Guard against the race where game_state fires before this effect runs
    socket.emit('request_game_state')
    return () => {
      socket.off('game_state', onGameState)
      socket.off('error', onError)
      socket.off('room_left', onRoomLeft)
    }
  }, [handleLeave])

  if (!state) {
    return (
      <div className="table">
        <div className="waiting-screen">
          <p className="waiting-title">Joining room…</p>
          <p className="waiting-sub">Please wait</p>
        </div>
      </div>
    )
  }

  if (state.status === 'waiting') {
    return (
      <div className="table">
        <div className="table-header">
          <span className="header-room">Mesa {state.roomId.slice(0, 5).toUpperCase()}</span>
          <button className="btn-leave" onClick={() => socket.emit('leave_room')}>
            Sair
          </button>
        </div>
        <div className="waiting-screen">
          <p className="waiting-title">Aguardando jogadores</p>
          <p className="waiting-room-id">ID da Mesa: <code>{state.roomId}</code></p>
          <p className="waiting-count">
            {state.players.length} / {state.maxSeats} jogadores
          </p>
          <ul className="waiting-player-list">
            {state.players.map((p) => (
              <li key={p.id} className={p.id === myPlayerId ? 'me' : ''}>
                <span className="waiting-player-name">
                  {p.name}{p.id === myPlayerId ? ' (Você)' : ''}
                  {p.isBot && <span style={{ marginLeft: 6 }}>🤖</span>}
                  {p.id === state.ownerId && <span className="owner-badge">DONO</span>}
                </span>
                {p.id !== state.ownerId && (
                  <span className={`ready-indicator ${p.isReady ? 'ready' : ''}`}>
                    {p.isReady ? 'OK' : '…'}
                  </span>
                )}
              </li>
            ))}
          </ul>

          {myPlayerId !== state.ownerId && (() => {
            const me = state.players.find((p) => p.id === myPlayerId)
            return me ? (
              <button
                className={`btn-ready ${me.isReady ? 'active' : ''}`}
                onClick={() => socket.emit('set_ready')}
              >
                {me.isReady ? 'Pronto ✓' : 'Pronto?'}
              </button>
            ) : null
          })()}

          {myPlayerId === state.ownerId && state.players.length >= 2 && (
            <button className="btn-start" onClick={() => socket.emit('start_game')}>
              ▶ Começar Jogo
            </button>
          )}

          {myPlayerId === state.ownerId && state.players.length < state.maxSeats && (
            <div className="bot-controls" style={{ marginTop: 20 }}>
              <p style={{ marginBottom: 10, color: 'var(--gold)' }}>Treinar contra IA:</p>
              <div className="btn-group">
                <button onClick={() => socket.emit('add_bot', { personality: 'conservative' })}>🤖 Conservador</button>
                <button onClick={() => socket.emit('add_bot', { personality: 'balanced' })}>🤖 Balanceado</button>
                <button onClick={() => socket.emit('add_bot', { personality: 'aggressive' })}>🤖 Agressivo</button>
              </div>
            </div>
          )}
          <div className="waiting-rules">
            <span>Pingo {state.smallBlind} / Pingo Maior {state.bigBlind}</span>
            <span>Fichas {state.defaultStartingChips}</span>
            <span>Tempo {state.turnTimeoutMs === 0 ? 'Sem Limite' : `${state.turnTimeoutMs / 1000}s`}</span>
          </div>
          {state.players.length < 2 && (
            <p className="waiting-hint">Compartilhe o ID da mesa para começar.</p>
          )}
        </div>
      </div>
    )
  }

  const me = state.players.find((p) => p.id === myPlayerId)
  const others = state.players.filter((p) => p.id !== myPlayerId)
  const isMyTurn = state.currentTurnPlayerId === myPlayerId
  const actingPlayer = state.players.find((p) => p.id === state.currentTurnPlayerId)

  const callAmount = me ? Math.min(state.currentBetLevel - me.currentBet, me.chips) : 0
  const canCheck = me ? me.currentBet === state.currentBetLevel : false
  const canAct = isMyTurn && !!me && !me.hasFolded && !me.isAllIn

  const minRaise = state.currentBetLevel > 0 ? state.currentBetLevel * 2 : 20
  const maxRaise = me ? me.chips + me.currentBet : 0

  const isShowdown = state.bettingRound === 'showdown'
  const canStart = state.bettingRound === 'showdown' && state.players.length >= 2

  function act(type: string, amount?: number) {
    socket.emit('player_action', { type, amount })
  }

  function openRaise() {
    setRaiseAmount(Math.min(minRaise, maxRaise))
    setShowRaise(true)
  }

  const topOpponents = others.slice(0, 3)
  const sideLeft = others[3] ?? null
  const sideRight = others[4] ?? null

  return (
    <div className="table">
      <Chat />
      {/* Header */}
      <div className="table-header">
        <span className="header-room">Room {state.roomId.slice(0, 8)}…</span>
        <button className="btn-leave" onClick={() => socket.emit('leave_room')}>
          Leave
        </button>
      </div>

      {/* Felt area: oval table */}
      <div className="felt-area">
        {/* Top opponents (always up to 3) */}
        <div className="felt-top">
          {topOpponents.map((p) => (
            <PlayerSeat
              key={p.id}
              player={p}
              isActive={state.currentTurnPlayerId === p.id}
              isMe={false}
              compact={true}
            />
          ))}
        </div>

        {/* Center: side seats + community cards */}
        <div className="felt-center">
          <div className="felt-side felt-side-left">
            {sideLeft && (
              <PlayerSeat
                player={sideLeft}
                isActive={state.currentTurnPlayerId === sideLeft.id}
                isMe={false}
                compact={true}
              />
            )}
          </div>

          <div className="felt-community">
            <span className="community-label">{state.bettingRound.toUpperCase()}</span>
            <div className="community-cards">
              {[0, 1, 2, 3, 4].map((i) =>
                state.communityCards[i] ? (
                  <CardFace key={i} card={state.communityCards[i]} />
                ) : (
                  <CardSlot key={i} />
                ),
              )}
            </div>
            <div className="community-info">
              <span className="community-pot">Pote: {state.pot}</span>
              <span className="community-bet" style={{ visibility: state.currentBetLevel > 0 ? 'visible' : 'hidden' }}>
                Aposta: {state.currentBetLevel}
              </span>
            </div>
          </div>

          <div className="felt-side felt-side-right">
            {sideRight && (
              <PlayerSeat
                player={sideRight}
                isActive={state.currentTurnPlayerId === sideRight.id}
                isMe={false}
                compact={true}
              />
            )}
          </div>
        </div>

        {/* Status: turn / result */}
        <div className="felt-status">
          {isShowdown && state.lastHandResult && (
            <div className="hand-result">
              {state.lastHandResult.pots.map((pot, i) => {
                const names = pot.winnerIds
                  .map((id) => state.players.find((p) => p.id === id)?.name ?? id)
                  .join(', ')
                return <div key={i}>🏆 {names} ganhou {pot.amount} fichas</div>
              })}
            </div>
          )}
          {me?.isSpectating && (
            <div className="spectating-banner">
              Assistindo — você entrará na próxima mão
            </div>
          )}
          {state.status === 'playing' && !isShowdown && !me?.isSpectating && (
            <div className={`turn-indicator ${isMyTurn ? 'my-turn' : ''}`}>
              {isMyTurn ? '🎯 Sua vez' : `Aguardando ${actingPlayer?.name ?? '…'}`}
            </div>
          )}
          {errorMsg && <div className="error-msg">{errorMsg}</div>}
        </div>
      </div>

      {/* My seat */}
      {me && (
        <div className="my-area">
          <PlayerSeat
            player={me}
            isActive={isMyTurn}
            isMe={true}
          />
        </div>
      )}

      {/* Actions */}
      <div className="actions">
        {canStart && (
          <button className="btn-start" onClick={() => socket.emit('start_game')}>
            ▶ Próxima Mão
          </button>
        )}

        {me && me.chips === 0 && (
          <button className="btn-rebuy" onClick={() => socket.emit('rebuy')}>
            ↩ Recomprar ({state.defaultStartingChips} fichas)
          </button>
        )}

        {canAct && (
          <div className="action-buttons">
            <button className="btn-fold" onClick={() => act('fold')}>
              Fugir
            </button>
            {canCheck ? (
              <button className="btn-check" onClick={() => act('check')}>
                Mesa
              </button>
            ) : (
              <button className="btn-call" onClick={() => act('call')}>
                Pagar {callAmount}
              </button>
            )}
            {me && me.chips > callAmount && (
              <button className="btn-raise" onClick={openRaise}>
                Aumentar
              </button>
            )}
            <button className="btn-allin" onClick={() => act('allin')}>
              All-in
            </button>
          </div>
        )}

        <div className="raise-panel" style={{ visibility: showRaise ? 'visible' : 'hidden' }}>
          <input
            type="number"
            value={raiseAmount}
            min={minRaise}
            max={maxRaise}
            step={10}
            onChange={(e) => setRaiseAmount(Number(e.target.value))}
          />
          <button
            className="btn-confirm-raise"
            onClick={() => {
              act('raise', raiseAmount)
              setShowRaise(false)
            }}
          >
            Confirmar
          </button>
          <button className="btn-cancel" onClick={() => setShowRaise(false)}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}
