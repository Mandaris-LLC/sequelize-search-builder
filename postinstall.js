const { exec } = require('child_process');

if (process.env.npm_lifecycle_event !== 'install' || process.env.INIT_CWD === process.cwd()) {
    exec('npm run install-husky', (error, stdout, stderr) => {
        if (error) {
            console.error(`Execution error: ${error}`);
            return;
        }
        console.log(`\nstdout: ${stdout}`);
        console.error(`stderr: ${stderr}`);
    });
} else {
}