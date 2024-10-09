const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const fs = require('fs');
const yaml = require('js-yaml');
const path = require('path');
const flash = require('connect-flash');
const { v4: uuidv4 } = require('uuid'); // Importer uuid pour générer des identifiants uniques

const app = express();
const PORT = 3000;

// Configurer le dossier public pour les fichiers statiques
app.use(express.static('public'));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({ secret: 'secret-key', resave: false, saveUninitialized: true }));
app.use(flash());

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
app.get('/', (req, res) => {
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
    users.push({ email, username, password, level: 1, vps: [] });
    saveUsers(users);
    res.send('Compte créé avec succès. <a href="/">Se connecter</a>');
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
        res.send('Email ou mot de passe incorrect. <a href="/">Réessayer</a>');
    }
});

// Page du tableau de bord
app.get('/dashboard', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/');
    }
    
    const users = loadUsers(); // Charge tous les utilisateurs
    const user = users.find(u => u.email === req.session.user.email); // Trouve l'utilisateur dans la liste

    res.render('dashboard', { user }); // Passe l'utilisateur avec ses VPS
});

// Page admin
app.get('/admin', (req, res) => {
    if (!req.session.user || req.session.user.level !== 2) {
        return res.send('Accès refusé. <a href="/">Se connecter</a>');
    }

    const users = loadUsers();
    res.render('admin', { user: req.session.user, users });
});

// Route pour ajouter un VPS
app.post('/add-vps', (req, res) => {
    const { email, vpsName, username, password, ram, disk, vcpu, ipv4, os } = req.body;
    const users = loadUsers();

    const user = users.find(user => user.email === email);
    if (!user) {
        req.flash('error', 'Utilisateur non trouvé.');
        return res.redirect('/admin');
    }

    // Ajouter un VPS à l'utilisateur avec un identifiant unique
    user.vps.push({
        id: uuidv4(), // Ajoute un identifiant unique
        vpsName,
        username,
        password,
        ram,
        disk,
        vcpu,
        ipv4,
        os
    });

    saveUsers(users);
    req.flash('success', 'VPS ajouté avec succès.');
    res.redirect('/admin');
});

// Route pour afficher les détails d'un VPS
app.get('/manage/:id', (req, res) => {
    const { id } = req.params;
    const users = loadUsers();
    const currentUser = req.session.user;

    if (!currentUser) {
        return res.redirect('/');
    }

    // Trouver le VPS correspondant à l'ID dans tous les VPS de tous les utilisateurs
    const user = users.find(u => u.vps && u.vps.some(v => v.id === id));
    const vps = user ? user.vps.find(v => v.id === id) : null;

    if (!vps) {
        return res.send('VPS non trouvé. <a href="/dashboard">Retourner au tableau de bord</a>');
    }

    // Passer les détails du VPS à la vue
    res.render('manage', { vps, user: currentUser });
});

// Route pour supprimer un VPS
app.post('/admin/delete-vps', (req, res) => {
    const { email, vpsId } = req.body;

    const users = loadUsers();
    const user = users.find(user => user.email === email);

    if (user && user.vps) {
        // Filtrer les VPS pour supprimer celui qui correspond à l'ID du VPS
        user.vps = user.vps.filter(vps => vps.id !== vpsId);

        // Sauvegarder les modifications
        saveUsers(users);

        req.flash('success', `VPS supprimé.`);
        res.redirect('/admin');
    } else {
        req.flash('error', 'Utilisateur ou VPS non trouvé.');
        res.redirect('/admin');
    }
});

// Route pour afficher tous les VPS (pour admin uniquement)
app.get('/admin/vps', (req, res) => {
    if (!req.session.user || req.session.user.level !== 2) {
        return res.send('Accès refusé. <a href="/">Se connecter</a>');
    }

    const users = loadUsers();
    let allVps = [];

    // Parcourir tous les utilisateurs pour récupérer leurs VPS
    users.forEach(user => {
        if (user.vps) {
            user.vps.forEach(vps => {
                allVps.push({
                    email: user.email,  // Ajouter l'email de l'utilisateur pour chaque VPS
                    vpsName: vps.vpsName,
                    ipv4: vps.ipv4,
                    os: vps.os,
                    id: vps.id // Ajouter l'identifiant du VPS
                });
            });
        }
    });

    const currentUser = req.session.user; 
    // Rendre la page admin/vps.ejs avec la liste des VPS
    res.render('admin/vps', { allVps, user: currentUser });
});

// Gestion de la déconnexion
app.get('/logout', (req, res) => {
    req.session.destroy();
    res.send('Déconnexion réussie. <a href="/">Se reconnecter</a>');
});

// Démarrage du serveur
app.listen(PORT, () => {
    console.log(`Serveur en cours d'exécution sur http://localhost:${PORT}`);
});
