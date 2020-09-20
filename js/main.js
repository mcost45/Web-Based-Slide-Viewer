class ImageData {
	constructor() {
		// this.vmicFileInput = vmicFileInput;
		let self = this;
		self.file = 0;
		self.imgArray = [];
	}

	loadVmic(file) {
		if (checkVmic(getFileExtension(file.name))) {
			self.file = file;
		}
	}
	requestTiles(zoomLevel, resultFunction, self) {
		let imgArray = requestImages("/VMICs/dzc_output_files/" + zoomLevel, resultFunction, self);
		self.imgArray = imgArray;
	}
}


class SlideView {
	constructor(canvas, context, ImageData) {
		let self = this;
		self.canvas = canvas;
		self.context = context;
		self.ImageData = ImageData;
		self.drawQueue = [];
		self.mouseDown = false;
		self.xLeft = 0;
		self.yTop = 0;
		self.widthVOriginal = 1.0;
		self.heightVOriginal = 1.0;
		self.widthV = self.widthVOriginal;
		self.heightV = self.heightVOriginal;
		self.lastX = 0;
		self.lastY = 0;
	}

	receiveTiles(self, imgArray) {
		// console.log("received tiles");
		let trackHeight = 0;
		let trackWidth = 0;
		imgArray.forEach((tile, index) => {
			let imageSrc = tile["image"];
			if (index == 0) {
				trackWidth = imageSrc.naturalWidth;
				trackHeight = imageSrc.naturalHeight;
			}
			self.context.drawImage(imageSrc, trackWidth * tile["xCoord"], trackHeight * tile["yCoord"]);
			console.log(self.drawQueue);
		});
	}
	draw() {
		let i = 0;
		len = self.drawQueue;
		while (i < len) {
			console.log(self.drawQueue + "e");
			++i;
		}
	}
	onMouseDown() {
		self.mouseDown = true;
	}
	onMouseUp() {
		self.mouseDown = false;
	}
	onMouseMove(self, event) {
		let x = event.clientX - this.offsetLeft - this.clientLeft + this.scrollLeft;
		let y = event.clientY - this.offsetTop - this.clientTop + this.scrollTop;
		let dx = 0;
		let dy = 0;
		if (self.mousedown) {
			dx = (x - self.lastX) / self.canvas.width * self.widthV;
			dy = (y - self.lastY) / self.canvas.height * self.heightV;
		}
		self.xLeft -= dx;
		self.yTop -= dy;
		self.draw();
	}
	onMouseWheel() {
		// 
	}
}

// const vmicFileInput = document.getElementById("selectVMIC");


// initial setup

// function render() {
// 	requestAnimationFrame(render);
// 	c.clearRect(0, 0, view.width, view.height);
// 	// for (let i = 0; i < toDraw.length; i++) {
// 	// 	let currentTile = toDraw[i];
// 	// 	c.drawImage(currentTile["imageSrc"], currentTile["xOff"], currentTile["yOff"]);
// 	// }
// 	// slideImage.requestTiles(9, viewer.receiveTiles);
// 	// c.clearRect(0, 0, innerWidth, innerHeight);
// }

window.onload = function(){
	let view = document.getElementById("view");
	let c = view.getContext("2d");
	let toDraw = [];

	canvasFill(view);

	slideImage = new ImageData();
	viewer = new SlideView(view, c, slideImage);

	slideImage.requestTiles(9, viewer.receiveTiles, viewer);

	view.addEventListener("mousedown", viewer.onMouseDown, false);
	view.addEventListener("mouseup", viewer.onMouseUp, false);
	view.addEventListener("mousemove", function(){
    	viewer.onMouseMove(viewer, event);
	}, false);
	view.addEventListener("mousewheel", viewer.onMouseWheel, false);
	view.addEventListener("DOMMouseScroll", viewer.onMouseWheel, false);
}

// let back = slideImage.requestTiles(9);
// console.log(back.length);
// c.drawImage(slideImage.requestTiles(9)[0]["image"], 10, 10);

// vmicFileInput.addEventListener("change", function() {
// 	const file = this.files[0];
// 	slideImage.loadVmic(file);
// }, false);