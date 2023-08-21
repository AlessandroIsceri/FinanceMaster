const MONTHS = ["jan","feb","mar","apr","may","jun","jul","aug","sep","oct","nov","dec"];
const URL = window.location.origin;

window.onload = init();

//function that retrieves data of the user from the server
async function getHistoryData(){
    let response = await fetch(URL + "/reservedArea/API/getHistory/");
    return response.json();
}

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

async function init(){
    //get the categories of incomes/expenditures
    let expendituresCategories = await getExpendituresCategories();
    let incomesCategories = await getIncomesCategories();  
    
    //get corresponding colors for every category
    let expendituresCategoriesColors = await getExpendituresCategoriesColors();
    let incomesCategoriesColors = await getIncomesCategoriesColors();

    //inizialize selectors for available categories
    initalizeSelectors(expendituresCategories, incomesCategories);
    
    //get and display history data of the logged user
    let data = await getHistoryData();
    displayHistory(data, expendituresCategories, incomesCategories, expendituresCategoriesColors, incomesCategoriesColors);
    
    //get current date infos
    const date = new Date();

    //get current month data for displaying charts
    let currentMonthExpenditures = getMonthData(data, date.getFullYear(), date.getMonth(), expendituresCategories);
    let currentMonthIncomes = getMonthData(data, date.getFullYear(), date.getMonth(), incomesCategories);

    //display the charts
    displayDougChartData(currentMonthExpenditures, "currentExpendituresChart", "Your expenditures this month", expendituresCategoriesColors);
    displayDougChartData(currentMonthIncomes,  "currentIncomesChart", "Your incomes this month", incomesCategoriesColors);

    //gourp data based on the period (month-year)
    let groupedData = groupDataPeriod(data, expendituresCategories, incomesCategories);

    //calculate incomes, expenditures, and saves per period(month-year)
    let incomes = [];
    let expenditures = [];
    let periods = [];
    let saves = [];
    for(periodData of groupedData){
        periods.push(periodData[0]);
        expenditures.push(periodData[1][0]);
        incomes.push(periodData[1][1]);
        saves.push(periodData[1][1] - periodData[1][0]);
    }

    //display the chart of incomes/saves/expenditures
    displayExpendituresIncomesChartData(incomes, expenditures, saves, periods);

    //update the darkmode after charts have been drawed
    checkDarkMode();

    //display total saves
    document.getElementById("spanSaves").innerHTML = saves.reduce((x, y) => x + y, 0) + " €";

    //compute the mean of expenditures and incomes (the current month is not considered)
    let expendituresMean = mean(expenditures.slice(0, expenditures.length - 1));
    let incomesMean = mean(incomes.slice(0, incomes.length - 1));

    //display the percentage difference of incomes/expenditures
    displayDifferencesWithMean(currentMonthExpenditures, currentMonthIncomes, expendituresMean, incomesMean);

    //compute total money spent/earned from each category
    groupedData = groupDataCategory(data, expendituresCategories, incomesCategories);
    displayTotalMoneyPerCategory(groupedData, expendituresCategoriesColors, incomesCategoriesColors);

    //display username
    displayUserInfo();

    //set current date in input type = "date"
    setCurrentDate();
}        

function setCurrentDate(){
    document.getElementById("modalIncomesDate").valueAsDate = new Date();
    document.getElementById("modalExpendituresDate").valueAsDate = new Date();
}

//functions that initialize the selectors for the categories
async function initalizeSelectors(expendituresCategories, incomesCategories){
    let expendituresCategorySelector = document.getElementById("modalExpendituresCategory");
    let incomesCategorySelector = document.getElementById("modalIncomesCategory");
    insertOptions(expendituresCategories, expendituresCategorySelector);
    insertOptions(incomesCategories, incomesCategorySelector);
}

function insertOptions(categories, selector){
    for(category of categories){
        let option = document.createElement("option");
        option.value = category; 
        option.innerHTML = category;
        selector.appendChild(option);
    }
}

