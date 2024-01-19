const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const jwt = require('jsonwebtoken');

const decrypt = require('./decryptToken.js');
const key = require('./tokenKey.js');
const con = require('./databaseConnection.js');
const currrentDateAndHour = require('./currentDate.js');

const { token } = require('morgan');
const fs = require('fs');
const http = require('http');
const { ifError } = require('assert');

const privateKey = fs.readFileSync('server.key', 'utf8');
const certificate = fs.readFileSync('server.cert', 'utf8');
const credentials = { key: privateKey, cert: certificate };




const app = express();
const port = 3000;
const httpsServer = http.createServer(app);



let uploadedFileName = '';
let uploadedFileNameForFiles= '';
let uploadedEventsFiles = '';

app.use(bodyParser.json());
app.use('/uploads', express.static('uploads'));
app.use('/uploadedFiles', express.static('uploadedFiles'));
app.use('/uploadedEvents', express.static('uploadedEvents'));

//picture get on sign up screen
const configureMulter = () => {
  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'uploads');
    },
    filename: function (req, file, cb) {
      uploadedFileName = Date.now() + '-' + file.originalname;
      cb(null, uploadedFileName);
    },
  });

  return multer({ storage: storage });
};
const configureMulterForFile = () => {
  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'uploadedFiles');
    },
    filename: function (req, file, cb) {
      uploadedFileNameForFiles = Date.now() + '-' + file.originalname;
      cb(null, uploadedFileNameForFiles);
    },
  });

  return multer({ storage: storage });
};
const conofigureMulterForEvent = () =>{
  const storage = multer.diskStorage({
    destination: function (req,file,cb){
      cb(null,'uploadedEvents');
      
    },
    filename : function (req,file,cb){
      uploadedEventsFiles = Date.now() + '-' + file.originalname;
      cb(null,uploadedEventsFiles);
      },
  })
  return multer({ storage: storage });
};

var middlewareDecryptToken = async function (req, res, next) {
  // get the token send in headers in frontend
  const authHeader = req.headers['authorization'];
  if (authHeader) {
    const token = authHeader.split(' ')[1]; // separe the token in the text and dlete unsused text 'Barrier' 
    //decrypt the token
    decrypt(req, res, token);
    next();
    // console.log(req.userId);
  } else {
    res.status(401).json({ message: 'Error' });
  }

};

const upload = configureMulter();
const uploadFile = configureMulterForFile();
const uploadEvents = conofigureMulterForEvent();

app.post('/get-picture', upload.single('image'), (req, res) => {
 if (!req.file) {
    return res.status(400).send('Aucun fichier n\'a été envoyé.');
  }
  res.status(200).send({
    message: 'Image reçue avec succès.',
    filename: uploadedFileName,
  });
});

app.post('/get-file',uploadFile.single('file'),middlewareDecryptToken,(req,res) =>{

let insertFileOnProfile = () =>{
  let insertFileQuery = `UPDATE profil
  SET fichierUpload = ?
  WHERE id = ?;`;

  let id = req.userId;
  let file = uploadedFileNameForFiles;

  con.query(insertFileQuery, [file, id], (err, rows) => {
      if (err) {
        console.log(err);
      }
      else {
       
      }
    });

}

  if (!req.file) {
    return res.status(400).send('Aucun fichier n\'a été envoyé.');
  }
  res.status(200).send({
    message: 'Fichier reçue avec succès.',
    filename: uploadedFileNameForFiles,
  });
  
  insertFileOnProfile();
});
app.post('/get-event',uploadEvents.single('image'),(req,res) => {
  if (!req.file) {
    return res.status(400).send('Aucun fichier n\'a été envoyé.');
  }
  res.status(200).send({
    message: 'Image reçue avec succès.',
    filename: uploadedEventsFiles,
  });

});

//sign up data
app.post('/get-data', (req, res) => {
  const data = req.body;

  let singleRowInsert = () => {

    let query = `INSERT INTO utilisateur 
          (nomUtilisateur, motDePasse,mail,telephone,nom,niveau,matricule,adresse,parcours,fichierUpload,payement) VALUES (?,?,?,?,?,?,?,?,?,?,?);`;
    
    let username = data.username;
    let password = data.password;

    let email = data.email;
    let phoneNumber = data.phoneNumber;

    let nameOrOther = data.nameOrOther;
    let niveau = data.dropdownvalue;
    let matricule = data.matricule;
    let adresse = data.localAdress;
    let parcours = data.dropdownvalue2;

    let payement = "impayé";

   
    con.query(query, [username,
      password, email, phoneNumber, nameOrOther,niveau,matricule,adresse,parcours,uploadedFileName,payement], (err, rows) => {
        if (err) {
          console.log(err);
        }
        else {
      

        }
      });
  };

  let verifyUser = (data) => {
    return new Promise((resolve, reject) => {
      let query = `SELECT * FROM utilisateur WHERE (nomUtilisateur = ? or telephone = ? or mail = ?)`;
      let username = data.username;
      let phoneNumber = data.phoneNumber;
      let email = data.email;

      con.query(query, [username, phoneNumber, email], (err, results) => {
        if (err) {
          reject(err);
        } else {
          if (results.length > 0) {
            resolve(true);
          } else {
            resolve(false);
          }
        }
      });
    });
  };

  verifyUser(data)
    .then((userExists) => {
      if (!userExists) {
         singleRowInsert();
        // insertProfil();
        console.log("not exists");
        res.sendStatus(200);
      } else {
        uploadedFileName = '';
        res.sendStatus(409);
      }
    })
    .catch((err) => {
      console.log(err);
      res.sendStatus(500);
    });
});

