// src/components/settings/SettingsScreen.tsx
import { useState } from 'react';
import { FormControl, InputLabel, Select, MenuItem, Switch, FormControlLabel, Box } from '@mui/material';

export const SettingsScreen: React.FC = () => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [language, setLanguage] = useState<string>('en');
  const [autoSave, setAutoSave] = useState(false);

  return (
    <Box sx={{ p: 2 }}>
      <h2>Settings</h2>
      <FormControl fullWidth sx={{ mt: 2 }}>
        <InputLabel>Theme</InputLabel>
        <Select value={theme} label="Theme" onChange={(e) => setTheme(e.target.value as any)}>
          <MenuItem value="light">Light</MenuItem>
          <MenuItem value="dark">Dark</MenuItem>
        </Select>
      </FormControl>

      <FormControl fullWidth sx={{ mt: 2 }}>
        <InputLabel>Language</InputLabel>
        <Select value={language} label="Language" onChange={(e) => setLanguage(e.target.value)}>
          <MenuItem value="en">English</MenuItem>
          <MenuItem value="es">Español</MenuItem>
          <MenuItem value="fr">Français</MenuItem>
        </Select>
      </FormControl>

      <FormControlLabel
        control={<Switch checked={autoSave} onChange={() => setAutoSave((v) => !v)} />}
        label="Auto‑save sessions"
        sx={{ mt: 2 }}
      />
    </Box>
  );
};
