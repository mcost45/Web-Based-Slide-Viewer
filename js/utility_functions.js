// make canvas fill the window
function canvasFill(canvas) {
	canvas.height = window.innerHeight;
	canvas.width = window.innerWidth;
}

// get file extension from file name
function getFileExtension(fileName) {
	return fileName.split('.').pop();
}

// check if extension is vmic
function checkVmic(extension) {
	if (extension == "vmic") {
		return 1;
	} else {
		console.log("Not a .vmic file.");
		return 0;
	}
}

// get file from the end of a path
function getFileFromPath(path) {
	return path.substring(path.lastIndexOf('/') + 1);
}

// remove file extension from file name
function removeFileExtension(file) {
	return file.replace(/\.[^/.]+$/, "");
}

// split file name into X and Y coordinates
function getCoords(X_Y) {
	return X_Y.split("_");
}

// check if a tile is on screen by checking for rectangles intersecting
function isOnScreen(aXStart, aXEnd, aYStart, aYEnd,
	bXStart, bXEnd, bYStart, bYEnd) {
	return aXEnd >= bXStart && aXStart <= bXEnd && aYStart <= bYEnd && aYEnd >= bYStart;
}

// transform a mouse point to canvas coordinates
function getTransformedPoint(x, y, context) {
	let inverse = context.getTransform().invertSelf();
	let transX = inverse.a * x + inverse.c * y + inverse.e;
	let transY = inverse.b * x + inverse.d * y + inverse.f;
	return {x: transX, y: transY};
}

// update CSS filters to match slider values
function updateFilters(view, contrastSlider, brightnessSlider, saturationSlider) {
	view.style.webkitFilter = "contrast(" + contrastSlider.value / 255 + ") brightness(" + brightnessSlider.value / 255 + ") saturate(" + saturationSlider.value / 255 + ")";
}

// request the first image from a folder - used to get navigation component background
// performs an asynchronous xhml http request, using the callback function provided once image is fetched
// if the local web server is not running, this function will be blocked as the browser does not have permission
function requestImage(dir, callback, self) {
	let req = new XMLHttpRequest();
	req.open("GET", dir, true);
	req.responseType = 'document';
	req.onerror = function () {
		alert("XMLHttpRequest Error: The local webserver must be running for the browser to request files.");
	}
	req.onload = () => {
		if (req.status === 200) {
			// perform if request successful
			let img = document.createElement("img");
			// wait for image to be loaded before callback
			img.onload = function() {
				callback(self, img);
			}
			img.src = req.response.getElementsByTagName("a")[0].href;
		} else {
			alert("Failed Request: " + req.status);
		}
	}
	req.send();
}

// request all the images in a folder
// performs an asynchronous xhml http request, using the callback function provided once image is fetched
// if the local web server is not running, this function will be blocked as the browser does not have permission
function requestImages(dir, callback, self) {
	let imgArray = [];
	let req = new XMLHttpRequest();
	req.open("GET", dir, true);
	req.responseType = 'document';
	req.onerror = function () {
		alert("XMLHttpRequest Error: The local webserver must be running for the browser to request files.");
	}
	req.onload = () => {
		if (req.status === 200) {
			// perform if request successful
			let elements = req.response.getElementsByTagName("a");
			let loaded = 0;
			let i = 0;
			let lenc = elements.length;
			while (i < lenc) {
				x = elements[i];
				let fileName = removeFileExtension(getFileFromPath(x.href));
				let coords = getCoords(fileName);
				let img = document.createElement("img");
				// wait for every single image to be loaded before calling the callback function
				img.onload = function() {
					loaded++;
					if (loaded == elements.length) {
						callback(self, imgArray);
					}
				}
				img.src = x.href;
				imgArray.push({
					xCoord: coords[0],
					yCoord: coords[1],
					image: img
				});
				++i;
			};
		} else {
			alert("Failed Request: " + req.status);
		}
	}
	req.send();
}