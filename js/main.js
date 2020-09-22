// GLOBAL CONSTANTS

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
// determines how much each mouse scroll scales the canvas - keep as fraction of 1
const SCALE_MULTIPLIER = 1/4;
// determines minimum scaled view before resolution downsized
const MIN_ZOOMED = 0.5;
// determines max scaled view before resolution upsized
const MAX_ZOOMED = MIN_ZOOMED + SCALE_MULTIPLIER;
// epsilon value to threshold floating numbers
const ZOOMED_EPSI = 0.05;
// used to accurately scale sizes
const RELATIVE_SCALE_FACTOR = 2;
// controls how much the view will continue sliding after panning - higher friction = less sliding
const FRICTION = 1.1;
// path to all resolution folders for xhml http requests
const DZC_OUTPUT_PATH = "/VMICs/dzc_output_files/";
// path to navigation image folder for xhml http request
const THUMBNAIL_PATH = "/VMICs/dzc_output_files/9/";


// CLASSES

// class that deals with the image data, and requesting image tiles
// this was going to be used to unpack the zip file, but writing an unzipper
// in JS didn't seem like the main point of the challenge
// - that's why this class isn't used much, and the image folders are extracted manually
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


// class that handles the navigation component - still requires some small adjustments
class NavigatorView {
	constructor(canvas, context, viewer) {
		// initalise variables
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
		self.topPadding = document.getElementById("top").offsetHeight;
	}

	// main render function for the navigation canvas
	draw(self) {
		requestAnimationFrame( function() {
			self.draw(self);
		});
		self.context.clearRect(0, 0, self.canvas.width, self.canvas.height);
		self.context.drawImage(self.background, 0, 0);
		if (self.viewer.canScroll) {
			self.ratioW = (self.canvas.width / self.viewer.widthV) * 2;
			self.ratioH = (self.canvas.height / (self.viewer.heightV - self.topPadding)) * 2;
			self.navPointX = -self.ratioW * self.viewer.xLeft;
			self.navPointY = -self.ratioH * (self.viewer.yTop + self.topPadding);
			self.navPointWidth = self.ratioW * self.viewer.canvas.width;
			self.navPointHeight = self.ratioH * (self.viewer.canvas.height);
		}
		self.context.beginPath();
		self.context.rect(self.navPointX - 10, self.navPointY + 10, self.navPointWidth, self.navPointHeight);
		self.context.fillStyle = "rgba(0, 0, 0, 0.3)";
		self.context.fill();
		self.context.restore();
	}
	// perform initial canvas sizing
	setupCanvas(self) {
		self.canvas.height = (self.background.height - 20) / 2;
		self.canvas.width = (self.background.width - 20) / 2;
	}
	// request image for navigation background
	requestThumbnail(resultFunction, self) {
		requestImage(THUMBNAIL_PATH, resultFunction, self);
	}
	// set image as background once received
	receiveThumbnail(self, image) {
		self.background = image;
		self.setupCanvas(self);
		self.context.scale(0.5, 0.5);
		self.draw(self);
	}
	// used to help move navigation preview to right location on scroll in
	mouseIn(self, event) {
		let transformedPointer = getTransformedPoint(event.clientX, event.clientY, self.context);
		self.context.translate(transformedPointer.x, transformedPointer.y);
	}
	// used to help move navigation preview to right location on scroll out
	mouseOut(self, event) {
		let transformedPointer = getTransformedPoint(event.clientX, event.clientY, self.context);
		self.context.translate(-transformedPointer.x, -transformedPointer.y);
	}
	// used to help move navigation preview when mouse scrolled
	onMouseWheel(self, event, direction) {
		self.context.save();
		if (direction) {
			self.mouseIn(self, event);
		} else {
			self.mouseOut(self, event);
		}
	}
}

