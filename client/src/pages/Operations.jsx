import React, { useEffect, useState } from 'react';
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography } from '@mui/material';
import api from '../api.js';

export default function Operations() {
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ operation_code: '', operation_name: '', cycle_time_seconds: 0 });

  const load = async () => {
    const { data } = await api.get('/operations');
    setItems(data);
  };

  useEffect(() => { load(); }, []);

  const onSave = async () => {
    if (!form.operation_code || !form.operation_name) return;
    await api.post('/operations', form);
    setOpen(false);
    setForm({ operation_code: '', operation_name: '', cycle_time_seconds: 0 });
    await load();
  };

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 2 }}>Công đoạn</Typography>
      <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
        <Box sx={{ flexGrow: 1 }} />
        <Button variant="contained" onClick={() => setOpen(true)}>Thêm công đoạn</Button>
      </Stack>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Mã</TableCell>
            <TableCell>Tên</TableCell>
            <TableCell>Thời gian (s)</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {items.map((r) => (
            <TableRow key={r._id}>
              <TableCell>{r.operation_code}</TableCell>
              <TableCell>{r.operation_name}</TableCell>
              <TableCell>{r.cycle_time_seconds}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>Thêm công đoạn</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1, minWidth: 360 }}>
            <TextField label="Mã" value={form.operation_code} onChange={(e) => setForm({ ...form, operation_code: e.target.value })} />
            <TextField label="Tên" value={form.operation_name} onChange={(e) => setForm({ ...form, operation_name: e.target.value })} />
            <TextField label="Thời gian (giây)" type="number" value={form.cycle_time_seconds} onChange={(e) => setForm({ ...form, cycle_time_seconds: Number(e.target.value) })} />
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
