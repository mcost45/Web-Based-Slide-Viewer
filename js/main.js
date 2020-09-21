// make each resolution layer use the files from the resolution 3 'layers' higher
const UPSCALE = 3;
// set the lowest zoom resolution slider-viewer will go out too
const MINIMUMZOOMLEVEL = 10 - UPSCALE;
// threshold determines how much scrolling/scaling one one layer until canvas changes to next resolution
const LEVELCHANGETHRESHOLD = 1;
// set the maximum resolution layer
const MAXIMUMZOOMLEVEL = 14 - UPSCALE;
// sets default resolution zoom
const DEFAULTZOOMLEVEL = 11;
// determines how much each mouse scroll scales the canvas - must be a fraction of 1 to avoid blurriness
const SCALEMULTIPLIER = 1/4;
const MINZOOMED = 0.5;
const MAXZOOMED = MINZOOMED + SCALEMULTIPLIER;
const ZOOMEDEPSI = 0.05;


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
		let imgArray = requestImages("/VMICs/dzc_output_files/" + (zoomLevel + UPSCALE), resultFunction, self);
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
		self.scale = 0.5;
		self.absoluteScale = 1.0;
		self.zoomLevel = DEFAULTZOOMLEVEL - UPSCALE;
	}

	receiveTiles(self, imgArray) {
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
		self.context.save();
		self.context.clearRect(0, 0, window.innerWidth * (5- self.absoluteScale), window.innerHeight * (5 - self.absoluteScale));
		self.context.restore();
		let i = 0;
		let lenb = self.drawQueue.length;
		while (i < lenb) {
			let tile = self.drawQueue[i];
			let tileXStart = tile["xOff"] + self.xLeft;
			let tileYStart = tile["yOff"] + self.yTop;
			let tileXEnd = tile["xOff"] + tile["imageSrc"].naturalWidth  + self.xLeft;
			let tileYEnd = tile["yOff"] + tile["imageSrc"].naturalHeight + self.yTop;
			if (isOnScreen(tileXStart, tileXEnd, tileYStart, tileYEnd, 0, window.innerWidth, 0, window.innerHeight)) {
				self.context.drawImage(tile["imageSrc"], tile["xOff"] + self.xLeft, tile["yOff"] + self.yTop);
			}
			++i;
		}
	}
	scaleCanvas(self, scale, mouseX, mouseY) {
		let transformedPointer = getTransformedPoint(mouseX, mouseY, self.context);
		self.context.translate(transformedPointer.x, transformedPointer.y);
		self.context.scale(scale, scale);
		self.context.translate(-transformedPointer.x, -transformedPointer.y);
	}
	updateTiles(self, mouseX, mouseY) {
		self.drawQueue.length = 0;
		self.absoluteScale = 0.75;
		self.ImageData.requestTiles(self.zoomLevel, self.receiveTiles, self);
	}
	increaseResolution(self, mouseX, mouseY) {
		let transformedPointer = getTransformedPoint(mouseX, mouseY, self.context);
		self.zoomLevel++;
		self.xLeft -= (transformedPointer.x * (self.zoomLevel - UPSCALE - 1 * UPSCALE)) / UPSCALE;
		self.yTop -= (transformedPointer.y * (self.zoomLevel -  UPSCALE - 1 * UPSCALE)) / UPSCALE;
		self.updateTiles(self, mouseX, mouseY);
	}
	decreaseResolution(self, mouseX, mouseY) {
		let transformedPointer = getTransformedPoint(mouseX, mouseY, self.context);
		self.zoomLevel--;
		self.xLeft += ((transformedPointer.x  * (self.zoomLevel - UPSCALE - 1 * UPSCALE)) / UPSCALE) * (1 / MAXZOOMED);
		self.yTop += ((transformedPointer.y  * (self.zoomLevel - UPSCALE - 1 * UPSCALE)) / UPSCALE) * (1 / MAXZOOMED);
		self.updateTiles(self, mouseX, mouseY);
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
			self.xLeft += dx;
			self.yTop += dy;
			self.lastX = x;
			self.lastY = y;
		}
	}
	onMouseWheel(self, event) {
		if ((event.wheelDelta < 0 || event.detail > 0)) {
			// roll out
			if (self.scale - SCALEMULTIPLIER < MINZOOMED - ZOOMEDEPSI && self.zoomLevel > MINIMUMZOOMLEVEL) {
				canvasFill(self.context.canvas);
				self.decreaseResolution(self, event.clientX, event.clientY);
				self.scale = MAXZOOMED;
				self.scaleCanvas(self, 2 * self.scale, event.clientX, event.clientY);
			} else if (self.zoomLevel != MINIMUMZOOMLEVEL || (self.zoomLevel == MINIMUMZOOMLEVEL && self.scale > MINZOOMED)) {
				self.scale -= SCALEMULTIPLIER;
				self.absoluteScale -= SCALEMULTIPLIER;
				canvasFill(self.context.canvas);
				self.scaleCanvas(self, 2 * self.scale, event.clientX, event.clientY);
			}
		} else {
			// roll in
			if (self.scale + SCALEMULTIPLIER > MAXZOOMED + ZOOMEDEPSI && self.zoomLevel < MAXIMUMZOOMLEVEL) {
				canvasFill(self.context.canvas);
				self.increaseResolution(self, event.clientX, event.clientY);
				self.scale = MINZOOMED;
			} else if (self.zoomLevel != MAXIMUMZOOMLEVEL || (self.zoomLevel == MAXIMUMZOOMLEVEL && self.scale < MAXZOOMED)) {
				self.scale += SCALEMULTIPLIER;
				self.absoluteScale += self.SCALEMULTIPLIER;
				canvasFill(self.context.canvas);
				self.scaleCanvas(self, 2 * self.scale, event.clientX, event.clientY);
			}
		}
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

	viewer = new SlideView(view, c, slideImage);

	slideImage.requestTiles(DEFAULTZOOMLEVEL - UPSCALE, viewer.receiveTiles, viewer);

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