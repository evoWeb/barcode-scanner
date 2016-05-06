/* globals module, define, require, process */
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
		debug: false,

		// variable will contain stream object once its captured
		stream: null,
		streamRunning: false
	};

	function initialize() {
		module.registerNewsElement();

		$(document).ready(function () {
			module.container = $(module.namespace);
			module.getVideo();
			module.getCanvas();

			module.addStartStopButton();
			module.attachVideoCapture();
			module.enableDebugMode();
		});
	}

	module.registerNewsElement = function() {
		module.element = root.document.registerElement('evoweb-barcode-scanner');
	};

	module.getVideo = function () {
		var $video = module.container.find('video:eq(0)');

		if ($video.length === 0) {
			$video = $('<video/>');
			module.container.append($video);
		}

		module.video = $video;
		module.video.attr('width', module.video.width());
		module.video.attr('height', module.video.height());
	};

	module.getCanvas = function () {
		var $canvas = module.container.find('canvas:eq(0)');

		if ($canvas.length === 0) {
			$canvas = $('<canvas/>');
			module.container.append($canvas);
		}

		module.canvas = $canvas;
		module.canvas.attr('width', module.canvas.width());
		module.canvas.attr('height', module.canvas.height());

		module.context = $canvas[0].getContext('2d');

		module.context.beginPath();
		module.context.moveTo(0, module.canvas.height() / 2);
		module.context.lineTo(module.canvas.width(), module.canvas.height() / 2);
		module.context.stroke();
	};


	module.attachVideoCapture = function () {
		var video = module.video[0],
			videoObj = {"video": true},
			errBack = function (error) {
				console.log("Video capture error: ", error.code);
			};

		// Put video listeners into place
		if (navigator.getUserMedia) { // Standard
			navigator.getUserMedia(videoObj, function (localStream) {
				module.stream = localStream;
				video.src = localStream;
				video.play();
			}, errBack);
		} else if (navigator.webkitGetUserMedia) { // WebKit-prefixed
			navigator.webkitGetUserMedia(videoObj, function (localStream) {
				module.stream = localStream;
				video.src = root.URL.createObjectURL(localStream);
				video.play();
			}, errBack);
		} else if (navigator.mozGetUserMedia) { // Firefox-prefixed
			navigator.mozGetUserMedia(videoObj, function (localStream) {
				module.stream = localStream;
				video.src = root.URL.createObjectURL(localStream);
				video.play();
			}, errBack);
		}
		module.streamRunning = true;
	};

	module.detachVideoCapture = function () {
		var video = module.video[0];

		video.src = '';
		video.pause();

		var track = module.stream.getTracks()[0];
		track.stop();

		module.streamRunning = false;
	};


	module.addStartStopButton = function() {
		var $startStop = $('<button class="startStop">Toggle video</button>').on('click', function () {
			if (module.streamRunning) {
				module.detachVideoCapture();
			} else {
				module.attachVideoCapture();
			}
		});

		module.container.after($startStop);
	};

	module.enableDebugMode = function() {
		if (module.container.data('debug') === 1) {
			module.debug = $('<div class="debug"/>');

			module.container.before(module.debug);

			module.debug.html('debug on');
		}
	};


	initialize();

	return module;
}));
