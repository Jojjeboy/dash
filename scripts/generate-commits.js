import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const publicDir = path.join(__dirname, '../public');
const outputPath = path.join(publicDir, 'commits.json');

// Ensure public directory exists
if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
}

function getCommits() {
    try {
        // Check if we are in a git repository
        execSync('git rev-parse --is-inside-work-tree', { stdio: 'ignore' });

        // Get the last 20 commits
        // Format: hash|date|message
        const logOutput = execSync('git log -n 20 --pretty=format:"%H|%ad|%s" --date=iso', {
            encoding: 'utf-8',
            stdio: ['ignore', 'pipe', 'ignore']
        });

        if (!logOutput) return [];

        return logOutput.split('\n').map(line => {
            const [hash, date, message] = line.split('|');
            if (!hash) return null;
            return {
                hash: hash.substring(0, 7),
                fullHash: hash,
                date,
                message
            };
        }).filter(Boolean);
    } catch {
        console.warn('Git log failed or not a git repository. Using fallback data.');

        // Fallback for GitHub Actions or non-git environments
        if (process.env.GITHUB_SHA) {
            return [{
                hash: process.env.GITHUB_SHA.substring(0, 7),
                fullHash: process.env.GITHUB_SHA,
                date: new Date().toISOString(),
                message: process.env.GITHUB_EVENT_NAME === 'push'
                    ? 'Latest deployment from GitHub push'
                    : 'Latest deployment from GitHub Action'
            }];
        }

        return [];
    }
}

try {
    const commits = getCommits();
    const jsonContent = JSON.stringify(commits, null, 2);

    fs.writeFileSync(outputPath, jsonContent);
    console.log(`Successfully generated ${outputPath} with ${commits.length} commits.`);
} catch (error) {
    console.error('Failed to write commits.json:', error);
    process.exit(1);
}
