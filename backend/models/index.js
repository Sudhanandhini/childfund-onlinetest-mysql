import User from './User.js';
import Submission from './Submission.js';
import Answer from './Answer.js';

// User has many Submissions
User.hasMany(Submission, {
  foreignKey: 'userId',
  as: 'submissions',
  onDelete: 'CASCADE'
});

Submission.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

// Submission has many Answers
Submission.hasMany(Answer, {
  foreignKey: 'submissionId',
  as: 'answers',
  onDelete: 'CASCADE'
});

Answer.belongsTo(Submission, {
  foreignKey: 'submissionId',
  as: 'submission'
});

export { User, Submission, Answer };