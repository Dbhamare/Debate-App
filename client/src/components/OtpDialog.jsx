import { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, Typography } from '@mui/material';

export default function OtpDialog({ open, title = 'Enter OTP', onClose, onSubmit, loading }) {
  const [code, setCode] = useState('');
  const handleSubmit = () => onSubmit?.(code);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          We’ve sent a 6-digit code. Please enter it below.
        </Typography>
        <TextField
          id="otp-code"
          name="otpCode"
          autoFocus
          fullWidth
          autoComplete="one-time-code"
          inputProps={{ inputMode: 'numeric', pattern: '[0-9]*', maxLength: 6 }}
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="123456"
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button disabled={loading || code.length < 4} variant="contained" onClick={handleSubmit}>
          Verify
        </Button>
      </DialogActions>
    </Dialog>
  );
}
