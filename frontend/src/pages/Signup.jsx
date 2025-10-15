import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  MenuItem,
  Grid,
  Container,
  Paper,
  Avatar,
  Chip,
  Alert,
  AlertTitle,
  Fade,
  CircularProgress,
  IconButton,
  Tooltip,
  Divider,
  LinearProgress,
  Stack,
  useMediaQuery
} from '@mui/material';
import {
  PersonAdd,
  School,
  Phone,
  Language,
  Class,
  AccountCircle,
  PlayArrow,
  Refresh,
  CheckCircle,
  Info,
  EmojiEvents,
  TrendingUp,
  LocationCity
} from '@mui/icons-material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { indianStates, getDistricts } from '../data/statesAndDistricts';

const theme = createTheme({
  palette: {
    primary: {
      main: '#2563eb',
      light: '#60a5fa',
      dark: '#1e40af',
    },
    secondary: {
      main: '#8b5cf6',
      light: '#a78bfa',
      dark: '#6d28d9',
    },
    success: {
      main: '#10b981',
      light: '#34d399',
      dark: '#059669',
    },
    warning: {
      main: '#f59e0b',
    },
    background: {
      default: '#f8fafc',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 800,
      letterSpacing: '-0.02em',
    },
    h6: {
      fontWeight: 700,
      letterSpacing: '-0.01em',
    },
    button: {
      fontWeight: 600,
      letterSpacing: '0.02em',
    },
  },
  shape: {
    borderRadius: 16,
  },
  shadows: [
    'none',
    '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  ],
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          textTransform: 'none',
          fontWeight: 600,
          padding: '12px 28px',
          transition: 'all 0.3s ease',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 14,
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'translateY(-2px)',
            },
            '&.Mui-focused': {
              transform: 'translateY(-2px)',
              boxShadow: '0 8px 16px rgba(37, 99, 235, 0.15)',
            },
          },
        },
      },
    },
  },
});

const LANGUAGES = [
  { value: 'English', label: 'English', flag: '🇬🇧' },
  { value: 'Hindi', label: 'हिंदी (Hindi)', flag: '🇮🇳' },
  { value: 'Tamil', label: 'தமிழ் (Tamil)', flag: '🇮🇳' },
  { value: 'Telugu', label: 'తెలుగు (Telugu)', flag: '🇮🇳' },
  { value: 'Kannada', label: 'ಕನ್ನಡ (Kannada)', flag: '🇮🇳' },
  { value: 'Marathi', label: 'मराठी (Marathi)', flag: '🇮🇳' },
];

