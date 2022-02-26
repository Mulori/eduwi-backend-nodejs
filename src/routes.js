require('dotenv/config');
var md5 = require('md5');
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

routes.get('/menu/main/config', async (req, res) => {
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

    await prisma.menu_main_activity.findMany({
        orderBy: [
            { id: 'asc' },
        ]
    })
    .then((json) => {
        return res.status(200).json(json)
    })
    .catch((error) => {
        return res.status(500).json(error)
    })       
})

routes.get('/activity', async (req, res) => {
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

    const ssql1 = "select a.id, a.author_uid, a.title, a.with_password, a.type_activity, u.name || ' ' || u.last_name as name from activity a inner join users u on(a.author_uid = u.firebase_uid) where excluded is null";

    await prisma.$queryRawUnsafe(ssql1)
    .then((json) => {
        return res.status(200).json(json)
    })
    .catch((error) => {
        return res.status(500).json(error)
    })       
}) 

routes.post('/activity', async (req, res) => {
    const firebase_uid = req.header('firebase_uid');
    const { title, password, type_activity } = req.body;
    const with_password = 1;

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

    if(!title || !type_activity){
        return res.status(400).json({
            error_message: 'Bad Request'
        })
    }

    await prisma.activity.create({
        data: {
            author_uid: firebase_uid,
            title: title,
            with_password: password === "" ? 0 : 1,
            password: md5(password),
            type_activity: type_activity,
        }
    }).then(() => {
        return res.status(200).json({
            message: 'Activity created'
        })
    }).catch(() => {
        return res.status(500).json({
            error_message: 'Error creating activity'
        })
    })
})

routes.post('/activity/question/response', async (req, res) => {
    const firebase_uid = req.header('firebase_uid');
    const { activity_id, number_question, question, answer_one, answer_two, answer_tree, answer_four, right_answer } = req.body;

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


    if(!activity_id || !number_question || !answer_one || !answer_two || !answer_tree || !answer_four || !right_answer || !question){
        return res.status(400).json({
            error_message: 'Bad Request'
        })
    }

    await prisma.activity_question_response.create({
        data: {
            activity_id: activity_id,
            number_question: number_question,
            answer_one: answer_one,
            answer_two: answer_two,
            answer_tree: answer_tree,
            answer_four: answer_four,
            right_answer: right_answer,
            question: question
        }
    }).then(() => {
        return res.status(200).json({
            message: 'Activity response created'
        })
    }).catch((values) => {
        return res.status(500).json({
            error_message: 'Error activity ' + values
        })
    })
})

routes.post('/activity/question/users', async (req, res) => {
    const firebase_uid = req.header('firebase_uid');
    const { activity_id } = req.body;

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

    if(!activity_id){
        return res.status(400).json({
            error_message: 'Bad Request'
        })
    }

    const exist = await prisma.activity_question_users.count({
        where: {
            activity_id: activity_id,
            user_uid: firebase_uid
        }
    })

    if(exist > 0){
        return res.status(400).json({error_message: 'User has already joined the activity'});
    }

    await prisma.activity_question_users.create({
        data: {
            activity_id: activity_id,
            user_uid: firebase_uid,
        }
    }).then(() => {
        return res.status(200).json({
            message: 'User entered in activity'
        })
    }).catch(() => {
        return res.status(500).json({
            error_message: 'Error activity user'
        })
    })
})

routes.post('/activity/question/users/response', async (req, res) => {
    const firebase_uid = req.header('firebase_uid');
    const { activity_id, number_question, answer } = req.body;

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

    if(!activity_id || !number_question || !answer){
        return res.status(400).json({
            error_message: 'Bad Request'
        })
    }

    const exist = await prisma.activity_question_users_response.count({
        where: {
            activity_id: activity_id,
            user_uid: firebase_uid,
            number_question: number_question
        }
    })

    if(exist > 0){
        return res.status(400).json({error_message: 'The user has already answered this question'});
    }

    await prisma.activity_question_users_response.create({
        data: {
            activity_id: activity_id,
            user_uid: firebase_uid,
            number_question: number_question,
            answer: answer
        }
    }).then(() => {
        return res.status(200).json({
            message: 'User replied answer activity'
        })
    }).catch(() => {
        return res.status(500).json({
            error_message: 'Error activity user'
        })
    })
})

routes.get('/activity/:id', async (req, res) => {
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

    try{
        const id_ascii = Buffer.from(id, 'base64').toString('ascii');

        await prisma.$queryRawUnsafe("select a.id, a.author_uid, a.title, a.with_password, a.password, u.name || ' ' || u.last_name as name, a.type_activity from activity a inner join users u on(a.author_uid = u.firebase_uid) where a.id = '" + id_ascii + "' and a.excluded is null limit 1")
        .then((json) => {

            if(json.toString() === ''){
                return res.status(404).json({ error: 'Activity not found' })
            }

            return res.status(200).json(json)
        })
        .catch((error) => {
            return res.status(404).json({ error: 'Activity not found' })
        })  
    }catch{
        return res.status(404).json({ error: 'Activity not found' })
    }  
})

routes.get('/activity/:id/response', async (req, res) => {
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

    await prisma.activity_question_response.findMany({
        where: {
            activity_id: parseInt(id)
        },
        orderBy: [
            { number_question: 'asc' },
        ]
    })
    .then((json) => {
        return res.status(200).json(json)
    })
    .catch((error) => {
        return res.status(500).json(error)
    })
})








