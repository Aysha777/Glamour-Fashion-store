// Auth.js
const User = require('../models/userModel');

const isLogedout = (req, res, next) => {
    if (!req.session.user) {
        next();
    } else {
        res.redirect("/home");
    }
};

const isLogged = (req, res, next) => {
    console.log("Session Data:", req.session); 
    if (req.session.user) {
        req.user = req.session.user;
        next();
    } else {
        res.redirect('/user/login');
    }
};

const loggedadmin = async (req, res, next) => {
    try {
        const user = await User.findById(req.session.admin);

        if (!user || user.is_admin !== 1) {
            res.status(401).redirect('/login');
        } else {
            req.admin = user;
            next();
        }
    } catch (error) {
        console.error(error);
        res.status(500).redirect('/login');
    }
};

const logoutAdmin = (req, res, next) => {
    if (!req.session.admin) {
        next();
    } else {
        res.redirect('/admin/admin-dash');
    }
};

const logouting = (req, res, next) => {
    console.log('Entering logouting middleware');
    try {
        req.session.destroy();
        res.redirect('/user/login');
    } catch (error) {
        console.error('Error during logouting:', error);
        next(error);
    }
};

const checkinguseroradmin = (req, res, next) => {
    if (req.session.admin) {
        return res.redirect("/admin/dash");
    } else if (req.session.user) {
        return res.redirect('/home');
    } else {
        res.redirect('/login');
    }
};

module.exports = {
    isLogedout,
    isLogged,
    logoutAdmin,
    loggedadmin,
    logouting,
    checkinguseroradmin
};
