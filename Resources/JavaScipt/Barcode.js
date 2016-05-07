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
		debugContainer: false,

		canvas: null,
		context: null,
		canvasUpdateInterval: 0,
		updateIntervalLength: 40
	};

	function initialize() {
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

	/**
	 * as long caniuse.com does not show green for all browsers not used
	 */
	module._registerNewElement = function () {
		module.element = root.document.registerElement('evoweb-barcode-scanner');
	};

	/**
	 * initialization of getUserMedia in navigator to be able to use it with
	 * unified api
	 *
	 * @return void
	 */
	module.initializeGetUserMedia = function () {
		navigator.getUserMedia = navigator.getUserMedia ||
			navigator.webkitGetUserMedia ||
			navigator.mozGetUserMedia ||
			navigator.msGetUserMedia;
	};

	/**
	 * Add a canvas to display the stream content and acts as base for barcode
	 * detection and decoding
	 *
	 * @return void
	 */
	module.getCanvas = function () {
		var $canvas = module.container.find('canvas.display:eq(0)');

		if ($canvas.length === 0) {
			$canvas = $('<canvas class="display"/>');
			module.container.append($canvas);
		}

		module.canvas = $canvas;
		module.canvas.attr('width', module.container.width());
		module.canvas.attr('height', module.container.height());

		module.context = $canvas[0].getContext('2d');
	};

	/**
	 * Add an overlay over the display canvas to have a target frame with
	 * horizontal line
	 *
	 * @return void
	 */
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


	/**
	 * Add debugging output container
	 *
	 * @return void
	 */
	module.enableDebugMode = function () {
		if (module.container.data('debug') === 1) {
			module.debugContainer = $('<div class="debug">debug on</div>');

			module.container.before(module.debugContainer);
		}
	};

	/**
	 * Debug the message in an container
	 *
	 * @param {string} message
	 * @param {int} code
	 * @return void
	 */
	module.debug = function (message, code) {
		if (module.debugContainer !== false) {
			module.debugContainer.html(message.replace('%d', code));
		}
	};

	module.shutDownControl = function () {
		var message = 'No webcam available to capture from.';
		if (module.debugContainer) {
			module.debug(message, 0);
			return;
		}

		module.video = null;
		module.container.find('canvas').remove();
		module.container.parent().find('.startStop').remove();
		module.container.addClass('disabled').append(message);
	};


	/**
	 * Add start stop toggle button after container and attach click event
	 */
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

	/**
	 * Get user media as stream and attach it to an unattached video element
	 * from which the content gets rendered as image on a canvas.
	 *
	 * Sets streamRunning flag to be able to detect on that and stop the stream
	 * accordingly on toggle.
	 *
	 * Start canvas update interval in the end
	 *
	 * @return void
	 */
	module.attachVideoCapture = function () {
		navigator.getUserMedia(
			{
				'video': true,
				'audio': false
			},
			function (localStream) {
				module.stream = localStream;

				// detect if createObjectURL is available and use it else the stream directly
				module.video.src = root.URL.createObjectURL ? root.URL.createObjectURL(module.stream) : module.stream;
				module.video.play();

				module.streamRunning = true;

				module.startCanvasUpdateInterval();
			},
			function (error) {
				module.debug('Video capture error: %d', error.code);
				module.shutDownControl();
			}
		);
	};

	/**
	 * Stop canvas update interval, video play and stream capture. Clears the
	 * canvas and the stream running flag
	 */
	module.detachVideoCapture = function () {
		module.stopCanvasUpdateInterval();

		module.video.pause();

		module.stream.getTracks()[0].stop();

		module.context.clearRect(0, 0, module.container.width(), module.container.height());

		module.streamRunning = false;
	};

	/**
	 * Update content of canvas with video content
	 *
	 * @return void
	 */
	module.updateCanvas = function () {
		module.context.drawImage(module.video, 0, 0, module.canvas.width(), module.canvas.height());
	};

	/**
	 * Starts an interval which calls the update canvas method
	 *
	 * @return void
	 */
	module.startCanvasUpdateInterval = function () {
		module.canvasUpdateInterval = setInterval(module.updateCanvas, module.updateIntervalLength);
	};

	/**
	 * Clears interval that calls the update canvas method
	 *
	 * @return void
	 */
	module.stopCanvasUpdateInterval = function () {
		clearInterval(module.canvasUpdateInterval);
	};

	initialize();

	return module;
}));
