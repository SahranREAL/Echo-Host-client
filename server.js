const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const fs = require('fs');
const yaml = require('js-yaml');
const path = require('path');

const app = express();
const PORT = 3000;

// Configurer le dossier public pour les fichiers statiques
app.use(express.static('public'));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({ secret: 'secret-key', resave: false, saveUninitialized: true }));

const yamlFile = 'users.yml';

// Fonction pour charger les utilisateurs depuis le fichier YAML
const loadUsers = () => {
    try {
        const doc = fs.readFileSync(yamlFile, 'utf8');
        return yaml.load(doc) || [];
    } catch (e) {
        return [];
    }
};

// Fonction pour sauvegarder les utilisateurs dans le fichier YAML
const saveUsers = (users) => {
    const yamlStr = yaml.dump(users);
    fs.writeFileSync(yamlFile, yamlStr, 'utf8');
};

// Page de connexion
app.get('/login', (req, res) => {
    res.render('login');
});

// Page de création de compte
app.get('/register', (req, res) => {
    res.render('register');
});

// Gestion de la création de compte
app.post('/register', (req, res) => {
    const { email, username, password } = req.body;
    const users = loadUsers();

    // Vérifie si l'utilisateur existe déjà
    if (users.find(user => user.email === email)) {
        return res.send('Utilisateur déjà existant. <a href="/register">Essayez un autre email</a>');
    }

    // Ajoute l'utilisateur avec un niveau par défaut (1)
    users.push({ email, username, password, level: 1 });
    saveUsers(users);
    res.send('Compte créé avec succès. <a href="/login">Se connecter</a>');
});

// Gestion de la connexion
app.post('/login', (req, res) => {
    const { email, password } = req.body;
    const users = loadUsers();

    const user = users.find(user => user.email === email && user.password === password);
    if (user) {
        req.session.user = user; // Stocke l'utilisateur dans la session
        res.redirect('/dashboard'); // Redirige vers le tableau de bord
    } else {
        res.send('Email ou mot de passe incorrect. <a href="/login">Réessayer</a>');
    }
});

// Page du tableau de bord
app.get('/dashboard', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }
    res.render('dashboard', { user: req.session.user });
});

// Page admin
app.get('/admin', (req, res) => {
    if (!req.session.user || req.session.user.level !== 2) {
        return res.send('Accès refusé. <a href="/login">Se connecter</a>');
    }
    res.render('admin', { user: req.session.user });
});

// Gestion de la déconnexion
app.get('/logout', (req, res) => {
    req.session.destroy();
    res.send('Déconnexion réussie. <a href="/login">Se reconnecter</a>');
});

// Démarrage du serveur
app.listen(PORT, () => {
    console.log(`Serveur en cours d'exécution sur http://localhost:${PORT}`);
});