//generate the token
function generateAuthToken(userId) {
  const token = jwt.sign({ userId }, key(), { expiresIn: '1h' });
  return token;
}

//get username and password
app.post('/get-login', (req, res) => {
  const login = req.body;

  let verifyUser = (login) => {
    return new Promise((resolve, reject) => {
      let query = `SELECT id FROM utilisateur WHERE (nomUtilisateur = ? AND motDePasse = ?)`;

      let username = login.Username;
      let password = login.Password;

      con.query(query, [username, password], (err, results) => {
        if (err) {
          reject(err);
        } else {
          if (results.length == 1) {
            const userId = results[0].id;
            const username = results[0].nomUtilisateur;

            const token = generateAuthToken(userId);

            resolve(token);
            resolve(true);
          } else {
            resolve(false);
          }
        }
      });
    });
  };
  verifyUser(login)
    .then((token) => {
      if (token) {
        //console.log("Utilisateur existant");
        //console.log("Your token :",token,'\t' , currrentDateAndHour);

        res.json({ token });
      } else {
        //console.log("Utilisateur non existant");
        res.sendStatus(409);
      }
    })
    .catch((err) => {
      console.log(err);
      res.sendStatus(500);
    });
});

//test
app.get("/",(req,res) =>{
console.log("hello i'm the backend");
});

//get token from cache device
app.use('/token', (req, res) => {

  // get the token send in headers in frontend
  const authHeader = req.headers['authorization'];
  if (authHeader) {

    const token = authHeader.split(' ')[1]; // separe the token

    // print the received token
    //console.log('The token sended from front :', token);

    //decrypt the token
    decrypt(req, res, token);
    console.log(req.userId);

  } else {
    res.status(401).json({ message: '' });
  }

});




//create the API for the Active profile
app.get('/get-active-profile/:token', (req, res) => {

  const token = req.params.token;
  let defaultFileName = '';

  decrypt(req, res, token);

  const apiquery = `SELECT * FROM utilisateur where (utilisateur.id = ?) `;

  con.query(apiquery, [req.userId], (err, results) => {

    if (err) {
      console.error('Erreur de requete :', err);
      res.status(500).json({ error: 'erreur de requete SQL' })
    }
    else {
      const profilesWithImagePaths = results.map((profile) => ({

        id: profile.id,
        photoDeProfilPath: `uploads/${profile.fichierUpload.toString('utf8')}`,
        nom: profile.nom,
        nomUtilisateur: profile.nomUtilisateur,
        adress: profile.adresse,
        phone: profile.telephone,
        mail: profile.mail,
        matricule:profile.matricule,
        niveau: profile.niveau,
        parcours: profile.parcours,

      }));
      res.json(profilesWithImagePaths);
    }
  });
});
//get the updated data when the users update her profile
app.post('/get-updated-profil-data', middlewareDecryptToken, (req, res) => {

  const data = req.body;
  
  let UpdateUser = () => {

    let query = `UPDATE utilisateur
      SET nomUtilisateur = ? , mail = ? , telephone = ?, typeUtilisateur = ?
      WHERE id = ?;`;
    let id = req.userId;
    let username = data.name;
    let email = data.email;
    let phoneNumber = data.phoneNumber;
    let userType = data.dropdownvalue2;

    con.query(query, [username,
      email, phoneNumber, userType, id], (err, rows) => {
        if (err) {
          console.log(err);
        }
        else {
          // console.log("ligne modifiée dans utilisateur à l'index = " + rows.insertId);

        }
      });
  };
  let UpdateProfil = () => {

    let query = `UPDATE profil
      SET nom = ? , adresse = ? , province = ?, biographie = ?
      WHERE id = ?;`;

   // console.log(uploadedFileName);
    let id = req.userId;
    let nameOrOther = data.nameOrOther;
    let bio = data.biographie;
    let localAdress = data.localAdress;
    let dropdownvalue = data.dropdownvalue;

    con.query(query, [
      nameOrOther, localAdress, dropdownvalue, bio, id], (err, rows) => {
        if (err) {
          console.log(err);
        }
        else {
          // console.log("ligne modifiée dans profil  à l'index = " + rows.insertId);

        }
      });
  }
  UpdateUser();
  UpdateProfil();
});


//API for profile Id
app.get('/user/:token/:id' , (req,res) =>{

const id = req.params.id;

const token = req.params.token;
decrypt(req,res,token);

const userquery = 'select * from profil,utilisateur where ((profil.id = ?) AND utilisateur.id = profil.id)';

con.query(userquery, [id], (err, results) => {

  if (err) {
    console.error('Erreur de requete :', err);
    res.status(500).json({ error: 'erreur de requete SQL' })
  }
  else {
    let defaultFileName='null';
    const profilesWithImagePaths = results.map((profils) => ({
      id: profils.id,
      nom: profils.nom,
      adresse: profils.adresse,
      province: profils.province,
      photoDeProfilPath: profils.photoDeProfil
        ? `uploads/${profils.photoDeProfil.toString('utf8')}`
        : `uploads/${defaultFileName}`,
      phone: profils.telephone,
      biographie: profils.biographie,
      mail: profils.mail,
      typeUtilisateur: profils.typeUtilisateur,
      uploadFile: profils.fichierUpload
        ? `uploadedFiles/${profils.fichierUpload.toString('utf8')}`
        : `uploadedFiles/${defaultFileName}`,

    }));
    res.json(profilesWithImagePaths);
  }
});

});



//print the listening port :3000
httpsServer.listen(port, () => {
  console.log(`Server running on port ${port}`);
});