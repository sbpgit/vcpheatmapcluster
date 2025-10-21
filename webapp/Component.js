sap.ui.define([
    "sap/ui/core/UIComponent",
    "vcpapp/heatmapcl/model/models"
], (UIComponent, models) => {
    "use strict";

    return UIComponent.extend("vcpapp.heatmapcl.Component", {
        metadata: {
            manifest: "json",
            interfaces: [
                "sap.ui.core.IAsyncContentCreation"
            ]
        },

        init() {
            // call the base component's init function
            UIComponent.prototype.init.apply(this, arguments);

            // set the device model
            this.setModel(models.createDeviceModel(), "device");

            // enable routing
            this.getRouter().initialize();
            function loadScript(src) {
                return new Promise((resolve, reject) => {
                    const script = document.createElement('script');
                    script.src = src;
                    script.onload = resolve;
                    script.onerror = reject;
                    document.head.appendChild(script);
                });
            }

            (async function loadAllScripts() {
                try {

                    await loadScript('https://cdnjs.cloudflare.com/ajax/libs/pivottable/2.22.0/pivot.min.js');
                    console.log('PivotTable loaded');

                    // Safe to initialize pivot now
                    // e.g. $("#output").pivotUI(...)
                } catch (e) {
                    console.error('Failed to load a script:', e);
                }
            })();
        }
    });
});