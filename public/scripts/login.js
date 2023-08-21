const URL = window.location.origin;

window.onload = init();

async function init(){
    document.getElementById("login").addEventListener("click", login);
    document.getElementById("newAccount").addEventListener("click", newAccount);
}

async function login(){
cleanSpan();
let username = document.getElementById("username").value;
let password = document.getElementById("password").value;

//encrypt password
let encryptedPassword = hex_sha512(password);

const response = await fetch(URL + "/login/", {
    method: "POST",
    headers: {
        "Content-Type": "application/json",
    },
    body: JSON.stringify({"username" : username, "password" : encryptedPassword}),
});

if (response.status == 200) {
    //redirect user, login was successful
    localStorage.setItem("username", username);
    window.location.replace("/reservedArea/");
} else{
    document.getElementById("loginError").style.display = "block";
}
}

async function newAccount(){
    cleanSpan();
    let username = document.getElementById("username").value;
    let password = document.getElementById("password").value;

    //if one of the input is empty, error
    if(username.length == 0 || password.length == 0){
        document.getElementById("newAccountErrorEmpty").style.display = "block";
        return;
    }

    let encryptedPassword = hex_sha512(password);

    const response = await fetch(URL + "/newAccount/", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({"username" : username, "password" : encryptedPassword}),
    });

    if (response.status == 201) {
            localStorage.setItem("username", username);
            window.location.replace("/reservedArea/");
        } else{
            document.getElementById("newAccountError").style.display = "block";
        }
    }  

//function to clean the span that could be displayed
function cleanSpan(){
    document.getElementById("loginError").style.display = "none";
    document.getElementById("newAccountError").style.display = "none";
    document.getElementById("newAccountErrorEmpty").style.display = "none";
}