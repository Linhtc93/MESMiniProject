import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Alert, Box, Button, Card, CardContent, Divider, Grid, MenuItem, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography, LinearProgress, Dialog, DialogTitle, DialogContent, DialogActions, Snackbar } from '@mui/material';
import api from '../api.js';

export default function PlanDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [plan, setPlan] = useState(null);
  const [progress, setProgress] = useState(null);
  const [outputs, setOutputs] = useState([]);
  const [operations, setOperations] = useState([]);
  const [form, setForm] = useState({ quantity: 0, production_date: new Date().toISOString().slice(0, 10), operation_code: '' });
  const [error, setError] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 20;
  const [editOpen, setEditOpen] = useState(false);
  const [editError, setEditError] = useState('');
  const [editForm, setEditForm] = useState({ _id: '', quantity: 0, production_date: new Date().toISOString().slice(0, 10), operation_code: '' });
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [confirmStart, setConfirmStart] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [undoData, setUndoData] = useState(null); // store last deleted output to allow undo

  const pct = useMemo(() => {
    if (!progress || !plan) return 0;
    return Math.min(100, Math.round(((progress.produced_qty || 0) / (plan.plan_qty || 1)) * 100));
  }, [progress, plan]);

  const load = async () => {
    const [{ data: planRes }, { data: opRes }] = await Promise.all([
      api.get(`/plans/${id}`),
      api.get('/operations'),
    ]);
    setPlan(planRes.plan);
    setProgress(planRes.progress);
    setOperations(opRes);
    const { data: outs } = await api.get('/outputs', { params: { plan_id: id, date_from: dateFrom || undefined, date_to: dateTo || undefined, page, page_size: pageSize } });
    setOutputs(outs.items || []);
    setTotalPages(outs.total_pages || 1);
  };

  useEffect(() => { load().catch(() => {}); }, [id, page]);

  const onStart = async () => {
    setConfirmStart(true);
  };

  const onCompletePlan = async () => {
    await api.post(`/plans/${id}/complete`);
    await load();
    setSuccessMsg('Đánh dấu hoàn thành thành công');
  };

  const onAddOutput = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (!form.quantity || form.quantity <= 0) return;
      const payload = {
        plan_id: id,
        product_code: plan.product_code,
        product_name: '',
        quantity: Number(form.quantity),
        production_date: form.production_date,
      };
      if (form.operation_code) payload.operation_code = form.operation_code;
      const { data } = await api.post('/outputs', payload);
      setOutputs(o => [{ ...data.created }, ...o]);
      setProgress({ plan_id: id, plan_qty: plan.plan_qty, produced_qty: data.progress.produced_qty, remaining_qty: data.progress.remaining_qty, started: true, is_completed: data.progress.is_completed });
      setForm({ ...form, quantity: 0 });
    } catch (err) {
      setError(err.response?.data?.message || 'Lỗi thêm sản lượng');
    }
  };

  if (!plan || !progress) return <Typography>Đang tải...</Typography>;

  return (
    <Box>
      <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
        <Button variant="outlined" onClick={() => navigate(-1)}>Quay lại</Button>
        <Typography variant="h5">Kế hoạch: {plan.product_code} - {new Date(plan.ship_date).toLocaleDateString()}</Typography>
      </Stack>

      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1">Thông tin kế hoạch</Typography>
              <Divider sx={{ my: 1 }} />
              <Stack spacing={1}>
                <Typography>Mã hàng: <b>{plan.product_code}</b></Typography>
                <Typography>Ngày xuất: <b>{new Date(plan.ship_date).toLocaleDateString()}</b></Typography>
                <Typography>Kế hoạch: <b>{plan.plan_qty}</b></Typography>
                <Typography>Trạng thái: <b>{plan.is_completed ? 'Hoàn thành' : (plan.started ? 'Đang chạy' : 'Chưa bắt đầu')}</b></Typography>
                <Box>
                  <LinearProgress variant="determinate" value={pct} />
                  <Typography variant="caption">Đã làm {progress.produced_qty} / {plan.plan_qty} ({pct}%) - Còn lại {progress.remaining_qty}</Typography>
                </Box>
                <Stack direction="row" spacing={1}>
                  {!plan.started && <Button variant="outlined" onClick={onStart}>Start</Button>}
                  {!plan.is_completed && <Button variant="contained" color="success" onClick={onCompletePlan}>Đánh dấu hoàn thành</Button>}
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1">Nhập sản lượng</Typography>
              <Divider sx={{ my: 1 }} />
              {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
              <Stack component="form" direction="row" spacing={2} onSubmit={onAddOutput}>
                <TextField label="Số lượng" type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })} sx={{ width: 140 }} />
                <TextField label="Ngày sản xuất" type="date" value={form.production_date} onChange={(e) => setForm({ ...form, production_date: e.target.value })} InputLabelProps={{ shrink: true }} />
                <TextField label="Công đoạn" select value={form.operation_code} onChange={(e) => setForm({ ...form, operation_code: e.target.value })} sx={{ minWidth: 200 }}>
                  <MenuItem value="">(Không chọn)</MenuItem>
                  {operations.map(o => <MenuItem key={o._id} value={o.operation_code}>{o.operation_code} - {o.operation_name}</MenuItem>)}
                </TextField>
                <Button type="submit" variant="contained">Thêm</Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1">Lịch sử sản lượng</Typography>
              <Divider sx={{ my: 1 }} />
              <Stack direction="row" spacing={2} component="form" onSubmit={(e) => { e.preventDefault(); setPage(1); load(); }} sx={{ mb: 2 }}>
                <TextField label="Từ ngày" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} InputLabelProps={{ shrink: !!dateFrom }} />
                <TextField label="Đến ngày" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} InputLabelProps={{ shrink: !!dateTo }} />
                <Button variant="outlined" onClick={() => { setPage(1); load(); }}>Lọc</Button>
              </Stack>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Ngày</TableCell>
                    <TableCell>Số lượng</TableCell>
                    <TableCell>Công đoạn</TableCell>
                    <TableCell>Hành động</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {outputs.map(o => (
                    <TableRow key={o._id}>
                      <TableCell>{new Date(o.production_date).toLocaleString()}</TableCell>
                      <TableCell>{o.quantity}</TableCell>
                      <TableCell>{o.operation_code || '-'}</TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1}>
                          <Button size="small" onClick={() => { setEditForm({ _id: o._id, quantity: o.quantity, production_date: o.production_date?.substring(0,10) || '', operation_code: o.operation_code || '' }); setEditError(''); setEditOpen(true); }}>Sửa</Button>
                          <Button size="small" color="error" onClick={() => setDeleteTarget(o)}>Xóa</Button>
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
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Confirm Start */}
      <Dialog open={confirmStart} onClose={() => setConfirmStart(false)}>
        <DialogTitle>Khởi động kế hoạch</DialogTitle>
        <DialogContent>
          <Typography>Bạn chắc muốn Start kế hoạch này?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmStart(false)}>Hủy</Button>
          <Button variant="contained" onClick={async () => {
            try {
              await api.post(`/plans/${id}/start`);
              setConfirmStart(false);
              await load();
              setSuccessMsg('Start kế hoạch thành công');
            } catch (e) {
              setConfirmStart(false);
            }
          }}>Start</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Output */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)}>
        <DialogTitle>Sửa sản lượng</DialogTitle>
        <DialogContent>
          {editError && <Alert severity="error" sx={{ mb: 2 }}>{editError}</Alert>}
          <Stack spacing={2} sx={{ mt: 1, minWidth: 360 }}>
            <TextField label="Số lượng" type="number" value={editForm.quantity} onChange={(e) => setEditForm({ ...editForm, quantity: Number(e.target.value) })} />
            <TextField label="Ngày sản xuất" type="date" value={editForm.production_date} onChange={(e) => setEditForm({ ...editForm, production_date: e.target.value })} InputLabelProps={{ shrink: true }} />
            <TextField label="Công đoạn" select value={editForm.operation_code} onChange={(e) => setEditForm({ ...editForm, operation_code: e.target.value })} sx={{ minWidth: 200 }}>
              <MenuItem value="">(Không chọn)</MenuItem>
              {operations.map(o => <MenuItem key={o._id} value={o.operation_code}>{o.operation_code} - {o.operation_name}</MenuItem>)}
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOpen(false)}>Hủy</Button>
          <Button variant="contained" onClick={async () => {
            setEditError('');
            try {
              const payload = { quantity: Number(editForm.quantity), production_date: editForm.production_date };
              if (editForm.operation_code) payload.operation_code = editForm.operation_code; else payload.operation_code = '';
              await api.put(`/outputs/${editForm._id}`, payload);
              setEditOpen(false);
              await load();
              const { data: prog } = await api.get(`/plans/${id}/progress`);
              setProgress(prog);
            } catch (e) {
              setEditError(e.response?.data?.message || 'Cập nhật sản lượng thất bại');
            }
          }}>Lưu</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Output */}
      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)}>
        <DialogTitle>Xóa sản lượng</DialogTitle>
        <DialogContent>
          {deleteTarget && <Typography>Bạn chắc muốn xóa bản ghi ngày {new Date(deleteTarget.production_date).toLocaleString()} số lượng {deleteTarget.quantity}?</Typography>}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)}>Hủy</Button>
          <Button color="error" variant="contained" onClick={async () => {
            try {
              // prepare undo payload before delete
              setUndoData({
                plan_id: id,
                product_code: plan?.product_code,
                product_name: '',
                quantity: deleteTarget.quantity,
                production_date: deleteTarget.production_date?.substring(0,10) || new Date(deleteTarget.production_date).toISOString().slice(0,10),
                operation_code: deleteTarget.operation_code || '',
              });
              await api.delete(`/outputs/${deleteTarget._id}`);
              setDeleteTarget(null);
              await load();
              const { data: prog } = await api.get(`/plans/${id}/progress`);
              setProgress(prog);
              setSuccessMsg('Đã xóa sản lượng. Nhấn Hoàn tác để khôi phục.');
            } catch (e) {
              setDeleteTarget(null);
              alert(e.response?.data?.message || 'Xóa sản lượng thất bại');
            }
          }}>Xóa</Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={!!successMsg}
        autoHideDuration={3000}
        onClose={() => setSuccessMsg('')}
        message={successMsg}
        action={undoData ? (
          <Button color="secondary" size="small" onClick={async () => {
            try {
              const payload = { ...undoData };
              if (!payload.operation_code) delete payload.operation_code;
              await api.post('/outputs', payload);
              setUndoData(null);
              setSuccessMsg('Đã khôi phục sản lượng');
              await load();
              const { data: prog } = await api.get(`/plans/${id}/progress`);
              setProgress(prog);
            } catch (e) {
              setSuccessMsg('Hoàn tác thất bại');
              setUndoData(null);
            }
          }}>
            Hoàn tác
          </Button>
        ) : undefined}
      />
    </Box>
  );
}