//function that displays the recent transactions using a table
function displayHistory(data, expendituresCategories, incomesCategories, expendituresCategoriesColors, incomesCategoriesColors){
    let tbody = document.getElementById("tableBody");
    for(transaction of data){
        let row = document.createElement("tr");
        
        let typeCell = document.createElement("td");
        let categoryCell = document.createElement("td");
        categoryCell.innerHTML = transaction["category"];
        categoryCell.style.color = "white";

        let valueCell = document.createElement("td");

        let dateCell = document.createElement("td");
        
        //styling...
        if(expendituresCategories.includes(transaction["category"])){
            typeCell.innerHTML = "Expenditure";
            let colorIndex = expendituresCategories.indexOf(transaction["category"]);
            categoryCell.style.backgroundColor = expendituresCategoriesColors[colorIndex];
            valueCell.innerHTML = "-";
            valueCell.style.color = "red";
        }else{
            typeCell.innerHTML = "Income";
            let colorIndex = incomesCategories.indexOf(transaction["category"]);
            categoryCell.style.backgroundColor = incomesCategoriesColors[colorIndex];
            valueCell.innerHTML = "+";
            valueCell.style.color = "green";
        }
        valueCell.innerHTML += transaction["value"] + "€";
        dateCell.innerHTML = transaction["date"];

        //add the first cell (expenditure/income)
        row.appendChild(typeCell);

        //add the second cell: the category with the corresponding color
        row.appendChild(categoryCell);

        //add the third cell: the value of expenditure/income
        row.appendChild(valueCell);
        
        //add the fourth cell: the date of expenditure/income
        row.appendChild(dateCell);

        tbody.appendChild(row);
    }
}

//function that gets in input the recent history and produces in output an object containing the transactions values of a specified month divided into categories 
function getMonthData(data, year, month, categories){
    
    //the object is initialized with 0 for every category
    let ret = {};

    for(category of categories){
        ret[category] = 0;
    }

    //fill the object with the right data (registered in the correct month and year)
    for(transaction of data){
        let transactionDate = new Date(transaction["date"]);
        let transactionYear = transactionDate.getFullYear();
        let transactionMonth = transactionDate.getMonth();
        if(transactionYear == year && transactionMonth == month && categories.includes(transaction["category"])){
            ret[transaction["category"]] += transaction["value"];                    
        }
    }
    return ret;
}

//function that gets in input the recent history and produces in output an object containing the total expenditures and incomes per year-month
//output: map key-value where key is: month-year and value is [totalExpenditures, totalIncomes]
function groupDataPeriod(data, expendituresCategories, incomesCategories){
    let ret = new Map();
    for(transaction of data){
        let transactionDate = new Date(transaction["date"]);
        let transactionYear = transactionDate.getFullYear();
        let transactionMonth = MONTHS[transactionDate.getMonth()];
        if(ret.get(transactionMonth + "-" + transactionYear) == null){
            //expenditures/incomes are not set for this period
            if(expendituresCategories.includes(transaction["category"])){
                //the first value found for this period is an expenditure
                ret.set(transactionMonth + "-" + transactionYear, [transaction["value"], 0]);
            }
            else{
                //the first value found for this period is an income
                ret.set(transactionMonth + "-" + transactionYear, [0, transaction["value"]]);
            }
        }else{
            //expenditures/incomes are set for this period
            let oldValues = ret.get(transactionMonth + "-" + transactionYear);
            let oldExpenditure = oldValues[0];
            let oldIncomes = oldValues[1];
            if(expendituresCategories.includes(transaction["category"])){
                //the expenditures should be updated
                ret.set(transactionMonth + "-" + transactionYear, [oldExpenditure + transaction["value"], oldIncomes]);
            }else{
                //the incomes should be updated
                ret.set(transactionMonth + "-" + transactionYear, [oldExpenditure, oldIncomes + transaction["value"]]);
            }
        }
    }
    return ret;
}

