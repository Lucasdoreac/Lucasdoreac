const { Octokit } = require('@octokit/rest');
const fs = require('fs');
const path = require('path');

// Configure GitHub token
const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

// Badge template function
const createBadge = (name, color, logo) => {
  return `<img alt="${name}" src="https://img.shields.io/badge/${name}-${color}?style=for-the-badge&logo=${logo.toLowerCase()}&logoColor=white"/>`;
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
  'Three.js': '000000',
};

// Framework and tools mapping
const frameworksAndTools = {
  'React': '61DAFB',
  'Node.js': '339933',
  'Express': '000000',
  'MongoDB': '47A248',
  'Git': 'F05032',
  'Docker': '2496ED',
  'Three.js': '000000',
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
        try {
          const { data: languages } = await octokit.repos.listLanguages({
            owner: username,
            repo: repo.name,
          });

          // Sum up bytes for each language
          for (const [lang, bytes] of Object.entries(languages)) {
            languageStats[lang] = (languageStats[lang] || 0) + bytes;
          }
        } catch (error) {
          console.log(`Skipping repo ${repo.name}: ${error.message}`);
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
    
    // Add frameworks and tools based on repo analysis
    const technologies = [
      ...topLanguages.map(lang => ({
        name: lang.name,
        color: languageColors[lang.name] || '555555',
        logo: lang.name
      })),
      // Add common frameworks and tools
      { name: 'React', color: frameworksAndTools['React'], logo: 'react' },
      { name: 'Git', color: frameworksAndTools['Git'], logo: 'git' },
      { name: 'Three.js', color: frameworksAndTools['Three.js'], logo: 'three.js' }
    ];
    
    // Create badges
    const badges = technologies
      .filter((tech, index, self) => 
        index === self.findIndex((t) => t.name === tech.name)
      ) // Remove duplicates
      .map(tech => createBadge(tech.name, tech.color, tech.logo))
      .join('\n  ');

    // Read current README
    const readmePath = path.join(__dirname, 'README.md');
    let readme = fs.readFileSync(readmePath, 'utf8');

    // Update Tech Stack section - look for the correct pattern
    const techStackRegex = /(### 🛠️ Stack Tecnológico\n<div style="display: inline_block">)([\s\S]*?)(<\/div>)/;
    
    if (!techStackRegex.test(readme)) {
      console.log('Could not find Tech Stack section in README. Please ensure the section exists with the correct heading.');
      return;
    }

    const updatedReadme = readme.replace(
      techStackRegex,
      `### 🛠️ Stack Tecnológico\n<div style="display: inline_block">\n  ${badges}\n</div>`
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
