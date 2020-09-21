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

function isOnScreen(aXStart, aXEnd, aYStart, aYEnd,
	bXStart, bXEnd, bYStart, bYEnd) {
	return aXEnd >= bXStart && aXStart <= bXEnd && aYStart <= bYEnd && aYEnd >= bYStart;
}

function getTransformedPoint(x, y, context) {
	let inverse = context.getTransform().invertSelf();
	let transX = inverse.a * x + inverse.c * y + inverse.e;
	let transY = inverse.b * x + inverse.d * y + inverse.f;
	return {x: transX, y: transY};
}

function mapToNav(x, y, width, height, ratio) {
	let newX = x * ratio;
	let newY = y * ratio;
	let newWidth = width * ratio;
	let newHeight = height * ratio;
	return {x: newX, y: newY, width: newWidth, height: newHeight};
}

function updateScale(self, transformedPointer) {
	canvasFill(self.context.canvas);
	self.scaleCanvas(self, RELATIVE_SCALE_FACTOR * self.scale, transformedPointer);
}

function updateFilters(view, contrastSlider, brightnessSlider, saturationSlider) {
	view.style.webkitFilter = "contrast(" + contrastSlider.value / 255 + ") brightness(" + brightnessSlider.value / 255 + ") saturate(" + saturationSlider.value / 255 + ")";
}

function requestImage(dir, callback, self) {
	let req = new XMLHttpRequest();
	req.open("GET", dir, true);
	req.responseType = 'document';
	req.onerror = function () {
		alert("XMLHttpRequest Error: The local webserver must be running for the browser to request files.");
	}
	req.onload = () => {
		if (req.status === 200) {
			let img = document.createElement("img");
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
			let elements = req.response.getElementsByTagName("a");
			let loaded = 0;
			let i = 0;
			let lenc = elements.length;
			while (i < lenc) {
				x = elements[i];
				let fileName = removeFileExtension(getFileFromPath(x.href));
				let coords = getCoords(fileName);
				let img = document.createElement("img");
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
			// loop finished, do something now until the onload function fulfills
			// callback(imgArray);
		} else {
			alert("Failed Request: " + req.status);
		}
	}
	req.send();
}