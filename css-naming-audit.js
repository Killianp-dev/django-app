#!/usr/bin/env node

/**
 * CSS Naming Convention Audit Script
 * -----------------------------------
 * Ce script analyse les fichiers CSS et identifie les classes qui ne suivent pas la convention BEM.
 * Il génère un rapport avec des recommandations pour standardiser les nommages.
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Configuration
const cssDir = './src/static/css';
const outputFile = './css-naming-audit-report.md';

// Patterns pour identifier différentes conventions
const patterns = {
  camelCase: /\.([a-z]+[A-Z][a-zA-Z0-9]*)\b/g,
  pascalCase: /\.([A-Z][a-zA-Z0-9]*)\b/g,
  bemCorrect: /\.([a-z0-9]+(?:-[a-z0-9]+)*)(?:__[a-z0-9]+(?:-[a-z0-9]+)*)?(?:--[a-z0-9]+(?:-[a-z0-9]+)*)?/g,
  bemWrong: /\.([a-z0-9]+[A-Z][a-zA-Z0-9]*)__/g,
  inconsistentNaming: /\.([a-z0-9]+(?:-[a-z0-9]+)*)(_[a-z0-9]+)/g
};

// Résultats de l'audit
const auditResults = {
  camelCase: [],
  pascalCase: [],
  bemWrong: [],
  inconsistentNaming: [],
  recommendations: []
};

// Fonction pour scanner un fichier CSS
function scanCssFile(filePath) {
  console.log(`Scanning ${filePath}...`);
  const content = fs.readFileSync(filePath, 'utf8');
  const fileName = path.basename(filePath);
  
  // Chercher les patterns
  let match;
  
  // Recherche camelCase
  while ((match = patterns.camelCase.exec(content)) !== null) {
    auditResults.camelCase.push({
      file: fileName,
      class: match[0],
      line: getLineNumber(content, match.index),
      recommendation: convertToBem(match[1])
    });
  }
  
  // Recherche pascalCase
  while ((match = patterns.pascalCase.exec(content)) !== null) {
    auditResults.pascalCase.push({
      file: fileName,
      class: match[0],
      line: getLineNumber(content, match.index),
      recommendation: convertToBem(match[1])
    });
  }
  
  // Recherche BEM incorrect
  while ((match = patterns.bemWrong.exec(content)) !== null) {
    auditResults.bemWrong.push({
      file: fileName,
      class: match[0],
      line: getLineNumber(content, match.index),
      recommendation: convertToBem(match[1])
    });
  }
  
  // Recherche nommage inconsistant
  while ((match = patterns.inconsistentNaming.exec(content)) !== null) {
    auditResults.inconsistentNaming.push({
      file: fileName,
      class: match[0],
      line: getLineNumber(content, match.index),
      recommendation: match[0].replace('_', '__')
    });
  }
}

// Fonction pour obtenir le numéro de ligne
function getLineNumber(content, index) {
  const lines = content.substring(0, index).split('\n');
  return lines.length;
}

// Fonction pour convertir en BEM
function convertToBem(className) {
  // Convertir camelCase ou PascalCase en kebab-case
  const kebabCase = className
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .toLowerCase();
  
  return `.${kebabCase}`;
}

// Fonction principale
function runAudit() {
  console.log('Starting CSS naming convention audit...');
  
  // Récupérer tous les fichiers CSS
  const cssFiles = glob.sync(`${cssDir}/**/*.css`);
  
  // Scanner chaque fichier
  cssFiles.forEach(scanCssFile);
  
  // Générer des recommandations
  generateRecommendations();
  
  // Écrire le rapport
  writeReport();
  
  console.log(`Audit completed. Report saved to ${outputFile}`);
}

// Générer des recommandations
function generateRecommendations() {
  const allIssues = [
    ...auditResults.camelCase,
    ...auditResults.pascalCase,
    ...auditResults.bemWrong,
    ...auditResults.inconsistentNaming
  ];
  
  // Regrouper par fichier
  const fileGroups = {};
  allIssues.forEach(issue => {
    if (!fileGroups[issue.file]) {
      fileGroups[issue.file] = [];
    }
    fileGroups[issue.file].push(issue);
  });
  
  // Générer recommandations par fichier
  Object.keys(fileGroups).forEach(file => {
    auditResults.recommendations.push({
      file,
      issues: fileGroups[file],
      priority: fileGroups[file].length > 5 ? 'Haute' : 'Moyenne'
    });
  });
  
  // Trier par priorité
  auditResults.recommendations.sort((a, b) => 
    b.issues.length - a.issues.length
  );
}

// Écrire le rapport
function writeReport() {
  let report = `# Rapport d'audit des conventions de nommage CSS\n\n`;
  report += `*Date: ${new Date().toLocaleDateString()}*\n\n`;
  
  report += `## Résumé\n\n`;
  report += `- Classes en camelCase trouvées: ${auditResults.camelCase.length}\n`;
  report += `- Classes en PascalCase trouvées: ${auditResults.pascalCase.length}\n`;
  report += `- Classes BEM incorrectes: ${auditResults.bemWrong.length}\n`;
  report += `- Classes avec nommage inconsistant: ${auditResults.inconsistentNaming.length}\n\n`;
  
  report += `## Recommandations principales\n\n`;
  
  if (auditResults.recommendations.length === 0) {
    report += `Aucun problème détecté. Le code suit déjà la convention BEM.\n\n`;
  } else {
    auditResults.recommendations.forEach((rec, index) => {
      report += `### ${index + 1}. Fichier: ${rec.file} (Priorité: ${rec.priority})\n\n`;
      report += `| Ligne | Classe actuelle | Recommandation |\n`;
      report += `|-------|----------------|----------------|\n`;
      
      rec.issues.forEach(issue => {
        report += `| ${issue.line} | \`${issue.class}\` | \`${issue.recommendation}\` |\n`;
      });
      
      report += `\n`;
    });
  }
  
  report += `## Convention recommandée\n\n`;
  report += `Suivre la méthodologie BEM (Block Element Modifier) :\n\n`;
  report += `- Format: \`.bloc__element--modificateur\`\n`;
  report += `- Exemple: \`.card__title--large\`\n\n`;
  
  report += `## Instructions pour corriger\n\n`;
  report += `1. Commencer par les fichiers à priorité haute\n`;
  report += `2. Utiliser les rechercher/remplacer pour chaque classe\n`;
  report += `3. Vérifier les sélecteurs dans le HTML correspondant\n`;
  report += `4. Se référer au fichier \`src/static/css/base/_naming-conventions.css\` pour les conventions\n`;
  
  fs.writeFileSync(outputFile, report);
}

// Exécuter l'audit
runAudit(); 