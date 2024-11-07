const { parse } = require("dotenv");
const { dbCon, mysql } = require("../config/dbConnection");
const { v4: uuidv4 } = require('uuid');
const tools = require("../utils/tools");
module.exports = {
    dbQuery_promise: async (query) => {
        let rs = await new Promise((resolve, reject) => {
            dbCon.query(query, (err, result) => {
                if (err) reject(err);
                else resolve(result);
            });
        });
        return rs;
    },
    loadEducationGroup: async (groupId) => {
        let statement, query, queryRS;
        statement = `
            SELECT education__group.*, education__main_group.title AS main_title 
            FROM education__group 
            INNER JOIN education__main_group 
            ON education__group.main_id = education__main_group.ID 
            WHERE education__group.ID = ? OR ? = 0
        `;
        query = mysql.format(statement, [groupId, groupId]);
        queryRS = await module.exports.dbQuery_promise(query);
        return queryRS;
    },

    getMainGroup: async () => {
        let statement, query, queryRS;
        statement = `SELECT * FROM education__main_group WHERE status = 'Active'`;
        query = mysql.format(statement, [0]);
        queryRS = await module.exports.dbQuery_promise(query);
        return queryRS;
    },

    addEducationGroupToDb: async (queryBody , userID) => {
        let statement, query, queryRS;
        if(queryBody.ID){
            statement = `UPDATE education__group SET main_id=? , title=? ,image_url=? , image_alt_text=? , title_in_card=? , priority=? , description=? ,editor_user_id=? WHERE ID=?`;
        }else{
            statement = `INSERT INTO education__group(main_id, title, image_url, image_alt_text, title_in_card, priority, description,creator_user_id) VALUES (?,?,?,?,?,?,?,?)`;
        }  
        query = mysql.format(statement, [queryBody.main_id,queryBody.title,queryBody.image_url,queryBody.image_alt_text,queryBody.title_in_card,queryBody.priority,queryBody.description,userID , queryBody.ID]);
        queryRS = await module.exports.dbQuery_promise(query);
        return queryRS;
    },

    deleteEducationGroup: async (educationGroupID) => {
        let statement, query, queryRS;
        statement = `DELETE FROM education__group WHERE ID=?`;
        query = mysql.format(statement, [educationGroupID]);
        queryRS = await module.exports.dbQuery_promise(query);
        return queryRS;
    },

    loadLesson: async (lessonId) => {
        let statement, query, queryRS;
        statement = `
            SELECT lesson__info.*, lesson__type.title AS type_title 
            FROM lesson__info 
            INNER JOIN lesson__type 
            ON lesson__info.lesson_type_id = lesson__type.ID 
            WHERE lesson__info.ID = ? OR ? = 0
        `;
        query = mysql.format(statement, [lessonId, lessonId]);
        queryRS = await module.exports.dbQuery_promise(query);
        return queryRS;
    },
    getLeesonType: async () => {
        let statement, query, queryRS;
        statement = `SELECT * FROM lesson__type`;
        query = mysql.format(statement, [0]);
        queryRS = await module.exports.dbQuery_promise(query);
        return queryRS;
    },
    addLessonToDb: async (queryBody , userID) => {
        let statement, query, queryRS;
        if(queryBody.ID){
            statement = `UPDATE lesson__info SET title=? ,lesson_type_id=?, image_url=?, image_alt_text=? , description=? ,editor_user_id=? WHERE ID=?`;
        }else{
            statement = `INSERT INTO lesson__info(title, lesson_type_id, image_url, image_alt_text, description,creator_user_id) VALUES (?,?,?,?,?,?)`;
        }  
        query = mysql.format(statement, [queryBody.title,queryBody.lesson_type_id,queryBody.image_url,queryBody.image_alt_text,queryBody.description,userID , queryBody.ID]);
        queryRS = await module.exports.dbQuery_promise(query);
        return queryRS;
    },
    deleteLesson: async (lessonId) => {
        let statement, query, queryRS;
        statement = `DELETE FROM lesson__info WHERE ID=?`;
        query = mysql.format(statement, [lessonId]);
        console.log(query);
        queryRS = await module.exports.dbQuery_promise(query);
        return queryRS;
    },


    loadJob: async (jobId) => {
        let statement, query, queryRS;
        statement = `
            SELECT job__info.*, job__type.title AS type_title 
            FROM job__info 
            INNER JOIN job__type 
            ON job__info.job_type_id = job__type.ID 
            WHERE job__info.ID = ? OR ? = 0
        `;
        query = mysql.format(statement, [jobId, jobId]);
        queryRS = await module.exports.dbQuery_promise(query);
        return queryRS;
    },
    getJobType: async () => {
        let statement, query, queryRS;
        statement = `SELECT * FROM job__type`;
        query = mysql.format(statement, [0]);
        queryRS = await module.exports.dbQuery_promise(query);
        return queryRS;
    },
    addJobToDb: async (queryBody , userID) => {
        let statement, query, queryRS;
        if(queryBody.ID){
            statement = `UPDATE job__info SET title=? ,job_type_id=?, image_url=?, image_alt_text=? , description=? ,editor_user_id=? WHERE ID=?`;
        }else{
            statement = `INSERT INTO job__info(title, job_type_id, image_url, image_alt_text, description,creator_user_id) VALUES (?,?,?,?,?,?)`;
        }  
        query = mysql.format(statement, [queryBody.title,queryBody.job_type_id,queryBody.image_url,queryBody.image_alt_text,queryBody.description,userID , queryBody.ID]);
        queryRS = await module.exports.dbQuery_promise(query);
        return queryRS;
    },
    deleteJob: async (jobId) => {
        let statement, query, queryRS;
        statement = `DELETE FROM job__info WHERE ID=?`;
        query = mysql.format(statement, [jobId]);
        console.log(query);
        queryRS = await module.exports.dbQuery_promise(query);
        return queryRS;
    },


    loadJobLesson: async (jobLessonId) => {
        let statement, query, queryRS;
        statement = `
            SELECT 
            job__lesson_relation.ID As rel_id,
            job__lesson_relation.job_id, 
            job__info.title AS job_title, 
            GROUP_CONCAT(CONCAT(lesson__info.title , '^' , lesson__info.ID) SEPARATOR '@') AS lessons 
            FROM 
            job__lesson_relation 
            INNER JOIN job__info ON job__lesson_relation.job_id = job__info.ID 
            INNER JOIN lesson__info ON job__lesson_relation.lesson_id = lesson__info.ID 
            GROUP BY job__lesson_relation.job_id, job__info.title
        `;
        query = mysql.format(statement, [jobLessonId, jobLessonId]);
        queryRS = await module.exports.dbQuery_promise(query);
        return queryRS;
    },
    addJobLessonRelationToDb: async (queryBody , userID) => {
        let statement, query, queryRS;
        statement = `INSERT INTO job__lesson_relation(job_id, lesson_id , creator_user_id) VALUES (?,?,?)`;
        query = mysql.format(statement, [queryBody.jobId,queryBody.lessonId , userID]);
        queryRS = await module.exports.dbQuery_promise(query);
        return queryRS;
    },
    deleteJobLessonRelation: async (queryBody) => {
        let statement, query, queryRS;
        statement = `DELETE FROM job__lesson_relation WHERE job_id=? AND lesson_id=?`;
        query = mysql.format(statement, [queryBody.jobId , queryBody.lessonId]);
        queryRS = await module.exports.dbQuery_promise(query);
        return queryRS;
    },
}