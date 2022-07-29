require('dotenv/config');
var md5 = require('md5');
const routes = require('express').Router();

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

routes.get('/eduvida', async (req, res) => {
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

    var ssql = 'select e.id, u.firebase_uid, e.title, e.help_text, e.help_type, e.created, u.name, u.last_name, u.image_url from eduvida e inner join users u on(e.author_uid = u.firebase_uid) where e.help_close = 0 order by e.created desc'

    await prisma.$queryRawUnsafe(ssql)
    .then((json) => {
        return res.status(200).json(json)
    })
    .catch((error) => {
        return res.status(500).json(error)
    })       
})

routes.post('/eduvida', async (req, res) => {
    const firebase_uid = req.header('firebase_uid');
    const { title, help_text, help_type, image_reference, image_url, image_type, image_size_wh } = req.body;

    var utc = new Date()

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
    
    if(!title || !help_text || !help_type){
        return res.status(400).json({
            error_message: 'Bad Request post eduvida'
        })
    }

    await prisma.eduvida.create({
        data: {
            author_uid: firebase_uid,
            title: title,
            help_text: help_text,
            help_type: help_type,
            help_close: 0,
            created: utc,
            image_reference: image_reference,
            image_url: image_url,
            image_type: image_type,
            image_size_wh: image_size_wh
        }
    })
    .then((json) => {
        return res.status(200).json(json)
    })
    .catch((error) => {
        return res.status(500).json(error)
    })       
})

routes.post('/eduvida/:id/comment', async (req, res) => {
    const firebase_uid = req.header('firebase_uid');
    const { id } = req.params;
    const { comment, image_reference, image_url, image_type, image_size_wh } = req.body;

    var utc = new Date()

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
    
    if(!comment){
        return res.status(400).json({
            error_message: 'Bad Request post eduvida comment'
        })
    }

    console.log(id)

    await prisma.eduvida_comment.create({
        data: {
            eduvida_id: parseInt(id),
            user_uid: firebase_uid,
            comment: comment,
            created: utc,
            image_reference: image_reference,
            image_url: image_url,
            image_type: image_type,
            image_size_wh: image_size_wh
        }
    })
    .then((json) => {
        return res.status(200).json(json)
    })
    .catch((error) => {
        return res.status(500).json(error)
    })       
})

module.exports = routes;