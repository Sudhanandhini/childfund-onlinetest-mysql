const certificateController = require('../controllers/certificateController');

// Middleware to check and generate certificate after submission
async function checkCertificateGeneration(req, res, next) {
  try {
    // This runs after a successful submission
    const userId = req.body.userId || req.userId;
    
    if (!userId) {
      return next();
    }

    // Check if user now has 2 submissions and generate certificate
    const result = await certificateController.checkAndGenerateCertificate(userId);
    
    // Attach certificate info to response if generated
    if (result.generated) {
      req.certificateGenerated = true;
      req.certificate = result.certificate;
      console.log(`✓ Certificate generated for user ${userId}: ${result.certificate.certificateNumber}`);
    }
    
    next();
  } catch (error) {
    console.error('Certificate generation middleware error:', error);
    // Don't fail the request if certificate generation fails
    next();
  }
}

module.exports = {
  checkCertificateGeneration
};