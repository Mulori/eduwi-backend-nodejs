require('dotenv/config');
var md5 = require('md5');
const routes = require('express').Router();

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const WelcomeController = require('./controllers/WelcomeController');


setInterval(async function(){

    var ssql = "update users set score = 0 where score is null"
    console.log(ssql)
    await prisma.$executeRawUnsafe(ssql).then().catch((error) => {console.log(error)})

    ssql = "select a.id, au.user_uid from activity_question_users au inner join activity a on(au.activity_id = a.id) where a.type_activity = 'questions' and au.value is null";

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
    
    
    ssql = "update users u set score = score + (select COALESCE(sum(value), 0) as valor from activity_question_users where user_uid = u.firebase_uid and processed is null)"
    console.log(ssql)
    await prisma.$executeRawUnsafe(ssql).then(async () => {
        ssql = "update activity_question_users set processed = 1 where value is not null"
        console.log(ssql)
        await prisma.$executeRawUnsafe(ssql).then().catch((error) => {console.log(error)})
    }).catch((error) => {console.log(error)})  


}, 15000);

setInterval(async function(){

    var ssql = "update users set score = 0 where score is null"
    console.log(ssql)
    await prisma.$executeRawUnsafe(ssql).then().catch((error) => {console.log(error)})

    ssql = "select a.id, au.user_uid from activity_question_users au inner join activity a on(au.activity_id = a.id) where a.type_activity = 'sentences' and au.value is null";

    const users = await prisma.$queryRawUnsafe(ssql)

    users.forEach(async element => {
        ssql = 'select au.id as id_response_user, ar.id as id_response_created, au.activity_id, au.user_uid, au.number_sentence,'
        .concat(' sem_acentos(au.sentences_informed) as response_user, sem_acentos(ar.hidden_words) as response_correcty, ar.complete_sentence, ar.marked_sentence,  ar.words_help')
        .concat(" from activity_sentences_users_response au inner join activity_sentences ar on(au.activity_id = ar.activity_id and au.number_sentence = ar.number_sentence)")
        .concat(" where au.activity_id = '" + element.id + "' and au.user_uid = '" + element.user_uid + "' order by au.number_sentence asc")

        var contador_acertos = 0;
        var quantidade_frases = 0;
        await prisma.$queryRawUnsafe(ssql)
        .then((data) => {
            for (var item in data){
                if(data[item].response_user == data[item].response_correcty){
                    contador_acertos++;
                }
                quantidade_frases++;
            }
        })
        .catch((error) => {
            console.log(error)
        })

        var divisao =  parseInt(contador_acertos) / parseInt(quantidade_frases)
        var multiplicacao = divisao * 100;

        ssql = "update activity_question_users set value = '" + multiplicacao + "'"
        .concat(" where activity_id = '" + element.id + "' and user_uid = '" + element.user_uid + "'")   

        console.log(ssql)
        await prisma.$executeRawUnsafe(ssql).then().catch((error) => {console.log(error)}) 
    }); 
    
    
    ssql = "update users u set score = score + (select COALESCE(sum(value), 0) as valor from activity_question_users where user_uid = u.firebase_uid and processed is null)"
    console.log(ssql)
    await prisma.$executeRawUnsafe(ssql).then(async () => {
        ssql = "update activity_question_users set processed = 1 where value is not null"
        console.log(ssql)
        await prisma.$executeRawUnsafe(ssql).then().catch((error) => {console.log(error)})
    }).catch((error) => {console.log(error)})  


}, 15000);


module.exports = routes;