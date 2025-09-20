import React, { useEffect, useState } from 'react';
import { Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Snackbar, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography } from '@mui/material';
import api from '../api.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import { exportToExcel } from '../utils/excel.js';

const categories = ['NVL', 'BTP', 'TP'];

export default function Products() {
  const { user } = useAuth();
  const hasRole = (roles) => roles.some(r => (user?.roles || []).includes(r));
  const [items, setItems] = useState([]);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ product_code: '', product_name: '', category: 'NVL', uom: 'PCS' });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 20;
  const [error, setError] = useState('');
  const [editOpen, setEditOpen] = useState(false);
  const [editError, setEditError] = useState('');
  const [editForm, setEditForm] = useState({ product_code: '', product_name: '', category: 'NVL', uom: 'PCS', supplier_code: '' });
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  const load = async () => {
    const params = { query: query || undefined, category: category || undefined, page, page_size: pageSize };
    const { data } = await api.get('/products', { params });
    setItems(data.items || []);
    setTotalPages(data.total_pages || 1);
  };

  useEffect(() => { load(); }, [page]);

  const onSearch = async (e) => {
    e.preventDefault();
    setPage(1);
    await load();
  };

  const onSave = async () => {
    if (!form.product_code || !form.product_name) return;
    setError('');
    try {
      await api.post('/products', form);
      setOpen(false);
      setForm({ product_code: '', product_name: '', category: 'NVL', uom: 'PCS' });
      await load();
      setSuccessMsg('Tạo sản phẩm thành công');
    } catch (e) {
      setError(e.response?.data?.message || 'Lưu thất bại');
    }
  };

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 2 }}>Sản phẩm</Typography>
      <Stack direction="row" spacing={2} component="form" onSubmit={onSearch} sx={{ mb: 2 }}>
        <TextField label="Tìm kiếm" value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); setPage(1); load(); } }} />
        <TextField select label="Phân loại" value={category} onChange={(e) => setCategory(e.target.value)} sx={{ minWidth: 160 }}>
          <MenuItem value="">Tất cả</MenuItem>
          {categories.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
        </TextField>
        <Button type="submit" variant="outlined">Lọc</Button>
        <Box sx={{ flexGrow: 1 }} />
        <Button variant="outlined" onClick={() => exportToExcel({
          data: items.map(x => ({ Mã: x.product_code, Tên: x.product_name, DVT: x.uom, Loại: x.category, NCC: x.supplier_code || '' })),
          fileName: 'products.xlsx',
          sheetName: 'Products'
        })}>Export Excel</Button>
        {hasRole(['Admin','Planner']) && (
          <Button variant="contained" onClick={() => setOpen(true)}>Thêm mới</Button>
        )}
      </Stack>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Mã</TableCell>
            <TableCell>Tên</TableCell>
            <TableCell>ĐVT</TableCell>
            <TableCell>Loại</TableCell>
            <TableCell>NCC</TableCell>
            <TableCell>Hành động</TableCell>
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
              <TableCell>
                {hasRole(['Admin','Planner']) && (
                  <Stack direction="row" spacing={1}>
                    <Button size="small" onClick={() => { setEditForm({ product_code: r.product_code, product_name: r.product_name, category: r.category, uom: r.uom, supplier_code: r.supplier_code || '' }); setEditError(''); setEditOpen(true); }}>Sửa</Button>
                    <Button size="small" color="error" onClick={() => setDeleteTarget(r)}>Xóa</Button>
                  </Stack>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Stack direction="row" spacing={2} alignItems="center" sx={{ mt: 2 }}>
        <Button variant="outlined" disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>Trang trước</Button>
        <Typography>Trang {page} / {totalPages}</Typography>
        <Button variant="outlined" disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>Trang sau</Button>
      </Stack>

      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>Thêm sản phẩm</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
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

      {/* Edit dialog */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)}>
        <DialogTitle>Sửa sản phẩm</DialogTitle>
        <DialogContent>
          {editError && <Alert severity="error" sx={{ mb: 2 }}>{editError}</Alert>}
          <Stack spacing={2} sx={{ mt: 1, minWidth: 360 }}>
            <TextField label="Mã" value={editForm.product_code} disabled />
            <TextField label="Tên" value={editForm.product_name} onChange={(e) => setEditForm({ ...editForm, product_name: e.target.value })} />
            <TextField label="ĐVT" value={editForm.uom} onChange={(e) => setEditForm({ ...editForm, uom: e.target.value })} />
            <TextField select label="Loại" value={editForm.category} onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}>
              {categories.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
            </TextField>
            <TextField label="Mã NCC" value={editForm.supplier_code || ''} onChange={(e) => setEditForm({ ...editForm, supplier_code: e.target.value })} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOpen(false)}>Hủy</Button>
          <Button variant="contained" onClick={async () => {
            setEditError('');
            try {
              const code = editForm.product_code;
              const payload = { ...editForm };
              delete payload.product_code;
              await api.put(`/products/${code}`, payload);
              setEditOpen(false);
              await load();
              setSuccessMsg('Cập nhật sản phẩm thành công');
            } catch (e) {
              setEditError(e.response?.data?.message || 'Cập nhật thất bại');
            }
          }}>Lưu</Button>
        </DialogActions>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)}>
        <DialogTitle>Xóa sản phẩm</DialogTitle>
        <DialogContent>
          {deleteTarget && <Typography>Bạn chắc muốn xóa sản phẩm {deleteTarget.product_code}?</Typography>}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)}>Hủy</Button>
          <Button color="error" variant="contained" onClick={async () => {
            try {
              await api.delete(`/products/${deleteTarget.product_code}`);
              setDeleteTarget(null);
              await load();
              setSuccessMsg('Xóa sản phẩm thành công');
            } catch (e) {
              alert(e.response?.data?.message || 'Xóa thất bại');
            }
          }}>Xóa</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={!!successMsg} autoHideDuration={2500} onClose={() => setSuccessMsg('')} message={successMsg} />
    </Box>
  );
}
