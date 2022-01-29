const express = require('express');
const WelcomeController = require('./controllers/WelcomeController');

const routes = express.Router();

routes.get('/welcome', WelcomeController.Welcome);

module.exports = routes;