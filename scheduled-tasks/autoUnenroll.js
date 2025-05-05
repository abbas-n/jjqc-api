const { dbCon, mysql } = require("../config/dbConnection");
const moodleApi = require("../utils/moodleApi");
const dotenv = require("dotenv").config();

async function checkAndUnenrollEndingClasses() {
    try {
        // Get today's date in YYYY-MM-DD format
        const today = new Date().toISOString().split('T')[0];
        
        // First: Find students in offline classes (delivery_id = 3) to unenroll from Moodle
        const unenrollQuery = `
            SELECT DISTINCT
                ci.ID as class_id, 
                ci.moodle_course_id, 
                ui.moodle_user_id
            FROM classes__info ci
            JOIN classes__delivery_relation cdr ON ci.ID = cdr.classe_id
            JOIN classes__user_relation cur ON ci.ID = cur.class_id
            JOIN user__info ui ON cur.user_id = ui.ID
            WHERE ci.end_date < ?
            AND ci.status = 'Active'
            AND cdr.delivery_id = 3
            AND ci.moodle_course_id IS NOT NULL
            AND ui.moodle_user_id IS NOT NULL
        `;
        
        const formattedUnenrollQuery = mysql.format(unenrollQuery, [today]);
        // console.log('Unenroll Query:', formattedUnenrollQuery);
        const studentsToUnenroll = await moodleApi.dbQuery_promise(formattedUnenrollQuery);
        
        if (studentsToUnenroll.length > 0) {
            console.log(`Found ${studentsToUnenroll.length} students to unenroll from ended offline classes.`);
            
            // Process each student unenrollment
            for (const result of studentsToUnenroll) {
                try {
                    await moodleApi.unenrollUserInCourse(result.moodle_user_id, result.moodle_course_id);
                    console.log(`Successfully unenrolled user ${result.moodle_user_id} from course ${result.moodle_course_id}`);
                } catch (error) {
                    console.error(`Error unenrolling user ${result.moodle_user_id} from course ${result.moodle_course_id}:`, error);
                }
            }
        } else {
            console.log(`No students to unenroll from ended offline classes.`);
        }

        // Second: Find all active classes that ended before today to archive them
        const archiveQuery = `
            SELECT DISTINCT ci.ID as class_id
            FROM classes__info ci
            WHERE ci.end_date < ?
            AND ci.status = 'Active'
        `;
        
        const formattedArchiveQuery = mysql.format(archiveQuery, [today]);
        // console.log('Archive Query:', formattedArchiveQuery);
        const classesToArchive = await moodleApi.dbQuery_promise(formattedArchiveQuery);
        
        if (classesToArchive.length > 0) {
            // Archive the classes
            const classIds = classesToArchive.map(c => c.class_id);
            const updateArchiveQuery = `
                UPDATE classes__info 
                SET status = 'Archive' 
                WHERE ID IN (?)
            `;
            
            const formattedUpdateArchiveQuery = mysql.format(updateArchiveQuery, [classIds]);
            await moodleApi.dbQuery_promise(formattedUpdateArchiveQuery);
            console.log(`Successfully archived ${classIds.length} classes`);
        } else {
            console.log(`No active classes that ended before today (${today}) need to be archived.`);
        }
        
    } catch (error) {
        console.error('Error in checkAndUnenrollEndingClasses:', error);
    }
}

// Run the function immediately when the script is executed
checkAndUnenrollEndingClasses();

// Export the function for potential use in other files
module.exports = { checkAndUnenrollEndingClasses }; 