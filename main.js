var express = require('express');
var app = express();

//DB handler
const {MongoClient} = require('mongodb');
var client;
var database;
var accounts;

//connection function
async function connectToDB() {
    let uri = "mongodb+srv://" + process.env.DBUsername + ":" + process.env.DBPassword + "@cluster0.u4clj6i.mongodb.net/";    client = new MongoClient(uri);
    try {
        // Connect to the MongoDB cluster
        await client.connect();
        database = client.db('FinanceMaster');
        // retrieve the correct collection
        accounts = database.collection('Accounts');
        console.log("Connected to DB");
    } catch (e) {
        console.error(e);
    }
}

async function closeConnection() {
    await client.close();
    console.log("Connection closed");
}

//support functions that retrieve data from DB
async function getAccount(username){
    const query = { username: username };
    const account = await accounts.findOne(query);
    return account;
}

connectToDB();

//FINISH DB HANDLER

var bodyParser = require('body-parser');
// create json parser
var jsonParser = bodyParser.json();

// session handler 
var session = require('cookie-session');
app.use(session({secret:'prova'}));

//server port
const PORT = process.env.PORT || 3001;

//check if user is logged
function userLogged(req){
    return req.session.username != undefined;
}

//handle access to the main folder
app.get('/', function(req, res){
    if(userLogged(req)){
        res.redirect("/reservedArea/");
    }else{
        res.status(200).sendFile(__dirname + '/public/login.html');
    }
});

//hanlde access to /reservedArea/
app.all('/reservedArea/*' , function(req, res, next) {
    if(userLogged(req)){      
       next();      
    }else{
      //you are not logged in.... redirect to login page
      res.redirect('/');            
    }
});

app.use("/reservedArea", express.static(__dirname + '/reservedArea'));

//declare the static directory (used if user is not logged)
app.use(express.static('public'));

//this function returns all the transaction of the logged user
app.get("/reservedArea/API/getHistory/", async function(req, res){
    let username = req.session.username;
    let account = await getAccount(username);
    res.end(JSON.stringify(account["history"]));
});

//this function returns all the expenditures categories of the user
app.get("/reservedArea/API/getExpendituresCategories/", async function(req, res){
    let username = req.session.username;
    let account = await getAccount(username);
    res.end(JSON.stringify(account["expendituresCategories"]));
});

app.get("/reservedArea/API/getIncomesCategories/", async function(req, res){
    let username = req.session.username;
    let account = await getAccount(username);
    res.end(JSON.stringify(account["incomesCategories"]));
});

//this function returns the colors all the expenditures categories of the user
app.get("/reservedArea/API/getExpendituresCategoriesColors/", async function(req, res){
    let username = req.session.username;
    let account = await getAccount(username);
    res.end(JSON.stringify(account["expendituresCategoriesColors"]));
});

app.get("/reservedArea/API/getIncomesCategoriesColors/", async function(req, res){
    let username = req.session.username;
    let account = await getAccount(username);
    res.end(JSON.stringify(account["incomesCategoriesColors"]));
});


//this function is used to add a transaction (income or expenditure)
app.post("/reservedArea/API/addTransaction/", jsonParser, async function(req, res){
    let username = req.session.username;

    let currentAccount = await getAccount(username);
    let history = currentAccount["history"];
    let newTransaction = req.body;
    //req.body will be inserted in history in the right chronological order
    let index = getInsertIndex(history, newTransaction);

    //update history on DB
    await accounts.updateOne({ 
            username: username
        }, { 
            $push: { 
                history: {
                    $each: [newTransaction],
                    $position: index
                }
            } 
        }
    );

    res.status(201).send('Status: Created');
});

//function that computes the correct index for inserting a new transaction
function getInsertIndex(history, newTransaction){
    if(history.length == 0){
        return 0;
    }else{
        for(let i = 0; i < history.length; i++){
            let transaction = history[i];
            if(newTransaction["date"] >= transaction["date"]){
                return i;
            }
        }
        return history.length;
    }
}

//this function is used to update the name or the color of a category
app.put("/reservedArea/API/updateCategory/", jsonParser, async function(req, res){
    let username = req.session.username;
    let currentAccount = await getAccount(username);
    let body = req.body;
    let index = currentAccount["incomesCategories"].indexOf(body.oldName);
    if(index != -1){
        //type income, update color and name of the category
        let color = currentAccount["incomesCategoriesColors"][index];
        await accounts.updateOne({
                username: username 
            },{ 
                $set: { 
                    "incomesCategories.$[name]" : body.newName,
                    "incomesCategoriesColors.$[color]" : body.color
                } 
            },{
                arrayFilters: [
                    { "name" : body.oldName } ,
                    { "color" : color }
                ]
            }
        );
     }else{
        //type expenditure, update color and name of the category
        index = currentAccount["expendituresCategories"].indexOf(body.oldName);
        let color = currentAccount["expendituresCategoriesColors"][index];
        await accounts.updateOne({
            username: username 
        },{ 
            $set: { 
                "expendituresCategories.$[name]" : body.newName,
                "expendituresCategoriesColors.$[color]" : body.color
            } 
        },{
            arrayFilters: [
                { "name" : body.oldName } ,
                { "color" : color }
            ]
        }
    );
    }
    //the history should be updated
    await updateHistory(body.oldName, body.newName, username)
    res.status(204).send('Status: no content');
});

