// src/components/tracker/CardTracker.tsx
import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { updateCount } from '../../utils/counting';
import { setSessionCards, endSession } from '../stats/statsSlice';

export const CardTracker: React.FC = () => {
  const [session, setSession] = useState<{ id: number; startTime: Date } | null>(null);
  const [cards, setCards] = useState<Array<{ card: string; timestamp: Date }>>([]);
  const [dealerCard, setDealerCard] = useState<string>('');
  const [countingSystem, setCountingSystem] = useState<'hi-lo' | 'ko' | 'umtc'>('hi-lo');
  const dispatch = useDispatch();

  const startNewSession = () => {
    const newSession = { id: Date.now(), startTime: new Date() };
    setSession(newSession);
    setCards([]);
  };

  const logCard = (card: string) => {
    if (!session) return;
    const newCards = [...cards, { card, timestamp: new Date() }];
    setCards(newCards);
    const count = updateCount(countingSystem, newCards);
    dispatch(setSessionCards({ count, cards: newCards }));
  };

  const stopSession = () => {
    if (!session) return;
    dispatch(endSession({ sessionId: session.id }));
    setSession(null);
    setCards([]);
  };

  return (
    <div className="card-tracker" style={{ padding: '1rem' }}>
      <h2>{session ? `Session ${session.id}` : 'No active session'}</h2>
      <button onClick={startNewSession}>Start Session</button>
      {session && <button onClick={stopSession}>End Session</button>}

      <div style={{ marginTop: '1rem' }}>
        <label>Dealer Upcard:</label>
        <input
          value={dealerCard}
          onChange={(e) => setDealerCard(e.target.value)}
          placeholder="e.g., 10♠"
        />
      </div>

      <div style={{ marginTop: '1rem' }}>
        <label>Log a card:</label>
        <input
          type="text"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              logCard((e.target as HTMLInputElement).value);
              (e.target as HTMLInputElement).value = '';
            }
          }}
          placeholder="e.g., A♦"
        />
      </div>

      <div style={{ marginTop: '1rem' }}>
        <h3>Seen Cards</h3>
        <ul>
          {cards.map((c, i) => (
            <li key={i}>{c.card} – {c.timestamp.toLocaleTimeString()}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};
