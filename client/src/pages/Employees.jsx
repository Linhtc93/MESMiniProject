import React, { useEffect, useState } from 'react';
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography } from '@mui/material';
import api from '../api.js';

export default function Employees() {
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ employee_code: '', full_name: '', email: '' });

  const load = async () => {
    const { data } = await api.get('/employees');
    setItems(data);
  };

  useEffect(() => { load(); }, []);

  const onSave = async () => {
    if (!form.employee_code || !form.full_name || !form.email) return;
    await api.post('/employees', form);
    setOpen(false);
    setForm({ employee_code: '', full_name: '', email: '' });
    await load();
  };

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 2 }}>Nhân viên</Typography>
      <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
        <Box sx={{ flexGrow: 1 }} />
        <Button variant="contained" onClick={() => setOpen(true)}>Thêm nhân viên</Button>
      </Stack>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Mã NV</TableCell>
            <TableCell>Họ tên</TableCell>
            <TableCell>Email</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {items.map((r) => (
            <TableRow key={r._id}>
              <TableCell>{r.employee_code}</TableCell>
              <TableCell>{r.full_name}</TableCell>
              <TableCell>{r.email}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>Thêm nhân viên</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1, minWidth: 360 }}>
            <TextField label="Mã" value={form.employee_code} onChange={(e) => setForm({ ...form, employee_code: e.target.value })} />
            <TextField label="Họ tên" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
            <TextField label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Hủy</Button>
          <Button variant="contained" onClick={onSave}>Lưu</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
