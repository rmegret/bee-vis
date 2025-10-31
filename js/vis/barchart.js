import * as utility from "../utility.js"

export class Barchart {
	constructor(_config, _data) {
		this.config = {
			parentElement: _config.parentElement,
			containerWidth: _config.width,
			containerHeight: _config.height,
			margin: _config.margin,
		};
		this.data = _data;
		this.div = this.config.parentElement;
	}

	initVis() {

	}


}
