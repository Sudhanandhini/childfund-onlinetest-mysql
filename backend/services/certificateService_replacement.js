// replacement content for certificateService.js (PDF implementation)
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class CertificateService {
  generateCertificateNumber() {
    const date = new Date();
    const year = date.getFullYear();
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `CERT-${year}-${timestamp}${random}`;
  }

  async generateCertificate(userData, submissionData) {
    const { name, phone, school, language } = userData || {};
    const { totalScore = 0, maxScore = 0, percentage = 0 } = submissionData || {};

    const certificateNumber = this.generateCertificateNumber();
    const issueDate = new Date();

    // Ensure certificates directory exists
    const certificatesDir = path.join(__dirname, '..', 'certificates');
    if (!fs.existsSync(certificatesDir)) {
      fs.mkdirSync(certificatesDir, { recursive: true });
    }

    const safePhone = String(phone || 'unknown').replace(/[^0-9a-zA-Z_-]/g, '');
    const fileName = `certificate_${safePhone}_${Date.now()}.pdf`;
    const filePath = path.join(certificatesDir, fileName);

    return await new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 50 });
        const stream = fs.createWriteStream(filePath);
        doc.pipe(stream);

        // Header
        doc.fillColor('#1B5E20').font('Times-Bold').fontSize(36).text('CERTIFICATE OF APPRECIATION', { align: 'center' });
        doc.moveDown(0.5);
        doc.fillColor('#FF6F00').font('Times-Bold').fontSize(24).text('ChildFund India', { align: 'center' });
        doc.moveDown(1.5);

        doc.fillColor('#000000').font('Times-Roman').fontSize(18).text('Proudly presented to', { align: 'center' });
        doc.moveDown(0.5);

        // Recipient name
        doc.font('Times-Bold').fontSize(48).fillColor('#1565C0').text(name || 'Participant', { align: 'center' });
        doc.moveDown(1);

        doc.font('Times-Roman').fontSize(18).fillColor('#000000').text('for successfully completing the', { align: 'center' });
        doc.moveDown(0.3);
        doc.font('Times-Bold').fontSize(20).text('Knowledge, Attitude, and Practices (KAP)', { align: 'center' });
        
        doc.moveDown(1);
        doc.font('Times-Roman').fontSize(14).fillColor('#424242').text(`School: ${school || 'N/A'} | Language: ${language || 'N/A'}`, { align: 'center' });

        doc.moveDown(1);
        doc.fontSize(12).fillColor('#757575').text(`Certificate No: ${certificateNumber}`, { align: 'center' });
        doc.moveDown(0.2);
        doc.text(`Issue Date: ${issueDate.toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}`, { align: 'center' });

        doc.end();

        stream.on('finish', () => {
          resolve({
            certificateNumber,
            filePath: `/certificates/${fileName}`,
            fileName,
            issueDate
          });
        });

        stream.on('error', (err) => reject(err));
      } catch (err) {
        reject(err);
      }
    });
  }
}

export default new CertificateService();
