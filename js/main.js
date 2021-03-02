const companiesAPI = "https://www.randyconnolly.com/funwebdev/3rd/api/stocks/companies.php";
const stockDataAPI = "https://www.randyconnolly.com/funwebdev/3rd/api/stocks/history.php?symbol=";

const currency = new Intl.NumberFormat('en-us', {style: 'currency', currency: 'USD'}); // used for formatting dollar values

/* converts a currency to a number, to be used when sorting table data 
*  solution adopted from https://stackoverflow.com/questions/31197542/javascript-sort-for-currency-string*/
const asNumber = (currency) => {return Number(currency.replace(/(^\$,)/g,''));} 
let map;

document.addEventListener('DOMContentLoaded', function() {

    const defaultViewElements = document.querySelectorAll(".defaultView");
    const chartViewElements = document.querySelectorAll(".chartView");
    const viewButtons = document.querySelectorAll(".changeViewButton");

    let htmlCompanyList = document.querySelector("#companyList"); // Node for the unordered list of companies

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

    /* Fetching the first set of data that will be used for this website. A list of clickable
     * companies will be created, and stock information about a company will be displayed when
     * it is clicked.
     */
    if (localStorage.getItem('companies')) {
        const data = JSON.parse(localStorage.getItem('companies'));
        createCompanyList(data);
    } else {
        fetch(companiesAPI)
            .then(resp => resp.json())
            .then (data => {
                localStorage.setItem('companies', JSON.stringify(data));
                createCompanyList(data);
            })
    }

    function createCompanyList(companies) {
        document.querySelector('#companyLoadingAnimation').style.display = 'none';

        document.querySelector('#clearButton').addEventListener('click', () => {
            document.querySelector('#companySearch').value = "";
            htmlCompanyList.innerHTML = "";
            setCompanyList(companies);
        });

        setCompanyList(companies);
        createFilter(companies);
    }

    /* Creates an <li> HTML element for each company and adds the event listener for each company on
    *  that list. When a company is clicked, each panel needs to be filled in with data about that
    *  company.
    */
    function setCompanyList(companies) {
        for (let company of companies) {
            let element = document.createElement('li');
            element.textContent = company.name;
            element.addEventListener('click', function() {
                setCompanyInfo(company);
                setMap(company);
                setStockData(company);

                setCharts(company);
                setChartCompanyInfo(company);
                setFinancials(company);
                
            });
            htmlCompanyList.append(element);
        }
    }

    /* Builds the Company Info panel in the Default View, displaying all general information about the company
    *  with data from the API. 
    */
    function setCompanyInfo(company) {
        document.querySelector('#companyLogo').setAttribute('src', `images/logos/${company.symbol}.svg`)
        document.querySelector('#companyName').textContent = company.name;
        document.querySelector('#companySymbol').textContent = company.symbol;

        document.querySelector('#companyInfoPanelBody').style.display = "flex";

        document.querySelector('#companyDescription').textContent = company.description;
        document.querySelector('#companySector').textContent = company.sector;
        document.querySelector('#companySubIndustry').textContent = company.subindustry;
        document.querySelector('#companyExchange').textContent = company.exchange;
        document.querySelector('#companyLocation').textContent = company.address;

        document.querySelector('#companyURL').textContent = company.website;
        document.querySelector('#companyURL').setAttribute('href', company.website);
    }

    // Builds the Map panel, showing the location of a given company using the Google Maps JavaScript API.
    function setMap(company) {
        map = new google.maps.Map(document.querySelector('#mapPanel'), {
            center: {lat: company.latitude, lng: company.longitude},
            zoom: 18
        });
    }

    /* Builds the Stock Data panel, displaying a table of 3 months of stock data from the given company. If
    *  a header on the table is clicked, the table will be sorted by that column going from least to greatest.
    */ 
    async function setStockData(company) {
        const tableLoadingAnimation = document.querySelector('#stockDataLoadingAnimation');
        const tableHeaders = document.querySelectorAll('#stockDataTable .tableHead');

        tableLoadingAnimation.style.display = 'block'; // display the loading animation during fetch
        const response = await fetch(stockDataAPI + company.symbol);
        const stockData = await response.json();
        tableLoadingAnimation.style.display = 'none'; // hide loading animation once fetch complete

        for (let header of tableHeaders) {
            header.addEventListener('click', () => {
                const sortBy = header.textContent.toLowerCase();
                stockData.sort(function(a, b) {
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
    }

    // Populates the table node with cells for all the stock data about a company. 
    function populateStockDataTable(stockData) {
        const tableBody = document.querySelector('#stockDataTable tbody');
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

    /* Builds the Charts panel, which contains a bar chart, a candlestick chart, and a line chart detailing
    *  different information about a given company.
    */
    function setCharts(company) {
        setBarChart(company);
    }

    function setBarChart(company) {
        const barChart = echarts.init(document.querySelector('#barChartContainer'));

        const chart = {
            title: { text: `Financials` },
            tooltip: {},
            legend: { data: ['Revenue', 'Earnings', 'Assets', 'Liabilities'] },
            xAxis: { data: ["2019", "2018", "2017"] },
            yAxis: {},
            grid: { containLabel: true },
            series: [{
                name: 'Revenue',
                type: 'bar',
                barGap: 0,
                data: [company.financials.revenue[0], company.financials.revenue[1], company.financials.revenue[2], ]
            }, {
                name: 'Earnings',
                type: 'bar',
                barGap: 0,
                data: [company.financials.earnings[0], company.financials.earnings[1], company.financials.earnings[2], ]
            }, {
                name: 'Assets',
                type: 'bar',
                barGap: 0,
                data: [company.financials.assets[0], company.financials.assets[1], company.financials.assets[2], ]
            }, {
                name: 'Liabilities',
                type: 'bar',
                barGap: 0,
                data: [company.financials.liabilities[0], company.financials.liabilities[1], company.financials.liabilities[2], ]
            }],

        };

        barChart.setOption(chart);
    }

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

    /* Builds the Financials panel, displaying a table of a given company's revenue, earnings, assets, and liabilities
    *  over 3 years.
    */ 
    function setFinancials(company) {
        const years = company.financials.years;
        const revenues = company.financials.revenue;
        const earnings = company.financials.earnings;
        const assets = company.financials.assets;
        const liabilities = company.financials.liabilities;
    
        /* The 'years' array stores year numbers at each index - 0 is 2019, 1 is 2018, and 2 is 2017. The arrays for each
        *  type of financial data also follow this pattern (revenues[0] is the revenue for 2019, revenues[1] is 2018, etc).
        *  This means that the index of a 'year' will be the same index of whichever financial data for that year.
        */
        for (let year of years) {
            document.querySelector(`#rev${year}`).textContent = currency.format(revenues[years.indexOf(year)]);
            document.querySelector(`#earn${year}`).textContent = currency.format(earnings[years.indexOf(year)]);
            document.querySelector(`#asset${year}`).textContent = currency.format(assets[years.indexOf(year)]);
            document.querySelector(`#lia${year}`).textContent = currency.format(liabilities[years.indexOf(year)]);
        }
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