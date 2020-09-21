// make each resolution layer use the files from the resolution 3 'layers' higher
const UPSCALE = 3;
// set the lowest zoom resolution slider-viewer will go out too
const MINIMUM_ZOOM_LEVEL = 10 - UPSCALE;
// threshold determines how much scrolling/scaling one one layer until canvas changes to next resolution
const LEVEL_CHANGE_THRESHOLD = 1;
// set the maximum resolution layer
const MAXIMUM_ZOOM_LEVEL = 14 - UPSCALE;
// sets default resolution zoom
const DEFAULT_ZOOM_LEVEL = 11;
// determines how much each mouse scroll scales the canvas - must be a fraction of 1 to avoid blurriness
const SCALE_MULTIPLIER = 1/4;
const MIN_ZOOMED = 0.5;
const MAX_ZOOMED = MIN_ZOOMED + SCALE_MULTIPLIER;
const ZOOMED_EPSI = 0.05;
const RELATIVE_SCALE_FACTOR = 2;
const LOADING_BLUR = 10;
const FRICTION = 1.1;
const DZC_OUTPUT_PATH = "/VMICs/dzc_output_files/";
const THUMBNAIL_PATH = "/VMICs/dzc_output_files/9/";



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
		let imgArray = requestImages(DZC_OUTPUT_PATH + (zoomLevel + UPSCALE), resultFunction, self);
		self.imgArray = imgArray;
	}
}


class NavigatorView {
	constructor(canvas, context, viewer) {
		let self = this;
		self.canvas = canvas;
		self.context = context;
		self.viewer = viewer;
		self.background = 0;
		self.ratioW = 0;
		self.ratioH = 0;
		self.navPointX = 0;
		self.navPointY = 0;
		self.navPointWidth = 0;
		self.navPointHeight = 0;
	}

	draw(self) {
		requestAnimationFrame( function() {
			self.draw(self);
		});
		// console.log(self.ratioW);
		self.context.clearRect(0, 0, self.canvas.width, self.canvas.height);
		self.context.drawImage(self.background, 0, 0);

		self.ratioW = 8 * self.canvas.width / self.viewer.widthV;
		self.ratioH = 8 * self.canvas.height / self.viewer.heightV;
		self.navPointX = -self.ratioW * self.viewer.xLeft;
		self.navPointY = -self.ratioH * self.viewer.yTop;
		self.navPointWidth = self.ratioW * self.viewer.canvas.width;
		self.navPointHeight = self.ratioH * self.viewer.canvas.height;

		// console.log(self.viewer.widthV);
		self.context.beginPath();
		self.context.rect(self.navPointX + 10, self.navPointY + 10, self.navPointWidth, self.navPointHeight);
		self.context.fillStyle = "rgba(0, 0, 0, 0.4)";;
		self.context.fill();
	}
	setupCanvas(self) {
		self.canvas.height = (self.background.height - 20) / 2;
		self.canvas.width = (self.background.width - 20) / 2;
	}
	requestThumbnail(resultFunction, self) {
		requestImage(THUMBNAIL_PATH, resultFunction, self);
	}
	receiveThumbnail(self, image) {
		self.background = image;
		self.setupCanvas(self);
		self.context.scale(0.5, 0.5);
		self.draw(self);
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
		self.canScroll = true;
		self.xLeft = 0;
		self.yTop = 0;
		self.widthV = 1;
		self.heightV = 1;
		self.lastX = 0;
		self.lastY = 0;
		self.scale = 0.5;
		self.absoluteScale = 1.0;
		self.xVelocity = 0;
		self.yVelocity = 0;
		self.zoomLevel = DEFAULT_ZOOM_LEVEL - UPSCALE;
	}

