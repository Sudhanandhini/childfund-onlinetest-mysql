// helper file for previewing PDF generation - not used by the app
// This file shows how pdfkit is used. The real change will be applied to certificateService.js
import PDFDocument from 'pdfkit';
import fs from 'fs';

const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 50 });
const stream = fs.createWriteStream('test_certificate.pdf');
doc.pipe(stream);

doc.fontSize(30).text('CERTIFICATE OF APPRECIATION', { align: 'center' });
doc.moveDown();
doc.fontSize(20).text('ChildFund India', { align: 'center' });
doc.moveDown(2);
doc.fontSize(40).text('Participant Name', { align: 'center' });

doc.end();
stream.on('finish', () => console.log('PDF written'));
