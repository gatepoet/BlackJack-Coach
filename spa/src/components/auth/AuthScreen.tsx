// src/components/auth/AuthScreen.tsx
import { Typography, Button, TextField, Box } from '@mui/material';
import { useState } from 'react';

export const AuthScreen: React.FC = () => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');

  const handleLogin = () => {
    // TODO: integrate Firebase Auth or custom backend
    console.log('login', email, password);
  };
  const handleSignup = () => {
    console.log('signup', email, password);
  };

  return (
    <Box sx={{ p: 2 }}>
      <h2>Login or Sign Up</h2>
      <TextField
        label="Email"
        type="email"
        fullWidth
        margin="normal"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <TextField
        label="Password"
        type="password"
        fullWidth
        margin="normal"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <Button variant="contained" onClick={handleLogin} sx={{ mr: 2 }}>
        Login
      </Button>
      <Button variant="outlined" onClick={handleSignup}>
        Sign Up
      </Button>
    </Box>
  );
};
