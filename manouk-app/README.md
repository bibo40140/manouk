# manouk-gestion

Application Electron pour gestion factures / achats / stock (Manouk).

Contenu du dépôt : code source de l'application et dépendances listées dans `package.json`.

Pour lancer en développement :

```powershell
npm install
npm start
```

Notes :
- Les fichiers générés (ex: PDFs) sont sauvegardés dans le dossier `app.getPath('userData')/invoices`.
- Configure SMTP dans les Paramètres pour envoyer des emails.
