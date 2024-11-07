const { parse } = require("dotenv");
const { dbCon, mysql } = require("../config/dbConnection");
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
    setPanelLight: async (userId, needLightMode) => {
        const statement = `UPDATE user__them_setting SET active_mode=? WHERE user_id=?`;
        const query = mysql.format(statement, [needLightMode, userId]);
        let queryRS = await module.exports.dbQuery_promise(query);
        return queryRS;
    },
    setPanelThem: async (userId, them) => {
        const statement = `UPDATE user__them_setting SET active_theme=? WHERE user_id=?`;
        const query = mysql.format(statement, [them, userId]);
        let queryRS = await module.exports.dbQuery_promise(query);
        return queryRS;
    },
    getCountries: async () => {
        const statement = `SELECT ID,title FROM countries WHERE status='Active'`;
        const query = mysql.format(statement);
        let queryRS = await module.exports.dbQuery_promise(query);
        return queryRS;
    },

    getCityData: async (cityId) => {
        const statement = `SELECT * FROM city__ostan WHERE ID=?`;
        const query = mysql.format(statement, [cityId]);
        let queryRS = await module.exports.dbQuery_promise(query);
        return queryRS;
    },

    getCities: async () => {
        const statement = `SELECT ID,name FROM city__ostan WHERE parent!=0 AND site_status='Active'`;
        const query = mysql.format(statement);
        let queryRS = await module.exports.dbQuery_promise(query);
        return queryRS;
    },

    getResumeSeniorityLevels: async () => {
        const statement = `SELECT ID,title FROM resume__seniority_level WHERE status='Active'`;
        const query = mysql.format(statement, []);
        let queryRS = await module.exports.dbQuery_promise(query);
        return queryRS;

    },
    getResumeGrades: async () => {
        const statement = `SELECT ID,title FROM resume__grade WHERE status='Active'`;
        const query = mysql.format(statement, []);
        let queryRS = await module.exports.dbQuery_promise(query);
        return queryRS;

    },

    getResumeMajors: async () => {
        const statement = `SELECT ID,title FROM resume__majors`;
        const query = mysql.format(statement, []);
        let queryRS = await module.exports.dbQuery_promise(query);
        return queryRS;

    },
    getResumeActiveMajors: async () => {
        const statement = `SELECT ID,title FROM resume__majors WHERE status='Active'`;
        const query = mysql.format(statement, []);
        let queryRS = await module.exports.dbQuery_promise(query);
        return queryRS;

    },
    getResumeUniversities: async () => {
        const statement = `SELECT ID,title FROM resume__university WHERE status='Active'`;
        const query = mysql.format(statement, []);
        let queryRS = await module.exports.dbQuery_promise(query);
        return queryRS;

    },
    getResumeJobs: async () => {
        const statement = `SELECT ID,title FROM resume__jobs_category`;
        const query = mysql.format(statement, []);
        let queryRS = await module.exports.dbQuery_promise(query);
        return queryRS;

    },
    getResumeActiveJobs: async () => {
        const statement = `SELECT ID,title FROM resume__jobs_category WHERE status='Active'`;
        const query = mysql.format(statement, []);
        let queryRS = await module.exports.dbQuery_promise(query);
        return queryRS;

    },
    getResumeIndustries: async () => {
        const statement = `SELECT ID,title FROM resume__company_industry WHERE status='Active'`;
        const query = mysql.format(statement, []);
        let queryRS = await module.exports.dbQuery_promise(query);
        return queryRS;

    },
    getResumeLanguges: async () => {
        const statement = `SELECT ID,title FROM resume__language WHERE status='Active'`;
        const query = mysql.format(statement, []);
        let queryRS = await module.exports.dbQuery_promise(query);
        return queryRS;

    },
    getResumeSoftwareSkills: async (parent) => {
        let statement = '';
        if (parent == 0) {
            statement = `SELECT ID,title,parent FROM resume__software_skills WHERE status='Active' AND parent=0`;
        } else {
            statement = `SELECT ID,title,parent FROM resume__software_skills WHERE status='Active' AND parent<>0`;
        }
        const query = mysql.format(statement, []);
        let queryRS = await module.exports.dbQuery_promise(query);
        return queryRS;

    },
    getUserProfileData: async (userID) => {
        const statement = `SELECT * FROM user__info WHERE status='Active' AND ID=?`;
        const query = mysql.format(statement, [userID]);
        const result = await new Promise((resolve, reject) => {
            dbCon.query(query, (err, result) => {
                if (err) reject(err);
                else resolve(result);
            });
        });
        return result;
    },
    getUserResumeData: async (userID) => {
        const statement = `SELECT resume__user_data.*,resume__military_service.title AS militaryTitle FROM resume__user_data
        LEFT JOIN resume__military_service ON resume__military_service.ID = resume__user_data.military_id
        WHERE user_id =?`;
        const query = mysql.format(statement, [userID]);
        let queryRS = await module.exports.dbQuery_promise(query);
        return queryRS;
    },
    getDashboardData: async (userId) => {
        let statement, query;
        try {
            statement = `SELECT ID
            FROM resume__user_data
            WHERE user_id=?`;
            query = mysql.format(statement, [userId]);
            let hasResume = await module.exports.dbQuery_promise(query);
            if (hasResume.length > 0) {
                hasResume = true;
            } else {
                hasResume = false;
            }


            statement = `SELECT DATE(insert_time) AS studyDay,COUNT(*) AS cnt,COUNT(*) AS studyDayFa
                        FROM user__roadmap_content_seen
                        WHERE insert_time >= DATE_SUB(CURDATE(), INTERVAL 6 DAY) AND user_id=? 
                        GROUP BY DATE(insert_time)
                        ORDER BY DATE(insert_time) DESC`;
            query = mysql.format(statement, [userId]);
            let studyContentChart = await module.exports.dbQuery_promise(query);


            return { hasResume: hasResume, studyContentChart: studyContentChart };
        } catch (error) {
        }
    },
    submitUserEventsCalendar: async (userId, events) => {
        let statement, query, queryRS;
        statement = `SELECT ID FROM user__events_calendar WHERE user_id=?`;
        query = mysql.format(statement, [userId]);
        queryRS = await module.exports.dbQuery_promise(query);
        if (queryRS.length > 0) {
            statement = `UPDATE user__events_calendar SET events=? WHERE user_id=?`;
            query = mysql.format(statement, [JSON.stringify(events), userId]);
            queryRS = await module.exports.dbQuery_promise(query);

        } else {
            statement = `INSERT INTO user__events_calendar (user_id, events) VALUES(?,?)`;
            query = mysql.format(statement, [userId, JSON.stringify(events)]);
            console.log(query);
            queryRS = await module.exports.dbQuery_promise(query);
        }
    },
    getUserEventsCalendar: async (userId) => {
        let statement, query, queryRS;
        statement = `SELECT events FROM user__events_calendar WHERE user_id=?`;
        query = mysql.format(statement, [userId]);
        queryRS = await module.exports.dbQuery_promise(query);
        if (queryRS) {
            return queryRS[0]['events'];
        } else {
            return null
        }
    },
    getCoursesData: async () => {
        let statement, query, queryRS;
        statement = `SELECT courses__info.*,courses__detail.description,courses__detail.headlines,courses__detail.pre_needs
        FROM courses__info
        INNER JOIN courses__detail ON courses__detail.course_id = courses__info.ID
        WHERE courses__info.status = 'Active'`;
        query = mysql.format(statement, []);
        queryRS = await module.exports.dbQuery_promise(query);
        if (queryRS) {
            return queryRS;
        } else {
            return null
        }
    },
    getUserCoursesSignup: async (userId) => {
        let statement, query, queryRS;
        statement = `SELECT user__courses_preSignup.course_id
        FROM user__courses_preSignup
        INNER JOIN courses__info ON courses__info.ID = user__courses_preSignup.course_id
        WHERE courses__info.status='Active' AND user__courses_preSignup.user_id=?`;
        query = mysql.format(statement, [userId]);
        queryRS = await module.exports.dbQuery_promise(query);
        if (queryRS) {
            return queryRS;
        } else {
            return null
        }
    },
    coursePreSignup: async (userId, courseId) => {
        let statement, query, queryRS;
        statement = `INSERT INTO user__courses_preSignup (user_id,course_id) VALUES(?,?)`;
        query = mysql.format(statement, [userId, courseId]);
        queryRS = await module.exports.dbQuery_promise(query);
    },
    courseCancelPreSignup: async (userId, courseId) => {
        let statement, query, queryRS;
        statement = `DELETE FROM user__courses_preSignup WHERE user_id=? AND course_id=?`;
        query = mysql.format(statement, [userId, courseId]);
        queryRS = await module.exports.dbQuery_promise(query);
    },

    getAllJcentersData: async () => {
        let statement, query, queryRS;
        statement = `SELECT jcenters__info.*, city__ostan.name AS cityName
        FROM jcenters__info
        INNER JOIN city__ostan ON city__ostan.ID=jcenters__info.city_id `;
        query = mysql.format(statement, []);
        queryRS = await module.exports.dbQuery_promise(query);
        return queryRS;
    },

    submitJcenter: async (jcenterData) => {
        let statement, query, queryRS;
        let cityData = await module.exports.getCityData(jcenterData.city_id);
        if (jcenterData.ID) {
            statement = `UPDATE jcenters__info SET title=?,state_id=?,city_id=?,phone=?,fax=?,email=?,address=?,description=?,status=? WHERE ID=?`;
            query = mysql.format(statement,
                [jcenterData.title, cityData[0]['parent'], jcenterData.city_id, jcenterData.phone, jcenterData.fax, jcenterData.email, jcenterData.address, jcenterData.description, jcenterData.status, jcenterData.ID]);
            queryRS = await module.exports.dbQuery_promise(query);
            if (queryRS.affectedRows > 0) {
                return queryRS.affectedRows;
            } else {
                return -1;
            }
        } else {
            statement = `INSERT INTO  jcenters__info (title,state_id,city_id,phone,fax,email,address,description) VALUES(?,?,?,?,?,?,?,?)`;
            query = mysql.format(statement,
                [jcenterData.title, cityData[0]['parent'], jcenterData.city_id, jcenterData.phone, jcenterData.fax, jcenterData.email, jcenterData.address, jcenterData.description]);
            queryRS = await module.exports.dbQuery_promise(query);
            if (queryRS.insertId > 0) {
                return queryRS.insertId;
            } else {
                return -1;
            }
        }
    },
    deleteJcenter: async (jcenterId) => {
        let statement, query, queryRS;
        statement = `DELETE FROM jcenters__info WHERE ID=?`;
        query = mysql.format(statement, [jcenterId]);
        queryRS = await module.exports.dbQuery_promise(query);
        if (queryRS.affectedRows > 0) {
            return queryRS.affectedRows;
        } else {
            return -1;
        }
    },
    getAllExamcentersData: async () => {
        let statement, query, queryRS;
        statement = `SELECT jexam__centers.*, city__ostan.name AS cityName
        FROM jexam__centers
        INNER JOIN city__ostan ON city__ostan.ID=jexam__centers.city_id `;
        query = mysql.format(statement, []);
        queryRS = await module.exports.dbQuery_promise(query);
        return queryRS;
    },

    submitExamcenter: async (examcenterData) => {
        let statement, query, queryRS;
        let cityData = await module.exports.getCityData(examcenterData.city_id);
        if (examcenterData.ID) {
            statement = `UPDATE jexam__centers SET title=?,manager_name=?,state_id=?,city_id=?,phone=?,address=?,capacity=?,description=?,status=? WHERE ID=?`;
            query = mysql.format(statement,
                [examcenterData.title, examcenterData.manager_name, cityData[0]['parent'], examcenterData.city_id, examcenterData.phone, examcenterData.address, examcenterData.capacity, examcenterData.description, examcenterData.status, examcenterData.ID]);
            queryRS = await module.exports.dbQuery_promise(query);
            if (queryRS.affectedRows > 0) {
                return queryRS.affectedRows;
            } else {
                return -1;
            }
        } else {
            statement = `INSERT INTO  jexam__centers (title,manager_name,state_id,city_id,phone,address,capacity,description) VALUES(?,?,?,?,?,?,?,?)`;
            query = mysql.format(statement,
                [examcenterData.title, examcenterData.manager_name, cityData[0]['parent'], examcenterData.city_id, examcenterData.phone, examcenterData.address, examcenterData.capacity, examcenterData.description]);
            queryRS = await module.exports.dbQuery_promise(query);
            if (queryRS.insertId > 0) {
                return queryRS.insertId;
            } else {
                return -1;
            }
        }
    },
    deleteExamcenter: async (examcenterId) => {
        let statement, query, queryRS;
        statement = `DELETE FROM jexam__centers WHERE ID=?`;
        query = mysql.format(statement, [examcenterId]);
        queryRS = await module.exports.dbQuery_promise(query);
        if (queryRS.affectedRows > 0) {
            return queryRS.affectedRows;
        } else {
            return -1;
        }
    },
    getAllJdepartmentsData: async () => {
        let statement, query, queryRS;
        statement = `SELECT education__department.*
        FROM education__department`;
        query = mysql.format(statement, []);
        queryRS = await module.exports.dbQuery_promise(query);
        return queryRS;
    },
    submitJdepartment: async (jdepartmentData) => {
        let statement, query, queryRS;
        if (jdepartmentData.ID) {
            statement = `UPDATE education__department SET title=?,status=? WHERE ID=?`;
            query = mysql.format(statement,[jdepartmentData.title, jdepartmentData.status, jdepartmentData.ID]);
            queryRS = await module.exports.dbQuery_promise(query);
            if (queryRS.affectedRows > 0) {
                return queryRS.affectedRows;
            } else {
                return -1;
            }
        } else {
            statement = `INSERT INTO  education__department (title) VALUES(?)`;
            query = mysql.format(statement,[jdepartmentData.title]);
            queryRS = await module.exports.dbQuery_promise(query);
            if (queryRS.insertId > 0) {
                return queryRS.insertId;
            } else {
                return -1;
            }
        }
    },
    deleteJdepartment: async (jdepartmentId) => {
        let statement, query, queryRS;
        statement = `DELETE FROM education__department WHERE ID=?`;
        query = mysql.format(statement, [jdepartmentId]);
        queryRS = await module.exports.dbQuery_promise(query);
        if (queryRS.affectedRows > 0) {
            return queryRS.affectedRows;
        } else {
            return -1;
        }
    },

}