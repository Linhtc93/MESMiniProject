import React, { useEffect, useState } from 'react';
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography } from '@mui/material';
import api from '../api.js';
import { useNavigate } from 'react-router-dom';

const statuses = [
  { value: '', label: 'Tất cả' },
  { value: 'not_started', label: 'Chưa bắt đầu' },
  { value: 'started', label: 'Đang chạy' },
  { value: 'completed', label: 'Hoàn thành' },
];

export default function Plans() {
  const [items, setItems] = useState([]);
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [productCode, setProductCode] = useState('');
  const [status, setStatus] = useState('');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ product_code: '', ship_date: new Date().toISOString().slice(0, 10), plan_qty: 0 });
  const navigate = useNavigate();

  const load = async () => {
    const { data } = await api.get('/plans', { params: { date, product_code: productCode, status } });
    setItems(data);
  };

  useEffect(() => { load(); }, []);

  const onFilter = async (e) => { e.preventDefault(); await load(); };

  const onCreate = async () => {
    if (!form.product_code || !form.ship_date || !form.plan_qty) return;
    await api.post('/plans', { ...form, plan_qty: Number(form.plan_qty) });
    setOpen(false);
    setForm({ product_code: '', ship_date: new Date().toISOString().slice(0, 10), plan_qty: 0 });
    await load();
  };

  const onStart = async (id) => { await api.post(`/plans/${id}/start`); await load(); };

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 2 }}>Kế hoạch sản xuất</Typography>
      <Stack direction="row" spacing={2} component="form" onSubmit={onFilter} sx={{ mb: 2 }}>
        <TextField label="Ngày" type="date" value={date} onChange={(e) => setDate(e.target.value)} InputLabelProps={{ shrink: true }} />
        <TextField label="Mã hàng" value={productCode} onChange={(e) => setProductCode(e.target.value)} />
        <TextField select label="Trạng thái" value={status} onChange={(e) => setStatus(e.target.value)} sx={{ minWidth: 180 }}>
          {statuses.map(s => <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>)}
        </TextField>
        <Button type="submit" variant="outlined">Lọc</Button>
        <Box sx={{ flexGrow: 1 }} />
        <Button variant="contained" onClick={() => setOpen(true)}>Tạo kế hoạch</Button>
      </Stack>

      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Ngày</TableCell>
            <TableCell>Mã hàng</TableCell>
            <TableCell>Kế hoạch</TableCell>
            <TableCell>Trạng thái</TableCell>
            <TableCell>Hành động</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {items.map((r) => (
            <TableRow key={r._id}>
              <TableCell>{new Date(r.ship_date).toLocaleDateString()}</TableCell>
              <TableCell>{r.product_code}</TableCell>
              <TableCell>{r.plan_qty}</TableCell>
              <TableCell>{r.is_completed ? 'Hoàn thành' : (r.started ? 'Đang chạy' : 'Chưa bắt đầu')}</TableCell>
              <TableCell>
                <Stack direction="row" spacing={1}>
                  {!r.started && <Button size="small" variant="outlined" onClick={() => onStart(r._id)}>Start</Button>}
                  <Button size="small" variant="contained" onClick={() => navigate(`/plans/${r._id}`)}>Chi tiết</Button>
                </Stack>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>Tạo kế hoạch</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1, minWidth: 360 }}>
            <TextField label="Mã hàng" value={form.product_code} onChange={(e) => setForm({ ...form, product_code: e.target.value })} />
            <TextField label="Ngày xuất" type="date" value={form.ship_date} onChange={(e) => setForm({ ...form, ship_date: e.target.value })} InputLabelProps={{ shrink: true }} />
            <TextField label="Số lượng" type="number" value={form.plan_qty} onChange={(e) => setForm({ ...form, plan_qty: Number(e.target.value) })} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Hủy</Button>
          <Button variant="contained" onClick={onCreate}>Lưu</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
