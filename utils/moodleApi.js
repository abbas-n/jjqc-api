const request = require('request');
const { dbCon, mysql } = require("../config/dbConnection");
const dotenv = require("dotenv").config();


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
    post_request_formData: async (url, headers = '', formData) => {
        var options = {
            'method': 'POST',
            'url': url,
            'headers': headers,
            formData: formData

        };
        var rs = await new Promise((resolve, reject) => {
            request(options, function (error, response) {
                if (error) throw new Error(error);
                resolve(response.body);
            });
        });
        return rs;
    },
    manageEduGroup_category: async (moodleCategoryId, title, eduGroupId, description, mood) => {
        const token = process.env.moodelToken;
        const moodleUrl = process.env.moodleUrl;
        let formData;
        if (mood === 0) {
            formData = {
                'wstoken': token,
                'wsfunction': 'core_course_create_categories',
                'moodlewsrestformat': 'json',
                'categories[0][name]': title,
                'categories[0][idnumber]': String(eduGroupId),
                'categories[0][parent]': '0',
                'categories[0][description]': (description ? description : ''),
            };

        } else if (mood === 1) {
            formData = {
                'wstoken': token,
                'wsfunction': 'core_course_update_categories',
                'moodlewsrestformat': 'json',
                'categories[0][id]': moodleCategoryId,
                'categories[0][name]': title,
                'categories[0][idnumber]': String(eduGroupId),
                'categories[0][parent]': '0',
                'categories[0][description]': (description ? description : ''),
            };

        }

        try {
            let response = await module.exports.post_request_formData(moodleUrl, { 'Content-Type': 'application/x-www-form-urlencoded' }, formData);
            response = JSON.parse(response);
            if (mood == 0) {
                let statement, query, queryRS;
                statement = `UPDATE education__group SET moodle_category_id=? WHERE ID=?`;
                query = mysql.format(statement, [response[0]['id'], eduGroupId]);
                queryRS = await module.exports.dbQuery_promise(query);
            }
        } catch (error) {
            console.error(error);
        }
    },
    createSubcategory: async (parentCategoryId, title, lessonEduGroupRelId, description) => {
        const token = process.env.moodelToken;
        const moodleUrl = process.env.moodleUrl;
        let formData = {
            'wstoken': token,
            'wsfunction': 'core_course_create_categories',
            'moodlewsrestformat': 'json',
            'categories[0][name]': title,
            'categories[0][parent]': parentCategoryId,
            'categories[0][idnumber]': String('lesson-group-' + lessonEduGroupRelId),
            'categories[0][description]': (description ? description : ''),
        };

        try {
            let response = await module.exports.post_request_formData(moodleUrl, { 'Content-Type': 'application/x-www-form-urlencoded' }, formData);
            response = JSON.parse(response);
            if (response[0]['id'] > 0) {
                let statement, query, queryRS;
                statement = `UPDATE lesson__eduGroup_relation SET moodle_subcategory_id=? WHERE ID=?`;
                query = mysql.format(statement, [response[0]['id'], lessonEduGroupRelId]);
                queryRS = await module.exports.dbQuery_promise(query);
            }
        } catch (error) {
            console.error(error);
        }
    },

    updateSubcategory: async (lessonId) => {
        const token = process.env.moodelToken;
        const moodleUrl = process.env.moodleUrl;
        let statement = `SELECT lesson__eduGroup_relation.moodle_subcategory_id,
            lesson__eduGroup_relation.status,
            lesson__info.title,
            lesson__info.description
            FROM lesson__eduGroup_relation
            INNER JOIN lesson__info ON lesson__info.ID = lesson__eduGroup_relation.lesson_id
            WHERE lesson__eduGroup_relation.lesson_id=?`;
        let query = mysql.format(statement, [lessonId]);
        let queryRS = await module.exports.dbQuery_promise(query);
        if (queryRS.length > 0) {
            let formData = {
                'wstoken': token,
                'wsfunction': 'core_course_update_categories',
                'moodlewsrestformat': 'json',
                'categories[0][id]': queryRS[0]['moodle_subcategory_id'],
                'categories[0][name]': queryRS[0]['title'],
                'categories[0][description]': (queryRS[0]['description'] ? queryRS[0]['description'] : ''),
            };
            try {
                let response = await module.exports.post_request_formData(moodleUrl, { 'Content-Type': 'application/x-www-form-urlencoded' }, formData);
                response = JSON.parse(response);
                console.log(response);
                if (response[0]['id'] > 0) {
                    let statement, query, queryRS;
                    statement = `UPDATE lesson__eduGroup_relation SET moodle_subcategory_id=? WHERE ID=?`;
                    query = mysql.format(statement, [response[0]['id'], lessonEduGroupRelId]);
                    queryRS = await module.exports.dbQuery_promise(query);
                }
            } catch (error) {
                console.error(error);
            }
        }
    },

    createCourse: async (classId, title, description, subcategoryId) => {
        const token = process.env.moodelToken;
        const moodleUrl = process.env.moodleUrl;
        let formData = {
            'wstoken': token,
            'wsfunction': 'core_course_create_courses',
            'moodlewsrestformat': 'json',
            'courses[0][fullname]': title,
            'courses[0][shortname]': 'course-' + classId + '-' + subcategoryId,
            'courses[0][categoryid]': subcategoryId,
            'courses[0][idnumber]': String(classId),
            'courses[0][summary]': description,
            'courses[0][format]': "weeks",
            'courses[0][visible]': 1,
        };
        console.log(formData);
        try {
            let response = await module.exports.post_request_formData(moodleUrl, { 'Content-Type': 'application/x-www-form-urlencoded' }, formData);
            response = JSON.parse(response);
            console.log(response);
            if (response[0]['id'] > 0) {
                let statement, query, queryRS;
                statement = `UPDATE classes__info SET moodle_course_id=? WHERE ID=?`;
                query = mysql.format(statement, [response[0]['id'], classId]);
                queryRS = await module.exports.dbQuery_promise(query);
            }
            return response;
        } catch (error) {
            console.error(error);
        }
    },
    updateCourse: async (classId, title, description, status, subcategoryId, moodleCourseId) => {
        const token = process.env.moodelToken;
        const moodleUrl = process.env.moodleUrl;
        let formData = {
            'wstoken': token,
            'wsfunction': 'core_course_update_courses',
            'moodlewsrestformat': 'json',
            'courses[0][id]': moodleCourseId,
            'courses[0][fullname]': title,
            'courses[0][shortname]': 'course-' + classId + '-' + subcategoryId,
            'courses[0][categoryid]': subcategoryId,
            'courses[0][summary]': description,
            'courses[0][format]': "weeks",
            'courses[0][visible]': (status === 'Active' ? 1 : 0),
        };
        console.log(formData); 
        try {
            let response = await module.exports.post_request_formData(moodleUrl, { 'Content-Type': 'application/x-www-form-urlencoded' }, formData);
            response = JSON.parse(response);
            console.log(response);
            // if (response[0]['id'] > 0) {
            //     let statement, query, queryRS;
            //     statement = `UPDATE classes__info SET moodle_course_id=? WHERE ID=?`;
            //     query = mysql.format(statement, [response[0]['id'], classId]);
            //     queryRS = await module.exports.dbQuery_promise(query);
            // }
            return response;
        } catch (error) {
            console.error(error);
        }
    },
    duplicateCourse: async (lessonEduRelId, moodleCourseId, title, shortTitle, categoryId) => {
        const token = process.env.moodelToken;
        const moodleUrl = process.env.moodleUrl;
        let formData = {
            'wstoken': token,
            'wsfunction': 'core_course_duplicate_course',
            'moodlewsrestformat': 'json',
            'fullname': title,
            'shortname': shortTitle + '-' + title,
            'categoryid': categoryId,
            'courseid': moodleCourseId,
        };

        try {
            let response = await module.exports.post_request_formData(moodleUrl, { 'Content-Type': 'application/x-www-form-urlencoded' }, formData);
            response = JSON.parse(response);
            if (response['id'] > 0) {
                let statement, query, queryRS;
                statement = `UPDATE lesson__eduGroup_relation SET moodle_course_id=? WHERE ID=?`;
                query = mysql.format(statement, [response['id'], lessonEduRelId]);
                queryRS = await module.exports.dbQuery_promise(query);
            }
            return response;
        } catch (error) {
            console.error(error);
        }
    },

    createUser: async (userId, userMobile, firstname, lastname, email) => {
        const token = process.env.moodelToken;
        const moodleUrl = process.env.moodleUrl;
        let formData = {
            'wstoken': token,
            'wsfunction': 'core_user_create_users',
            'moodlewsrestformat': 'json',
            'users[0][idnumber]': userId,
            'users[0][username]': userMobile,
            'users[0][password]': userMobile,
            'users[0][firstname]': firstname,
            'users[0][lastname]': lastname,
            'users[0][email]': email,
            'users[0][lang]': 'fa',
            'users[0][timezone]': 'Asia/Tehran',
        };

        try {
            let response = await module.exports.post_request_formData(moodleUrl, { 'Content-Type': 'application/x-www-form-urlencoded' }, formData);
            response = JSON.parse(response);
            console.log(response);
            if (response[0]['id'] > 0) {
                let statement, query, queryRS;
                statement = `UPDATE user__info SET moodle_user_id=? WHERE ID=?`;
                query = mysql.format(statement, [response[0]['id'], userId]);
                queryRS = await module.exports.dbQuery_promise(query);
            }
            return response;
        } catch (error) {
            console.error(error);
        }
    },

    enrollUserInCourse: async (userId, courseId) => {
        const token = process.env.moodelToken;
        const moodleUrl = process.env.moodleUrl;
        let formData = {
            'wstoken': token,
            'wsfunction': 'enrol_manual_enrol_users',
            'moodlewsrestformat': 'json',
            'enrolments[0][userid]': userId,
            'enrolments[0][roleid]': 5,
            'enrolments[0][courseid]': courseId,
        };

        try {
            let response = await module.exports.post_request_formData(moodleUrl, { 'Content-Type': 'application/x-www-form-urlencoded' }, formData);
            response = JSON.parse(response);
            console.log(response);
            // if (response[0]['id'] > 0) {
            //     let statement, query, queryRS;
            //     statement = `UPDATE user__info SET moodle_user_id=? WHERE ID=?`;
            //     query = mysql.format(statement, [response[0]['id'], userId]);
            //     queryRS = await module.exports.dbQuery_promise(query);
            // }
            return response;
        } catch (error) {
            console.error(error);
        }
    },
    unenrollUserInCourse: async (userId, courseId) => {
        const token = process.env.moodelToken;
        const moodleUrl = process.env.moodleUrl;
        let formData = {
            'wstoken': token,
            'wsfunction': 'enrol_manual_unenrol_users',
            'moodlewsrestformat': 'json',
            'enrolments[0][userid]': userId,
            'enrolments[0][roleid]': 5,
            'enrolments[0][courseid]': courseId,
        };

        try {
            let response = await module.exports.post_request_formData(moodleUrl, { 'Content-Type': 'application/x-www-form-urlencoded' }, formData);
            response = JSON.parse(response);
            console.log(response);
            // if (response[0]['id'] > 0) {
            //     let statement, query, queryRS;
            //     statement = `UPDATE user__info SET moodle_user_id=? WHERE ID=?`;
            //     query = mysql.format(statement, [response[0]['id'], userId]);
            //     queryRS = await module.exports.dbQuery_promise(query);
            // }
            return response;
        } catch (error) {
            console.error(error);
        }
    },
}