// this class handles the main view of the slide
class SlideView {
	constructor(canvas, context, ImageData) {
		// initalise variables
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
		self.widthVOriginal = 1;
		self.heightVOriginal = 1;
		self.widthVOld = 1;
		self.heightVOld = 1;
		self.lastX = 0;
		self.lastY = 0;
		self.scale = 0.5;
		self.absoluteScale = 1.0;
		self.xVelocity = 0;
		self.yVelocity = 0;
		self.zoomLevel = DEFAULT_ZOOM_LEVEL - UPSCALE;
		self.loaded = false;
	}

	// handle the new resolution tiles received after xhml http request response
	receiveTiles(self, imgArray) {
		let trackHeight = 0;
		let trackWidth = 0;
		let totalHeight = 0;
		let totalWidth = 0;
		let i = 0;
		let lena = imgArray.length;
		self.heightVOld = self.heightVOriginal;
		self.widthVOld = self.widthVOriginal;
		// iterate the received array of images, sort into drawing array with correct offsets
		while (i < lena) {
			let tile = imgArray[i];
			let imageSrc = tile["image"];
			if (i == 0) {
				trackWidth = imageSrc.naturalWidth;
				trackHeight = imageSrc.naturalHeight;
			}
			if (tile["xCoord"] == 0) {
				totalHeight += imageSrc.naturalHeight;
			} else if (tile["yCoord"] == 0) {
				totalWidth += imageSrc.naturalWidth;
			}
			self.drawQueue.push({
				imageSrc: imageSrc,
				xOff: trackWidth * tile["xCoord"],
				yOff: trackHeight * tile["yCoord"]
			});
			++i;
		};
		self.canScroll = true;
		self.widthV = totalWidth;
		self.heightV = totalHeight;
		self.widthVOriginal = self.widthV;
		self.heightVOriginal = self.heightV;
		// if (self.loaded) {
			// self.xLeft = (-self.widthVOriginal/2 + self.canvas.width/2);
			// self.yTop = (-self.heightVOriginal/2 + self.canvas.height/2);
		// }
		// self.loaded = true;
	}
	// main render function for the slide viewer
	draw(self) {
		requestAnimationFrame( function() {
			self.draw(self);
		});
		self.context.save();
		// set sliding and friction property after panning completed
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
		// iterate the drawing array, rendering each tile at given offsets
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
	}
	// scale canvas when scrolled, while still within resolution threshold
	scaleCanvas(self, scale, transformedPointer, navFunc, nav) {
		canvasFill(self.context.canvas);
		self.context.translate(transformedPointer.x, transformedPointer.y);
		navFunc(nav, event, 1);
		self.context.scale(scale, scale);
		self.context.translate(-transformedPointer.x, -transformedPointer.y);
		navFunc(nav, event, 0);
		self.widthV = (self.widthVOriginal * self.absoluteScale);
		self.heightV = (self.widthVOriginal * self.absoluteScale);
	}
	// update the resolution of the viewer
	updateTiles(self) {
		self.drawQueue.length = 0;
		self.absoluteScale = 1.0;
		self.ImageData.requestTiles(self.zoomLevel, self.receiveTiles, self);
	}
	// increase the current resolution
	increaseResolution(self, transformedPointer, event) {
		self.zoomLevel++;
		self.xLeft -= (transformedPointer.x * (self.zoomLevel - UPSCALE - 1 * UPSCALE)) / UPSCALE;
		self.yTop -= (transformedPointer.y * (self.zoomLevel -  UPSCALE - 1 * UPSCALE)) / UPSCALE;
		self.updateTiles(self);
	}
	// decrease the current resolution
	decreaseResolution(self, transformedPointer, event) {
		self.zoomLevel--;
		self.xLeft += ((transformedPointer.x  * (self.zoomLevel - UPSCALE - 1 * UPSCALE)) / UPSCALE) * (1 / MAX_ZOOMED);
		self.yTop += ((transformedPointer.y  * (self.zoomLevel - UPSCALE - 1 * UPSCALE)) / UPSCALE) * (1 / MAX_ZOOMED);
		self.updateTiles(self);
	}
	// handle mouse pressed
	onMouseDown(self, event) {
		self.mouseDown = true;
		self.lastX = event.clientX;
		self.lastY = event.clientY;
	}
	// handle mouse released
	onMouseUp(self) {
		self.mouseDown = false;
	}
	// handle mouse moving
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
		}
	}
	// handle mouse scrolling
	onMouseWheel(self, event, navFunc, nav) {
		self.lastX = event.clientX;
		self.lastY = event.clientY;
		// wait for current resolution to be loaded before scrolling - prevent things breaking
		if (self.canScroll) {
			canvasFill(self.context.canvas);
			let transformedPointer = getTransformedPoint(event.clientX, event.clientY, self.context);
			if ((event.wheelDelta < 0 || event.detail > 0)) {
				// user is zooming out
				if (self.scale - SCALE_MULTIPLIER < MIN_ZOOMED - ZOOMED_EPSI && self.zoomLevel > MINIMUM_ZOOM_LEVEL) {
					// decrease resolution
					self.canScroll = false;
					self.decreaseResolution(self, transformedPointer);
					self.scale = MAX_ZOOMED;
					self.scaleCanvas(self, RELATIVE_SCALE_FACTOR * self.scale, transformedPointer, navFunc, nav);
				} else if (self.zoomLevel != MINIMUM_ZOOM_LEVEL || (self.zoomLevel == MINIMUM_ZOOM_LEVEL && self.scale > MIN_ZOOMED)) {
					self.scale -= SCALE_MULTIPLIER;
					// decrease scale
					self.absoluteScale = 1;
					nav.onMouseWheel(nav, event);
					self.scaleCanvas(self, RELATIVE_SCALE_FACTOR * self.scale, transformedPointer, navFunc, nav);
				}
			} else {
				// user is zooming in
				if (self.scale + SCALE_MULTIPLIER > MAX_ZOOMED + ZOOMED_EPSI && self.zoomLevel < MAXIMUM_ZOOM_LEVEL) {
					// increase resolution
					self.canScroll = false;
					self.increaseResolution(self, transformedPointer, event);
					self.scale = MIN_ZOOMED;
				} else if (self.zoomLevel != MAXIMUM_ZOOM_LEVEL || (self.zoomLevel == MAXIMUM_ZOOM_LEVEL && self.scale < MAX_ZOOMED)) {
					// increase scale
					self.scale += SCALE_MULTIPLIER;
					self.absoluteScale = 1.5;
					self.scaleCanvas(self, RELATIVE_SCALE_FACTOR * self.scale, transformedPointer, navFunc, nav);
				}
			}
		}
	}
}