//update the history transactions by replacing all the oldCategory names with the new ones
async function updateHistory(oldCategory, newCategory, username){
    await accounts.updateMany(
        { username: username},
        { $set: {"history.$[element].category": newCategory}},
        { arrayFilters: [ { "element.category": oldCategory } ], upsert: true }
    );
}

//function used to add a new expenditure category
app.post("/reservedArea/API/addExpenditureCategory/", jsonParser, async function(req, res){
    let username = req.session.username;
    //add the name and the color of the category in the right array
    await accounts.updateOne({
            username: username
        },{ 
            $push: { 
                expendituresCategories: {
                    $each: [req.body.name]
                },
            expendituresCategoriesColors: {
                    $each: [req.body.color]
                }
            } 
        }
    );

    res.status(204).send('Status: no content');
});

app.post("/reservedArea/API/addIncomeCategory/", jsonParser, async function(req, res){
    let username = req.session.username;

    //add the name and the color of the category in the right array
    await accounts.updateOne({ 
            username: username
        },{ 
            $push: { 
                incomesCategories: {
                    $each: [req.body.name]
                },
                incomesCategoriesColors: {
                    $each: [req.body.color]
                }
           } 
        }
    );

    res.status(204).send('Status: no content');
});

//function used to delete a category
app.delete("/reservedArea/API/deleteCategory/", jsonParser, async function(req, res){
    let username = req.session.username;
    let currentAccount = await getAccount(username);
    let categoryName = req.body.name;
    let index = currentAccount["incomesCategories"].indexOf(categoryName);
    if(index != -1){
        //type income
        let color = currentAccount["incomesCategoriesColors"][index];
        //delete the category
        await accounts.updateOne({ 
                username: username
            },{ 
                $pull:{ 
                    'incomesCategories': categoryName, 
                    'incomesCategoriesColors': color 
                }
            }
        );
    }else{
        //type expenditure
        index = currentAccount["expendituresCategories"].indexOf(categoryName);
        let color = currentAccount["expendituresCategoriesColors"][index];
        //delete the category
        await accounts.updateOne({ 
                username: username
            },{ 
                $pull: { 
                    'expendituresCategories': categoryName,
                    'expendituresCategoriesColors': color
                }
            }
        );
    }
    //delete from history all the transaction of this category
    cleanHistory(categoryName, username);
    res.status(204).send('Status: no content');
});

async function cleanHistory(category, username){
    await accounts.updateMany({ 
            username: username
        },{
            $pull: { 
                history: { 
                    category: category 
                } 
            } 
        }
    );
}

//login function (public)
app.post("/login/", jsonParser, async function(req, res){
    let currentAccount = await getAccount(req.body.username);
    if(currentAccount["password"] == req.body.password){
        req.session.username = req.body.username;
        res.status(200).send('Status: ok');
    }else{
        res.status(404).send('Status: not found');
    }
});

app.post("/reservedArea/API/logout/", jsonParser, function(req, res){
    req.session = null;
    res.status(200).send('Status: ok');
});

//to create a new account
app.post("/newAccount/", jsonParser, async function(req, res){
    let currentAccount = await getAccount(req.body.username);
    if(currentAccount != undefined){
        //account already exists
        res.status(409).send('Status: conflict');
    }else{
        //create the new account
        await accounts.insertOne({
                                "username": req.body.username,
                                "password" : req.body.password,
                                "incomesCategories" : [],
                                "expendituresCategories": [],
                                "incomesCategoriesColors" : [],
                                "expendituresCategoriesColors" : [],
                                "history": []
                            });
        req.session.username = req.body.username;
        res.status(201).send('Status: created');
    }
});

//The 404 Route (ALWAYS Keep this as the last route), handles all unauthorized accesses
app.get('*', function(req, res){
    if(userLogged(req)){
        res.redirect("/reservedArea/");
    }
    else{
        res.redirect('/');
    }         
});

//start the server
app.listen(PORT, () => console.log(`Server listening on port ${PORT}!`));

//to handle the connection close
async function exitHandler() {
    await closeConnection();
    process.exit();
}

//do something when app is closing
process.on('exit', exitHandler.bind());

//catches ctrl+c event
process.on('SIGINT', exitHandler.bind());

// catches "kill pid" (for example: nodemon restart)
process.on('SIGUSR1', exitHandler.bind());
process.on('SIGUSR2', exitHandler.bind());
