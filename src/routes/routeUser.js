require('dotenv/config');
var md5 = require('md5');
const routes = require('express').Router();

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

routes.post('/users', async (req, res) => {
    const key_auth_pub = req.header('key_auth');
    const { firebase_uid, email, name, last_name, avatar, avatar_format } = req.body;
    const key_auth = process.env.KEY_AUTH;
    
    if(key_auth_pub !== key_auth){
        return res.status(400).json({
            error_message: 'The server refused the request'
        })
    }

    if(!firebase_uid || !email || !name || !last_name || !avatar || !avatar_format){
        return res.status(400).json({
            error_message: 'Incorrect request'
        })
    }

    await prisma.users.create({
        data: {
            firebase_uid: firebase_uid,
            email: email,
            name: name,
            last_name: last_name,
            avatar_base64: avatar,
            avatar_format: avatar_format
        }
    }).then(() => {
        return res.status(200).json({
            message: 'User created'
        })
    }).catch(() => {
        return res.status(500).json({
            error_message: 'Error creating user'
        })
    })
})

routes.get('/users', async (req, res) => {
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

    return res.status(200).json(valid);
})


module.exports = routes;