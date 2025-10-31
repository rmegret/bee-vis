import * as utility from "../utility.js"

export class Patchview {
	constructor(_config, _data){
		this.config = {
			parentElement: _config.parentElement,
			containerWidth: _config.width,
			containerHeight: _config.height,
			margin: _config.margin,		
		};
	}
}
