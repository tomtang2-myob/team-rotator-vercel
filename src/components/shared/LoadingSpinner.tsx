'use client';

import { Box, CircularProgress, Typography } from '@mui/material';

interface LoadingSpinnerProps {
  message?: string;
  fullScreen?: boolean;
  size?: number;
}

/**
 * Reusable loading spinner component
 * 
 * @example
 * ```tsx
 * // Full screen loading
 * <LoadingSpinner fullScreen message="Loading data..." />
 * 
 * // Inline loading
 * <LoadingSpinner size={24} />
 * ```
 */
export function LoadingSpinner({
  message,
  fullScreen = false,
  size = 40,
}: LoadingSpinnerProps) {
  const content = (
    <Box
      display="flex"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      gap={2}
    >
      <CircularProgress size={size} />
      {message && (
        <Typography variant="body2" color="text.secondary">
          {message}
        </Typography>
      )}
    </Box>
  );

  if (fullScreen) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        height="100vh"
        width="100%"
      >
        {content}
      </Box>
    );
  }

  return content;
}

