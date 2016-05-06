(function (root, factory) {
	'use strict';
	if (typeof module !== 'undefined' && module.exports) {
		// CommonJS module is defined
		var isNode = (typeof process !== 'undefined');
		var isElectron = isNode && ('electron' in process.versions);
		if (isElectron) {
			root.BootstrapDialog = factory(root.jQuery);
		} else {
			module.exports = factory(require('jquery'), require('TYPO3/CMS/MfcProductconfigurator/BootstrapDialog'));
		}
	} else if (typeof define === 'function' && define.amd) {
		// AMD module is defined
		define(['jquery'], function ($, root) {
			return factory($, root);
		});
	} else {
		// planted over the root!
		root.evowebBarcodeScanner = factory(root.jQuery, root);
	}
}(this, function ($, root) {
	var module = {
		namespace: '.evoweb-barcode-scanner',
		container: null,
		video: null,
		canvas: null,
		context: null,
		// variable will contain stream object once its captured
		stream: null,
		streamRunning: false
	};

	function initialize() {
		$(document).ready(function () {
			module.container = $(module.namespace);
			module.video = $('video:eq(0)', module.container)[0];
			module.canvas = module.getCanvas();
			module.context = module.canvas[0].getContext('2d');

			var video = $(module.video);

			// this fixed that with high resolution webcam the canvas gets only a portion of the capture
			module.canvas.attr('width', module.canvas.width());
			module.canvas.attr('height', module.canvas.height());
			video.attr('width', video.width());
			video.attr('height', video.height());

			module.attachVideoCapture();

			$(document).on('click', module.namespace + ' .startStop', function () {
				if (module.streamRunning) {
					module.detachVideoCapture();
				} else {
					module.attachVideoCapture();
				}
			});

			$(document).on('click', module.namespace + ' .capture', function () {
				module.context.drawImage(module.video, 0, 0, module.canvas.width(), module.canvas.height());
			});
		});
	}

	module.getCanvas = function () {
		var $canvas = $('canvas:eq(0)', module.namespace);

		if ($canvas.length == 0) {
			$canvas = $('<canvas/>');
		}

		return $canvas;
	};

	module.attachVideoCapture = function () {
		var videoObj = {"video": true},
			errBack = function (error) {
				console.log("Video capture error: ", error.code);
			};

		// Put video listeners into place
		if (navigator.getUserMedia) { // Standard
			navigator.getUserMedia(videoObj, function (localStream) {
				module.stream = localStream;
				module.video.src = localStream;
				module.video.play();
			}, errBack);
		} else if (navigator.webkitGetUserMedia) { // WebKit-prefixed
			navigator.webkitGetUserMedia(videoObj, function (localStream) {
				module.stream = localStream;
				module.video.src = root.URL.createObjectURL(localStream);
				module.video.play();
			}, errBack);
		} else if (navigator.mozGetUserMedia) { // Firefox-prefixed
			navigator.mozGetUserMedia(videoObj, function (localStream) {
				module.stream = localStream;
				module.video.src = root.URL.createObjectURL(localStream);
				module.video.play();
			}, errBack);
		}
		module.streamRunning = true;
	};

	module.detachVideoCapture = function () {
		module.video.src = '';
		module.video.pause();

		var track = module.stream.getTracks()[0];
		track.stop();

		module.streamRunning = false;
	};

	initialize();

	return module;
}));