	receiveTiles(self, imgArray) {
		let trackHeight = 0;
		let trackWidth = 0;
		let totalHeight = 0;
		let totalWidth = 0;
		let i = 0;
		let lena = imgArray.length;
		while (i < lena) {
			let tile = imgArray[i];
			let imageSrc = tile["image"];
			totalWidth += imageSrc.naturalWidth;
			totalHeight += imageSrc.naturalHeight;
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
		// self.context.filter = "blur(0px)";
		self.canScroll = true;
		self.widthV = totalWidth;
		self.heightV = totalHeight;
		// console.log(totalWidth, totalHeight);
	}
	draw(self) {
		requestAnimationFrame( function() {
			self.draw(self);
		});
		self.context.save();
		if (!self.mousedown) {
			self.yVelocity /= FRICTION;
			self.xVelocity /= FRICTION;
			self.xLeft += self.xVelocity;
			self.yTop += self.yVelocity;
		}
		self.context.clearRect(0, 0, window.innerWidth * 10, window.innerHeight * 10);
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
				self.context.drawImage(tile["imageSrc"], Math.floor(tile["xOff"] + self.xLeft), Math.floor(tile["yOff"] + self.yTop));
			}
			++i;
		}
		// console.log(self.widthV);
	}
	scaleCanvas(self, scale, transformedPointer) {
		self.context.translate(transformedPointer.x, transformedPointer.y);
		self.absoluteScale *= scale;
		self.context.scale(scale, scale);
		self.context.translate(-transformedPointer.x, -transformedPointer.y);
		self.widthV *= self.absoluteScale;
		self.heightV *= self.absoluteScale;
	}
	updateTiles(self) {
		self.drawQueue.length = 0;
		self.absoluteScale = 1.0;
		self.ImageData.requestTiles(self.zoomLevel, self.receiveTiles, self);
	}
	increaseResolution(self, transformedPointer) {
		self.zoomLevel++;
		self.xLeft -= (transformedPointer.x * (self.zoomLevel - UPSCALE - 1 * UPSCALE)) / UPSCALE;
		self.yTop -= (transformedPointer.y * (self.zoomLevel -  UPSCALE - 1 * UPSCALE)) / UPSCALE;
		self.updateTiles(self);
	}
	decreaseResolution(self, transformedPointer) {
		self.zoomLevel--;
		self.xLeft += ((transformedPointer.x  * (self.zoomLevel - UPSCALE - 1 * UPSCALE)) / UPSCALE) * (1 / MAX_ZOOMED);
		self.yTop += ((transformedPointer.y  * (self.zoomLevel - UPSCALE - 1 * UPSCALE)) / UPSCALE) * (1 / MAX_ZOOMED);
		self.updateTiles(self);
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
			self.xVelocity = (x - self.lastX) / 1;
			self.yVelocity = (y - self.lastY) / 1;
			self.xLeft += self.xVelocity;
			self.yTop += self.yVelocity;
			self.lastX = x;
			self.lastY = y;
			// canvasFill(self.context.canvas);
		}
	}
	onMouseWheel(self, event) {
		if (self.canScroll) {
			canvasFill(self.context.canvas);
			let transformedPointer = getTransformedPoint(event.clientX, event.clientY, self.context);
			if ((event.wheelDelta < 0 || event.detail > 0)) {
				// roll out
				if (self.scale - SCALE_MULTIPLIER < MIN_ZOOMED - ZOOMED_EPSI && self.zoomLevel > MINIMUM_ZOOM_LEVEL) {
					self.canScroll = false;
					self.decreaseResolution(self, transformedPointer);
					self.scale = MAX_ZOOMED;
					self.scaleCanvas(self, RELATIVE_SCALE_FACTOR * self.scale, transformedPointer);
					// self.context.filter = "blur("+ LOADING_BLUR + "px)";
				} else if (self.zoomLevel != MINIMUM_ZOOM_LEVEL || (self.zoomLevel == MINIMUM_ZOOM_LEVEL && self.scale > MIN_ZOOMED)) {
					self.scale -= SCALE_MULTIPLIER;
					self.absoluteScale = 0.5;
					// console.log(self.scale)
					updateScale(self, transformedPointer);
				}
			} else {
				// roll in
				if (self.scale + SCALE_MULTIPLIER > MAX_ZOOMED + ZOOMED_EPSI && self.zoomLevel < MAXIMUM_ZOOM_LEVEL) {
					self.canScroll = false;
					self.increaseResolution(self, transformedPointer);
					self.scale = MIN_ZOOMED;
					// self.context.filter = "blur("+ LOADING_BLUR + "px)";
				} else if (self.zoomLevel != MAXIMUM_ZOOM_LEVEL || (self.zoomLevel == MAXIMUM_ZOOM_LEVEL && self.scale < MAX_ZOOMED)) {
					self.scale += SCALE_MULTIPLIER;
					self.absoluteScale = 1;
					updateScale(self, transformedPointer);
				}
			}
		}
	}
}


window.onload = function(){
	let view = document.getElementById("view");
	let navigatorView = document.getElementById("navigator");

	let c = view.getContext("2d", {alpha: false});
	let nc = navigatorView.getContext("2d", {alpha: false});

	c.mozImageSmoothingEnabled = false;
	c.webkitImageSmoothingEnabled = false;
	c.msImageSmoothingEnabled = false;
	c.imageSmoothingEnabled = false;

	canvasFill(view);

	slideImage = new ImageData();

	viewer = new SlideView(view, c, slideImage);

	nav = new NavigatorView(navigatorView, nc, viewer);

	slideImage.requestTiles(DEFAULT_ZOOM_LEVEL - UPSCALE, viewer.receiveTiles, viewer);
	nav.requestThumbnail(nav.receiveThumbnail, nav);

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

	let brightnessSlider = document.getElementById("brightnessSlider")
	let contrastSlider = document.getElementById("contrastSlider")
	let saturationSlider = document.getElementById("saturationSlider")

	brightnessSlider.addEventListener("input", function(){
		updateFilters(view, contrastSlider, brightnessSlider, saturationSlider);
	}, false);
	contrastSlider.addEventListener("input", function(){
		updateFilters(view, contrastSlider, brightnessSlider, saturationSlider);
	}, false);
	saturationSlider.addEventListener("input", function(){
		updateFilters(view, contrastSlider, brightnessSlider, saturationSlider);
	}, false);

	window.addEventListener('resize', function(event){
		canvasFill(viewer);
	});

	requestAnimationFrame(function() {
		viewer.draw(viewer);
	});
}