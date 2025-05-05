const cron = require('node-cron');
const { checkAndUnenrollEndingClasses } = require('./autoUnenroll');

// Schedule the task to run daily at midnight
cron.schedule('0 0 * * *', () => {
    console.log('Running daily class unenrollment check...');
    checkAndUnenrollEndingClasses();
});

console.log('Scheduler started. Will run daily at midnight.'); 