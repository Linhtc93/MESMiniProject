import React, { useEffect, useState } from 'react';
import { Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Snackbar, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography } from '@mui/material';
import api from '../api.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import { exportToExcel } from '../utils/excel.js';

export default function Employees() {
  const { user } = useAuth();
  const hasRole = (roles) => roles.some(r => (user?.roles || []).includes(r));
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ employee_code: '', full_name: '', email: '' });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 20;
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');
  const [editOpen, setEditOpen] = useState(false);
  const [editError, setEditError] = useState('');
  const [editForm, setEditForm] = useState({ employee_code: '', full_name: '', email: '' });
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  const load = async () => {
    const { data } = await api.get('/employees', { params: { page, page_size: pageSize, query: query || undefined } });
    setItems(data.items || []);
    setTotalPages(data.total_pages || 1);
  };

  useEffect(() => { load(); }, [page]);

  const onSave = async () => {
    if (!form.employee_code || !form.full_name || !form.email) return;
    setError('');
    try {
      await api.post('/employees', form);
      setOpen(false);
      setForm({ employee_code: '', full_name: '', email: '' });
      await load();
      setSuccessMsg('Tạo nhân viên thành công');
    } catch (e) {
      setError(e.response?.data?.message || 'Lưu thất bại');
    }
  };

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 2 }}>Nhân viên</Typography>
      <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
        <TextField label="Tìm mã/tên/email" value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); setPage(1); load(); } }} />
        <Button variant="outlined" onClick={() => { setPage(1); load(); }}>Lọc</Button>
        <Box sx={{ flexGrow: 1 }} />
        <Button variant="outlined" onClick={() => exportToExcel({
          data: items.map(x => ({ "Mã NV": x.employee_code, "Họ tên": x.full_name, Email: x.email })),
          fileName: 'employees.xlsx',
          sheetName: 'Employees'
        })}>Export Excel</Button>
        {hasRole(['Admin','Planner']) && (
          <Button variant="contained" onClick={() => setOpen(true)}>Thêm nhân viên</Button>
        )}
      </Stack>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Mã NV</TableCell>
            <TableCell>Họ tên</TableCell>
            <TableCell>Email</TableCell>
            <TableCell>Hành động</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {items.map((r) => (
            <TableRow key={r._id}>
              <TableCell>{r.employee_code}</TableCell>
              <TableCell>{r.full_name}</TableCell>
              <TableCell>{r.email}</TableCell>
              <TableCell>
                {hasRole(['Admin','Planner']) && (
                  <Stack direction="row" spacing={1}>
                    <Button size="small" onClick={() => { setEditForm({ employee_code: r.employee_code, full_name: r.full_name, email: r.email }); setEditError(''); setEditOpen(true); }}>Sửa</Button>
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
        <DialogTitle>Thêm nhân viên</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
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

      {/* Edit dialog */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)}>
        <DialogTitle>Sửa nhân viên</DialogTitle>
        <DialogContent>
          {editError && <Alert severity="error" sx={{ mb: 2 }}>{editError}</Alert>}
          <Stack spacing={2} sx={{ mt: 1, minWidth: 360 }}>
            <TextField label="Mã" value={editForm.employee_code} disabled />
            <TextField label="Họ tên" value={editForm.full_name} onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })} />
            <TextField label="Email" type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOpen(false)}>Hủy</Button>
          <Button variant="contained" onClick={async () => {
            setEditError('');
            try {
              const code = editForm.employee_code;
              const payload = { full_name: editForm.full_name, email: editForm.email };
              await api.put(`/employees/${code}`, payload);
              setEditOpen(false);
              await load();
              setSuccessMsg('Cập nhật nhân viên thành công');
            } catch (e) {
              setEditError(e.response?.data?.message || 'Cập nhật thất bại');
            }
          }}>Lưu</Button>
        </DialogActions>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)}>
        <DialogTitle>Xóa nhân viên</DialogTitle>
        <DialogContent>
          {deleteTarget && <Typography>Bạn chắc muốn xóa nhân viên {deleteTarget.employee_code}?</Typography>}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)}>Hủy</Button>
          <Button color="error" variant="contained" onClick={async () => {
            try {
              await api.delete(`/employees/${deleteTarget.employee_code}`);
              setDeleteTarget(null);
              await load();
              setSuccessMsg('Xóa nhân viên thành công');
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
