import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';

// Main App Component with Authentication
const AdminApp = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const authStatus = localStorage.getItem('adminAuthenticated');
    if (authStatus === 'true') {
      setIsAuthenticated(true);
    }
    setIsLoading(false);
  }, []);

  const handleLogin = (success) => {
    if (success) {
      setIsAuthenticated(true);
      localStorage.setItem('adminAuthenticated', 'true');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('adminAuthenticated');
  };

  if (isLoading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <h2>Loading...</h2>
      </div>
    );
  }

  return (
    <div>
      {!isAuthenticated ? (
        <AdminLogin onLogin={handleLogin} />
      ) : (
        <AdminDashboard onLogout={handleLogout} />
      )}
    </div>
  );
};

// Admin Login Component
const AdminLogin = ({ onLogin }) => {
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const ADMIN_CREDENTIALS = {
    username: 'admin',
    password: 'admin123'
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCredentials(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    setTimeout(() => {
      if (credentials.username === ADMIN_CREDENTIALS.username && 
          credentials.password === ADMIN_CREDENTIALS.password) {
        onLogin(true);
      } else {
        setError('Invalid username or password');
      }
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div style={styles.loginContainer}>
      <div style={styles.loginBox}>
        <div style={styles.loginHeader}>
          <h1 style={styles.loginTitle}>Admin Login</h1>
          <p style={styles.loginSubtitle}>Enter your credentials to access the admin dashboard</p>
        </div>

        <form onSubmit={handleSubmit} style={styles.loginForm}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Username</label>
            <input
              type="text"
              name="username"
              value={credentials.username}
              onChange={handleInputChange}
              style={styles.input}
              placeholder="Enter username"
              required
              disabled={isLoading}
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              name="password"
              value={credentials.password}
              onChange={handleInputChange}
              style={styles.input}
              placeholder="Enter password"
              required
              disabled={isLoading}
            />
          </div>

          {error && (
            <div style={styles.errorMessage}>
              {error}
            </div>
          )}

          <button
            type="submit"
            style={{
              ...styles.loginButton,
              backgroundColor: isLoading ? '#bdc3c7' : '#3498db',
              cursor: isLoading ? 'not-allowed' : 'pointer'
            }}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <div style={styles.buttonSpinner}></div>
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <div style={styles.demoCredentials}>
          <h4>Demo Credentials:</h4>
          <p><strong>Username:</strong> admin</p>
          <p><strong>Password:</strong> admin123</p>
        </div>
      </div>
    </div>
  );
};

// Admin Dashboard Component
const AdminDashboard = ({ onLogout }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('all');
  const [viewMode, setViewMode] = useState('users');
  const [exportingUserId, setExportingUserId] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/admin/users');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Fetched users:', data);
      
      const usersData = data.users || data || [];
      setUsers(Array.isArray(usersData) ? usersData : []);
      setError('');
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(`Failed to fetch users: ${err.message}`);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const getAllSubmissions = () => {
    const submissions = [];
    users.forEach(user => {
      if (user.submissions && user.submissions.length > 0) {
        user.submissions.forEach((submission, index) => {
          submissions.push({
            ...submission,
            user: user,
            submissionNumber: index + 1,
            totalUserSubmissions: user.submissions.length
          });
        });
      } else if (user.answers && user.answers.length > 0) {
        submissions.push({
          answers: user.answers,
          submittedAt: user.createdAt,
          user: user,
          submissionNumber: 1,
          totalUserSubmissions: 1,
          isLegacy: true
        });
      }
    });
    return submissions.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
  };

  const getFilteredData = () => {
    if (viewMode === 'submissions') {
      const allSubmissions = getAllSubmissions();
      return allSubmissions.filter(submission => {
        const user = submission.user;
        
        const searchLower = searchTerm.toLowerCase().trim();
        const matchesSearch = !searchTerm || 
          (user.name && user.name.toLowerCase().includes(searchLower)) ||
          (user.phone && String(user.phone).includes(searchTerm.trim())) ||
          (user.school && user.school.toLowerCase().includes(searchLower)) ||
          (user.class && user.class.toLowerCase().includes(searchLower));
        
        const matchesLanguage = selectedLanguage === 'all' || 
          (user.language && user.language.toLowerCase() === selectedLanguage.toLowerCase());
        
        return matchesSearch && matchesLanguage;
      });
    } else {
      return users.filter(user => {
        const searchLower = searchTerm.toLowerCase().trim();
        const matchesSearch = !searchTerm || 
          (user.name && user.name.toLowerCase().includes(searchLower)) ||
          (user.phone && String(user.phone).includes(searchTerm.trim())) ||
          (user.school && user.school.toLowerCase().includes(searchLower)) ||
          (user.class && user.class.toLowerCase().includes(searchLower));
        
        const matchesLanguage = selectedLanguage === 'all' || 
          (user.language && user.language.toLowerCase() === selectedLanguage.toLowerCase());
        
        return matchesSearch && matchesLanguage;
      });
    }
  };

  // Export individual user data as Excel with Questions and Answers clearly visible
  // const exportUserData = async (user) => {
  //   setExportingUserId(user._id || user.id);
    
  //   try {
  //     const workbook = XLSX.utils.book_new();

  //     // Sheet 1: User Information
  //     const userInfoData = [
  //       ['USER INFORMATION'],
  //       [''],
  //       ['Field', 'Value'],
  //       ['Name', user.name],
  //       ['Phone', user.phone],
  //       ['School', user.school || 'N/A'],
  //       ['Class', user.class || 'N/A'],
  //       ['Language', user.language],
  //       ['Total Attempts', user.totalAttempts || user.submissions?.length || 1],
  //       ['First Submission', new Date(user.createdAt).toLocaleString()],
  //       ['Latest Submission', new Date(user.lastSubmission || user.updatedAt).toLocaleString()]
  //     ];
  //     const userInfoSheet = XLSX.utils.aoa_to_sheet(userInfoData);
  //     XLSX.utils.book_append_sheet(workbook, userInfoSheet, 'User Info');

  //     // Create separate sheets for each submission with Q&A
  //     if (user.submissions && user.submissions.length > 0) {
  //       user.submissions.forEach((submission, index) => {
  //         const qnaData = [
  //           [`ATTEMPT #${index + 1} - Questions and Answers`],
  //           [''],
  //           ['User:', user.name],
  //           ['Phone:', user.phone],
  //           ['Submitted At:', new Date(submission.submittedAt).toLocaleString()],
  //           ['Session ID:', submission.sessionId || 'N/A'],
  //           ['Score:', submission.score || 0],
  //           ['Completion Time:', submission.completionTime ? `${submission.completionTime} minutes` : 'N/A'],
  //           [''],
  //           ['Question ID', 'Question', 'Answer']
  //         ];

  //         if (submission.answers && submission.answers.length > 0) {
  //           submission.answers.forEach(answer => {
  //             qnaData.push([
  //               answer.questionId || 'N/A',
  //               answer.question || 'Question not available',
  //               answer.answer || 'No answer provided'
  //             ]);
  //           });
  //         } else {
  //           qnaData.push(['', 'No answers recorded', '']);
  //         }

  //         const qnaSheet = XLSX.utils.aoa_to_sheet(qnaData);
          
  //         // Set column widths for better readability
  //         qnaSheet['!cols'] = [
  //           { wch: 12 },  // Question ID column
  //           { wch: 60 },  // Question column (wider)
  //           { wch: 40 }   // Answer column
  //         ];

  //         const sheetName = `Attempt ${index + 1}`;
  //         XLSX.utils.book_append_sheet(workbook, qnaSheet, sheetName);
  //       });
  //     } else if (user.answers && user.answers.length > 0) {
  //       const qnaData = [
  //         ['Questions and Answers'],
  //         [''],
  //         ['User:', user.name],
  //         ['Phone:', user.phone],
  //         ['Submitted At:', new Date(user.createdAt).toLocaleString()],
  //         [''],
  //         ['Question ID', 'Question', 'Answer']
  //       ];

  //       user.answers.forEach(answer => {
  //         qnaData.push([
  //           answer.questionId || 'N/A',
  //           answer.question || 'Question not available',
  //           answer.answer || 'No answer provided'
  //         ]);
  //       });

  //       const qnaSheet = XLSX.utils.aoa_to_sheet(qnaData);
  //       qnaSheet['!cols'] = [
  //         { wch: 12 },
  //         { wch: 60 },
  //         { wch: 40 }
  //       ];
  //       XLSX.utils.book_append_sheet(workbook, qnaSheet, 'Answers');
  //     }

  //     // Download Excel file
  //     const fileName = `${user.name.replace(/\s+/g, '_')}_${user.phone}_QnA_${new Date().toISOString().split('T')[0]}.xlsx`;
  //     XLSX.writeFile(workbook, fileName);

  //   } catch (error) {
  //     console.error('Error exporting user data:', error);
  //     alert('Error exporting user data. Please try again.');
  //   } finally {
  //     setExportingUserId(null);
  //   }
  // };
  const exportUserData = async (user) => {
    setExportingUserId(user._id || user.id);
    
    try {
      const workbook = XLSX.utils.book_new();

      // Sheet 1: User Information
      const userInfoData = [
        ['USER INFORMATION'],
        [''],
        ['Field', 'Value'],
        ['Name', user.name],
        ['Phone', user.phone],
        ['School', user.school || 'N/A'],
        ['Class', user.class || 'N/A'],
        ['Language', user.language],
        ['Total Attempts', user.submissions?.length || 1],
        ['First Submission', new Date(user.createdAt).toLocaleString()],
        ['Latest Submission', new Date(user.updatedAt).toLocaleString()]
      ];
      
      const userInfoSheet = XLSX.utils.aoa_to_sheet(userInfoData);
      XLSX.utils.book_append_sheet(workbook, userInfoSheet, 'User Info');

    // Create separate sheets for each submission with Q&A
    if (user.submissions && user.submissions.length > 0) {
      user.submissions.forEach((submission, index) => {
        const qnaData = [
          [`ATTEMPT #${index + 1} - Questions and Answers`],
          [''],
          ['User:', user.name],
          ['Phone:', user.phone],
          ['Submitted At:', new Date(submission.submittedAt).toLocaleString()],
          ['Score:', submission.score || 0],
          [''],
          ['Question ID', 'Question', 'Answer', 'Is Correct']
        ];

        if (submission.answers && submission.answers.length > 0) {
          submission.answers.forEach(answer => {
            qnaData.push([
              answer.questionId || 'N/A',
              answer.question || 'Question not available',
              answer.answer || 'No answer provided',
              answer.isCorrect ? 'Yes' : 'No'
            ]);
          });
        } else {
          qnaData.push(['', 'No answers recorded', '', '']);
        }

        const qnaSheet = XLSX.utils.aoa_to_sheet(qnaData);
        
        // Set column widths for better readability
        qnaSheet['!cols'] = [
          { wch: 12 },  // Question ID column
          { wch: 60 },  // Question column (wider)
          { wch: 40 },  // Answer column
          { wch: 10 }   // Is Correct column
        ];

        const sheetName = `Attempt ${index + 1}`;
        XLSX.utils.book_append_sheet(workbook, qnaSheet, sheetName);
      });
    } else if (user.answers && user.answers.length > 0) {
      // For legacy single submission data
      const qnaData = [
        ['Questions and Answers'],
        [''],
        ['User:', user.name],
        ['Phone:', user.phone],
        ['Submitted At:', new Date(user.createdAt).toLocaleString()],
        [''],
        ['Question ID', 'Question', 'Answer', 'Is Correct']
      ];

      user.answers.forEach(answer => {
        qnaData.push([
          answer.questionId || 'N/A',
          answer.question || 'Question not available',
          answer.answer || 'No answer provided',
          answer.isCorrect ? 'Yes' : 'No'
        ]);
      });

      const qnaSheet = XLSX.utils.aoa_to_sheet(qnaData);
      qnaSheet['!cols'] = [
        { wch: 12 },
        { wch: 60 },
        { wch: 40 },
        { wch: 10 }
      ];
      XLSX.utils.book_append_sheet(workbook, qnaSheet, 'Answers');
    } else {
      const noDataSheet = XLSX.utils.aoa_to_sheet([
        ['No Data Available'],
        [''],
        ['This user has no quiz submissions yet.']
      ]);
      XLSX.utils.book_append_sheet(workbook, noDataSheet, 'No Data');
    }

    // Download Excel file
    const fileName = `${user.name.replace(/\s+/g, '_')}_${user.phone}_QnA_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);

  } catch (error) {
    console.error('Error exporting user data:', error);
    alert('Error exporting user data. Please try again.');
  } finally {
    setExportingUserId(null);
  }
};

  // Export all users data as Excel with Questions and Answers
  // const exportAllData = () => {
  //   try {
  //     const workbook = XLSX.utils.book_new();

  //     if (viewMode === 'submissions') {
  //       // For each submission, create detailed Q&A sheet
  //       filteredData.forEach((submission, subIndex) => {
  //         const user = submission.user;
  //         const qnaData = [
  //           [`Submission #${subIndex + 1} - ${user.name}`],
  //           [''],
  //           ['User Information'],
  //           ['Name:', user.name],
  //           ['Phone:', user.phone],
  //           ['School:', user.school || 'N/A'],
  //           ['Class:', user.class || 'N/A'],
  //           ['Language:', user.language],
  //           ['Attempt Number:', `${submission.submissionNumber} of ${submission.totalUserSubmissions}`],
  //           ['Submitted At:', new Date(submission.submittedAt).toLocaleString()],
  //           [''],
  //           ['Question ID', 'Question', 'Answer']
  //         ];

  //         if (submission.answers && submission.answers.length > 0) {
  //           submission.answers.forEach(answer => {
  //             qnaData.push([
  //               answer.questionId || 'N/A',
  //               answer.question || 'Question not available',
  //               answer.answer || 'No answer provided'
  //             ]);
  //           });
  //         } else {
  //           qnaData.push(['', 'No answers recorded', '']);
  //         }

  //         const qnaSheet = XLSX.utils.aoa_to_sheet(qnaData);
  //         qnaSheet['!cols'] = [
  //           { wch: 12 },
  //           { wch: 60 },
  //           { wch: 40 }
  //         ];

  //         const sheetName = `${user.name.substring(0, 15)}_${subIndex + 1}`.replace(/[:\\\/\?\*\[\]]/g, '');
  //         XLSX.utils.book_append_sheet(workbook, qnaSheet, sheetName);
  //       });

  //       XLSX.writeFile(workbook, `All_Submissions_QnA_${new Date().toISOString().split('T')[0]}.xlsx`);

  //     } else {
  //       // Export all users with their Q&A
  //       filteredData.forEach((user, userIndex) => {
  //         if (user.submissions && user.submissions.length > 0) {
  //           user.submissions.forEach((submission, subIndex) => {
  //             const qnaData = [
  //               [`${user.name} - Attempt ${subIndex + 1}`],
  //               [''],
  //               ['User Information'],
  //               ['Name:', user.name],
  //               ['Phone:', user.phone],
  //               ['School:', user.school || 'N/A'],
  //               ['Class:', user.class || 'N/A'],
  //               ['Language:', user.language],
  //               ['Submitted At:', new Date(submission.submittedAt).toLocaleString()],
  //               ['Session ID:', submission.sessionId || 'N/A'],
  //               [''],
  //               ['Question ID', 'Question', 'Answer']
  //             ];

  //             if (submission.answers && submission.answers.length > 0) {
  //               submission.answers.forEach(answer => {
  //                 qnaData.push([
  //                   answer.questionId || 'N/A',
  //                   answer.question || 'Question not available',
  //                   answer.answer || 'No answer provided'
  //                 ]);
  //               });
  //             }

  //             const qnaSheet = XLSX.utils.aoa_to_sheet(qnaData);
  //             qnaSheet['!cols'] = [
  //               { wch: 12 },
  //               { wch: 60 },
  //               { wch: 40 }
  //             ];

  //             const sheetName = `${user.name.substring(0, 12)}_A${subIndex + 1}`.replace(/[:\\\/\?\*\[\]]/g, '');
  //             XLSX.utils.book_append_sheet(workbook, qnaSheet, sheetName);
  //           });
  //         } else if (user.answers && user.answers.length > 0) {
  //           const qnaData = [
  //             [`${user.name} - Answers`],
  //             [''],
  //             ['User Information'],
  //             ['Name:', user.name],
  //             ['Phone:', user.phone],
  //             ['School:', user.school || 'N/A'],
  //             ['Class:', user.class || 'N/A'],
  //             ['Language:', user.language],
  //             [''],
  //             ['Question ID', 'Question', 'Answer']
  //           ];

  //           user.answers.forEach(answer => {
  //             qnaData.push([
  //               answer.questionId || 'N/A',
  //               answer.question || 'Question not available',
  //               answer.answer || 'No answer provided'
  //             ]);
  //           });

  //           const qnaSheet = XLSX.utils.aoa_to_sheet(qnaData);
  //           qnaSheet['!cols'] = [
  //             { wch: 12 },
  //             { wch: 60 },
  //             { wch: 40 }
  //           ];

  //           const sheetName = `${user.name.substring(0, 20)}`.replace(/[:\\\/\?\*\[\]]/g, '');
  //           XLSX.utils.book_append_sheet(workbook, qnaSheet, sheetName);
  //         }
  //       });

  //       XLSX.writeFile(workbook, `All_Users_QnA_${new Date().toISOString().split('T')[0]}.xlsx`);
  //     }

  //   } catch (error) {
  //     console.error('Error exporting data:', error);
  //     alert('Error exporting data. Please try again.');
  //   }
  // };
const exportAllData = async () => {
  try {
    console.log('Starting export all data...');
    
    // Fetch complete data for all filtered users
    const usersToExport = viewMode === 'submissions' ? 
      filteredData.map(s => s.user) : 
      filteredData;
    
    // Remove duplicates by user ID
    const uniqueUsers = Array.from(
      new Map(usersToExport.map(u => [(u._id || u.id), u])).values()
    );
    
    console.log(`Fetching complete data for ${uniqueUsers.length} users`);
    
    // Fetch complete data for each user
    const completeUsersData = await Promise.all(
      uniqueUsers.map(async (user) => {
        const userId = user._id || user.id;
        try {
          const response = await fetch(`http://localhost:5000/api/admin/users/${userId}`);
          if (response.ok) {
            return await response.json();
          }
        } catch (err) {
          console.error(`Failed to fetch user ${userId}:`, err);
        }
        return user; // Fallback to original data if fetch fails
      })
    );
    
    console.log('Complete users data fetched:', completeUsersData.length);
    
    const workbook = XLSX.utils.book_new();
    const usedSheetNames = new Set(); // Track used sheet names to avoid duplicates

    if (viewMode === 'submissions') {
      // Export all submissions
      let globalSheetIndex = 1;
      
      completeUsersData.forEach((userData, userIdx) => {
        if (userData.submissions && userData.submissions.length > 0) {
          userData.submissions.forEach((submission, subIdx) => {
            const qnaData = [
              [`${userData.name} - Submission ${globalSheetIndex}`],
              [''],
              ['User Information'],
              ['Name:', userData.name],
              ['Phone:', userData.phone],
              ['School:', userData.school || 'N/A'],
              ['Class:', userData.class || 'N/A'],
              ['Language:', userData.language],
              ['Attempt:', `${subIdx + 1} of ${userData.submissions.length}`],
              ['Submitted At:', new Date(submission.submittedAt).toLocaleString()],
              [''],
              ['Question ID', 'Question', 'Answer']
            ];

            if (submission.answers && submission.answers.length > 0) {
              submission.answers.forEach(answer => {
                qnaData.push([
                  answer.questionId || 'N/A',
                  answer.question || 'Question not available',
                  answer.answer || 'No answer provided'
                ]);
              });
            } else {
              qnaData.push(['', 'No answers recorded', '']);
            }

            const qnaSheet = XLSX.utils.aoa_to_sheet(qnaData);
            qnaSheet['!cols'] = [{ wch: 12 }, { wch: 70 }, { wch: 40 }];

            // Create unique sheet name
            let baseSheetName = `${userData.name.substring(0, 10)}_${globalSheetIndex}`.replace(/[:\\\/\?\*\[\]]/g, '');
            let sheetName = baseSheetName;
            let counter = 1;
            
            // Ensure uniqueness
            while (usedSheetNames.has(sheetName)) {
              sheetName = `${baseSheetName}_${counter}`;
              counter++;
            }
            usedSheetNames.add(sheetName);

            XLSX.utils.book_append_sheet(workbook, qnaSheet, sheetName);
            globalSheetIndex++;
          });
        }
      });

      XLSX.writeFile(workbook, `All_Submissions_QnA_${new Date().toISOString().split('T')[0]}.xlsx`);

    } else {
      // Export all users
      let globalSheetIndex = 1;
      
      completeUsersData.forEach((userData, userIdx) => {
        if (userData.submissions && userData.submissions.length > 0) {
          userData.submissions.forEach((submission, subIdx) => {
            const qnaData = [
              [`${userData.name} - Attempt ${subIdx + 1}`],
              [''],
              ['User Information'],
              ['Name:', userData.name],
              ['Phone:', userData.phone],
              ['School:', userData.school || 'N/A'],
              ['Class:', userData.class || 'N/A'],
              ['Language:', userData.language],
              ['Submitted At:', new Date(submission.submittedAt).toLocaleString()],
              ['Session ID:', submission.sessionId || 'N/A'],
              [''],
              ['Question ID', 'Question', 'Answer']
            ];

            if (submission.answers && submission.answers.length > 0) {
              submission.answers.forEach(answer => {
                qnaData.push([
                  answer.questionId || 'N/A',
                  answer.question || 'Question not available',
                  answer.answer || 'No answer provided'
                ]);
              });
            } else {
              qnaData.push(['', 'No answers', '']);
            }

            const qnaSheet = XLSX.utils.aoa_to_sheet(qnaData);
            qnaSheet['!cols'] = [{ wch: 12 }, { wch: 70 }, { wch: 40 }];

            // Create unique sheet name using global index
            let baseSheetName = `U${userIdx + 1}_${userData.name.substring(0, 8)}_A${subIdx + 1}`.replace(/[:\\\/\?\*\[\]]/g, '');
            let sheetName = baseSheetName;
            let counter = 1;
            
            // Ensure uniqueness
            while (usedSheetNames.has(sheetName)) {
              sheetName = `${baseSheetName}_${counter}`;
              counter++;
            }
            usedSheetNames.add(sheetName);

            XLSX.utils.book_append_sheet(workbook, qnaSheet, sheetName);
            globalSheetIndex++;
          });
        }
      });

      XLSX.writeFile(workbook, `All_Users_QnA_${new Date().toISOString().split('T')[0]}.xlsx`);
    }
    
    console.log('Export completed successfully');

  } catch (error) {
    console.error('Error exporting all data:', error);
    alert(`Error exporting: ${error.message}`);
  }
};


  const filteredData = getFilteredData();
  const totalSubmissions = getAllSubmissions().length;
  const usersWithMultipleAttempts = users.filter(user => 
    (user.submissions?.length || 0) > 1 || user.totalAttempts > 1
  ).length;

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <h2>Loading Admin Dashboard...</h2>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.headerContent}>
          <h1 style={styles.title}>Admin Dashboard</h1>
          <button onClick={onLogout} style={styles.logoutButton}>
            Logout
          </button>
        </div>
        <div style={styles.stats}>
          <div style={styles.statCard}>
            <h3>{users.length}</h3>
            <p>Total Users</p>
          </div>
          <div style={styles.statCard}>
            <h3>{totalSubmissions}</h3>
            <p>Total Submissions</p>
          </div>
          <div style={styles.statCard}>
            <h3>{usersWithMultipleAttempts}</h3>
            <p>Repeat Users</p>
          </div>
          <div style={styles.statCard}>
            <h3>{new Set(users.map(u => u.language)).size}</h3>
            <p>Languages</p>
          </div>
        </div>
      </div>

      {error && (
        <div style={styles.errorBox}>
          <strong>Error:</strong> {error}
          <button onClick={fetchUsers} style={styles.retryButton}>
            Retry
          </button>
        </div>
      )}

      <div style={styles.viewToggle}>
        <button
          onClick={() => setViewMode('users')}
          style={{
            ...styles.toggleButton,
            backgroundColor: viewMode === 'users' ? '#3498db' : '#bdc3c7'
          }}
        >
          Users View ({users.length})
        </button>
        <button
          onClick={() => setViewMode('submissions')}
          style={{
            ...styles.toggleButton,
            backgroundColor: viewMode === 'submissions' ? '#3498db' : '#bdc3c7'
          }}
        >
          All Submissions ({totalSubmissions})
        </button>
      </div>

      <div style={styles.controls}>
        <div style={styles.searchContainer}>
          <input
            type="text"
            placeholder="Search by name, phone, or school..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.searchInput}
          />
          
          <select
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
            style={styles.languageFilter}
          >
            <option value="all">All Languages</option>
            <option value="tamil">Tamil</option>
            <option value="english">English</option>
            <option value="telugu">Telugu</option>
            <option value="kannada">Kannada</option>
            <option value="marathi">Marathi</option>
            <option value="hindi">Hindi</option>
          </select>
        </div>

        <div style={styles.actionButtons}>
          <button onClick={fetchUsers} style={styles.refreshButton}>
            Refresh
          </button>
          <button onClick={exportAllData} style={styles.exportButton}>
            Export All Q&A
          </button>
        </div>
      </div>

      {filteredData.length === 0 ? (
        <div style={styles.noData}>
          <h3>No {viewMode === 'users' ? 'Users' : 'Submissions'} Found</h3>
          <p>
            {users.length === 0 
              ? 'Quiz submissions will appear here once users start submitting.'
              : 'Try adjusting your search or language filter.'
            }
          </p>
          <button onClick={fetchUsers} style={styles.refreshButton}>
            Check Again
          </button>
        </div>
      ) : (
        <div style={styles.resultsInfo}>
          <p>
            Showing {filteredData.length} {viewMode === 'users' ? 'users' : 'submissions'}
            {searchTerm && ` matching "${searchTerm}"`}
            {selectedLanguage !== 'all' && ` in ${selectedLanguage}`}
          </p>
        </div>
      )}

      {filteredData.length > 0 && (
        <div style={styles.tableContainer}>
          {viewMode === 'users' ? (
            <UsersTable 
              users={filteredData} 
              onExportUser={exportUserData}
              exportingUserId={exportingUserId}
            />
          ) : (
            <SubmissionsTable submissions={filteredData} />
          )}
        </div>
      )}
    </div>
  );
};

// Users Table Component
const UsersTable = ({ users, onExportUser, exportingUserId }) => (
  <table style={styles.table}>
    <thead>
      <tr style={styles.tableHeader}>
        <th style={styles.th}>Name</th>
        <th style={styles.th}>Phone</th>
        <th style={styles.th}>School</th>
        <th style={styles.th}>Language</th>
        <th style={styles.th}>Attempts</th>
        <th style={styles.th}>Latest Submission</th>
        <th style={styles.th}>Actions</th>
      </tr>
    </thead>
    <tbody>
      {users.map((user, index) => (
        <tr key={user._id || user.id || index} style={{ 
          ...styles.tableRow,
          backgroundColor: index % 2 === 0 ? '#f8f9fa' : 'white'
        }}>
          <td style={styles.td}><strong>{user.name || 'N/A'}</strong></td>
          <td style={styles.td}>{user.phone || 'N/A'}</td>
          <td style={styles.td}>{user.school || '-'}</td>
          <td style={styles.td}>{user.language || 'N/A'}</td>
          <td style={styles.td}>{user.totalAttempts || user.submissions?.length || 1}</td>
          <td style={styles.td}>
            {new Date(user.lastSubmission || user.updatedAt || user.createdAt).toLocaleDateString()}
          </td>
          <td style={styles.td}>
            <button
              onClick={() => onExportUser(user)}
              disabled={exportingUserId === (user._id || user.id)}
              style={{
                ...styles.actionButton,
                backgroundColor: exportingUserId === (user._id || user.id) ? '#bdc3c7' : '#28a745',
                cursor: exportingUserId === (user._id || user.id) ? 'not-allowed' : 'pointer'
              }}
            >
              {exportingUserId === (user._id || user.id) ? 'Exporting...' : 'Export Q&A'}
            </button>
          </td>
        </tr>
      ))}
    </tbody>
  </table>
);

// Submissions Table Component
const SubmissionsTable = ({ submissions }) => (
  <table style={styles.table}>
    <thead>
      <tr style={styles.tableHeader}>
        <th style={styles.th}>User</th>
        <th style={styles.th}>Language</th>
        <th style={styles.th}>Attempt #</th>
        <th style={styles.th}>Answers</th>
        <th style={styles.th}>Submitted At</th>
      </tr>
    </thead>
    <tbody>
      {submissions.map((submission, index) => (
        <tr key={`${submission.user._id || submission.user.id}-${submission.submittedAt}-${index}`} style={{ 
          ...styles.tableRow,
          backgroundColor: index % 2 === 0 ? '#f8f9fa' : 'white'
        }}>
          <td style={styles.td}><strong>{submission.user.name}</strong></td>
          <td style={styles.td}>{submission.user.language}</td>
          <td style={styles.td}>#{submission.submissionNumber}</td>
          <td style={styles.td}>{submission.answers?.length || 0} answers</td>
          <td style={styles.td}>{new Date(submission.submittedAt).toLocaleDateString()}</td>
        </tr>
      ))}
    </tbody>
  </table>
);

// Styles (same as before)
const styles = {
  loginContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: '#f5f7fa',
    fontFamily: 'Arial, sans-serif'
  },
  loginBox: {
    backgroundColor: 'white',
    padding: '40px',
    borderRadius: '15px',
    boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
    width: '100%',
    maxWidth: '400px',
    textAlign: 'center'
  },
  loginHeader: {
    marginBottom: '30px'
  },
  loginTitle: {
    color: '#2c3e50',
    fontSize: '2.2em',
    margin: '0 0 10px 0'
  },
  loginSubtitle: {
    color: '#7f8c8d',
    margin: 0,
    fontSize: '14px'
  },
  loginForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  inputGroup: {
    textAlign: 'left'
  },
  label: {
    display: 'block',
    marginBottom: '8px',
    color: '#2c3e50',
    fontWeight: 'bold',
    fontSize: '14px'
  },
  input: {
    width: '100%',
    padding: '15px',
    border: '2px solid #ddd',
    borderRadius: '8px',
    fontSize: '16px',
    outline: 'none',
    transition: 'border-color 0.3s',
    boxSizing: 'border-box'
  },
  loginButton: {
    width: '100%',
    padding: '15px',
    backgroundColor: '#3498db',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'background-color 0.3s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px'
  },
  buttonSpinner: {
    border: '2px solid transparent',
    borderTop: '2px solid white',
    borderRadius: '50%',
    width: '16px',
    height: '16px',
    animation: 'spin 1s linear infinite'
  },
  errorMessage: {
    backgroundColor: '#ffebee',
    color: '#c62828',
    padding: '12px',
    borderRadius: '6px',
    fontSize: '14px',
    textAlign: 'center'
  },
  demoCredentials: {
    marginTop: '30px',
    padding: '20px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    textAlign: 'left',
    fontSize: '13px'
  },
  container: {
    padding: '20px',
    fontFamily: 'Arial, sans-serif',
    backgroundColor: '#f5f7fa',
    minHeight: '100vh'
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    backgroundColor: '#f5f7fa'
  },
  spinner: {
    border: '4px solid #f3f3f3',
    borderTop: '4px solid #3498db',
    borderRadius: '50%',
    width: '50px',
    height: '50px',
    animation: 'spin 1s linear infinite',
    marginBottom: '20px'
  },
  header: {
    marginBottom: '30px',
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '10px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
  },
  headerContent: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px'
  },
  title: {
    color: '#2c3e50',
    margin: 0,
    fontSize: '2.5em'
  },
  logoutButton: {
    padding: '10px 20px',
    backgroundColor: '#e74c3c',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold'
  },
  stats: {
    display: 'flex',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
    gap: '20px'
  },
  statCard: {
    textAlign: 'center',
    padding: '15px',
    backgroundColor: '#ecf0f1',
    borderRadius: '8px',
    minWidth: '120px',
    flex: 1
  },
  viewToggle: {
    display: 'flex',
    gap: '10px',
    marginBottom: '20px',
    justifyContent: 'center'
  },
  toggleButton: {
    padding: '12px 24px',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold'
  },
  errorBox: {
    backgroundColor: '#ffebee',
    color: '#c62828',
    padding: '15px',
    borderRadius: '8px',
    marginBottom: '20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  retryButton: {
    backgroundColor: '#e74c3c',
    color: 'white',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  controls: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '10px',
    boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
    flexWrap: 'wrap',
    gap: '15px'
  },
  searchContainer: {
    display: 'flex',
    gap: '15px',
    flexWrap: 'wrap'
  },
  searchInput: {
    padding: '12px',
    border: '2px solid #ddd',
    borderRadius: '8px',
    fontSize: '14px',
    width: '300px',
    outline: 'none'
  },
  languageFilter: {
    padding: '12px',
    border: '2px solid #ddd',
    borderRadius: '8px',
    fontSize: '14px',
    outline: 'none'
  },
  actionButtons: {
    display: 'flex',
    gap: '10px'
  },
  refreshButton: {
    padding: '12px 24px',
    backgroundColor: '#27ae60',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold'
  },
  exportButton: {
    padding: '12px 24px',
    backgroundColor: '#3498db',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold'
  },
  resultsInfo: {
    backgroundColor: 'white',
    padding: '10px 20px',
    borderRadius: '8px',
    marginBottom: '10px',
    color: '#666',
    fontSize: '14px'
  },
  noData: {
    textAlign: 'center',
    padding: '60px 20px',
    backgroundColor: 'white',
    borderRadius: '10px',
    boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
  },
  tableContainer: {
    backgroundColor: 'white',
    borderRadius: '10px',
    overflow: 'hidden',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse'
  },
  tableHeader: {
    backgroundColor: '#34495e'
  },
  th: {
    padding: '15px 12px',
    textAlign: 'left',
    color: 'white',
    fontWeight: 'bold',
    fontSize: '14px'
  },
  tableRow: {
    borderBottom: '1px solid #ecf0f1'
  },
  td: {
    padding: '15px 12px',
    textAlign: 'left',
    verticalAlign: 'top',
    fontSize: '14px'
  },
  actionButton: {
    padding: '8px 16px',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: 'bold'
  }
};

export default AdminApp;