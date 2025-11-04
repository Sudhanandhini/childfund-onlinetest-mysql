import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  Card,
  CardContent,
  Avatar,
  Chip,
  Grid,
  Divider,
  Fade,
  Slide,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  CheckCircle,
  Celebration,
  RestartAlt,
  Dashboard,
  Home,
  Share,
  Timer,
  Person,
  Language,
  School,
  EmojiEvents,
  Verified,
  TrendingUp
} from '@mui/icons-material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { keyframes } from '@mui/system';

// Animation keyframes
const celebrate = keyframes`
  0% { 
    transform: scale(0.8) rotate(0deg); 
    opacity: 0.8; 
  }
  50% { 
    transform: scale(1.2) rotate(180deg); 
    opacity: 1; 
  }
  100% { 
    transform: scale(1) rotate(360deg); 
    opacity: 0.9; 
  }
`;

const bounce = keyframes`
  0%, 20%, 60%, 100% { 
    transform: translateY(0); 
  }
  40% { 
    transform: translateY(-20px); 
  }
  80% { 
    transform: translateY(-10px); 
  }
`;

const float = keyframes`
  0% { 
    transform: translateY(0px); 
  }
  50% { 
    transform: translateY(-20px); 
  }
  100% { 
    transform: translateY(0px); 
  }
`;

const confettiFall = keyframes`
  0% { 
    transform: translateY(-100px) rotate(0deg); 
    opacity: 1; 
  }
  100% { 
    transform: translateY(100vh) rotate(360deg); 
    opacity: 0; 
  }
`;

// Custom theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#4caf50',
      light: '#81c784',
      dark: '#388e3c',
    },
    secondary: {
      main: '#ff9800',
      light: '#ffb74d',
      dark: '#f57c00',
    },
    success: {
      main: '#4caf50',
      light: '#c8e6c9',
      dark: '#2e7d32',
    },
    info: {
      main: '#2196f3',
      light: '#bbdefb',
      dark: '#1976d2',
    },
    warning: {
      main: '#ff9800',
    },
    background: {
      default: '#f5f7fa',
    },
  },
  typography: {
    h3: { 
      fontWeight: 700 
    },
    h4: { 
      fontWeight: 700 
    },
    h5: { 
      fontWeight: 600 
    },
    h6: { 
      fontWeight: 600 
    },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 20,
          boxShadow: '0 8px 32px rgba(76, 175, 80, 0.2)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          textTransform: 'none',
          fontWeight: 600,
          padding: '12px 24px',
        },
      },
    },
  },
});

