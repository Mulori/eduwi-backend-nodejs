require('dotenv/config');
var md5 = require('md5');
const routes = require('express').Router();

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const WelcomeController = require('../controllers/WelcomeController');
routes.get('/welcome', WelcomeController.Welcome);


module.exports = routes;