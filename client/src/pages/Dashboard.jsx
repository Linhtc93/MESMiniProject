import React, { useEffect, useState } from 'react';
import { Box, Card, CardContent, Grid, Typography, LinearProgress, Button } from '@mui/material';
import api from '../api.js';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const [plans, setPlans] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    api.get('/plans', { params: { date: today } }).then(({ data }) => setPlans(data)).catch(() => {});
  }, []);

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 2 }}>Dashboard</Typography>
      <Grid container spacing={2}>
        {plans.map((p) => (
          <Grid item xs={12} md={6} lg={4} key={p._id}>
            <Card>
              <CardContent>
                <Typography variant="subtitle1">Mã hàng: {p.product_code}</Typography>
                <Typography variant="body2">Ngày xuất: {new Date(p.ship_date).toLocaleDateString()}</Typography>
                <Typography variant="body2">Kế hoạch: {p.plan_qty}</Typography>
                <Typography variant="body2">Trạng thái: {p.is_completed ? 'Hoàn thành' : (p.started ? 'Đang chạy' : 'Chưa bắt đầu')}</Typography>
                <Progress planId={p._id} planQty={p.plan_qty} />
                <Button sx={{ mt: 1 }} variant="outlined" onClick={() => navigate(`/plans/${p._id}`)}>Chi tiết</Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}

function Progress({ planId, planQty }) {
  const [progress, setProgress] = useState(null);
  useEffect(() => {
    api.get(`/plans/${planId}/progress`).then(({ data }) => setProgress(data)).catch(() => {});
  }, [planId]);
  if (!progress) return null;
  const pct = Math.min(100, Math.round(((progress.produced_qty || 0) / (planQty || 1)) * 100));
  return (
    <Box sx={{ mt: 1 }}>
      <LinearProgress variant="determinate" value={pct} />
      <Typography variant="caption">Đã làm {progress.produced_qty} / {planQty} ({pct}%) - Còn lại {progress.remaining_qty}</Typography>
    </Box>
  );
}
