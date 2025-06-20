class Gallery {
    constructor(_config, _data) {
        this.config = {
            parentElement: _config.parentElement,
            containerWidth: 800,
            containerHeight: 600,
            margin: {top: 20, right: 20, bottom: 20, left: 20},
            beeSize: 50,
            colorSize: 30
        };
        this.data = _data;
        this.selectedBees = new Set();
        this.selectedColors = new Set();
        this.initVis();
    }

    initVis() {
        // existing implementation
    }

    getSelectedBees() {
        return Array.from(this.selectedBees);
    }

    getSelectedColors() {
        return Array.from(this.selectedColors);
    }
}
