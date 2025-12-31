'use client';

import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { Member } from '@/types';

interface MembersTableProps {
  members: Member[];
  onEdit: (member: Member) => void;
  onDelete: (member: Member) => void;
}

/**
 * Table displaying team members with edit and delete actions
 */
export function MembersTable({ members, onEdit, onDelete }: MembersTableProps) {
  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>Slack ID</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {members.map((member) => (
            <TableRow key={member.id}>
              <TableCell>{member.host}</TableCell>
              <TableCell>{member.slackMemberId}</TableCell>
              <TableCell align="right">
                <Tooltip title="Edit">
                  <IconButton onClick={() => onEdit(member)}>
                    <EditIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Delete">
                  <IconButton onClick={() => onDelete(member)} color="error">
                    <DeleteIcon />
                  </IconButton>
                </Tooltip>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

