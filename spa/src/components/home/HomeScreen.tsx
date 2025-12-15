// src/components/home/HomeScreen.tsx
import { Typography, Button } from '@mui/material';
import { Link } from 'react-router-dom';

export const HomeScreen: React.FC = () => (
  <div style={{ padding: '1rem' }}>
    <Typography variant="h4" gutterBottom>
      Blackjack Tracker
    </Typography>
    <Button component={Link} to="/track" variant="contained" sx={{ mr: 1 }}>
      Track Cards
    </Button>
    <Button component={Link} to="/stats" variant="outlined" sx={{ mr: 1 }}>
      Statistics
    </Button>
    <Button component={Link} to="/history" variant="text" sx={{ mr: 1 }}>
      History
    </Button>
    <Button component={Link} to="/settings" variant="text" sx={{ mr: 1 }}>
      Settings
    </Button>
  </div>
);
