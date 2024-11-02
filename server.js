const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const fs = require('fs');
const yaml = require('js-yaml');
const path = require('path');
const flash = require('connect-flash');
const { v4: uuidv4 } = require('uuid'); // Importer uuid pour gÃƒÂ©nÃƒÂ©rer des identifiants uniques
const axios = require('axios');

const app = express();
const PORT = 5243;

// Configurer le dossier public pour les fichiers statiques
app.use(express.static('public'));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({ secret: 'secret-key', resave: false, saveUninitialized: true }));
app.use(flash());
app.set('trust proxy', true);


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


// URL du webhook Discord (ÃƒÂ  remplacer par ton webhook)
const DISCORD_WEBHOOK_URL = 'https://discord.com/api/webhooks/1284931135465590965/hDFfLJ3OSjMdAq_1Ul4NhTPinCi2XcMcyLxAcEqzDBmaB6ADjEjQRTjGVPYF56rDG6xJ';

const logAction = (action, details, ip) => {
    if (!DISCORD_WEBHOOK_URL) {
        console.error('https://discord.com/api/webhooks/1284931135465590965/hDFfLJ3OSjMdAq_1Ul4NhTPinCi2XcMcyLxAcEqzDBmaB6ADjEjQRTjGVPYF56rDG6xJ');
        return;
    }

    const message = {
        content: `**Action:** ${action}\n**Details:** ${details}\n**IP:** ${ip}\n**Date:** ${new Date().toISOString()}`,
        username: 'Echo-Client | Logs (test)',
        avatar_url: 'https://www.gravatar.com/avatar/ecdb7f3320f6e7dd30b6cd99672bef0d?s=2048',
    };

    axios.post(DISCORD_WEBHOOK_URL, message)
        .then(() => console.log('Log envoye à Discord.'))
        .catch(error => console.error('Erreur lors de l\'envoi du log à Discord:', error.message));
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

// Page de crÃƒÂ©ation de compte
app.get('/register', (req, res) => {
    res.render('register');
});

// Gestion de la creation de compte
app.post('/register', (req, res) => {
    const { email, username, password } = req.body;
    const users = loadUsers();
    const userIp = req.ip;

    if (users.find(user => user.email === email)) {
        return res.send('Utilisateur déjà existant. <a href="/register">Essayez un autre email</a>');
    }

    users.push({ email, username, password, level: 1, vps: [] });
    saveUsers(users);

    logAction('Creation de compte', `Email: ${email}, Username: ${username}`, userIp);
    res.send('Compte cree avec succes. <a href="/">Se connecter</a>');
});



// Gestion de la connexion
app.post('/login', (req, res) => {
    const { email, password } = req.body;
    const users = loadUsers();
    const userIp = req.ip;

    const user = users.find(user => user.email === email && user.password === password);
    if (user) {
        req.session.user = user;
        logAction('Connexion', `Email: ${email}`, userIp);
        res.redirect('/dashboard');
    } else {
        logAction('Echec de connexion', `Tentative avec email: ${email}`, userIp);
        res.send('Email ou mot de passe incorrect. <a href="/">Ressayer</a>');
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
        return res.send('connections refuse. <a href="/">Se connecter</a>');
    }

    const users = loadUsers();
    res.render('admin', { user: req.session.user, users });
});

// Route pour ajouter un serveur
app.post('/add-server', (req, res) => {
    const { email, serverType, serverName, username, password, ram, disk, vcpu, ipv4, os, purchaseDate } = req.body;
    const users = loadUsers();

    const user = users.find(user => user.email === email);
    if (!user) {
        req.flash('error', 'Utilisateur non trouvé.');
        logAction('Erreur ajout serveur', `Utilisateur non trouvé pour l'email: ${email}`);
        return res.redirect('/admin');
    }

    // Assurez-vous que user.vps est un tableau
    if (!Array.isArray(user.vps)) {
        user.vps = []; // Initialisation si c'est null ou undefined
    }

    const expirationDate = new Date(purchaseDate);
    expirationDate.setMonth(expirationDate.getMonth() + 1);

    user.vps.push({
        id: uuidv4(),
        serverType,  // Ajout du type de serveur
        serverName,
        username,
        password,
        ram,
        disk,
        vcpu,
        ipv4,
        os,
        purchaseDate,
        expirationDate: expirationDate.toISOString().split('T')[0]
    });

    saveUsers(users);
    logAction('Ajout de serveur', `Serveur ${serverType} ajoute pour ${email} avec le nom: ${serverName}`);
    req.flash('success', 'Serveur ajoute avec succès.');
    res.redirect('/admin');
});



// Route pour afficher les dÃ©tails d'un VPS
app.get('/manage/:id', (req, res) => {
    const { id } = req.params;
    const users = loadUsers();
    const currentUser = req.session.user;

    if (!currentUser) {
        return res.redirect('/'); // Redirection si l'utilisateur n'est pas connectÃ©
    }

    // Trouver le VPS correspondant Ã  l'ID parmi tous les utilisateurs
    const user = users.find(u => u.vps && u.vps.some(v => v.id === id));
    const vps = user ? user.vps.find(v => v.id === id) : null;

    if (!vps) {
        return res.send('VPS non trouvr. <a href="/dashboard">Retourner au tableau de bord</a>');
    }

    // VÃ©rification des permissions
    if (currentUser.level === 2) {
        // Si l'utilisateur est un admin (niveau 2), il peut accÃ©der Ã  tous les VPS
        return res.render('manage', { vps, user: currentUser });
    } else {
        // VÃ©rification si l'utilisateur possÃ¨de le VPS
        const userOwnsVps = currentUser.email === user.email;

        if (userOwnsVps) {
            // Si l'utilisateur est le propriÃ©taire du VPS, afficher les dÃ©tails
            return res.render('manage', { vps, user: currentUser });
        } else {
            // Si l'utilisateur n'est pas le propriÃ©taire, accÃ¨s refusÃ©
            return res.send('Acces¨s refuse. Ce VPS ne vous appartient pas. <a href="/dashboard">Retourner au tableau de bord</a>');
        }
    }
});

// Route pour supprimer un VPS
app.post('/admin/delete-vps', (req, res) => {
    const { email, vpsId } = req.body;

    const users = loadUsers();
    const user = users.find(user => user.email === email);

    if (user && user.vps) {
        user.vps = user.vps.filter(vps => vps.id !== vpsId);
        saveUsers(users);

        logAction('Suppression VPS', `VPS avec ID: ${vpsId} supprime pour l'utilisateur: ${email}`);
        req.flash('success', `VPS supprime.`);
        res.redirect('/dashboard');
    } else {
        logAction('Erreur suppression VPS', `Tentative echoue pour supprimer le VPS ID: ${vpsId} pour l'email: ${email}`);
        req.flash('error', 'Utilisateur ou VPS non trouvÃƒÂ©.');
        res.redirect('/admin');
    }
});


// Route pour afficher tous les VPS (pour admin uniquement)
app.get('/admin/vps', (req, res) => {
    if (!req.session.user || req.session.user.level !== 2) {
        return res.send('acces¨s refuse. <a href="/">Se connecter</a>');
    }

    const users = loadUsers();
    let allVps = [];

    // Parcourir tous les utilisateurs pour rÃƒÂ©cupÃƒÂ©rer leurs VPS
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

// Gestion de la dÃƒÂ©connexion
app.get('/logout', (req, res) => {
    req.session.destroy();
    res.send('deconnexion reussie. <a href="/">Se reconnecter</a>');
});

// DÃƒÂ©marrage du serveur
app.listen(PORT, () => {
    console.log(`Serveur en cours d'execcution sur http://localhost:${PORT}`);
    logAction('Starting panel', `Le panel a start avec succes ! Links: http://185.202.236.15:${PORT}`);
});
