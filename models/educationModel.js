const { parse } = require("dotenv");
const { dbCon, mysql } = require("../config/dbConnection");
const { v4: uuidv4 } = require('uuid');
const tools = require("../utils/tools");

const bcrypt = require("bcrypt");
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

    getLessonTeacherData: async (classId) => {
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
    deleteLesson: async (lessonId) => {
        let statement, query, queryRS;
        // statement = `DELETE FROM lesson__info WHERE ID=?`;
        statement = `UPDATE lesson__info SET status='Deleted' WHERE ID=?`;
        query = mysql.format(statement, [lessonId]);
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
    getJobType: async () => {
        let statement, query, queryRS;
        statement = `SELECT * FROM job__type`;
        query = mysql.format(statement, [0]);
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

    loadTeacher: async () => {
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
            INNER JOIN jcenters__info ON teachers__info.jcenters_id = jcenters__info.ID
        `;
        query = mysql.format(statement, [0]);
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
    loadClassEducationGroup: async (jCenterId) => {
        let statement, query, queryRS;
        statement = `SELECT education__group.* FROM education__group
INNER JOIN jcenters__eduGroup_relation ON 
jcenters__eduGroup_relation.education_group_id = education__group.ID
WHERE jcenters__eduGroup_relation.jcenter_id =?`;
        query = mysql.format(statement, [jCenterId]);
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
        let statement, query, queryRS, userRs;
        let newUser = false;
        if (queryBody.ID) {
            statement = `UPDATE teachers__info SET f_name=?, l_name=?, father_name=?, gender=?, national_code=?, mobile=?, mobile2=?, email=?, image_url=?, place_of_birth=?, birthday=?, is_foreigner=?, job_id=?, degree_id=?, biography=?, user_name=?, password=?, postal_address=?, insurance_code=?, sheba=?, bank_acount=?,department_id=?,editor_user_id=?,jcenters_id=? WHERE ID=?`;
        } else {
            statement = `INSERT INTO teachers__info(f_name, l_name, father_name, gender, national_code, mobile, mobile2, email, image_url, place_of_birth, birthday, is_foreigner, job_id, degree_id, biography, user_name, password, postal_address, insurance_code, sheba, bank_acount,department_id,creator_user_id,jcenters_id) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`;
            newUser = true;
        }
        query = mysql.format(statement, [queryBody.f_name, queryBody.l_name, queryBody.father_name, queryBody.gender, queryBody.national_code, queryBody.mobile, queryBody.mobile2, queryBody.email, queryBody.image_url, queryBody.place_of_birth, queryBody.birthday, queryBody.is_foreigner, queryBody.job_id, queryBody.degree_id, queryBody.biography, queryBody.user_name, queryBody.password, queryBody.postal_address, queryBody.insurance_code, queryBody.sheba, queryBody.bank_acount, queryBody.department_id, userID, queryBody.jcenters_id, queryBody.ID]);
        queryRS = await module.exports.dbQuery_promise(query);
        if (newUser && queryRS.insertId) {
            let teacherId = queryRS.insertId
            let hashedPassword = await bcrypt.hash(queryBody.password, 10);
            let sqlInsert = "INSERT INTO user__info(code,fname,lname,mobile,password) VALUES (?,?,?,?,?)";
            let insert_query = mysql.format(sqlInsert, ['T' + teacherId, queryBody.f_name, queryBody.l_name, queryBody.mobile, hashedPassword]);
            userRs = await module.exports.dbQuery_promise(insert_query);
        } else {
            let hashedPassword = await bcrypt.hash(queryBody.password, 10);
            let sqlInsert = "UPDATE user__info SET fname=?,lname=?,mobile=?,password=? WHERE code=?";
            let insert_query = mysql.format(sqlInsert, [queryBody.f_name, queryBody.l_name, queryBody.mobile, hashedPassword, 'T' + queryBody.ID]);
            userRs = await module.exports.dbQuery_promise(insert_query);
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
        query = mysql.format(statement, [classId , teacherId]);
        console.log(query);
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
        classes__delivery_type.title AS delivery_title,
        classes__type.title AS type_title,
        education__department.title AS department_title,
        education__group.title AS group_title,
        lesson__info.title AS lesson_title,
        jcenters__info.title AS jcenters_title,
        certificate__info.title AS certificate_title,
        certificate__structure.title AS structure_title
        FROM classes__info
        INNER JOIN classes__type ON classes__info.type_id = classes__type.ID
        INNER JOIN classes__delivery_type ON classes__info.delivery_id = classes__delivery_type.ID
        INNER JOIN education__department ON classes__info.department_id = education__department.ID
        INNER JOIN education__group ON classes__info.group_id = education__group.ID
        INNER JOIN jcenters__info ON classes__info.jcenters_id = jcenters__info.ID
        LEFT JOIN certificate__info ON classes__info.certificate_id = certificate__info.ID
        LEFT JOIN certificate__structure ON classes__info.certificate_structure_id = certificate__structure.ID
        INNER JOIN lesson__info ON classes__info.lesson_id = lesson__info.ID` +
            (jcenterId > 0 ? ` WHERE classes__info.jcenters_id=?` : ``);

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
    addClassInfoToDb: async (queryBody, userID) => {

        queryBody.start_date = module.exports.formatDateTime(queryBody.start_date, 'Date');
        queryBody.end_date = module.exports.formatDateTime(queryBody.end_date, 'Date');
        queryBody.end_register_date = module.exports.formatDateTime(queryBody.end_register_date, 'Date');
        queryBody.end_date_time = module.exports.formatDateTime(queryBody.end_date_time, 'Time');
        queryBody.end_cancel_date = module.exports.formatDateTime(queryBody.end_cancel_date, 'Date');
        queryBody.end_cancel_time = module.exports.formatDateTime(queryBody.end_cancel_time, 'Time');

        let statement, query, queryRS, userRs;
        if (queryBody.ID) {
            statement = `UPDATE classes__info SET jcenters_id=?,department_id=?, group_id=?, lesson_id=?, type_id=?, delivery_id=?, title=?, description=?, headlines=?, expense=?, cancellation_penalty=?, capacity=?, approved_time=?, class_sessions_number=?, absent_allow=?, gender=?, image_url=?, image_alt_text=?, start_date=?, end_date=?, end_register_date=?, end_date_time=?, end_cancel_date=?, end_cancel_time=?,status=?,certificate_id=?,certificate_structure_id=?,department_signature_need=?,absence_conditions=?,debt_free_condition=?,average_condition=?,obtaining_condition=?,end_class_condition=?,delivery_possibility=?,delivery_price=?,physical_certificate_fee=?,editor_user_id=? WHERE ID=?`;
        } else {
            statement = `INSERT INTO classes__info(jcenters_id,department_id, group_id, lesson_id, type_id, delivery_id, title, description, headlines, expense, cancellation_penalty, capacity, approved_time, class_sessions_number, absent_allow, gender, image_url, image_alt_text, start_date, end_date, end_register_date, end_date_time, end_cancel_date, end_cancel_time,status,certificate_id,certificate_structure_id,department_signature_need,absence_conditions,debt_free_condition,average_condition,obtaining_condition,end_class_condition,delivery_possibility,delivery_price,physical_certificate_fee,creator_user_id) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`;
        }

        query = mysql.format(statement, [queryBody.jcenters_id, queryBody.department_id, queryBody.group_id, queryBody.lesson_id, queryBody.type_id, queryBody.delivery_id, queryBody.title, queryBody.description, queryBody.headlines, queryBody.expense, queryBody.cancellation_penalty, queryBody.capacity, queryBody.approved_time, queryBody.class_sessions_number, queryBody.absent_allow, queryBody.gender, queryBody.image_url, queryBody.image_alt_text, queryBody.start_date, queryBody.end_date, queryBody.end_register_date, queryBody.end_date_time, queryBody.end_cancel_date, queryBody.end_cancel_time, queryBody.status, queryBody.certificate_id, queryBody.certificate_structure_id, queryBody.department_signature_need, queryBody.absence_conditions, queryBody.debt_free_condition, queryBody.average_condition, queryBody.obtaining_condition, queryBody.end_class_condition, queryBody.delivery_possibility, queryBody.delivery_price, queryBody.physical_certificate_fee, userID, queryBody.ID]);
        queryRS = await module.exports.dbQuery_promise(query);
        return queryRS;
    },
    deleteClass: async (classId) => {
        let statement, query, queryRS;
        statement = `DELETE FROM classes__info WHERE ID=?`;
        query = mysql.format(statement, [classId]);
        queryRS = await module.exports.dbQuery_promise(query);
        return queryRS;
    },
    getmemberInfo: async (userID) => {
        let statement, query, queryRS;
        statement = `SELECT member__info.*, 
        teachers__degree.title AS degree_title , 
        teachers__job.title AS job_title,
        jcenters__info.title AS jcenters_title
        FROM member__info 
        INNER JOIN teachers__degree ON member__info.degree_id = teachers__degree.ID
        INNER JOIN teachers__job ON member__info.job_id = teachers__job.ID
        INNER JOIN jcenters__info ON member__info.jcenters_id = jcenters__info.ID
        WHERE member__info.user_id=?`;
        query = mysql.format(statement, [userID]);
        queryRS = await module.exports.dbQuery_promise(query);
        return queryRS;
    },
    submitMemberInfoToDb: async (queryBody, userID) => {
        let statement, query, queryRS, userRs;
        statement = `UPDATE member__info SET f_name=?, l_name=?, father_name=?, gender=?, national_code=?, mobile=?, mobile2=?, email=?, image_url=?, place_of_birth=?, birthday=?, is_foreigner=?, job_id=?, degree_id=?,postal_address=?, sheba=?, bank_acount=?,editor_user_id=?,jcenters_id=?,biography=? WHERE ID=?`;
        query = mysql.format(statement, [queryBody.f_name, queryBody.l_name, queryBody.father_name, queryBody.gender, queryBody.national_code, queryBody.mobile, queryBody.mobile2, queryBody.email, queryBody.image_url, queryBody.place_of_birth, queryBody.birthday, queryBody.is_foreigner, queryBody.job_id, queryBody.degree_id, queryBody.postal_address, queryBody.sheba, queryBody.bank_acount, userID, queryBody.jcenters_id, queryBody.biography, queryBody.ID]);
        console.log(query);
        queryRS = await module.exports.dbQuery_promise(query);
        statement = `UPDATE user__info SET jcenter_id=? WHERE ID=?`;
        query = mysql.format(statement, [queryBody.jcenters_id, queryBody.user_id]);
        queryRS = await module.exports.dbQuery_promise(query);
        return queryRS;
    },
    loadClassListForMember: async (listMood, userID) => {
        let idList = [1, 2];
        if (listMood === 'Active') {
            idList = [1, 2];
        } else if (listMood === 'Active') {
            idList = [1, 2, 3, 6];
        } else if (listMood === 'Suggestion') {
            idList = [1, 2, 3, 5];
        }
        statement = `
            SELECT 
            classes__info.*,
            classes__delivery_type.title AS delivery_title,
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
            INNER JOIN classes__delivery_type ON classes__info.delivery_id = classes__delivery_type.ID
            INNER JOIN education__department ON classes__info.department_id = education__department.ID
            INNER JOIN education__group ON classes__info.group_id = education__group.ID
            INNER JOIN jcenters__info ON classes__info.jcenters_id = jcenters__info.ID
            INNER JOIN certificate__info ON classes__info.certificate_id = certificate__info.ID
            INNER JOIN certificate__structure ON classes__info.certificate_structure_id = certificate__structure.ID
            INNER JOIN lesson__info ON classes__info.lesson_id = lesson__info.ID
            LEFT JOIN teachers__info ON classes__info.teacher_id = teachers__info.ID
            WHERE classes__info.ID IN(?)
        `;
        query = mysql.format(statement, [idList]);
        queryRS = await module.exports.dbQuery_promise(query);
        return queryRS;
    },
    addClassToUserCart: async (userId, classId, price) => {
        let statement, query, queryRS;
        statement = `INSERT INTO user__cart(user_id, class_id, price) VALUES (?,?,?)`;
        query = mysql.format(statement, [userId, classId, price]);
        queryRS = await module.exports.dbQuery_promise(query);
        if (queryRS.insertId > 0) {
            return 1;
        } else {
            return -1;
        }
    },
    loadUserCart: async (userId) => {
        let statement, query, queryRS;
        statement = `SELECT 
        user__cart.*,
        classes__info.*,
        0 AS discount_code
        FROM user__cart 
        INNER JOIN classes__info ON user__cart.class_id = classes__info.ID
        WHERE 
        user__cart.user_id = ?`;
        query = mysql.format(statement, [userId]);
        queryRS = await module.exports.dbQuery_promise(query);
        return queryRS;
    },
    removeFromCart: async (userId, classId) => {
        let statement, query, queryRS;
        statement = `DELETE FROM user__cart WHERE user_id=? AND class_id=?`;
        query = mysql.format(statement, [userId, classId]);
        queryRS = await module.exports.dbQuery_promise(query);
        return queryRS;
    },
}