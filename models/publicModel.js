const { parse } = require("dotenv");
const { dbCon, mysql } = require("../config/dbConnection");
const tools = require("../utils/tools");
const bcrypt = require("bcrypt");
const moment = require('moment-jalaali');

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

    getUserProfileData: async (userID) => {
        const statement = `SELECT * FROM user__info WHERE status='Active' AND ID=?`;
        const query = mysql.format(statement, [userID]);
        const result = await module.exports.dbQuery_promise(query);
        return result;
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

    createUserForJcenter: async (jcenterId) => {
        try {
            let statement, query, queryRS;
            let jcenterData = await module.exports.getJcentersData(jcenterId);
            let needPermission = 3;
            if (jcenterData[0]['center_mood'] === 'center') {
                needPermission = 6;
            }
            const uCode = await tools.generateUniqueCode('user__info', 'code', 6);
            const hashedPassword = await bcrypt.hash(uCode, 10);
            statement = "INSERT INTO user__info(code,fname,lname,mobile,password,permission,jcenter_id) VALUES (?,?,?,?,?,?,?)";
            // query = mysql.format(statement, [uCode, jcenterData[0]['title'], '', uCode, hashedPassword, 6, jcenterData[0]['parent_id']]);
            query = mysql.format(statement, [uCode, jcenterData[0]['title'], '', uCode, hashedPassword, needPermission, jcenterId]);
            queryRS = await module.exports.dbQuery_promise(query);
            if (queryRS.insertId > 0) {
                statement = "INSERT INTO user__them_setting(user_id) VALUES (?)";
                query = mysql.format(statement, [queryRS.insertId]);
                queryRS = await module.exports.dbQuery_promise(query);

                // statement = "UPDATE `jcenters__info` SET `user_id`= ? WHERE `ID`=?";
                // query = mysql.format(statement, [queryRS.insertId , jcenterId]);
                // queryRS = await module.exports.dbQuery_promise(query);

                return 1;
            } else {
                return -1;
            }
        } catch (err) {
            console.log(err);
            return -1;
        }
    },

    getJcentersData: async (jcenterId) => {
        let statement, query, queryRS;
        statement = `SELECT jcenters__info.*,
       jcenters__details.telegram,
       jcenters__details.instagram, 
       jcenters__details.aparat,
       jcenters__details.title_in_certificate,
       jcenters__details.signature_holder_name,
       jcenters__details.signature_position,
       jcenters__details.signature_img,
       jcenters__details.center_indicator_code, 
       city__ostan.name AS cityName,
       user__info.code
FROM jcenters__info
INNER JOIN city__ostan ON city__ostan.ID = jcenters__info.city_id 
LEFT JOIN jcenters__details ON jcenters__details.jcenter_id = jcenters__info.ID
LEFT JOIN user__info ON user__info.jcenter_id = jcenters__info.ID 
                     AND user__info.permission = CASE 
                                                 WHEN jcenters__info.center_mood = 'main_center' THEN 3
                                                 WHEN jcenters__info.center_mood = 'center' THEN 6
                                                 END
WHERE jcenters__info.ID = ?`;
        query = mysql.format(statement, [jcenterId]);
        queryRS = await module.exports.dbQuery_promise(query);
        return queryRS;
    },
    getJcenterSubCentersData: async (jcenterId) => {
        let statement, query, queryRS;
        statement = `SELECT jcenters__info.*,
                jcenters__details.telegram,
                jcenters__details.instagram, 
                jcenters__details.aparat,
                jcenters__details.title_in_certificate,
                jcenters__details.signature_holder_name,
                jcenters__details.signature_position,
                jcenters__details.signature_img,
                jcenters__details.center_indicator_code,
                city__ostan.name AS cityName
                FROM jcenters__info
                INNER JOIN city__ostan ON city__ostan.ID=jcenters__info.city_id 
                LEFT JOIN jcenters__details ON jcenters__details.jcenter_id = jcenters__info.ID
                WHERE jcenters__info.parent_id=?`;
        query = mysql.format(statement, [jcenterId]);
        queryRS = await module.exports.dbQuery_promise(query);
        return queryRS;
    },

    getAllJcentersData: async (jmainCenterId, centerMood) => {
        let statement, query, queryRS;
        if (centerMood === 'main_center') {
            statement = `SELECT jcenters__info.*,
            jcenters__details.telegram,
            jcenters__details.instagram, 
            jcenters__details.aparat,
            jcenters__details.title_in_certificate,
            jcenters__details.signature_holder_name,
            jcenters__details.signature_position,
            jcenters__details.signature_img,
            jcenters__details.center_indicator_code, city__ostan.name AS cityName,
            user__info.code
            FROM jcenters__info
            INNER JOIN city__ostan ON city__ostan.ID=jcenters__info.city_id 
            LEFT JOIN jcenters__details ON jcenters__details.jcenter_id = jcenters__info.ID
            LEFT JOIN user__info ON user__info.jcenter_id= jcenters__info.ID AND user__info.permission = 3
            WHERE jcenters__info.center_mood=?`;
            query = mysql.format(statement, [centerMood]);
        } else if (centerMood === 'center') {
            statement = `SELECT jcenters__info.*,
            jcenters__details.telegram,
            jcenters__details.instagram, 
            jcenters__details.aparat,
            jcenters__details.title_in_certificate,
            jcenters__details.signature_holder_name,
            jcenters__details.signature_position,
            jcenters__details.signature_img,
            jcenters__details.center_indicator_code,
            city__ostan.name AS cityName, 
            parentCenter.title AS parentTitle,
            user__info.code
            FROM jcenters__info
            INNER JOIN city__ostan ON city__ostan.ID=jcenters__info.city_id 
            LEFT JOIN jcenters__details ON jcenters__details.jcenter_id = jcenters__info.ID
            INNER JOIN jcenters__info AS parentCenter ON parentCenter.ID =  jcenters__info.parent_id
            LEFT JOIN user__info ON user__info.jcenter_id= jcenters__info.ID AND user__info.permission = 6
            WHERE jcenters__info.parent_id=? AND jcenters__info.center_mood=?`;
            query = mysql.format(statement, [jmainCenterId, centerMood]);
        }
        queryRS = await module.exports.dbQuery_promise(query);
        return queryRS;
    },

    submitJmaincenter: async (jcenterData) => {
        let statement, query, queryRS;
        let cityData = await module.exports.getCityData(jcenterData.city_id);
        if (jcenterData.ID) {
            statement = `UPDATE jcenters__info SET title=?,state_id=?,city_id=?,phone=?,fax=?,email=?,web_site=?,address=?,description=?,work_hour=?,show_mainPage_status=?,status=?,logo=?,signature_image=? WHERE ID=?`;
            query = mysql.format(statement, [jcenterData.title, cityData[0]['parent'], jcenterData.city_id, jcenterData.phone, jcenterData.fax, jcenterData.email, jcenterData.web_site, jcenterData.address, jcenterData.description, jcenterData.work_hour, jcenterData.show_mainPage_status, jcenterData.status, jcenterData.logo, jcenterData.signature_image, jcenterData.ID]);
            queryRS = await module.exports.dbQuery_promise(query);
            statement = `UPDATE jcenters__details SET telegram=?,instagram=?,aparat=?,title_in_certificate=?,signature_holder_name=?,signature_position=?,center_indicator_code=? WHERE jcenter_id=?`;
            query = mysql.format(statement, [jcenterData.telegram, jcenterData.instagram, jcenterData.aparat, jcenterData.title_in_certificate, jcenterData.signature_holder_name, jcenterData.signature_position, jcenterData.center_indicator_code, jcenterData.ID]);
            queryRS = await module.exports.dbQuery_promise(query);
            if (queryRS.affectedRows > 0) {
                return queryRS.affectedRows;
            } else {
                return -1;
            }
        } else {
            statement = `INSERT INTO  jcenters__info (title,center_mood,state_id,city_id,phone,fax,email,web_site,address,description,work_hour,show_mainPage_status,logo,signature_image) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)`;
            query = mysql.format(statement, [jcenterData.title, 'main_center', cityData[0]['parent'], jcenterData.city_id, jcenterData.phone, jcenterData.fax, jcenterData.email, jcenterData.web_site, jcenterData.address, jcenterData.description, jcenterData.work_hour, jcenterData.show_mainPage_status, jcenterData.logo, jcenterData.signature_image]);
            queryRS = await module.exports.dbQuery_promise(query);
            statement = `INSERT INTO  jcenters__details (jcenter_id,telegram,instagram,aparat,title_in_certificate,signature_holder_name,signature_position,center_indicator_code) VALUES(?,?,?,?,?,?,?,?)`;
            query = mysql.format(statement, [queryRS.insertId, jcenterData.telegram, jcenterData.instagram, jcenterData.aparat, jcenterData.title_in_certificate, jcenterData.signature_holder_name, jcenterData.signature_position, jcenterData.center_indicator_code]);
            await module.exports.dbQuery_promise(query);
            if (queryRS.insertId > 0) {
                await module.exports.createUserForJcenter(queryRS.insertId);
                return queryRS.insertId;
            } else {
                return -1;
            }
        }
    },
    submitJcenter: async (jcenterData) => {
        let statement, query, queryRS;
        let cityData = await module.exports.getCityData(jcenterData.city_id);
        if (jcenterData.ID) {
            statement = `UPDATE jcenters__info SET title=?,parent_id=?,state_id=?,city_id=?,phone=?,fax=?,email=?,web_site=?,address=?,description=?,work_hour=?,show_mainPage_status=?,status=?,logo=?,signature_image=? WHERE ID=?`;
            query = mysql.format(statement, [jcenterData.title, jcenterData.parent_id, cityData[0]['parent'], jcenterData.city_id, jcenterData.phone, jcenterData.fax, jcenterData.email, jcenterData.web_site, jcenterData.address, jcenterData.description, jcenterData.work_hour, jcenterData.show_mainPage_status, jcenterData.status, jcenterData.logo, jcenterData.signature_image, jcenterData.ID]);
            queryRS = await module.exports.dbQuery_promise(query);
            statement = `UPDATE jcenters__details SET telegram=?,instagram=?,aparat=?,title_in_certificate=?,signature_holder_name=?,signature_position=?,center_indicator_code=? WHERE jcenter_id=?`;
            query = mysql.format(statement, [jcenterData.telegram, jcenterData.instagram, jcenterData.aparat, jcenterData.title_in_certificate, jcenterData.signature_holder_name, jcenterData.signature_position, jcenterData.center_indicator_code, jcenterData.ID]);
            queryRS = await module.exports.dbQuery_promise(query);
            if (queryRS.affectedRows > 0) {
                return queryRS.affectedRows;
            } else {
                return -1;
            }
        } else {
            statement = `INSERT INTO  jcenters__info (title,parent_id,center_mood,state_id,city_id,phone,fax,email,web_site,address,description,work_hour,show_mainPage_status,status,logo,signature_image) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`;
            query = mysql.format(statement, [jcenterData.title, jcenterData.parent_id, 'center', cityData[0]['parent'], jcenterData.city_id, jcenterData.phone, jcenterData.fax, jcenterData.email, jcenterData.web_site, jcenterData.address, jcenterData.description, jcenterData.work_hour, jcenterData.show_mainPage_status, 'Need_Confirm', jcenterData.logo, jcenterData.signature_image]);
            let needJcenterId = await module.exports.dbQuery_promise(query);
            statement = `INSERT INTO  jcenters__details (jcenter_id,telegram,instagram,aparat,title_in_certificate,signature_holder_name,signature_position,center_indicator_code) VALUES(?,?,?,?,?,?,?,?)`;
            query = mysql.format(statement, [needJcenterId.insertId, jcenterData.telegram, jcenterData.instagram, jcenterData.aparat, jcenterData.title_in_certificate, jcenterData.signature_holder_name, jcenterData.signature_position, jcenterData.center_indicator_code]);
            queryRS = await module.exports.dbQuery_promise(query);
            if (needJcenterId.insertId > 0) {
                statement = `INSERT INTO  jcenters__request (type,jcenter_id,req_center_id,jcenter_status) VALUES(?,?,?,?)`;
                query = mysql.format(statement, [6, jcenterData.parent_id, needJcenterId.insertId, 'Confirmed']);
                await module.exports.dbQuery_promise(query);
                return queryRS.insertId;
            } else {
                return -1;
            }
        }
    },
    deleteJcenter: async (jcenterId) => {
        let statement, query, queryRS;
        statement = `UPDATE jcenters__info SET status='Inactive' WHERE ID=?`;
        query = mysql.format(statement, [jcenterId]);
        queryRS = await module.exports.dbQuery_promise(query);
        if (queryRS.affectedRows > 0) {
            return queryRS.affectedRows;
        } else {
            return -1;
        }
    },
    changeJcenterStatus: async (jcenterId, targetStatus) => {
        let statement, query, queryRS;
        statement = `UPDATE jcenters__info SET status=? WHERE ID=?`;
        query = mysql.format(statement, [targetStatus, jcenterId]);
        queryRS = await module.exports.dbQuery_promise(query);
        return queryRS;
    },
    resetJcenterPassword: async (jcenterId) => {
        let jcenterData = await module.exports.getJcentersData(jcenterId);
        if (jcenterData[0]['code'] > 0) {

            const hashedPassword = await bcrypt.hash(jcenterData[0]['code'], 10);
            let statement, query, queryRS;
            statement = `UPDATE user__info SET password=? WHERE code=?`;
            query = mysql.format(statement, [hashedPassword, jcenterData[0]['code']]);
            queryRS = await module.exports.dbQuery_promise(query);
            return queryRS;
        } else {
            return -1;
        }
    },
    getJCenterOperatorList: async (jcenterId) => {
        let statement, query, queryRS;
        statement = `SELECT * FROM user__info WHERE permission=7 AND jcenter_id=?`;
        query = mysql.format(statement, [jcenterId]);
        queryRS = await module.exports.dbQuery_promise(query);
        return queryRS;
    },
    getClassDeliveryData: async () => {
        let statement, query, queryRS;
        statement = `SELECT ID,title FROM classes__delivery_type`;
        query = mysql.format(statement, []);
        queryRS = await module.exports.dbQuery_promise(query);
        return queryRS;
    },
    getClassHoldTimeData: async (classId, mood) => {
        let statement, query, queryRS;
        statement = `SELECT
    classes__hold_time.*,
    jcenters__buildings.title AS Building,
    jcenters__building_rooms.title AS Room,
    classes__delivery_type.title AS deliveryTitle,
    classes__info.title AS ClassName
FROM
    classes__hold_time
INNER JOIN jcenters__buildings ON classes__hold_time.buildings_id = jcenters__buildings.ID
INNER JOIN jcenters__building_rooms ON classes__hold_time.room_id = jcenters__building_rooms.ID
INNER JOIN classes__info ON classes__hold_time.classes_id = classes__info.ID
LEFT JOIN classes__delivery_type ON classes__delivery_type.ID = classes__hold_time.delivery_id
WHERE
    classes__hold_time.classes_id = ?`+ (mood === 'All' ? `` : ` AND classes__hold_time.status='Active'`);
        query = mysql.format(statement, [classId]);
        queryRS = await module.exports.dbQuery_promise(query);
        return queryRS;
    },

    updateHoldTimeStatus: async (holdTimeId, holdTimeStatus) => {
        let statement, query, queryRS;
        let needStatus = 'Active';
        if (holdTimeStatus == 0) {
            needStatus = 'Inactive';
        }
        statement = `UPDATE classes__hold_time SET status=? WHERE ID=?`;
        query = mysql.format(statement, [needStatus, holdTimeId]);
        queryRS = await module.exports.dbQuery_promise(query);
        return queryRS;
    },

    getAllJbuildingsData: async (jcenterId) => {
        let statement, query, queryRS;
        statement = `SELECT jcenters__buildings.* FROM jcenters__buildings WHERE center_id=?`;
        query = mysql.format(statement, [jcenterId]);
        queryRS = await module.exports.dbQuery_promise(query);
        return queryRS;
    },

    getAllJbuildingsRoomsData: async (jcenterId, buildingId) => {
        let statement, query, queryRS;
        statement = `SELECT jcenters__building_rooms.* FROM jcenters__building_rooms
INNER JOIN jcenters__buildings ON jcenters__building_rooms.building_id = jcenters__buildings.ID
WHERE jcenters__buildings.center_id=? AND jcenters__building_rooms.building_id=? AND jcenters__building_rooms.status="Active"`;
        query = mysql.format(statement, [jcenterId, buildingId]);
        queryRS = await module.exports.dbQuery_promise(query);
        return queryRS;
    },

    getClassHoldTime: async (classId) => {
        let statement, query, queryRS;
        statement = `SELECT * FROM classes__hold_time WHERE classes_id=?`;
        query = mysql.format(statement, [classId]);
        queryRS = await module.exports.dbQuery_promise(query);
        return queryRS;
    },

    getClassSession: async (classId) => {
        let statement, query, queryRS;
        statement = `SELECT classes__session.* ,
CONCAT(classes__hold_time.day_id, "(" , classes__hold_time.start_time , "@" , classes__hold_time.end_time , ")") AS DayTime,
classes__info.title AS Class_Title,
jcenters__buildings.title AS Building,
    jcenters__building_rooms.title AS Room,
classes__hold_time.day_id,
classes__hold_time.start_time,
classes__hold_time.end_time,
classes__delivery_type.title AS deliveryTitle
FROM classes__session 
INNER JOIN classes__hold_time ON classes__session.hold_time_id = classes__hold_time.ID
LEFT JOIN classes__delivery_type ON classes__delivery_type.ID = classes__hold_time.delivery_id
INNER JOIN classes__info ON classes__session.classe_id = classes__info.ID
INNER JOIN jcenters__buildings ON classes__hold_time.buildings_id = jcenters__buildings.ID
INNER JOIN jcenters__building_rooms ON classes__hold_time.room_id = jcenters__building_rooms.ID
WHERE classes__session.classe_id = ?`;
        query = mysql.format(statement, [classId]);
        queryRS = await module.exports.dbQuery_promise(query);
        return queryRS;
    },

    submitHoldTime: async (classId, holdTimeData) => {
        let statement, query, queryRS;
        statement = `INSERT INTO classes__hold_time(classes_id, buildings_id, room_id,delivery_id, day_id, start_time, end_time) VALUES (?,?,?,?,?,?,?)`;
        holdTimeData.start_time = module.exports.formatDateTime(holdTimeData.start_time, 'Time');
        holdTimeData.end_time = module.exports.formatDateTime(holdTimeData.end_time, 'Time');
        query = mysql.format(statement, [classId, holdTimeData.building_id, holdTimeData.room_id, holdTimeData.delivery_id, holdTimeData.day_id, holdTimeData.start_time, holdTimeData.end_time]);
        queryRS = await module.exports.dbQuery_promise(query);
        if (queryRS.insertId > 0) {
            return queryRS.insertId;
        } else {
            return -1;
        }
    },

    submitSession: async (sessionTitle, sessionHoldTimeID, sessionDate, classId, sessionId) => {
        let statement, query, queryRS;
        sessionDate = module.exports.formatDateTime(sessionDate, 'Date');
        if (parseInt(sessionId) > 0) {
            statement = `UPDATE classes__session SET classe_id=?,hold_time_id=?, title=?, date=? WHERE ID=?`;
        } else {
            statement = `INSERT INTO classes__session(classe_id, hold_time_id, title, date) VALUES (?,?,?,?)`;
        }
        query = mysql.format(statement, [classId, sessionHoldTimeID, sessionTitle, sessionDate, sessionId]);
        queryRS = await module.exports.dbQuery_promise(query);
        if (queryRS.insertId > 0) {
            return queryRS.insertId;
        } else {
            return -1;
        }
    },

    deleteSession: async (sessionId) => {
        let statement, query, queryRS;
        statement = `DELETE FROM classes__session WHERE ID=?`;
        query = mysql.format(statement, [sessionId]);
        queryRS = await module.exports.dbQuery_promise(query);
        if (queryRS.affectedRows > 0) {
            return queryRS.affectedRows;
        } else {
            return -1;
        }
    },

    deleteAllSession: async (classId) => {
        let statement, query, queryRS;
        statement = `DELETE FROM classes__session WHERE classe_id=?`;
        query = mysql.format(statement, [classId]);
        queryRS = await module.exports.dbQuery_promise(query);
        if (queryRS.affectedRows > 0) {
            return queryRS.affectedRows;
        } else {
            return -1;
        }
    },

    autoSessionGenerator: async (classId) => {
        let statement, query, queryRS;

        // حذف جلسات قبلی کلاس
        statement = `DELETE FROM classes__session WHERE classe_id=?`;
        query = mysql.format(statement, [classId]);
        await module.exports.dbQuery_promise(query);

        // دریافت اطلاعات تعداد جلسات
        statement = `SELECT class_sessions_number,start_date FROM classes__info WHERE ID=?`;
        query = mysql.format(statement, [classId]);
        queryRS = await module.exports.dbQuery_promise(query);
        if (queryRS.length === 0) {
            return { success: false, message: "Class not found" };
        }
        const sessionNum = queryRS[0]['class_sessions_number'];
        const classStartDate = queryRS[0]['start_date'];

        // دریافت روزهای هفته و شناسه‌های زمان‌بندی
        statement = `SELECT ID, day_id FROM classes__hold_time WHERE status='Active' AND classes_id=? ORDER BY day_id ASC`;
        query = mysql.format(statement, [classId]);
        queryRS = await module.exports.dbQuery_promise(query);
        if (queryRS.length === 0) {
            return { success: false, message: "No hold times found for the class" };
        }
        let holdTimes = queryRS.map(row => ({
            dayId: row['day_id'],
            holdTimeId: row['ID'],
        }));
        // محاسبه تاریخ جلسات
        const currentDate = new Date(classStartDate);
        const result = [];
        const sessionsPerWeek = holdTimes.length;

        const today = new Date().getDay() + 1; // روز فعلی (۰ برای شنبه، ۶ برای جمعه)

        // محاسبه تعداد روزهای کوچکتر از امروز
        const smallerDays = holdTimes.filter(day => day.dayId <= today).length;

        // انتقال تعداد مشخصی از عناصر از ابتدا به انتهای آرایه
        holdTimes = [...holdTimes.slice(smallerDays), ...holdTimes.slice(0, smallerDays)];

        for (let i = 0; i < sessionNum; i++) {
            const { dayId, holdTimeId } = holdTimes[i % sessionsPerWeek];
            const weekOffset = Math.floor(i / sessionsPerWeek);
            const targetDate = new Date(currentDate);


            // محاسبه تاریخ جلسه
            const diff = (dayId - (targetDate.getDay() + 1) + 7) % 7;
            targetDate.setDate(targetDate.getDate() + diff + (weekOffset * 7));

            result.push({
                title: `جلسه شماره ${i + 1}`,
                holdTimeId,
                date: targetDate.toISOString().slice(0, 10),
            });
        }

        // درج جلسات در دیتابیس با یک کوئری
        const insertValues = result
            .map(r => `(${mysql.escape(classId)}, ${mysql.escape(r.holdTimeId)}, ${mysql.escape(r.title)}, ${mysql.escape(r.date)})`)
            .join(',');
        statement = `INSERT INTO classes__session (classe_id, hold_time_id, title, date) VALUES ${insertValues}`;
        await module.exports.dbQuery_promise(statement);

        return { success: true, sessions: result };
    },

    getClassSessionUserList: async (classId, sessionId) => {
        let statement, query, queryRS;

        statement = `INSERT INTO classes__user_session_relation(user_id, classe_id, session_id) 
        SELECT classes__user_relation.user_id , ? , ? 
        FROM classes__user_relation
        WHERE 
        classes__user_relation.class_id = ? AND classes__user_relation.status='Active' AND 
        classes__user_relation.user_id 
        NOT IN(SELECT classes__user_session_relation.user_id 
        FROM classes__user_session_relation 
        WHERE classes__user_session_relation.classe_id = ? AND classes__user_session_relation.session_id = ?) 
        GROUP BY classes__user_relation.user_id`;
        query = mysql.format(statement, [classId, sessionId, classId, classId, sessionId]);
        queryRS = await module.exports.dbQuery_promise(query);

        statement = `SELECT 
        classes__user_session_relation.* ,
        CONCAT(user__info.fname , ' ' , user__info.lname) AS user_full_name
        FROM 
        classes__user_session_relation
        INNER JOIN user__info ON classes__user_session_relation.user_id = user__info.ID
        WHERE 
        classes__user_session_relation.classe_id=? AND classes__user_session_relation.session_id=?`
        query = mysql.format(statement, [classId, sessionId]);
        queryRS = await module.exports.dbQuery_promise(query);
        return queryRS;
    },

    getClassUserList: async (classId) => {
        let statement, query, queryRS;
        statement = `SELECT 
        classes__user_relation.* ,
        CONCAT(user__info.fname , ' ' , user__info.lname) AS user_full_name
        FROM classes__user_relation
        INNER JOIN user__info ON classes__user_relation.user_id = user__info.ID
        WHERE classes__user_relation.class_id=?`
        query = mysql.format(statement, [classId]);
        queryRS = await module.exports.dbQuery_promise(query);
        return queryRS;
    },

    getClassCancelationUserList: async (calssId) => {
        let statement, query, queryRS;
        statement = `SELECT 
        classes__user_relation.ID,
CONCAT(user__info.fname , ' ' , user__info.lname) AS user_full_name,
user__info.ID AS userId,
classes__user_relation.insert_time,
classes__user_relation.status AS RStatus
FROM classes__user_relation
INNER JOIN user__info ON classes__user_relation.user_id = user__info.ID
WHERE
classes__user_relation.class_id = ? AND 
classes__user_relation.status IN('Cancel_request','Canceled') `;
        query = mysql.format(statement, [calssId]);

        queryRS = await module.exports.dbQuery_promise(query);
        return queryRS;
    },

    acceptCancelRequest: async (requestId, jcenterId, classId, cancelingPenalty, userID) => {
        let statement, query, queryRS;
        statement = `UPDATE classes__user_relation SET status="Canceled" WHERE ID=?`;
        query = mysql.format(statement, [requestId]);
        queryRS = await module.exports.dbQuery_promise(query);

        statement = `UPDATE classes__info SET registration_number=registration_number-1 WHERE ID=?`;
        query = mysql.format(statement, [classId]);
        queryRS = await module.exports.dbQuery_promise(query);

        queryRS = await module.exports.dbQuery_promise('SELECT * FROM classes__user_relation WHERE ID=' + requestId);

        statement = `INSERT INTO user__payback_need(user_id, jcenters_id, class_id, pay_amount) VALUES (?,?,?,?)`;
        query = mysql.format(statement, [queryRS[0]['user_id'], jcenterId, queryRS[0]['class_id'], (parseInt(queryRS[0]['paid_amount']) - parseInt(cancelingPenalty))]);
        // console.log(query);
        queryRS = await module.exports.dbQuery_promise(query);

        if (queryRS.affectedRows > 0) {
            return queryRS.affectedRows;
        } else {
            return -1;
        }
    },
    getPayBackData: async (jcenterId) => {
        let statement, query, queryRS;
        statement = `SELECT 
user__payback_need.*,
CONCAT(user__info.fname , ' ' , user__info.lname) AS user_full_name,
classes__info.title AS classTilte,
classes__info.code
FROM 
user__payback_need
INNER JOIN user__info ON user__payback_need.user_id = user__info.ID
INNER JOIN classes__info ON user__payback_need.class_id = classes__info.ID
WHERE
user__payback_need.jcenters_id=?`;
        query = mysql.format(statement, [jcenterId]);
        queryRS = await module.exports.dbQuery_promise(query);


        return queryRS;
    },
    acceptPayBack: async (requestId, paymentDoc, paymentCode) => {
        let statement, query, queryRS;
        statement = `UPDATE user__payback_need SET status="Done",payment_doc=?,payment_ref_code=? WHERE ID=?`;
        query = mysql.format(statement, [paymentDoc, paymentCode, requestId]);
        queryRS = await module.exports.dbQuery_promise(query);
        if (queryRS.affectedRows > 0) {
            return queryRS.affectedRows;
        } else {
            return -1;
        }
    },
    changeUserSessionStatus: async (userSessionId, targetStatus) => {
        let statement, query, queryRS;
        statement = `UPDATE classes__user_session_relation SET status=? WHERE ID=?`;
        query = mysql.format(statement, [targetStatus, userSessionId]);
        queryRS = await module.exports.dbQuery_promise(query);
        if (queryRS.affectedRows > 0) {
            return queryRS.affectedRows;
        } else {
            return -1;
        }
    },

    submitUserListInfo: async (classUserList) => {
        const ids = classUserList.map(user => user.ID);
        const casesMessage = classUserList.map(user => `WHEN ID=${mysql.escape(user.ID)} THEN ${mysql.escape(user.user_message)}`).join(" ");
        const casesComment = classUserList.map(user => `WHEN ID=${mysql.escape(user.ID)} THEN ${mysql.escape(user.user_comment)}`).join(" ");
        const statement = `
                UPDATE classes__user_session_relation
                SET 
                    user_message = CASE ${casesMessage} END,
                    user_comment = CASE ${casesComment} END
                WHERE ID IN (${ids.map(id => mysql.escape(id)).join(",")});
            `;
        const queryRS = await module.exports.dbQuery_promise(statement);
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

    submitJbuilding: async (jbuildingData, jcenterId) => {
        let statement, query, queryRS;

        if (jbuildingData.ID) {
            statement = `UPDATE jcenters__buildings SET title=?,phone=?,fax=?,address=?,status=? WHERE ID=?`;
            query = mysql.format(statement,
                [jbuildingData.title, jbuildingData.phone, jbuildingData.fax, jbuildingData.address, jbuildingData.status, jbuildingData.ID]);
            queryRS = await module.exports.dbQuery_promise(query);
            if (queryRS.affectedRows > 0) {
                return queryRS.affectedRows;
            } else {
                return -1;
            }
        } else {
            statement = `INSERT INTO  jcenters__buildings (center_id,title,phone,fax,address) VALUES(?,?,?,?,?)`;
            query = mysql.format(statement,
                [jcenterId, jbuildingData.title, jbuildingData.phone, jbuildingData.fax, jbuildingData.address]);
            queryRS = await module.exports.dbQuery_promise(query);
            if (queryRS.insertId > 0) {
                return queryRS.insertId;
            } else {
                return -1;
            }
        }
    },
    changeJbuildingStatus: async (jbuildingId, targetStatus) => {
        let statement, query, queryRS;
        statement = `UPDATE jcenters__buildings SET status=? WHERE ID=?`;
        query = mysql.format(statement, [targetStatus, jbuildingId]);
        queryRS = await module.exports.dbQuery_promise(query);
        return queryRS;
    },
    getJRoomsOptions: async () => {
        let statement, query, queryRS;
        statement = `SELECT * FROM jcenters__rooms_option WHERE status='Active'`;
        query = mysql.format(statement);
        queryRS = await module.exports.dbQuery_promise(query);
        return queryRS;
    },
    submitBuildingRoomRel: async (buildingId, roomTitle, roomOptions) => {
        let statement, query, queryRS;
        statement = `INSERT INTO  jcenters__building_rooms (building_id,title,options) VALUES(?,?,?)`;
        query = mysql.format(statement, [buildingId, roomTitle, roomOptions]);
        queryRS = await module.exports.dbQuery_promise(query);
        if (queryRS.insertId > 0) {
            return queryRS.insertId;
        } else {
            return -1;
        }
    },
    getBuildingRoomRelationData: async (buildingId) => {
        let statement, query, queryRS;
        statement = `SELECT
                jcenters__building_rooms.ID,
                jcenters__buildings.title AS Btitle,
                jcenters__building_rooms.title,
                jcenters__building_rooms.options,
                jcenters__building_rooms.status
                FROM jcenters__building_rooms
                INNER JOIN jcenters__buildings ON jcenters__buildings.ID = jcenters__building_rooms.building_id
                WHERE jcenters__building_rooms.building_id=?`;
        query = mysql.format(statement, [buildingId]);
        queryRS = await module.exports.dbQuery_promise(query);
        const processedResults = queryRS.map(row => {
            if (row.options != 'null') {
                const options = JSON.parse(row.options);
                console.log(options);
                const labels = options.map(option => option.label).join(', ');
                return {
                    ...row,
                    options: labels
                };
            } else {
                return {
                    ...row,
                    options: '---'
                };

            }
        });
        return processedResults;
    },
    updateBuildingRoomRelStatus: async (buildingRoomRelRelId, buildingRoomRelStatus) => {
        let statement, query, queryRS;
        let needStatus = 'Active';
        if (buildingRoomRelStatus == 0) {
            needStatus = 'Inactive';
        }
        statement = `UPDATE jcenters__building_rooms SET status=? WHERE ID=?`;
        query = mysql.format(statement, [needStatus, buildingRoomRelRelId]);
        queryRS = await module.exports.dbQuery_promise(query);
        return queryRS;
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
    changeJexamcenterStatus: async (jexamcenterId, targetStatus) => {
        let statement, query, queryRS;
        statement = `UPDATE jexam__centers SET status=? WHERE ID=?`;
        query = mysql.format(statement, [targetStatus, jexamcenterId]);
        queryRS = await module.exports.dbQuery_promise(query);
        return queryRS;
    },
    submitOperator: async (operatorData, jcenterId) => {
        let statement, query, queryRS;
        if (operatorData.ID) {
            statement = `UPDATE user__info SET fname=?,lname=?,national_code=?,mobile=? WHERE ID=?`;
            query = mysql.format(statement, [operatorData.fname, operatorData.lname, operatorData.national_code, operatorData.mobile, operatorData.ID]);
            queryRS = await module.exports.dbQuery_promise(query);
            if (queryRS.affectedRows > 0) {
                return queryRS.affectedRows;
            } else {
                return -1;
            }
        } else {
            statement = `INSERT INTO user__info(fname, lname, national_code, mobile, password, permission, jcenter_id) VALUES (?,?,?,?,?,?,?)`;
            let password = hashedPassword = await bcrypt.hash(operatorData.national_code, 10);
            query = mysql.format(statement, [operatorData.fname, operatorData.lname, operatorData.national_code, operatorData.mobile, password, 7, jcenterId]);
            queryRS = await module.exports.dbQuery_promise(query);
            if (queryRS.insertId > 0) {
                if (queryRS.insertId > 0) {
                    statement = "INSERT INTO user__them_setting(user_id) VALUES (?)";
                    query = mysql.format(statement, [queryRS.insertId]);
                    await module.exports.dbQuery_promise(query);
                }
                return queryRS.insertId;
            } else {
                return -1;
            }
        }
    },
    deleteOperator: async (operatorId) => {
        let statement, query, queryRS;
        statement = `DELETE FROM user__info WHERE ID=?`;
        query = mysql.format(statement, [operatorId]);
        queryRS = await module.exports.dbQuery_promise(query);
        if (queryRS.affectedRows > 0) {
            return queryRS.affectedRows;
        } else {
            return -1;
        }
    },
    changeJOperatorStatus: async (jOperatorId, targetStatus) => {
        let statement, query, queryRS;
        statement = `UPDATE user__info SET status=? WHERE ID=?`;
        query = mysql.format(statement, [targetStatus, jOperatorId]);
        queryRS = await module.exports.dbQuery_promise(query);
        return queryRS;
    },
    getAllJdepartmentsData: async (mood) => {
        // console.time("getAllJdepartmentsData");
        let statement, query, queryRS;
        statement = `SELECT education__department.ID,education__department.title,education__department.status FROM education__department ${mood === 'Active' ? 'WHERE status=?' : ''}`;
        query = mysql.format(statement, ['Active']);
        queryRS = await module.exports.dbQuery_promise(query);
        // console.timeEnd("getAllJdepartmentsData");
        return queryRS;
    },
    getJCenterDepartment: async (userUJCId) => {
        let statement, query, queryRS;
        statement = `SELECT
        education__department.ID,
        education__department.title
        FROM jcenters__department_relation
        INNER JOIN education__department ON education__department.ID = jcenters__department_relation.department_id
        WHERE jcenters__department_relation.jcenter_id=?`;
        query = mysql.format(statement, [userUJCId]);
        queryRS = await module.exports.dbQuery_promise(query);
        return queryRS;
    },
    submitJdepartment: async (jdepartmentData) => {
        let statement, query, queryRS;
        if (jdepartmentData.ID) {
            statement = `UPDATE education__department SET title=?,status=? WHERE ID=?`;
            query = mysql.format(statement, [jdepartmentData.title, jdepartmentData.status, jdepartmentData.ID]);
            queryRS = await module.exports.dbQuery_promise(query);
            if (queryRS.affectedRows > 0) {
                return queryRS.affectedRows;
            } else {
                return -1;
            }
        } else {
            statement = `INSERT INTO  education__department (title) VALUES(?)`;
            query = mysql.format(statement, [jdepartmentData.title]);
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
        statement = `UPDATE education__department SET status='Inactive' WHERE ID=?`;
        query = mysql.format(statement, [jdepartmentId]);
        queryRS = await module.exports.dbQuery_promise(query);
        if (queryRS.affectedRows > 0) {
            return queryRS.affectedRows;
        } else {
            return -1;
        }
    },
    updateJdepartmentStatus: async (jdepartmentId, targetStatus) => {
        let statement, query, queryRS;
        statement = `UPDATE education__department SET status=? WHERE ID=?`;
        query = mysql.format(statement, [targetStatus, jdepartmentId]);
        queryRS = await module.exports.dbQuery_promise(query);
        return queryRS;
    },
    getRequestsFilters: async () => {
        let statement, query, queryRS;
        statement = `SELECT jcenters__request_type.ID,jcenters__request_type.title
        FROM jcenters__request_type 
        WHERE jcenters__request_type.status='Active' ORDER BY jcenters__request_type.priority ASC`;
        query = mysql.format(statement);
        queryRS = await module.exports.dbQuery_promise(query);
        return queryRS;
    },
    getRequestsData: async (requestType, userDataRS) => {
        // TODO: get main ceneter subCenters to show all requests of them
        let statement, query, queryRS;
        let needJCenterFilter = (parseInt(userDataRS[0]['jcenter_id']) > 0 ? ' AND (jcenters__request.jcenter_id=' + userDataRS[0]['jcenter_id'] + ' OR jcenters__info.parent_id=' + userDataRS[0]['jcenter_id'] + ') ' : '');
        if (requestType === 1) {
            statement = `SELECT
            jcenters__request.ID,
            jcenters__request.type,
            jcenters__request.jcenter_id,
            jcenters__request.jcenter_status,
            jcenters__request.req_department_id,
            jcenters__request.status,
            IF(jcenters__info.parent_id IS NULL,jcenters__info.title,CONCAT(parentCenter.title,' - ',jcenters__info.title)) AS jcenter_title,
            education__department.title AS reqjdep_title,
            CONCAT (jcenterUser.fname,' ',jcenterUser.lname) AS jcenterUser_name,
            CONCAT (jUser.fname,' ',jUser.lname) AS jUser_name,
            jcenters__request.jcenter_update_time,
            jcenters__request.update_time,
            jcenters__request.insert_time
            FROM jcenters__request
            INNER JOIN jcenters__info ON jcenters__info.ID = jcenters__request.jcenter_id
            INNER JOIN education__department ON education__department.ID = jcenters__request.req_department_id
            LEFT JOIN user__info AS jcenterUser ON jcenterUser.ID = jcenters__request.jcenter_user_id
            LEFT JOIN user__info AS jUser ON jUser.ID = jcenters__request.user_id
            LEFT JOIN jcenters__info AS parentCenter ON parentCenter.ID = jcenters__info.parent_id
            WHERE jcenters__request.status!='Deleted' AND type =? `+ needJCenterFilter;
        }
        if (requestType === 2) {
            statement = `SELECT
            jcenters__request.ID,
            jcenters__request.type,
            jcenters__request.department_id,
            jcenters__request.educationGroup_id,
            jcenters__request.jcenter_id,
            jcenters__request.jcenter_status,
            jcenters__request.status,
            IF(jcenters__info.parent_id IS NULL,jcenters__info.title,CONCAT(parentCenter.title,' - ',jcenters__info.title)) AS jcenter_title,
            education__department.title AS jdep_title,
            education__group.title AS eduGroup_title,
            CONCAT (jcenterUser.fname,' ',jcenterUser.lname) AS jcenterUser_name,
            CONCAT (jUser.fname,' ',jUser.lname) AS jUser_name,
            jcenters__request.jcenter_update_time,
            jcenters__request.update_time,
            jcenters__request.insert_time
            FROM jcenters__request
            INNER JOIN jcenters__info ON jcenters__info.ID = jcenters__request.jcenter_id
            INNER JOIN education__department ON education__department.ID = jcenters__request.department_id
            INNER JOIN education__group ON education__group.ID = jcenters__request.educationGroup_id
            LEFT JOIN user__info AS jcenterUser ON jcenterUser.ID = jcenters__request.jcenter_user_id
            LEFT JOIN user__info AS jUser ON jUser.ID = jcenters__request.user_id
            LEFT JOIN jcenters__info AS parentCenter ON parentCenter.ID = jcenters__info.parent_id
            WHERE jcenters__request.status!='Deleted' AND type =? `+ needJCenterFilter;
        }
        if (requestType === 3) {
            statement = `SELECT
            jcenters__request.ID,
            jcenters__request.type,
            jcenters__request.jcenter_id,
            jcenters__request.jcenter_status,
            jcenters__request.status,
            jcenters__info.title AS jcenter_title,
            education__department.title AS jdep_title,
            lesson__info.title AS lesson_title,
            CONCAT (jcenterUser.fname,' ',jcenterUser.lname) AS jcenterUser_name,
            CONCAT (jUser.fname,' ',jUser.lname) AS jUser_name,
            jcenters__request.jcenter_update_time,
            jcenters__request.update_time,
            jcenters__request.insert_time
            FROM jcenters__request
            INNER JOIN jcenters__info ON jcenters__info.ID = jcenters__request.jcenter_id
            INNER JOIN education__department ON education__department.ID = jcenters__request.department_id
            INNER JOIN lesson__info ON lesson__info.ID = jcenters__request.lesson_id
            LEFT JOIN user__info AS jcenterUser ON jcenterUser.ID = jcenters__request.jcenter_user_id
            LEFT JOIN user__info AS jUser ON jUser.ID = jcenters__request.user_id
            WHERE jcenters__request.status!='Deleted' AND type = ? `+ needJCenterFilter;
        }
        if (requestType === 5) {
            statement = `SELECT
            jcenters__request.ID,
            jcenters__request.type,
            jcenters__request.jcenter_id,
            jcenters__request.jcenter_status,
            jcenters__request.teacher_id,
            jcenters__request.status,
            jcenters__info.title AS jcenter_title,
            CONCAT (teachers__info.f_name,' ',teachers__info.l_name) AS teacher_name,
            jcenters__request.jcenter_update_time,
            jcenters__request.update_time,
            jcenters__request.insert_time
            FROM jcenters__request
            INNER JOIN jcenters__info ON jcenters__info.ID = jcenters__request.jcenter_id
            INNER JOIN teachers__info ON teachers__info.ID = jcenters__request.teacher_id
            WHERE jcenters__request.status!='Deleted' AND type =?`;
        }
        if (requestType === 6) {
            statement = `SELECT
            jcenters__request.ID,
            jcenters__request.type,
            jcenters__request.jcenter_id,
            jcenters__request.jcenter_status,
            jcenters__request.req_center_id,
            jcenters__request.status,
            jcenters__info.title AS jcenter_title,
            reqJcenter.title AS reqJcenter_title,
            CONCAT (jcenterUser.fname,' ',jcenterUser.lname) AS jcenterUser_name,
            CONCAT (jUser.fname,' ',jUser.lname) AS jUser_name,
            jcenters__request.jcenter_update_time,
            jcenters__request.update_time,
            jcenters__request.insert_time
            FROM jcenters__request
            INNER JOIN jcenters__info ON jcenters__info.ID = jcenters__request.jcenter_id
            INNER JOIN jcenters__info AS reqJcenter ON reqJcenter.ID = jcenters__request.req_center_id
            LEFT JOIN user__info AS jcenterUser ON jcenterUser.ID = jcenters__request.jcenter_user_id
            LEFT JOIN user__info AS jUser ON jUser.ID = jcenters__request.user_id
            WHERE jcenters__request.status!='Deleted' AND type =?`;
        }
        query = mysql.format(statement, [requestType]);
        queryRS = await module.exports.dbQuery_promise(query);
        if (queryRS.length > 0) {
            return queryRS;
        } else {
            return -1;
        }
    },
    manageJAddDepartmentRequest: async (jRequestData, jRequestType, userDataRS) => {
        let statement, query, queryRS;
        const currentTime = new Date();
        if (jRequestData.ID) {
            statement = `UPDATE jcenters__request SET req_department_id=?,jcenter_status=?,status=?,` + (parseInt(userDataRS[0]['jcenter_id']) > 0 ? 'jcenter_user_id=?,jcenter_update_time=?' : 'user_id=?,update_time=?') + ` WHERE ID=?`;
            query = mysql.format(statement, [jRequestData.req_department_id, jRequestData.jcenter_status, jRequestData.status, userDataRS[0]['ID'], currentTime, jRequestData.ID]);
            queryRS = await module.exports.dbQuery_promise(query);
            if (queryRS.affectedRows > 0) {
                if (jRequestData.status === 'Confirmed') {
                    statement = `INSERT INTO  jcenters__department_relation (jcenter_id,department_id) VALUES(?,?)`;
                    query = mysql.format(statement, [jRequestData.jcenter_id, jRequestData.req_department_id]);
                    queryRS = await module.exports.dbQuery_promise(query);
                }
                return queryRS.affectedRows;
            } else {
                return -1;
            }
        } else {
            statement = `INSERT INTO  jcenters__request (type,jcenter_id,req_department_id,jcenter_status) VALUES(?,?,?,?)`;
            query = mysql.format(statement, [jRequestType, jRequestData.jcenter_id, jRequestData.req_department_id, jRequestData.jcenter_status]);
            queryRS = await module.exports.dbQuery_promise(query);
            if (queryRS.insertId > 0) {
                return queryRS.insertId;
            } else {
                return -1;
            }
        }

    },
    manageJAddTeacherRequest: async (jRequestData, jRequestType, userDataRS) => {
        let statement, query, queryRS;
        const currentTime = new Date();
        if (jRequestData.ID) {
            statement = `UPDATE jcenters__request SET jcenter_status=?,status=?,` + (parseInt(userDataRS[0]['jcenter_id']) > 0 ? 'jcenter_user_id=?,jcenter_update_time=?' : 'user_id=?,update_time=?') + ` WHERE ID=?`;
            query = mysql.format(statement, [jRequestData.jcenter_status, jRequestData.status, userDataRS[0]['ID'], currentTime, jRequestData.ID]);
            queryRS = await module.exports.dbQuery_promise(query);
            if (queryRS.affectedRows > 0) {
                if (jRequestData.status === 'Confirmed') {
                    statement = `INSERT INTO teachers__jcenter_relation (teacher_id,center_id) VALUES(?,?)`;
                    query = mysql.format(statement, [jRequestData.teacher_id, jRequestData.jcenter_id]);
                    queryRS = await module.exports.dbQuery_promise(query);
                }
                return queryRS.affectedRows;
            } else {
                return -1;
            }
        } else {
            statement = `INSERT INTO  jcenters__request (type,jcenter_id,req_department_id,jcenter_status) VALUES(?,?,?,?)`;
            query = mysql.format(statement, [jRequestType, jRequestData.jcenter_id, jRequestData.req_department_id, jRequestData.jcenter_status]);
            queryRS = await module.exports.dbQuery_promise(query);
            if (queryRS.insertId > 0) {
                return queryRS.insertId;
            } else {
                return -1;
            }
        }

    },
    manageJEduGroupRequest: async (jRequestData, jRequestType, userDataRS) => {
        let statement, query, queryRS;
        const currentTime = new Date();
        if (jRequestData.ID) {
            statement = `UPDATE jcenters__request SET jcenter_status=?,status=?,` + (parseInt(userDataRS[0]['jcenter_id']) > 0 ? 'jcenter_user_id=?,jcenter_update_time=?' : 'user_id=?,update_time=?') + ` WHERE ID=?`;
            query = mysql.format(statement, [jRequestData.jcenter_status, jRequestData.status, userDataRS[0]['ID'], currentTime, jRequestData.ID]);
            queryRS = await module.exports.dbQuery_promise(query);
            if (queryRS.affectedRows > 0) {
                if (jRequestData.status === 'Confirmed') {
                    statement = `INSERT INTO  jcenters__eduGroup_relation (jcenter_id,department_id,education_group_id) VALUES(?,?,?)`;
                    query = mysql.format(statement, [jRequestData.jcenter_id, jRequestData.department_id, jRequestData.educationGroup_id]);
                    queryRS = await module.exports.dbQuery_promise(query);
                }
                return queryRS.affectedRows;
            } else {
                return -1;
            }
        } else {
            statement = `INSERT INTO  jcenters__request (type,jcenter_id,department_id,educationGroup_id,jcenter_status) VALUES(?,?,?,?,?)`;
            query = mysql.format(statement, [jRequestType, jRequestData.jcenter_id, jRequestData.department_id, jRequestData.educationGroup_id, jRequestData.jcenter_status]);
            queryRS = await module.exports.dbQuery_promise(query);
            if (queryRS.insertId > 0) {
                return queryRS.insertId;
            } else {
                return -1;
            }
        }
    },
    manageJNewCenterRequest: async (jRequestData, jRequestType, userDataRS) => {
        let statement, query, queryRS;
        const currentTime = new Date();
        if (jRequestData.ID) {
            statement = `UPDATE jcenters__request SET jcenter_status=?,status=?,` + (parseInt(userDataRS[0]['jcenter_id']) > 0 ? 'jcenter_user_id=?,jcenter_update_time=?' : 'user_id=?,update_time=?') + ` WHERE ID=?`;
            query = mysql.format(statement, [jRequestData.jcenter_status, jRequestData.status, userDataRS[0]['ID'], currentTime, jRequestData.ID]);
            queryRS = await module.exports.dbQuery_promise(query);
            if (queryRS.affectedRows > 0) {
                if (jRequestData.status === 'Confirmed') {
                    await module.exports.createUserForJcenter(jRequestData.req_center_id);
                    statement = `UPDATE  jcenters__info SET status=? WHERE ID=?`;
                    query = mysql.format(statement, ['Active', jRequestData.req_center_id]);
                    queryRS = await module.exports.dbQuery_promise(query);
                }
                return queryRS.affectedRows;
            } else {
                return -1;
            }
        }
    },
    deleteJrequest: async (jrequestId) => {
        let statement, query, queryRS;
        statement = `UPDATE jcenters__request SET jcenter_status='Deleted',status='Deleted' WHERE ID=?`;
        query = mysql.format(statement, [jrequestId]);
        queryRS = await module.exports.dbQuery_promise(query);
        if (queryRS.affectedRows > 0) {
            return queryRS.affectedRows;
        } else {
            return -1;
        }
    },

    loadLastLogin: async (userID) => {
        let statement, query, queryRS;
        statement = `SELECT * FROM user__last_login WHERE user_id=? ORDER BY ID DESC`;
        query = mysql.format(statement, [userID]);
        queryRS = await module.exports.dbQuery_promise(query);
        return queryRS;
    },

    loadDashboardData: async (userID) => {
        userID = 1;
        let statement, query, queryRS;
        let rerunRS = [];
        //----------------------------------------------------------------------
        statement = `SELECT FLOOR(RAND() * (35000000000 - 34000000000 + 1)) + 34000000000 AS income , FLOOR(RAND() * (9 - (-4) + 1)) + (-4) AS change_percent FROM user__last_login WHERE user_id=? ORDER BY ID DESC LIMIT 1`;
        query = mysql.format(statement, [userID]);
        queryRS = await module.exports.dbQuery_promise(query);
        rerunRS.push(queryRS);
        //----------------------------------------------------------------------
        statement = `SELECT FLOOR(RAND() * (500 - 70 + 1)) + 70 AS register_num FROM user__last_login WHERE user_id=? ORDER BY ID DESC LIMIT 8`;
        query = mysql.format(statement, [userID]);
        queryRS = await module.exports.dbQuery_promise(query);
        rerunRS.push(queryRS);
        //----------------------------------------------------------------------
        statement = `SELECT FLOOR(RAND() * (10000000 - 1000000 + 1)) + 1000000 AS register_num FROM user__last_login WHERE user_id=? ORDER BY ID DESC LIMIT 8`;
        query = mysql.format(statement, [userID]);
        queryRS = await module.exports.dbQuery_promise(query);
        rerunRS.push(queryRS);
        //----------------------------------------------------------------------
        statement = `SELECT FLOOR(RAND() * (500 - 70 + 1)) + 70 AS register_num FROM user__last_login WHERE user_id=? ORDER BY ID DESC LIMIT 8`;
        query = mysql.format(statement, [userID]);
        queryRS = await module.exports.dbQuery_promise(query);
        rerunRS.push(queryRS);
        //----------------------------------------------------------------------
        statement = `SELECT FLOOR(RAND() * (300 - 50 + 1)) + 50 AS register_num FROM user__last_login WHERE user_id=? ORDER BY ID DESC LIMIT 8`;
        query = mysql.format(statement, [userID]);
        queryRS = await module.exports.dbQuery_promise(query);
        rerunRS.push(queryRS);
        //----------------------------------------------------------------------
        statement = `SELECT FLOOR(RAND() * (100 - 10 + 1)) + 10 AS register_num FROM user__last_login WHERE user_id=? ORDER BY ID DESC LIMIT 8`;
        query = mysql.format(statement, [userID]);
        queryRS = await module.exports.dbQuery_promise(query);
        rerunRS.push(queryRS);
        //----------------------------------------------------------------------
        statement = `SELECT FLOOR(RAND() * (100 - 10 + 1)) + 10 AS register_num FROM user__last_login WHERE user_id=? ORDER BY ID DESC LIMIT 8`;
        query = mysql.format(statement, [userID]);
        queryRS = await module.exports.dbQuery_promise(query);
        rerunRS.push(queryRS);
        //----------------------------------------------------------------------
        statement = `SELECT FLOOR(RAND() * (200 - 5 + 1)) + 5 AS register_num FROM user__last_login WHERE user_id=? ORDER BY ID DESC LIMIT 8`;
        query = mysql.format(statement, [userID]);
        queryRS = await module.exports.dbQuery_promise(query);
        rerunRS.push(queryRS);
        //----------------------------------------------------------------------
        return rerunRS;
    },

    loadMemberWeekLyPlan: async (userID) => {
        let statement, query, queryRS;

        statement = 'SELECT permission FROM user__info WHERE ID=?'
        query = mysql.format(statement, [userID]);
        queryRS = await module.exports.dbQuery_promise(query);

        if (parseInt(queryRS[0]['permission']) === 8) {
            statement = `SELECT 
0 AS DOYP,
DAYOFYEAR(classes__session.date) AS DOY,
classes__session.date,
classes__info.title
FROM classes__session
INNER JOIN classes__teacher_relation ON classes__session.classe_id = classes__teacher_relation.classe_id
INNER JOIN teachers__info ON classes__teacher_relation.teacher_id = teachers__info.ID
INNER JOIN classes__info ON classes__session.classe_id = classes__info.ID
WHERE teachers__info.user_id = ?`;
        } else {
            statement = `SELECT 
0 AS DOYP,
DAYOFYEAR(classes__session.date) AS DOY,
classes__session.date,
classes__info.title
FROM classes__session
INNER JOIN classes__user_relation ON classes__session.classe_id = classes__user_relation.class_id
INNER JOIN classes__info ON classes__session.classe_id = classes__info.ID
WHERE classes__user_relation.user_id = ?`;
        }
        query = mysql.format(statement, [userID]);
        queryRS = await module.exports.dbQuery_promise(query);
        for (let i = 0; i < queryRS.length; i++) {
            queryRS[i]['DOYP'] = module.exports.getDaysFromStartOfYear(new Date(queryRS[i]['date']).getFullYear() + '-' + ((new Date(queryRS[0]['date']).getMonth()) + 1) + '-' + new Date(queryRS[i]['date']).getDate());
        }

        return queryRS;
    },

    getDaysFromStartOfYear(date) {
        const jalaaliDate = moment(date, 'YYYY-MM-DD').format('jYYYY-jMM-jDD');
        const year = moment(date, 'YYYY-MM-DD').jYear();
        const firstDayOfYear = moment(`${year}-01-01`, 'jYYYY-jMM-jDD');
        const daysPassed = moment(date, 'YYYY-MM-DD').diff(firstDayOfYear, 'days');
        return daysPassed + 1;
    },
    loadCistyOstan: async () => {
        let statement, query, queryRS;
        statement = `SELECT * FROM city__ostan ORDER BY name`;
        query = mysql.format(statement, [0]);
        queryRS = await module.exports.dbQuery_promise(query);
        return queryRS;
    },
    loadJcenterForOstan: async (selectedOstan) => {
        let statement, query, queryRS;
        statement = `SELECT * FROM jcenters__info WHERE (parent_id IS NULL OR parent_id = 0) AND center_mood="main_center"  AND state_id = ?`;
        query = mysql.format(statement, [selectedOstan]);
        queryRS = await module.exports.dbQuery_promise(query);
        if (queryRS.length > 0) {
            return queryRS;
        } else {
            return [{ ID: -1, title: 'بعدا انتخاب می کنم' }];
        }
    },

    //----------------------------------------------------------------------------------
    //----------------------------------------------------------------------------------
    //----------------------------------------------------------------------------------
    //----------------------------------------------------------------------------------

    getSiteStartingClasses: async (classId) => {
        let statement, query, queryRS;
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
        WHERE 
        classes__info.status = 'Active' 
        AND classes__info.end_register_date > CURDATE()
        AND classes__info.start_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 20 DAY) `+ (classId > 0 ? ' AND classes__info.ID=?' : '');
        query = mysql.format(statement, [classId]);
        queryRS = await module.exports.dbQuery_promise(query);
        return queryRS;
    },

    getCitiesWithCenter: async () => {
        let statement, query, queryRS;
        statement = `SELECT DISTINCT city__ostan.ID,city__ostan.name
                FROM jcenters__info
                INNER JOIN city__ostan ON city__ostan.ID =jcenters__info.city_id 
                WHERE jcenters__info.status='Active'`;
        query = mysql.format(statement, []);
        queryRS = await module.exports.dbQuery_promise(query);
        return queryRS;
    },
    getCentersByCity: async (cityId) => {
        let statement, query, queryRS;
        statement = `SELECT
            jcenters__info.ID,
            jcenters__info.title,
            jcenters__info.center_mood,
            jcenters__info.phone,
            jcenters__info.address,
            jcenters__info.web_site,
            jcenters__info.logo,
            jcenters__info.parent_id,
            parent.title AS parent_title
            FROM jcenters__info
            LEFT JOIN jcenters__info AS parent ON jcenters__info.parent_id = parent.ID
            WHERE jcenters__info.status='Active' AND  jcenters__info.city_id=? `;
        query = mysql.format(statement, [cityId]);
        queryRS = await module.exports.dbQuery_promise(query);
        return queryRS;
    },
    getClassesByCenter: async (centerId) => {
        let statement, query, queryRS;
        statement = `SELECT 
        classes__info.*,
        classes__type.title AS type_title,
        jcenters__info.title AS jcenters_title
        FROM classes__info
        INNER JOIN classes__type ON classes__info.type_id = classes__type.ID
        INNER JOIN jcenters__info ON classes__info.jcenters_id = jcenters__info.ID
        WHERE 
        classes__info.status = 'Active'  
        AND jcenters__info.ID = ?  
        AND classes__info.end_register_date > CURDATE();`;
        query = mysql.format(statement, [centerId]);
        queryRS = await module.exports.dbQuery_promise(query);
        return queryRS;
    },
    getMainWorkingGroups: async () => {
        let statement, query, queryRS;
        statement = `SELECT * FROM education__main_group WHERE status='Active' ORDER BY ID DESC`;
        query = mysql.format(statement, []);
        queryRS = await module.exports.dbQuery_promise(query);
        return queryRS;
    },
    getWorkingGroups: async (mainGroupId) => {
        let statement, query, queryRS;
        statement = `SELECT ID,title,image_url
            FROM education__group
            WHERE main_id=?`;
        query = mysql.format(statement, [mainGroupId]);
        queryRS = await module.exports.dbQuery_promise(query);
        return queryRS;
    },
    getClassesByWorkingGroup: async (workingGroupId) => {
        let statement, query, queryRS;
        statement = `SELECT 
        classes__info.*,
        classes__type.title AS type_title,
        jcenters__info.title AS jcenters_title
        FROM classes__info
        INNER JOIN classes__type ON classes__info.type_id = classes__type.ID
        INNER JOIN jcenters__info ON classes__info.jcenters_id = jcenters__info.ID
        WHERE 
        classes__info.status = 'Active'  
        AND classes__info.group_id = ?  
        AND classes__info.end_register_date > CURDATE();`;
        query = mysql.format(statement, [workingGroupId]);
        queryRS = await module.exports.dbQuery_promise(query);
        return queryRS;
    },
    getMainCentersWithDetails: async () => {
        let statement, query, queryRS;
        statement = `
            SELECT 
                jci.ID,
                jci.title,
                jci.center_mood,
                jci.status,
                jci.city_id,
                co.name as city_name,
                (
                    SELECT JSON_ARRAYAGG(
                        JSON_OBJECT(
                            'id', eg.ID,
                            'title', eg.title,
                            'image_url', eg.image_url
                        )
                    )
                    FROM jcenters__eduGroup_relation jgr
                    INNER JOIN education__group eg ON eg.ID = jgr.education_group_id
                    WHERE jgr.jcenter_id = jci.ID
                ) as education_groups,
                (
                    SELECT JSON_ARRAYAGG(
                        JSON_OBJECT(
                            'id', sub.ID,
                            'title', sub.title,
                            'status', sub.status,
                            'image_url', sub.logo
                        )
                    )
                    FROM jcenters__info sub
                    WHERE sub.parent_id = jci.ID AND sub.center_mood = 'center'
                ) as sub_centers
            FROM jcenters__info jci
            LEFT JOIN city__ostan co ON co.ID = jci.city_id
            WHERE jci.center_mood = 'main_center'
            AND jci.status = 'Active'
        `;
        query = mysql.format(statement);
        queryRS = await module.exports.dbQuery_promise(query);
        
        // Process the results to handle NULL values in JSON arrays
        queryRS = queryRS.map(center => ({
            ...center,
            education_groups: center.education_groups ? JSON.parse(center.education_groups) : [],
            sub_centers: center.sub_centers ? JSON.parse(center.sub_centers) : []
        }));
        
        return queryRS;
    },
    getCenterDetails: async (centerId) => {
        let statement, query, queryRS;
        
        // Get basic center info
        statement = `
            SELECT 
                jci.ID,
                jci.title,
                jci.description,
                jci.center_mood,
                jci.status,
                jci.city_id,
                jci.logo,
                jci.phone,
                jci.email,
                jci.web_site,
                jci.address,
                co.name as city_name,
                (
                    SELECT JSON_ARRAYAGG(
                        JSON_OBJECT(
                            'id', eg.ID,
                            'title', eg.title,
                            'image_url', eg.image_url
                        )
                    )
                    FROM jcenters__eduGroup_relation jgr
                    INNER JOIN education__group eg ON eg.ID = jgr.education_group_id
                    WHERE jgr.jcenter_id = jci.ID
                ) as education_groups,
                (
                    SELECT JSON_ARRAYAGG(
                        JSON_OBJECT(
                            'id', sub.ID,
                            'title', sub.title,
                            'status', sub.status,
                            'logo', sub.logo,
                            'education_groups', (
                                SELECT JSON_ARRAYAGG(
                                    JSON_OBJECT(
                                        'id', sub_eg.ID,
                                        'title', sub_eg.title,
                                        'image_url', sub_eg.image_url
                                    )
                                )
                                FROM jcenters__eduGroup_relation sub_jgr
                                INNER JOIN education__group sub_eg ON sub_eg.ID = sub_jgr.education_group_id
                                WHERE sub_jgr.jcenter_id = sub.ID
                            )
                        )
                    )
                    FROM jcenters__info sub
                    WHERE sub.parent_id = jci.ID AND sub.center_mood = 'center'
                ) as sub_centers,
                (
                    SELECT JSON_ARRAYAGG(
                        JSON_OBJECT(
                            'id', dep.ID,
                            'title', dep.title,
                            'education_groups', (
                                SELECT JSON_ARRAYAGG(
                                    JSON_OBJECT(
                                        'id', eg.ID,
                                        'title', eg.title,
                                        'image_url', eg.image_url
                                    )
                                )
                                FROM jcenters__eduGroup_relation jgr
                                INNER JOIN education__group eg ON eg.ID = jgr.education_group_id
                                WHERE jgr.jcenter_id = jci.ID AND jgr.department_id = dep.ID
                            )
                        )
                    )
                    FROM jcenters__department_relation jdr
                    INNER JOIN education__department dep ON dep.ID = jdr.department_id
                    WHERE jdr.jcenter_id = jci.ID
                ) as departments,
                (
                    SELECT JSON_ARRAYAGG(
                        JSON_OBJECT(
                            'id', ci.ID,
                            'title', ci.title,
                            'image_url', ci.image_url,
                            'delivery_text', ci.delivery_text,
                            'price', ci.price,
                            'start_date', ci.start_date,
                            'end_register_date', ci.end_register_date,
                            'type_title', ct.title,
                            'teacher_name', CONCAT(ti.f_name, ' ', ti.l_name)
                        )
                    )
                    FROM classes__info ci
                    INNER JOIN classes__type ct ON ct.ID = ci.type_id
                    LEFT JOIN teachers__info ti ON ti.ID = ci.teacher_id
                    WHERE ci.jcenters_id = jci.ID 
                    AND ci.status = 'Active'
                    AND ci.end_register_date > CURDATE()
                    AND ci.start_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 20 DAY)
                ) as upcoming_classes
            FROM jcenters__info jci
            LEFT JOIN city__ostan co ON co.ID = jci.city_id
            WHERE jci.ID = ? AND jci.status = 'Active'
        `;
        
        query = mysql.format(statement, [centerId]);
        queryRS = await module.exports.dbQuery_promise(query);
        
        if (queryRS.length > 0) {
            // Process the results to handle NULL values in JSON arrays
            const center = queryRS[0];
            return {
                ...center,
                education_groups: center.education_groups ? (typeof center.education_groups === 'string' ? JSON.parse(center.education_groups) : center.education_groups) : [],
                sub_centers: center.sub_centers ? (typeof center.sub_centers === 'string' ? JSON.parse(center.sub_centers).map(sub => ({
                    ...sub,
                    education_groups: sub.education_groups ? (typeof sub.education_groups === 'string' ? JSON.parse(sub.education_groups) : sub.education_groups) : []
                })) : center.sub_centers) : [],
                departments: center.departments ? (typeof center.departments === 'string' ? JSON.parse(center.departments).map(dep => ({
                    ...dep,
                    education_groups: dep.education_groups ? (typeof dep.education_groups === 'string' ? JSON.parse(dep.education_groups) : dep.education_groups) : []
                })) : center.departments) : [],
                upcoming_classes: center.upcoming_classes ? (typeof center.upcoming_classes === 'string' ? JSON.parse(center.upcoming_classes) : center.upcoming_classes) : []
            };
        }
        
        return null;
    }
}