import express from "express";
import { User, Submission, Answer, Certificate } from "../models/index.js";
import { Op } from 'sequelize';

const router = express.Router();

// GET /api/admin/users - Get all users with submission details
router.get("/users", async (req, res) => {
  try {
    const users = await User.findAll({
      include: [{
        model: Submission,
        as: 'submissions',
        include: [{
          model: Answer,
          as: 'answers'
        }]
      }, {
        model: Certificate,
        as: 'certificate'
      }],
      order: [['updatedAt', 'DESC']]
    });
    
    // Enhance users data with submission statistics
    const enhancedUsers = users.map(user => {
      const userObj = user.toJSON();
      const submissionCount = user.submissions?.length || 0;
      
      return {
        ...userObj,
        submissionCount,
        totalAttempts: user.totalAttempts || submissionCount,
        latestSubmission: user.lastSubmission || user.submissions?.[user.submissions.length - 1]?.submittedAt || user.createdAt,
        hasMultipleAttempts: submissionCount > 1,
        hasCertificate: !!user.certificate,
        certificate: user.certificate ? {
          id: user.certificate.id,
          certificateNumber: user.certificate.certificateNumber,
          filePath: user.certificate.filePath,
          issueDate: user.certificate.issueDate
        } : null
      };
    });

    // Calculate statistics
    const stats = {
      totalUsers: users.length,
      totalSubmissions: enhancedUsers.reduce((sum, user) => sum + user.submissionCount, 0),
      usersWithMultipleAttempts: enhancedUsers.filter(user => user.hasMultipleAttempts).length,
      languageBreakdown: enhancedUsers.reduce((acc, user) => {
        acc[user.language] = (acc[user.language] || 0) + 1;
        return acc;
      }, {}),
      recentSubmissions: enhancedUsers.filter(user => {
        const dayAgo = new Date();
        dayAgo.setDate(dayAgo.getDate() - 1);
        return new Date(user.latestSubmission) > dayAgo;
      }).length
    };

    res.json({
      message: 'Users fetched successfully',
      users: enhancedUsers,
      statistics: stats
    });
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ 
      message: "Error fetching users", 
      error: err.message 
    });
  }
});

// GET /api/admin/users/:id - Get specific user with all submissions
router.get("/users/:id", async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      include: [{
        model: Submission,
        as: 'submissions',
        include: [{
          model: Answer,
          as: 'answers'
        }]
      }]
    });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const userObj = user.toJSON();
    const submissionCount = user.submissions?.length || 0;

    res.json({
      ...userObj,
      submissionCount,
      totalAttempts: user.totalAttempts || submissionCount,
      hasMultipleAttempts: submissionCount > 1
    });
  } catch (err) {
    console.error('Error fetching user:', err);
    res.status(500).json({ 
      message: "Error fetching user", 
      error: err.message 
    });
  }
});

// GET /api/admin/submissions - Get all submissions from all users
router.get("/submissions", async (req, res) => {
  try {
    const submissions = await Submission.findAll({
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'phone', 'school', 'class', 'language']
        },
        {
          model: Answer,
          as: 'answers'
        }
      ],
      order: [['submittedAt', 'DESC']]
    });
    
    const allSubmissions = submissions.map((submission, globalIndex) => {
      const submissionObj = submission.toJSON();
      return {
        _id: submission.id,
        user: submissionObj.user,
        answers: submissionObj.answers,
        submittedAt: submission.submittedAt,
        sessionId: submission.sessionId,
        score: submission.score,
        completionTime: submission.completionTime,
        submissionNumber: globalIndex + 1
      };
    });

    res.json({
      message: 'All submissions fetched successfully',
      submissions: allSubmissions,
      count: allSubmissions.length
    });
  } catch (err) {
    console.error('Error fetching submissions:', err);
    res.status(500).json({ 
      message: "Error fetching submissions", 
      error: err.message 
    });
  }
});

