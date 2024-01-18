const mysql = require("mysql");

let con = mysql.createConnection({  
    host: "sql11.freemysqlhosting.net",  
    user: "sql11677722",  
    password: "RaQLGG6nWI",  
    database: "sql11677722"  
    }); 


con.connect((err) => {
        if (err) {
          console.log("Database Connection Failed !", err);
        } else {
          console.log("connected to Database");
        }
});


module.exports = con;