//function used to display doughnut chart
function displayDougChartData(JSONObject, chartId, chartLabel, colors){
    var labels =[];
    var values = [];

    for(field in JSONObject){
        labels.push(field);
        values.push(JSONObject[field]);
    }

    let chart = new Chart(chartId, {
    type: "doughnut",
    data: {
        labels: labels,
        datasets: [{
            backgroundColor: colors,
            data: values,
            hoverOffset: 4
            }]
    },
    
    options: {
        legend: {
            position: 'top',
            labels: {
                fontSize: 12
            }
        },
        title: {
            display: true,
            text: chartLabel,
            fontSize: 14
        }
    }
    });
    console.log("charts");
}


//function to display the line chart
function displayExpendituresIncomesChartData(incomes, expenditures, saves, periods){
    
    new Chart("incomesExpendituresComparison", {
    type: "line",
    data: {
        labels: periods.reverse(),
        datasets: [{
                label: 'Incomes',
                data: incomes.reverse(),    //reverse because the graph should in chronological order (the list of transaction is not in chronological order)
                borderColor: 'rgb(26, 232, 94)',
                lineTension: 0,
                fill: false
            },{
                label: 'Expenditures',
                data: expenditures.reverse(),
                borderColor: 'rgb(232, 44, 30)',
                lineTension: 0,
                fill: false
            },{
                label: 'Saves',
                data: saves.reverse(),
                lineTension: 0,
                borderColor: 'rgb(54, 162, 235)',
                fill: false
            }]
    },
    options: {
        legend: {
            position: 'top',labels: {
                fontSize: 12
            }
        },
        title: {
            display: true,
            text: 'Incomes/Expenditures/Saves comparison',
            fontSize: 14
        }
    }
    });
}

//function to compute mean value of an array
function mean(array){
    let sum = 0, counter = 0;
    for(value of array){
        sum += value;
        counter++;
    }
    return sum / counter;
}

//function to display data in "progress section"
function displayDifferencesWithMean(currentMonthExpenditures, currentMonthIncomes, expendituresMean, incomesMean){
    let totalMonthExpenditures = 0, totalMonthIncomes = 0;
    for(category in currentMonthExpenditures){
        totalMonthExpenditures += currentMonthExpenditures[category];
    }
    for(category in currentMonthIncomes){
        totalMonthIncomes += currentMonthIncomes[category];
    }
    document.getElementById("currentExpenditures").innerHTML = totalMonthExpenditures + " €";
    document.getElementById("currentIncomes").innerHTML = totalMonthIncomes + " €";

    // calculate the percentage increase
    let expendituresPercentage = calculatePercentageIncrement(totalMonthExpenditures, expendituresMean);
    let expendituresPercentageSpan = document.getElementById("expendituresPercentage");
    let expendituresIcon = document.getElementById("expendituresIcon");
    //and display the increase with the correct icon
    displayPercentageIncrement(expendituresPercentageSpan, expendituresIcon, "expenditures", expendituresPercentage);
    
    //calculate the difference in incomes
    let incomesPercentage = calculatePercentageIncrement(totalMonthIncomes, incomesMean);
    let incomesPercentageSpan = document.getElementById("incomesPercentage");
    let incomesIcon = document.getElementById("incomesIcon");
    //and display the increase with the correct icon
    displayPercentageIncrement(incomesPercentageSpan, incomesIcon, "incomes", incomesPercentage);

}

function calculatePercentageIncrement(currentData, mean){
    let difference = currentData - mean;
    let percentage = difference / mean * 100;
    return Math.round(percentage * 100) / 100;
}

