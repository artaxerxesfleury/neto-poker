import type { PlayerView } from '../types'
import { CardBack, CardFace, CardSlot } from './Card'

interface Props {
  player: PlayerView
  isActive: boolean
  isMe: boolean
}

export function PlayerSeat({ player, isActive, isMe }: Props) {
  const classes = [
    'player-seat',
    isActive && 'active',
    player.hasFolded && 'folded',
    player.isSpectating && 'spectating',
    isMe && 'me',
  ].filter(Boolean).join(' ')

  return (
    <div className={classes}>
      <div className="seat-cards">
        {player.isSpectating ? (
          [<CardSlot key={0} />, <CardSlot key={1} />]
        ) : player.holeCards !== undefined ? (
          player.holeCards.length > 0 ? (
            player.holeCards.map((c, i) => <CardFace key={i} card={c} />)
          ) : (
            [<CardSlot key={0} />, <CardSlot key={1} />]
          )
        ) : (
          [<CardBack key={0} />, <CardBack key={1} />]
        )}
      </div>
      <div className="seat-info">
        <span className="seat-name">
          {player.name}
          {isMe && ' (You)'}
        </span>
        <span className="seat-chips">{player.chips}</span>
        {player.currentBet > 0 && (
          <span className="seat-bet">Bet: {player.currentBet}</span>
        )}
        {player.isSpectating && <span className="badge spectating-badge">WATCHING</span>}
        {player.isAllIn && <span className="badge allin">ALL-IN</span>}
        {player.hasFolded && <span className="badge folded-badge">FOLD</span>}
      </div>
    </div>
  )
}
