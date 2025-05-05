const { dbCon, mysql } = require('./config/dbConnection');

async function checkTableStructure() {
    try {
        // بررسی ساختار جدول classes__info
        const classesQuery = "DESCRIBE classes__info";
        const classesResult = await new Promise((resolve, reject) => {
            dbCon.query(classesQuery, (err, result) => {
                if (err) reject(err);
                else resolve(result);
            });
        });
        console.log("Structure of 'classes__info' table:");
        console.log(classesResult);

    } catch (error) {
        console.error("Error:", error);
    } finally {
        dbCon.end();
    }
}

checkTableStructure(); 