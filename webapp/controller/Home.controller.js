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
            // await this._loadYear();
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

                let allResults = [];
                let skip = 0;
                const top = 50000;

                const fetchData = () => {
                    that.oModel.read("/getClusterHeatmap", {
                        urlParameters: {
                            "$select": "YEAR",
                            "$top": top,
                            "$skip": skip
                        },
                        success: function (oData) {
                            allResults = allResults.concat(oData.results);

                            // If we got exactly 50000 records, there might be more
                            if (oData.results.length === top) {
                                skip += top;
                                fetchData(); // Recursively fetch next batch
                            } else {
                                // We've got all the data
                                that.byId("mcYear").setBusy(false);

                                let uniqueYears = [...new Set(allResults.map(o => o.YEAR))];
                                let years = uniqueYears.map(y => ({ key: y, text: y }));

                                that.byId("mcYear").setModel(new JSONModel(years));
                                that.byId("mcYear").bindItems("/", new sap.ui.core.Item({
                                    key: "{key}",
                                    text: "{text}"
                                }));

                                resolve(allResults);
                            }
                        },
                        error: function (e) {
                            that.byId("mcYear").setBusy(false);
                            console.log(e);
                            reject(e);
                        }
                    });
                };

                fetchData(); // Start the first fetch
            });
        },
        onchageProd: function () {
            // let aYear = this.byId("mcYear").getSelectedKeys();
            let aLocs = this.byId("mcLocation").getSelectedKey();
            let aConfigs = this.byId("mcConfig").getSelectedKey();
            let aProducts = this.byId("mcProduct").getSelectedKey();

            // const aFilters = [];

            // if (aYear.length === 0) return;
            if (!aLocs) return;
            if (!aConfigs) return;
            if (!aProducts) return;

            // if (aLocs) {
            //     aFilters.push(new Filter("LOCATION_ID", FilterOperator.EQ, aLocs));
            // }
            // if (aConfigs) {
            //     aFilters.push(new Filter("CONFIG_PRODUCT", FilterOperator.EQ, aConfigs));
            // }
            // if (aProducts) {
            //     aFilters.push(new Filter("PRODUCT_ID", FilterOperator.EQ, aProducts));
            // }
            // if (aYear.length) {
            //     aFilters.push(new Filter(aYear.map(p => new Filter("YEAR", FilterOperator.EQ, p)), false));
            // }

            // const filter = new Filter(aFilters, true);


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
            that.oModel.callFunction("/getClusterFilter", {
                // filters: [filter],
                // urlParameters: { "$apply": applyQuery + "/orderby(CLUSTER_ID)", "$top": 50000 },
                urlParameters: {
                    // "$select": "CLUSTER_ID, PRIMARY_ID, CHAR_DESC",// Select only needed fields,
                    // "$top": 50000
                    loc: aLocs,
                    cProd: aConfigs,
                    prod: aProducts
                },
                success: function (oData) {
                    that.getView().setBusy(false);

                    that.FilterData = JSON.parse(oData.getClusterFilter);
                    const data = JSON.parse(oData.getClusterFilter);

                    let year = [...new Set(data.map(o => o.YEAR))];
                    that.byId("mcYear").setModel(new JSONModel(year.map(c => ({ key: c, text: c }))));
                    that.byId("mcYear").bindItems("/", new sap.ui.core.Item({ key: "{key}", text: "{text}" }));

                    // CLUSTER_ID with "Select All"
                    let clusterId = [...new Set(data.map(o => o.CLUSTER_ID).sort((a, b) => a - b))];
                    let oClusterModel = new JSONModel(clusterId.map(c => ({ key: c, text: c })));
                    that.byId("mcCluster").setModel(oClusterModel);
                    that.byId("mcCluster").bindItems("/", new sap.ui.core.Item({ key: "{key}", text: "{text}" }));

                    let priId = [...new Set(data.map(o => o.PRIMARY_ID).sort((a, b) => a - b))];
                    let priModle = new JSONModel(priId.map(c => ({ key: c, text: c })));
                    that.byId("mcPrimary").setModel(priModle);
                    that.byId("mcPrimary").bindItems("/", new sap.ui.core.Item({ key: "{key}", text: "{text}" }));

                    // CHAR_DESC
                    let charDesc = [...new Set(data.map(o => o.CHAR_DESC))];
                    that.byId("mcChar").setModel(new JSONModel(charDesc.map(c => ({ key: c, text: c }))));
                    that.byId("mcChar").bindItems("/", new sap.ui.core.Item({ key: "{key}", text: "{text}" }));

                    // let quar = [...new Set(oData.results.map(o => o.QUARTER))];
                    // this.byId("idQuar").setModel(new JSONModel(quar.map(c => ({ key: c, text: c }))));
                    // this.byId("idQuar").bindItems("/", new sap.ui.core.Item({ key: "{key}", text: "{text}" }));

                },
                error: function (oError) {
                    console.error("Error fetching getClusterHeatmap:", oError);
                }
            });
        },
        onchangeyear() {
            const year = this.byId("mcYear").getSelectedKeys();
            if (!year.length) return;
            // let aLocs = this.byId("mcLocation").getSelectedKey();
            let fData = [];
            // if (clus.length === 0)
            //     fData = that.FilterData.filter(o => aLocs === o.LOCATION_ID)
            // else
            fData = that.FilterData.filter(o => year.includes(o.YEAR))

            //cluter
            let clue = [...new Set(fData.map(o => o.CLUSTER_ID).sort((a, b) => a - b))];
            let clModle = new JSONModel(clue.map(c => ({ key: c, text: c })));
            this.byId("mcCluster").setModel(clModle);
            this.byId("mcCluster").bindItems("/", new sap.ui.core.Item({ key: "{key}", text: "{text}" }));

            let priId = [...new Set(fData.map(o => o.PRIMARY_ID).sort((a, b) => a - b))];
            let priModle = new JSONModel(priId.map(c => ({ key: c, text: c })));
            this.byId("mcPrimary").setModel(priModle);
            this.byId("mcPrimary").bindItems("/", new sap.ui.core.Item({ key: "{key}", text: "{text}" }));
            // CHAR_DESC
            let charDesc = [...new Set(fData.map(o => o.CHAR_DESC))];
            this.byId("mcChar").setModel(new JSONModel(charDesc.map(c => ({ key: c, text: c }))));
            this.byId("mcChar").bindItems("/", new sap.ui.core.Item({ key: "{key}", text: "{text}" }));
        },
        onChnageCluster() {
            const clus = this.byId("mcCluster").getSelectedKeys().map(c => Number(c));
            if (!clus.length) return;
            let ayear = this.byId("mcYear").getSelectedKeys();
            let fData = [];
            // if (clus.length === 0)
            //     // fData = that.FilterData.filter(o => aLocs === o.LOCATION_ID)
            // else
            fData = that.FilterData.filter(o => clus.includes(o.CLUSTER_ID) && ayear.includes(o.YEAR))
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
            let aLocs = this.byId("mcLocation").getSelectedKey();
            const fData = that.facdata.filter(o => aLocs === o.DEMAND_LOC)
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
        onApplyFilters: async function () {
            that.getView().setBusy(true);

            const sLoc = this.byId("mcLocation").getSelectedKey();
            const sCfg = this.byId("mcConfig").getSelectedKey();
            const sProd = this.byId("mcProduct").getSelectedKey();

            const aClusters = this.byId("mcCluster").getSelectedKeys() || [];
            const aPrimary = this.byId("mcPrimary").getSelectedKeys() || [];
            const aYear = this.byId("mcYear").getSelectedKeys() || [];
            const aChar = this.byId("mcChar").getSelectedKeys() || [];


            // Validate mandatory fields
            if (!sLoc || !sCfg || !sProd) {
                MessageToast.show("Please select all mandatory fields");
                return;
            }
            that.oModel.callFunction("/getClusterHeatmapFun", {
                urlParameters: {
                    loc: sLoc,
                    cProd: sCfg,
                    prod: sProd,
                    year: JSON.stringify(aYear),
                    clusterId: JSON.stringify(aClusters.map(o => Number(o))),
                    charDesc: JSON.stringify(aChar),
                    primaryId: JSON.stringify(aPrimary.map(o => Number(o)))
                },
                success: function (oData) {
                    const aData = JSON.parse(oData.getClusterHeatmapFun);
                    if (!aData || aData.length === 0) {
                        MessageToast.show("No data found for selected criteria");
                        that.getView().setBusy(false);
                        return;
                    }

                    // const aData = oData.results;

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

                        // Sum ORD_QTY for items with max CHAR_SEQUENCE
                        const totalQty = items
                            .filter(i => i.CHAR_SEQUENCE === maxSeqItem.CHAR_SEQUENCE)
                            .reduce((sum, i) => sum + Number(i.ORD_QTY || 0), 0);

                        myMapPrId.set(key, { ...maxSeqItem, ORD_QTY: totalQty });
                    });

                    that.myMapPrId = myMapPrId;

                    // Create derived array and unique order quantities
                    const ORD_QTY = [];
                    aData.forEach(o => {
                        const key = o.PRIMARY_ID + "";
                        const sumValue = myMapPrId.get(key).ORD_QTY;
                        o.PRIMARY_ID_ORDER = `${o.PRIMARY_ID}(${sumValue})`;
                        ORD_QTY.push(Number(sumValue));
                    });

                    let ordeQts = [...new Set(ORD_QTY)];
                    that.ordeQts = ordeQts;

                    that.allData = aData
                    that.loadPivotTab(aData);

                    // MessageToast.show(`Loaded ${aData.length} records successfully`);
                    that.getView().setBusy(false);

                },
                error: function (oError) {
                    that.getView().setBusy(false);
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
                    case "ORD_QTY":
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
                that.byId("toolBar").setVisible(false);
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
                        " ": function (a, b) {
                            const aCHAR_SEQUENCE = that.myMapCHAR.get(a).CHAR_SEQUENCE;
                            const bCHAR_SEQUENCE = that.myMapCHAR.get(b).CHAR_SEQUENCE;


                            return aCHAR_SEQUENCE - bCHAR_SEQUENCE;
                        },
                        "  ": function (a, b) {
                            a = a.split("(")[0];
                            b = b.split("(")[0];
                            const aCLUSTER_SORT_SEQ = that.myMapPrId.get(a).CLUSTER_SORT_SEQ;
                            const bCLUSTER_SORT_SEQ = that.myMapPrId.get(b).CLUSTER_SORT_SEQ;

                            const aPRIMARY_ID_SEQUENCE = that.myMapPrId.get(a).PRIMARY_ID_SEQUENCE;
                            const bPRIMARY_ID_SEQUENCE = that.myMapPrId.get(b).PRIMARY_ID_SEQUENCE;
                            if (aCLUSTER_SORT_SEQ !== bCLUSTER_SORT_SEQ) {
                                return aCLUSTER_SORT_SEQ - bCLUSTER_SORT_SEQ;
                            }
                            return aPRIMARY_ID_SEQUENCE - bPRIMARY_ID_SEQUENCE;
                        }
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
                                $(this).find('th:first').addClass('BlueFont')
                            }

                            const lineHeight = Number(order_qty) * 0.001;

                            $($(this).find('th:first')).css('line-height', lineHeight);
                            $(this).find('td').css('line-height', lineHeight);

                            // normalize each value into px range
                            // const heights =
                            //     ((order_qty - minVal) / (maxVal - minVal)) * (maxPx - minPx) + minPx;
                            // $(this).height(heights);
                        });
                    }
                    if ($('#globalPopover').length === 0) {
                        $('body').append(`
        <div class="popover" id="globalPopover">
            <div class="popover-content">
                <div class="date-row">
                    <span class="label" style="font-size: 13px;">Primary ID: </span>
                    <span class="PrimaryId" style="font-size: 15px;"></span>
                </div>
                <div class="date-row">
                    <span class="label" style="font-size: 13px;">Cluster ID: </span>
                    <span class="ClusterId" style="color: blue; font-size: 14px;"></span>
                </div>
                <div class="date-row">
                    <span class="label" style="font-size: 13px;">Characteristic Value: </span>
                    <span class="CharValNum" style="color: blue; font-size: 14px;"></span>
                </div>
                <div class="date-row">
                    <span class="label" style="font-size: 13px;">Order Quantity: </span>
                    <span class="OrderQty" style="color: blue; font-size: 14px;"></span>
                </div>
            </div>
        </div>
    `);
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
                                // In your loop, just add the class (no HTML injection)
                                $(this).addClass("hoverCell");

                                // Handle hover to position and show popover
                                $(this).hover(
                                    function (e) {
                                        const $cell = $(this);
                                        const $popover = $('#globalPopover');
                                        const offset = $cell.offset();
                                        const cellHeight = $cell.outerHeight();
                                        const cellWidth = $cell.outerWidth();

                                        // Position popover above the cell
                                        $popover.css({
                                            top: offset.top - $popover.outerHeight() - 10 + 'px',
                                            left: offset.left + (cellWidth / 2) + 'px'
                                        });

                                        // Get headers and update popover content
                                        const colHeader = $(".pvtTable").find("thead tr:first").find(`th:eq(${$cell.index() + 1})`)[0].textContent;
                                        const rowHeader = $(".pvtTable").find(`tr:eq(${$cell.parent().index() + 2})`).find("th:first")[0].textContent;

                                        $popover.addClass('show');


                                        that.updateDate($popover, cellText, colHeader, rowHeader);

                                        // Show popover
                                    },
                                    function () {
                                        // Hide popover when mouse leaves
                                        $('#globalPopover').removeClass('show');
                                    }
                                );
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
            const popover = $('#globalPopover');

            if (item) {
                popover.find(".PrimaryId").text(pId);
                if (that.myMapPrId.get(pId).UNIQUE_ID_COLOR == 0) {
                    popover.find(".PrimaryId").attr('style', 'color: #0b74de !important');
                }
                else {
                    popover.find(".PrimaryId").attr('style', 'color: black !important');
                }
                popover.find(".ClusterId").text(that.myMapPrId.get(pId).CLUSTER_ID);
                popover.find(".CharValNum").text(item.CHARVAL_NUM);
                popover.find(".OrderQty").text(order_qty.split(")")[0]);
            }
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
        },
        checkPrp() {
            that.loadPivotTab(that.allData);
        },
        OnClear() {
            this.byId("mcLocation").setSelectedKey();
            this.byId("mcConfig").setSelectedKey();
            this.byId("mcProduct").setSelectedKey();
            this.byId("mcCluster").setSelectedKeys();
            this.byId("mcPrimary").setSelectedKeys();
            this.byId("mcYear").setSelectedKeys();
            this.byId("mcChar").setSelectedKeys();
            var pivotDiv = document.querySelector(`[id*='pivotGrid']`);
            pivotDiv.innerHTML = "";
            that.byId("toolBar").setVisible(false);
        }
    });
});