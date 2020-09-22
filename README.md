# Web-Based-Slide-Viewer
![preview](https://github.com/mcost45/Web-Based-Slide-Viewer/raw/master/preview.jpg)

## Data Fetching Strategy
To fetch the images that made up each scan resolution, I used XML HTTP requests (AJAX). These requests are blocked for browser security offline, so to get around that a local web-server is required. Using the provided 'start_dev_server.bat' will start the server (using Python 3), or you can just use 'py -3 -m http.server' with CMD from within the folder (or your own preferred method). Once the server is running the slide viewer can be accessed at http://localhost:8000/. I manually extracted the 'dzc_output_files' folder from the .vmic zip, as I figured writing vanilla JS to unzip the contents was not a focus of this challenge. The mentioned folder is not in .gitignore for convenience.

In the rendering function for the main view, I checked the intersections between each tile and window rectangles so only the visible image tiles would be drawn. Within the draw loops, as well as event handlers that were constantly running, such as 'mouseMouve', I aimed to make the code light so it wouldn't slow down the page or take up too many resources.

## Things I Was in the Process of Doing / Improvements I Would Include if I Had More Time
1. Include a better transition in between resolutions changing, e.g. blurring last view until new loaded
2. Add scroll scaling easing
3. Make the navigator component current area preview slightly more accurate, and indicate zoom/x/y levels
4. When the resolution changes, have the zoom more accurately zoom in/out from the mouse position
5. Buttons to reset filter adjustment/zoom level
6. Adding ability to take a .vmic file directly