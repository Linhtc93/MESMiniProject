import React from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { AppBar, Box, Button, Container, Toolbar, Typography } from '@mui/material';
import { useAuth } from '../contexts/AuthContext.jsx';

const navItems = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/products', label: 'Sản phẩm' },
  { to: '/operations', label: 'Công đoạn' },
  { to: '/boms', label: 'BOM' },
  { to: '/employees', label: 'Nhân viên' },
  { to: '/plans', label: 'Kế hoạch' },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>Manufacturing ERP</Typography>
          {navItems.map((n) => (
            <Button key={n.to} color={location.pathname.startsWith(n.to) ? 'secondary' : 'inherit'} component={Link} to={n.to} sx={{ color: '#fff' }}>
              {n.label}
            </Button>
          ))}
          <Typography sx={{ ml: 2, mr: 1 }}>{user?.username}</Typography>
          <Button color="inherit" onClick={() => { logout(); navigate('/login'); }}>Đăng xuất</Button>
        </Toolbar>
      </AppBar>
      <Container sx={{ my: 3, flexGrow: 1 }}>
        <Outlet />
      </Container>
      <Box component="footer" sx={{ textAlign: 'center', py: 2, bgcolor: '#f5f5f5' }}>
        <Typography variant="caption">© {new Date().getFullYear()} Manufacturing ERP</Typography>
      </Box>
    </Box>
  );
}
