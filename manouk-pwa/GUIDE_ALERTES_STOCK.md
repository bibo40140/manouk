# 📧 Système d'Alertes Stock Automatiques

## 📋 Vue d'ensemble

Le système d'alertes stock envoie automatiquement des emails lorsque les matières premières atteignent leur seuil d'alerte. Les alertes sont déclenchées automatiquement après chaque production ou achat.

---

## 🔄 Fonctionnement Automatique

### Déclencheurs automatiques

Les alertes sont vérifiées et envoyées automatiquement après :

1. **Création d'une production** 🏭
   - Les matières premières sont décomptées
   - Le système vérifie si des seuils sont atteints
   - Les emails sont envoyés automatiquement

2. **Enregistrement d'un achat** 🛒
   - Après validation de l'achat
   - Vérifie si d'autres matières nécessitent un réapprovisionnement
   - Envoie les alertes pour les articles en dessous du seuil

### Processus d'envoi

```
Production/Achat
    ↓
Modification du stock
    ↓
Appel API /api/stock/process-alerts
    ↓
Vérification des seuils
    ↓
Création des alertes en base de données
    ↓
Envoi des emails
    ↓
Marquage des alertes comme envoyées
```

---

## 🗄️ Structure de la Base de Données

### Table `stock_alerts`

```sql
CREATE TABLE stock_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  item_type TEXT NOT NULL,              -- 'raw_material' ou 'product'
  item_id UUID NOT NULL,                 -- ID de la matière première
  item_name TEXT NOT NULL,               -- Nom de l'article
  current_stock DECIMAL(10,4),           -- Stock actuel
  alert_threshold DECIMAL(10,4),         -- Seuil d'alerte
  company_id UUID REFERENCES companies,
  email_sent BOOLEAN DEFAULT FALSE,      -- Email envoyé ?
  email_sent_date TIMESTAMPTZ,          -- Date d'envoi
  created_at TIMESTAMPTZ DEFAULT NOW()
)
```

### Trigger PostgreSQL

Un trigger automatique crée une alerte lorsque le stock d'une matière première passe sous son seuil :

```sql
-- Fichier: scripts/enable-auto-stock-alerts.sql
CREATE TRIGGER trigger_auto_stock_alert
  AFTER UPDATE OF stock ON raw_materials
  FOR EACH ROW
  EXECUTE FUNCTION send_stock_alert_email();
```

**⚠️ Important** : Ce trigger crée l'alerte en base mais ne l'envoie pas immédiatement. L'envoi se fait via l'API `/api/stock/process-alerts`.

---

## 🛠️ Fichiers Modifiés/Créés

### 1. API d'envoi des alertes
**Fichier** : `app/api/stock/process-alerts/route.ts`

- Récupère toutes les alertes non envoyées (`email_sent = false`)
- Envoie un email HTML formaté pour chaque alerte
- Marque les alertes comme envoyées
- Utilise nodemailer avec la configuration SMTP

### 2. Appel après production
**Fichier** : `app/api/create-production/route.ts`

```typescript
// Après enregistrement de la production
try {
  const alertsUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/stock/process-alerts`;
  await fetch(alertsUrl, { method: 'POST' });
} catch (alertError) {
  // Ne pas bloquer la production
}
```

### 3. Appel après achat
**Fichier** : `components/purchases/PurchaseModal.tsx`

```typescript
// Après insertion de l'achat
try {
  await fetch('/api/stock/process-alerts', { method: 'POST' })
} catch (alertError) {
  // Ne pas bloquer l'achat
}
```

### 4. Page de gestion des alertes
**Fichier** : `app/dashboard/stock-alerts/page.tsx`

- Page serveur Next.js
- Récupère toutes les alertes avec les infos des sociétés
- Passe les données au composant client

### 5. Composant d'affichage
**Fichier** : `components/stock/StockAlerts.tsx`

- Affiche les alertes en attente et envoyées
- Bouton pour envoyer manuellement les alertes
- Statistiques : nombre en attente, envoyées, total
- Tables avec détails complets

### 6. Script SQL
**Fichier** : `scripts/enable-auto-stock-alerts.sql`

- Fonction PostgreSQL `send_stock_alert_email()`
- Trigger `trigger_auto_stock_alert`
- À exécuter sur Supabase en production

### 7. Navigation mise à jour
**Fichier** : `components/Sidebar.tsx`

- Ajout du menu "Productions" 🏭
- Ajout du menu "Alertes Stock" 🔔

---

## 📧 Format de l'Email

### Objet
```
🚨 Alerte Stock: [Nom de la matière première]
```

### Contenu HTML

L'email contient :
- **Header rouge** avec titre "🚨 Alerte de Stock"
- **Boîte d'alerte** avec le nom de l'article
- **Statistiques** : Stock actuel vs Seuil d'alerte
- **Action recommandée** : Passer une commande
- **Footer** : Date et heure de l'alerte

**Design** : Professionnel avec styles inline pour compatibilité email maximale.

---

## 🔧 Configuration Requise

### Variables d'environnement

```env
# SMTP (déjà configuré)
SMTP_HOST=smtp.ionos.fr
SMTP_PORT=587
SMTP_USER=manouk@sophietissot.com
SMTP_PASSWORD=votre_mot_de_passe

