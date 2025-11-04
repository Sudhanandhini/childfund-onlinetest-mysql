// PDF-based certificate service implementation
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
    const { name, phone } = userData || {};
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
        // Initialize PDF doc
        const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 0 });
        const stream = fs.createWriteStream(filePath);
        doc.pipe(stream);

        // Measurements
        const pageWidth = doc.page.width;
        const pageHeight = doc.page.height;

        // Left photo panel (40% width)
        const leftWidth = Math.floor(pageWidth * 0.40);
        const leftX = 0;
        const leftY = 0;
        const leftHeight = pageHeight;

        // Right content area (60% width)
        const rightX = leftWidth;
        const rightWidth = pageWidth - leftWidth;
        const contentPadding = 50;

        // Draw left image (certificate background - 40% width)
        const certificateImagePath = path.resolve(__dirname, '..', '..', 'frontend', 'src', 'assets', 'certificate.png');
        if (fs.existsSync(certificateImagePath)) {
          doc.image(certificateImagePath, leftX, leftY, { 
            width: leftWidth, 
            height: leftHeight,
            align: 'center', 
            valign: 'center' 
          });
        } else {
          // fallback background
          doc.rect(leftX, leftY, leftWidth, leftHeight).fill('#E8F5E9');
        }

        // Add yellow circle design at top left corner
        const yellowCirclePath = path.resolve(__dirname, '..', '..', 'frontend', 'src', 'assets', 'yellow-circle.png');
        if (fs.existsSync(yellowCirclePath)) {
          const circleSize = 200;
          const circleX = leftWidth - 120;
          const circleY = -30;
          doc.image(yellowCirclePath, circleX, circleY, { width: circleSize, height: circleSize });
        }

        // Add yellow circle at bottom right corner
        if (fs.existsSync(yellowCirclePath)) {
          const circleSize = 180;
          const circleX = pageWidth - 90;
          const circleY = pageHeight - 150;
          doc.image(yellowCirclePath, circleX, circleY, { width: circleSize, height: circleSize });
        }

        // Header: "CERTIFICATE OF COMPLETION"
        const headerY = 45;
        doc.font('Helvetica-Bold').fontSize(22).fillColor('#1B5E20');
        doc.text('CERTIFICATE OF COMPLETION', rightX + contentPadding, headerY, { 
          width: rightWidth - (contentPadding * 2), 
          align: 'center' 
        });

        // Track current vertical position
        let currentY = doc.y + 20;

        // ChildFund India logo with 41 years badge - SMALLER SIZE
        const logoPath = path.resolve(__dirname, '..', '..', 'frontend', 'src', 'assets', '41-years.png');
        if (fs.existsSync(logoPath)) {
          const logoWidth = 70; // Reduced from 110 to 70
          const logoX = rightX + (rightWidth - logoWidth) / 2;
          doc.image(logoPath, logoX, currentY, { width: logoWidth });
          currentY += 100; // Reduced from 75 to 60
        } else {
          currentY += 50;
        }

        // "This certifies that" - MOVED TO BELOW LOGO
        doc.font('Helvetica').fontSize(12).fillColor('#000000');
        doc.text('This certifies that', rightX + contentPadding, currentY, { 
          width: rightWidth - (contentPadding * 2), 
          align: 'center' 
        });
        currentY = doc.y + 20;

        // Participant name - orange
        const displayName = (name || '(Insert name)').toUpperCase();
        doc.font('Helvetica-Bold').fontSize(28).fillColor('#FF6D00');
        doc.text(displayName, rightX + contentPadding, currentY, { 
          width: rightWidth - (contentPadding * 2), 
          align: 'center' 
        });
        currentY = doc.y + 18;

        // Achievement text - SPLIT INTO 3 LINES
        const paraX = rightX + contentPadding + 10;
        const paraWidth = rightWidth - (contentPadding * 2) - 20;
        
        doc.font('Helvetica').fontSize(11.5).fillColor('#000000');
        
        // Line 1
        doc.text('has successfully completed the training on', paraX, currentY, { 
          width: paraWidth, 
          align: 'center'
        });
        currentY = doc.y + 2;
        
        // Line 2 - Training name in bold italic
        doc.font('Helvetica-BoldOblique');
        doc.text('\'Online Safety and Digital Responsibility Training\'', paraX, currentY, { 
          width: paraWidth, 
          align: 'center'
        });
        currentY = doc.y + 2;
        
        // Line 3 - organised by ChildFund India
        doc.font('Helvetica');
        doc.text('organised by ChildFund India.', paraX, currentY, { 
          width: paraWidth, 
          align: 'center',
          continued: true
        });
        // doc.font('Helvetica-Bold').text('ChildFund India.');
        
        currentY = doc.y + 22;

        // Supporting paragraph
        const support = 'This training has equipped you with the knowledge and skills to stay safe, smart and responsible online, protecting yourself and others in the digital world.';
        doc.font('Helvetica').fontSize(10.5).fillColor('#444444');
        doc.text(support, rightX + contentPadding + 15, currentY, { 
          width: rightWidth - (contentPadding * 2) - 30, 
          align: 'center', 
          lineGap: 2 
        });
        currentY = doc.y + 30;

        // Signature section
        const sigWidth = 200;
        const sigX = rightX + (rightWidth - sigWidth) / 2;

        // Add signature image
        const signaturePath = path.resolve(__dirname, '..', '..', 'frontend', 'src', 'assets', 'signature.png');
        if (fs.existsSync(signaturePath)) {
          const sigImageWidth = 120;
          const sigImageX = sigX + (sigWidth - sigImageWidth) / 2;
          doc.image(signaturePath, sigImageX, currentY, { width: sigImageWidth });
          currentY += 50;
        } else {
          // Fallback
          doc.font('Helvetica-BoldOblique').fontSize(14).fillColor('#000000');
          doc.text('Anand Vishwakarma', sigX, currentY, { width: sigWidth, align: 'center' });
          currentY = doc.y + 6;
        }

        // Name and title below signature
        doc.font('Helvetica-Bold').fontSize(12).fillColor('#1B5E20');
        doc.text('Anand Vishwakarma', sigX, currentY, { width: sigWidth, align: 'center' });
        doc.font('Helvetica').fontSize(9.5).fillColor('#555555');
        doc.text('Executive Director, ChildFund India', sigX, doc.y + 2, { width: sigWidth, align: 'center' });

        // Footer: certificate number and issue date
        const footerY = pageHeight - 30;
        doc.fontSize(7.5).fillColor('#999999');
        doc.text(`Certificate No: ${certificateNumber}`, rightX + contentPadding, footerY, { 
          width: rightWidth - (contentPadding * 2), 
          align: 'center' 
        });
        doc.text(`Issue Date: ${issueDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}`, 
          rightX + contentPadding, doc.y + 1, { 
          width: rightWidth - (contentPadding * 2), 
          align: 'center' 
        });

        doc.end();

        stream.on('finish', () => {
          resolve({ certificateNumber, filePath: `/certificates/${fileName}`, fileName, issueDate });
        });

        stream.on('error', (err) => reject(err));
      } catch (err) {
        reject(err);
      }
    });
  }
}

export default new CertificateService();