// GET /api/admin/statistics - Get detailed statistics
router.get("/statistics", async (req, res) => {
  try {
    const users = await User.findAll({
      include: [{
        model: Submission,
        as: 'submissions'
      }]
    });
    
    const stats = {
      overview: {
        totalUsers: users.length,
        totalSubmissions: 0,
        usersWithMultipleAttempts: 0,
        averageAttemptsPerUser: 0
      },
      languages: {},
      timeBasedStats: {
        today: 0,
        thisWeek: 0,
        thisMonth: 0
      },
      submissionPatterns: {
        singleAttempt: 0,
        multipleAttempts: 0,
        maxAttemptsByUser: 0
      }
    };

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    users.forEach(user => {
      const submissionCount = user.submissions?.length || 0;
      stats.overview.totalSubmissions += submissionCount;
      
      // Language statistics
      if (user.language) {
        stats.languages[user.language] = (stats.languages[user.language] || 0) + 1;
      }
      
      // Multiple attempts tracking
      if (submissionCount > 1) {
        stats.overview.usersWithMultipleAttempts++;
        stats.submissionPatterns.multipleAttempts++;
      } else if (submissionCount === 1) {
        stats.submissionPatterns.singleAttempt++;
      }
      
      // Max attempts tracking
      stats.submissionPatterns.maxAttemptsByUser = Math.max(
        stats.submissionPatterns.maxAttemptsByUser, 
        submissionCount
      );
      
      // Time-based statistics
      const userLatestSubmission = user.lastSubmission || user.updatedAt || user.createdAt;
      if (userLatestSubmission >= today) {
        stats.timeBasedStats.today++;
      }
      if (userLatestSubmission >= weekAgo) {
        stats.timeBasedStats.thisWeek++;
      }
      if (userLatestSubmission >= monthAgo) {
        stats.timeBasedStats.thisMonth++;
      }
    });

    // Calculate average
    stats.overview.averageAttemptsPerUser = users.length > 0 
      ? (stats.overview.totalSubmissions / users.length).toFixed(2)
      : 0;

    res.json({
      message: 'Statistics fetched successfully',
      statistics: stats
    });
  } catch (err) {
    console.error('Error fetching statistics:', err);
    res.status(500).json({ 
      message: "Error fetching statistics", 
      error: err.message 
    });
  }
});

// DELETE /api/admin/users/:id - Delete user and all submissions
router.delete("/users/:id", async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      include: [{
        model: Submission,
        as: 'submissions'
      }]
    });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const submissionCount = user.submissions?.length || 0;
    const userName = user.name;
    const userPhone = user.phone;
    
    // Delete user (cascade will delete submissions and answers)
    await user.destroy();
    
    res.json({ 
      message: `User and ${submissionCount} submission(s) deleted successfully`, 
      user: {
        name: userName,
        phone: userPhone,
        submissionsDeleted: submissionCount
      }
    });
  } catch (err) {
    console.error('Error deleting user:', err);
    res.status(500).json({ 
      message: "Error deleting user", 
      error: err.message 
    });
  }
});

// DELETE /api/admin/users/:userId/submissions/:submissionId - Delete specific submission
router.delete("/users/:userId/submissions/:submissionId", async (req, res) => {
  try {
    const { userId, submissionId } = req.params;
    
    const user = await User.findByPk(userId, {
      include: [{
        model: Submission,
        as: 'submissions'
      }]
    });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const submission = await Submission.findOne({
      where: {
        id: submissionId,
        userId: userId
      },
      include: [{
        model: Answer,
        as: 'answers'
      }]
    });
    
    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }
    
    const deletedSubmissionData = {
      submittedAt: submission.submittedAt,
      answersCount: submission.answers?.length || 0
    };
    
    // Delete submission (cascade will delete answers)
    await submission.destroy();
    
    // Update user stats
    const remainingSubmissions = await Submission.count({ where: { userId } });
    const lastSubmission = await Submission.findOne({
      where: { userId },
      order: [['submittedAt', 'DESC']]
    });
    
    await user.update({
      totalAttempts: remainingSubmissions,
      lastSubmission: lastSubmission ? lastSubmission.submittedAt : user.createdAt
    });
    
    res.json({ 
      message: 'Submission deleted successfully',
      deletedSubmission: deletedSubmissionData,
      remainingSubmissions: remainingSubmissions
    });
  } catch (err) {
    console.error('Error deleting submission:', err);
    res.status(500).json({ 
      message: "Error deleting submission", 
      error: err.message 
    });
  }
});

