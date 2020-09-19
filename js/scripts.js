// canvas vars
var view = document.getElementById("view");
var c = view.getContext("2d");

// make canvas fill the window
function canvasFill() {
	view.height = window.innerHeight;
	view.width = window.innerWidth;
}

// initial setup
canvasFill();