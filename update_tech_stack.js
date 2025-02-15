const { Octokit } = require('@octokit/rest');
const fs = require('fs');
const path = require('path');

// Configure GitHub token
const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

// Badge template function
const createBadge = (name, color, logo) => {
  return `![${name}](https://img.shields.io/badge/-${name}-${color}?style=flat&logo=${logo.toLowerCase()}&logoColor=white)`;
};

// Language color mapping
const languageColors = {
  Python: '3776AB',
  JavaScript: 'F7DF1E',
  TypeScript: '3178C6',
  HTML: 'E34F26',
  CSS: '1572B6',
  PHP: '777BB4',
  Java: 'ED8B00',
  'C#': '239120',
  Ruby: 'CC342D',
  Go: '00ADD8',
  Swift: 'FA7343',
  Kotlin: '7F52FF',
  Rust: '000000',
};

async function getTopLanguages(username) {
  try {
    // Get user's repositories
    const { data: repos } = await octokit.repos.listForUser({
      username,
      per_page: 100,
      sort: 'updated',
    });

    // Get language stats for each repo
    const languageStats = {};
    
    for (const repo of repos) {
      if (!repo.fork) { // Skip forked repositories
        const { data: languages } = await octokit.repos.listLanguages({
          owner: username,
          repo: repo.name,
        });

        // Sum up bytes for each language
        for (const [lang, bytes] of Object.entries(languages)) {
          languageStats[lang] = (languageStats[lang] || 0) + bytes;
        }
      }
    }

    // Convert to percentage and sort
    const total = Object.values(languageStats).reduce((a, b) => a + b, 0);
    const languagePercentages = Object.entries(languageStats)
      .map(([lang, bytes]) => ({
        name: lang,
        percentage: (bytes / total) * 100,
      }))
      .sort((a, b) => b.percentage - a.percentage)
      .slice(0, 7); // Get top 7 languages

    return languagePercentages;
  } catch (error) {
    console.error('Error fetching language stats:', error);
    return [];
  }
}

async function updateReadme(username) {
  try {
    // Get top languages
    const topLanguages = await getTopLanguages(username);
    
    // Create badges
    const badges = topLanguages.map(lang => 
      createBadge(
        lang.name,
        languageColors[lang.name] || '555555',
        lang.name
      )
    ).join('\n');

    // Read current README
    const readmePath = path.join(__dirname, 'README.md');
    let readme = fs.readFileSync(readmePath, 'utf8');

    // Update Tech Stack section
    const techStackRegex = /(### Linguagens & Frameworks\n)([\s\S]*?)(###|$)/;
    const updatedReadme = readme.replace(
      techStackRegex,
      `### Linguagens & Frameworks\n${badges}\n\n###`
    );

    // Write updated README
    fs.writeFileSync(readmePath, updatedReadme);
    
    console.log('README updated successfully!');
  } catch (error) {
    console.error('Error updating README:', error);
  }
}

// Run the update
updateReadme('Lucasdoreac');