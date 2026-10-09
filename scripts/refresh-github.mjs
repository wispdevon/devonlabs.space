import { writeFile } from 'node:fs/promises';
const headers = { Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' };
if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
const response = await fetch('https://api.github.com/users/wispdevon/repos?per_page=100&sort=updated', { headers });
if (!response.ok) throw new Error(`GitHub refresh failed: ${response.status}. Existing snapshot preserved.`);
const repos = await response.json();
const snapshot = Object.fromEntries(repos.map(repo => [repo.name, { stars: repo.stargazers_count, url: repo.html_url, license: repo.license?.spdx_id === 'NOASSERTION' ? null : repo.license?.spdx_id || null, updatedAt: repo.pushed_at, fork: repo.fork }]));
await writeFile(new URL('../data/github.json', import.meta.url), JSON.stringify(snapshot, null, 2) + '\n');
console.log(`Refreshed ${repos.length} public repositories for wispdevon.`);
