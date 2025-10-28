// backend/controllers/certificateController.js
import Certificate from '../models/Certificate.js';
import User from '../models/User.js';
import Submission from '../models/Submission.js';
import Answer from '../models/Answer.js';
import certificateService from '../services/certificateService.js';

class CertificateController {

  // Check and generate certificate if user has 2 submissions
  async checkAndGenerateCertificate(userId, submissionData) {
    try {
      // Check if certificate already exists
      const existingCertificate = await Certificate.findOne({ where: { userId } });
      if (existingCertificate) {
        return { exists: true, certificate: existingCertificate };
      }

      // Fetch user
      const user = await User.findByPk(userId);
      if (!user) return { exists: false, message: 'User not found' };

      // Accept submissionData from caller (frontend or controller)
      const submissions = (submissionData && submissionData.submissions) || submissionData || [];
      if (!Array.isArray(submissions) || submissions.length < 2) {
        return { exists: false, message: 'User needs to complete 2 attempts to get certificate', attemptsCompleted: submissions.length || 0 };
      }

      // Compute stats
      const submissionScores = submissions.map(s => ({
        score: Number(s.score) || 0,
        totalQuestions: Number(s.totalQuestions) || 0,
        percentage: Number(s.percentage) || 0,
        completionTime: s.completionTime || null
      }));

      const totalScore = submissionScores.reduce((sum, s) => sum + s.score, 0);
      const totalQuestionsPerAttempt = submissionScores[0].totalQuestions || 0;
      const avgScore = totalScore / submissionScores.length;
      const avgPercentage = submissionScores.reduce((sum, s) => sum + s.percentage, 0) / submissionScores.length;
      const bestAttempt = submissionScores.reduce((best, cur) => (cur.percentage > best.percentage ? cur : best), submissionScores[0]);

      // Generate certificate file
      const generatedCertData = await certificateService.generateCertificate(
        {
          name: user.name,
          phone: user.phone,
          school: user.school || 'N/A',
          language: user.language,
          state: user.state,
          district: user.district
        },
        {
          totalScore: Math.round(avgScore),
          maxScore: totalQuestionsPerAttempt,
          percentage: avgPercentage,
          attempts: submissionScores
        }
      );

      // Save certificate record (only fields defined in Certificate model)
      const certificate = await Certificate.create({
        userId: user.id,
        certificateNumber: generatedCertData.certificateNumber,
        userName: user.name,
        phone: user.phone,
        school: user.school || 'N/A',
        language: user.language || 'N/A',
        totalScore: Math.round(avgScore),
        maxScore: totalQuestionsPerAttempt || 0,
        percentage: Number(avgPercentage) || 0,
        filePath: generatedCertData.filePath,
        issueDate: generatedCertData.issueDate || new Date()
      });

      return { exists: true, certificate, generated: true };
    } catch (error) {
      console.error('Error checking/generating certificate:', error);
      throw error;
    }
  }

  // API: Generate certificate
  async generateCertificate(req, res) {
    try {
      const { userId } = req.params;

      if (!userId) {
        return res.status(400).json({ success: false, error: 'User ID is required' });
      }

      // Accept submission / user data from request body (sent by frontend)
      let submissionData = req.body && (req.body.submissionData || req.body.submissions || req.body);

      // If frontend didn't provide submissions, fetch them from DB
      if (!submissionData || !submissionData.submissions) {
        const submissionsFromDb = await Submission.findAll({
          where: { userId },
          include: [{ model: Answer, as: 'answers' }],
          order: [['submittedAt', 'ASC']]
        });

        submissionData = {
          submissions: submissionsFromDb.map(s => {
            const ansCount = Array.isArray(s.answers) ? s.answers.length : 0;
            const score = Number(s.score) || 0;
            const percentage = ansCount > 0 ? (score / ansCount) * 100 : 0;
            return {
              id: s.id,
              submittedAt: s.submittedAt,
              score,
              totalQuestions: ansCount,
              percentage,
              completionTime: s.completionTime
            };
          })
        };
      }

      const result = await this.checkAndGenerateCertificate(userId, submissionData);

      if (result.generated) {
        return res.status(201).json({
          success: true,
          message: 'Certificate generated successfully',
          certificate: result.certificate
        });
      } else if (result.exists) {
        return res.status(200).json({
          success: true,
          message: 'Certificate already exists',
          certificate: result.certificate
        });
      } else {
        return res.status(400).json({
          success: false,
          message: result.message,
          attemptsCompleted: result.attemptsCompleted
        });
      }

    } catch (error) {
      console.error('Generate certificate error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to generate certificate',
        details: error.message 
      });
    }
  }

  // API: Get user certificate
  async getUserCertificate(req, res) {
    try {
      const { userId } = req.params;

      const certificate = await Certificate.findOne({ where: { userId } });

      if (!certificate) {
        return res.status(404).json({
          success: false,
          message: 'Certificate not found. Complete 2 attempts to receive your certificate.'
        });
      }

      res.json({
        success: true,
        certificate
      });

    } catch (error) {
      console.error('Get certificate error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch certificate' 
      });
    }
  }

  // API: Get all certificates (admin)
  async getAllCertificates(req, res) {
    try {
      const certificates = await Certificate.findAll({
        include: [{ model: User, as: 'user', attributes: ['name', 'phone', 'school', 'language'] }],
        order: [['createdAt', 'DESC']]
      });

      res.json({ success: true, certificates, total: certificates.length });

    } catch (error) {
      console.error('Get all certificates error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch certificates' 
      });
    }
  }

  // API: Check if user is eligible for certificate
  async checkEligibility(req, res) {
    try {
      const { userId } = req.params;

      // Count user's submissions using Submission model
      const submissionCount = await Submission.count({ where: { userId } });
      const hasExistingCertificate = await Certificate.findOne({ where: { userId } });

      res.json({
        success: true,
        eligible: submissionCount >= 2,
        submissionCount,
        hasCertificate: !!hasExistingCertificate,
        certificateNumber: hasExistingCertificate ? hasExistingCertificate.certificateNumber : null
      });

    } catch (error) {
      console.error('Check eligibility error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to check eligibility' 
      });
    }
  }
}

export default new CertificateController();