// MAIN FUNCTION

window.onload = function(){
	// set canvas variables
	let view = document.getElementById("view");
	let navigatorView = document.getElementById("navigator");

	// set context variables
	let c = view.getContext("2d", {alpha: false});
	let nc = navigatorView.getContext("2d", {alpha: false});

	// disable image smoothing for sharper images
	c.mozImageSmoothingEnabled = false;
	c.webkitImageSmoothingEnabled = false;
	c.msImageSmoothingEnabled = false;
	c.imageSmoothingEnabled = false;

	// resize canvas to fill window
	canvasFill(view);

	// sett up class objects
	slideImage = new ImageData();
	viewer = new SlideView(view, c, slideImage);
	nav = new NavigatorView(navigatorView, nc, viewer);

	//  initialise viwer processes
	slideImage.requestTiles(DEFAULT_ZOOM_LEVEL - UPSCALE, viewer.receiveTiles, viewer);
	nav.requestThumbnail(nav.receiveThumbnail, nav);

	// add event listeners
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
		viewer.onMouseWheel(viewer, event, nav.onMouseWheel, nav);
	}, false);
	view.addEventListener("DOMMouseScroll", function(){
		viewer.onMouseWheel(viewer, event, nav.onMouseWheel, nav);
	}, false);

	// set up filter adjustment sliders
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

	// begin the rendering of main viewer canvas
	requestAnimationFrame(function() {
		viewer.draw(viewer);
	});
}