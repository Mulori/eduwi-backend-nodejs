require('dotenv/config');
var md5 = require('md5');
const routes = require('express').Router();

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

routes.get('/notification', async (req, res) => {
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
    
    var ssql = "select u.name as user_name, u.last_name as user_last_name, u.image_url as user_image, n.* from notification n inner join users u on(u.firebase_uid = n.sender_uid)"
    ssql.concat(" where recipient_uid = '" + firebase_uid + "' order by notification_date desc limit 50")

    await prisma.$queryRawUnsafe(ssql)
    .then((json) => {
        return res.status(200).json(json)
    })
    .catch((error) => {
        return res.status(500).json(error)
    })       
})

module.exports = routes;