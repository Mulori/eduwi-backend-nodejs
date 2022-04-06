require('dotenv/config');
var md5 = require('md5');
const routes = require('express').Router();

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

routes.get('/reward', async (req, res) => {
    const firebase_uid = req.header('firebase_uid');

    const valid = await prisma.users.findUnique({
        where: {
            firebase_uid: firebase_uid
        }
    })

    if(!valid){
        return res.status(403).json({
            error_message: 'The server refused the request'
        })
    }           

    await prisma.reward.findMany({
        orderBy: [
            { type: 'asc' },
        ]
    })
    .then((json) => {
        return res.status(200).json(json)
    })
    .catch((error) => {
        return res.status(500).json(error)
    })       
})

module.exports = routes;