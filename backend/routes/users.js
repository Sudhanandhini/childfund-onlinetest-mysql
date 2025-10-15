import express from 'express';
import { User, Submission, Answer } from '../models/index.js';

const router = express.Router();

// POST /api/users - Create new user submission or add to existing user
router.post('/', async (req, res) => {
  try {
    console.log('Received data:', req.body);
    
    const { name, phone, school, class: className, language, answers, completionTime } = req.body;
    
    // Validation
    if (!name || !phone || !language) {
      return res.status(400).json({ 
        message: 'Name, phone and language are required',
        received: { name, phone, language }
      });
    }

    // Generate a unique session ID for this submission
    const sessionId = new Date().getTime().toString();

    // Try to find existing user by phone number
    let existingUser = await User.findOne({ 
      where: { phone: phone },
      include: [{
        model: Submission,
        as: 'submissions',
        include: [{
          model: Answer,
          as: 'answers'
        }]
      }]
    });

    if (existingUser) {
      // User exists - add new submission
      console.log('Existing user found, adding new submission');
      
      // Create new submission
      const newSubmission = await Submission.create({
        userId: existingUser.id,
        submittedAt: new Date(),
        completionTime: completionTime || null,
        sessionId: sessionId,
        score: 0
      });

      // Create answers for this submission
      if (answers && answers.length > 0) {
        await Answer.bulkCreate(
          answers.map(ans => ({
            submissionId: newSubmission.id,
            questionId: ans.questionId,
            question: ans.question,
            answer: ans.answer
          }))
        );
      }

      // Update user fields
      await existingUser.update({
        name: name,
        school: school,
        class: className,
        language: language,
        totalAttempts: existingUser.totalAttempts + 1,
        lastSubmission: new Date()
      });

      // Reload user with all submissions
      const updatedUser = await User.findByPk(existingUser.id, {
        include: [{
          model: Submission,
          as: 'submissions',
          include: [{
            model: Answer,
            as: 'answers'
          }]
        }]
      });

      console.log('Added new submission to existing user:', updatedUser.id);
      
      return res.status(201).json({ 
        message: `New submission added successfully! This is attempt #${updatedUser.totalAttempts}`,
        id: updatedUser.id,
        attemptNumber: updatedUser.totalAttempts,
        sessionId: sessionId,
        isNewUser: false,
        user: updatedUser
      });

    } else {
      // New user - create fresh entry
      console.log('New user, creating fresh entry');
      
      // Create user
      const newUser = await User.create({
        name,
        phone,
        school,
        class: className,
        language,
        totalAttempts: 1,
        lastSubmission: new Date()
      });

      // Create first submission
      const newSubmission = await Submission.create({
        userId: newUser.id,
        submittedAt: new Date(),
        completionTime: completionTime || null,
        sessionId: sessionId,
        score: 0
      });

      // Create answers for this submission
      if (answers && answers.length > 0) {
        await Answer.bulkCreate(
          answers.map(ans => ({
            submissionId: newSubmission.id,
            questionId: ans.questionId,
            question: ans.question,
            answer: ans.answer
          }))
        );
      }

      // Reload user with submissions
      const savedUser = await User.findByPk(newUser.id, {
        include: [{
          model: Submission,
          as: 'submissions',
          include: [{
            model: Answer,
            as: 'answers'
          }]
        }]
      });

      console.log('New user created successfully:', savedUser.id);
      
      return res.status(201).json({ 
        message: 'Welcome! Your first submission saved successfully',
        id: savedUser.id,
        attemptNumber: 1,
        sessionId: sessionId,
        isNewUser: true,
        user: savedUser
      });
    }
    
  } catch (err) {
    console.error('Error saving user:', err);
    return res.status(500).json({ 
      message: 'Server error while saving user data',
      error: err.message 
    });
  }
});

// GET /api/users - Get all users with their submissions
router.get('/', async (req, res) => {
  try {
    const users = await User.findAll({
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
    
    // Transform data to show submission details
    const usersWithStats = users.map(user => ({
      ...user.toJSON(),
      submissionCount: user.submissions?.length || 0,
      latestSubmission: user.submissions?.length > 0 
        ? user.submissions[user.submissions.length - 1].submittedAt 
        : user.createdAt
    }));
    
    res.json(usersWithStats);
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ message: 'Error fetching users', error: err.message });
  }
});

// GET /api/users/:id - Get user by ID with all submissions
router.get('/:id', async (req, res) => {
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
    
    res.json({
      ...user.toJSON(),
      submissionCount: user.submissions?.length || 0
    });
  } catch (err) {
    console.error('Error fetching user:', err);
    res.status(500).json({ message: 'Error fetching user', error: err.message });
  }
});

// GET /api/users/phone/:phone - Get user by phone number
router.get('/phone/:phone', async (req, res) => {
  try {
    const user = await User.findOne({ 
      where: { phone: req.params.phone },
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
    
    res.json({
      ...user.toJSON(),
      submissionCount: user.submissions?.length || 0
    });
  } catch (err) {
    console.error('Error fetching user by phone:', err);
    res.status(500).json({ message: 'Error fetching user', error: err.message });
  }
});

// POST /api/users/check-existing - Check if user exists by phone
router.post('/check-existing', async (req, res) => {
  try {
    const { phone } = req.body;
    
    if (!phone) {
      return res.status(400).json({ message: 'Phone number is required' });
    }

    const existingUser = await User.findOne({ 
      where: { phone },
      include: [{
        model: Submission,
        as: 'submissions'
      }]
    });
    
    if (existingUser) {
      return res.json({
        exists: true,
        user: {
          name: existingUser.name,
          phone: existingUser.phone,
          school: existingUser.school,
          class: existingUser.class,
          language: existingUser.language,
          totalAttempts: existingUser.totalAttempts || existingUser.submissions?.length || 0,
          lastSubmission: existingUser.lastSubmission || existingUser.updatedAt
        },
        message: `Welcome back ${existingUser.name}! You have taken ${existingUser.totalAttempts || 0} attempts.`
      });
    } else {
      return res.json({
        exists: false,
        message: 'New user - ready for first attempt!'
      });
    }
  } catch (err) {
    console.error('Error checking existing user:', err);
    res.status(500).json({ message: 'Error checking user', error: err.message });
  }
});

export default router;