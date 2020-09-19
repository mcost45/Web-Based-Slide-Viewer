class ImageData {
	constructor() {
		// this.vmicFileInput = vmicFileInput;
		this.file = 0;
	}

	loadVmic(file) {
		if (checkVmic(getFileExtension(file.name))) {
			this.file = file;
		}
	}
	requestTiles(zoomLevel) {
		var imgArray = requestImages("/VMICs/dzc_output_files/" + zoomLevel);
		console.log(imgArray);
	}
}


class SlideView {
	constructor(canvas, imageData) {
		this.canvas = canvas;
		this.context = canvas.getContext("2d");
		this.width = this.context.height;
		this.height = this.context.width;
		this.zoomLevel = 0;
		this.cameraX = 0;
		this.cameraY = 0;
	}


}