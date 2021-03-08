const companiesAPI = "https://www.randyconnolly.com/funwebdev/3rd/api/stocks/companies.php";
const stockDataAPI = "https://www.randyconnolly.com/funwebdev/3rd/api/stocks/history.php?symbol=";

const currency = (num) => { return new Intl.NumberFormat('en-us', {style: 'currency', currency: 'USD'}).format(num); } // used for formatting dollar values

/* converts a currency to a number, to be used when sorting table data 
*  adopted from https://stackoverflow.com/questions/31197542/javascript-sort-for-currency-string*/
const asNumber = (currency) => {return Number(currency.replace(/($,)/g,''));} 
const defaultFinancialHTML = document.querySelector('#financials').innerHTML;
const defaultChartHTML = document.querySelector('#charts').innerHTML;
let map;

document.addEventListener('DOMContentLoaded', function() {

    const defaultViewElements = document.querySelectorAll(".defaultView");
    const chartViewElements = document.querySelectorAll(".chartView");
    const viewButtons = document.querySelectorAll(".changeViewButton");

    let htmlCompanyList = document.querySelector("#companyList"); // Node for the unordered list of companies.

    // Displays the assignment credits for five seconds after mousing over the pencil icon.
    document.querySelector('.credits').addEventListener('mouseover', function() {
        document.querySelector(".assignmentInfo").style.display = "inline-block";
        setTimeout(function() {
            document.querySelector(".assignmentInfo").style.display = "none";
        }, 5000)
    })

    // Adding event listeners for the button that switches between views.
    for (let button of viewButtons) {
        button.addEventListener('click', function() {
            button.id == "viewChartsButton" ? enableChartView() : enableDefaultView();
        })
    }

    // Hides all elements in the Default view and shows all elements in Chart view.
    function enableChartView() {
        for (let element of defaultViewElements) element.style.display = "none";
        for (let element of chartViewElements) element.style.display = "block";
    }

    // Hides all elements in the Chart view and shows all elements in Default view.
    function enableDefaultView() {
        for (let element of defaultViewElements) element.style.display = "block"; 
        for (let element of chartViewElements) element.style.display = "none";
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

    /* Initiates the creation of the company list panel, which will hold a list of companies with their own
     * event listeners that display company information when clicked. The search bar and clear button is also created.
     */
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
        const tableLoadingAnimation = document.querySelector('#stockDataLoadingAnimation');
        for (let company of companies) {
            let element = document.createElement('li');
            element.textContent = company.name;
            element.addEventListener('click', async function() {
                // On company click, fetch stock data about that company.
                tableLoadingAnimation.style.display = 'block';
                const response = await fetch(stockDataAPI + company.symbol);
                const stockData = await response.json();
                tableLoadingAnimation.style.display = 'none';

                if (company.financials == null) { // Some companies in the API are missing financial data. In those cases, the panels simply indicate as such.
                    document.querySelector('#charts').innerHTML = "No financial data found.";
                    document.querySelector('#financials').innerHTML = "No financial data found.";
                } else { // If companies do have financial data, the affected HTML panels are reset to their default state so they can be modified properly.
                    document.querySelector('#charts').innerHTML = defaultChartHTML;
                    document.querySelector('#financials').innerHTML = defaultFinancialHTML;
                }

                // Building each panel based on the clicked company.
                setCompanyInfo(company);
                setMap(company);
                setStockData(stockData);

                setChartCompanyInfo(company);
                setCharts(company, stockData);
                setFinancials(company);
            });
            htmlCompanyList.append(element); // appending the created element to the unordered list
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
    async function setStockData(stockData) {
        const tableHeaders = document.querySelectorAll('#stockDataTable .tableHead');

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

    // Populates the stock data table node with cells for all the stock data about a company. 
    function populateStockDataTable(stockData) {
        const tableBody = document.querySelector('#stockDataTable tbody');
        tableBody.innerHTML = "";
        for (let data of stockData) { 
            let row = document.createElement('tr'); // each piece of 'data' will be a single row in the table

            let dateCell = document.createElement('td'); // creating table cell nodes
            let openCell = document.createElement('td');
            let closeCell = document.createElement('td');
            let lowCell = document.createElement('td');
            let highCell = document.createElement('td');
            let volumeCell = document.createElement('td');

            dateCell.textContent = data.date; // populating created cell nodes with their respective data
            openCell.textContent = currency(data.open);
            closeCell.textContent = currency(data.close);
            lowCell.textContent = currency(data.low);
            highCell.textContent = currency(data.high);
            volumeCell.textContent = currency(data.volume);

            row.appendChild(dateCell); // adding created cells to the row
            row.appendChild(openCell);
            row.appendChild(closeCell);
            row.appendChild(lowCell);
            row.appendChild(highCell);
            row.appendChild(volumeCell);
            tableBody.appendChild(row); // adding the completed row to the table
        }
        populateStockSummaryTable(stockData);
    }

    // Populates the table nodes with the "summary" data about a company's stocks (averages, minimums, and maximums).
    function populateStockSummaryTable(stockData) {
        const openData = stockData.map(stock => stock.open); // creating arrays for each type of stock data
        const closeData = stockData.map(stock => stock.close);
        const lowData = stockData.map(stock => stock.low);
        const highData = stockData.map(stock => stock.high);
        const volumeData = stockData.map(stock => stock.volume);
        
        document.querySelector('#openAvgCell').textContent = currency(average(openData)); // populating averages
        document.querySelector('#closeAvgCell').textContent = currency(average(closeData));
        document.querySelector('#lowAvgCell').textContent = currency(average(lowData));
        document.querySelector('#highAvgCell').textContent = currency(average(highData));
        document.querySelector('#volumeAvgCell').textContent = currency(average(volumeData));

        document.querySelector('#openMinCell').textContent = currency(minimum(openData)); // populating minimums
        document.querySelector('#closeMinCell').textContent = currency(minimum(closeData));
        document.querySelector('#lowMinCell').textContent = currency(minimum(lowData));
        document.querySelector('#highMinCell').textContent = currency(minimum(highData));
        document.querySelector('#volumeMinCell').textContent = currency(minimum(volumeData));

        document.querySelector('#openMaxCell').textContent = currency(maximum(openData)); // populating maximums
        document.querySelector('#closeMaxCell').textContent = currency(maximum(closeData));
        document.querySelector('#lowMaxCell').textContent = currency(maximum(lowData));
        document.querySelector('#highMaxCell').textContent = currency(maximum(highData));
        document.querySelector('#volumeMaxCell').textContent = currency(maximum(volumeData));
    }

    // Returns the average of a given array of decimal numbers.
    function average(arr) {
        let sum = 0;
        for (let data of arr) sum += parseFloat(data);
        return sum / arr.length;
    }

    // Returns the minimum of a given array of decimal numbers.
    function minimum(arr) {
        let min = parseFloat(arr[0]);
        for (let data of arr) min = parseFloat(data) < min ? parseFloat(data) : min;
        return min;
    }

    // Returns the maximum of a given array of decimal numbers.
    function maximum(arr) {
        let max = parseFloat(arr[0]);
        for (let data of arr) max = parseFloat(data) > max ? parseFloat(data) : max;
        return max;
    }

    /* Builds the Charts panel, which contains a bar chart, a candlestick chart, and a line chart detailing
    *  different information about a given company. All charts are created using Apache ECharts.
    *
    *  NOTE: In order for the charts to have responsive widths, chart.resize() is called when the window resizes.
    *  However, ECharts has trouble rendering responsive charts when they're set to "display:none". That's why, 
    *  if charts need to be built, their display property is temporarily changed to "block".
    */
    function setCharts(company, stockData) {
        if (company.financials != null) document.querySelector('#charts').style.display = 'block';
        setBarChart(company);
        setCandlestickChart(stockData);
        setLineChart(stockData);
        document.querySelector('#charts').style.display = 'none';
    }

    //  Creates the bar chart, which displays a given company's financial information for 2019, 2018, and 2017.
    function setBarChart(company) {
        const barChart = echarts.init(document.querySelector('#barChartContainer'));
        const chart = {
            tooltip: {},
            legend: { data: ['Revenue', 'Earnings', 'Assets', 'Liabilities'] },
            xAxis: { data: ["2019", "2018", "2017"] },
            yAxis: {},
            grid: { 
                containLabel: true,
                left: 8,
                top: 40,
                right: 0,
                bottom: 0
            },
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
        /* Adopted resize event listeners from https://stackoverflow.com/questions/58370315/how-can-we-make-the-echarts-responsive (this source
        /* uses jQuery so I modified it to work with purely JS, but the inspiration came from there nonetheless).*/
        window.addEventListener('resize', () => { barChart.resize() });
    }

    // Creates the candlestick chart, which displays the average, minimum, and maximum data from a company's stock data.
    function setCandlestickChart(stockData) {
        const candlestickChart = echarts.init(document.querySelector('#candlestickChartContainer'));
        const openData = stockData.map(stock => stock.open);
        const closeData = stockData.map(stock => stock.close);
        const lowData = stockData.map(stock => stock.low);
        const highData = stockData.map(stock => stock.high);
        const chart = {
            tooltip: {},
            xAxis: {
                data: ['Average', 'Minimum', 'Maximum']
            },
            yAxis: {},
            grid: { 
                containLabel: true,
                left: 0,
                top: 40,
                right: 0,
                bottom: 0
            },
            series: [{
                type: 'k',
                data: [
                    [average(openData), average(closeData), average(lowData), average(highData)],
                    [minimum(openData), minimum(closeData), minimum(lowData), minimum(highData)],
                    [maximum(openData), maximum(closeData), maximum(lowData), maximum(highData)]
                ]
            }]
        }
        candlestickChart.setOption(chart);
        window.addEventListener('resize', () => { candlestickChart.resize() });
    }

    // Creates the line chart, which plots the 'close' and 'volume' values of a given company.
    function setLineChart(stockData) {
        const lineChart = echarts.init(document.querySelector('#lineChartContainer'));
        let volData = [];
        let closeData = [];
        let dates = [];
        for (let i = 0; i < stockData.length; i += 1) {
            volData.push(stockData[i].volume);
            closeData.push(stockData[i].close);
            dates.push(stockData[i].date);
        }
        const chart = {
            tooltip: {},
            legend: { data: ['Volume', 'Close'] },
            xAxis: { data: dates},
            yAxis: [{
                type: 'value',
                name: 'Volume',
            }, {
                type: 'value',
                name: 'Close',
                splitLine: {
                    show: false
                }
            }],
            grid: {
                containLabel: true,
                left: 20,
                top: 40,
                right: 20,
                bottom: 0
            },
            series: [{
                name: 'Volume',
                type: 'line',
                data: volData
            }, {
                name: 'Close',
                type: 'line',
                yAxisIndex: 1,
                data: closeData
            }],
        };
        lineChart.setOption(chart);
        window.addEventListener('resize', () => { lineChart.resize() });
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
            document.querySelector(`#rev${year}`).textContent = currency(revenues[years.indexOf(year)]);
            document.querySelector(`#earn${year}`).textContent = currency(earnings[years.indexOf(year)]);
            document.querySelector(`#asset${year}`).textContent = currency(assets[years.indexOf(year)]);
            document.querySelector(`#lia${year}`).textContent = currency(liabilities[years.indexOf(year)]);
        }
    }

    /* Creates event listener for the Filter search bar in the Company List panel. When the text
    *  field is populated, the list of companies filters to show company symbols that match the search.
    */
    function createFilter(companies) {
        const searchFilter = document.querySelector('#companySearch');
        searchFilter.addEventListener('change', function() {
            const matches = findMatches(searchFilter.value, companies);
            htmlCompanyList.innerHTML = "";
            setCompanyList(matches);
        });
    }

    // Returns a filtered array of Company objects whose symbols start with the given 'value' parameter. 
    function findMatches(value, companies) {
        return companies.filter(obj => {
            const regex = new RegExp(`^${value}`, 'i');
            return obj.symbol.match(regex);
        });
    }
});