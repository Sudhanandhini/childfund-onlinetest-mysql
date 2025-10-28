import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Certificate storage configuration
const certificateConfig = {
  // Base directory for storing certificates
  certificatesDir: path.join(__dirname, '..', 'certificates'),
  
  // URL path for accessing certificates
  certificatesUrlPath: '/certificates',
  
  // Initialize certificate storage
  init: () => {
    // Create certificates directory if it doesn't exist
    if (!fs.existsSync(certificateConfig.certificatesDir)) {
      fs.mkdirSync(certificateConfig.certificatesDir, { recursive: true });
    }
  },
  
  // Get absolute path for a certificate file
  getFilePath: (fileName) => {
    return path.join(certificateConfig.certificatesDir, fileName);
  },
  
  // Get URL path for a certificate file
  getUrlPath: (fileName) => {
    return `${certificateConfig.certificatesUrlPath}/${fileName}`;
  }
};

export default certificateConfig;