sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    'sap/m/MessageToast'
], (Controller, JSONModel, Filter, FilterOperator, MessageToast) => {
    "use strict";
    var that;

    return Controller.extend("vcpapp.heatmapcl.controller.Home", {
        onInit() {
            that = this;
            that.oModel = that.getOwnerComponent().getModel("oModel");
            that.pivotPage = that.byId("idPivotPagePOP");
        },
        async onAfterRendering() {
            that.byId("toolBar").setVisible(false);
            await this._loadYear();
            await this.loadAll();
        },
        loadAll() {
            return new Promise((resolve, reject) => {
                that.oModel.read("/getfactorylocdesc", {
                    urlParameters: {
                        "$apply": "groupby((DEMAND_LOC,PRODUCT_ID,REF_PRODID))",
                        "$top": 50000
                    },
                    success: function (oData) {
                        that.getView().setBusy(false);

                        that.facdata = oData.results;

                        // LOCATION_ID
                        let uniqueLocs = [...new Set(oData.results.map(d => d.DEMAND_LOC))];
                        let oModel = new JSONModel(uniqueLocs.map(l => ({ key: l, text: l })));
                        that.byId("mcLocation").setModel(oModel);
                        that.byId("mcLocation").bindItems("/", new sap.ui.core.Item({ key: "{key}", text: "{text}" }));

                        // CONFIG_PRODUCT
                        let congifprod = [...new Set(oData.results.map(o => o.REF_PRODID))];
                        let oConfigModel = new JSONModel(congifprod.map(c => ({ key: c, text: c })));
                        that.byId("mcConfig").setModel(oConfigModel);
                        that.byId("mcConfig").bindItems("/", new sap.ui.core.Item({ key: "{key}", text: "{text}" }));

                        // PRODUCT_ID
                        let prodId = [...new Set(oData.results.map(o => o.PRODUCT_ID))];
                        let oProdModel = new JSONModel(prodId.map(c => ({ key: c, text: c })));
                        that.byId("mcProduct").setModel(oProdModel);
                        that.byId("mcProduct").bindItems("/", new sap.ui.core.Item({ key: "{key}", text: "{text}" }));

                        resolve(oData.results);
                    }.bind(this),
                    error: function (err) {
                        that.getView().setBusy(false);
                        reject(err);
                    }
                });
            });
        },
        _loadYear: function () {
            return new Promise((resolve, reject) => {
                that.byId("mcYear").setBusy(true);

                that.oModel.read("/getClusterHeatmap", {
                    urlParameters: {
                        "$select": "YEAR",
                        "$apply": "groupby((YEAR))"
                    },
                    success: function (oData) {
                        that.byId("mcYear").setBusy(false);

                        let years = oData.results.map(o => ({ key: o.YEAR, text: o.YEAR }));
                        that.byId("mcYear").setModel(new JSONModel(years));
                        that.byId("mcYear").bindItems("/", new sap.ui.core.Item({
                            key: "{key}",
                            text: "{text}"
                        }));

                        resolve(oData.results);
                    },
                    error: function (e) {
                        that.byId("mcYear").setBusy(false);
                        console.log(e);
                        reject(e);
                    }
                });
            });
        },
        onchageProd: function () {
            let aYear = this.byId("mcYear").getSelectedKeys();
            let aLocs = this.byId("mcLocation").getSelectedKeys();
            let aConfigs = this.byId("mcConfig").getSelectedKeys();
            let aProducts = this.byId("mcProduct").getSelectedKeys();

            const aFilters = [];

            if (aYear.length === 0) return;
            if (aLocs.length === 0) return;
            if (aConfigs.length === 0) return;
            if (aProducts.length === 0) return;

            if (aLocs.length) {
                aFilters.push(new Filter(aLocs.map(loc => new Filter("LOCATION_ID", FilterOperator.EQ, loc)), false));
            }
            if (aConfigs.length) {
                aFilters.push(new Filter(aConfigs.map(c => new Filter("CONFIG_PRODUCT", FilterOperator.EQ, c)), false));
            }
            if (aProducts.length) {
                aFilters.push(new Filter(aProducts.map(p => new Filter("PRODUCT_ID", FilterOperator.EQ, p)), false));
            }
            if (aYear.length) {
                aFilters.push(new Filter(aYear.map(p => new Filter("YEAR", FilterOperator.EQ, p)), false));
            }

            const filter = new Filter(aFilters, true);


            that.getView().setBusy(true);


            // let aFilters = aLocs.map(loc => new Filter("LOCATION_ID", FilterOperator.EQ, loc));
            // const filterData = {
            //     "YEAR": aYear,
            //     "LOCATION_ID": aLocs,
            //     "CONFIG_PRODUCT": aConfigs,
            //     "PRODUCT_ID": aProducts
            // };
            // const groupbyFields = ["LOCATION_ID", "CLUSTER_ID", "PRIMARY_ID", "CHAR_DESC", "YEAR", "PRODUCT_ID"];
            // const measures = [
            //     { field: "ORD_QTY", operation: "sum" }
            // ];
            // const applyQuery = that.makeApplyQuery(filterData, groupbyFields, measures);
            that.oModel.read("/getClusterHeatmap", {
                filters: [filter],
                // urlParameters: { "$apply": applyQuery + "/orderby(CLUSTER_ID)", "$top": 50000 },
                urlParameters: {
                    "$select": "CLUSTER_ID, PRIMARY_ID, CHAR_DESC",// Select only needed fields,
                    "$top": 50000
                },
                success: function (oData) {
                    that.getView().setBusy(false);

                    that.FilterData = oData.results;

                    // CLUSTER_ID with "Select All"
                    let clusterId = [...new Set(oData.results.map(o => o.CLUSTER_ID).sort((a, b) => a - b))];
                    let oClusterModel = new JSONModel(clusterId.map(c => ({ key: c, text: c })));
                    that.byId("mcCluster").setModel(oClusterModel);
                    that.byId("mcCluster").bindItems("/", new sap.ui.core.Item({ key: "{key}", text: "{text}" }));

                    let priId = [...new Set(oData.results.map(o => o.PRIMARY_ID).sort((a, b) => a - b))];
                    let priModle = new JSONModel(priId.map(c => ({ key: c, text: c })));
                    that.byId("mcPrimary").setModel(priModle);
                    that.byId("mcPrimary").bindItems("/", new sap.ui.core.Item({ key: "{key}", text: "{text}" }));

                    // CHAR_DESC
                    let charDesc = [...new Set(oData.results.map(o => o.CHAR_DESC))];
                    that.byId("mcChar").setModel(new JSONModel(charDesc.map(c => ({ key: c, text: c }))));
                    that.byId("mcChar").bindItems("/", new sap.ui.core.Item({ key: "{key}", text: "{text}" }));

                    // let quar = [...new Set(oData.results.map(o => o.QUARTER))];
                    // this.byId("idQuar").setModel(new JSONModel(quar.map(c => ({ key: c, text: c }))));
                    // this.byId("idQuar").bindItems("/", new sap.ui.core.Item({ key: "{key}", text: "{text}" }));

                },
                error: function (oError) {
                    debugger
                    console.error("Error fetching getClusterHeatmap:", oError);
                }
            });
        },
        onChnageCluster() {
            const clus = this.byId("mcCluster").getSelectedKeys().map(c => Number(c));
            if (!clus.length) return;
            let aLocs = this.byId("mcLocation").getSelectedKeys();
            let fData = [];
            if (clus.length === 0)
                fData = that.FilterData.filter(o => aLocs.includes(o.LOCATION_ID))
            else
                fData = that.FilterData.filter(o => clus.includes(o.CLUSTER_ID) && aLocs.includes(o.LOCATION_ID))
            let priId = [...new Set(fData.map(o => o.PRIMARY_ID).sort((a, b) => a - b))];
            let priModle = new JSONModel(priId.map(c => ({ key: c, text: c })));
            this.byId("mcPrimary").setModel(priModle);
            this.byId("mcPrimary").bindItems("/", new sap.ui.core.Item({ key: "{key}", text: "{text}" }));
            // CHAR_DESC
            let charDesc = [...new Set(fData.map(o => o.CHAR_DESC))];
            this.byId("mcChar").setModel(new JSONModel(charDesc.map(c => ({ key: c, text: c }))));
            this.byId("mcChar").bindItems("/", new sap.ui.core.Item({ key: "{key}", text: "{text}" }));


        },
        onLocationSelect() {
            let aLocs = this.byId("mcLocation").getSelectedKeys();
            const fData = that.facdata.filter(o => aLocs.includes(o.DEMAND_LOC))
            let congifprod = [...new Set(fData.map(o => o.REF_PRODID))];
            let oConfigModel = new JSONModel(congifprod.map(c => ({ key: c, text: c })));
            this.byId("mcConfig").setModel(oConfigModel);
            this.byId("mcConfig").bindItems("/", new sap.ui.core.Item({ key: "{key}", text: "{text}" }));

            // PRODUCT_ID
            let prodId = [...new Set(fData.map(o => o.PRODUCT_ID))];
            let oProdModel = new JSONModel(prodId.map(c => ({ key: c, text: c })));
            this.byId("mcProduct").setModel(oProdModel);
            this.byId("mcProduct").bindItems("/", new sap.ui.core.Item({ key: "{key}", text: "{text}" }));

            // // CLUSTER_ID with "Select All"
            // let clusterId = [...new Set(fData.map(o => o.CLUSTER_ID).sort((a, b) => a - b))];
            // let oClusterModel = new JSONModel(clusterId.map(c => ({ key: c, text: c })));
            // this.byId("mcCluster").setModel(oClusterModel);
            // this.byId("mcCluster").bindItems("/", new sap.ui.core.Item({ key: "{key}", text: "{text}" }));

            // let priId = [...new Set(fData.map(o => o.PRIMARY_ID).sort((a, b) => a - b))];
            // let priModle = new JSONModel(priId.map(c => ({ key: c, text: c })));
            // this.byId("mcPrimary").setModel(priModle);
            // this.byId("mcPrimary").bindItems("/", new sap.ui.core.Item({ key: "{key}", text: "{text}" }));

            // YEAR
            // let Year = [...new Set(fData.map(o => o.YEAR))];
            // this.byId("mcYear").setModel(new JSONModel(Year.map(c => ({ key: c, text: c }))));
            // this.byId("mcYear").bindItems("/", new sap.ui.core.Item({ key: "{key}", text: "{text}" }));

            // // CHAR_DESC
            // let charDesc = [...new Set(fData.map(o => o.CHAR_DESC))];
            // this.byId("mcChar").setModel(new JSONModel(charDesc.map(c => ({ key: c, text: c }))));
            // this.byId("mcChar").bindItems("/", new sap.ui.core.Item({ key: "{key}", text: "{text}" }));
        },
        onApplyFilters: function () {
            let aLocs = this.byId("mcLocation").getSelectedKeys();
            let aConfigs = this.byId("mcConfig").getSelectedKeys();
            let aProducts = this.byId("mcProduct").getSelectedKeys();
            let aClusters = this.byId("mcCluster").getSelectedKeys();
            let aPriMary = this.byId("mcPrimary").getSelectedKeys();
            let aYear = this.byId("mcYear").getSelectedKeys();
            let aChar = this.byId("mcChar").getSelectedKeys();
            // let quar = this.byId("idQuar").getSelectedKeys();

            let aFilters = [];

            if (!aLocs.length || !aYear.length || !aConfigs.length || !aProducts.length)
                return MessageToast.show("Please Select Mandatory Field")

            that.getView().setBusy(true)



            // if (aLocs.length) {
            //     aFilters.push(new Filter(aLocs.map(loc => new Filter("LOCATION_ID", FilterOperator.EQ, loc)), false));
            // }
            // if (aConfigs.length) {
            //     aFilters.push(new Filter(aConfigs.map(c => new Filter("CONFIG_PRODUCT", FilterOperator.EQ, c)), false));
            // }
            // if (aProducts.length) {
            //     aFilters.push(new Filter(aProducts.map(p => new Filter("PRODUCT_ID", FilterOperator.EQ, p)), false));
            // }

            // if (aClusters.length) {
            //     aFilters.push(new Filter(aClusters.map(clu => new Filter("CLUSTER_ID", FilterOperator.EQ, clu)), false));
            // }

            // if (aYear.length) {
            //     aFilters.push(new Filter(aYear.map(y => new Filter("YEAR", FilterOperator.EQ, y)), false));
            // }

            // if (aChar.length) {
            //     aFilters.push(new Filter(aChar.map(a => new Filter("CHAR_DESC", FilterOperator.EQ, a)), false));
            // }
            //  if (quar.length) {
            //     aFilters.push(new Filter(quar.map(a => new Filter("QUARTER", FilterOperator.EQ, a)), false));
            // }

            const filterData = {
                "LOCATION_ID": aLocs,         // array of selected locations
                "CONFIG_PRODUCT": aConfigs,   // array of selected configurations
                "PRODUCT_ID": aProducts,      // array of selected products
                "CLUSTER_ID": aClusters.map(c => Number(c)),      // array of selected clusters
                "PRIMARY_ID": aPriMary.map(c => Number(c)),
                "YEAR": aYear,
                "CHAR_DESC": aChar
            };
            const groupbyFields = [
                "CLUSTER_ID",
                "CLUSTER_SORT_SEQ",
                "PRIMARY_ID_SEQUENCE",
                "PRIMARY_ID",
                "CHAR_NUM",
                "CHAR_DESC",
                "CHARVAL_NUM",
                "CHAR_SEQUENCE",
                "COLOR_CODE",
                "YEAR",
                "UNIQUE_ID_COLOR"
            ];
            const measures = [
                { field: "ORD_QTY", operation: "sum" }
            ];
            const applyQuery = that.makeApplyQuery(filterData, groupbyFields, measures);

            that.oModel.read("/getClusterHeatmap", {
                urlParameters: {
                    "$apply": applyQuery + "/orderby(CLUSTER_SORT_SEQ,PRIMARY_ID_SEQUENCE)",
                    "$top": 50000
                },
                success: function (oData) {
                    that.getView().setBusy(false)
                    let aData = oData.results;

                    // Create base maps
                    that.myMap = new Map(aData.map(item => [item.CHARVAL_NUM, item]));
                    that.myMapCHAR = new Map(aData.map(item => [item.CHAR_DESC, item]));
                    that.myMapMore = new Map(aData.map(item => [`${item.CHARVAL_NUM}_${item.CHAR_DESC}`, item]));

                    const myMapPrId = new Map();

                    // Group by PRIMARY_ID and find the item with max CHAR_SEQUENCE
                    const grouped = aData.reduce((acc, item) => {
                        const key = item.PRIMARY_ID + "";
                        if (!acc[key]) {
                            acc[key] = [];
                        }
                        acc[key].push(item);
                        return acc;
                    }, {});

                    Object.entries(grouped).forEach(([key, items]) => {
                        // Find the item with the maximum CHAR_SEQUENCE
                        const maxSeqItem = items.reduce((max, curr) =>
                            curr.CHAR_SEQUENCE > max.CHAR_SEQUENCE ? curr : max
                        );

                        // If there are multiple entries with the same PRIMARY_ID and CHAR_SEQUENCE max,
                        // sum their ORD_QTY_SUM values.
                        const totalQty = items
                            .filter(i => i.CHAR_SEQUENCE === maxSeqItem.CHAR_SEQUENCE)
                            .reduce((sum, i) => sum + Number(i.ORD_QTY_SUM || 0), 0);

                        // Create entry in the map
                        myMapPrId.set(key, { ...maxSeqItem, ORD_QTY_SUM: totalQty });
                    });

                    that.myMapPrId = myMapPrId;

                    // Create derived array and unique order quantities
                    const ORD_QTY = [];
                    aData.forEach(o => {
                        const key = o.PRIMARY_ID + "";
                        const sumValue = myMapPrId.get(key).ORD_QTY_SUM;
                        o.PRIMARY_ID_ORDER = `${o.PRIMARY_ID}(${sumValue})`;
                        ORD_QTY.push(Number(sumValue));
                    });

                    let ordeQts = [...new Set(ORD_QTY)];
                    that.ordeQts = ordeQts;

                    const minPx = 3;   // smallest row height
                    const maxPx = 100;  // largest row height

                    // find min & max in your data
                    // const minVal = Math.min(...ordeQts);
                    // const maxVal = Math.max(...ordeQts);

                    // // normalize each value into px range
                    // const heights = ordeQts.map(v => {
                    //     return ((v - minVal) / (maxVal - minVal)) * (maxPx - minPx) + minPx;
                    // });
                    // // aData.sort((a, b) => {
                    // //     return b.CLUSTER_SORT_SEQ - a.CLUSTER_SORT_SEQ;
                    // // });
                    // that.heights = heights;

                    that.allData = aData;
                    that.loadPivotTab(aData);
                }.bind(this),
                error: function (oError) {
                    console.error("Error fetching getClusterHeatmap:", oError);
                }
            });
        },
        changeLabel: function (json) {
            const headers = [];
            const keys = Object.keys(json[0]);
            keys.forEach(key => {
                let label;
                switch (key) {
                    case "LOCATION_ID":
                        label = "Parent Location";
                        break;
                    case "LOCATION_DESC":
                        label = "Location Description";
                        break;
                    case "REF_PRODID":
                        label = "Product";
                        break;
                    case "PROD_DESC":
                        label = "Product Description";
                        break;
                    case "SALES_DOC":
                        label = "Sales Document";
                        break;
                    case "UNIQUE_ID":
                        label = "Unique Id";
                        break;
                    case "SALESDOC_ITEM":
                        label = "Sales Doc. Item";
                        break;
                    case "MANU_LOC":
                        label = "Component Location";
                        break;
                    case "COMPONENT":
                        label = "Component";
                        break;
                    case "ORD_TYPE":
                        label = "Order Type";
                        break;
                    case "MAT_PARENT":
                        label = "Parent";
                        break;
                    case "COMP_QTY_SUM":
                        label = "Component Qty (Total)";
                        break;
                    case "COMP_QTY":
                        label = "Component Qty";
                        break;
                    case "COMP_PROCURE_TYPE":
                        label = "Procurement Type";
                        break;
                    case "PROD_ORDER":
                        label = "Order #";
                        break;
                    case "WEEK_DATE":
                        label = "Week Start Date";
                        break;
                    case "TELESCOPIC_WEEK":
                        label = "Telescopic Week";
                        break;
                    case "CALENDAR_WEEK":
                        label = "Calendar Week";
                        break;
                    // New JSON fields
                    case "CONFIG_PRODUCT":
                        label = "Configurable Product";
                        break;
                    case "PRODUCT_ID":
                        label = "Product ID";
                        break;
                    case "MAT_AVAILDATE":
                        label = "Material Availability Date";
                        break;
                    case "CLUSTER_ID":
                        label = "Cluster ID";
                        break;
                    case "CLUSTER_SORT_SEQ":
                        label = "Cluster Sort Sequence";
                        break;
                    case "PRIMARY_ID_SEQUENCE":
                        label = "Primary ID Sequence";
                        break;
                    case "PRIMARY_ID":
                        label = "Primary ID";
                        // label = "  ";
                        break;
                    case "PRIMARY_ID_ORDER":
                        // label = "PRIMARY_ID_ORDER";
                        label = "  ";
                        break;
                    case "CHAR_NUM":
                        label = "Characteristic Number";
                        break;
                    case "CHAR_DESC":
                        label = " ";
                        break;
                    case "CHARVAL_NUM":
                        label = "Characteristic Value Number";
                        break;
                    case "ORD_QTY_SUM":
                        label = "Order Quantity";
                        break;
                    case "COLOR_CODE":
                        label = "Color Code";
                        break;
                    case "CHAR_SEQUENCE":
                        label = "Characteristic Sequence";
                        break;
                    case "WEIGHTAGE":
                        label = "Weightage";
                        break;
                    case "RANK_COLUMN":
                        label = "Rank";
                        break;
                    case "PID_FLAG":
                        label = "Product ID Flag";
                        break;
                    case "CHAR_FLAG":
                        label = "Characteristic Flag";
                        break;
                    case "CALCULATED_RANK":
                        label = "Calculated Rank";
                        break;
                    case "YEAR":
                        label = "Year";
                        break;
                    case "YEAR_MONTH":
                        label = "Year-Month";
                        break;
                    case "QUARTER":
                        label = "Quarter";
                        break;
                    case "YEAR_QUAETER":
                        label = "Year-Quarter";
                        break;
                    default:
                        label = key;
                        break;
                }
                headers.push(label);
            });


            const data = json.map(item => Object.values(item));
            return [headers, ...data];
        },
        loadPivotTab(data) {
            // that.oGModel.setProperty("/showPivot", true);
            if (that.byId("idPrp").getSelected()) {
                data = data.filter(o => o.UNIQUE_ID_COLOR === 0);
            }
            that.byId("toolBar").setVisible(true);
            var newDiv = document.createElement("div");
            newDiv.id = `pivotGrid`;
            newDiv.textContent = "";
            var existingDiv = document.querySelector(`[id*='mainDivPOP']`);

            existingDiv.appendChild(newDiv);
            var pivotDiv = document.querySelector(`[id*='pivotGrid']`);
            if (data.length === 0) {
                // that.oGModel.setProperty("/showPivot", false);
                pivotDiv.innerHTML = "";
                MessageToast.show("No Data");
                that.pivotPage.setBusy(false);

                return;
            }
            that.pivotPage.setBusy(true);
            if (window.jQuery && window.jQuery.fn.pivot) {
                var pivotData = that.changeLabel(data);
                pivotDiv = $(pivotDiv);
                $(pivotDiv).pivot(pivotData, {
                    rows: ["  "],
                    cols: [" "],
                    aggregator: $.pivotUtilities.aggregators["List Unique Values"](["Characteristic Value Number"]),
                    rendererOptions: {
                        table: {
                            colTotals: false,
                            rowTotals: false,
                        }
                    },
                    sorters: {
                        "  ": () => 0,
                        " ": function (a, b) {
                            const aCHAR_SEQUENCE = that.myMapCHAR.get(a).CHAR_SEQUENCE;
                            const bCHAR_SEQUENCE = that.myMapCHAR.get(b).CHAR_SEQUENCE;


                            return aCHAR_SEQUENCE - bCHAR_SEQUENCE;
                        }
                        // "  ": function (a, b) {
                        //     a = a.split("(")[0];
                        //     b = b.split("(")[0];
                        //     const aCLUSTER_SORT_SEQ = that.myMapPrId.get(a).CLUSTER_SORT_SEQ;
                        //     const bCLUSTER_SORT_SEQ = that.myMapPrId.get(b).CLUSTER_SORT_SEQ;

                        //     const aPRIMARY_ID_SEQUENCE = that.myMapPrId.get(a).PRIMARY_ID_SEQUENCE;
                        //     const bPRIMARY_ID_SEQUENCE = that.myMapPrId.get(b).PRIMARY_ID_SEQUENCE;
                        //     if (aCLUSTER_SORT_SEQ !== bCLUSTER_SORT_SEQ) {
                        //         return bCLUSTER_SORT_SEQ - aCLUSTER_SORT_SEQ;
                        //     }
                        //     return bPRIMARY_ID_SEQUENCE - aPRIMARY_ID_SEQUENCE;
                        // }
                    },
                });
                that.loadPivotCss();
                that.pivotPage.setBusy(false);
            } else {
                console.error("Pivot.js or jQuery is not loaded yet.");
                that.pivotPage.setBusy(false);
            }
        },
        loadPivotCss() {
            $(".pvtTable").ready(function () {
                setTimeout(function () {
                    // Adjust vertical alignment for headers with large rowspan
                    $(".pvtTable")
                        .find("th[rowspan]")
                        .each(function () {
                            if (parseInt($(this).attr("rowspan")) > 7) {
                                $(this).css("vertical-align", "top");
                            }
                        });


                    // Freeze columns in thead
                    function freezeHeaderColumns() {
                        // Process first row of thead
                        const firstHeadRow = $(".pvtTable").find("thead tr:first");
                        if (firstHeadRow.length) {
                            let widthsHead = [0];

                            // Calculate cumulative widths for first 3 columns (Location, Product, Assembly)
                            const columnsToFreeze = Math.min(
                                2,
                                firstHeadRow.find("th").length
                            );
                            // const columnsToFreeze = 2;
                            for (let i = 0; i < columnsToFreeze; i++) {
                                const th = firstHeadRow.find(`th:eq(${i})`);
                                if (th.length) {
                                    const borderWidth =
                                        parseFloat(th.css("border-left-width") || "0") +
                                        parseFloat(th.css("border-right-width") || "0");
                                    const paddingWidth =
                                        parseFloat(th.css("padding-left") || "0") +
                                        parseFloat(th.css("padding-right") || "0");
                                    const width =
                                        parseFloat(th.css("width") || "0") +
                                        borderWidth +
                                        paddingWidth;
                                    widthsHead.push(widthsHead[i] + width);
                                }
                            }

                            // Apply freeze positioning
                            firstHeadRow.find("th").each(function (index) {
                                if (index < columnsToFreeze) {
                                    $(this).addClass("frezzThead");
                                    $(this).css("left", `${widthsHead[index]}px`);
                                }
                            });
                        }

                        // Process second row of thead (axis labels)
                        const secondHeadRow = $(".pvtTable").find("thead tr:eq(1)");
                        if (secondHeadRow.length) {
                            let widthsHead2 = [0];
                            const thElements = secondHeadRow.find("th");
                            const columnsToFreeze = thElements.length;

                            // Calculate widths for columns to freeze
                            for (let i = 0; i < columnsToFreeze; i++) {
                                const th = thElements.eq(i);
                                const borderWidth =
                                    parseFloat(th.css("border-left-width") || "0") +
                                    parseFloat(th.css("border-right-width") || "0");
                                const paddingWidth =
                                    parseFloat(th.css("padding-left") || "0") +
                                    parseFloat(th.css("padding-right") || "0");
                                const width =
                                    parseFloat(th.css("width") || "0") +
                                    borderWidth +
                                    paddingWidth;
                                widthsHead2.push(widthsHead2[i] + width);
                            }

                            // Apply freeze positioning
                            thElements.each(function (index) {
                                if (index < columnsToFreeze) {
                                    $(this).addClass("frezzThead");
                                    $(this).css("left", `${widthsHead2[index]}px`);
                                }
                            });
                        }
                    }

                    // Freeze columns in tbody
                    function freezeBodyColumns() {
                        const tbody = $(".pvtTable").find("tbody");
                        if (!tbody.length) return;

                        // Find row with most th elements to use as reference
                        let maxThCount = 0;
                        let referenceRow = null;

                        tbody.find("tr").each(function () {
                            const thCount = $(this).find("th").length;
                            if (thCount > maxThCount) {
                                maxThCount = thCount;
                                referenceRow = $(this);
                            }
                        });

                        if (!referenceRow || maxThCount === 0) return;

                        // Calculate cumulative widths for the columns to freeze
                        let widths = [0];
                        for (let i = 0; i < maxThCount; i++) {
                            const th = referenceRow.find(`th:eq(${i})`);
                            if (th.length) {
                                const borderWidth =
                                    parseFloat(th.css("border-left-width") || "0") +
                                    parseFloat(th.css("border-right-width") || "0");
                                const paddingWidth =
                                    parseFloat(th.css("padding-left") || "0") +
                                    parseFloat(th.css("padding-right") || "0");
                                const width =
                                    parseFloat(th.css("width") || "0") +
                                    borderWidth +
                                    paddingWidth;
                                widths.push(widths[i] + width);
                            }
                        }

                        // Apply freeze positioning to each row

                        // const containerWidth = $('.mainDivClass').width();
                        // const columnCount = maxThCount;
                        // const maxColumnWidth = Math.floor(containerWidth / columnCount);

                        // widths = widths.map(width => Math.min(width, maxColumnWidth));
                        tbody.find("tr").each(function () {
                            const thElements = $(this).find("th");
                            const currentThCount = thElements.length;

                            thElements.each(function (index) {
                                // Adjust for rows with fewer th elements than the reference row
                                let positionIndex = index;
                                if (currentThCount < maxThCount) {
                                    // Calculate offset based on hierarchy level
                                    positionIndex += maxThCount - currentThCount;
                                }

                                $(this).addClass("frezz");
                                $(this).css("left", `${widths[positionIndex]}px`);


                            })

                            const forstTh = $(this).find("th:first")[0].textContent;

                            const order_qty = Number(forstTh.split("(")[1].split(")")[0]);
                            // const minPx = 2;   // smallest row height
                            // const maxPx = 40;  // largest row height

                            // const minPx = 1;   // smallest possible row height
                            // const maxPx = 15;  // a much smaller max height


                            // const minVal = Math.min(...that.ordeQts);
                            // const maxVal = Math.max(...that.ordeQts);

                            // const pId = forstTh.split('(')[0];\]
                            const PItem = that.myMapPrId.get(forstTh.split('(')[0]);

                            if (PItem?.UNIQUE_ID_COLOR == 0) {
                                $(this).find('th:first').addClass('BlackFont')
                            }

                            const lineHeight = Number(order_qty) * 0.01;

                            $($(this).find('th:first')).css('line-height', lineHeight);
                            $(this).find('td').css('line-height', lineHeight);

                            // normalize each value into px range
                            // const heights =
                            //     ((order_qty - minVal) / (maxVal - minVal)) * (maxPx - minPx) + minPx;
                            // $(this).height(heights);
                        });
                    }

                    // Format number cells (remove decimals, replace empty cells with 0)
                    function formatCells() {
                        const bSelected = that.byId("idCharCheck").getSelected();
                        $(".pvtTable")
                            .find("td")
                            .each(function () {
                                let cellText = $(this).text().trim();
                                const item = that.myMap.get(cellText);
                                let color;
                                if (item) {
                                    color = item.COLOR_CODE;
                                }
                                if (color) {
                                    $(this).css("background-color", color);
                                    if (bSelected) {
                                        // Checkbox is checked = Hide characteristics
                                        $(this).css("color", "transparent"); // Make text invisible
                                    } else {
                                        // Checkbox is unchecked = Show characteristics
                                        $(this).css("color", "#ffffff");
                                    }
                                }
                                $(this).addClass("hoverCell");
                                const popoverHtml = `
   <div class="popover" id="globalPopover">
    <div class="popover-content">
        <div class="date-row">
            <span class="label" style="font-size: 13px;">Primary ID: </span>
            <span class="PrimaryId" style="color: blue; font-size: 14px;"></span>
        </div>
        <div class="date-row">
            <span class="label" style="font-size: 13px;">Cluster ID: </span>
            <span class="ClusterId" style="color: blue; font-size: 14px;"></span>
        </div>
        <div class="date-row">
            <span class="label" style="font-size: 13px;">Char Val: </span>
            <span class="CharValNum" style="color: blue; font-size: 14px;"></span>
        </div>
        <div class="date-row">
            <span class="label" style="font-size: 13px;">Order Qty: </span>
            <span class="OrderQty" style="color: blue; font-size: 14px;"></span>
        </div>
    </div>
</div>`



                                // Add popover to header cell
                                $(this).append(popoverHtml);

                                // On hover, update date
                                $(this).hover(function () {
                                    const colHeader = $(".pvtTable").find("thead tr:first").find(`th:eq(${$(this).index() + 1})`)[0].textContent;
                                    const rowHeader = $(".pvtTable").find(`tr:eq(${$(this).parent().index() + 2})`).find("th:first")[0].textContent
                                    that.updateDate($(this), cellText, colHeader, rowHeader);
                                });
                            });
                    }

                    // Execute all functions
                    freezeHeaderColumns();
                    freezeBodyColumns();
                    formatCells();
                }, 300); // Delay to ensure table is fully rendered
            });
        },
        updateDate($cell, charDesc, colHeader, rowHeader) {
            const pId = rowHeader.split("(")[0];
            const order_qty = rowHeader.split("(")[1];
            const item = that.myMapMore.get(charDesc + "_" + colHeader);
            const popover = $cell.find(".popover");

            if (item) {
                popover.find(".PrimaryId").text(pId);
                popover.find(".ClusterId").text(item.CLUSTER_ID);
                popover.find(".CharValNum").text(item.CHARVAL_NUM);
                popover.find(".OrderQty").text(order_qty.split(")")[0]);
            }
        },
        makeApplyQuery(filterData, groupbyFields, measures) {
            let st = "";

            // Build filter string
            Object.entries(filterData).forEach(([key, values]) => {
                let thisFilterString = "";

                values.forEach((itemValue, index) => {
                    let val = `'${itemValue}'`;
                    if (typeof itemValue === 'number')
                        val = `${itemValue}`;
                    if (index === 0) {
                        thisFilterString = `${key} eq ${val}`;
                    } else {
                        thisFilterString += ` or ${key} eq ${val}`;
                    }
                });

                if (values.length && st === "") {
                    st = `(${thisFilterString})`;
                } else if (values.length && st !== "") {
                    st += ` and (${thisFilterString})`;
                }
            });

            // Group by and aggregate
            const groupby = groupbyFields.join(",");
            const aggregate = measures
                .map(m => `${m.field} with ${m.operation} as ${m.field}_${m.operation.toUpperCase()}`)
                .join(", ");

            // Final apply query
            const finalApply = `filter(${st})/groupby((${groupby}),aggregate(${aggregate}))`;
            return finalApply;
        },
        onExportPivot: function () {
            try {
                const mainDiv = that.byId("mainDivPOP").getDomRef();
                if (!mainDiv) {
                    throw new Error("Main div element not found");
                }

                // Find the table with class 'pvtTable'
                const tableElement = mainDiv.querySelector('table.pvtTable');
                if (!tableElement) {
                    throw new Error("Table with class 'pvtTable' not found");
                }

                const clonedTable = tableElement.cloneNode(true);

                // Remove all elements with class 'popover' from the cloned table
                const popovers = clonedTable.querySelectorAll('.popover');
                popovers.forEach(popover => {
                    popover.remove();
                });

                const dataType = 'application/vnd.ms-excel';
                // Use the cleaned cloned table instead of the original
                const tableHTML = clonedTable.outerHTML;
                const encodedHTML = encodeURIComponent(tableHTML);

                const filename = "HeatMap.xls";
                const downloadLink = document.createElement("a");
                downloadLink.href = 'data:' + dataType + ', ' + encodedHTML;
                downloadLink.download = filename;
                downloadLink.style.display = 'none';

                document.body.appendChild(downloadLink);
                downloadLink.click();
                document.body.removeChild(downloadLink);

            } catch (error) {
                console.error("Export failed:", error);
                // You might want to show a user-friendly error message here
                // MessageToast.show("Export failed. Please try again.");
            }
        },
        onTogglePress: function (oEvent) {
            const oButton = oEvent.getSource();
            const $btn = oButton.$();
            const bPressed = oButton.getPressed();
            const newText = bPressed ? "Hide Char" : "Show Char";

            // A single duration for a consistent animation speed
            const animationDuration = 500; // ms

            // Set transform origin for a centered scale effect
            $btn.css("transform-origin", "50% 50%");

            // Animate out by shrinking horizontally
            $({ animValue: 1 }).animate(
                { animValue: 0 },
                {
                    duration: animationDuration,
                    easing: "swing", // Optional: for a more natural feel
                    step: function (now) {
                        // 'now' progresses from 1 to 0
                        // Apply this progress to both scaleX and opacity
                        $btn.css({
                            transform: `scaleX(${now})`,
                            opacity: now,
                        });
                    },
                    complete: function () {
                        // --- Animation Out Complete ---

                        // 1. Update the text while the button is invisible
                        oButton.setText(newText);

                        // 2. Animate in by expanding horizontally
                        $({ animValue: 0 }).animate(
                            { animValue: 1 },
                            {
                                duration: animationDuration,
                                easing: "swing",
                                step: function (now) {
                                    // 'now' progresses from 0 to 1
                                    $btn.css({
                                        transform: `scaleX(${now})`,
                                        opacity: now,
                                    });
                                },
                            }
                        );
                    },
                }
            );
            const selectedItem = bPressed ? "Hide Char" : "Show Char";
            $(".pvtTable")
                .find("td")
                .each(function () {
                    let cellText = $(this)[0].childNodes[0].textContent.trim();
                    const item = that.myMap.get(cellText);
                    let color;
                    if (item) {
                        color = item.COLOR_CODE;
                    }
                    if (color) {
                        $(this).css("background-color", color);
                        if (selectedItem !== "Show Char")
                            $(this).css("color", "#ffffff");
                        else
                            $(this).css("color", "transparent"); // Make text invisible
                    }

                });



        },
        charHide: function (oEvent) {
            const oCheckBox = oEvent.getSource();
            const bSelected = oCheckBox.getSelected();

            // Apply color changes based on checkbox state
            $(".pvtTable")
                .find("td")
                .each(function () {
                    let cellText = $(this)[0].childNodes[0].textContent.trim();
                    const item = that.myMap.get(cellText);
                    let color;
                    if (item) {
                        color = item.COLOR_CODE;
                    }
                    if (color) {
                        $(this).css("background-color", color);
                        if (bSelected) {
                            // Checkbox is checked = Hide characteristics
                            $(this).css("color", "transparent"); // Make text invisible
                        } else {
                            // Checkbox is unchecked = Show characteristics
                            $(this).css("color", "#ffffff");
                        }
                    }
                });
        }, checkPrp() {
            that.loadPivotTab(that.allData);
        }
    });
});