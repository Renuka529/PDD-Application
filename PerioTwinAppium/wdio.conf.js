const path = require('path');
const fs = require('fs');

exports.config = {
  runner: 'local',
  port: 4723,
  specs: [
    process.env.WDIO_CI_SPEC || './tests/**/*.test.js'
  ],
  exclude: [],
  maxInstances: 1,
  capabilities: [{
    platformName: 'Android',
    'appium:deviceName': 'Android Emulator',
    'appium:platformVersion': '10.0', // API level 29
    'appium:automationName': 'UiAutomator2',
    'appium:app': path.join(__dirname, '..', 'mobile', 'build', 'app', 'outputs', 'flutter-apk', 'app-debug.apk'),
    'appium:autoGrantPermissions': true,
    'appium:headless': true
  }],
  logLevel: 'info',
  bail: 0,
  waitforTimeout: 10000,
  connectionRetryTimeout: 120000,
  connectionRetryCount: 3,
  services: [], // appium service will be handled manually in shell script to prevent race conditions in GHA
  framework: 'mocha',
  reporters: ['spec'],
  mochaOpts: {
    ui: 'bdd',
    timeout: 180000
  },

  onPrepare: function (config, capabilities) {
    console.log('Appium Test Run Starting...');
    const resultsFile = path.join(__dirname, '.wdio-results.jsonl');
    if (fs.existsSync(resultsFile)) {
      fs.unlinkSync(resultsFile);
    }
  },

  afterTest: function (test, context, { error, result, duration, passed, retries }) {
    // Record test result into JSONL for aggregation in onComplete
    const resultsFile = path.join(__dirname, '.wdio-results.jsonl');
    const record = {
      title: test.title,
      parent: test.parent,
      status: passed ? 'Pass' : 'Fail',
      duration: duration || 0,
      error: error ? { message: error.message, stack: error.stack } : null,
      timestamp: new Date().toISOString()
    };
    fs.appendFileSync(resultsFile, JSON.stringify(record) + '\n');
  },

  after: function (result, capabilities, specs) {
    console.log('Finished spec file execution.');
  },

  onComplete: async function (exitCode, config, capabilities, results) {
    console.log('Appium Test Run Completed.');
    const resultsFile = path.join(__dirname, '.wdio-results.jsonl');
    
    // Fallback report generator if no tests ran or if it exited early
    if (!fs.existsSync(resultsFile)) {
      console.warn('No .wdio-results.jsonl found, compiling fallback reports...');
      try {
        const generateFallback = require('./utils/generateFallbackReport');
        await generateFallback();
      } catch (err) {
        console.error('Failed to generate fallback reports:', err);
      }
    }
  }
};
