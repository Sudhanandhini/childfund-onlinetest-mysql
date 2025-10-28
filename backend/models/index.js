// models/index.js
import User from './User.js';
import Submission from './Submission.js';
import Answer from './Answer.js';
import Certificate from './Certificate.js';

// Guard so associations are defined only once if this module is imported multiple times
function initAssociations() {
  // User - Submission (1:N)
  if (!User.associations || !User.associations.submissions) {
    User.hasMany(Submission, {
      foreignKey: 'userId',
      as: 'submissions',
      onDelete: 'CASCADE',
    });

    Submission.belongsTo(User, {
      foreignKey: 'userId',
      as: 'user',
    });
  }

  // User - Certificate (1:1)
  if (!User.associations || !User.associations.certificate) {
    User.hasOne(Certificate, {
      foreignKey: 'userId',
      as: 'certificate',
      onDelete: 'CASCADE',
    });

    Certificate.belongsTo(User, {
      foreignKey: 'userId',
      as: 'user',
    });
  }

  // Submission - Answer (1:N)
  if (!Submission.associations || !Submission.associations.answers) {
    Submission.hasMany(Answer, {
      foreignKey: 'submissionId',
      as: 'answers',
      onDelete: 'CASCADE',
    });

    Answer.belongsTo(Submission, {
      foreignKey: 'submissionId',
      as: 'submission',
    });
  }
}

// initialize associations immediately
initAssociations();

// Export all models from one place
export { User, Submission, Answer, Certificate };