function displayPercentageIncrement(span, icon, type, increment){
    span.innerHTML = increment + "%";
    if(type == "expenditures"){
        if(increment < 0){
            //expenditures are lower
            span.style.color = "green";
            icon.classList.add("fa-arrow-trend-down");
            icon.style.color = "green";
        }else{
            //expenditures are higher
            span.style.color = "red";
            icon.classList.add("fa-arrow-trend-up");
            icon.style.color = "red";
        }
    }else if(type == "incomes"){
        if(increment < 0){
            //incomes are lower
            span.style.color = "red";
            icon.classList.add("fa-arrow-trend-down");
            icon.style.color = "red";
        }else{
            //incomes are higher
            span.style.color = "green";
            icon.classList.add("fa-arrow-trend-up");
            icon.style.color = "green";
        }
    }
}

document.getElementById("newIncomeButton").addEventListener("click", handleNewIncome);
document.getElementById("newExpenditureButton").addEventListener("click", handleNewExpenditure);

//returns a new object of type "transaction"
function createNewTransaction(category, value, date){
    return {
        "category": category,
        "value": parseInt(value), 
        "date": date
    };
}

//listener for a new income
async function handleNewIncome(){
    //get useful values
    let value = document.getElementById("modalIncomesValue").value;
    let category = document.getElementById("modalIncomesCategory").value;
    let date = document.getElementById("modalIncomesDate").value;
    let body = createNewTransaction(category, value, date);
    await addTransaction(body);
    //reload the page to update data
    window.location.replace("index.html");
}

//listener for a new expenditure
async function handleNewExpenditure(){
    //get useful values
    let value = document.getElementById("modalExpendituresValue").value;
    let category = document.getElementById("modalExpendituresCategory").value;
    let date = document.getElementById("modalExpendituresDate").value;
    let body = createNewTransaction(category, value, date);
    await addTransaction(body);
    //reload the page to update data
    window.location.replace("index.html");
}

async function addTransaction(body){
    const response = await fetch(URL + "/reservedArea/API/addTransaction/", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(body), // body data type must match "Content-Type" header
    });

    if (response.status != 201) {
        console.log("Request failed! Error: " + response.status);
    }            
    
}

//function that groups transactions based on their category and computes the total money related to that category
function groupDataCategory(data, expendituresCategories, incomesCategories){
    let ret = new Map();
    let categories = expendituresCategories.concat(incomesCategories); 
    for(category of categories){
        //initialize the total money related to this category
        ret.set(category, 0);
        for(transaction of data){
            //iterate through transaction and update the money if the category is the same
            if(transaction["category"] == category){
                let oldValue = ret.get(category);
                ret.set(category, oldValue + transaction["value"]);
            }
        }  
    }
    return ret;
}

//function that displays the total money related to every category
function displayTotalMoneyPerCategory(groupedData, expendituresCategoriesColors, incomesCategoriesColors){
    let colors = expendituresCategoriesColors.concat(incomesCategoriesColors);
    let i = 0;
    let parentDiv = document.getElementById("totalMoney");
    
    let row = document.createElement("div");
    row.classList.add("row");
    row.classList.add("gx-5");
    row.classList.add("gy-3")
    for(categoryData of groupedData){
        
        let div = document.createElement("div");
        div.classList.add("col-lg-4");
        div.classList.add("col-md-6");
        div.classList.add("col-sm-12");

        //for padding
        let internalDiv = document.createElement("div");
        internalDiv.classList.add("p-5");
        internalDiv.classList.add("d-flex");
        internalDiv.classList.add("flex-column");
        internalDiv.classList.add("justify-content-center");
        internalDiv.classList.add("text-center");
        
        internalDiv.style.backgroundColor = colors[i];
        let h4 = document.createElement("h4");
        h4.innerHTML = "€ " + categoryData[1];
        let p = document.createElement("p");
        p.innerHTML = categoryData[0];
        
        internalDiv.appendChild(h4);
        internalDiv.appendChild(p);
        div.appendChild(internalDiv);
        row.appendChild(div);
        i++;
    }
    parentDiv.appendChild(row);
}
