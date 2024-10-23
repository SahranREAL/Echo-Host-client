# Echo-Host clients Version bêta 0.0.1
   | :exclamation:   L'espace client ne **hach** pas encore les mot de passe NE LEAK DONC PAS VOTRE USERS.YML                                             |
   |------------------------------------------------------------------------------------------------------------------------------------------------------|

# indépendence:
Pour configurer le projet **Echo-Host client** et installer les dépendances nécessaires, suivez les étapes ci-dessous. Je vais également inclure la configuration Nginx sans SSL.

### Étape 1 : Configuration du projet

1. **Créez un nouveau dossier pour votre projet :**
   ```bash
   mkdir echo-host-client
   cd echo-host-client
   ```

2. **Initialisez un nouveau projet Node.js :**
   ```bash
   npm init -y
   ```

### Étape 2 : Installer les dépendances

Installez les dépendances nécessaires pour votre projet avec les commandes suivantes :

```bash
npm install express body-parser express-session js-yaml connect-flash ejs uuid axios
```

### Étape 3 : Clone le github
Copier tout les fichier sois en téléchargant le projet sois en fesant:
```bash
git clone https://github.com/SahranREAL/Echo-Host-client/
```

### Étape 4 : Configuration Nginx

Voici un exemple de configuration Nginx pour votre projet (sans SSL) :

1. **Ouvrez ou créez un fichier de configuration pour votre site Nginx :**
   ```bash
   sudo nano /etc/nginx/sites-available/echo-host
   ```

2. **Ajoutez la configuration suivante :**

   ```nginx
   server {
       listen 5244;
       server_name client.echo-host.us.kg;

       location / {
           proxy_pass http://localhost:5243;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
   }

   ```

3. **Activez la configuration du site :**
   ```bash
   sudo ln -s /etc/nginx/sites-available/echo-host /etc/nginx/sites-enabled/
   ```

4. **Vérifiez la configuration de Nginx :**
   ```bash
   sudo nginx -t
   ```

5. **Redémarrez Nginx pour appliquer les modifications :**
   ```bash
   sudo systemctl restart nginx
   ```

### Étape 5 : Lancer votre application

1. **Démarrez votre serveur Node.js :**
   ```bash
   node server.js
   ```

Votre application devrait maintenant être accessible via le domaine ou l'adresse IP spécifiée dans la configuration Nginx. N'hésitez pas à ajuster les chemins et les paramètres selon vos besoins.
