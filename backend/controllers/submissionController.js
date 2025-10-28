import certificateController from '../controllers/certificateController.js';
import User from '../models/User.js';
import Submission from '../models/Submission.js';
import Answer from '../models/Answer.js';

export const submitQuiz = async (req, res) => {
  try {
    const { userId, answers, sessionId } = req.body;
    
    // Validate user exists
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Calculate current attempt number
    const currentAttempt = (user.totalAttempts || 0) + 1;

    // Calculate score
    let calculatedScore = 0;
    const totalQuestions = answers.length;
    
    // Save submission
    const submission = await Submission.create({
      userId,
      attemptNumber: currentAttempt,
      score: calculatedScore,
      totalQuestions,
      percentage: (calculatedScore / totalQuestions) * 100,
      sessionId,
      completionTime: req.body.completionTime || null
    });

    // Save individual answers
    await Promise.all(answers.map(async (answer) => {
      await Answer.create({
        submissionId: submission.id,
        questionId: answer.questionId,
        question: answer.question,
        answer: answer.answer,
        isCorrect: answer.isCorrect || false
      });
      if (answer.isCorrect) {
        calculatedScore++;
      }
    }));

    // Update submission with final score
    await submission.update({
      score: calculatedScore,
      percentage: (calculatedScore / totalQuestions) * 100
    });

    // Update user
    await user.update({ 
      totalAttempts: currentAttempt,
      lastSubmission: new Date()
    });

    // Check if this is 2nd attempt and generate certificate
    let certificate = null;
    let certificateMessage = null;

    if (currentAttempt === 2) { // Changed from >= to === to generate only on second attempt
      try {
        // Get all submissions for score calculation
        const allSubmissions = await Submission.findAll({
          where: { userId },
          include: [{
            model: Answer,
            attributes: ['isCorrect']
          }],
          order: [['createdAt', 'ASC']]
        });

        if (allSubmissions.length === 2) {
          // Calculate total and average scores
          const totalScores = allSubmissions.map(s => ({
            score: s.score,
            totalQuestions: s.totalQuestions,
            percentage: s.percentage
          }));

          const averageScore = totalScores.reduce((sum, s) => sum + s.score, 0) / 2;
          const totalQuestions = totalScores[0].totalQuestions; // Should be same for both attempts
          const averagePercentage = (averageScore / totalQuestions) * 100;

          const certResult = await certificateController.checkAndGenerateCertificate(userId, {
            averageScore,
            totalQuestions,
            averagePercentage,
            attempts: totalScores
          });
          
          if (certResult.generated) {
            certificate = certResult.certificate;
            certificateMessage = 'Congratulations! Your certificate has been generated.';
          } else if (certResult.exists) {
            certificate = certResult.certificate;
            certificateMessage = 'Your certificate was already generated.';
          }
        }
      } catch (certError) {
        console.error('Certificate generation error:', certError);
        certificateMessage = 'Unable to generate certificate. Please contact support.';
      }
    }

    // Prepare response
    const response = {
      success: true,
      message: `Attempt ${currentAttempt} submitted successfully`,
      submission: {
        id: submission.id,
        attemptNumber: currentAttempt,
        score: calculatedScore,
        totalQuestions,
        percentage: (calculatedScore / totalQuestions) * 100,
        completionTime: submission.completionTime
      },
      attemptsRemaining: Math.max(0, 2 - currentAttempt),
      canEarnCertificate: currentAttempt < 2
    };

    // Add certificate info if applicable
    if (certificate) {
      response.certificate = {
        id: certificate.id,
        certificateNumber: certificate.certificateNumber,
        downloadUrl: certificate.filePath,
        issueDate: certificate.issueDate
      };
      response.certificateMessage = certificateMessage;
    }

    res.json(response);

  } catch (error) {
    console.error('Submit error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to submit quiz',
      details: error.message 
    });
  }
};