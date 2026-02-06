import { Chronogram } from "./chronogram.js";
import { Barchart } from "./barchart.js";
import { Patchview } from "./patchview.js";
import { Gallery } from "./gallery.js";

export class View {
	constructor(data, catMap) {
		this.data = data;
		this.catMap = catMap;

		// Global states
		this.selectedBees = [];
		this.timeRange = null;

		// Central dispatcher
		this.dispatcher = d3.dispatch(
			"selectionChanged",
			"timeRangeChanged",
			"resetSelection"
		);

		// All active visualization instances
		this.views = [];

		this.initViews();
		this.initDispatchHandlers();
	}

	initViews() {
		let vis = this;

		vis.addView(
			"chronogram",
			new Chronogram(
				{ parentElement: "#chronogram" },
				vis.data,
				vis.catMap,
				vis.dispatcher
			)
		);

		vis.addView(
			"barchart",
			new Barchart(
				{ parentElement: "#bar" },
				vis.data,
				vis.catMap,
				vis.dispatcher
			)
		);

		vis.addView(
			"patchview",
			new Patchview(
				{ parentElement: "#patchview" },
				vis.data,
				vis.catMap,
				vis.dispatcher
			)
		);

		vis.addView(
			"gallery",
			new Gallery(
				{ parentElement: "#gallery" },
				vis.data,
				vis.dispatcher
			)
		);
	}

	initDispatchHandlers() {
		let vis = this;		

		// Bee selection (from Gallery)
		vis.dispatcher.on("selectionChanged.view", selectedBees => {
			vis.selectedBees = selectedBees;
			vis.propagateFilters();
		});

		// Time range selection (from Chronogram)
		vis.dispatcher.on("timeRangeChanged.view", timeRange => {
			vis.timeRange = timeRange;
			vis.propagateFilters();
		});

		// Global reset
		vis.dispatcher.on("resetSelection.view", () => {
			vis.selectedBees = [];
			vis.timeRange = null;
			vis.propagateFilters();
		});
	}

	propagateFilters() {
		let vis = this;

		const filterState = {
			selectedBees: vis.selectedBees,
			timeRange: vis.timeRange
		};

		vis.views.forEach(view => {
			if (typeof view.instance.updateFilters === "function") {
				view.instance.updateFilters(filterState);
			}
		});
	}

	addView(type, instance) {
		let vis = this;

		vis.views.push({ type, instance });
	}
}

