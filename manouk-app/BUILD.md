# 📦 Créer l'exécutable Windows (.exe)

## Prérequis
- Node.js installé
- Application fonctionnelle avec `npm start`

## Étapes de compilation

### 1. Installer electron-builder
```bash
npm install electron-builder --save-dev
```

### 2. (Optionnel) Créer une icône
- Placez un fichier `icon.ico` dans un dossier `build/` à la racine
- Si pas d'icône, electron-builder utilisera l'icône par défaut

### 3. Builder l'application
```bash
npm run build
```

Cela va :
- Compiler l'application
- Créer un installeur Windows (NSIS)
- Générer les fichiers dans le dossier `dist/`

### 4. Récupérer l'exécutable
Après la compilation, vous trouverez :
- **dist/Manouk Gestion Setup 1.0.0.exe** : Installeur Windows
- **dist/win-unpacked/** : Version portable (sans installation)

## Exécuter l'installeur
Double-cliquez sur `Manouk Gestion Setup 1.0.0.exe` pour installer l'application sur votre PC.

## Distribution
Vous pouvez partager le fichier `.exe` avec d'autres utilisateurs Windows. Ils pourront l'installer sans avoir Node.js.

## Problèmes courants

### "better-sqlite3" erreur de compilation
Si vous avez une erreur avec `better-sqlite3`, exécutez :
```bash
npm run build -- --no-asar
```

### Taille importante du fichier
Normal ! L'exécutable contient :
- Electron (runtime Chromium)
- Node.js
- Toutes vos dépendances
- Comptez environ 150-200 MB

## Options avancées

### Créer seulement un portable (sans installeur)
```bash
npm run build -- --dir
```

### Compiler pour plusieurs plateformes
```bash
npm run dist  # Windows + macOS + Linux
```

---

**Version actuelle :** 1.0.0  
**Dernière modification :** 26/11/2025
