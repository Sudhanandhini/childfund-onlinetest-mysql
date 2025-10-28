// backend/services/certificateService.js
import { Document, Packer, Paragraph, TextRun, AlignmentType, PageOrientation } from 'docx';
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
    const { name, phone, school, language } = userData;
    const { totalScore = 0, maxScore = 0, percentage = 0 } = submissionData;

    const certificateNumber = this.generateCertificateNumber();
    const issueDate = new Date().toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const doc = new Document({
      styles: {
        default: {
          document: {
            run: { font: 'Arial', size: 24 }
          }
        }
      },
      sections: [{
        properties: {
          page: {
            margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
            size: { orientation: PageOrientation.LANDSCAPE }
          }
        },
        children: [
          new Paragraph({
            spacing: { before: 400, after: 200 },
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: 'CERTIFICATE OF APPRECIATION',
                size: 56,
                bold: true,
                color: '1B5E20',
                font: 'Arial'
              })
            ]
          }),

          new Paragraph({
            spacing: { before: 400, after: 400 },
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: 'ChildFund India',
                size: 48,
                bold: true,
                color: 'FF6F00',
                font: 'Arial'
              })
            ]
          }),

          new Paragraph({
            spacing: { before: 200, after: 200 },
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: '42 years with children, in every stride',
                size: 24,
                italics: true,
                color: '424242',
                font: 'Arial'
              })
            ]
          }),

          new Paragraph({
            spacing: { before: 400, after: 200 },
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: 'Proudly presented to',
                size: 28,
                color: '000000',
                font: 'Arial'
              })
            ]
          }),

          new Paragraph({
            spacing: { before: 200, after: 400 },
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: name || 'Participant',
                size: 48,
                bold: true,
                color: '1565C0',
                font: 'Arial'
              })
            ]
          }),

          new Paragraph({
            spacing: { before: 200, after: 120 },
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: 'for successfully completing the MERN Quiz Assessment',
                size: 26,
                color: '000000',
                font: 'Arial'
              })
            ]
          }),

          new Paragraph({
            spacing: { before: 120, after: 300 },
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: 'and demonstrating excellence in knowledge and dedication.',
                size: 26,
                color: '000000',
                font: 'Arial'
              })
            ]
          }),

          new Paragraph({
            spacing: { before: 200, after: 120 },
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: `Score: ${totalScore}/${maxScore} (${isFinite(percentage) ? percentage.toFixed(1) : '0.0'}%)`,
                size: 32,
                bold: true,
                color: '2E7D32',
                font: 'Arial'
              })
            ]
          }),

          new Paragraph({
            spacing: { before: 120, after: 120 },
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: `School: ${school || 'N/A'}`,
                size: 24,
                color: '424242',
                font: 'Arial'
              })
            ]
          }),

          new Paragraph({
            spacing: { before: 120, after: 400 },
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: `Language: ${language || 'N/A'}`,
                size: 24,
                color: '424242',
                font: 'Arial'
              })
            ]
          }),

          new Paragraph({
            spacing: { before: 400, after: 120 },
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: `Certificate No: ${certificateNumber}`,
                size: 20,
                color: '757575',
                font: 'Arial'
              })
            ]
          }),

          new Paragraph({
            spacing: { before: 120, after: 120 },
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: `Issue Date: ${issueDate}`,
                size: 20,
                color: '757575',
                font: 'Arial'
              })
            ]
          })
        ]
      }]
    });

    const buffer = await Packer.toBuffer(doc);

    // Ensure certificates directory exists
    const certificatesDir = path.join(__dirname, '..', 'certificates');
    if (!fs.existsSync(certificatesDir)) {
      fs.mkdirSync(certificatesDir, { recursive: true });
    }

    const safePhone = String(phone || 'unknown').replace(/[^0-9a-zA-Z_-]/g, '');
    const fileName = `certificate_${safePhone}_${Date.now()}.docx`;
    const filePath = path.join(certificatesDir, fileName);

    fs.writeFileSync(filePath, buffer);

    return {
      certificateNumber,
      filePath: `/certificates/${fileName}`, // URL path served by express.static
      fileName,
      issueDate: new Date()
    };
  }
}

export default new CertificateService();