export default function Signup() {
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [form, setForm] = useState({
    name: '',
    phone: '',
    school: '',
    className: '',
    language: 'English',
    state: '',
    district: ''
  });
  const [loading, setLoading] = useState(false);
  const [existingUser, setExistingUser] = useState(null);
  const [message, setMessage] = useState('');
  const [showExistingUserInfo, setShowExistingUserInfo] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  const validateForm = () => {
    const errors = {};

    if (!form.name.trim()) {
      errors.name = 'Name is required';
    } else if (form.name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters';
    }

    if (!form.phone.trim()) {
      errors.phone = 'Phone number is required';
    } else if (!/^\d{10}$/.test(form.phone.trim())) {
      errors.phone = 'Please enter a valid 10-digit phone number';
    }

    if (!form.language) {
      errors.language = 'Please select a language';
    }

    if (!form.state) {
      errors.state = 'Please select a state';
    }

    if (!form.district) {
      errors.district = 'Please select a district';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const checkExistingUser = async (phone) => {
    if (phone.length !== 10) return;

    try {
      const response = await fetch('http://localhost:5000/api/users/check-existing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone })
      });

      if (response.ok) {
        const data = await response.json();

        if (data.exists) {
          setExistingUser(data.user);
          setShowExistingUserInfo(true);
          setMessage(data.message);

          setForm(prev => ({
            ...prev,
            name: data.user.name,
            school: data.user.school || '',
            className: data.user.class || '',
            language: data.user.language
          }));
        } else {
          setExistingUser(null);
          setShowExistingUserInfo(false);
          setMessage('');
        }
      }
    } catch (error) {
      console.error('Error checking existing user:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));

    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }

    if (name === 'phone') {
      const cleanPhone = value.replace(/\D/g, '').slice(0, 10);
      setForm(prev => ({ ...prev, phone: cleanPhone }));

      if (cleanPhone.length === 10) {
        checkExistingUser(cleanPhone);
      } else if (existingUser) {
        setExistingUser(null);
        setShowExistingUserInfo(false);
        setMessage('');
      }
    }
  };

  const resetForm = () => {
    setForm({
      name: '',
      phone: '',
      school: '',
      className: '',
      language: 'English',
      state: '',
      district: ''
    });
    setExistingUser(null);
    setShowExistingUserInfo(false);
    setMessage('');
    setFormErrors({});
  };

  const start = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const dataToStore = {
        ...form,
        isExistingUser: !!existingUser,
        attemptNumber: existingUser ? (existingUser.totalAttempts + 1) : 1,
        timestamp: new Date().getTime()
      };

      sessionStorage.setItem('userSignup', JSON.stringify(dataToStore));

      await new Promise(resolve => setTimeout(resolve, 1000));

      navigate('/questions');
    } catch (error) {
      console.error('Error starting quiz:', error);
      setMessage('Error starting quiz. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const selectedLanguage = LANGUAGES.find(lang => lang.value === form.language);

  return (
    <ThemeProvider theme={theme}>
      <Box
        sx={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #ffffffff 0%, #e2e2e2ff 100%)',
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'radial-gradient(circle at 20% 50%, rgba(120, 119, 198, 0.3), transparent 50%), radial-gradient(circle at 80% 80%, rgba(255, 122, 151, 0.3), transparent 50%)',
            animation: 'gradient 15s ease infinite',
          },
          '@keyframes gradient': {
            '0%, 100%': { opacity: 1 },
            '50%': { opacity: 0.8 },
          },
          display: 'flex',
          alignItems: 'center',
          py: { xs: 2, sm: 4 },
          px: { xs: 2, sm: 3 }
        }}
      >
        <Container maxWidth="md" sx={{ position: 'relative', zIndex: 1 }}>
          <Fade in={true} timeout={1000}>
            <Paper
              elevation={0}
              sx={{
                borderRadius: 5,
                overflow: 'hidden',
                background: 'rgba(255, 255, 255, 0.98)',
                backdropFilter: 'blur(40px)',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.3), 0 0 80px rgba(102, 126, 234, 0.4)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
              }}
            >
              {/* Animated Header */}
              <Box
                sx={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  p: { xs: 3, sm: 5 },
                  textAlign: 'center',
                  position: 'relative',
                  overflow: 'hidden',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: '-50%',
                    left: '-50%',
                    width: '200%',
                    height: '200%',
                    background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
                    animation: 'pulse 4s ease-in-out infinite',
                  },
                  '@keyframes pulse': {
                    '0%, 100%': { transform: 'scale(1)', opacity: 0.5 },
                    '50%': { transform: 'scale(1.1)', opacity: 0.8 },
                  }
                }}
              >
                <Avatar
                  sx={{
                    width: { xs: 80, sm: 100 },
                    height: { xs: 80, sm: 100 },
                    mx: 'auto',
                    mb: 2,
                    bgcolor: 'rgba(255, 255, 255, 0.15)',
                    border: '4px solid rgba(255, 255, 255, 0.2)',
                    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
                    transition: 'transform 0.3s ease',
                    '&:hover': {
                      transform: 'scale(1.1) rotate(5deg)',
                    }
                  }}
                >
                  <PersonAdd sx={{ fontSize: { xs: 40, sm: 50 } }} />
                </Avatar>
                <Typography
                  variant="h4"
                  gutterBottom
                  sx={{
                    fontSize: { xs: '1.75rem', sm: '2.125rem' },
                    textShadow: '0 2px 10px rgba(0, 0, 0, 0.2)'
                  }}
                >
                  Online Assessment Portal
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    opacity: 0.95,
                    fontSize: { xs: '0.9rem', sm: '1rem' },
                    maxWidth: '600px',
                    mx: 'auto'
                  }}
                >
                  Begin your learning journey with personalized assessments
                </Typography>
              </Box>

              <CardContent sx={{ p: { xs: 3, sm: 5 } }}>
                {/* Existing User Welcome Card */}
                {showExistingUserInfo && existingUser && (
                  <Fade in={true}>
                    <Card
                      sx={{
                        mb: 4,
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        color: 'white',
                        borderRadius: 3,
                        boxShadow: '0 10px 30px rgba(16, 185, 129, 0.3)',
                        border: 'none',
                      }}
                    >
                      <CardContent sx={{ p: 3 }}>
                        <Stack spacing={2}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Avatar sx={{ bgcolor: 'rgba(255, 255, 255, 0.2)', width: 56, height: 56 }}>
                              <CheckCircle sx={{ fontSize: 32 }} />
                            </Avatar>
                            <Box>
                              <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
                                Welcome Back, {existingUser.name}!
                              </Typography>
                              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                                Great to see you again
                              </Typography>
                            </Box>
                          </Box>

                          <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.2)' }} />

                          <Grid container spacing={2}>
                            <Grid item xs={6}>
                              <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'rgba(255, 255, 255, 0.1)', borderRadius: 2 }}>
                                <EmojiEvents sx={{ fontSize: 32, mb: 1 }} />
                                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                                  {existingUser.totalAttempts}
                                </Typography>
                                <Typography variant="caption">Previous Attempts</Typography>
                              </Box>
                            </Grid>
                            <Grid item xs={6}>
                              <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'rgba(255, 255, 255, 0.1)', borderRadius: 2 }}>
                                <TrendingUp sx={{ fontSize: 32, mb: 1 }} />
                                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                                  #{existingUser.totalAttempts + 1}
                                </Typography>
                                <Typography variant="caption">Next Attempt</Typography>
                              </Box>
                            </Grid>
                          </Grid>
                        </Stack>
                      </CardContent>
                    </Card>
                  </Fade>
                )}

                {message && !showExistingUserInfo && (
                  <Alert
                    severity="info"
                    icon={<Info />}
                    sx={{
                      mb: 3,
                      borderRadius: 3,
                      border: '1px solid rgba(37, 99, 235, 0.2)',
                      boxShadow: '0 4px 12px rgba(37, 99, 235, 0.1)'
                    }}
                  >
                    {message}
                  </Alert>
                )}

                <form onSubmit={start}>
                  <Grid container spacing={2}>
                    {/* Row 1: Name & Phone */}
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        name="name"
                        label="Full Name"
                        value={form.name}
                        onChange={handleChange}
                        error={!!formErrors.name}
                        helperText={formErrors.name}
                         sx={{ width: "250px" }}
                        required
                        InputProps={{
                          startAdornment: (
                            <AccountCircle sx={{ color: 'primary.main', mr: 1, fontSize: 28 }} />
                          ),
                        }}
                      />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        name="phone"
                        label="Phone Number"
                        value={form.phone}
                        onChange={handleChange}
                        error={!!formErrors.phone}
                        helperText={formErrors.phone || `${form.phone.length}/10 digits`}
                         sx={{ width: "250px" }}
                        required
                        type="tel"
                        InputProps={{
                          startAdornment: (
                            <Phone sx={{ color: 'primary.main', mr: 1, fontSize: 28 }} />
                          ),
                        }}
                      />
                    </Grid>

                    {/* Row 2: State & District */}
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        select
                        name="state"
                        label="State"
                        value={form.state}
                        onChange={handleChange}
                        error={!!formErrors.state}
                        helperText={formErrors.state}
                         sx={{ width: "250px" }}
                        required
                        InputProps={{
                          startAdornment: (
                            <School sx={{ color: 'primary.main', mr: 1, fontSize: 28 }} />
                          ),
                        }}
                      >
                        {indianStates.map((state) => (
                          <MenuItem key={state.state} value={state.state}>
                            {state.state}
                          </MenuItem>
                        ))}
                      </TextField>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        select
                        name="district"
                        label="District"
                        value={form.district}
                        onChange={handleChange}
                        error={!!formErrors.district}
                        helperText={formErrors.district}
                         sx={{ width: "250px" }}
                        required
                        disabled={!form.state}
                        InputProps={{
                          startAdornment: (
                            <LocationCity sx={{ color: 'primary.main', mr: 1, fontSize: 28 }} />
                          ),
                        }}
                      >
                        {form.state &&
                          getDistricts(form.state).map((district) => (
                            <MenuItem key={district} value={district}>
                              {district}
                            </MenuItem>
                          ))}
                      </TextField>
                    </Grid>

                    {/* Row 3: School, Class, Language (3 columns) */}
                    <Grid item xs={12} sm={4}>
                      <TextField
                        fullWidth
                        name="school"
                        label="School Name"
                        value={form.school}
                        onChange={handleChange}
                         sx={{ width: "250px" }}
                        InputProps={{
                          startAdornment: (
                            <School sx={{ color: 'action.active', mr: 1 }} />
                          ),
                        }}
                        helperText="Optional"
                      />
                    </Grid>

                    <Grid item xs={12} sm={4}>
                      <TextField
                        fullWidth
                        name="className"
                        label="Class/Grade"
                        value={form.className}
                        onChange={handleChange}
                         sx={{ width: "250px" }}
                        InputProps={{
                          startAdornment: (
                            <Class sx={{ color: 'action.active', mr: 1 }} />
                          ),
                        }}
                        helperText="Optional"
                      />
                    </Grid>

                    <Grid item xs={12} sm={4}>
                      <TextField
                        fullWidth
                        select
                        name="language"
                        label="Preferred Language"
                        value={form.language}
                        onChange={handleChange}
                        error={!!formErrors.language}
                        helperText={formErrors.language}
                        required
                        InputProps={{
                          startAdornment: (
                            <Language sx={{ color: 'primary.main', mr: 1, fontSize: 28 }} />
                          ),
                        }}
                      >
                        {LANGUAGES.map((lang) => (
                          <MenuItem key={lang.value} value={lang.value}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                              <Typography sx={{ fontSize: '1.5rem' }}>{lang.flag}</Typography>
                              <Typography>{lang.label}</Typography>
                            </Box>
                          </MenuItem>
                        ))}
                      </TextField>
                    </Grid>

                    {/* Quiz Language Chip */}
                    {selectedLanguage && (
                      <Grid item xs={12}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Chip
                            label={`Quiz Language: ${selectedLanguage.flag} ${selectedLanguage.label}`}
                            color="primary"
                            sx={{
                              py: 2.5,
                              px: 1,
                              fontSize: '0.95rem',
                              fontWeight: 600,
                              boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)',
                            }}
                          />
                        </Box>
                      </Grid>
                    )}
                  </Grid>

                  <Divider sx={{ my: 4 }} />

                  {/* Action Buttons */}
                  <Stack direction="row" spacing={2}>
                    <Tooltip title="Reset form">
                      <IconButton
                        onClick={resetForm}
                        disabled={loading}
                        sx={{
                          bgcolor: 'grey.100',
                          width: 56,
                          height: 56,
                          '&:hover': {
                            bgcolor: 'grey.200',
                            transform: 'rotate(180deg)',
                          },
                          transition: 'all 0.3s ease',
                        }}
                      >
                        <Refresh />
                      </IconButton>
                    </Tooltip>

                    <Button
                      type="submit"
                      variant="contained"
                      size="large"
                      fullWidth
                      disabled={loading}
                      startIcon={
                        loading ? <CircularProgress size={20} color="inherit" /> : <PlayArrow />
                      }
                      sx={{
                        py: 2,
                        fontSize: '1.1rem',
                        fontWeight: 700,
                        background: existingUser
                          ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
                          : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        boxShadow: existingUser
                          ? '0 10px 30px rgba(245, 158, 11, 0.4)'
                          : '0 10px 30px rgba(16, 185, 129, 0.4)',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: existingUser
                            ? '0 15px 40px rgba(245, 158, 11, 0.5)'
                            : '0 15px 40px rgba(16, 185, 129, 0.5)',
                        },
                        transition: 'all 0.3s ease',
                      }}
                    >
                      {loading
                        ? 'Preparing Quiz...'
                        : existingUser
                          ? `Continue - Attempt #${existingUser.totalAttempts + 1}`
                          : 'Start Your First Quiz'}
                    </Button>
                  </Stack>
                </form>


                {loading && (
                  <Box sx={{ mt: 3 }}>
                    <LinearProgress
                      sx={{
                        borderRadius: 2,
                        height: 6,
                        bgcolor: 'grey.200',
                        '& .MuiLinearProgress-bar': {
                          background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
                        }
                      }}
                    />
                    <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 2 }}>
                      Setting up your personalized quiz experience...
                    </Typography>
                  </Box>
                )}

                {/* Info Footer */}
                <Card
                  sx={{
                    mt: 4,
                    p: 3,
                    background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%)',
                    borderRadius: 3,
                    border: '1px solid rgba(102, 126, 234, 0.1)',
                  }}
                >
                  <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', lineHeight: 1.8 }}>
                    <strong>Note:</strong> You can take this quiz multiple times. Each attempt is saved separately and can be reviewed later.
                    {existingUser && (
                      <Box component="span" sx={{ display: 'block', mt: 1 }}>
                        Your previous {existingUser.totalAttempts} attempt{existingUser.totalAttempts > 1 ? 's' : ''} can be viewed in the admin dashboard.
                      </Box>
                    )}
                  </Typography>
                </Card>
              </CardContent>
            </Paper>
          </Fade>
        </Container>
      </Box>
    </ThemeProvider>
  );
}