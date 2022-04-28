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

routes.get('/reward/users', async (req, res) => {
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

    var ssql = "select r.*, ru.amount from reward_users ru inner join reward r on(ru.reward_id = r.id) where user_uid = '" + firebase_uid + "' and ru.amount > 0"

    await prisma.$queryRawUnsafe(ssql)
    .then((json) => {
        return res.status(200).json(json)
    })
    .catch((error) => {
        return res.status(500).json(error)
    })       
})

routes.post('/reward', async (req, res) => {
    const firebase_uid = req.header('firebase_uid');
    const { reward_id, amount } = req.body;

    const user = await prisma.users.findUnique({
        where: {
            firebase_uid: firebase_uid
        }
    })

    if(!user){
        return res.status(403).json({
            error_message: 'The server refused the request'
        })
    }   

    const reward = await prisma.reward.findUnique({
        where: {
            id: parseInt(reward_id)
        }
    })

    if(!reward){
        return res.status(403).json({
            error_message: 'The server refused the request'
        })
    }  
    
    if(!reward_id || !amount){
        return res.status(400).json({
            error_message: 'The server refused the request because the input data is invalid'
        })
    }

    var reward_value_total = (reward.value * amount)

    if(reward_value_total > user.score){
        return res.status(403).json({
            error_message: 'You dont have enough coins'
        })  
    }

    var ssql = "insert into reward_users (user_uid, reward_id, amount) VALUES ('" + firebase_uid + "', '" + reward_id + "', '" + amount + "')"

    await prisma.$executeRawUnsafe(ssql)
    .then(async (json) => {

        ssql = "update users set score = score - '" + reward_value_total + "' where firebase_uid = '" + firebase_uid + "'"

        await prisma.$executeRawUnsafe(ssql)
        .then((json) => {
            return res.status(200).json(json)
        })
        .catch((error) => {
            return res.status(500).json(error)
        })
    })
    .catch((error) => {
        return res.status(500).json(error)
    })       
})

routes.post('/reward/:id/use', async (req, res) => {
    const firebase_uid = req.header('firebase_uid');
    const { id } = req.params

    const user = await prisma.users.findUnique({
        where: {
            firebase_uid: firebase_uid
        }
    })

    if(!user){
        return res.status(403).json({
            error_message: 'The server refused the request'
        })
    }   

    const reward = await prisma.reward_users.findUnique({
        where: {
            id: parseInt(id)
        }
    })

    if(!reward){
        return res.status(403).json({
            error_message: 'The server refused the request'
        })
    } 

    if(reward.amount < 1){
        return res.status(403).json({
            error_message: 'The server refused the request'
        })   
    }

    var ssql = "select ru.id as id_mov, r.id as id_reward, r.type, ru.amount, r.name, r.description, r.value, r.picture from reward_users ru inner join reward r on(ru.reward_id = r.id) where ru.id = '" + id + "'"
 
    console.log(ssql)

    await prisma.$queryRawUnsafe(ssql)
    .then(async (jsonP) => {

        ssql = "update reward_users set amount = amount - 1 where id = '" + id + "'"

        await prisma.$executeRawUnsafe(ssql)
        .then((json) => {
            return res.status(200).json(jsonP)
        })
        .catch((error) => {
            return res.status(500).json(error)
        })
    })
    .catch((errorP) => {
        return res.status(500).json(errorP)
    })       
})

module.exports = routes;