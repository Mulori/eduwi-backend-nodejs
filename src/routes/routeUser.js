require('dotenv/config');
var md5 = require('md5');
const routes = require('express').Router();

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

routes.post('/users', async (req, res) => {
    const key_auth_pub = req.header('key_auth');
    const { firebase_uid, email, name, last_name } = req.body;
    const key_auth = process.env.KEY_AUTH;
    
    if(key_auth_pub !== key_auth){
        return res.status(400).json({
            error_message: 'The server refused the request'
        })
    }

    if(!firebase_uid || !email || !name || !last_name){
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

routes.post('/users/email/exist', async (req, res) => {
    const key_auth_pub = req.header('key_auth');
    const { email } = req.body;
    const key_auth = process.env.KEY_AUTH;
    
    if(key_auth_pub !== key_auth){
        return res.status(400).json({
            error_message: 'The server refused the request'
        })
    }

    if(!email){
        return res.status(400).json({
            error_message: 'Incorrect request'
        })
    }

    const ssql = "select email from users where email = '" + email + "'";

    await prisma.$queryRawUnsafe(ssql)
    .then((json) => {        
        return res.status(200).json(json)
    })
    .catch((error) => {
        return res.status(500).json(error)
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

routes.put('/users/image', async (req, res) => {
    const firebase_uid = req.header('firebase_uid');
    const { image_reference, image_url, image_type, image_size_wh } = req.body;

    const valid = await prisma.users.findUnique({
        where: {
            firebase_uid: firebase_uid
        }
    })

    if(!valid || !image_reference || !image_url || !image_type || !image_size_wh){
        return res.status(400).json({
            error_message: 'Incorrect request'
        })
    }

    var ssql = "update users set image_reference = '" + image_reference + "', image_url = '" + image_url + "', image_type = '" + image_type + "', image_size_wh = '" + image_size_wh + "' where firebase_uid = '" + firebase_uid + "'";

    await prisma.$executeRawUnsafe(ssql).then(() => {
        return res.status(200).json({
            message: 'Image Changed'
        })
    }).catch((values) => {
        return res.status(500).json({
            error_message: 'Error Image Changed'
        })
    })
})



module.exports = routes;