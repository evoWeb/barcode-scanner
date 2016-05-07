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
			module.exports = factory(require('jquery'), require('window'));
		}
	} else if (typeof define === 'function' && define.amd) {
		// AMD module is defined
		define(['jquery', 'window'], function ($, root) {
			return factory($, root);
		});
	} else {
		// planted over the root!
		root.evowebBarcodeScanner = factory(root.jQuery, root);
	}
}(this, function ($, root) {
	var BarcodeScanner = {
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
		BarcodeScanner.initializeGetUserMedia();

		BarcodeScanner.container = $(BarcodeScanner.namespace);
		BarcodeScanner.getCanvas();
		BarcodeScanner.getOverlay();
		BarcodeScanner.getVideo();

		BarcodeScanner.addStartStopButton();
		BarcodeScanner.enableDebugMode();

		if (BarcodeScanner.container.data('autostart') === 1) {
			BarcodeScanner.attachVideoCapture();
		}
	}

	/**
	 * as long caniuse.com does not show green for all browsers not used
	 */
	BarcodeScanner._registerNewElement = function () {
		BarcodeScanner.element = root.document.registerElement('evoweb-barcode-scanner');
	};

	/**
	 * initialization of getUserMedia in navigator to be able to use it with
	 * unified api
	 *
	 * @return void
	 */
	BarcodeScanner.initializeGetUserMedia = function () {
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
	BarcodeScanner.getCanvas = function () {
		var $canvas = BarcodeScanner.container.find('canvas.display:eq(0)');

		if ($canvas.length === 0) {
			$canvas = $('<canvas class="display"/>');
			BarcodeScanner.container.append($canvas);
		}

		BarcodeScanner.canvas = $canvas;
		BarcodeScanner.canvas.attr('width', BarcodeScanner.container.width());
		BarcodeScanner.canvas.attr('height', BarcodeScanner.container.height());

		BarcodeScanner.context = $canvas[0].getContext('2d');
	};

	/**
	 * Add an overlay over the display canvas to have a target frame with
	 * horizontal line
	 *
	 * @return void
	 */
	BarcodeScanner.getOverlay = function () {
		var $overlay = BarcodeScanner.container.find('canvas.overlay:eq(0)');

		if ($overlay.length === 0) {
			$overlay = $('<canvas class="overlay"/>');
			BarcodeScanner.container.append($overlay);
		}

		$overlay.attr('width', BarcodeScanner.container.width());
		$overlay.attr('height', BarcodeScanner.container.height());

		var context = $overlay[0].getContext('2d'),
			halfHeight = Math.floor(BarcodeScanner.container.height() / 2);
		context.beginPath();
		context.moveTo(0, halfHeight);
		context.lineTo(BarcodeScanner.container.width(), halfHeight);
		context.stroke();
	};

	/**
	 * Create video element that is not attached to the dom to only be able to
	 * captcha the stream for usage in canvas
	 *
	 * @return void
	 */
	BarcodeScanner.getVideo = function () {
		var $video = $('<video/>')
			.attr('width', BarcodeScanner.container.width())
			.attr('height', BarcodeScanner.container.height());
		BarcodeScanner.video = $video[0];
	};


	/**
	 * Add debugging output container
	 *
	 * @return void
	 */
	BarcodeScanner.enableDebugMode = function () {
		if (BarcodeScanner.container.data('debug') === 1) {
			BarcodeScanner.debugContainer = $('<div class="debug">debug on</div>');

			BarcodeScanner.container.before(BarcodeScanner.debugContainer);
		}
	};

	/**
	 * Debug the message in an container
	 *
	 * @param {string} message
	 * @param {int} code
	 * @return void
	 */
	BarcodeScanner.debug = function (message, code) {
		if (BarcodeScanner.debugContainer !== false) {
			BarcodeScanner.debugContainer.html(message.replace('%d', code));
		}
	};

	BarcodeScanner.shutDownControl = function () {
		var message = 'No webcam available to capture from.';
		if (BarcodeScanner.debugContainer) {
			BarcodeScanner.debug(message, 0);
			return;
		}

		BarcodeScanner.video = null;
		BarcodeScanner.container.find('canvas').remove();
		BarcodeScanner.container.parent().find('.startStop').remove();
		BarcodeScanner.container.addClass('disabled').append(message);
	};


	/**
	 * Add start stop toggle button after container and attach click event
	 */
	BarcodeScanner.addStartStopButton = function () {
		var $startStop = $('<button class="startStop">Toggle video</button>').on('click', function () {
			if (BarcodeScanner.streamRunning) {
				BarcodeScanner.detachVideoCapture();
			} else {
				BarcodeScanner.attachVideoCapture();
			}
		});

		BarcodeScanner.container.after($startStop);
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
	BarcodeScanner.attachVideoCapture = function () {
		navigator.getUserMedia(
			{
				'video': true,
				'audio': false
			},
			function (localStream) {
				BarcodeScanner.stream = localStream;

				// detect if createObjectURL is available and use it else the stream directly
				BarcodeScanner.video.src = root.URL.createObjectURL ?
					root.URL.createObjectURL(BarcodeScanner.stream) :
					BarcodeScanner.stream;
				BarcodeScanner.video.play();

				BarcodeScanner.streamRunning = true;

				BarcodeScanner.startCanvasUpdateInterval();
			},
			function (error) {
				BarcodeScanner.debug('Video capture error: %d', error.code);
				BarcodeScanner.shutDownControl();
			}
		);
	};

	/**
	 * Stop canvas update interval, video play and stream capture. Clears the
	 * canvas and the stream running flag
	 */
	BarcodeScanner.detachVideoCapture = function () {
		BarcodeScanner.stopCanvasUpdateInterval();

		BarcodeScanner.video.pause();

		BarcodeScanner.stream.getTracks()[0].stop();

		BarcodeScanner.context.clearRect(0, 0, BarcodeScanner.container.width(), BarcodeScanner.container.height());

		BarcodeScanner.streamRunning = false;
	};

	/**
	 * Update content of canvas with video content
	 *
	 * @return void
	 */
	BarcodeScanner.updateCanvas = function () {
		BarcodeScanner.context.drawImage(
			BarcodeScanner.video,
			0,
			0,
			BarcodeScanner.canvas.width(),
			BarcodeScanner.canvas.height()
		);
	};

	/**
	 * Starts an interval which calls the update canvas method
	 *
	 * @return void
	 */
	BarcodeScanner.startCanvasUpdateInterval = function () {
		BarcodeScanner.canvasUpdateInterval = setInterval(
			BarcodeScanner.updateCanvas,
			BarcodeScanner.updateIntervalLength
		);
	};

	/**
	 * Clears interval that calls the update canvas method
	 *
	 * @return void
	 */
	BarcodeScanner.stopCanvasUpdateInterval = function () {
		clearInterval(BarcodeScanner.canvasUpdateInterval);
	};

	initialize();

	return BarcodeScanner;
}));
