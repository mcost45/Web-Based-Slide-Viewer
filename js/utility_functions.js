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

function requestImages(dir, callback, context) {
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
					let img = new Image();
					img.src = x.href
					imgArray.push({
						xCoord: coords[0],
						yCoord: coords[1],
						image: img
					});
				} 
			};
			callback(imgArray);
		} else {
			alert('Failed Request: ' + req.status);
		}
	}
	req.send();
}