require('dotenv/config');
var md5 = require('md5');
const routes = require('express').Router();

const { PrismaClient } = require('@prisma/client');
const { parse } = require('path');
const prisma = new PrismaClient();

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

    const ssql1 = "select a.id, a.author_uid, a.title, a.with_password, a.type_activity, u.name || ' ' || u.last_name as name, a.password, (select count(id) from activity_question_users where activity_id = a.id) as number_members, a.image_reference, a.image_url from activity a inner join users u on(a.author_uid = u.firebase_uid) where excluded is null order by number_members desc limit 30";

    await prisma.$queryRawUnsafe(ssql1)
    .then((json) => {
        return res.status(200).json(json)
    })
    .catch((error) => {
        return res.status(500).json(error)
    })       
}) 

routes.get('/activity/users', async (req, res) => {
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

    const ssql1 = "select a.id, a.author_uid, a.title, a.with_password, a.type_activity, u.name || ' ' || u.last_name as name, a.password, a.created, (select count(id) from activity_question_users where activity_id = a.id) as number_members, a.image_reference, a.image_url from activity a inner join users u on(a.author_uid = u.firebase_uid) where excluded is null and a.author_uid = '" + firebase_uid + "' order by number_members desc limit 30";

    await prisma.$queryRawUnsafe(ssql1)
    .then((json) => {
        return res.status(200).json(json)
    })
    .catch((error) => {
        return res.status(500).json(error)
    })       
}) 

