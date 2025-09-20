import React, { useEffect, useState } from 'react';
import { Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Snackbar, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography } from '@mui/material';
import api from '../api.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import { exportToExcel } from '../utils/excel.js';

export default function Operations() {
  const { user } = useAuth();
  const hasRole = (roles) => roles.some(r => (user?.roles || []).includes(r));
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ operation_code: '', operation_name: '', cycle_time_seconds: 0 });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 20;
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');
  const [editOpen, setEditOpen] = useState(false);
  const [editError, setEditError] = useState('');
  const [editForm, setEditForm] = useState({ operation_code: '', operation_name: '', cycle_time_seconds: 0 });
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  const load = async () => {
    const { data } = await api.get('/operations', { params: { page, page_size: pageSize, query: query || undefined } });
    setItems(data.items || []);
    setTotalPages(data.total_pages || 1);
  };

  useEffect(() => { load(); }, [page]);

  const onSave = async () => {
    if (!form.operation_code || !form.operation_name) return;
    setError('');
    try {
      await api.post('/operations', form);
      setOpen(false);
      setForm({ operation_code: '', operation_name: '', cycle_time_seconds: 0 });
      await load();
      setSuccessMsg('Tạo công đoạn thành công');
    } catch (e) {
      setError(e.response?.data?.message || 'Lưu thất bại');
    }
  };

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 2 }}>Công đoạn</Typography>
      <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
        <TextField label="Tìm mã/tên" value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); setPage(1); load(); } }} />
        <Button variant="outlined" onClick={() => { setPage(1); load(); }}>Lọc</Button>
        <Box sx={{ flexGrow: 1 }} />
        <Button variant="outlined" onClick={() => exportToExcel({
          data: items.map(x => ({ Mã: x.operation_code, Tên: x.operation_name, CycleTime: x.cycle_time_seconds })),
          fileName: 'operations.xlsx',
          sheetName: 'Operations'
        })}>Export Excel</Button>
        {hasRole(['Admin','Planner']) && (
          <Button variant="contained" onClick={() => setOpen(true)}>Thêm công đoạn</Button>
        )}
      </Stack>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Mã</TableCell>
            <TableCell>Tên</TableCell>
            <TableCell>Thời gian (s)</TableCell>
            <TableCell>Hành động</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {items.map((r) => (
            <TableRow key={r._id}>
              <TableCell>{r.operation_code}</TableCell>
              <TableCell>{r.operation_name}</TableCell>
              <TableCell>{r.cycle_time_seconds}</TableCell>
              <TableCell>
                {hasRole(['Admin','Planner']) && (
                  <Stack direction="row" spacing={1}>
                    <Button size="small" onClick={() => { setEditForm({ operation_code: r.operation_code, operation_name: r.operation_name, cycle_time_seconds: r.cycle_time_seconds || 0 }); setEditError(''); setEditOpen(true); }}>Sửa</Button>
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
        <DialogTitle>Thêm công đoạn</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
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

      {/* Edit dialog */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)}>
        <DialogTitle>Sửa công đoạn</DialogTitle>
        <DialogContent>
          {editError && <Alert severity="error" sx={{ mb: 2 }}>{editError}</Alert>}
          <Stack spacing={2} sx={{ mt: 1, minWidth: 360 }}>
            <TextField label="Mã" value={editForm.operation_code} disabled />
            <TextField label="Tên" value={editForm.operation_name} onChange={(e) => setEditForm({ ...editForm, operation_name: e.target.value })} />
            <TextField label="Thời gian (giây)" type="number" value={editForm.cycle_time_seconds} onChange={(e) => setEditForm({ ...editForm, cycle_time_seconds: Number(e.target.value) })} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOpen(false)}>Hủy</Button>
          <Button variant="contained" onClick={async () => {
            setEditError('');
            try {
              const code = editForm.operation_code;
              const payload = { ...editForm };
              delete payload.operation_code;
              await api.put(`/operations/${code}`, payload);
              setEditOpen(false);
              await load();
              setSuccessMsg('Cập nhật công đoạn thành công');
            } catch (e) {
              setEditError(e.response?.data?.message || 'Cập nhật thất bại');
            }
          }}>Lưu</Button>
        </DialogActions>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)}>
        <DialogTitle>Xóa công đoạn</DialogTitle>
        <DialogContent>
          {deleteTarget && <Typography>Bạn chắc muốn xóa công đoạn {deleteTarget.operation_code}?</Typography>}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)}>Hủy</Button>
          <Button color="error" variant="contained" onClick={async () => {
            try {
              await api.delete(`/operations/${deleteTarget.operation_code}`);
              setDeleteTarget(null);
              await load();
              setSuccessMsg('Xóa công đoạn thành công');
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