routes.post('/community', async (req, res) => {
    const firebase_uid = req.header('firebase_uid');
    const { title, description, password } = req.body;

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

    const ssql = "insert into community (title, description, author_uid, with_password, password) VALUES ('"
    .concat(title)
    .concat("', '")
    .concat(description)
    .concat("', '")
    .concat(firebase_uid)
    .concat("', ")
    .concat(password === '0' ? 0 : 1)
    .concat(", '")
    .concat(md5(password))
    .concat("')")

    await prisma.$executeRawUnsafe(ssql)
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

routes.get('/community/:id/info', async (req, res) => {
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
    const { community_id, password } = req.body;

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

    const commu = await prisma.community.findUnique({
        where: {
            id: community_id
        },
        select: {
            with_password: true,
            password: true,
        },
    })  

    if(commu.with_password === 1){
        if(md5(password) !== commu.password){
            return res.status(403).json({
                error_message: 'Password incorrect'
            })
        }
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

routes.get('/community/info', async (req, res) => {
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

    const ssql1 = "select c.id, c.title, c.description, u.name, (select count(id) from user_community where community_id = c.id) as quantity_members,";
    const ssql2 = "(select count(id) from user_community where user_uid = '" + firebase_uid + "' and community_id = c.id) as entered, c.with_password from community as c";
    const ssql3 = "inner join users u on(c.author_uid = u.firebase_uid) order by title asc";

    const string_sql = ssql1.concat(" ").concat(ssql2).concat(" ").concat(ssql3)      

    await prisma.$queryRawUnsafe(string_sql)
    .then((json) => {
        return res.status(200).json(json)
    })
    .catch((error) => {
        return res.status(500).json(error)
    })
       
})

routes.get('/community/user/v1/info', async (req, res) => {
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

    const ssql1 = "select distinct c.id, c.title, c.description, u.name, (select count(id) from user_community where community_id = c.id) as quantity_members,";
    const ssql2 = " (select count(id) from user_community where user_uid = '" + firebase_uid + "' and community_id = c.id) as entered, c.with_password from user_community as uc";
    const ssql3 = " inner join users u on(uc.user_uid = u.firebase_uid) inner join community c on(c.id = uc.community_id) where uc.user_uid = '" + firebase_uid  + "' order by title asc";

    const string_sql = ssql1.concat(" ").concat(ssql2).concat(" ").concat(ssql3)      

    await prisma.$queryRawUnsafe(string_sql)
    .then((json) => {
        return res.status(200).json(json)
    })
    .catch((error) => {
        return res.status(500).json(error)
    })
       
})

routes.post('/community/group', async (req, res) => {
    const firebase_uid = req.header('firebase_uid');
    const { community_id, title, description, max_members, password } = req.body;

    if(!community_id || !title || !description || !max_members || !password){
        return res.status(400).json({
            error_message: 'Incorrect request'
        })
    }

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

    const ssql = "insert into group_community (community_id, title, description, max_members, with_password, password) VALUES ("
    .concat(community_id)
    .concat(", '")
    .concat(title)
    .concat("', '")
    .concat(description)
    .concat("', ")
    .concat(max_members)
    .concat(", ")
    .concat(password === '0' ? 0 : 1)
    .concat(", '")
    .concat(md5(password))
    .concat("')")

    await prisma.$executeRawUnsafe(ssql)
    .then(() => {
        return res.status(200).json({
            message: 'Community group created'            
        })
    }).catch((error) => {
        return res.status(500).json({
            error_message: error
        })
    })
       
})

routes.get('/community/group/v1/info', async (req, res) => {
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

    const ssql1 = "select id, community_id, title, description, max_members, with_password, (select count(id) from user_group_community where group_id = gc.id) as quantity_members, ";
    const ssql2 = " (select count(id) from user_group_community where user_uid = '" + firebase_uid + "' and group_id = gc.id) as entered from group_community gc order by gc.title asc";

    
    const string_sql = ssql1.concat(" ").concat(ssql2)    

    console.log(string_sql)

    await prisma.$queryRawUnsafe(string_sql)
    .then((json) => {
        return res.status(200).json(json)
    })
    .catch((error) => {
        return res.status(500).json(error)
    })
       
})

routes.post('/community/group/enter', async (req, res) => {
    const firebase_uid = req.header('firebase_uid');
    const { group_id, password } = req.body;

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

    const group = await prisma.group_community.findUnique({
        where: {
            id: group_id
        },
        select: {
            with_password: true,
            password: true,
            max_members: true,
        },
    })  

    const users_group = await prisma.$queryRawUnsafe("select count(id) as quantidade from user_group_community where group_id = '" + group_id + "'")
    const count_max = users_group[0].quantidade + 1

    if(count_max > group.max_members){
        return res.status(403).json({
            error_message: 'This group has exceeded the membership limit'
        })
    }

    if(group.with_password === 1){
        if(md5(password) !== group.password){
            return res.status(403).json({
                error_message: 'Password incorrect'
            })
        }
    }

    await prisma.user_group_community.create({
        data: {
            group_id: group_id,
            user_uid: firebase_uid,
        }
    })
    .then(() => {
        return res.status(200).json({
            message: 'User entered in group'            
        })
    }).catch((error) => {
        return res.status(500).json({
            error_message: error
        })
    })
})

routes.get('/community/group/:id/users/v1/info', async (req, res) => {
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

    const ssql1 = "select u.id, u.name || ' ' || u.last_name as name, u.email, case when u.firebase_uid = '" + firebase_uid  + "' then 1 else 0 end as you from user_group_community ugc ";
    const ssql2 = " inner join users u on(ugc.user_uid = u.firebase_uid) where ugc.group_id = '" + id + "' order by u.name, u.last_name asc";
    
    const string_sql = ssql1.concat(" ").concat(ssql2)    

    console.log(string_sql)

    await prisma.$queryRawUnsafe(string_sql)
    .then((json) => {
        return res.status(200).json(json)
    })
    .catch((error) => {
        return res.status(500).json(error)
    })
       
})


module.exports = routes;