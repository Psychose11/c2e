const mysql = require("mysql");

let con = mysql.createConnection({  
    host: "fdb1034.awardspace.net",  
    user: "4429444_c2e",  
    password: "psychose19",  
    database: "4429444_c2e"  
    }); 


con.connect((err) => {
        if (err) {
          console.log("Database Connection Failed !", err);
        } else {
          console.log("connected to Database");
        }
});


module.exports = con;
