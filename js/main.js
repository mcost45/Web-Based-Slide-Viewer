// const vmicFileInput = document.getElementById("selectVMIC");

// canvas vars
var view = document.getElementById("view");
var c = view.getContext("2d");

// initial setup
canvasFill(view);

slideImage = new ImageData();
viewer = new SlideView(view, slideImage);

slideImage.requestTiles(9);

// vmicFileInput.addEventListener("change", function() {
// 	const file = this.files[0];
// 	slideImage.loadVmic(file);
// }, false);