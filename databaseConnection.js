const mysql = require("mysql");

let con = mysql.createConnection({  
    host: "sql109.infinityfree.com",  
    user: "if0_35809533",  
    password: "HvqStAsFCbnH",  
    database: "if0_35809533_c2e"  
    }); 


con.connect((err) => {
        if (err) {
          console.log("Database Connection Failed !", err);
        } else {
          console.log("connected to Database");
        }
});


module.exports = con;
