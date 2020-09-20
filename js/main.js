// set the lowest zoom resolution slider-viewer will go out too
const minimumZoomLevel = 10;
// threshold determines how much scrolling/scaling one one layer until canvas changes to next resolution
const levelChangeThreshold = 0;
// set the maximum resolution layer
const maximumZoomLevel = 14;
// sets default resolution zoom
const defaultZoomLevel = 11;
// determines how much each mouse scroll scales the canvas - must be a fraction of 1 to avoid blurriness
const scaleMultiplier = 1/5;
// make each resolution layer use the files from the resolution 3 'layers' higher
const upscale = 3;


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
	requestTiles(upscale, zoomLevel, resultFunction, self) {
		console.log("/VMICs/dzc_output_files/" + (zoomLevel + upscale));
		let imgArray = requestImages("/VMICs/dzc_output_files/" + (zoomLevel + upscale), resultFunction, self);
		self.imgArray = imgArray;
	}
}


class SlideView {
	constructor(canvas, context, ImageData, minimumZoomLevel, maximumZoomLevel, levelChangeThreshold, defaultZoomLevel, scaleMultiplier, upscale) {
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
        self.scaleMultiplier = scaleMultiplier;
        self.absoluteScale = 1.0;
        self.trackCurrent = 0;
        self.zoomLevel = defaultZoomLevel - upscale;
        self.minimumZoomLevel = minimumZoomLevel - upscale;
        self.maximumZoomLevel = maximumZoomLevel - upscale;
        self.levelChangeThreshold = levelChangeThreshold;
        self.upscale = upscale;
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
			// check if this tile is on the screen - if not ++i and skip loop;
			self.context.drawImage(tile["imageSrc"], tile["xOff"] + self.xLeft, tile["yOff"] + self.yTop);
			++i;
		}
		self.context.restore();
	}
	updateTiles(self) {
		self.drawQueue.length = 0;
		// self.context.scale(roundDecimal(1 / self.scale, 1), roundDecimal(1 / self.scale));
		self.absoluteScale = 1;
		self.scale = 1;
		console.log("scale is now 1.Going to folder: " + (self.zoomLevel + 3));
		self.ImageData.requestTiles(self.upscale, self.zoomLevel, self.receiveTiles, self);
		// self.context.scale(0.8, 0.8);	
	}
	increaseResolution(self) {
		// console.log("higher res");
		self.zoomLevel++;
		self.updateTiles(self);
		self.trackCurrent = -self.levelChangeThreshold;
	}
	decreaseResolution(self) {
		// console.log("lower res");
		self.zoomLevel--;
		self.updateTiles(self);
		self.trackCurrent = self.levelChangeThreshold;
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
		if (self.trackCurrent > self.levelChangeThreshold && self.zoomLevel < self.maximumZoomLevel) {
			self.increaseResolution(self);
		} else if (self.trackCurrent < -self.levelChangeThreshold && self.zoomLevel > self.minimumZoomLevel) {
			self.decreaseResolution(self);
		} else {
			// console.log("made it");
			if ((event.wheelDelta < 0 || event.detail > 0)) {
				if (self.zoomLevel != self.minimumZoomLevel || (self.zoomLevel == self.minimumZoomLevel && self.trackCurrent < 0)) {
					self.trackCurrent--;
					self.scale = 1 - self.scaleMultiplier;
					console.log("changed scale: " + self.scale);
					self.absoluteScale -= self.scaleMultiplier;
					self.xLeft += event.clientX  * 0.1;
					self.yTop += event.clientY  * 0.1;
					self.context.scale(roundDecimal(self.scale), roundDecimal(self.scale));
				}
			} else {
				if (self.zoomLevel != self.maximumZoomLevel || (self.zoomLevel == self.maximumZoomLevel && self.trackCurrent > 0)) {
					self.trackCurrent++;
					self.scale = 1 + self.scaleMultiplier;
					console.log("changed scale: " + self.scale);
					self.absoluteScale += self.scaleMultiplier;
					self.xLeft -= event.clientX  * 0.1;
					self.yTop -= event.clientY  * 0.1;
					self.context.scale(roundDecimal(self.scale), roundDecimal(self.scale));
				}
			}
		}
		// console.log(self.trackCurrent);
	}
}


window.onload = function(){
	let view = document.getElementById("view");
	let c = view.getContext("2d");
	c.mozImageSmoothingEnabled = false;
	c.webkitImageSmoothingEnabled = false;
	c.msImageSmoothingEnabled = false;
	c.imageSmoothingEnabled = false;

	canvasFill(view);

	slideImage = new ImageData();
	viewer = new SlideView(view, c, slideImage, minimumZoomLevel, maximumZoomLevel, levelChangeThreshold, defaultZoomLevel, scaleMultiplier, upscale);

	slideImage.requestTiles(upscale, defaultZoomLevel - upscale, viewer.receiveTiles, viewer);

	view.addEventListener("mousedown", function(){
		viewer.onMouseDown(viewer, event);
	}, false);
	view.addEventListener("mouseup", function(){
		viewer.onMouseUp(viewer);
	}, false);
	view.addEventListener("mouseleave", function(){
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