'use client';

import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import { format, parseISO } from 'date-fns';
import { TaskAssignmentWithDetails } from '@/types';
import { getAssignmentStatus } from '@/hooks';

interface HistoryTableProps {
  assignments: TaskAssignmentWithDetails[];
}

/**
 * Table displaying assignment history with status indicators
 */
export function HistoryTable({ assignments }: HistoryTableProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Current':
        return 'rgba(76, 175, 80, 0.1)';
      case 'Past':
        return 'rgba(158, 158, 158, 0.1)';
      default:
        return 'inherit';
    }
  };

  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Task</TableCell>
            <TableCell>Assignee</TableCell>
            <TableCell>Start Date</TableCell>
            <TableCell>End Date</TableCell>
            <TableCell>Status</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {assignments.map((assignment) => {
            const status = getAssignmentStatus(assignment.startDate, assignment.endDate);
            
            return (
              <TableRow
                key={assignment.id}
                sx={{ backgroundColor: getStatusColor(status) }}
              >
                <TableCell>{assignment.taskName}</TableCell>
                <TableCell>{assignment.host}</TableCell>
                <TableCell>
                  {format(parseISO(assignment.startDate), 'yyyy-MM-dd')}
                </TableCell>
                <TableCell>
                  {format(parseISO(assignment.endDate), 'yyyy-MM-dd')}
                </TableCell>
                <TableCell>{status}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

