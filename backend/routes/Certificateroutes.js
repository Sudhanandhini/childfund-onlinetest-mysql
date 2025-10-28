import express from 'express';
import certificateController from '../controllers/certificateController.js';

const router = express.Router();

// Generate certificate for user (after 2 submissions)
router.post('/generate/:userId', certificateController.generateCertificate.bind(certificateController));

// Get user's certificate
router.get('/user/:userId', certificateController.getUserCertificate.bind(certificateController));

// Check if user is eligible for certificate
router.get('/check-eligibility/:userId', certificateController.checkEligibility.bind(certificateController));

// Admin: Get all certificates
router.get('/admin/all', certificateController.getAllCertificates.bind(certificateController));

export default router;   // ✅ This is the correct export
