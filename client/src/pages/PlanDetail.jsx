import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Alert, Box, Button, Card, CardContent, Divider, Grid, MenuItem, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography, LinearProgress } from '@mui/material';
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
    const { data: outs } = await api.get('/outputs', { params: { plan_id: id } });
    setOutputs(outs);
  };

  useEffect(() => { load().catch(() => {}); }, [id]);

  const onStart = async () => {
    await api.post(`/plans/${id}/start`);
    await load();
  };

  const onCompletePlan = async () => {
    await api.post(`/plans/${id}/complete`);
    await load();
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
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Ngày</TableCell>
                    <TableCell>Số lượng</TableCell>
                    <TableCell>Công đoạn</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {outputs.map(o => (
                    <TableRow key={o._id}>
                      <TableCell>{new Date(o.production_date).toLocaleString()}</TableCell>
                      <TableCell>{o.quantity}</TableCell>
                      <TableCell>{o.operation_code || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
