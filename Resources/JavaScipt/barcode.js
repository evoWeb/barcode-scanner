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
		define(['jquery'], function ($) {
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
		module.registerNewElement();
		module.initializeGetUserMedia();

		module.container = $(module.namespace);
		module.getCanvas();
		module.getVideo();
		module.getOverlay();

		module.addStartStopButton();
		module.enableDebugMode();

		if (module.container.data('autostart') === 1) {
			module.attachVideoCapture();
		}
	}

	// until caniuse does not show green for all browsers this isn't in use
	module.registerNewElement = function () {
		module.element = root.document.registerElement('evoweb-barcode-scanner');
	};

	module.initializeGetUserMedia = function () {
		navigator.getUserMedia = navigator.getUserMedia ||
			navigator.webkitGetUserMedia ||
			navigator.mozGetUserMedia ||
			navigator.msGetUserMedia;
	};


	module.getCanvas = function () {
		var $canvas = module.container.find('canvas:eq(0)');

		if ($canvas.length === 0) {
			$canvas = $('<canvas/>');
			module.container.append($canvas);
		}

		module.canvas = $canvas;
		module.canvas.attr('width', module.container.width());
		module.canvas.attr('height', module.container.height());

		module.context = $canvas[0].getContext('2d');
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

	module.getOverlay = function () {
		var $overlay = module.container.find('canvas.overlay:eq(0)');

		if ($overlay.length === 0) {
			$overlay = $('<canvas class="overlay"/>');
			module.container.append($overlay);
		}

		$overlay.attr('width', $overlay.width());
		$overlay.attr('height', $overlay.height());

		var context = $overlay[0].getContext('2d'),
			halfHeight = Math.floor($overlay.height() / 2);
		context.beginPath();
		context.moveTo(0, halfHeight);
		context.lineTo($overlay.width(), halfHeight);
		context.stroke();
	};


	module.enableDebugMode = function () {
		if (module.container.data('debug') === 1) {
			module.debug = $('<div class="debug"/>');

			module.container.before(module.debug);

			module.debug.html('debug on');
		}
	};

	module.addStartStopButton = function () {
		var $startStop = $('<button class="startStop">Toggle video</button>').on('click', function () {
			if (module.streamRunning) {
				module.detachVideoCapture();
			} else {
				module.attachVideoCapture();
			}
		});

		module.container.after($startStop);
	};

	module.attachVideoCapture = function () {
		var video = module.video[0],
			videoConfig = {"video": true, "audio": false},
			errBack = function (error) {
				if (module.debug !== false) {
					module.debug.html("Video capture error: ", error.code);
				}
			};

		navigator.getUserMedia(
			videoConfig,
			function (localStream) {
				module.stream = localStream;
				video.src = root.URL.createObjectURL ? root.URL.createObjectURL(localStream) : localStream;
				video.play();
			},
			errBack
		);

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


	initialize();

	return module;
}));
