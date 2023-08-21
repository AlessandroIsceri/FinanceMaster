//to avoid error in login page
console.log("darkmoe");
var page = window.location.pathname;
var cookieExpirationDate = new Date();
cookieExpirationDate.setFullYear(cookieExpirationDate.getFullYear() + 1);

let lightTextColor = "#23272b";
let darkTextColor = "#acb4bc";
let lightBorderColor = "white";
let darkBorderColor = "#212529";

//to switch theme
function checkDarkMode(){
    if(getCookie("darkmode") == ""){
        document.cookie = "darkmode = false;path=/; expires=" + cookieExpirationDate.toUTCString();
    }else{
        //dark mode is setted
        let darkmode = getCookie("darkmode");
        if (darkmode == "true") {
            setDarkTheme();
        }
        else {
            setLightTheme();
        }
    }
}
checkDarkMode();

//Switcher
document.getElementById('switchTheme').addEventListener('click',()=>{
    let darkmode = getCookie("darkmode");
    if (darkmode == "true") {
        setLightTheme();
    }
    else {
        setDarkTheme();
    }
});

function setLightTheme(){
    //in login.html navbar is not declared
    if(page != "/login.html" && page != "/"){
        let navbar = document.getElementById("navbar");
        
        navbar.classList.remove("navbar-dark");
        navbar.classList.remove("bg-dark");
        navbar.classList.add("navbar-light");
        navbar.classList.add("bg-light");

        //change charts colors
        if(page == "/reservedArea/index.html" || page == "/reservedArea/"){
            //correct page
            Chart.helpers.each(Chart.instances, function(instance){
                instance.options.legend.labels.fontColor = lightTextColor;
                instance.options.title.fontColor = lightTextColor;
                if(instance.config.type == "doughnut"){
                    //update border colors
                    instance.data.datasets[0].borderColor = lightBorderColor;
                }
                instance.update();
            });
        }

    }

    let icon = document.getElementById("themeIcon");
    icon.classList.remove("fa-moon");
    icon.classList.add("fa-sun");

    document.documentElement.setAttribute('data-bs-theme','light');
    
    document.cookie = "darkmode = false;path=/; expires=" + cookieExpirationDate.toUTCString();
}

function setDarkTheme(){
    if(page != "/login.html" && page != "/"){
        let navbar = document.getElementById("navbar");
    
        navbar.classList.add("navbar-dark");
        navbar.classList.add("bg-dark");
        navbar.classList.remove("navbar-light");
        navbar.classList.remove("bg-light");

        //change charts colors
        if(page == "/reservedArea/index.html" || page == "/reservedArea/"){
            //correct page
            Chart.helpers.each(Chart.instances, function(instance){
                instance.options.legend.labels.fontColor = darkTextColor;
                instance.options.title.fontColor = darkTextColor;
                if(instance.config.type == "doughnut"){
                    //update border colors
                    instance.data.datasets[0].borderColor = darkBorderColor;
                }
                instance.update();
            });
        }
    }

    let icon = document.getElementById("themeIcon");
    icon.classList.remove("fa-sun");
    icon.classList.add("fa-moon");

    document.documentElement.setAttribute('data-bs-theme','dark');
    
    document.cookie = "darkmode = true;path=/; expires=" + cookieExpirationDate.toUTCString();
}

//function that returns the value of a cookie given its name
function getCookie(cname) {
    let name = cname + "=";
    let decodedCookie = decodeURIComponent(document.cookie);
    let ca = decodedCookie.split(';');
    for(let i = 0; i <ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) == ' ') {
        c = c.substring(1);
      }
      if (c.indexOf(name) == 0) {
        return c.substring(name.length, c.length);
      }
    }
    return "";
}
