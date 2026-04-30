import { useState } from 'react';
import { IconButton, InputAdornment, TextField } from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';

export default function PasswordField({ InputProps, disabled, ...props }) {
  const [visible, setVisible] = useState(false);

  const toggleVisibility = () => {
    setVisible((current) => !current);
  };

  return (
    <TextField
      {...props}
      disabled={disabled}
      type={visible ? 'text' : 'password'}
      InputProps={{
        ...InputProps,
        endAdornment: (
          <InputAdornment position="end">
            {InputProps?.endAdornment}
            <IconButton
              aria-label={visible ? 'Hide password' : 'Show password'}
              edge="end"
              type="button"
              disabled={disabled}
              onClick={toggleVisibility}
              onMouseDown={(event) => event.preventDefault()}
            >
              {visible ? <VisibilityOff /> : <Visibility />}
            </IconButton>
          </InputAdornment>
        ),
      }}
    />
  );
}
