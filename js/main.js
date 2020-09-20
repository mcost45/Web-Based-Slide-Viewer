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
		self.widthV = 1;
		self.heightV = 1;
		self.lastX = 0;
		self.lastY = 0;
		self.scale = 1.0;
        self.scaleMultiplier = 0.1;
        self.absoluteScale = 1.0;
	}

	receiveTiles(self, imgArray) {
		// console.log("received tiles");
		let trackHeight = 0;
		let trackWidth = 0;
		let i = 0;
		let lena = imgArray.length;
		while (i < lena) {
			let tile = imgArray[i];
			let imageSrc = tile["image"];
			if (i == 0) {
				trackWidth = imageSrc.naturalWidth;
				trackHeight = imageSrc.naturalHeight;
			}
			// self.context.drawImage(imageSrc, trackWidth * tile["xCoord"], trackHeight * tile["yCoord"]);
			self.drawQueue.push({
				imageSrc: imageSrc,
				xOff: trackWidth * tile["xCoord"],
				yOff: trackHeight * tile["yCoord"]
			});
			++i;
		};
	}
	draw(self) {
		requestAnimationFrame( function() {
			self.draw(self);
		});
		self.context.clearRect(0, 0, window.innerWidth * (5- self.absoluteScale), window.innerHeight * (5 - self.absoluteScale));
		self.context.save();
		let i = 0;
		let lenb = self.drawQueue.length;
		while (i < lenb) {
			let tile = self.drawQueue[i];
			self.context.drawImage(tile["imageSrc"], tile["xOff"] + self.xLeft, tile["yOff"] + self.yTop);
			++i;
		}
		self.context.restore();
	}
	onMouseDown(self, event) {
		self.mouseDown = true;
		self.lastX = event.clientX;
		self.lastY = event.clientY;
	}
	onMouseUp(self) {
		self.mouseDown = false;
	}
	onMouseMove(self, event) {
		if (self.mouseDown == true) {
			let x = event.clientX;
			let y = event.clientY;
			let dx = (x - self.lastX) / (self.widthV);
			let dy = (y - self.lastY) / (self.heightV);
			self.xLeft -= dx;
			self.yTop -= dy;
			self.lastX = x;
			self.lastY = y;
		}
	}
	onMouseWheel(self, event) {
		if ((event.wheelDelta < 0 || event.detail > 0)) {
			if (self.absoluteScale >= 1 + self.scaleMultiplier) {
				self.scale = 1 - self.scaleMultiplier;
				self.absoluteScale -= self.scaleMultiplier;
				self.xLeft += event.clientX  * 0.1;
				self.yTop += event.clientY  * 0.1;
				self.context.scale(self.scale, self.scale);
			} else {
				self.scale = 1;
			}
		} else {
			self.scale = 1 + self.scaleMultiplier;
			self.absoluteScale += self.scaleMultiplier;
			self.xLeft -= event.clientX  * 0.1;
			self.yTop -= event.clientY  * 0.1;
			self.context.scale(self.scale, self.scale);
		}
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

	view.addEventListener("mousedown", function(){
		viewer.onMouseDown(viewer, event);
	}, false);
	view.addEventListener("mouseup", function(){
		viewer.onMouseUp(viewer);
	}, false);

	view.addEventListener("mousemove", function(){
		viewer.onMouseMove(viewer, event);
	}, false);

	view.addEventListener("mousewheel", function(){
		viewer.onMouseWheel(viewer, event);
	}, false);
	view.addEventListener("DOMMouseScroll", function(){
		viewer.onMouseWheel(viewer, event);
	}, false);

	window.addEventListener('resize', function(event){
  		canvasFill(viewer);
	});

	requestAnimationFrame(function() {
		viewer.draw(viewer);
	});
}

// let back = slideImage.requestTiles(9);
// console.log(back.length);
// c.drawImage(slideImage.requestTiles(9)[0]["image"], 10, 10);

// vmicFileInput.addEventListener("change", function() {
// 	const file = this.files[0];
// 	slideImage.loadVmic(file);
// }, false);