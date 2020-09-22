# Web-Based-Slide-Viewer #

##Data Fetching Strategy ##
To fetch the images that made up each scan resolution, I used XML HTTP requests (AJAX). These requests are blocked for browser security locally, so to get around that a local web-server is required. Using the provided 'start_dev_server.bat' will start the server (using Python 3), or you can just use 'py -3 -m http.server' with CMD from the folder (or your own preferred method). Once the server is running the slide viewer can be accessed at http://localhost:8000/. I manually extracted the 'dzc_output_files' folder from the .vmic zip, as I figured writing vanilla JS to unzip the contents was not a focus of this challenge. The mentioned folder is not in .gitignore for convenience.

##Improvements I Would Include if I Had More Time##
