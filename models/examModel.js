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
    getUserData: async (userId) => {
        let statement, query, queryRS;
        statement = `SELECT * FROM user__info WHERE ID=?`;
        query = mysql.format(statement, [userId]);
        queryRS = await module.exports.dbQuery_promise(query);
        return queryRS;
    },
    getUserResumeData: async (userId) => {
        let statement, query, queryRS;
        statement = `SELECT * FROM resume__user_data WHERE user_id=?`;
        query = mysql.format(statement, [userId]);
        queryRS = await module.exports.dbQuery_promise(query);
        return queryRS;
    },
    getActiveExams: async () => {
        let statement, query, queryRS;
        statement = `SELECT * FROM exam__psychology_info WHERE status='Active' ORDER BY price`;
        query = mysql.format(statement, []);
        queryRS = await module.exports.dbQuery_promise(query);
        return queryRS;
    },
    getExamByID: async (examId) => {
        let statement, query, queryRS;
        statement = `SELECT * FROM exam__psychology_info WHERE ID=?`;
        query = mysql.format(statement, [examId]);
        queryRS = await module.exports.dbQuery_promise(query);
        return queryRS;
    },
    getUserExams: async (userId) => {
        let statement, query, queryRS;
        statement = `SELECT user__exams.ID, user__exams.insert_time,exam__psychology_info.ID AS examId,
        exam__psychology_info.title, exam__psychology_info.description 
        FROM user__exams
        INNER JOIN exam__psychology_info ON exam__psychology_info.ID = user__exams.exam_id
        WHERE user__exams.user_id=?`;
        query = mysql.format(statement, [userId]);
        queryRS = await module.exports.dbQuery_promise(query);
        return queryRS;
    },
    getUserExamDataById: async (userExamId) => {
        let statement, query, queryRS;
        statement = `SELECT user__exams.*, exam__psychology_info.ID AS examId,
        exam__psychology_info.title,exam__psychology_info.external_id,exam__psychology_info.exam_type
        FROM user__exams
        INNER JOIN exam__psychology_info ON exam__psychology_info.ID = user__exams.exam_id
        WHERE user__exams.ID=?`;
        query = mysql.format(statement, [userExamId]);
        queryRS = await module.exports.dbQuery_promise(query);
        return queryRS;
    },

    humaxSyncUser: async (userFName, userLName, userMobile) => {
        const formData = {
            "FirstName": userFName,
            "LastName": userLName,
            "PhoneNumber": userMobile,
            "Email:": 'user@example.com',
            "APIKey": process.env.humaxAPIKey,
            "PartnerName": process.env.humaxPartnerName,
        };
        const headers = { 'Content-Type': 'application/json' };
        var rs = await tools.post_request_formData(process.env.humaxSyncUserAPI, headers, formData);
        rs = JSON.parse(rs);
        let token = rs['url'];
        token = token.split('?t=');
        if (rs['success']) {
            return token[1];
        } else {
            return false;
        }
    },
    humaxSurvey: async (humaxSurveyId, token) => {
        const headers = { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token };
        var rs = await tools.get_request(process.env.humaxSurveyAPI + humaxSurveyId, headers);
        rs = JSON.parse(rs);
        if (rs['success']) {
            return rs['data'];
        } else {
            return false;
        }
    },
    humaxSurveySaveAnswer: async (examAnswer, token) => {
        const userAnswer = JSON.stringify(examAnswer);
        // console.log(examAnswer);
        const headers = { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token };
        var rs = await tools.post_request(process.env.humaxSurveySaveAnswerAPI, headers, userAnswer);
        rs = JSON.parse(rs);
        console.log(rs);
        if (rs['success']) {
            return true;
        } else {
            return false;
        }
    },
    humaxSurveyReport: async (humaxExamId, outputId, token) => {
        const headers = { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token };
        var rs = await tools.get_request(process.env.humaxSurveyReportAPI + humaxExamId + '?outputId=' + outputId, headers);
        rs = JSON.parse(rs);
        if (rs['success']) {
            return false;
        } else {
            return rs;
        }
    },

    getExamQuestions: async (examId, userData) => {
        let examData = await module.exports.getExamByID(examId);
        if (examData[0]['exam_type'] == 'humax') {
            let humaxToken = await module.exports.humaxSyncUser(userData[0]['fname'], userData[0]['lname'], userData[0]['mobile']);
            if (!humaxToken) {
                return false;
            }
            let examQuestions = await module.exports.humaxSurvey(examData[0]['external_id'], humaxToken);
            return examQuestions;
        } else {
            if (userData[0]['esanj_id'] == null) {
                await module.exports.esanjCreateEmployee(userData);
            }

            let token = await module.exports.getEsanjToken();
            const headers = { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token };
            var rs = await tools.get_request(process.env.esanjApiURL + '/questionnaire/' + examData[0]['external_id'], headers);
            // rs = JSON.parse(rs);
            // console.log(rs);
            return rs;
            let statement = `SELECT json FROM exam__question WHERE ID=1`;
            let query = mysql.format(statement, []);
            let examQuestions = await module.exports.dbQuery_promise(query);

            return examQuestions[0]['json'];
        }
    },
    submitExamAnswer: async (examAnswer, userData, userId, examId) => {
        try {

            let statement, query, queryRS;
            let examData = await module.exports.getExamByID(examId);
            if (examData[0]['exam_type'] == 'humax') {
                let humaxToken = await module.exports.humaxSyncUser(userData[0]['fname'], userData[0]['lname'], userData[0]['mobile']);
                if (!humaxToken) {
                    return false;
                }
                let submitRS = await module.exports.humaxSurveySaveAnswer(examAnswer, humaxToken);
                if (submitRS) {
                    statement = `DELETE FROM user__exams WHERE user_id=? AND exam_id=?`;
                    query = mysql.format(statement, [userId, examId]);
                    await module.exports.dbQuery_promise(query);
                    statement = `INSERT INTO user__exams (user_id,exam_id,answers) VALUES (?,?,?)`;
                    query = mysql.format(statement, [userId, examId, JSON.stringify(examAnswer)]);
                    queryRS = await module.exports.dbQuery_promise(query);
                }
                return submitRS;
            } else {
                // return 1;
                let userResumeData = await module.exports.getUserResumeData(userId);
                let uuid = uuidv4();

                let year = new Date();
                year = new Intl.DateTimeFormat('en-u-ca-persian', { year: "numeric" }).format(year);
                year = year.split(' ');
                year = year[0];

                statement = `INSERT INTO user__exams (user_id,exam_id,uuid,answers) VALUES (?,?,?,?)`;
                query = mysql.format(statement, [userId, examId, uuid, JSON.stringify(examAnswer)]);
                queryRS = await module.exports.dbQuery_promise(query);


                let body = {
                    "sex": (userResumeData[0]['gender'] == 'man' ? 'male' : 'female'),
                    "age": year - userResumeData[0]['Byear']
                };
                for (var i = 0; i < examAnswer.length; i++) {
                    body['q' + (i + 1)] = parseInt(examAnswer[i]);
                }
                body = JSON.stringify(body);
                let token = await module.exports.getEsanjToken();
                const headers = { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token };
                var rs = await tools.post_request(process.env.esanjApiURL + '/interpretation/' + examData[0]['external_id'] + '/json/' + uuid + '?employee_id=' + userData[0]['esanj_id'], headers, body);
                rs = JSON.parse(rs);
                if (rs['type']) {
                    return 1;
                } else {
                    return -1;
                }
            }
        } catch (error) {

        }
    },
    getUserExamResult: async (userExamId, userData) => {
        try {
            let userExamData = await module.exports.getUserExamDataById(userExamId);
            if (userExamData[0]['exam_type'] == 'humax') {
                let humaxToken = await module.exports.humaxSyncUser(userData[0]['fname'], userData[0]['lname'], userData[0]['mobile']);
                if (!humaxToken) {
                    return false;
                }
                let reportRS = await module.exports.humaxSurveyReport(28, 2, humaxToken);
                const headers = { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + humaxToken };
                let fullMrt = await tools.get_request(process.env.humaxFullMMRTAPI, headers);
                if (!reportRS) {
                    return false
                }
                return { reportRS, fullMrt };
            } else {
                let token = await module.exports.getEsanjToken();
                const headers = { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token };
                var rs = await tools.get_request(process.env.esanjApiURL + '/interpretation/html/' + userExamData[0]['uuid'], headers);
                rs = JSON.parse(rs);
                // console.log(rs);
            }
            return rs;
        } catch (error) {
            console.log(error);
        }
    },

    getEsanjToken: async () => {
        try {
            let statement = 'SELECT token FROM exam__esanj_token WHERE ID=1 AND update_time >= CURRENT_TIMESTAMP - INTERVAL 5 MINUTE';
            let query = mysql.format(statement, []);
            let queryRS = await module.exports.dbQuery_promise(query);

            if (queryRS.length > 0) {
                return queryRS[0]['token'];
            } else {
                let body = JSON.stringify({
                    "password": process.env.esanjPass,
                    "username": process.env.esanjUser
                });
                const headers = { 'Content-Type': 'application/json' };
                var rs = await tools.post_request(process.env.esanjApiURL + '/login', headers, body);
                rs = JSON.parse(rs);

                statement = 'UPDATE exam__esanj_token SET token=? WHERE ID=1';
                query = mysql.format(statement, [rs['token']]);
                await module.exports.dbQuery_promise(query);
                return rs['token'];
            }
        } catch (error) {

        }
    },

    getEsanjExamsToSaveInDB: async () => {
        try {
            let token = await module.exports.getEsanjToken();
            const headers = { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token };
            var rs = await tools.get_request(process.env.esanjApiURL + '/test/bank', headers);
            rs = JSON.parse(rs);
            let statement = `INSERT INTO exam__psychology_info (external_id,title) VALUES (?,?)`;
            for (var i = 0; i < rs['tests'].length; i++) {
                let query = mysql.format(statement, [rs['tests'][i]['test']['id'], rs['tests'][i]['test']['title']]);
                await module.exports.dbQuery_promise(query);
            }
        } catch (error) {
            console.log(error);
        }
    },
    esanjCreateEmployee: async (userData) => {
        try {
            let token = await module.exports.getEsanjToken();
            let name = userData[0]['fname'] + ' ' + userData[0]['lname'];
            let body = JSON.stringify({
                "username": userData[0]['mobile'],
                "name": name
            });
            const headers = { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token };
            var rs = await tools.post_request(process.env.esanjApiURL + '/employee/create', headers, body);
            rs = JSON.parse(rs);
            if (rs['employee']['id']) {
                let statement = `UPDATE user__info SET esanj_id=? WHERE ID=?`;
                let query = mysql.format(statement, [rs['employee']['id'], userData[0]['ID']]);
                await module.exports.dbQuery_promise(query);
            }
        } catch (error) {
            console.log(error);
        }
    },
    getEsanjExamById: async (esanjExamId) => {
        try {
            let token = await module.exports.getEsanjToken();
            const headers = { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token };
            var rs = await tools.get_request(process.env.esanjApiURL + '/test/bank', headers);
            rs = JSON.parse(rs);
            let statement = `INSERT INTO exam__psychology_info (external_id,title) VALUES (?,?)`;
            for (var i = 0; i < rs['tests'].length; i++) {
                let query = mysql.format(statement, [rs['tests'][i]['test']['id'], rs['tests'][i]['test']['title']]);
                await module.exports.dbQuery_promise(query);
            }
        } catch (error) {
            console.log(error);
        }
    },
}