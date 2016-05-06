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

		// variable will contain stream object once its captured
		stream: null,
		streamRunning: false,
		debug: false,

		canvas: null,
		context: null,
		canvasUpdateInterval: 0
	};

	function initialize() {
		module.registerNewElement();
		module.initializeGetUserMedia();

		module.container = $(module.namespace);
		module.getCanvas();
		module.getOverlay();
		module.getVideo();

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

	module.getOverlay = function () {
		var $overlay = module.container.find('canvas.overlay:eq(0)');

		if ($overlay.length === 0) {
			$overlay = $('<canvas class="overlay"/>');
			module.container.append($overlay);
		}

		$overlay.attr('width', module.container.width());
		$overlay.attr('height', module.container.height());

		var context = $overlay[0].getContext('2d'),
			halfHeight = Math.floor(module.container.height() / 2);
		context.beginPath();
		context.moveTo(0, halfHeight);
		context.lineTo(module.container.width(), halfHeight);
		context.stroke();
	};

	/**
	 * Create video element that is not attached to the dom to only be able to
	 * captcha the stream for usage in canvas
	 *
	 * @return void
	 */
	module.getVideo = function () {
		var $video = $('<video/>')
			.attr('width', module.container.width())
			.attr('height', module.container.height());
		module.video = $video[0];
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
		navigator.getUserMedia(
			{
				'video': true,
				'audio': false
			},
			function (localStream) {
				module.stream = localStream;
				module.video.src = root.URL.createObjectURL ? root.URL.createObjectURL(module.stream) : module.stream;
				module.video.play();

				module.streamRunning = true;

				module.startCanvasUpdateInterval();
			},
			function (error) {
				if (module.debug !== false) {
					module.debug.html('Video capture error: ', error.code);
				}
			}
		);
	};

	module.detachVideoCapture = function () {
		module.stopCanvasUpdateInterval();

		module.video.pause();

		module.stream.getTracks()[0].stop();

		module.context.clearRect(0, 0, module.container.width(), module.container.height());

		module.streamRunning = false;
	};

	module.updateCanvas = function () {
		module.context.drawImage(module.video, 0, 0, module.canvas.width(), module.canvas.height());
	};

	module.startCanvasUpdateInterval = function () {
		module.canvasUpdateInterval = setInterval(function() { module.updateCanvas(); }, 100);
	};

	module.stopCanvasUpdateInterval = function () {
		clearInterval(module.canvasUpdateInterval);
	};

	initialize();

	return module;
}));
