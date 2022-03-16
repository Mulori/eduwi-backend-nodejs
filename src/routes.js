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

    const ssql1 = "select a.id, a.author_uid, a.title, a.with_password, a.type_activity, u.name || ' ' || u.last_name as name, a.password, (select count(id) from activity_question_users where activity_id = a.id) as number_members from activity a inner join users u on(a.author_uid = u.firebase_uid) where excluded is null order by number_members desc limit 30";

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
            error_message: 'Bad Request post activity'
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
    }).then((value) => {
        return res.status(200).json(value)
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
            error_message: 'Bad Request post anwer activity'
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
            error_message: 'Bad Request post user in question'
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
    const jsonArray = req.body;   

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

    if(!jsonArray){
        return res.status(400).json({
            error_message: 'Bad Request post anwer'
        })
    }
    
    jsonArray.forEach(async item => {
        const exist = await prisma.activity_question_users_response.count({
            where: {
                activity_id: item.activity_id,
                user_uid: firebase_uid,
                number_question: item.number_question
            }
        })
    
        if(exist > 0){
            return res.status(400).json({error_message: 'The user has already answered this question'});
        }

        await prisma.activity_question_users_response.create({
            data: {
                activity_id: item.activity_id,
                user_uid: firebase_uid,
                number_question: item.number_question,
                answer: item.answer
            }
        }).then().catch(async () => {
            var ssql = "delete from activity_question_users_response where activity_id = '" + item.activity_id + "' and user_uid = '" + firebase_uid + "'"
            await prisma.$executeRawUnsafe(ssql).then().catch();

            ssql = "delete from activity_question_users where activity_id = '" + item.activity_id + "' and user_uid = '" + firebase_uid + "'"
            await prisma.$executeRawUnsafe(ssql).then().catch();

            return res.status(500).json({
                error_message: 'Error creating user response'
            })
        })       
    });

    return res.status(200).json({
        message: 'OK'
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

routes.get('/activity/:id/users/concluded', async (req, res) => {
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

    var ssql = "select aqu.id, aqu.activity_id, u.id, aqu.user_uid, u.email, u.name || ' ' || u.last_name as full_name, aqu.value from activity_question_users aqu inner join users u on u.firebase_uid = aqu.user_uid where aqu.activity_id = '" + id + "'"

    await prisma.$queryRawUnsafe(ssql)
    .then((json) => {
        return res.status(200).json(json)
    })
    .catch((error) => {
        return res.status(500).json(error)
    })
})


setInterval(async function(){

    var ssql = "select a.id, au.user_uid from activity_question_users au inner join activity a on(au.activity_id = a.id) where a.type_activity = 'questions' and au.value is null";

    const users = await prisma.$queryRawUnsafe(ssql)

    users.forEach(async element => {
        ssql = 'select CASE WHEN aqur.answer = (select right_answer from activity_question_response'
        .concat(' where activity_id = aqur.activity_id and number_question = aqur.number_question) THEN 1 ELSE 0 END as correcty from activity_question_users_response aqur')
        .concat(" where aqur.activity_id = '" + element.id + "' and aqur.user_uid = '" + element.user_uid + "' group by aqur.activity_id, aqur.number_question, correcty order by aqur.number_question asc")

        var contador = 0;
        await prisma.$queryRawUnsafe(ssql)
        .then((data) => {
            for (var item in data){
                if(data[item].correcty == 1){
                    contador++;
                }
            }
        })
        .catch((error) => {
            console.log(error)
        })

        ssql = "select count(activity_id) as qtd from activity_question_response where activity_id = '" + element.id + "'"
        const quantidade_questoes = await prisma.$queryRawUnsafe(ssql)

        var divisao =  parseInt(contador) / parseInt(quantidade_questoes[0].qtd)
        var multiplicacao = divisao * 100;

        ssql = "update activity_question_users set value = '" + multiplicacao + "'"
        .concat(" where activity_id = '" + element.id + "' and user_uid = '" + element.user_uid + "'")   

        console.log(ssql)
        await prisma.$executeRawUnsafe(ssql).then().catch((error) => {console.log(error)})
    });    


}, 15000);


module.exports = routes;