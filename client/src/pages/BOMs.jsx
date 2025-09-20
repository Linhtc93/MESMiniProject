import React, { useEffect, useState } from 'react';
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography } from '@mui/material';
import api from '../api.js';

export default function BOMs() {
  const [items, setItems] = useState([]);
  const [parent, setParent] = useState('');
  const [effectiveOn, setEffectiveOn] = useState('');
  const [open, setOpen] = useState(false);
  const [operations, setOperations] = useState([]);
  const [form, setForm] = useState({ parent_product_code: '', component_product_code: '', quantity_per: 1, operation_code: '', scrap_rate: 0, effective_from: '' });

  const load = async () => {
    const { data } = await api.get('/boms', { params: { parent, effective_on: effectiveOn } });
    setItems(data);
  };

  useEffect(() => { api.get('/operations').then(({ data }) => setOperations(data)); }, []);
  useEffect(() => { load(); }, []);

  const onSearch = async (e) => { e.preventDefault(); await load(); };

  const onSave = async () => {
    if (!form.parent_product_code || !form.component_product_code || !form.quantity_per) return;
    const payload = { ...form };
    if (!payload.effective_from) payload.effective_from = new Date().toISOString().slice(0, 10);
    if (!payload.operation_code) delete payload.operation_code;
    await api.post('/boms', payload);
    setOpen(false);
    setForm({ parent_product_code: '', component_product_code: '', quantity_per: 1, operation_code: '', scrap_rate: 0, effective_from: '' });
    await load();
  };

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 2 }}>BOM</Typography>
      <Stack direction="row" spacing={2} component="form" onSubmit={onSearch} sx={{ mb: 2 }}>
        <TextField label="Mã cha" value={parent} onChange={(e) => setParent(e.target.value)} />
        <TextField label="Hiệu lực tại" type="date" value={effectiveOn} onChange={(e) => setEffectiveOn(e.target.value)} InputLabelProps={{ shrink: true }} />
        <Button type="submit" variant="outlined">Lọc</Button>
        <Box sx={{ flexGrow: 1 }} />
        <Button variant="contained" onClick={() => setOpen(true)}>Thêm BOM</Button>
      </Stack>

      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Mã cha</TableCell>
            <TableCell>Thành phần</TableCell>
            <TableCell>Định mức</TableCell>
            <TableCell>Công đoạn</TableCell>
            <TableCell>Hao hụt (%)</TableCell>
            <TableCell>Bắt đầu</TableCell>
            <TableCell>Hết hạn</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {items.map((r) => (
            <TableRow key={r._id}>
              <TableCell>{r.parent_product_code}</TableCell>
              <TableCell>{r.component_product_code}</TableCell>
              <TableCell>{r.quantity_per}</TableCell>
              <TableCell>{r.operation_code || '-'}</TableCell>
              <TableCell>{r.scrap_rate}</TableCell>
              <TableCell>{r.effective_from ? new Date(r.effective_from).toLocaleDateString() : ''}</TableCell>
              <TableCell>{r.effective_to ? new Date(r.effective_to).toLocaleDateString() : ''}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>Thêm BOM</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1, minWidth: 420 }}>
            <TextField label="Mã cha" value={form.parent_product_code} onChange={(e) => setForm({ ...form, parent_product_code: e.target.value })} />
            <TextField label="Thành phần" value={form.component_product_code} onChange={(e) => setForm({ ...form, component_product_code: e.target.value })} />
            <TextField label="Định mức" type="number" value={form.quantity_per} onChange={(e) => setForm({ ...form, quantity_per: Number(e.target.value) })} />
            <TextField select label="Công đoạn" value={form.operation_code} onChange={(e) => setForm({ ...form, operation_code: e.target.value })}>
              <MenuItem value="">(Không chọn)</MenuItem>
              {operations.map(o => <MenuItem key={o._id} value={o.operation_code}>{o.operation_code} - {o.operation_name}</MenuItem>)}
            </TextField>
            <TextField label="Hao hụt (%)" type="number" value={form.scrap_rate} onChange={(e) => setForm({ ...form, scrap_rate: Number(e.target.value) })} />
            <TextField label="Ngày bắt đầu" type="date" value={form.effective_from} onChange={(e) => setForm({ ...form, effective_from: e.target.value })} InputLabelProps={{ shrink: true }} />
            <TextField label="Ngày hết hạn" type="date" value={form.effective_to || ''} onChange={(e) => setForm({ ...form, effective_to: e.target.value })} InputLabelProps={{ shrink: true }} />
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