// POST /api/admin/export - Export data in various formats
router.post("/export", async (req, res) => {
  try {
    const { format = 'csv', type = 'users', filters = {} } = req.body;
    
    let where = {};
    
    // Apply filters
    if (filters.language && filters.language !== 'all') {
      where.language = filters.language;
    }
    if (filters.dateFrom || filters.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) {
        where.createdAt[Op.gte] = new Date(filters.dateFrom);
      }
      if (filters.dateTo) {
        where.createdAt[Op.lte] = new Date(filters.dateTo);
      }
    }
    
    const users = await User.findAll({
      where,
      include: [{
        model: Submission,
        as: 'submissions',
        include: [{
          model: Answer,
          as: 'answers'
        }]
      }],
      order: [['updatedAt', 'DESC']]
    });
    
    let exportData = [];
    
    if (type === 'submissions') {
      // Export all submissions
      users.forEach(user => {
        if (user.submissions && user.submissions.length > 0) {
          user.submissions.forEach((submission, index) => {
            exportData.push({
              userName: user.name,
              userPhone: user.phone,
              userSchool: user.school || '',
              userClass: user.class || '',
              userLanguage: user.language,
              submissionNumber: index + 1,
              totalSubmissions: user.submissions.length,
              answersCount: submission.answers?.length || 0,
              submittedAt: submission.submittedAt,
              sessionId: submission.sessionId || '',
              score: submission.score || 0,
              completionTime: submission.completionTime || ''
            });
          });
        }
      });
    } else {
      // Export users summary
      exportData = users.map(user => ({
        name: user.name,
        phone: user.phone,
        school: user.school || '',
        class: user.class || '',
        language: user.language,
        totalAttempts: user.totalAttempts || user.submissions?.length || 0,
        latestSubmission: user.lastSubmission || user.updatedAt,
        firstSubmission: user.createdAt,
        hasMultipleAttempts: (user.submissions?.length || 0) > 1
      }));
    }
    
    res.json({
      message: 'Export data prepared successfully',
      data: exportData,
      count: exportData.length,
      type,
      format,
      generatedAt: new Date().toISOString()
    });
  } catch (err) {
    console.error('Error preparing export:', err);
    res.status(500).json({ 
      message: "Error preparing export", 
      error: err.message 
    });
  }
});

// GET /api/admin/users/search/:searchTerm - Search users
router.get("/users/search/:searchTerm", async (req, res) => {
  try {
    const { searchTerm } = req.params;
    
    const users = await User.findAll({
      where: {
        [Op.or]: [
          { name: { [Op.like]: `%${searchTerm}%` } },
          { phone: { [Op.like]: `%${searchTerm}%` } },
          { school: { [Op.like]: `%${searchTerm}%` } }
        ]
      },
      include: [{
        model: Submission,
        as: 'submissions'
      }],
      order: [['updatedAt', 'DESC']],
      limit: 50
    });
    
    const enhancedUsers = users.map(user => {
      const submissionCount = user.submissions?.length || 0;
      return {
        ...user.toJSON(),
        submissionCount,
        hasMultipleAttempts: submissionCount > 1
      };
    });
    
    res.json({
      message: `Found ${users.length} users matching "${searchTerm}"`,
      users: enhancedUsers,
      searchTerm
    });
  } catch (err) {
    console.error('Error searching users:', err);
    res.status(500).json({ 
      message: "Error searching users", 
      error: err.message 
    });
  }
});

export default router;