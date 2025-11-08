const cron = require('node-cron');
const { exec } = require('child_process');
const path = require('path');

// Schedule the daily commission processing to run at midnight every day
cron.schedule('0 0 * * *', () => {
  console.log('Running daily commission processing...');
  
  const scriptPath = path.join(__dirname, 'processDailyCommissions.js');
  
  exec(`node ${scriptPath}`, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error executing daily commission script: ${error}`);
      return;
    }
    if (stderr) {
      console.error(`Daily commission script stderr: ${stderr}`);
      return;
    }
    console.log(`Daily commission script stdout: ${stdout}`);
  });
});

console.log('Cron job for daily commission processing has been scheduled'); 