routes.get('/activity/user/finished', async (req, res) => {
    const firebase_uid = req.header('firebase_uid');

    const valid = await prisma.users.findUnique({
        where: {
            firebase_uid: firebase_uid
        }
    })

    if(!valid){
        return res.status(403).json({
            error_message: 'The server refused the request - invalid firebase_uid'
        })
    }   

    const ssql1 = "select a.id, a.author_uid, a.title, a.type_activity, aqu.created as replied_in, a.image_reference, a.image_url from activity_question_users aqu inner join activity a on(aqu.activity_id = a.id) where a.excluded is null and aqu.user_uid = '" + firebase_uid + "' and aqu.display_to_user = '1'";

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
    const { title, password, type_activity, image_reference, image_url, image_type, image_size_wh } = req.body;
    const with_password = 1;

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

    if(!title || !type_activity || !image_reference || !image_url || !image_type || !image_size_wh){
        return res.status(400).json({
            error_message: 'Bad Request post activity'
        })
    }

    console.log(image_reference)
    console.log(image_url)
    console.log(image_type)
    console.log(image_size_wh)

    await prisma.activity.create({
        data: {
            author_uid: firebase_uid,
            title: title,
            with_password: password === "" ? 0 : 1,
            password: md5(password),
            type_activity: type_activity,
            created: utc,
            image_reference: image_reference,
            image_url: image_url,
            image_type: image_type,
            image_size_wh: image_size_wh
        }
    }).then((value) => {
        return res.status(200).json(value)
    }).catch((error) => {
        return res.status(500).json({
            error_message: 'Error creating activity' + error
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

routes.post('/activity/sentences', async (req, res) => {
    const firebase_uid = req.header('firebase_uid');
    const { activity_id, number_sentence, complete_sentence, marked_sentence, hidden_words, words_help } = req.body;

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


    if(!activity_id || !number_sentence || !complete_sentence || !marked_sentence || !hidden_words || !words_help ){
        return res.status(400).json({
            error_message: 'Bad Request post anwer activity'
        })
    }

    await prisma.activity_sentences.create({
        data: {
            activity_id: activity_id,
            number_sentence: number_sentence,
            complete_sentence: complete_sentence,
            marked_sentence: marked_sentence,
            hidden_words: hidden_words,
            words_help: words_help
        }
    }).then(() => {
        return res.status(200).json({
            message: 'Activity sentences created'
        })
    }).catch((values) => {
        return res.status(500).json({
            error_message: 'Error activity ' + values
        })
    })
})

routes.post('/activity/question/users', async (req, res) => {
    const firebase_uid = req.header('firebase_uid');
    const { activity_id, created } = req.body;
    var now = new Date();

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
            created: now,
            display_to_user: 0
        }
    }).then(() => {
        return res.status(200).json({
            message: 'User entered in activity'
        })
    }).catch((value) => {
        return res.status(500).json({
            error_message: 'Error activity user '
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
                number_question: item.number_question,
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
                answer: item.answer,
                comments: ''
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

routes.post('/activity/sentences/users/response', async (req, res) => {
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

    console.log(jsonArray)
    
    jsonArray.forEach(async item => {
        const exist = await prisma.activity_sentences_users_response.count({
            where: {
                activity_id: item.activity_id,
                user_uid: firebase_uid,
                number_sentence: item.number_sentence
            }
        })
    
        if(exist > 0){
            return res.status(400).json({error_message: 'The user has already answered this phrase'});
        }

        await prisma.activity_sentences_users_response.create({
            data: {
                activity_id: item.activity_id,
                user_uid: firebase_uid,
                number_sentence: item.number_sentence,
                sentences_informed: item.sentences_informed,
                comments: ''
            }
        }).then().catch(async (value) => {
            console.log(value)

            var ssql = "delete from activity_sentences_users_response where activity_id = '" + item.activity_id + "' and user_uid = '" + firebase_uid + "'"
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

        await prisma.$queryRawUnsafe("select a.id, a.author_uid, a.title, a.with_password, a.password, u.name || ' ' || u.last_name as name, a.type_activity, a.image_reference, a.image_url from activity a inner join users u on(a.author_uid = u.firebase_uid) where a.id = '" + id_ascii + "' and a.excluded is null limit 1")
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

routes.get('/activity/:id/sentences', async (req, res) => {
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

    await prisma.activity_sentences.findMany({
        where: {
            activity_id: parseInt(id)
        },
        orderBy: [
            { number_sentence: 'asc' },
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

    var ssql = "select aqu.id, aqu.activity_id, u.id, aqu.user_uid, u.email, u.name || ' ' || u.last_name as full_name, aqu.value, u.image_reference, u.image_url from activity_question_users aqu inner join users u on u.firebase_uid = aqu.user_uid where aqu.activity_id = '" + id + "'"

    await prisma.$queryRawUnsafe(ssql)
    .then((json) => {
        return res.status(200).json(json)
    })
    .catch((error) => {
        return res.status(500).json(error)
    })
})

routes.get('/activity/:id/users/response/finished', async (req, res) => {
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

    const activity = await prisma.activity.findUnique({
        where: {
            id: parseInt(id)
        }
    })

    var ssql = "";
    if(activity.type_activity == 'questions'){
        ssql = "select au.id as id_response_user, ar.id as id_response_created, au.activity_id, au.user_uid, au.number_question,"
        .concat(" au.answer as response_user, ar.right_answer as response_correcty, ar.question, ar.answer_one,  ar.answer_two,  ar.answer_tree,  ar.answer_four, au.comments")
        .concat(" from activity_question_users_response au inner join activity_question_response ar on(au.activity_id = ar.activity_id and au.number_question = ar.number_question)")
        .concat(" where au.activity_id = '" + id + "' and au.user_uid = '" + firebase_uid + "' order by au.number_question asc")
    }else if(activity.type_activity == 'sentences'){
        ssql = "select au.id as id_response_user, ar.id as id_response_created, au.activity_id, au.user_uid, au.number_sentence,"
        .concat(" sem_acentos(au.sentences_informed) as response_user, sem_acentos(ar.hidden_words) as response_correcty, ar.complete_sentence, ar.marked_sentence,  ar.words_help, au.comments")
        .concat(" from activity_sentences_users_response au inner join activity_sentences ar on(au.activity_id = ar.activity_id and au.number_sentence = ar.number_sentence)")
        .concat(" where au.activity_id = '" + id + "' and au.user_uid = '" + firebase_uid + "' order by au.number_sentence asc")
    }

    await prisma.$queryRawUnsafe(ssql)
    .then((json) => {
        return res.status(200).json(json)
    })
    .catch((error) => {
        return res.status(500).json(error)
    })
})

routes.put('/activity/:id/close', async (req, res) => {
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

    var ssql = "update activity set excluded = '1' where id = '" + id + "' and author_uid = '" + firebase_uid + "'";

    await prisma.$executeRawUnsafe(ssql).then(() => {
        return res.status(200).json({
            message: 'Activity closed'
        })
    }).catch((values) => {
        return res.status(500).json({
            error_message: 'Error activity ' + values
        })
    })
})

routes.put('/activity/:id/title', async (req, res) => {
    const { id } = req.params
    const firebase_uid = req.header('firebase_uid');
    const { title } = req.body;

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

    var ssql = "update activity set title = '" + title + "' where id = '" + id + "' and author_uid = '" + firebase_uid + "'";

    await prisma.$executeRawUnsafe(ssql).then(() => {
        return res.status(200).json({
            message: 'Title Changed'
        })
    }).catch((values) => {
        return res.status(500).json({
            error_message: 'Error activity ' + values
        })
    })
})

routes.put('/activity/:id/password', async (req, res) => {
    const { id } = req.params
    const firebase_uid = req.header('firebase_uid');
    const { password } = req.body;

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

    var with_pass =  password === "" ? 0 : 1

    var ssql = "update activity set password = '" + md5(password) + "', with_password = '" + with_pass + "' where id = '" + id + "' and author_uid = '" + firebase_uid + "'";

    await prisma.$executeRawUnsafe(ssql).then(() => {
        return res.status(200).json({
            message: 'Password Changed'
        })
    }).catch((values) => {
        return res.status(500).json({
            error_message: 'Error activity'
        })
    })
})

routes.get('/activity/:id/done', async (req, res) => {
    const firebase_uid = req.header('firebase_uid');
    const { id } = req.params

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

    const ssql = "select * from activity_question_users where activity_id = '" + id + "' and user_uid = '" + firebase_uid  + "'";

    await prisma.$queryRawUnsafe(ssql)
    .then((json) => {        
        return res.status(200).json(json)
    })
    .catch((error) => {
        return res.status(500).json(error)
    })       
}) 

routes.put('/activity/:id/comment/:number', async (req, res) => {
    const { id, number } = req.params
    const firebase_uid = req.header('firebase_uid');
    const { comment, user_uid } = req.body;

    const valid = await prisma.users.findUnique({
        where: {
            firebase_uid: firebase_uid
        }
    })

    if(!valid){
        return res.status(403).json({
            error_message: 'The server refused the request - reason: user'
        })
    } 

    if(!comment){
        return res.status(403).json({
            error_message: 'The server refused the request - reason: comment'
        })
    } 

    if(!number){
        return res.status(403).json({
            error_message: 'The server refused the request - reason: number'
        })
    } 

    if(!id){
        return res.status(403).json({
            error_message: 'The server refused the request - reason: id'
        })
    } 

    const activity = await prisma.activity.findUnique({
        where: {
            id: parseInt(id)
        }
    })

    var ssql = "";
    if(activity.type_activity == 'questions'){
        ssql = "update activity_question_users_response set comments = '" + comment + "' where activity_id = '" + id + "' and user_uid = '" + user_uid + "' and number_question = '" + number + "'"
    }else if(activity.type_activity == 'sentences'){
        ssql = "update activity_sentences_users_response set comments = '" + comment + "' where activity_id = '" + id + "' and user_uid = '" + user_uid + "' and number_sentence = '" + number + "'"
    }
  
    await prisma.$executeRawUnsafe(ssql).then(() => {
        return res.status(200).json({
            message: 'comment added'
        })
    }).catch((values) => {
        return res.status(500).json({
            error_message: 'Error comment added'
        })
    })
})

routes.put('/activity/:id/display/user', async (req, res) => {
    const { id } = req.params
    const firebase_uid = req.header('firebase_uid');
    const { user_uid } = req.body;

    const valid = await prisma.users.findUnique({
        where: {
            firebase_uid: firebase_uid
        }
    })

    if(!valid){
        return res.status(403).json({
            error_message: 'The server refused the request - reason: user'
        })
    }  

    if(!id){
        return res.status(403).json({
            error_message: 'The server refused the request - reason: id'
        })
    } 

    if(!user_uid){
        return res.status(403).json({
            error_message: 'The server refused the request - reason: user_uid'
        })
    } 
    
    var ssql = "update activity_question_users set display_to_user = '1' where activity_id = '" + id + "' and user_uid = '" + user_uid + "'"
    
    await prisma.$executeRawUnsafe(ssql).then(() => {
        return res.status(200).json({
            message: 'displayed to user'
        })
    }).catch((values) => {
        return res.status(500).json({
            error_message: 'Error displayed to user'
        })
    })
})

routes.get('/activity/:id/comment/:number/user/:useruid', async (req, res) => {
    const firebase_uid = req.header('firebase_uid');
    const { id, number, useruid } = req.params

    const valid = await prisma.users.findUnique({
        where: {
            firebase_uid: firebase_uid
        }
    })

    if(!valid){
        return res.status(403).json({
            error_message: 'The server refused the request - reason: user'
        })
    }   
    
    if(!id){
        return res.status(403).json({
            error_message: 'The server refused the request - reason: id'
        })
    } 

    if(!useruid){
        return res.status(403).json({
            error_message: 'The server refused the request - reason: user_uid'
        })
    }

    if(!number){
        return res.status(403).json({
            error_message: 'The server refused the request - reason: number'
        })
    }  

    const activity = await prisma.activity.findUnique({
        where: {
            id: parseInt(id)
        }
    })

    var ssql = "";
    if(activity.type_activity == 'questions'){
        ssql = "select comments from activity_question_users_response where activity_id = '" + id + "' and user_uid = '" + useruid + "' and number_question = '" + number + "'"
    }else if(activity.type_activity == 'sentences'){
        ssql = "select comments from activity_sentences_users_response where activity_id = '" + id + "' and user_uid = '" + useruid + "' and number_sentence = '" + number +"'"
    }

    await prisma.$queryRawUnsafe(ssql)
    .then((json) => {        
        return res.status(200).json(json)
    })
    .catch((error) => {
        return res.status(500).json(error)
    })       
})

module.exports = routes;