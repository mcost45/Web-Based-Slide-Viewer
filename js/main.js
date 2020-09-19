// canvas vars
var view = document.getElementById("view");
var c = view.getContext("2d");


class ImageData {
	constructor() {
		// this.vmicFileInput = vmicFileInput;
		this.file = 0;
		this.imgArray = [];
	}

	loadVmic(file) {
		if (checkVmic(getFileExtension(file.name))) {
			this.file = file;
		}
	}
	requestTiles(zoomLevel, resultFunction) {
		var imgArray = requestImages("/VMICs/dzc_output_files/" + zoomLevel, resultFunction);
		this.imgArray = imgArray;
		// var tiles
		// console.log(imgArray);
	}
}


class SlideView {
	constructor(context, imageData) {
		this.context = context;
		this.imageData = imageData;
		this.width = this.context.height;
		this.height = this.context.width;
		this.zoomLevel = 0;
		this.cameraX = 0;
		this.cameraY = 0;
	}

	receiveTiles(imgArray) {
		console.log("received tiles");
		var trackHeight = 0;
		var trackWidth = 0;
		console.log(imgArray[0]["image"].naturalWidth + " ee");
		imgArray.forEach((tile, index) => {
			let imageSrc = tile["image"];
			if (index == 0) {
				trackWidth = imageSrc.naturalWidth;
				trackHeight = imageSrc.naturalHeight;
			}
			c.drawImage(imageSrc, trackWidth * tile["xCoord"], trackHeight * tile["yCoord"]);
		});
		// c.drawImage(imgArray[0]["image"], 100, 100);
		// console.log(imgArray[0]["image"].);
	}
}

// const vmicFileInput = document.getElementById("selectVMIC");


// initial setup

window.addEventListener('load', function () {
	canvasFill(view);

	slideImage = new ImageData();
	viewer = new SlideView(c, slideImage);

	slideImage.requestTiles(10, viewer.receiveTiles);
})

// var back = slideImage.requestTiles(9);
// console.log(back.length);
// c.drawImage(slideImage.requestTiles(9)[0]["image"], 10, 10);

// vmicFileInput.addEventListener("change", function() {
// 	const file = this.files[0];
// 	slideImage.loadVmic(file);
// }, false);

