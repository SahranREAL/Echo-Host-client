const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const flash = require('connect-flash'); // Importer connect-flash
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
app.use(flash()); // Utiliser connect-flash

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
    users.push({ email, username, password, level: 1 });
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
    res.render('dashboard', { user: req.session.user });
});

// Page admin
app.get('/admin', (req, res) => {
    if (!req.session.user || req.session.user.level !== 2) {
        return res.send('Accès refusé. <a href="/">Se connecter</a>');
    }
    res.render('admin', { 
        user: req.session.user, 
        messages: req.flash() // Assurez-vous que cette ligne est présente
    });
});

// Gestion de l'ajout de serveur VPS
app.post('/add-vps', (req, res) => {
    const { email, ram, disk, vcpu, ipv4, username, password, os } = req.body;
    const users = loadUsers();
    const user = users.find(user => user.email === email);

    if (!user) {
        return res.send('Utilisateur non trouvé. <a href="/admin">Retourner à l\'admin</a>');
    }

    // Ajoutez ici la logique pour créer un VPS (stockage, etc.)

    // Utiliser flash pour le message de succès
    req.flash('success', 'VPS ajouté avec succès!'); 
    res.redirect('/admin'); // Rediriger vers la page admin
});



// Gestion de la déconnexion
app.get('/logout', (req, res) => {
    req.session.destroy();
    res.send('Déconnexion réussie. <a href="/">Se reconnecter</a>');
});



// Gestion de l'ajout de serveur VPS
app.post('/add-vps', (req, res) => {
    const { email, username, password, ram, disk, vcpu, ipv4, os } = req.body;
    
    // Charge les utilisateurs depuis le fichier YAML
    const users = loadUsers();

    // Trouver l'utilisateur par son adresse e-mail
    const user = users.find(user => user.email === email);

    if (!user) {
        return res.send('Utilisateur non trouvé. <a href="/admin">Retour au tableau de bord</a>');
    }

    // Vérifie si l'utilisateur a déjà un VPS (par exemple dans un tableau)
    if (!user.vps) {
        user.vps = []; // Initialise le tableau VPS s'il n'existe pas
    }

    // Ajoute le VPS aux VPS de l'utilisateur
    user.vps.push({
        username,
        password,
        ram,
        disk,
        vcpu,
        ipv4,
        os
    });

    // Sauvegarde les utilisateurs modifiés dans le fichier YAML
    saveUsers(users);

    res.send('Serveur VPS ajouté avec succès à l\'utilisateur. <a href="/admin">Retour au tableau de bord</a>');
});
// Gestion de l'ajout de serveur VPS
app.post('/add-vps', (req, res) => {
    const { email, ram, disk, vcpu, ipv4, username, password, os } = req.body;
    const users = loadUsers();
    const user = users.find(user => user.email === email);

    if (!user) {
        return res.send('Utilisateur non trouvé. <a href="/admin">Retourner à l\'admin</a>');
    }

    // Ajoutez ici la logique pour créer un VPS (stockage, etc.)

    // Utiliser flash pour le message de succès
    req.flash('success', 'VPS ajouté avec succès!'); 
    res.redirect('/admin'); // Rediriger vers la page admin
});





// Démarrage du serveur
app.listen(PORT, () => {
    console.log(`Serveur en cours d'exécution sur http://localhost:${PORT}`);
});


