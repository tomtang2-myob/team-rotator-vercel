'use client';

import { Box, Typography, Button } from '@mui/material';
import { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  actions?: ReactNode;
}

/**
 * Reusable page header component with title and optional action buttons
 * 
 * @example
 * ```tsx
 * <PageHeader
 *   title="Team Members"
 *   actions={
 *     <Button variant="contained" startIcon={<AddIcon />}>
 *       Add Member
 *     </Button>
 *   }
 * />
 * ```
 */
export function PageHeader({ title, actions }: PageHeaderProps) {
  return (
    <Box
      display="flex"
      justifyContent="space-between"
      alignItems="center"
      mb={3}
    >
      <Typography variant="h4">{title}</Typography>
      {actions && <Box display="flex" gap={2}>{actions}</Box>}
    </Box>
  );
}

