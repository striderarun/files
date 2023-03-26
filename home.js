var IDMCDataApp = IDMCDataApp || {};

jQuery(function ($) {

    "use strict";
    $(document).ajaxSend(function() {
        $("#overlay").show();　
    });

    IDMCDataApp.Home = {
        init: function () {
            this.bindEvents();
        },

        bindEvents: function () {
            $('body')
                .on('click', '#generateReport', $.proxy(this.generateReport, this));
        },

        generateReport: function () {
            console.log('Calling modelserve new function')
            var predict = {
                "product_description":"Hackathon test data"
            }
            var that = this;
            that.postData("http://127.0.0.1:5000/execute", predict)
            .done(function(data) {
                $("#overlay").hide();
                var reports = data.report
                var products = []
                var unitsSold = []
                var revenue = []
                var profit = []
                var margin = []
                for (var i=0; i<reports.length; i++) {
                    products.push(reports[i].product);
                    unitsSold.push(reports[i].units);
                    revenue.push(reports[i].revenue);
                    profit.push(reports[i].profit);
                    margin.push(reports[i].margin);
                }
                that.columnChart(products, unitsSold, revenue, profit, margin);
            });
        },

        columnChart: function(products, units, revenue, profit, margin) {
            console.log(products);
            console.log(units);
            console.log(revenue);
            console.log(profit);
            console.log(margin);
            Highcharts.chart('container', {
                chart: {
                    type: 'column'
                },
                title: {
                    text: 'Monthly Product Sales Report'
                },
                subtitle: {
                    text: 'Region: Middle East'
                },
                xAxis: {
                    categories: products,
                    crosshair: true
                },
                yAxis: {
                    min: 0,
                    title: {
                        text: 'Sales'
                    }
                },
                tooltip: {
                    headerFormat: '<span style="font-size:10px">{point.key}</span><table>',
                    pointFormat: '<tr><td style="color:{series.color};padding:0">{series.name}: </td>' +
                        '<td style="padding:0"><b>{point.y:.1f} </b></td></tr>',
                    footerFormat: '</table>',
                    shared: true,
                    useHTML: true
                },
                plotOptions: {
                    column: {
                        pointPadding: 0.2,
                        borderWidth: 0
                    }
                },
                series: [{
                    name: 'Total Units Sold',
                    data: units
                }, {
                    name: 'Revenue',
                    data: revenue
                }, {
                    name: 'Profit',
                    data: profit
                }, {
                    name: 'Margin %',
                    data: margin

                }]
            });
        },

        postData : function (url, data) {
            var headerMap = {
                'Content-Type' : 'application/json',
                'Accept' : 'application/json'
            }
            return $.ajax({
                url : url,
                type : 'POST',
                data : JSON.stringify(data),
                headers : headerMap
            });
        },

        getData : function (url, params) {
            var headerMap = {
                'Content-Type' : 'application/json',
                'Accept' : 'application/json'
            }
            return $.ajax({
                url : url,
                type : 'GET',
                data : {},
                headers : headerMap
            });
        },
    };

    IDMCDataApp.Home.init();
});