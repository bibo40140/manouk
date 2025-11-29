#!/usr/bin/env node

/**
 * Script d'installation automatique pour Manouk PWA
 * Ce script vérifie la configuration et guide l'utilisateur
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

console.log('\n🚀 Installation de Manouk PWA\n');
console.log('Ce script va configurer votre application en quelques minutes.\n');

async function main() {
  // Vérifier si .env.local existe
  const envPath = path.join(__dirname, '.env.local');
  const envExists = fs.existsSync(envPath);
  
  if (!envExists) {
    console.log('❌ Fichier .env.local introuvable\n');
    process.exit(1);
  }

  // Lire le contenu actuel
  const envContent = fs.readFileSync(envPath, 'utf-8');
  
  // Vérifier si déjà configuré
  if (!envContent.includes('your_') && !envContent.includes('votre-projet')) {
    console.log('✅ Supabase semble déjà configuré !\n');
    console.log('Lancement du serveur...\n');
    process.exit(0);
  }

  console.log('📋 Configuration de Supabase nécessaire\n');
  console.log('Étapes à suivre :\n');
  console.log('1. Ouvrez https://supabase.com dans votre navigateur');
  console.log('2. Créez un compte gratuit (avec Google c\'est rapide)');
  console.log('3. Créez un nouveau projet :');
  console.log('   - Nom: manouk-app');
  console.log('   - Région: Europe (Frankfurt)');
  console.log('   - Mot de passe: notez-le quelque part');
  console.log('4. Attendez 2 minutes que le projet soit créé\n');
  
  const ready = await question('Avez-vous créé le projet Supabase ? (o/n) : ');
  
  if (ready.toLowerCase() !== 'o') {
    console.log('\n⏸️  Installation mise en pause. Relancez ce script après avoir créé le projet.\n');
    rl.close();
    return;
  }

  console.log('\n5. Dans Supabase, allez dans Settings > API');
  console.log('6. Copiez le "Project URL" et la clé "anon public"\n');
  
  const url = await question('Collez votre Project URL : ');
  const key = await question('Collez votre clé anon public : ');
  
  if (!url || !key || url.length < 10 || key.length < 10) {
    console.log('\n❌ URL ou clé invalide. Veuillez réessayer.\n');
    rl.close();
    return;
  }

  // Mettre à jour .env.local
  const newEnv = `# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=${url.trim()}
NEXT_PUBLIC_SUPABASE_ANON_KEY=${key.trim()}
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
`;

  fs.writeFileSync(envPath, newEnv);
  console.log('\n✅ Fichier .env.local mis à jour !\n');
  
  console.log('📊 Prochaine étape : Créer les tables dans Supabase\n');
  console.log('1. Dans Supabase, allez dans SQL Editor');
  console.log('2. Cliquez sur "New Query"');
  console.log('3. Ouvrez le fichier supabase-schema.sql dans VSCode');
  console.log('4. Copiez TOUT le contenu (Ctrl+A puis Ctrl+C)');
  console.log('5. Collez dans Supabase SQL Editor');
  console.log('6. Cliquez sur "Run" ou appuyez sur Ctrl+Enter');
  console.log('7. Vérifiez que vous voyez "Success"\n');
  
  const tablesReady = await question('Avez-vous exécuté le script SQL ? (o/n) : ');
  
  if (tablesReady.toLowerCase() === 'o') {
    console.log('\n🎉 Configuration terminée !\n');
    console.log('Lancez maintenant : npm run dev\n');
    console.log('Puis ouvrez http://localhost:3000\n');
  } else {
    console.log('\n⚠️  N\'oubliez pas d\'exécuter le script SQL avant de tester l\'application.\n');
  }
  
  rl.close();
}

main().catch(err => {
  console.error('❌ Erreur:', err);
  rl.close();
});
