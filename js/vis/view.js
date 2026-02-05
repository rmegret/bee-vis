import * as d3 from "d3";
import { Chronogram } from "./vis/chronogram.js";
import { Barchart } from "./vis/barchart.js";
import { Patchview } from "./vis/patchview.js";
import { Gallery } from "./vis/gallery.js";

export class View {
	constructor(data, catMap) {
		this.data = data;
		this.catMap = catMap;

		// Central event bus
		this.dispatcher = d3.dispatch(
			"selectionChanged",
			"resetSelection"
		);

		// All active visualization instances live here
		// { type: string, instance: object }
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
		// Bee selection propagated to all views
		this.dispatcher.on("selectionChanged.view", selectedBees => {
			this.views.forEach(v => {
				if (typeof v.instance.updateSelection === "function") {
					v.instance.updateSelection(selectedBees);
				}

				// Patchview uses a different method name
				if (typeof v.instance.updateVis === "function") {
					v.instance.updateVis(selectedBees);
				}
			});
		});

		// Global reset
		this.dispatcher.on("resetSelection.view", () => {
			this.views.forEach(v => {
				if (typeof v.instance.updateSelection === "function") {
					v.instance.updateSelection([]);
				}

				if (typeof v.instance.updateVis === "function") {
					v.instance.updateVis([]);
				}
			});
		});
	}

	addView(type, instance) {
		this.views.push({
			type: type,
			instance: instance
		});
	}
}

