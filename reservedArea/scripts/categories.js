const URL = window.location.origin;

//function that retrieves the expenditures' categories of the user from the server
async function getExpendituresCategories(){
    let response = await fetch(URL + "/reservedArea/API/getExpendituresCategories/");
    return response.json();
}

//function that incomes the incomes' categories of the user from the server
async function getIncomesCategories(){
    let response = await fetch(URL + "/reservedArea/API/getIncomesCategories/");
    return response.json();
}

//function that retrieves the expenditures' colors of the user from the server
async function getExpendituresCategoriesColors(){
    let response = await fetch(URL + "/reservedArea/API/getExpendituresCategoriesColors/");
    return response.json();
}

//function that incomes the incomes' colors of the user from the server
async function getIncomesCategoriesColors(){
    let response = await fetch(URL + "/reservedArea/API/getIncomesCategoriesColors/");
    return response.json();
}

window.onload = init();

async function init(){
    //get the categories of incomes/expenditures
    let expendituresCategories = await getExpendituresCategories();
    let incomesCategories = await getIncomesCategories();  
    
    //get corresponding colors for every category
    let expendituresCategoriesColors = await getExpendituresCategoriesColors();
    let incomesCategoriesColors = await getIncomesCategoriesColors();

    //display the available categories with corresponding colors
    let expenditureDiv = document.getElementById("expendituresCategories");
    let incomesDiv = document.getElementById("incomesCategories");
    
    //display the categories
    displayCategories(expendituresCategories, expendituresCategoriesColors, expenditureDiv);
    displayCategories(incomesCategories, incomesCategoriesColors, incomesDiv);

    //add event listener to different buttons
    document.getElementById("updateCategory").addEventListener("click", handleUpdateCategory);

    document.getElementById("deleteCategory").addEventListener("click", handleDeleteCategory);

    document.getElementById("addExpenditureCategory").addEventListener("click", handleAddExpenditureCategory);

    document.getElementById("addIncomeCategory").addEventListener("click", handleAddIncomeCategory);

    displayUserInfo();
}

//function that displays informations of every category
function displayCategories(categories, colors, row){
    for(let i = 0; i < categories.length; i++){
        let col = document.createElement("div");
        col.classList.add("col-lg-4");
        col.classList.add("col-md-6");
        col.classList.add("col-sm-12");

        // //for padding
        let internalDiv = document.createElement("div");
        internalDiv.classList.add("p-5");
        internalDiv.classList.add("d-flex");
        internalDiv.classList.add("flex-column");
        internalDiv.classList.add("justify-content-center");
        internalDiv.classList.add("text-center");
        internalDiv.addEventListener("click", showModalUpdate);
        internalDiv.style.backgroundColor = colors[i];
        let h4 = document.createElement("h4");
        h4.innerHTML = categories[i];
        h4.style.color = "white";
        h4.style.backgroundColor = colors[i];
        h4.name = categories[i];
        internalDiv.name = categories[i];
        internalDiv.dataset.bsToggle = "modal";
        internalDiv.dataset.bsTarget = "#categoryModal";
        internalDiv.style.cursor = "pointer";
        internalDiv.appendChild(h4);
        col.appendChild(internalDiv);
        row.appendChild(col);
    }
}

//listener for click on category div
function showModalUpdate(e){
    //fill the "form"
    let category = e.srcElement.name;
    let categoryInputName = document.getElementById("categoryName");
    categoryInputName.placeholder = category;
    categoryInputName.value = category;
    let categoryInputColor = document.getElementById("categoryColor");

    let colorArr = decomposeRgb(e.srcElement.style.backgroundColor);

    let hexColor = rgbToHex(parseInt(colorArr[0]), parseInt(colorArr[1]), parseInt(colorArr[2]));

    categoryInputColor.value = hexColor;
}

//from rgb(r, g, b) to [r, g, b]
function decomposeRgb(rgb){
    let colorArr = rgb.slice(
        rgb.indexOf("(") + 1, 
        rgb.indexOf(")")
    ).split(", ");
    return colorArr;
}

//from 0-255 to 2-digit hex
function componentToHex(c) {
    let hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
}

//from rgb to hex
function rgbToHex(r, g, b) {
    return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}

//listener of category update
function handleUpdateCategory(){
    //get useful values
    let categoryInputName = document.getElementById("categoryName");
    let newCategoryName = categoryInputName.value;
    let oldCategoryName = categoryInputName.placeholder;
    let categoryInputColor = document.getElementById("categoryColor");
    let categoryColor = categoryInputColor.value;

    updateCategory({"oldName" : oldCategoryName, "newName" : newCategoryName, "color" : categoryColor});
    //reload the page to update infos
    window.location.replace("categories.html");
}

async function updateCategory(body){
    const response = await fetch(URL + "/reservedArea/API/updateCategory/", {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
    });

    if (response.status != 204) {
        console.log("Request failed! Error: " + response.status);
    } 
}

//listener of expenditure category add
function handleAddExpenditureCategory(){
    //get useful values
    let categoryInputName = document.getElementById("expenditureCategoryName");
    let categoryName = categoryInputName.value;
    let categoryInputColor = document.getElementById("expenditureCategoryColor");
    let categoryColor = categoryInputColor.value;

    addExpenditureCategory({"name" : categoryName, "color" : categoryColor});
    //reload to see changes
    window.location.replace("categories.html");
}

async function addExpenditureCategory(body){
    const response = await fetch(URL + "/reservedArea/API/addExpenditureCategory/", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
    });

    if (response.status != 204) {
        console.log("Request failed! Error: " + response.status);
    } 
}

//similar to handleAddExpenditureCategory..
function handleAddIncomeCategory(){
    let categoryInputName = document.getElementById("incomeCategoryName");
    let categoryName = categoryInputName.value;
    let categoryInputColor = document.getElementById("incomeCategoryColor");
    let categoryColor = categoryInputColor.value;

    addIncomeCategory({"name" : categoryName, "color" : categoryColor});
    window.location.replace("categories.html");
}

async function addIncomeCategory(body){
    const response = await fetch(URL + "/reservedArea/API/addIncomeCategory/", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
    });

    if (response.status != 204) {
        console.log("Request failed! Error: " + response.status);
    } 
}

function handleDeleteCategory(){
    let categoryInputName = document.getElementById("categoryName");
    let oldCategoryName = categoryInputName.placeholder;

    deleteCategory({"name" : oldCategoryName});
    window.location.replace("categories.html");
}

async function deleteCategory(body){
    const response = await fetch(URL + "/reservedArea/API/deleteCategory/", {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
    });

    if (response.status != 204) {
        console.log("Request failed! Error: " + response.status);
    } 
}