export default function ThankYou() {
  const navigate = useNavigate();
  const location = useLocation();
  const [showConfetti, setShowConfetti] = useState(true);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [animationStep, setAnimationStep] = useState(0);
  
  // Get data passed from Questions page
  const {
    id: userId,
    message,
    attemptNumber,
    isNewUser,
    completionTime,
    score
  } = location.state || {};

  // Normalize attempt number: sometimes it's passed as a string or undefined.
  const attemptNum = (() => {
    const n = Number(attemptNumber);
    if (!Number.isNaN(n) && n > 0) return n;
    // if isNewUser flag is provided and truthy, treat as first attempt
    if (isNewUser) return 1;
    return 0;
  })();
  
  // Get user data from sessionStorage
  const [userData] = useState(() => {
    const stored = sessionStorage.getItem('userSignup');
    return stored ? JSON.parse(stored) : {
      name: 'Quiz Taker',
      language: 'English',
      school: '',
    };
  });

  // Determine if this is first attempt (Pre-Assessment) or second attempt (Post-Assessment)
  // Use the normalized numeric attemptNum (handles string input and missing values)
  const isFirstAttempt = attemptNum === 1;
  const assessmentType = isFirstAttempt ? 'Pre-Assessment' : 'Post-Assessment';

  // Certificate state for second-attempt users
  const [certificate, setCertificate] = useState(null);
  const [certLoading, setCertLoading] = useState(false);
  const [certError, setCertError] = useState(null);

  // Prefer configured backend base URL; fall back to localhost backend when not set
  const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';

  // Try fetch existing certificate metadata if user is on 2nd attempt
  useEffect(() => {
    if (!userId) return;
    if (attemptNum >= 2) {
      (async () => {
        try {
          setCertLoading(true);
          const res = await fetch(`${API_BASE}/api/certificates/user/${userId}`);
          if (!res.ok) {
            const text = await res.text().catch(() => null);
            throw new Error(text || `Request failed with status ${res.status}`);
          }
          const json = await res.json();
          if (json && json.success) {
            setCertificate(json.certificate);
          } else {
            setCertificate(null);
          }
        } catch (err) {
          console.error('Error fetching certificate:', err);
          setCertError(err.message || String(err));
        } finally {
          setCertLoading(false);
        }
      })();
    }
  }, [userId, attemptNum]);

  // Download or generate-then-download certificate
  const handleDownloadCertificate = async () => {
    if (!userId) return alert('User ID not available to fetch certificate.');
    setCertError(null);
    setCertLoading(true);
    try {
      let cert = certificate;
      if (!cert) {
        // Try generate
        const genRes = await fetch(`${API_BASE}/api/certificates/generate/${userId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });

        if (!genRes.ok) {
          const text = await genRes.text().catch(() => null);
          const msg = text || `Failed to generate certificate (status ${genRes.status})`;
          setCertError(msg);
          alert(msg);
          return;
        }

        const genJson = await genRes.json().catch(() => null);
        if (genJson && genJson.success) {
          cert = genJson.certificate;
          setCertificate(cert);
        } else {
          const msg = (genJson && (genJson.message || genJson.error)) || 'Failed to generate certificate';
          setCertError(msg);
          alert(msg);
          return;
        }
      }

      // Open certificate file URL (server serves at /certificates)
      const filePath = cert.filePath || cert.file_path || cert.file;
      if (!filePath) {
        alert('Certificate file path not available');
        return;
      }

      const url = `${API_BASE}${filePath}`;
      window.open(url, '_blank');
    } catch (err) {
      console.error('Download certificate error:', err);
      setCertError(err.message || String(err));
      alert('Error downloading certificate: ' + (err.message || err));
    } finally {
      setCertLoading(false);
    }
  };

  // Messages based on attempt type
  const getAssessmentMessage = () => {
    if (isFirstAttempt) {
      return {
        title: "Thank you for completing the Knowledge, Attitude, and Practices (KAP) Pre-Assessment",
        message: `Your responses will help us understand current levels of awareness and preparedness on Online Sexual Exploitation and Abuse of Children (OSEAC). This information is important for improving the training experience and ensuring that every participant is equipped to create safer online environments for children.`,
        instruction: "Please proceed to the training session. We look forward to supporting your learning journey and enhancing your role in promoting digital safety."
      };
    } else {
      return {
        title: "Thank you for completing the Knowledge, Attitude, and Practices (KAP) Post-Assessment",
        message: `Your participation is valuable in evaluating the learning outcomes achieved through the OSEAC training. The insights gathered will help measure the impact of the program and strengthen child protection initiatives.`,
        instruction: "We appreciate your commitment to ensuring children's safety in digital spaces and encourage you to apply the knowledge and skills gained during this training within your school and community."
      };
    }
  };

  const assessmentData = getAssessmentMessage();

  useEffect(() => {
    // Animation sequence timing
    const timers = [
      setTimeout(() => setAnimationStep(1), 500),
      setTimeout(() => setAnimationStep(2), 1000),
      setTimeout(() => setAnimationStep(3), 1500),
      setTimeout(() => setShowConfetti(false), 5000),
    ];
    
    return () => timers.forEach(clearTimeout);
  }, []);

  const handleTakeAgain = () => {
    navigate('/');
  };

  const handleViewAdmin = () => {
    navigate('/admin');
  };

  const handleGoHome = () => {
    navigate('/');
  };

  const handleShare = async () => {
    const shareData = {
      title: 'Quiz Completed Successfully! 🎉',
      text: `I just completed the ${assessmentType} for OSEAC training! Check it out!`,
      url: window.location.origin,
    };

    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.log('Error sharing:', err);
          setShowShareDialog(true);
        }
      }
    } else {
      setShowShareDialog(true);
    }
  };

  const copyToClipboard = async () => {
    const text = `I just completed the ${assessmentType} for OSEAC training! Check it out at ${window.location.origin}`;
    
    try {
      await navigator.clipboard.writeText(text);
      setShowShareDialog(false);
      // You could add a toast notification here
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <Box
        sx={{
          minHeight: '100vh',
          background: 'linear-gradient(45deg, #4caf50 30%, #8bc34a 90%)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Animated Background Elements */}
        <Box
          sx={{
            position: 'absolute',
            top: '10%',
            left: '10%',
            width: 100,
            height: 100,
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '50%',
            animation: `${float} 6s ease-in-out infinite`,
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            top: '20%',
            right: '15%',
            width: 60,
            height: 60,
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '50%',
            animation: `${float} 4s ease-in-out infinite reverse`,
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            bottom: '20%',
            left: '20%',
            width: 80,
            height: 80,
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '50%',
            animation: `${float} 5s ease-in-out infinite`,
          }}
        />

        <Container maxWidth="md" sx={{ py: 4, position: 'relative', zIndex: 1 }}>
          {/* Main Success Card */}
          <Fade in={true} timeout={1000}>
            <Card
              sx={{
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                mb: 4,
              }}
            >
              <CardContent sx={{ p: 6, textAlign: 'center' }}>
                {/* Success Icon */}
                <Slide direction="down" in={animationStep >= 1} timeout={600}>
                  <Avatar
                    sx={{
                      width: 120,
                      height: 120,
                      mx: 'auto',
                      mb: 3,
                      bgcolor: isFirstAttempt ? 'info.main' : 'success.main',
                      animation: animationStep >= 1 ? `${celebrate} 2s ease-in-out` : 'none',
                    }}
                  >
                    <Celebration sx={{ fontSize: 60 }} />
                  </Avatar>
                </Slide>

                {/* Main Title */}
                <Fade in={animationStep >= 2} timeout={800}>
                  <Box>
                    <Typography
                      variant="h3"
                      gutterBottom
                      sx={{
                        background: 'linear-gradient(45deg, #4caf50 30%, #8bc34a 90%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                        mb: 2,
                      }}
                    >
                      🎉 {assessmentType} Completed!
                    </Typography>
                    <Typography variant="h5" color="text.secondary" gutterBottom>
                      {assessmentData.title}
                    </Typography>
                  </Box>
                </Fade>

                {/* Assessment Message */}
                <Fade in={animationStep >= 3} timeout={1000}>
                  <Box sx={{ mt: 3, mb: 3 }}>
                    <Paper
                      sx={{
                        p: 3,
                        background: 'linear-gradient(135deg, #e8f5e8 0%, #f1f8e9 100%)',
                        border: '2px solid #c8e6c9',
                        borderRadius: 3,
                      }}
                    >
                      <Typography
                        variant="body1"
                        color="text.primary"
                        paragraph
                        sx={{ textAlign: 'left', lineHeight: 1.6 }}
                      >
                        {assessmentData.message}
                      </Typography>
                      <Typography
                        variant="body1"
                        color="text.primary"
                        sx={{ textAlign: 'left', lineHeight: 1.6, fontWeight: 600 }}
                      >
                        {assessmentData.instruction}
                      </Typography>
                    </Paper>
                  </Box>
                </Fade>

                {/* Assessment Type Badge */}
                <Fade in={animationStep >= 3} timeout={1200}>
                  <Box sx={{ mt: 2, mb: 2 }}>
                    <Chip
                      icon={isFirstAttempt ? <TrendingUp /> : <EmojiEvents />}
                      label={`${assessmentType} - ${isFirstAttempt ? 'Before Training' : 'After Training'}`}
                      color={isFirstAttempt ? 'info' : 'success'}
                      variant="filled"
                      size="large"
                      sx={{ fontSize: '1rem', py: 2 }}
                    />
                  </Box>
                </Fade>

                {/* User Info Chips */}
                {userData && (
                  <Fade in={animationStep >= 3} timeout={1200}>
                    <Box sx={{ mt: 4, mb: 4 }}>
                      <Grid container spacing={2} justifyContent="center">
                        <Grid item>
                          <Chip
                            icon={<Person />}
                            label={userData.name}
                            color="primary"
                            variant="outlined"
                            size="medium"
                          />
                        </Grid>
                        {userData.school && (
                          <Grid item>
                            <Chip
                              icon={<School />}
                              label={userData.school}
                              color="secondary"
                              variant="outlined"
                              size="medium"
                            />
                          </Grid>
                        )}
                        <Grid item>
                          <Chip
                            icon={<Language />}
                            label={userData.language}
                            color="info"
                            variant="outlined"
                            size="medium"
                          />
                        </Grid>
                      </Grid>
                    </Box>
                  </Fade>
                )}
              </CardContent>
            </Card>
          </Fade>

          {/* Performance Stats */}
          {/* {(score !== undefined || completionTime) && (
            <Slide direction="up" in={animationStep >= 3} timeout={1200}>
              <Card sx={{ mb: 4 }}>
                <CardContent sx={{ p: 4 }}>
                  <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
                    📊 Your {assessmentType} Performance
                  </Typography>
                  <Grid container spacing={3}>
                    {score !== undefined && (
                      <Grid item xs={12} sm={6}>
                        <Box 
                          textAlign="center" 
                          sx={{ 
                            p: 4, 
                            bgcolor: 'success.light', 
                            borderRadius: 3,
                            border: '2px solid',
                            borderColor: 'success.main'
                          }}
                        >
                          <Typography variant="h2" color="success.dark" sx={{ fontWeight: 700 }}>
                            {score}
                          </Typography>
                          <Typography variant="h6" color="success.dark">
                            Score
                          </Typography>
                        </Box>
                      </Grid>
                    )}
                    {completionTime && (
                      <Grid item xs={12} sm={6}>
                        <Box 
                          textAlign="center" 
                          sx={{ 
                            p: 4, 
                            bgcolor: 'info.light', 
                            borderRadius: 3,
                            border: '2px solid',
                            borderColor: 'info.main'
                          }}
                        >
                          <Typography variant="h2" color="info.dark" sx={{ fontWeight: 700 }}>
                            {completionTime}
                          </Typography>
                          <Typography variant="h6" color="info.dark">
                            Minutes
                          </Typography>
                        </Box>
                      </Grid>
                    )}
                  </Grid>
                </CardContent>
              </Card>
            </Slide>
          )} */}

          {/* Action Buttons Card */}
          <Slide direction="up" in={animationStep >= 3} timeout={1400}>
            <Card>
              <CardContent sx={{ p: 4 }}>
                <Typography variant="h6" gutterBottom textAlign="center" sx={{ mb: 3 }}>
                  What would you like to do next?
                </Typography>
                
                <Grid container spacing={3}>
                  {isFirstAttempt ? (
                    <Grid item xs={12} sm={6}>
                      {/* <Button
                        fullWidth
                        variant="contained"
                        size="large"
                        startIcon={<School />}
                        onClick={handleGoHome}
                        color="primary"
                        sx={{ py: 2 }}
                      >
                        
                      </Button> */}
                    </Grid>
                  ) : (
                    <Grid item xs={12} sm={6}>
                      {/* <Button
                        fullWidth
                        variant="contained"
                        size="large"
                        startIcon={<RestartAlt />}
                        onClick={handleTakeAgain}
                        color="primary"
                        sx={{ py: 2 }}
                      >
                        
                      </Button> */}
                    </Grid>
                  )}

                  {/* Download Certificate button for users who completed at least 2 attempts */}
                  {attemptNum >= 2 && (
                    <Grid item xs={12} sm={6} md={3}>
                      <Button
                        fullWidth
                        variant="contained"
                        size="large"
                        startIcon={<Verified />}
                        onClick={handleDownloadCertificate}
                        color="success"
                        sx={{ py: 2 }}
                        disabled={certLoading}
                        style={{color:'white'}}
                      >
                        {certLoading ? 'Preparing...' : 'Download Certificate'}
                      </Button>
                    </Grid>
                  )}
                  
                  <Grid item xs={12} sm={6} md={3}>
                    {/* <Button
                      fullWidth
                      variant="contained"
                      size="large"
                      startIcon={<Dashboard />}
                      onClick={handleViewAdmin}
                      color="secondary"
                      sx={{ py: 2 }}
                    >
                      Admin Panel
                    </Button> */}
                  </Grid>
                  
                  <Grid item xs={12} sm={6} md={3}>
                    <Button
                      fullWidth
                      variant="outlined"
                      size="large"
                      startIcon={<Home />}
                      onClick={handleGoHome}
                      sx={{ py: 2 }}
                    >
                      Go Home
                    </Button>
                  </Grid>
                </Grid>

                <Divider sx={{ my: 4 }} />
                
                {/* Info Footer */}
                <Box textAlign="center">
                  <Typography variant="body1" color="text.secondary" paragraph sx={{ mb: 2 }}>
                    ✅ <strong>Your {assessmentType.toLowerCase()} responses have been saved successfully</strong><br/>
                    📊 Results are available in the admin dashboard<br/>
                    {isFirstAttempt ? (
                      "🎯 Complete the training to take the post-assessment"
                    ) : (
                      "🏆 You've completed both pre and post assessments!"
                    )}
                  </Typography>
                  
                  <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
                    {isFirstAttempt ? (
                      "📚 Proceed with the training to enhance your knowledge about OSEAC"
                    ) : (
                      "💪 Thank you for your commitment to child safety in digital spaces"
                    )}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Slide>
        </Container>

        {/* Share Dialog */}
        <Dialog
          open={showShareDialog}
          onClose={() => setShowShareDialog(false)}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: { borderRadius: 3 }
          }}
        >
          <DialogTitle>
            <Box display="flex" alignItems="center" gap={1}>
              <Share color="primary" />
              Share Your Achievement
            </Box>
          </DialogTitle>
          <DialogContent>
            <Typography paragraph>
              Congratulations on completing the {assessmentType}! Share your achievement with others:
            </Typography>
            <Paper 
              sx={{ 
                p: 2, 
                bgcolor: 'grey.100', 
                borderRadius: 2, 
                mb: 2,
                border: '1px solid',
                borderColor: 'grey.300'
              }}
            >
              <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
                I just completed the {assessmentType} for OSEAC training! 
                Check it out at {window.location.origin}
              </Typography>
            </Paper>
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button 
              onClick={() => setShowShareDialog(false)}
              variant="outlined"
            >
              Close
            </Button>
            <Button
              onClick={copyToClipboard}
              variant="contained"
              startIcon={<Share />}
            >
              Copy Link
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </ThemeProvider>
  );
}