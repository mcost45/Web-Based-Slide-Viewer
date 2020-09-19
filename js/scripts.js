// const vmicFileInput = document.getElementById("selectVMIC");

// canvas vars
var view = document.getElementById("view");
var c = view.getContext("2d");

// make canvas fill the window
function canvasFill(canvas) {
	canvas.height = window.innerHeight;
	canvas.width = window.innerWidth;
}

function getFileExtension(fileName) {
	return fileName.split('.').pop();
}

function checkVmic(extension) {
	if (extension == "vmic") {
		return 1;
	} else {
		console.log("Not a .vmic file.");
		return 0;
	}
}

function getFileFromPath(path) {
	return path.substring(path.lastIndexOf('/') + 1);
}

function removeFileExtension(file) {
	return file.replace(/\.[^/.]+$/, "");
}

function getCoords(X_Y) {
	return X_Y.split("_");
}

function requestImages(dir) {
	var imgArray = [];
	var req = new XMLHttpRequest();
	req.open("GET", dir, true);
	req.responseType = 'document';
	req.onload = () => {
		if (req.status === 200) {
			var elements = req.response.getElementsByTagName("a");
			for (x of elements) {
				if (x.href.match(/\.(jpe?g)$/) ) { 
					let fileName = removeFileExtension(getFileFromPath(x.href));
					let coords = getCoords(fileName);
					imgArray.push({
						xCoord: coords[0],
						yCoord: coords[1],
						href: x.href
					});
				} 
			};
		} else {
			alert('Failed Request: ' + req.status);
		}
	}
	req.send();
	return imgArray;
}


// initial setup
canvasFill(view);

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

slideImage = new ImageData();
viewer = new SlideView(view, slideImage);

slideImage.requestTiles(8);

// vmicFileInput.addEventListener("change", function() {
// 	const file = this.files[0];
// 	slideImage.loadVmic(file);
// }, false);