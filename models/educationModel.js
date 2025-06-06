const { parse } = require("dotenv");
const { dbCon, mysql } = require("../config/dbConnection");
const tools = require("../utils/tools");
const moment = require('moment-timezone');

const bcrypt = require("bcrypt");
const { query } = require("express");
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
    getUserDetail: async (userId) => {
        let statement = `SELECT * FROM user__info WHERE ID=?`;
        let query = mysql.format(statement, [userId]);
        let userData = await module.exports.dbQuery_promise(query);
        return userData;
    },
    getUserDetailByTeacherId: async (teacherId) => {
        let statement = `SELECT user__info.*
                FROM user__info
                INNER JOIN teachers__info ON teachers__info.user_id = user__info.ID
                WHERE teachers__info.ID =?`;
        let query = mysql.format(statement, [teacherId]);
        let userData = await module.exports.dbQuery_promise(query);
        return userData;
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
    getJcenterEducationGroups: async (jcecnterId) => {
        let statement, query, queryRS;
        statement = ` SELECT education__group.*
        FROM jcenters__eduGroup_relation
        INNER JOIN education__group ON education__group.ID = jcenters__eduGroup_relation.education_group_id
        WHERE jcenters__eduGroup_relation.status='Active' AND jcenters__eduGroup_relation.jcenter_id=?`;
        query = mysql.format(statement, [jcecnterId]);
        queryRS = await module.exports.dbQuery_promise(query);
        return queryRS;
    },
    getEducationGroupLessonData: async (eduGroupId) => {
        let statement, query, queryRS;
        statement = ` SELECT lesson__info.*
                FROM lesson__eduGroup_relation
                INNER JOIN education__group ON education__group.ID =lesson__eduGroup_relation.education_group_id
                INNER JOIN lesson__info ON lesson__info.ID = lesson__eduGroup_relation.lesson_id
                WHERE lesson__eduGroup_relation.status='Active' AND lesson__eduGroup_relation.education_group_id=?`;
        query = mysql.format(statement, [eduGroupId]);
        queryRS = await module.exports.dbQuery_promise(query);
        return queryRS;
    },

    getClassTeacherData: async (classId) => {
        let statement, query, queryRS;
        statement = ` SELECT 
        classes__teacher_relation.ID,
        classes__teacher_relation.status,
CONCAT(teachers__info.f_name , ' ' , teachers__info.l_name) AS teacherName
FROM 
classes__teacher_relation 
INNER JOIN teachers__info ON classes__teacher_relation.teacher_id = teachers__info.ID
WHERE classes__teacher_relation.classe_id=?`;
        query = mysql.format(statement, [classId]);
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

    addEducationGroupToDb: async (queryBody, userID) => {
        let statement, query, queryRS;
        if (queryBody.ID) {
            statement = `UPDATE education__group SET main_id=? , title=? ,image_url=? , image_alt_text=? , title_in_card=? , priority=? , description=? ,editor_user_id=? WHERE ID=?`;
        } else {
            statement = `INSERT INTO education__group(main_id, title, image_url, image_alt_text, title_in_card, priority, description,creator_user_id) VALUES (?,?,?,?,?,?,?,?)`;
        }
        query = mysql.format(statement, [queryBody.main_id, queryBody.title, queryBody.image_url, queryBody.image_alt_text, queryBody.title_in_card, queryBody.priority, queryBody.description, userID, queryBody.ID]);
        queryRS = await module.exports.dbQuery_promise(query);
        return queryRS;
    },

    updateEducationGroupStatus: async (educationGroupID, targetStatus) => {
        let statement, query, queryRS;
        statement = `UPDATE education__group SET status=? WHERE ID=?`;
        query = mysql.format(statement, [targetStatus, educationGroupID]);
        queryRS = await module.exports.dbQuery_promise(query);
        return queryRS;
    },

    deleteEducationGroup: async (educationGroupID) => {
        let statement, query, queryRS;
        statement = `UPDATE education__group SET status='Inactive' WHERE ID=?`;
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
            WHERE status!='Deleted' AND lesson__info.ID = ? OR ? = 0
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
    addLessonToDb: async (queryBody, userID) => {
        let statement, query, queryRS;
        if (queryBody.ID) {
            statement = `UPDATE lesson__info SET title=? ,lesson_type_id=?, image_url=?, image_alt_text=? , description=? ,editor_user_id=? WHERE ID=?`;
        } else {
            statement = `INSERT INTO lesson__info(title, lesson_type_id, image_url, image_alt_text, description,creator_user_id) VALUES (?,?,?,?,?,?)`;
        }
        query = mysql.format(statement, [queryBody.title, queryBody.lesson_type_id, queryBody.image_url, queryBody.image_alt_text, queryBody.description, userID, queryBody.ID]);
        queryRS = await module.exports.dbQuery_promise(query);
        return queryRS;
    },
    submitExamCenterTime: async (reserveDate, reserveTime, reserveCenter, userId, jobLessonId, isJobExam) => {
        let statement, query, queryRS;
        if (isJobExam === true) {
            statement = `UPDATE job__exam_user_relation SET status="Waiting_To_Center_Accept",exam_date=?,start_time=?,end_time=?,exam_center_id=? WHERE user_id=? AND job_id=?`;
        } else {
            statement = `UPDATE job__exam_user_relation SET status="Waiting_To_Center_Accept",exam_date=?,start_time=?,end_time=?,exam_center_id=? WHERE user_id=? AND lesson_id=?`;
        }
        query = mysql.format(statement, [reserveDate, reserveTime, reserveTime + 2, reserveCenter, userId, jobLessonId]);
        queryRS = await module.exports.dbQuery_promise(query);
        return queryRS;
    },
    loadReserveDetails: async (examId, userID, isJobExam) => {
        let statement, query, queryRS;
        statement = `SELECT
jcenters__info.title,
job__exam_user_relation.exam_date,
job__exam_user_relation.start_time,
job__exam_user_relation.end_time
FROM 
job__exam_user_relation
INNER JOIN jcenters__info ON job__exam_user_relation.exam_center_id = jcenters__info.ID
WHERE user_id = ?  AND `+ (isJobExam ? `job_id=?` : `lesson_id=?`);
        query = mysql.format(statement, [userID, examId]);
        queryRS = await module.exports.dbQuery_promise(query);
        return queryRS;
    },
    submitRequestChange: async (requestId, actionType) => {
        let statement, query, queryRS;
        statement = `UPDATE job__exam_user_relation SET status=? WHERE ID=?`;
        query = mysql.format(statement, [actionType === 'Reject' ? "Reject_request" : "Ready_To_Exam", requestId]);
        queryRS = await module.exports.dbQuery_promise(query);
        return queryRS;
    },
    getExamQuestions: async (examId, examType) => {
        let statement, query, queryRS;
        statement = `SELECT * , 
        CONCAT(choice_1 , "@" , choice_2, "@" , choice_3, "@" , choice_4) AS answers FROM question__info ORDER BY RAND() LIMIT 30`;
        query = mysql.format(statement, [examId, examType]);
        queryRS = await module.exports.dbQuery_promise(query);
        return queryRS;
    },
    deleteLesson: async (lessonId) => {
        let statement, query, queryRS;
        // statement = `DELETE FROM lesson__info WHERE ID=?`;
        statement = `UPDATE lesson__info SET status='Deleted' WHERE ID=?`;
        query = mysql.format(statement, [lessonId]);
        queryRS = await module.exports.dbQuery_promise(query);
        return queryRS;
    },

    updateLessonStatus: async (lessonId, targetStatus) => {
        let statement, query, queryRS;
        statement = `UPDATE lesson__info SET status=? WHERE ID=?`;
        query = mysql.format(statement, [targetStatus, lessonId]);
        queryRS = await module.exports.dbQuery_promise(query);
        return queryRS;
    },


    getLessonEduGroupRelationData: async (lessonId) => {
        let statement, query, queryRS;
        statement = `SELECT
        lesson__eduGroup_relation.ID,
        lesson__info.title AS lessonTitle,
        education__group.title AS eduGroupTitle,
        lesson__eduGroup_relation.status
        FROM lesson__eduGroup_relation
        INNER JOIN lesson__info ON lesson__info.ID = lesson__eduGroup_relation.lesson_id
        INNER JOIN education__group ON education__group.ID = lesson__eduGroup_relation.education_group_id
        WHERE lesson__eduGroup_relation.lesson_id=?`;
        query = mysql.format(statement, [lessonId]);
        queryRS = await module.exports.dbQuery_promise(query);
        return queryRS;
    },

    submitLessonEduGroupRel: async (lessonId, eduGroupId) => {
        let statement, query, queryRS;
        statement = `INSERT INTO lesson__eduGroup_relation(lesson_id,education_group_id) VALUES (?,?)`;
        query = mysql.format(statement, [lessonId, eduGroupId]);
        queryRS = await module.exports.dbQuery_promise(query);
        if (queryRS.insertId > 0) {
            return queryRS.insertId;
        } else {
            return -1;
        }
    },
    getLessonEduGroupRelShortData: async (lessonId, eduGroupId) => {
        let statement, query, queryRS;
        statement = `SELECT * FROM lesson__eduGroup_relation WHERE education_group_id=? AND lesson_id =?`;
        query = mysql.format(statement, [eduGroupId, lessonId]);
        queryRS = await module.exports.dbQuery_promise(query);
        if (queryRS.length > 0) {
            return queryRS;
        } else {
            return -1;
        }
    },
    updateLessonEduGroupRelStatus: async (lessonEduGroupRelId, lessonEduGroupRelStatus) => {
        let statement, query, queryRS;
        let needStatus = 'Active';
        if (lessonEduGroupRelStatus == 0) {
            needStatus = 'Inactive';
        }
        statement = `UPDATE lesson__eduGroup_relation SET status=? WHERE ID=?`;
        query = mysql.format(statement, [needStatus, lessonEduGroupRelId]);
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
    getWithExamJob: async () => {
        let statement, query, queryRS;
        statement = `SELECT * FROM job__info WHERE active_exam="Active"`;
        query = mysql.format(statement, [0]);
        queryRS = await module.exports.dbQuery_promise(query);
        return queryRS;
    },
    getWithExamLesson: async () => {
        let statement, query, queryRS;
        statement = `SELECT * FROM lesson__info WHERE active_exam="Active"`;
        query = mysql.format(statement, [0]);
        queryRS = await module.exports.dbQuery_promise(query);
        return queryRS;
    },
    getAllExam: async (userID, mood) => {
        let statement, query, queryRS, returnRs;
        let allowJobArray = [0];
        let allowLessonArray = [0];
        if (mood !== 'Active') {
            let targetStatus = '';
            if (mood === 'My_Exam_Set') {
                targetStatus = '"Active"';
            } else if (mood === 'My_Exam_Waiting') {
                targetStatus = '"Waiting_To_Center_Accept"';
            } else if (mood === 'My_Exam_Active') {
                targetStatus = '"Ready_To_Exam"';
            } else if (mood === 'Canceled') {
                targetStatus = '"Canceled"';
            } else if (mood === 'My_Exam_Cancel') {
                targetStatus = '"Archive"';
            }
            jobResults = await module.exports.dbQuery_promise('SELECT * FROM job__exam_user_relation WHERE user_id=' + userID + ' AND job_id > 0 AND status IN(' + targetStatus + ')');
            allowJobArray.push(...jobResults.map(row => row.job_id));
            lessonResults = await module.exports.dbQuery_promise('SELECT * FROM job__exam_user_relation WHERE user_id=' + userID + ' AND lesson_id > 0 AND status IN(' + targetStatus + ')');
            allowLessonArray.push(...lessonResults.map(row => row.lesson_id));
        }
        statement = `SELECT 
        job__info.ID,
job__info.title,
job__info.image_url,
GROUP_CONCAT(lesson__info.title) AS lesson_list,
COUNT(job__lesson_relation.ID) AS lesson_num,
COUNT(job__lesson_relation.ID) * 30 AS duration,
"آزمون شغل" AS Type,
"JOB" AS Exam_Type,
10000000 AS expense,
"/images/logo/JLogo-Black.png" AS provider_logo,
job__info.description
FROM 
job__info 
INNER JOIN job__lesson_relation ON job__info.ID = job__lesson_relation.job_id
INNER JOIN lesson__info ON lesson__info.ID = job__lesson_relation.lesson_id
WHERE 
job__info.active_exam="Active" `+ (mood !== 'Active' ? ` AND job__info.ID IN (` + allowJobArray.join(',') + `)` : '') + `
GROUP BY job__lesson_relation.job_id`;
        query = mysql.format(statement, [0]);
        returnRs = await module.exports.dbQuery_promise(query);
        statement = `SELECT 
        lesson__info.ID,
        lesson__info.title,
        lesson__info.image_url,
        '' AS leeson_list,
        1 AS lesson_num,
        lesson__info.title AS lesson_list,
        30 AS  duration,
        "آزمون تک درس" AS Type,
        "LESSON" AS Exam_Type,
        2000000 AS expense,
"/images/logo/JLogo-Black.png" AS provider_logo,
lesson__info.description
        FROM 
        lesson__info WHERE active_exam="Active" `+ (mood !== 'Active' ? ` AND lesson__info.ID IN (` + allowLessonArray.join(',') + `)` : '');
        query = mysql.format(statement, [0]);
        queryRS = await module.exports.dbQuery_promise(query);
        returnRs.push(...queryRS);
        return returnRs;
    },
    getJobType: async () => {
        let statement, query, queryRS;
        statement = `SELECT * FROM job__type`;
        query = mysql.format(statement, [0]);
        queryRS = await module.exports.dbQuery_promise(query);
        return queryRS;
    },
    submitJobExamRelation: async (jobExamRelation) => {
        let statement, query, queryRS;
        for (let i = 0; i < jobExamRelation.length; i++) {
            statement = `UPDATE job__lesson_relation SET question_num=?,rate =? WHERE ID=?`;
            query = mysql.format(statement, [jobExamRelation[i]['question_num'], jobExamRelation[i]['rate'], jobExamRelation[i]['ID']]);
            queryRS = await module.exports.dbQuery_promise(query);
        }
        return queryRS;
    },
    loadExamPlanForCenter: async (centerId) => {
        let statement, query, queryRS;
        statement = `SELECT * FROM job__exam_plan WHERE center_id=?`;
        query = mysql.format(statement, [centerId]);
        queryRS = await module.exports.dbQuery_promise(query);
        return queryRS;
    },
    loadExamCenterForOstan: async (ostanId) => {
        let statement, query, queryRS;
        statement = `SELECT * FROM jcenters__info WHERE (parent_id IS NULL OR parent_id = 0) AND center_mood="exam_center" AND state_id = ?`;
        query = mysql.format(statement, [ostanId]);
        queryRS = await module.exports.dbQuery_promise(query);
        return queryRS;
    },
    loadExamCenterPlan: async (centerId) => {
        let weekNum = 2;
        let statement, query, queryRS;
        statement = `SELECT * FROM job__exam_plan WHERE center_id = 11`;
        query = mysql.format(statement, [centerId]);
        queryRS = await module.exports.dbQuery_promise(query);
        let returnResult = [];
        for (let i = 0; i < queryRS.length; i++) {
            let capacity = queryRS[i]['capacity'];
            let returnDte = await module.exports.loadExamCenterPlanItem(queryRS[i]['day_id'], weekNum);
            for (let j = 0; j < returnDte.length; j++) {
                let temp1 = [[returnDte[j]]];
                let temp2 = [];
                for (let k = queryRS[i]['from']; k < queryRS[i]['to']; k = k + 2) {
                    let tempArray = [];
                    tempArray.push(k);
                    tempArray.push(k + 2);
                    tempArray.push(capacity);
                    let tempRs = await module.exports.dbQuery_promise('SELECT * FROM job__exam_user_relation WHERE exam_center_id=' + centerId + ' AND exam_date="' + returnDte[j] + '" AND start_time=' + k);
                    let remaining = capacity - tempRs.length;
                    tempArray.push(remaining);
                    temp2.push(tempArray);
                }
                returnResult.push(temp1, temp2);
            }
        }
        let formattedData = []
        for (let i = 0; i < returnResult.length; i += 2) {
            const date = returnResult[i][0][0];
            const times = returnResult[i + 1];
            formattedData.push({ date, times });
        }
        return formattedData;
    },
    loadExamCenterPlanItem: async (dayId, weeks) => {
        if (dayId === 0) {
            dayId = 6;
        } else {
            dayId = dayId - 1;
        }
        if (dayId < 0 || dayId > 6 || weeks < 1) {
            throw new Error("Invalid input: dayId must be between 0-6 and weeks must be at least 1");
        }

        const today = new Date();
        const currentDay = today.getDay(); // 0 for Sunday, 6 for Saturday (adjust accordingly)
        const offset = (dayId - currentDay + 7) % 7; // Days until the next target weekday
        const firstTargetDate = new Date(today);
        firstTargetDate.setDate(today.getDate() + offset);

        const dates = [];
        for (let i = 0; i < weeks; i++) {
            const futureDate = new Date(firstTargetDate);
            futureDate.setDate(firstTargetDate.getDate() + i * 7);
            dates.push(futureDate.toISOString().split('T')[0]); // Format as YYYY-MM-DD
        }
        return dates;
    },
    submitExamPlan: async (queryBody, userID) => {
        let statement, query, queryRS;
        if (queryBody.ID) {
            statement = 'UPDATE job__exam_plan SET center_id=? ,day_id=?, `from`=?, `to`=? , capacity=? WHERE ID=?';
        } else {
            statement = 'INSERT INTO job__exam_plan(center_id, day_id, `from`, `to`,capacity) VALUES (?,?,?,?,?)';
        }
        query = mysql.format(statement, [userID, queryBody.day_id, module.exports.formatDateTime(queryBody.from, 'Time'), module.exports.formatDateTime(queryBody.to, 'Time'), queryBody.capacity, queryBody.ID]);
        queryRS = await module.exports.dbQuery_promise(query);
        return queryRS;;
    },
    loadLessonForJob: async (jobId) => {
        let statement, query, queryRS;
        statement = `SELECT 
job__lesson_relation.question_num,
job__lesson_relation.job_id,
job__lesson_relation.lesson_id,
job__lesson_relation.rate,
lesson__info.title AS lesson_text,
job__info.title AS job_text,
job__info.title AS job_title,
job__lesson_relation.ID
FROM 
job__lesson_relation
INNER JOIN job__info ON job__lesson_relation.job_id = job__info.ID
INNER JOIN lesson__info ON job__lesson_relation.lesson_id = lesson__info.ID
WHERE
job__lesson_relation.job_id = ?`;
        query = mysql.format(statement, [jobId]);
        queryRS = await module.exports.dbQuery_promise(query);
        return queryRS;
    },
    addJobToDb: async (queryBody, userID) => {
        let statement, query, queryRS;
        if (queryBody.ID) {
            statement = `UPDATE job__info SET title=? ,job_type_id=?, image_url=?, image_alt_text=? , description=? ,editor_user_id=? WHERE ID=?`;
        } else {
            statement = `INSERT INTO job__info(title, job_type_id, image_url, image_alt_text, description,creator_user_id) VALUES (?,?,?,?,?,?)`;
        }
        query = mysql.format(statement, [queryBody.title, queryBody.job_type_id, queryBody.image_url, queryBody.image_alt_text, queryBody.description, userID, queryBody.ID]);
        queryRS = await module.exports.dbQuery_promise(query);
        return queryRS;
    },
    deleteJob: async (jobId) => {
        let statement, query, queryRS;
        statement = `DELETE FROM job__info WHERE ID=?`;
        query = mysql.format(statement, [jobId]);
        queryRS = await module.exports.dbQuery_promise(query);
        return queryRS;
    },
    loadExamApplicantForExamCenter: async (examCenterUserId) => {
        examCenterUserId = 7;
        let statement, query, queryRS, queryRS1, queryRS2;
        statement = `SELECT 
        job__exam_user_relation.ID,
job__exam_user_relation.exam_date,
CONCAT(job__exam_user_relation.start_time , ' - ',job__exam_user_relation.end_time) AS Exam_Time,
job__info.title AS Exam_Title,
"آزمون شغل" AS Exam_Type,
CONCAT(user__info.fname , ' ' , user__info.lname)AS applicant_name,
job__exam_user_relation.last_change,
job__exam_user_relation.status
FROM 
job__exam_user_relation
INNER JOIN job__info ON job__exam_user_relation.job_id = job__info.ID
INNER JOIN user__info ON job__exam_user_relation.user_id = user__info.ID
WHERE 
job__exam_user_relation.status IN ("Waiting_To_Center_Accept") AND 
job__exam_user_relation.job_id > 0 AND exam_center_id =?`;
        query = mysql.format(statement, [examCenterUserId]);
        queryRS1 = await module.exports.dbQuery_promise(query);

        statement = `SELECT 
        job__exam_user_relation.ID,
job__exam_user_relation.exam_date,
CONCAT(job__exam_user_relation.start_time , ' - ',job__exam_user_relation.end_time) AS Exam_Time,
lesson__info.title AS Exam_Title,
"آزمون تک درس" AS Exam_Type,
CONCAT(user__info.fname , ' ' , user__info.lname)AS applicant_name,
job__exam_user_relation.last_change,
job__exam_user_relation.status
FROM 
job__exam_user_relation
INNER JOIN lesson__info ON job__exam_user_relation.lesson_id = lesson__info.ID
INNER JOIN user__info ON job__exam_user_relation.user_id = user__info.ID
WHERE 
job__exam_user_relation.status IN ("Waiting_To_Center_Accept","Ready_To_Exam","Reject_request") AND 
job__exam_user_relation.lesson_id > 0 AND exam_center_id =?`;
        query = mysql.format(statement, [examCenterUserId]);
        queryRS2 = await module.exports.dbQuery_promise(query);
        queryRS = [];
        queryRS.push(...queryRS1);
        queryRS.push(...queryRS2);
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
    addJobLessonRelationToDb: async (queryBody, userID) => {
        let query;
        let selectLessonList = queryBody.selectLessonList;

        query = 'INSERT IGNORE INTO job__lesson_relation(job_id, lesson_id, creator_user_id) VALUES ';
        query += selectLessonList
            .map(id => `(${parseInt(queryBody.job_id)}, ${parseInt(id)}, ${userID})`)
            .join(',');

        try {
            const queryRS = await module.exports.dbQuery_promise(query);
            return {
                message: 'Insert operation completed.',
                affectedRows: queryRS.affectedRows,
            };
        } catch (err) {
            throw err;
        }
    },
    deleteJobLessonRelation: async (queryBody) => {
        let statement, query, queryRS;
        statement = `DELETE FROM job__lesson_relation WHERE job_id=? AND lesson_id=?`;
        query = mysql.format(statement, [queryBody.jobId, queryBody.lessonId]);
        queryRS = await module.exports.dbQuery_promise(query);
        return queryRS;
    },

    loadTeacher: async (jcenterId) => {
        let statement, query, queryRS;
        statement = `
            SELECT 
            teachers__info.*,
            CONCAT(f_name,' ',l_name) AS full_name,
            teachers__degree.title AS degree_title , 
            teachers__job.title AS job_title,
            jcenters__info.title AS jcenters_title
            FROM teachers__info
            INNER JOIN teachers__degree ON teachers__info.degree_id = teachers__degree.ID
            INNER JOIN teachers__job ON teachers__info.job_id = teachers__job.ID
            INNER JOIN teachers__jcenter_relation ON teachers__jcenter_relation.teacher_id=teachers__info.ID
            INNER JOIN jcenters__info ON teachers__jcenter_relation.center_id = jcenters__info.ID
            WHERE teachers__jcenter_relation.center_id=?
        `;
        query = mysql.format(statement, [jcenterId]);
        queryRS = await module.exports.dbQuery_promise(query);
        return queryRS;
    },


    loadLessonTeacher: async (lessonId, jcenterId) => {
        let statement, query, queryRS;
        statement = `
            SELECT 
            teachers__info.*,
            CONCAT(f_name,' ',l_name) AS full_name,
            teachers__degree.title AS degree_title , 
            teachers__job.title AS job_title,
            jcenters__info.title AS jcenters_title
            FROM teachers__info
            INNER JOIN teachers__degree ON teachers__info.degree_id = teachers__degree.ID
            INNER JOIN teachers__job ON teachers__info.job_id = teachers__job.ID
            INNER JOIN teachers__jcenter_relation ON teachers__jcenter_relation.teacher_id=teachers__info.ID
            INNER JOIN jcenters__info ON teachers__jcenter_relation.center_id = jcenters__info.ID
            INNER JOIN teachers__lesson_relation ON teachers__info.ID = teachers__lesson_relation.teacher_id
        	WHERE teachers__lesson_relation.lesson_id = ? AND teachers__jcenter_relation.center_id=? AND teachers__lesson_relation.status='Active'`;
        query = mysql.format(statement, [lessonId, jcenterId]);
        queryRS = await module.exports.dbQuery_promise(query);
        return queryRS;
    },


    loadTeacherDegree: async () => {
        let statement, query, queryRS;
        statement = `SELECT * FROM teachers__degree`;
        query = mysql.format(statement, [0]);
        queryRS = await module.exports.dbQuery_promise(query);
        return queryRS;
    },
    loadTeacherJob: async () => {
        let statement, query, queryRS;
        statement = `SELECT * FROM teachers__job`;
        query = mysql.format(statement, [0]);
        queryRS = await module.exports.dbQuery_promise(query);
        return queryRS;
    },
    loadJcenter: async () => {
        let statement, query, queryRS;
        statement = `SELECT * FROM jcenters__info`;
        query = mysql.format(statement, [0]);
        queryRS = await module.exports.dbQuery_promise(query);
        return queryRS;
    },
    loadDepartment: async () => {
        let statement, query, queryRS;
        statement = `SELECT * FROM education__department`;
        query = mysql.format(statement, [0]);
        queryRS = await module.exports.dbQuery_promise(query);
        return queryRS;
    },
    loadClassEducationGroup: async (jCenterId, departmentId) => {
        let statement, query, queryRS;
        statement = `SELECT education__group.* FROM education__group
        INNER JOIN jcenters__eduGroup_relation ON jcenters__eduGroup_relation.education_group_id = education__group.ID
        WHERE jcenters__eduGroup_relation.jcenter_id =? AND jcenters__eduGroup_relation.department_id =?`;
        query = mysql.format(statement, [jCenterId, departmentId]);
        queryRS = await module.exports.dbQuery_promise(query);
        return queryRS;
    },
    loadClassDepartMent: async (jCenterId) => {
        let statement, query, queryRS;
        statement = `SELECT education__department.* FROM education__department
INNER JOIN jcenters__department_relation ON 
jcenters__department_relation.department_id = education__department.ID
WHERE jcenters__department_relation.jcenter_id = ?`;
        query = mysql.format(statement, [jCenterId]);
        queryRS = await module.exports.dbQuery_promise(query);
        return queryRS;
    },
    getClassLesson: async (groupId) => {
        let statement, query, queryRS;
        statement = `SELECT lesson__info.* FROM lesson__info
INNER JOIN lesson__eduGroup_relation ON 
lesson__eduGroup_relation.lesson_id = lesson__info.ID
WHERE lesson__eduGroup_relation.education_group_id = ?`;
        query = mysql.format(statement, [groupId]);
        queryRS = await module.exports.dbQuery_promise(query);
        return queryRS;
    },
    loadCertificateInfo: async () => {
        let statement, query, queryRS;
        statement = `SELECT * FROM certificate__info`;
        query = mysql.format(statement, [0]);
        queryRS = await module.exports.dbQuery_promise(query);
        return queryRS;
    },
    loadCertificateStructure: async () => {
        let statement, query, queryRS;
        statement = `SELECT * FROM certificate__structure`;
        query = mysql.format(statement, [0]);
        queryRS = await module.exports.dbQuery_promise(query);
        return queryRS;
    },
    addTeacherInfoToDb: async (queryBody, userID) => {
        let statement, query, queryRS, userRs, addUserResult;
        let newUser = false;
        if (queryBody.ID) {
            statement = `UPDATE teachers__info SET f_name=?, l_name=?, father_name=?, gender=?, national_code=?, mobile=?, mobile2=?, email=?, image_url=?, place_of_birth=?, birthday=?, is_foreigner=?, job_id=?, degree_id=?, biography=?, postal_address=?, insurance_code=?, sheba=?, bank_acount=?,editor_user_id=? WHERE ID=?`;
        } else {
            statement = `INSERT INTO teachers__info(f_name, l_name, father_name, gender, national_code, mobile, mobile2, email, image_url, place_of_birth, birthday, is_foreigner, job_id, degree_id, biography, postal_address, insurance_code, sheba, bank_acount,creator_user_id) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`;
            newUser = true;
        }
        query = mysql.format(statement, [queryBody.f_name, queryBody.l_name, queryBody.father_name, queryBody.gender, queryBody.national_code, queryBody.mobile, queryBody.mobile2, queryBody.email, queryBody.image_url, queryBody.place_of_birth, queryBody.birthday, queryBody.is_foreigner, queryBody.job_id, queryBody.degree_id, queryBody.biography, queryBody.postal_address, queryBody.insurance_code, queryBody.sheba, queryBody.bank_acount, userID, queryBody.ID]);
        queryRS = await module.exports.dbQuery_promise(query);
        if (newUser && queryRS.insertId) {
            let teacherId = queryRS.insertId
            statement = `INSERT INTO teachers__jcenter_relation(teacher_id,center_id) VALUES (?,?)`;
            query = mysql.format(statement, [teacherId, queryBody.jcenters_id]);
            await module.exports.dbQuery_promise(query);
            let hashedPassword = await bcrypt.hash(queryBody.mobile, 10);
            let sqlInsert = "INSERT INTO user__info(code,fname,lname,mobile,password,permission) VALUES (?,?,?,?,?,?)";
            let insert_query = mysql.format(sqlInsert, ['T' + teacherId, queryBody.f_name, queryBody.l_name, queryBody.mobile, hashedPassword, 8]);
            userRs = await module.exports.dbQuery_promise(insert_query);

            let themeInsert = "INSERT INTO `user__them_setting`(`user_id`) VALUES (?)";
            let insert_theme_query = mysql.format(themeInsert, [userRs.insertId]);
            userRs = await module.exports.dbQuery_promise(insert_theme_query);


            let sqlUpdate = "UPDATE teachers__info SET user_id=? WHERE ID=?";
            let update_query = mysql.format(sqlUpdate, [userRs.insertId, teacherId]);
            userRs = await module.exports.dbQuery_promise(update_query);
        } else {
            // let hashedPassword = await bcrypt.hash(queryBody.password, 10);
            let sqlInsert = "UPDATE user__info SET fname=?,lname=?,mobile=? WHERE ID=?";
            let insert_query = mysql.format(sqlInsert, [queryBody.f_name, queryBody.l_name, queryBody.mobile, queryBody.user_id]);
            await module.exports.dbQuery_promise(insert_query);
        }
        return queryRS;
    },
    deleteTeacher: async (teacherId) => {
        let statement, query, queryRS;
        statement = `DELETE FROM teachers__info WHERE ID=?`;
        query = mysql.format(statement, [teacherId]);
        queryRS = await module.exports.dbQuery_promise(query);
        return queryRS;
    },

    getTeacherIdByUserId: async (userID) => {
        let statement, query, queryRS;
        statement = `SELECT ID FROM teachers__info WHERE user_id=?`;
        query = mysql.format(statement, [userID]);
        queryRS = await module.exports.dbQuery_promise(query);
        return queryRS[0]['ID'];
    },

    loadJcenterInfoByUser: async (userID) => {
        let statement, query, queryRS;
        statement = `SELECT * FROM jcenters__info WHERE user_id=?`;
        query = mysql.format(statement, [userID]);
        queryRS = await module.exports.dbQuery_promise(query);
        return queryRS;
    },

    getTeacherLessonRelationData: async (teacherId) => {
        let statement, query, queryRS;
        statement = `SELECT
            teachers__lesson_relation.ID,
            CONCAT(teachers__info.f_name ,' ' ,teachers__info.l_name) AS teacherName,
            education__group.title AS eduGroupTitle,
            lesson__info.title AS lessonTitle,
            teachers__lesson_relation.status
            FROM teachers__lesson_relation
            INNER JOIN teachers__info ON teachers__info.ID = teachers__lesson_relation.teacher_id
            INNER JOIN education__group ON education__group.ID = teachers__lesson_relation.education_group_id
            INNER JOIN lesson__info ON lesson__info.ID = teachers__lesson_relation.lesson_id
            WHERE teachers__lesson_relation.teacher_id=?`;
        query = mysql.format(statement, [teacherId]);
        queryRS = await module.exports.dbQuery_promise(query);
        return queryRS;
    },
    submitTeacherLessonRel: async (teacherId, eduGroupId, lessonId) => {
        let statement, query, queryRS;
        statement = `INSERT INTO teachers__lesson_relation(teacher_id,education_group_id,lesson_id) VALUES (?,?,?)`;
        query = mysql.format(statement, [teacherId, eduGroupId, lessonId]);
        queryRS = await module.exports.dbQuery_promise(query);
        if (queryRS.insertId > 0) {
            return queryRS.insertId;
        } else {
            return -1;
        }
    },

    submitClassTeacherRel: async (teacherId, classId) => {
        let statement, query, queryRS;

        statement = `INSERT INTO classes__teacher_relation(classe_id,teacher_id) VALUES (?,?)`;
        query = mysql.format(statement, [classId, teacherId]);
        queryRS = await module.exports.dbQuery_promise(query);
        if (queryRS.insertId > 0) {
            return queryRS.insertId;
        } else {
            return -1;
        }
    },

    updateTeacherLessonRelStatus: async (teacherLessonRelId, teacherLessonRelStatus) => {
        let statement, query, queryRS;
        let needStatus = 'Active';
        if (teacherLessonRelStatus == 0) {
            needStatus = 'Inactive';
        }
        statement = `UPDATE teachers__lesson_relation SET status=? WHERE ID=?`;
        query = mysql.format(statement, [needStatus, teacherLessonRelId]);
        queryRS = await module.exports.dbQuery_promise(query);
        return queryRS;
    },
    updateClassTeacherRelStatus: async (classTeacherRelId, classTeacherRelStatus) => {
        let statement, query, queryRS;
        let needStatus = 'Active';
        if (classTeacherRelStatus == 0) {
            needStatus = 'Inactive';
        }
        statement = `UPDATE classes__teacher_relation SET status=? WHERE ID=?`;
        query = mysql.format(statement, [needStatus, classTeacherRelId]);
        queryRS = await module.exports.dbQuery_promise(query);
        return queryRS;
    },

    updateClassStatus: async (classesId, targetStatus) => {
        let statement, query, queryRS;
        statement = `UPDATE classes__info SET status=? WHERE ID=?`;
        query = mysql.format(statement, [targetStatus, classesId]);
        queryRS = await module.exports.dbQuery_promise(query);
        return queryRS;
    },

    getUserClassesToCheckForRegister: async (userId) => {
        let statement, query, queryRS;
        statement = `SELECT 
        user__cart.ID AS cartId, 
        user__cart.class_id, 
        classes__info.*
        FROM user__cart 
        INNER JOIN classes__info ON user__cart.class_id = classes__info.ID
        WHERE user_id=?`;
        query = mysql.format(statement, [userId]);
        queryRS = await module.exports.dbQuery_promise(query);
        return queryRS;
    },
    loadClasses: async (jcenterId) => {
        let statement, queryRS;
        statement = `
        SELECT 
        classes__info.*,
        GROUP_CONCAT(classes__delivery_relation.delivery_id) AS deliveryIds,
        GROUP_CONCAT(classes__delivery_type.title) AS delivery_title,
        classes__type.title AS type_title,
        education__department.title AS department_title,
        education__group.title AS group_title,
        lesson__info.title AS lesson_title,
        jcenters__info.title AS jcenters_title,
        certificate__info.title AS certificate_title,
        certificate__structure.title AS structure_title
        FROM classes__info
        INNER JOIN classes__type ON classes__info.type_id = classes__type.ID
        INNER JOIN classes__delivery_relation ON classes__info.ID = classes__delivery_relation.classe_id
        INNER JOIN classes__delivery_type ON classes__delivery_relation.delivery_id = classes__delivery_type.ID
        INNER JOIN education__department ON classes__info.department_id = education__department.ID
        INNER JOIN education__group ON classes__info.group_id = education__group.ID
        INNER JOIN jcenters__info ON classes__info.jcenters_id = jcenters__info.ID
        LEFT JOIN certificate__info ON classes__info.certificate_id = certificate__info.ID
        LEFT JOIN certificate__structure ON classes__info.certificate_structure_id = certificate__structure.ID
        INNER JOIN lesson__info ON classes__info.lesson_id = lesson__info.ID` +
            (jcenterId > 0 ? ` WHERE classes__info.jcenters_id=?` : ` WHERE classes__info.creator_user_id=?`) + ` GROUP BY classes__info.ID`;
        let query = mysql.format(statement, [jcenterId]);
        queryRS = await module.exports.dbQuery_promise(query);
        return queryRS;
    },
    loadDeliveryType: async () => {
        let statement, query, queryRS;
        statement = `SELECT * FROM classes__delivery_type`;
        query = mysql.format(statement, [0]);
        queryRS = await module.exports.dbQuery_promise(query);
        return queryRS;
    },
    loadClassDeliveryType: async (classId) => {
        let statement, query, queryRS;
        statement = `SELECT * FROM classes__delivery_relation WHERE classe_id=?`;
        query = mysql.format(statement, classId);
        queryRS = await module.exports.dbQuery_promise(query);
        return queryRS;
    },
    loadClassType: async () => {
        let statement, query, queryRS;
        statement = `SELECT * FROM classes__type`;
        query = mysql.format(statement, [0]);
        queryRS = await module.exports.dbQuery_promise(query);
        return queryRS;
    },
    formatDateTime(input, outPut) {
        // Parse the input date string
        const date = new Date(input);

        // Check if the date is valid
        if (isNaN(date)) {
            //throw new Error("Invalid date format");
            return input
        }

        // Extract the date components
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
        const day = String(date.getDate()).padStart(2, '0');
        const formattedDate = `${year}-${month}-${day}`;

        // Extract the time components
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        const formattedTime = `${hours}:${minutes}:${seconds}`;
        if (outPut === 'Date') {
            return formattedDate;
        } else if (outPut === 'Time') {
            return formattedTime;
        } else {
            return { date: formattedDate, time: formattedTime };
        }

    },
    addClassInfoToDb: async (queryBody, userID, deliveryResult) => {

        queryBody.start_date = module.exports.formatDateTime(queryBody.start_date, 'Date');
        queryBody.end_date = module.exports.formatDateTime(queryBody.end_date, 'Date');
        queryBody.end_register_date = module.exports.formatDateTime(queryBody.end_register_date, 'Date');
        queryBody.end_date_time = module.exports.formatDateTime(queryBody.end_date_time, 'Time');
        queryBody.end_cancel_date = module.exports.formatDateTime(queryBody.end_cancel_date, 'Date');
        queryBody.end_cancel_time = module.exports.formatDateTime(queryBody.end_cancel_time, 'Time');

        let statement, query, queryRS, userRs;
        if (queryBody.ID) {
            statement = `UPDATE classes__info SET jcenters_id=?,department_id=?, group_id=?, lesson_id=?, type_id=?, delivery_id=?, title=?, description=?, headlines=?, expense=?, cancellation_penalty=?, capacity=?, approved_time=?, class_sessions_number=?, absent_allow=?, gender=?, image_url=?, image_alt_text=?, start_date=?, end_date=?, end_register_date=?, end_date_time=?, end_cancel_date=?, end_cancel_time=?,status=?,certificate_id=?,certificate_structure_id=?,department_signature_need=?,absence_conditions=?,debt_free_condition=?,average_condition=?,obtaining_condition=?,end_class_condition=?,delivery_possibility=?,delivery_price=?,physical_certificate_fee=?,editor_user_id=?,event_type=? WHERE ID=?`;
            query = mysql.format(statement, [queryBody.jcenters_id, queryBody.department_id, queryBody.group_id, queryBody.lesson_id, queryBody.type_id, queryBody.delivery_id, queryBody.title, queryBody.description, queryBody.headlines, queryBody.expense, queryBody.cancellation_penalty, queryBody.capacity, queryBody.approved_time, queryBody.class_sessions_number, queryBody.absent_allow, queryBody.gender, queryBody.image_url, queryBody.image_alt_text, queryBody.start_date, queryBody.end_date, queryBody.end_register_date, queryBody.end_date_time, queryBody.end_cancel_date, queryBody.end_cancel_time, queryBody.status, queryBody.certificate_id, queryBody.certificate_structure_id, queryBody.department_signature_need, queryBody.absence_conditions, queryBody.debt_free_condition, queryBody.average_condition, queryBody.obtaining_condition, queryBody.end_class_condition, queryBody.delivery_possibility, queryBody.delivery_price, queryBody.physical_certificate_fee, userID, queryBody.event_type, queryBody.ID]);
            queryRS = await module.exports.dbQuery_promise(query);
        } else {
            const moment = require('moment-jalaali');
            const now = moment().format('jYYjMM');
            const randomFourDigits = Math.floor(1000 + Math.random() * 9000);
            let classCode = `${now}${randomFourDigits}`;
            classCode = queryBody.code;

            statement = `INSERT INTO classes__info(jcenters_id , code,department_id, group_id, lesson_id, type_id, delivery_id, title, description, headlines, expense, cancellation_penalty, capacity, approved_time, class_sessions_number, absent_allow, gender, image_url, image_alt_text, start_date, end_date, end_register_date, end_date_time, end_cancel_date, end_cancel_time,status,certificate_id,certificate_structure_id,department_signature_need,absence_conditions,debt_free_condition,average_condition,obtaining_condition,end_class_condition,delivery_possibility,delivery_price,physical_certificate_fee,creator_user_id,event_type) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`;
            query = mysql.format(statement, [queryBody.jcenters_id, classCode, queryBody.department_id, queryBody.group_id, queryBody.lesson_id, queryBody.type_id, queryBody.delivery_id, queryBody.title, queryBody.description, queryBody.headlines, queryBody.expense, queryBody.cancellation_penalty, queryBody.capacity, queryBody.approved_time, queryBody.class_sessions_number, queryBody.absent_allow, queryBody.gender, queryBody.image_url, queryBody.image_alt_text, queryBody.start_date, queryBody.end_date, queryBody.end_register_date, queryBody.end_date_time, queryBody.end_cancel_date, queryBody.end_cancel_time, 'Panel_Show_Only', queryBody.certificate_id, queryBody.certificate_structure_id, queryBody.department_signature_need, queryBody.absence_conditions, queryBody.debt_free_condition, queryBody.average_condition, queryBody.obtaining_condition, queryBody.end_class_condition, queryBody.delivery_possibility, queryBody.delivery_price, queryBody.physical_certificate_fee, userID, queryBody.event_type]);
            queryRS = await module.exports.dbQuery_promise(query);
        }

        let classId = -1;
        if (queryBody.ID) {
            classId = queryBody.ID
        } else {
            classId = queryRS.insertId
        }

        if (classId > 0) {
            queryRS = await module.exports.dbQuery_promise('DELETE FROM classes__delivery_relation WHERE classe_id=' + classId);
            for (let i = 0; i < deliveryResult.length; i++) {
                statement = 'INSERT INTO classes__delivery_relation(classe_id, delivery_id) VALUES (?,?)';
                query = mysql.format(statement, [classId, deliveryResult[i]['delivery_id']]);
                queryRS = await module.exports.dbQuery_promise(query);
            }

            queryRS = await module.exports.dbQuery_promise(`SELECT 
                    GROUP_CONCAT(classes__delivery_type.title SEPARATOR " ") AS Delivery_Text
                    FROM  classes__delivery_relation 
                    INNER JOIN classes__delivery_type ON classes__delivery_relation.delivery_id = classes__delivery_type.ID
                    WHERE classe_id = `+ classId + ` GROUP BY classe_id`);

            let deliverText = queryRS[0]['Delivery_Text'];
            statement = 'UPDATE classes__info SET delivery_text=? WHERE ID=?';
            query = mysql.format(statement, [deliverText, classId]);
            queryRS = await module.exports.dbQuery_promise(query);
        }

        return queryRS;
    },
    deleteClass: async (classId) => {
        let statement, query, queryRS;
        statement = `DELETE FROM classes__info WHERE ID=?`;
        query = mysql.format(statement, [classId]);
        queryRS = await module.exports.dbQuery_promise(query);
        return queryRS;
    },
    getClassData: async (classId) => {
        let statement, query, queryRS;
        statement = `SELECT * FROM classes__info WHERE ID=?`;
        query = mysql.format(statement, [classId]);
        queryRS = await module.exports.dbQuery_promise(query);
        return queryRS;
    },
    getOnlineClassSessionData: async (sessionId) => {
        let statement, query, queryRS;
        statement = `SELECT * FROM classes__session WHERE ID=?`;
        query = mysql.format(statement, [sessionId]);
        queryRS = await module.exports.dbQuery_promise(query);
        return queryRS;
    },
    getmemberInfo: async (userID) => {
        let statement, query, queryRS;
        statement = `SELECT
        user__info.fname,user__info.lname,user__info.national_code, user__info.mobile, user__info.jcenter_id,
        user__detail.*, 
        teachers__degree.title AS degree_title , 
        teachers__job.title AS job_title,
        jcenters__info.title AS jcenters_title,
        jcenters__info.state_id AS jcenters_state,
        city__ostan.name AS ostan_name
        FROM user__info
        INNER JOIN user__detail ON user__detail.user_id = user__info.ID 
        LEFT JOIN teachers__degree ON user__detail.degree_id = teachers__degree.ID
        LEFT JOIN teachers__job ON user__detail.job_id = teachers__job.ID
        LEFT JOIN jcenters__info ON user__info.jcenter_id = jcenters__info.ID
        LEFT JOIN city__ostan ON city__ostan.ID = jcenters__info.state_id
        WHERE user__detail.user_id=?`;
        query = mysql.format(statement, [userID]);
        queryRS = await module.exports.dbQuery_promise(query);
        return queryRS;
    },
    getTeacherInfo: async (userID) => {
        let statement, query, queryRS;
        statement = `SELECT 
        teachers__info.*,
        CONCAT(f_name,' ',l_name) AS full_name,
        teachers__degree.title AS degree_title , 
        teachers__job.title AS job_title,
        jcenters__info.title AS jcenters_title
        FROM teachers__info
        INNER JOIN teachers__degree ON teachers__info.degree_id = teachers__degree.ID
        INNER JOIN teachers__job ON teachers__info.job_id = teachers__job.ID
        INNER JOIN jcenters__info ON teachers__info.jcenters_id = jcenters__info.ID
        WHERE teachers__info.user_id=?`;
        query = mysql.format(statement, [userID]);
        queryRS = await module.exports.dbQuery_promise(query);
        return queryRS;
    },
    getTeacherClass: async (classType, userID) => {
        let statement, query, queryRS;
        statement = `SELECT classes__info.*,
            education__department.title AS departmentTitle,
            jcenters__info.title AS jcenterTitle,
            GROUP_CONCAT(classes__delivery_relation.delivery_id) AS deliveryIds
            FROM classes__info
            INNER JOIN classes__teacher_relation ON classes__teacher_relation.classe_id = classes__info.ID
            INNER JOIN teachers__info ON teachers__info.ID = classes__teacher_relation.teacher_id
            INNER JOIN classes__delivery_relation ON classes__info.ID = classes__delivery_relation.classe_id
            INNER JOIN education__department ON education__department.ID = classes__info.department_id
            INNER JOIN jcenters__info ON jcenters__info.ID = classes__info.jcenters_id
            WHERE classes__info.status IN (`+ (classType === 'Active' ? '"Active"' : '"Archive"') + `) AND 
            teachers__info.user_id =?  AND classes__info.ID IS NOT NULL
            GROUP BY classes__info.ID;`;
        query = mysql.format(statement, [userID]);
        queryRS = await module.exports.dbQuery_promise(query);
        return queryRS;
    },
    getTeacherWeeklySchedule: async (userID) => {
        let statement, query, queryRS;
        statement = `SELECT 
classes__hold_time.* ,
classes__info.start_date,
classes__info.end_date,
classes__info.delivery_text,
jcenters__info.title AS centerTitle,
education__department.title AS departmentTitle,
jcenters__buildings.title AS Building,
jcenters__building_rooms.title AS Room,
classes__info.title As ClassName,
classes__info.code AS ClassCode
FROM classes__hold_time 
INNER JOIN classes__info ON classes__hold_time.classes_id = classes__info.ID
INNER JOIN jcenters__info ON jcenters__info.ID = classes__info.jcenters_id
INNER JOIN education__department ON education__department.ID = classes__info.department_id
INNER JOIN jcenters__buildings ON classes__hold_time.buildings_id = jcenters__buildings.ID
INNER JOIN jcenters__building_rooms ON classes__hold_time.room_id = jcenters__building_rooms.ID
INNER JOIN classes__teacher_relation ON classes__teacher_relation.classe_id = classes__hold_time.classes_id
INNER JOIN teachers__info ON classes__teacher_relation.teacher_id = teachers__info.ID
WHERE classes__hold_time.status='Active' AND 
teachers__info.user_id =? ORDER BY classes__hold_time.day_id ASC`;
        query = mysql.format(statement, [userID]);
        queryRS = await module.exports.dbQuery_promise(query);
        return queryRS;
    },
    getTeacherCenter: async (userID) => {
        let statement, query, queryRS;
        statement = `SELECT jcenters__info.* 
FROM 
jcenters__info
INNER JOIN teachers__jcenter_relation ON teachers__jcenter_relation.center_id = jcenters__info.ID
INNER JOIN teachers__info ON teachers__jcenter_relation.teacher_id = teachers__info.ID
WHERE 
teachers__info.user_id =?`;
        query = mysql.format(statement, [userID]);
        queryRS = await module.exports.dbQuery_promise(query);
        return queryRS;
    },
    submitMemberInfoToDb: async (queryBody, userID) => {
        let statement, query, queryRS, userRs;
        statement = `UPDATE user__detail SET  father_name=?, gender=?, mobile2=?, email=?, image_url=?, place_of_birth=?, birthday=?, is_foreigner=?, job_id=?, degree_id=?,postal_address=?, sheba=?, bank_acount=?,editor_user_id=?,biography=? WHERE ID=?`;
        query = mysql.format(statement, [queryBody.father_name, queryBody.gender, queryBody.mobile2, queryBody.email, queryBody.image_url, queryBody.place_of_birth, queryBody.birthday, queryBody.is_foreigner, queryBody.job_id, queryBody.degree_id, queryBody.postal_address, queryBody.sheba, queryBody.bank_acount, userID, queryBody.biography, queryBody.ID]);
        queryRS = await module.exports.dbQuery_promise(query);
        statement = `UPDATE user__info SET jcenter_id=? WHERE ID=?`;
        query = mysql.format(statement, [queryBody.jcenter_id, queryBody.user_id]);
        queryRS = await module.exports.dbQuery_promise(query);
        return queryRS;
    },
    getActiveClasses: async (jcenterId, userID) => {
        let statement, query, queryRS;
        statement = `SELECT ID  FROM jcenters__info  WHERE ID IN (SELECT jcenter_id FROM user__info WHERE ID=?) OR parent_id IN (SELECT jcenter_id FROM user__info WHERE ID=?)`;
        query = mysql.format(statement, [userID, userID]);
        queryRS = await module.exports.dbQuery_promise(query);
        let allowCenter = [0].concat(queryRS.map(row => row.ID));

        statement = `SELECT 
        classes__info.*,
        classes__type.title AS type_title,
        education__department.title AS department_title,
        education__group.title AS group_title,
        lesson__info.title AS lesson_title,
        jcenters__info.title AS jcenters_title,
        certificate__info.title AS certificate_title,
        certificate__structure.title AS structure_title,
        CONCAT(teachers__info.f_name , ' ' , teachers__info.l_name) AS teacher_name,
        teachers__info.image_url AS Teacher_Picture
        FROM classes__info
        INNER JOIN classes__type ON classes__info.type_id = classes__type.ID
        INNER JOIN education__department ON classes__info.department_id = education__department.ID
        INNER JOIN education__group ON classes__info.group_id = education__group.ID
        INNER JOIN jcenters__info ON classes__info.jcenters_id = jcenters__info.ID
        INNER JOIN certificate__info ON classes__info.certificate_id = certificate__info.ID
        INNER JOIN certificate__structure ON classes__info.certificate_structure_id = certificate__structure.ID
        INNER JOIN lesson__info ON classes__info.lesson_id = lesson__info.ID
        LEFT JOIN teachers__info ON classes__info.teacher_id = teachers__info.ID
        WHERE classes__info.status='Active' AND classes__info.end_register_date > CURDATE() `+
            (jcenterId > 0 ? ` AND classes__info.jcenters_id=?` : ` AND (classes__info.jcenters_id IN (` + allowCenter.join(',') + `) OR classes__info.delivery_id IN(2,3,4))`);
        query = mysql.format(statement, [jcenterId]);
        // console.log(query);
        queryRS = await module.exports.dbQuery_promise(query);


        return queryRS;
    },
    loadClassListForMember: async (listMood, userID) => {
        let statement, query, queryRS;
        let needStatus = 'Active';
        if (listMood === 'Archive') {
            needStatus = 'Archive';
        } else if (listMood === 'Suggestion') {
            needStatus = 'Suggestion';
        }
        statement = `
            SELECT 
            classes__info.*,
             GROUP_CONCAT(classes__delivery_type.title) AS delivery_title,
            GROUP_CONCAT(classes__delivery_relation.delivery_id) AS deliveryIds,
            classes__type.title AS type_title,
            education__department.title AS department_title,
            education__group.title AS group_title,
            lesson__info.title AS lesson_title,
            jcenters__info.title AS jcenters_title,
            certificate__info.title AS certificate_title,
            certificate__structure.title AS structure_title,
            CONCAT(teachers__info.f_name , ' ' , teachers__info.l_name) AS teacher_name,
            teachers__info.image_url AS Teacher_Picture,
            classes__user_relation.status AS userRelStatus
            FROM classes__info
            INNER JOIN classes__user_relation ON classes__user_relation.class_id = classes__info.ID
            INNER JOIN classes__type ON classes__info.type_id = classes__type.ID
            INNER JOIN classes__delivery_relation ON classes__info.ID = classes__delivery_relation.classe_id
            INNER JOIN classes__delivery_type ON classes__delivery_relation.delivery_id = classes__delivery_type.ID
            INNER JOIN education__department ON classes__info.department_id = education__department.ID
            INNER JOIN education__group ON classes__info.group_id = education__group.ID
            INNER JOIN jcenters__info ON classes__info.jcenters_id = jcenters__info.ID
            INNER JOIN certificate__info ON classes__info.certificate_id = certificate__info.ID
            INNER JOIN certificate__structure ON classes__info.certificate_structure_id = certificate__structure.ID
            INNER JOIN lesson__info ON classes__info.lesson_id = lesson__info.ID
            LEFT JOIN teachers__info ON classes__info.teacher_id = teachers__info.ID
            WHERE classes__user_relation.status<>'Canceled' AND classes__user_relation.user_id=? AND classes__info.status=? GROUP BY classes__info.ID`;
        query = mysql.format(statement, [userID, needStatus]);
        queryRS = await module.exports.dbQuery_promise(query);
        return queryRS;
    },
    addClassToUserCart: async (userId, classId, price) => {
        let statement, query, queryRS;
        statement = `SELECT ID FROM classes__user_relation WHERE status='Active' AND class_id=? AND user_id=?`;
        query = mysql.format(statement, [classId, userId]);
        queryRS = await module.exports.dbQuery_promise(query);
        if (queryRS.length > 0) {
            return -1;
        }
        statement = `INSERT INTO user__cart(user_id, class_id, price) VALUES (?,?,?)`;
        query = mysql.format(statement, [userId, classId, price]);
        queryRS = await module.exports.dbQuery_promise(query);
        if (queryRS.insertId > 0) {
            return 1;
        } else {
            return -2;
        }
    },
    addExamToUserCart: async (userId, examId, price, type) => {
        let statement, query, queryRS;
        statement = `INSERT INTO user__cart(user_id, lesson_id, price,cart_type) VALUES (?,?,?,?)`;
        if (type === 'JOB') {
            statement = `INSERT INTO user__cart(user_id, job_id, price,cart_type) VALUES (?,?,?,?)`;
        }
        query = mysql.format(statement, [userId, examId, price, "exam"]);
        queryRS = await module.exports.dbQuery_promise(query);
        if (queryRS.insertId > 0) {
            return 1;
        } else {
            return -2;
        }
    },
    loadUserCart: async (userId) => {
        let statement, query, queryRS1, queryRS2, queryRS3, queryRS;
        statement = `SELECT 
        user__cart.*,
        classes__info.*,
        0 AS discount_code,
        '' AS exam_Type
        FROM user__cart 
        INNER JOIN classes__info ON user__cart.class_id = classes__info.ID
        WHERE 
        user__cart.user_id = ?`;
        query = mysql.format(statement, [userId]);
        queryRS1 = await module.exports.dbQuery_promise(query);
        statement = `SELECT 
        user__cart.*,
        lesson__info.*,
        "LESSON" AS exam_Type,
        0 AS discount_code
        FROM user__cart 
        INNER JOIN lesson__info ON user__cart.lesson_id = lesson__info.ID
        WHERE 
        user__cart.user_id = ?`;
        query = mysql.format(statement, [userId]);
        queryRS2 = await module.exports.dbQuery_promise(query);
        statement = `SELECT 
        user__cart.*,
        job__info.*,
        "JOB" AS exam_Type,
        0 AS discount_code
        FROM user__cart 
        INNER JOIN job__info ON user__cart.job_id = job__info.ID
        WHERE 
        user__cart.user_id = ?`;
        query = mysql.format(statement, [userId]);
        queryRS3 = await module.exports.dbQuery_promise(query);
        queryRS = [];
        queryRS.push(...queryRS1);
        queryRS.push(...queryRS2);
        queryRS.push(...queryRS3);
        return queryRS;
    },
    removeFromCart: async (userId, classId, type) => {
        let statement, query, queryRS;
        if (type === 'JOB') {
            statement = `DELETE FROM user__cart WHERE user_id=? AND job_id=?`;
        } else if (type === 'LESSON') {
            statement = `DELETE FROM user__cart WHERE user_id=? AND lesson_id=?`;
        } else {
            statement = `DELETE FROM user__cart WHERE user_id=? AND class_id=?`;
        }
        query = mysql.format(statement, [userId, classId]);
        queryRS = await module.exports.dbQuery_promise(query);
        return queryRS;
    },

    addCenterToTeacher: async (userId, jcenterId) => {
        let statement, query, queryRS;

        statement = `SELECT ID FROM teachers__info WHERE teachers__info.user_id = ?`;
        query = mysql.format(statement, [userId]);
        queryRS = await module.exports.dbQuery_promise(query);

        statement = `INSERT INTO teachers__jcenter_relation(teacher_id,center_id) VALUES (?,?)`;
        query = mysql.format(statement, [queryRS[0]['ID'], jcenterId]);
        queryRS = await module.exports.dbQuery_promise(query);
        return queryRS;
    },

    serachTeacherByNationalCode: async (teacherNationalCode) => {
        let statement, query, queryRS;

        statement = `SELECT ID FROM teachers__info WHERE national_code = ?`;
        query = mysql.format(statement, [teacherNationalCode]);
        queryRS = await module.exports.dbQuery_promise(query);
        if (queryRS.length > 0) {
            return queryRS;
        } else {
            return -1;
        }
    },
    submitAddTeacherRequest: async (foundTeacherId, jcenterId) => {
        let statement, query, queryRS;
        statement = `INSERT INTO jcenters__teacher_add_request(jcenters_id, teacher_id) VALUES (?,?)`;
        query = mysql.format(statement, [jcenterId, foundTeacherId]);
        queryRS = await module.exports.dbQuery_promise(query);
        statement = `INSERT INTO  jcenters__request (type,jcenter_id,teacher_id,jcenter_status) VALUES(?,?,?,?)`;
        query = mysql.format(statement, [5, jcenterId, foundTeacherId, 'Confirmed']);
        queryRS = await module.exports.dbQuery_promise(query);
        if (queryRS.length > 0) {
            return queryRS;
        } else {
            return -1;
        }
    },

    checkCartClassToManageRegister: async (userId) => {
        let statement, query, queryRS;
        statement = `SELECT classes__info.*,classes__delivery_relation.delivery_id
                    FROM user__cart
                    INNER JOIN classes__info ON classes__info.ID = user__cart.class_id
                    INNER JOIN classes__delivery_relation ON classes__delivery_relation.classe_id = classes__info.ID
                    WHERE user__cart.user_id = ?`;
        query = mysql.format(statement, [userId]);
        queryRS = await module.exports.dbQuery_promise(query);
        return queryRS;
    },

    createAdobeUser: async (userData) => {
        const AdobeConnect = require("../utils/AdobeApi");
        const adobeOBJ = new AdobeConnect();
        await adobeOBJ.loginToAdobeAsAdmin();
        let adobeRS = await adobeOBJ.createUser(userData['fname'], userData['lname'], userData['mobile'], userData['mobile'] + '@jjqc.ir');
        if (adobeRS > 0) {
            let statement, query, queryRS;
            statement = `UPDATE user__info SET adobe_principle_id=? WHERE ID=?`;
            query = mysql.format(statement, [adobeRS, userData['ID']]);
            queryRS = await module.exports.dbQuery_promise(query);
        }
    },

    enrollUserToOfflineClass: async (userData, classData) => {
        const moodleOBJ = require("../utils/moodleApi");
        if (userData['moodle_user_id'] == 0) {
            await moodleOBJ.createUser(userData['ID'], userData['mobile'], userData['fname'], userData['lname'], userData['mobile'] + '@jjqc.ir');
            userData = await module.exports.getUserDetail(userData['ID']);
            userData = userData[0];
        }
        let moodleRS = await moodleOBJ.enrollUserInCourse(userData['moodle_user_id'], classData['moodle_course_id']);
        let classRegisterRS = await module.exports.addUserToClass(userData['ID'], classData);
        if (classRegisterRS.insertId > 0) {
            await module.exports.removeFromCart(userData['ID'], classData.ID);
        }
    },
    enrollUserToOnlineClass: async (userData, classData) => {
        if (userData['adobe_principle_id'] == 0) {
            await module.exports.createAdobeUser(userData);
        }
        let classRegisterRS = await module.exports.addUserToClass(userData['ID'], classData);
        if (classRegisterRS.insertId > 0) {
            await module.exports.removeFromCart(userData['ID'], classData.ID);
        }
    },
    updateOnlineClassSessionsRecordings: async (classId, recordings) => {
        let statement, query, classSessionRS;
        statement = `SELECT * FROM classes__session WHERE classe_id=? AND adobe_meeting_url IS NULL `;
        query = mysql.format(statement, [classId]);
        classSessionRS = await module.exports.dbQuery_promise(query);
        for (let recorded of recordings) {
            const recordedDate = recorded['date-begin'][0].split('T')[0];

            const matchedMeeting = classSessionRS.find(meeting => {
                const databaseDate = moment.tz(meeting.date, 'Asia/Tehran').format('YYYY-MM-DD');
                // console.log(databaseDate + '-' + recordedDate);
                return recordedDate === databaseDate;
            });

            if (matchedMeeting) {
                let videoURL = `https://class.jtehran.com${recorded['url-path'][0]}`;
                statement = `UPDATE classes__session SET adobe_meeting_url=? WHERE ID=?`;
                query = mysql.format(statement, [videoURL, matchedMeeting.ID]);
                await module.exports.dbQuery_promise(query);
            }
        }

    },
    addUserToClass: async (userId, classData) => {
        let statement, query, queryRS;
        statement = `INSERT INTO classes__user_relation(class_id, user_id, paid_amount) VALUES (?,?,?)`;
        query = mysql.format(statement, [classData['ID'], userId, classData['expense']]);
        queryRS = await module.exports.dbQuery_promise(query);

        if (queryRS.insertId > 0) {
            statement = `UPDATE classes__info SET registration_number=registration_number+1 WHERE ID=?`;
            query = mysql.format(statement, [classData['ID']]);
            queryRS = await module.exports.dbQuery_promise(query);
        }

        return queryRS;
    },
    submitUserCancelRequest: async (userId, classId) => {
        let statement, query, queryRS;
        statement = `UPDATE classes__user_relation SET status='Cancel_request' WHERE user_id=? AND class_id=?`;
        query = mysql.format(statement, [userId, classId]);
        queryRS = await module.exports.dbQuery_promise(query);
        return queryRS;
    },
    loadAllDepartment: async () => {
        let statement, query, queryRS;
        statement = `SELECT * FROM jcenters__info WHERE center_mood = 'center'`;
        query = mysql.format(statement, [0]);
        queryRS = await module.exports.dbQuery_promise(query);
        return queryRS;
    },
    // دریافت تمام محتواهای یک کلاس
    getClassContents: async (classId) => {
        let statement = `
        SELECT classes__content.*, 
        CONCAT(creator.fname, ' ', creator.lname) as creator_name,
        CONCAT(reviewer.fname, ' ', reviewer.lname) as reviewer_name
        FROM classes__content 
        LEFT JOIN user__info as creator ON creator.ID = classes__content.creator_user_id
        LEFT JOIN user__info as reviewer ON reviewer.ID = classes__content.reviewer_user_id
        WHERE class_id = ?
        ORDER BY priority ASC, insert_time DESC
        `;
        let query = mysql.format(statement, [classId]);
        return await module.exports.dbQuery_promise(query);
    },

    deleteContent: async (contentId) => {
        let statement = `DELETE FROM classes__content WHERE ID = ?`;
        let query = mysql.format(statement, [contentId]);
        return await module.exports.dbQuery_promise(query);
    },
    // دریافت یک محتوای خاص
    getClassesWithOfflineContent: async () => {
        let statement = `
            SELECT
            ci.ID, 
            ci.title AS class_title,
            eg.title AS education_group_title,
            jci.title AS jcenter_title
            FROM classes__content cc
            INNER JOIN classes__info ci ON cc.class_id = ci.ID
            INNER JOIN education__group eg ON ci.group_id = eg.ID
            INNER JOIN jcenters__info jci ON ci.jcenters_id = jci.ID
            WHERE cc.status = 'Pending'
            GROUP BY ci.ID 
            ORDER BY cc.insert_time ASC;
        `;
        let query = mysql.format(statement, []);
        let result = await module.exports.dbQuery_promise(query);
        return result;
    },
    getPendingOfflineContent: async (classId) => {
        let statement = `
            SELECT 
                class__contents.*,
                user__info.first_name,
                user__info.last_name
            FROM class__contents
            INNER JOIN user__info ON class__contents.creator_id = user__info.ID
            WHERE class__contents.class_id = ?
            AND class__contents.status = 'pending'
            AND class__contents.type = 'offline'
            ORDER BY class__contents.created_at DESC
        `;
        let query = mysql.format(statement, [classId]);
        let result = await module.exports.dbQuery_promise(query);
        return result;
    },
    // افزودن محتوای جدید
    addContent: async (contentData) => {
        let statement = `
            INSERT INTO classes__content 
            (class_id, title, content_type, file_url, file_size, file_extension, 
             description, priority, creator_user_id, editor_user_id) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        let query = mysql.format(statement, [
            contentData.class_id,
            contentData.title,
            contentData.content_type,
            contentData.file_url,
            contentData.file_size,
            contentData.file_extension,
            contentData.description,
            contentData.priority || 0,
            contentData.creator_user_id,
            contentData.creator_user_id // در زمان ایجاد، creator و editor یکی هستند
        ]);
        return await module.exports.dbQuery_promise(query);
    },
    updateContentStatus: async (contentId, status, reviewerId) => {
        try {
            const statement = `
                UPDATE classes__content 
                SET status = ?, 
                    last_update_time = NOW(),
                    reviewer_user_id = ?
                WHERE ID = ?
            `;
            const query = mysql.format(statement, [status, reviewerId, contentId]);
            return await module.exports.dbQuery_promise(query);
        } catch (err) {
            throw err;
        }
    },
}