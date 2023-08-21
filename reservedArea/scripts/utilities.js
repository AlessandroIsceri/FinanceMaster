//to display user info in navbar
function displayUserInfo(){
    document.getElementById("username").innerHTML = localStorage.getItem("username");
}

document.getElementById("logout").addEventListener("click", logout);

async function logout(){
    const response = await fetch(URL + "/reservedArea/API/logout/", {
        method: "POST"
    });
    if (response.status == 200) {
        localStorage.clear();
        //reload main page
        window.location.replace("index.html");
    }
}

//bootstrap function to inizialize popovers
let popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'))
let popoverList = popoverTriggerList.map(function (popoverTriggerEl) {
    return new bootstrap.Popover(popoverTriggerEl)
})