import React, { useEffect, useState } from 'react';
import { Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Snackbar, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography } from '@mui/material';
import api from '../api.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import { exportToExcel } from '../utils/excel.js';

export default function BOMs() {
  const { user } = useAuth();
  const hasRole = (roles) => roles.some(r => (user?.roles || []).includes(r));
  const [items, setItems] = useState([]);
  const [parent, setParent] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [open, setOpen] = useState(false);
  const [operations, setOperations] = useState([]);
  const [form, setForm] = useState({ parent_product_code: '', component_product_code: '', quantity_per: 1, operation_code: '', scrap_rate: 0, effective_from: '' });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 20;
  const [error, setError] = useState('');
  const [editOpen, setEditOpen] = useState(false);
  const [editError, setEditError] = useState('');
  const [editForm, setEditForm] = useState({ _id: '', parent_product_code: '', component_product_code: '', quantity_per: 1, operation_code: '', scrap_rate: 0, effective_from: '', effective_to: '' });
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  const load = async () => {
    const params = {
      parent: parent || undefined,
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
      page,
      page_size: pageSize,
    };
    const { data } = await api.get('/boms', { params });
    setItems(data.items || []);
    setTotalPages(data.total_pages || 1);
  };

  useEffect(() => { api.get('/operations').then(({ data }) => setOperations(data.items ? data.items : data)); }, []);
  useEffect(() => { load(); }, [page]);

  const onSearch = async (e) => { e.preventDefault(); setPage(1); await load(); };

  const onSave = async () => {
    if (!form.parent_product_code || !form.component_product_code || !form.quantity_per) return;
    const payload = { ...form };
    if (!payload.effective_from) payload.effective_from = new Date().toISOString().slice(0, 10);
    if (!payload.operation_code) delete payload.operation_code;
    setError('');
    try {
      await api.post('/boms', payload);
      setOpen(false);
      setForm({ parent_product_code: '', component_product_code: '', quantity_per: 1, operation_code: '', scrap_rate: 0, effective_from: '' });
      await load();
      setSuccessMsg('Tạo BOM thành công');
    } catch (e) {
      setError(e.response?.data?.message || 'Lưu thất bại');
    }
  };

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 2 }}>BOM</Typography>
      <Stack direction="row" spacing={2} component="form" onSubmit={onSearch} sx={{ mb: 2 }}>
        <TextField label="Mã cha" value={parent} onChange={(e) => setParent(e.target.value)} />
        <TextField label="Từ ngày" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} InputLabelProps={{ shrink: !!dateFrom }} />
        <TextField label="Đến ngày" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} InputLabelProps={{ shrink: !!dateTo }} />
        <Button type="submit" variant="outlined" onClick={() => setPage(1)}>Lọc</Button>
        <Box sx={{ flexGrow: 1 }} />
        <Button variant="outlined" onClick={() => exportToExcel({
          data: items.map(x => ({ Cha: x.parent_product_code, ThanhPhan: x.component_product_code, DinhMuc: x.quantity_per, CongDoan: x.operation_code || '', HaoHut: x.scrap_rate, BatDau: x.effective_from ? new Date(x.effective_from).toLocaleDateString() : '', HetHan: x.effective_to ? new Date(x.effective_to).toLocaleDateString() : '' })),
          fileName: 'boms.xlsx',
          sheetName: 'BOMs'
        })}>Export Excel</Button>
        {hasRole(['Admin','Planner']) && (
          <Button variant="contained" onClick={() => setOpen(true)}>Thêm BOM</Button>
        )}
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
            <TableCell>Hành động</TableCell>
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
              <TableCell>
                {hasRole(['Admin','Planner']) && (
                  <Stack direction="row" spacing={1}>
                    <Button size="small" onClick={() => { setEditForm({ _id: r._id, parent_product_code: r.parent_product_code, component_product_code: r.component_product_code, quantity_per: r.quantity_per, operation_code: r.operation_code || '', scrap_rate: r.scrap_rate || 0, effective_from: r.effective_from ? r.effective_from.substring(0,10) : '', effective_to: r.effective_to ? r.effective_to.substring(0,10) : '' }); setEditError(''); setEditOpen(true); }}>Sửa</Button>
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
        <DialogTitle>Thêm BOM</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
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

      {/* Edit dialog */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)}>
        <DialogTitle>Sửa BOM</DialogTitle>
        <DialogContent>
          {editError && <Alert severity="error" sx={{ mb: 2 }}>{editError}</Alert>}
          <Stack spacing={2} sx={{ mt: 1, minWidth: 420 }}>
            <TextField label="Mã cha" value={editForm.parent_product_code} onChange={(e) => setEditForm({ ...editForm, parent_product_code: e.target.value })} />
            <TextField label="Thành phần" value={editForm.component_product_code} onChange={(e) => setEditForm({ ...editForm, component_product_code: e.target.value })} />
            <TextField label="Định mức" type="number" value={editForm.quantity_per} onChange={(e) => setEditForm({ ...editForm, quantity_per: Number(e.target.value) })} />
            <TextField label="Công đoạn" value={editForm.operation_code} onChange={(e) => setEditForm({ ...editForm, operation_code: e.target.value })} />
            <TextField label="Hao hụt (%)" type="number" value={editForm.scrap_rate} onChange={(e) => setEditForm({ ...editForm, scrap_rate: Number(e.target.value) })} />
            <TextField label="Ngày bắt đầu" type="date" value={editForm.effective_from} onChange={(e) => setEditForm({ ...editForm, effective_from: e.target.value })} InputLabelProps={{ shrink: true }} />
            <TextField label="Ngày hết hạn" type="date" value={editForm.effective_to || ''} onChange={(e) => setEditForm({ ...editForm, effective_to: e.target.value })} InputLabelProps={{ shrink: true }} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOpen(false)}>Hủy</Button>
          <Button variant="contained" onClick={async () => {
            setEditError('');
            try {
              const id = editForm._id;
              const payload = { ...editForm };
              delete payload._id;
              await api.put(`/boms/${id}`, payload);
              setEditOpen(false);
              await load();
              setSuccessMsg('Cập nhật BOM thành công');
            } catch (e) {
              setEditError(e.response?.data?.message || 'Cập nhật thất bại');
            }
          }}>Lưu</Button>
        </DialogActions>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)}>
        <DialogTitle>Xóa BOM</DialogTitle>
        <DialogContent>
          {deleteTarget && <Typography>Bạn chắc muốn xóa BOM {deleteTarget.parent_product_code} - {deleteTarget.component_product_code}?</Typography>}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)}>Hủy</Button>
          <Button color="error" variant="contained" onClick={async () => {
            try {
              await api.delete(`/boms/${deleteTarget._id}`);
              setDeleteTarget(null);
              await load();
              setSuccessMsg('Xóa BOM thành công');
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
