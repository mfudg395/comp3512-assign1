const companiesAPI = "https://www.randyconnolly.com/funwebdev/3rd/api/stocks/companies.php";
const stockDataAPI = "https://www.randyconnolly.com/funwebdev/3rd/api/stocks/history.php?symbol=";

const currency = new Intl.NumberFormat('en-us', {style: 'currency', currency: 'USD'}); // used for formatting dollar values
const asNumber = (currency) => {return Number(currency.replace(/(^\$,)/g,''));} // converts a currency to a number; solution adopted from https://stackoverflow.com/questions/31197542/javascript-sort-for-currency-string
let map;

document.addEventListener('DOMContentLoaded', function() {

    const defaultViewElements = document.querySelectorAll(".defaultView");
    const chartViewElements = document.querySelectorAll(".chartView");
    const viewButtons = document.querySelectorAll(".changeViewButton");

    let htmlCompanyList = document.querySelector("#companyList"); // Node for the unordered list of companies
    let stockTable = document.querySelector("#stockDataTable"); // Node for the table containing stock information

    // Adding event listeners for the button that switches between views.
    for (let button of viewButtons) {
        button.addEventListener('click', function() {
            if (button.id == "viewChartsButton") {
                enableChartView();
            } else {
                enableDefaultView();
            }
        })
    }

    // Hides all elements in the Default view and shows all elements in Chart view.
    function enableChartView() {
        for (let element of defaultViewElements) {
            element.style.display = "none";
        }
        for (let element of chartViewElements) {
            element.style.display = "block";
        }
    }

    // Hides all elements in the Chart view and shows all elements in Default view.
    function enableDefaultView() {
        for (let element of defaultViewElements) {
            element.style.display = "block";
        }
        for (let element of chartViewElements) {
            element.style.display = "none";
        }
    }

    createCompanyList();

    /* Builds the 'Company List' panel by displaying the list of companies and adding
    * event listeners for the Filter box and the 'Go'/'Clear' buttons.
    */
    async function createCompanyList() {
        let companies = await getCompanies(); // array for every Company object in companiesAPI
        document.querySelector('#companyLoadingAnimation').style.display = 'none';

        document.querySelector('#clearButton').addEventListener('click', () => {
            document.querySelector('#companySearch').value = "";
            htmlCompanyList.innerHTML = "";
            setCompanyList(companies);
        });

        setCompanyList(companies);
        createFilter(companies);
    }

    /* Returns an array of companies retrieved from companiesAPI. If the JSON data already exists
    *  in local Storage, it is retrieved from there rather than from a fetch.
    */
    async function getCompanies() {
        if (localStorage.getItem('companies')) {
            return JSON.parse(localStorage.getItem('companies'));
        } else {
            const response = await fetch(companiesAPI);
            const data = await response.json();
            localStorage.setItem('companies', JSON.stringify(data));
            return data;
        }
    }

    // Creates an <li> HTML element for each company and appends it to the node for the company list.
    function setCompanyList(companies) {
        for (let company of companies) {
            let element = document.createElement('li');
            element.textContent = company.name;
            element.addEventListener('click', function() {
                setMap(company);
                setStockData(company);
                setChartCompanyInfo(company);
            });
            htmlCompanyList.append(element);
        }
    }

    // Builds the Map panel, showing the location of a given company using the Google Maps JavaScript API.
    function setMap(company) {
        map = new google.maps.Map(document.querySelector('#mapPanel'), {
            center: {lat: company.latitude, lng: company.longitude},
            zoom: 18
        });
    }

    // Builds the Stock Data panel, displaying a table of 3 months of stock data from the given company.
    async function setStockData(company) {
        const tableLoadingAnimation = document.querySelector('#stockDataLoadingAnimation');
        const tableHeaders = stockTable.querySelectorAll('.tableHead');

        tableLoadingAnimation.style.display = 'block'; // display the loading animation during fetch
        const response = await fetch(stockDataAPI + company.symbol);
        const stockData = await response.json();
        tableLoadingAnimation.style.display = 'none'; // hide loading animation once fetch complete

        for (let header of tableHeaders) {
            header.addEventListener('click', () => {
                const sortBy = header.textContent.toLowerCase();
                stockData.sort(function(a, b) {
                    console.log(typeof(a.volume));
                    if (sortBy == 'date') return a.date < b.date ? -1 : 1;
                    if (sortBy == 'open') return a.open < b.open ? -1 : 1;
                    if (sortBy == 'close') return a.close < b.close ? -1 : 1;
                    if (sortBy == 'low') return a.low < b.low ? -1 : 1;
                    if (sortBy == 'high') return a.high < b.high ? -1 : 1;
                    if (sortBy == 'volume') return asNumber(a.volume) < asNumber(b.volume) ? -1 : 1;
                })
                populateStockDataTable(stockData);
            })
        }
        populateStockDataTable(stockData);
        //populateStockSummaryTable(stockData);
    }

    function populateStockDataTable(stockData) {
        const tableBody = stockTable.querySelector('tbody');
        tableBody.innerHTML = "";
        for (let data of stockData) { // each piece of 'data' will be a single row in the table
            let row = document.createElement('tr');

            let dateCell = document.createElement('td');
            dateCell.textContent = data.date;
            row.appendChild(dateCell);

            let openCell = document.createElement('td');
            openCell.textContent = currency.format(data.open);
            row.appendChild(openCell);

            let closeCell = document.createElement('td');
            closeCell.textContent = currency.format(data.close);
            row.appendChild(closeCell);

            let lowCell = document.createElement('td');
            lowCell.textContent = currency.format(data.low);
            row.appendChild(lowCell);

            let highCell = document.createElement('td');
            highCell.textContent = currency.format(data.high);
            row.appendChild(highCell);

            let volumeCell = document.createElement('td');
            volumeCell.textContent = currency.format(data.volume);
            row.appendChild(volumeCell);

            tableBody.appendChild(row);
        }
    }

    // coming back to this... not sure what to do with it
    // function populateStockSummaryTable(stockData) {
    //     // stockData.sort(function(a, b,) {
    //     //     return a.open > b.open ? 1 : -1;
    //     // });
    //     populateSummaryColumn(stockData, 'open');

    //     let closeMin = stockData[0].close;

    //     // for (let data of stockData) {
    //     //     openSum += parseFloat(data.open);
    //     //     openMin = parseFloat(data.open) < openMin ? data.open : openMin;
    //     //     openMax = parseFloat(data.open) > openMax ? data.open : openMax;
    //     // }
    //     // let openAvgCell = document.createElement('td');
    //     // openAvgCell.textContent = currency.format(openSum / stockData.length);
    //     // averages.appendChild(openAvgCell);
    // }

    // function populateSummaryColumn(stockData, criteria) {
        
    // }

    // // Calculates the average of a given criteria in the stockData array.
    // function calculateAverage(stockData, criteria) {
    //     let sum = 0;
    //     for (let data of stockData) {
    //         sum += parseFloat(data[`${criteria}`]);
    //     }
    //     return sum / stockData.length;
    // }

    // Builds the Company Info panel shown in the Chart view.
    function setChartCompanyInfo(company) {
        document.querySelector("#companyChartInfoName").textContent = company.name;
        document.querySelector("#companyChartInfoSymbol").textContent = company.symbol;
        document.querySelector("#companyChartInfoDescription").textContent = company.description;

        /* Creating the Speaker that will say the company description. A new Speaker has to be made each
        /* time a new company is clicked, otherwise the speech utterance will repeat descriptions that
        /* have already been clicked. */
        document.querySelector('#speaker').innerHTML = "";
        const speakerImg = document.createElement('img');
        speakerImg.setAttribute('src', 'images/speaker.svg');
        speakerImg.addEventListener('click', () => {
            const speech = new SpeechSynthesisUtterance(`${company.description}`);
            speechSynthesis.speak(speech)
        });
        document.querySelector('#speaker').appendChild(speakerImg);
    }

    /* Creates event listener for the Filter search bar in the Company List panel. When the text
    *  field is populated, the list of companies 
    */
    function createFilter(companies) {
        const searchFilter = document.querySelector('#companySearch');
        searchFilter.addEventListener('input', function() {
            const matches = findMatches(searchFilter.value, companies);
            htmlCompanyList.innerHTML = "";
            setCompanyList(matches);
        });
    }

    // Returns a filtered array of Company objects whose names start with the given 'value' parameter. 
    function findMatches(value, companies) {
        return companies.filter(obj => {
            const regex = new RegExp(`^${value}`, 'i');
            return obj.name.match(regex);
          });
    }
});