# URL du site (pour les appels API internes)
NEXT_PUBLIC_SITE_URL=https://votre-domaine.vercel.app
```

### Supabase

1. Exécuter le script SQL :
```sql
-- Dans Supabase SQL Editor
\i scripts/enable-auto-stock-alerts.sql
```

2. Vérifier que la table `stock_alerts` existe et est accessible

---

## 📊 Utilisation

### Automatique (Recommandé)

Les alertes s'envoient automatiquement sans intervention :

1. **Production d'un produit** → Matières décomptées → Alertes envoyées
2. **Achat de matière** → Stock mis à jour → Alertes envoyées

### Manuel (via Dashboard)

Accéder à : `/dashboard/stock-alerts`

**Fonctionnalités** :
- ✅ Voir toutes les alertes (en attente + envoyées)
- ✅ Statistiques en temps réel
- ✅ Bouton "Envoyer X alerte(s)" pour envoi manuel
- ✅ Historique des alertes envoyées

---

## 🎯 Scénarios d'utilisation

### Scénario 1 : Production normale

1. Sophie crée une production de 10 étuis à lunette
2. Le système décompte automatiquement :
   - 10 x tissu
   - 10 x élastique
   - etc.
3. Le stock de "tissu" passe de 15 à 5 (seuil = 10)
4. ✉️ Email automatique envoyé à `manouk@sophietissot.com`

### Scénario 2 : Achat de matière première

1. Sophie achète 50 unités de "élastique"
2. Le stock passe de 3 à 53
3. Le système vérifie tous les autres stocks
4. Si "tissu" est toujours en alerte → Email envoyé

### Scénario 3 : Consultation manuelle

1. Sophie ouvre `/dashboard/stock-alerts`
2. Voit 3 alertes en attente d'envoi
3. Clique sur "Envoyer 3 alertes"
4. Emails envoyés immédiatement
5. Alertes marquées comme envoyées

---

## 🛡️ Sécurité et Fiabilité

### Gestion d'erreurs

```typescript
try {
  await fetch('/api/stock/process-alerts', { method: 'POST' })
} catch (alertError) {
  console.error('Erreur envoi alertes:', alertError)
  // ⚠️ Ne JAMAIS bloquer la production/achat
}
```

**Principe** : Si l'envoi d'alertes échoue, la production/achat continue normalement.

### Prévention des doublons

- Une alerte n'est envoyée qu'**une fois toutes les 24h** pour le même article
- Vérification dans le trigger PostgreSQL :

```sql
IF NOT EXISTS (
  SELECT 1 FROM stock_alerts 
  WHERE item_id = NEW.id 
    AND email_sent = TRUE 
    AND created_at > NOW() - INTERVAL '24 hours'
) THEN
  -- Créer l'alerte
END IF
```

### Logs détaillés

Tous les envois sont tracés dans la console :
```
🔔 [STOCK ALERTS] Checking for pending alerts...
📧 [STOCK ALERTS] Found 3 pending alert(s)
✅ [STOCK ALERTS] Email sent to manouk@sophietissot.com for Tissu rouge
📊 [STOCK ALERTS] Summary: 3 sent, 0 errors
```

---

## 📈 Améliorations Futures

### Court terme
- [ ] Ajouter un badge dans le menu "Alertes Stock (3)"
- [ ] Notification toast après envoi automatique
- [ ] Filtres par société dans la page alertes

### Moyen terme
- [ ] Fréquence d'alerte configurable (24h, 48h, 1 semaine)
- [ ] Alertes groupées (1 email pour toutes les alertes d'une société)
- [ ] Graphique historique des alertes

### Long terme
- [ ] Intégration SMS/Telegram
- [ ] Prédiction de rupture de stock basée sur historique
- [ ] Suggestion automatique de quantité à commander

---

## 🧪 Tests

### Test en local

1. **Créer une production** qui décompte beaucoup de matières
2. **Vérifier la console** : doit afficher `📧 Alertes envoyées`
3. **Ouvrir `/dashboard/stock-alerts`** : voir les alertes
4. **Cliquer "Envoyer"** : emails envoyés

### Test en production

1. Exécuter `scripts/enable-auto-stock-alerts.sql` sur Supabase
2. Configurer SMTP dans les variables d'environnement Vercel
3. Créer une production de test
4. Vérifier réception email

---

## 📞 Support

En cas de problème :

1. **Vérifier les logs** dans la console Next.js
2. **Vérifier la table** `stock_alerts` dans Supabase
3. **Tester l'API** manuellement :
   ```bash
   curl -X POST https://votre-domaine.vercel.app/api/stock/process-alerts
   ```

---

## ✅ Résumé

✅ **Automatique** : Alertes envoyées après chaque production/achat  
✅ **Fiable** : Gestion d'erreurs robuste, ne bloque jamais les opérations  
✅ **Traçable** : Historique complet dans la base de données  
✅ **Flexible** : Envoi manuel possible via le dashboard  
✅ **Professionnel** : Emails HTML formatés avec logo et design  

Le système est **prêt pour la production** ! 🚀
