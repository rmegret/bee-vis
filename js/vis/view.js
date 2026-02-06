import { Chronogram } from "./chronogram.js";
import { Barchart } from "./barchart.js";
import { Patchview } from "./patchview.js";
import { Gallery } from "./gallery.js";

export class View {
	constructor(data, catMap) {
		this.data = data;
		this.catMap = catMap;

		// Global interaction state (single source of truth)
		this.selectedBees = [];
		this.timeRange = null;

		// Central dispatcher
		this.dispatcher = d3.dispatch(
			"selectionChanged",
			"timeRangeChanged",
			"resetSelection"
		);

		// All active visualization instances
		// { type, instance }
		this.views = [];

		this.initViews();
		this.initDispatchHandlers();
	}

	initViews() {
		this.addView(
			"chronogram",
			new Chronogram(
				{ parentElement: "#chronogram" },
				this.data,
				this.catMap,
				this.dispatcher
			)
		);

		this.addView(
			"barchart",
			new Barchart(
				{ parentElement: "#bar" },
				this.data,
				this.catMap,
				this.dispatcher
			)
		);

		this.addView(
			"patchview",
			new Patchview(
				{ parentElement: "#patchview" },
				this.data,
				this.catMap,
				this.dispatcher
			)
		);

		this.addView(
			"gallery",
			new Gallery(
				{ parentElement: "#gallery" },
				this.data,
				this.dispatcher
			)
		);
	}

	initDispatchHandlers() {
		// Bee selection (from Gallery)
		this.dispatcher.on("selectionChanged.view", selectedBees => {
			this.selectedBees = selectedBees;
			this.propagateFilters();
		});

		// Time range selection (from Chronogram)
		this.dispatcher.on("timeRangeChanged.view", timeRange => {
			this.timeRange = timeRange;
			console.log(this.timeRange);
			this.propagateFilters();
		});

		// Global reset
		this.dispatcher.on("resetSelection.view", () => {
			this.selectedBees = [];
			this.timeRange = null;
			this.propagateFilters();
		});
	}

	propagateFilters() {
		const filterState = {
			selectedBees: this.selectedBees,
			timeRange: this.timeRange
		};

		this.views.forEach(v => {
			if (typeof v.instance.updateFilters === "function") {
				v.instance.updateFilters(filterState);
			}
		});
	}

	addView(type, instance) {
		this.views.push({ type, instance });
	}
}

