require('dotenv/config');
const routes = require('express').Router();

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const WelcomeController = require('./controllers/WelcomeController');

routes.get('/welcome', WelcomeController.Welcome);

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

prisma.users.findMany()
.then((json) => {
    return res.status(200).json(json)
}).catch((error) => {
    return res.status(500).json({
        error_message: error
    })
})
})

routes.get('/users/:uid', async (req, res) => {
    const { uid } = req.params
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

    await prisma.users.findUnique({
        where:{
            firebase_uid: uid
        },
        include: { 
            community: true, 
            user_community: true
        }})
    .then((json) => {
        return res.status(200).json(json)
    }).catch((error) => {
        return res.status(500).json({
            error_message: error
        })
    })
})

routes.post('/community', async (req, res) => {
    const firebase_uid = req.header('firebase_uid');
    const { title, description } = req.body;

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

    await prisma.community.create({
        data: {
            title: title,
            description: description,
            author_uid: firebase_uid,
        }
    })
    .then(() => {
        return res.status(200).json({
            message: 'Community created'            
        })
    }).catch((error) => {
        return res.status(500).json({
            error_message: error
        })
    })
})

routes.get('/community', async (req, res) => {
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

    await prisma.community.findMany()
    .then((json) => {
        return res.status(200).json(json)
    }).catch((error) => {
        return res.status(500).json({
            error_message: error
        })
    })
})

routes.get('/community/:id', async (req, res) => {
    const { id } = req.params
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

    await prisma.community.findUnique({
        where: {
            id: parseInt(id)
        }
    })
    .then((json) => {
        return res.status(200).json(json)
    }).catch((error) => {
        return res.status(500).json({
            error_message: error
        })
    })
})

routes.post('/community/enter', async (req, res) => {
    const firebase_uid = req.header('firebase_uid');
    const { community_id } = req.body;

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

    await prisma.user_community.create({
        data: {
            community_id: community_id,
            user_uid: firebase_uid,
        }
    })
    .then(() => {
        return res.status(200).json({
            message: 'User entered in community'            
        })
    }).catch((error) => {
        return res.status(500).json({
            error_message: error
        })
    })
})

routes.get('/community/:id/users', async (req, res) => {
    const { id } = req.params
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

    await prisma.$queryRawUnsafe('select u.id, u.email, u.name, u.last_name from  user_community uc inner join users u on(uc.user_uid = u.firebase_uid) where uc.community_id = ' + id)
    .then((json) => {
        return res.status(200).json(json)
    })
    .catch((error) => {
        return res.status(500).json(error)
    })
       
})

module.exports = routes;