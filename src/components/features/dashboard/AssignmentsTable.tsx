'use client';

import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
} from '@mui/material';
import { Edit as EditIcon } from '@mui/icons-material';
import { format, parseISO } from 'date-fns';
import { TaskAssignmentWithDetails } from '@/types';

interface AssignmentsTableProps {
  assignments: TaskAssignmentWithDetails[];
  onEdit: (assignment: TaskAssignmentWithDetails) => void;
}

/**
 * Table displaying current task assignments
 */
export function AssignmentsTable({ assignments, onEdit }: AssignmentsTableProps) {
  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Task</TableCell>
            <TableCell>Assignee</TableCell>
            <TableCell>Start Date</TableCell>
            <TableCell>End Date</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {assignments.map((assignment) => (
            <TableRow key={assignment.id}>
              <TableCell>{assignment.taskName}</TableCell>
              <TableCell>{assignment.host}</TableCell>
              <TableCell>
                {format(parseISO(assignment.startDate), 'yyyy-MM-dd')}
              </TableCell>
              <TableCell>
                {format(parseISO(assignment.endDate), 'yyyy-MM-dd')}
              </TableCell>
              <TableCell align="right">
                <Button
                  startIcon={<EditIcon />}
                  onClick={() => onEdit(assignment)}
                >
                  Edit
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

