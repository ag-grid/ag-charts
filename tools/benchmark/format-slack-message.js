#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const logFile = './reports/benchmark.log';
const benchmarkLog = fs.readFileSync(logFile, 'utf8').toString();

let channel = process.env.SLACK_CHANNEL;
let username = process.env.SLACK_USERNAME;
let icon_url = process.env.SLACK_ICON;

if (!channel) throw new Error('SLACK_CHANNEL is not set');
if (!username) throw new Error('SLACK_USERNAME is not set');
if (!icon_url) throw new Error('SLACK_ICON is not set');

// See https://api.slack.com/methods/chat.postMessage
const slackMessage = {
    channel,
    username,
    icon_url,
    text: `\`\`\`\n${benchmarkLog}\n\`\`\`\n`,
};

console.log(JSON.stringify(slackMessage, null, 2));
