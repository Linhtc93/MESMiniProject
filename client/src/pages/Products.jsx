import React, { useEffect, useState } from 'react';
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography } from '@mui/material';
import api from '../api.js';

const categories = ['NVL', 'BTP', 'TP'];

export default function Products() {
  const [items, setItems] = useState([]);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ product_code: '', product_name: '', category: 'NVL', uom: 'PCS' });

  const load = async () => {
    const { data } = await api.get('/products', { params: { query, category } });
    setItems(data);
  };

  useEffect(() => { load(); }, []);

  const onSearch = async (e) => {
    e.preventDefault();
    await load();
  };

  const onSave = async () => {
    if (!form.product_code || !form.product_name) return;
    await api.post('/products', form);
    setOpen(false);
    setForm({ product_code: '', product_name: '', category: 'NVL', uom: 'PCS' });
    await load();
  };

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 2 }}>Sản phẩm</Typography>
      <Stack direction="row" spacing={2} component="form" onSubmit={onSearch} sx={{ mb: 2 }}>
        <TextField label="Tìm kiếm" value={query} onChange={(e) => setQuery(e.target.value)} />
        <TextField select label="Phân loại" value={category} onChange={(e) => setCategory(e.target.value)} sx={{ minWidth: 160 }}>
          <MenuItem value="">Tất cả</MenuItem>
          {categories.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
        </TextField>
        <Button type="submit" variant="outlined">Lọc</Button>
        <Box sx={{ flexGrow: 1 }} />
        <Button variant="contained" onClick={() => setOpen(true)}>Thêm mới</Button>
      </Stack>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Mã</TableCell>
            <TableCell>Tên</TableCell>
            <TableCell>ĐVT</TableCell>
            <TableCell>Loại</TableCell>
            <TableCell>NCC</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {items.map((r) => (
            <TableRow key={r._id}>
              <TableCell>{r.product_code}</TableCell>
              <TableCell>{r.product_name}</TableCell>
              <TableCell>{r.uom}</TableCell>
              <TableCell>{r.category}</TableCell>
              <TableCell>{r.supplier_code}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>Thêm sản phẩm</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1, minWidth: 360 }}>
            <TextField label="Mã" value={form.product_code} onChange={(e) => setForm({ ...form, product_code: e.target.value })} />
            <TextField label="Tên" value={form.product_name} onChange={(e) => setForm({ ...form, product_name: e.target.value })} />
            <TextField label="ĐVT" value={form.uom} onChange={(e) => setForm({ ...form, uom: e.target.value })} />
            <TextField select label="Loại" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {categories.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
            </TextField>
            <TextField label="Mã NCC" value={form.supplier_code || ''} onChange={(e) => setForm({ ...form, supplier_code: e.target.value })} />
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
