# Echo-Host cliet

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
npm install express body-parser express-session js-yaml connect-flash ejs uuid
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
        listen 80;
          server_name your_domain_or_ip;  # Remplacez par votre domaine ou votre adresse IP

    location /public/ {
        alias /var/www/echo-host/public/;  # Chemin vers le dossier public
        try_files $uri $uri/ =404;  # Gérer les fichiers non trouvés
    }

    location / {
        proxy_pass http://localhost:3000;  # Remplacez par le port que votre serveur Express utilise
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
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
