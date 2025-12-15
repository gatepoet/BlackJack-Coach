// src/components/history/HistoryScreen.tsx
import { useSelector } from 'react-redux';
import { exportToCSV } from '../../utils/export';
import { List, ListItem, ListItemText, Button } from '@mui/material';
import { selectAllSessions } from '../stats/statsSlice';

export const HistoryScreen: React.FC = () => {
  const sessions = useSelector(selectAllSessions);

  return (
    <div className="history-screen" style={{ padding: '1rem' }}>
      <h2>Session History</h2>
      <Button variant="outlined" onClick={() => exportToCSV(sessions)} sx={{ mb: 2 }}>
        Export CSV
      </Button>
      <List>
        {sessions.map((s: any) => (
          <ListItem key={s.id} divider>
            <ListItemText
              primary={`Session ${s.id} – ${new Date(s.startTime).toLocaleString()}`}
              secondary={`Cards: ${s.cards.length} | True Count: ${s.trueCount}`}
            />
          </ListItem>
        ))}
      </List>
    </div>
  );
};
