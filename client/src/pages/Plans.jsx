import React, { useEffect, useState } from 'react';
import { Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Snackbar, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography } from '@mui/material';
import api from '../api.js';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { exportToExcel } from '../utils/excel.js';

const statuses = [
  { value: '', label: 'Tất cả' },
  { value: 'not_started', label: 'Chưa bắt đầu' },
  { value: 'started', label: 'Đang chạy' },
  { value: 'completed', label: 'Hoàn thành' },
];

export default function Plans() {
  const { user } = useAuth();
  const hasRole = (roles) => roles.some(r => (user?.roles || []).includes(r));
  const [items, setItems] = useState([]);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [productCode, setProductCode] = useState('');
  const [status, setStatus] = useState('');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ product_code: '', ship_date: new Date().toISOString().slice(0, 10), plan_qty: 0 });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 20;
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [editOpen, setEditOpen] = useState(false);
  const [editError, setEditError] = useState('');
  const [editForm, setEditForm] = useState({ _id: '', product_code: '', ship_date: '', plan_qty: 0 });
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [confirmComplete, setConfirmComplete] = useState(null); // store plan to confirm complete

  const load = async () => {
    const params = {
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
      product_code: productCode || undefined,
      status: status || undefined,
      page,
      page_size: pageSize,
    };
    const { data } = await api.get('/plans', { params });
    setItems(data.items || []);
    setTotalPages(data.total_pages || 1);
  };

  useEffect(() => { load(); }, [page]);

  const onFilter = async (e) => { e.preventDefault(); await load(); };

  const onCreate = async () => {
    if (!form.product_code || !form.ship_date || !form.plan_qty) return;
    setError('');
    try {
      await api.post('/plans', { ...form, plan_qty: Number(form.plan_qty) });
      setOpen(false);
      setForm({ product_code: '', ship_date: new Date().toISOString().slice(0, 10), plan_qty: 0 });
      await load();
      setSuccessMsg('Tạo kế hoạch thành công');
    } catch (e) {
      setError(e.response?.data?.message || 'Tạo kế hoạch thất bại');
    }
  };

  const onStart = async (id) => { await api.post(`/plans/${id}/start`); await load(); setSuccessMsg('Start kế hoạch thành công'); };
  const onComplete = async (id) => { await api.post(`/plans/${id}/complete`); await load(); setSuccessMsg('Hoàn thành kế hoạch thành công'); };

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 2 }}>Kế hoạch sản xuất</Typography>
      <Stack direction="row" spacing={2} component="form" onSubmit={onFilter} sx={{ mb: 2 }}>
        <TextField label="Từ ngày" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} InputLabelProps={{ shrink: !!dateFrom }} />
        <TextField label="Đến ngày" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} InputLabelProps={{ shrink: !!dateTo }} />
        <TextField label="Mã hàng" value={productCode} onChange={(e) => setProductCode(e.target.value)} />
        <TextField select label="Trạng thái" value={status} onChange={(e) => setStatus(e.target.value)} sx={{ minWidth: 180 }}>
          {statuses.map(s => <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>)}
        </TextField>
        <Button type="submit" variant="outlined" onClick={() => setPage(1)}>Lọc</Button>
        <Box sx={{ flexGrow: 1 }} />
        <Button variant="outlined" onClick={() => exportToExcel({
          data: items.map(x => ({ Ngay: new Date(x.ship_date).toLocaleDateString(), MaHang: x.product_code, KeHoach: x.plan_qty, TrangThai: x.is_completed ? 'Hoàn thành' : (x.started ? 'Đang chạy' : 'Chưa bắt đầu') })),
          fileName: 'plans.xlsx',
          sheetName: 'Plans'
        })}>Export Excel</Button>
        {hasRole(['Admin','Planner']) && (
          <Button variant="contained" onClick={() => setOpen(true)}>Tạo kế hoạch</Button>
        )}
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
                  {!r.started && hasRole(['Admin','Planner','Operator']) && <Button size="small" variant="outlined" onClick={() => onStart(r._id)}>Start</Button>}
                  <Button size="small" variant="contained" onClick={() => navigate(`/plans/${r._id}`)}>Chi tiết</Button>
                  {!r.is_completed && hasRole(['Admin','Planner']) && <Button size="small" color="success" onClick={() => setConfirmComplete(r)}>Hoàn thành</Button>}
                  {hasRole(['Admin','Planner']) && <Button size="small" onClick={() => { setEditForm({ _id: r._id, product_code: r.product_code, ship_date: r.ship_date?.substring(0,10) || '', plan_qty: r.plan_qty }); setEditError(''); setEditOpen(true); }}>Sửa</Button>}
                  {hasRole(['Admin','Planner']) && <Button size="small" color="error" onClick={() => setDeleteTarget(r)}>Xóa</Button>}
                </Stack>
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
        <DialogTitle>Tạo kế hoạch</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
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

      {/* Edit dialog */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)}>
        <DialogTitle>Sửa kế hoạch</DialogTitle>
        <DialogContent>
          {editError && <Alert severity="error" sx={{ mb: 2 }}>{editError}</Alert>}
          <Stack spacing={2} sx={{ mt: 1, minWidth: 360 }}>
            <TextField label="Mã hàng" value={editForm.product_code} disabled />
            <TextField label="Ngày xuất" type="date" value={editForm.ship_date} onChange={(e) => setEditForm({ ...editForm, ship_date: e.target.value })} InputLabelProps={{ shrink: true }} />
            <TextField label="Số lượng" type="number" value={editForm.plan_qty} onChange={(e) => setEditForm({ ...editForm, plan_qty: Number(e.target.value) })} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOpen(false)}>Hủy</Button>
          <Button variant="contained" onClick={async () => {
            setEditError('');
            try {
              const id = editForm._id;
              const payload = { ship_date: editForm.ship_date, plan_qty: Number(editForm.plan_qty) };
              await api.put(`/plans/${id}`, payload);
              setEditOpen(false);
              await load();
              setSuccessMsg('Cập nhật kế hoạch thành công');
            } catch (e) {
              setEditError(e.response?.data?.message || 'Cập nhật thất bại');
            }
          }}>Lưu</Button>
        </DialogActions>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)}>
        <DialogTitle>Xóa kế hoạch</DialogTitle>
        <DialogContent>
          {deleteTarget && <Typography>Bạn chắc muốn xóa kế hoạch {deleteTarget.product_code} - {new Date(deleteTarget.ship_date).toLocaleDateString()}?</Typography>}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)}>Hủy</Button>
          <Button color="error" variant="contained" onClick={async () => {
            try {
              await api.delete(`/plans/${deleteTarget._id}`);
              setDeleteTarget(null);
              await load();
              setSuccessMsg('Xóa kế hoạch thành công');
            } catch (e) {
              alert(e.response?.data?.message || 'Xóa thất bại');
            }
          }}>Xóa</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={!!successMsg} autoHideDuration={2500} onClose={() => setSuccessMsg('')} message={successMsg} />

      {/* Confirm Complete */}
      <Dialog open={!!confirmComplete} onClose={() => setConfirmComplete(null)}>
        <DialogTitle>Hoàn thành kế hoạch</DialogTitle>
        <DialogContent>
          {confirmComplete && <Typography>Bạn chắc muốn đánh dấu hoàn thành kế hoạch {confirmComplete.product_code} - {new Date(confirmComplete.ship_date).toLocaleDateString()}?</Typography>}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmComplete(null)}>Hủy</Button>
          <Button variant="contained" color="success" onClick={async () => {
            if (!confirmComplete) return;
            try {
              await onComplete(confirmComplete._id);
              setConfirmComplete(null);
            } catch (e) {
              setConfirmComplete(null);
            }
          }}>Hoàn thành</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
