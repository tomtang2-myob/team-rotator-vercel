'use client';

import React, { useState, useEffect } from 'react';
import { Inter } from 'next/font/google';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemIcon,
  ListItemText,
  useMediaQuery,
  ThemeProvider,
  createTheme,
  CssBaseline,
  ListItemButton,
  alpha,
  Button,
  CircularProgress,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Assignment as TaskIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
} from '@mui/icons-material';
import Link from 'next/link';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { usePathname, useRouter } from 'next/navigation';

const inter = Inter({ subsets: ['latin'] });

const drawerWidth = 240;

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30000,
      refetchOnWindowFocus: false,
    },
  },
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const pathname = usePathname();
  const router = useRouter();

  // Check authentication on every route change
  useEffect(() => {
    const checkAuth = async () => {
      // Skip auth check for login page
      if (pathname === '/login') {
        setIsCheckingAuth(false);
        setIsAuthenticated(false);
        return;
      }

      try {
        console.log('[Layout] Checking authentication for:', pathname);
        const response = await fetch('/api/auth/verify', {
          method: 'GET',
          credentials: 'include',
        });

        if (response.ok) {
          console.log('[Layout] Authenticated');
          setIsAuthenticated(true);
        } else {
          console.log('[Layout] Not authenticated, redirecting to login');
          setIsAuthenticated(false);
          router.push('/login');
        }
      } catch (error) {
        console.error('[Layout] Auth check error:', error);
        setIsAuthenticated(false);
        router.push('/login');
      } finally {
        setIsCheckingAuth(false);
      }
    };

    setIsCheckingAuth(true);
    checkAuth();
  }, [pathname, router]);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setIsAuthenticated(false);
      router.push('/login');
      router.refresh();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // Hide navigation on login page
  const isLoginPage = pathname === '/login';

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
    { text: 'Members', icon: <PeopleIcon />, path: '/members' },
    { text: 'Tasks', icon: <TaskIcon />, path: '/tasks' },
    { text: 'Settings', icon: <SettingsIcon />, path: '/settings' },
  ];

  const drawer = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div>
        <Toolbar>
          <Typography variant="h6" noWrap>
            Team Rotator
          </Typography>
        </Toolbar>
        <Divider />
        <List>
          {menuItems.map((item) => (
            <Link key={item.text} href={item.path} style={{ textDecoration: 'none', color: 'inherit' }}>
              <ListItemButton
                selected={pathname === item.path}
                onClick={() => {
                  if (isMobile) {
                    handleDrawerToggle();
                  }
                }}
                sx={{
                  my: 0.5,
                  mx: 1,
                  borderRadius: 1,
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.04),
                  },
                  '&.Mui-selected': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.08),
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.primary.main, 0.12),
                    },
                    '& .MuiListItemIcon-root': {
                      color: 'primary.main',
                    },
                    '& .MuiListItemText-primary': {
                      color: 'primary.main',
                      fontWeight: 500,
                    },
                  },
                  position: 'relative',
                  overflow: 'hidden',
                  transition: theme.transitions.create(['background-color', 'color'], {
                    duration: theme.transitions.duration.shorter,
                  }),
                  '&::before': {
                    content: '""',
                    display: 'block',
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    width: '100%',
                    height: '100%',
                    backgroundColor: alpha(theme.palette.primary.main, 0.08),
                    borderRadius: '50%',
                    transform: 'translate(-50%, -50%) scale(0)',
                    transition: theme.transitions.create(['transform', 'opacity'], {
                      duration: theme.transitions.duration.shortest,
                    }),
                    opacity: 0,
                    pointerEvents: 'none',
                  },
                  '&:active::before': {
                    transform: 'translate(-50%, -50%) scale(2.5)',
                    opacity: 1,
                    transition: theme.transitions.create(['transform'], {
                      duration: theme.transitions.duration.shortest,
                    }),
                  },
                }}
              >
                <ListItemIcon 
                  sx={{
                    minWidth: 40,
                    color: pathname === item.path ? 'primary.main' : 'inherit',
                    transition: theme.transitions.create('color'),
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={item.text}
                  sx={{
                    '& .MuiListItemText-primary': {
                      fontSize: '0.875rem',
                      fontWeight: pathname === item.path ? 500 : 400,
                      color: pathname === item.path ? 'primary.main' : 'inherit',
                      transition: theme.transitions.create(['color', 'font-weight']),
                    },
                  }}
                />
              </ListItemButton>
            </Link>
          ))}
        </List>
      </div>
      
      {/* Logout button at the bottom */}
      <Box sx={{ mt: 'auto', p: 2 }}>
        <Divider sx={{ mb: 2 }} />
        <ListItemButton
          onClick={handleLogout}
          sx={{
            borderRadius: 1,
            '&:hover': {
              backgroundColor: alpha(theme.palette.error.main, 0.08),
            },
          }}
        >
          <ListItemIcon sx={{ minWidth: 40, color: 'error.main' }}>
            <LogoutIcon />
          </ListItemIcon>
          <ListItemText 
            primary="Logout"
            sx={{
              '& .MuiListItemText-primary': {
                fontSize: '0.875rem',
                color: 'error.main',
              },
            }}
          />
        </ListItemButton>
      </Box>
    </Box>
  );

  // Show loading spinner while checking authentication
  if (isCheckingAuth && !isLoginPage) {
    return (
      <html lang="en">
        <body className={inter.className} style={{ margin: 0 }}>
          <ThemeProvider theme={theme}>
            <CssBaseline />
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh',
                flexDirection: 'column',
                gap: 2,
              }}
            >
              <CircularProgress />
              <Typography variant="body2" color="text.secondary">
                Checking authentication...
              </Typography>
            </Box>
          </ThemeProvider>
        </body>
      </html>
    );
  }

  // If not authenticated and not on login page, don't render content (will redirect)
  if (!isAuthenticated && !isLoginPage) {
    return (
      <html lang="en">
        <body className={inter.className} style={{ margin: 0 }}>
          <ThemeProvider theme={theme}>
            <CssBaseline />
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh',
                flexDirection: 'column',
                gap: 2,
              }}
            >
              <CircularProgress />
              <Typography variant="body2" color="text.secondary">
                Redirecting to login...
              </Typography>
            </Box>
          </ThemeProvider>
        </body>
      </html>
    );
  }

  return (
    <html lang="en">
      <body className={inter.className} style={{ margin: 0 }}>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider theme={theme}>
            <CssBaseline />
            {isLoginPage ? (
              // Login page without navigation
              <Box>{children}</Box>
            ) : (
              // Main app with navigation (only shown if authenticated)
              <Box sx={{ display: 'flex' }}>
                <AppBar
                  position="fixed"
                  sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}
                >
                  <Toolbar>
                    <IconButton
                      color="inherit"
                      aria-label="open drawer"
                      edge="start"
                      onClick={handleDrawerToggle}
                      sx={{ mr: 2, display: { sm: 'none' } }}
                    >
                      <MenuIcon />
                    </IconButton>
                    <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
                      Team Rotator
                    </Typography>
                    <Button
                      color="inherit"
                      startIcon={<LogoutIcon />}
                      onClick={handleLogout}
                      sx={{ display: { xs: 'none', sm: 'flex' } }}
                    >
                      Logout
                    </Button>
                  </Toolbar>
                </AppBar>
                <Box
                  component="nav"
                  sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
                >
                  <Drawer
                    variant={isMobile ? 'temporary' : 'permanent'}
                    open={mobileOpen}
                    onClose={handleDrawerToggle}
                    ModalProps={{
                      keepMounted: true,
                    }}
                    sx={{
                      '& .MuiDrawer-paper': {
                        boxSizing: 'border-box',
                        width: drawerWidth,
                      },
                    }}
                  >
                    {drawer}
                  </Drawer>
                </Box>
                <Box
                  component="main"
                  sx={{
                    flexGrow: 1,
                    width: { sm: `calc(100% - ${drawerWidth}px)` },
                    marginTop: '64px',
                  }}
                >
                  {children}
                </Box>
              </Box>
            )}
          </ThemeProvider>
        </QueryClientProvider>
      </body>
    </html>
  );
} 