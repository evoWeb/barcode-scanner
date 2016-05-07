/* globals module, define, require, process */
define(['jquery', 'window', 'Evoweb/CaptureDevice'], function ($, root, CaptureDevice) {
	function BarcodeScanner() {
		this.namespace = '.evoweb-barcode-scanner';
		this.canvas = null;
		this.context = null;

		this.video = null;
		this.debugContainer = false;

		this.container = $(this.namespace);
		this.captureDevice = new CaptureDevice(
			this,
			this.container.width(),
			this.container.height()
		);

		this.initializeGetUserMedia();

		this.getCanvas();
		this.getOverlay();

		this.addStartStopButton();
		this.enableDebugMode();

		if (this.container.data('autostart') === 1) {
			this.captureDevice.start();
		}
	}

	/**
	 * initialization of getUserMedia in navigator to be able to use it with
	 * unified api
	 *
	 * @return void
	 */
	BarcodeScanner.prototype.initializeGetUserMedia = function () {
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
	BarcodeScanner.prototype.getCanvas = function () {
		var self = this,
			$canvas = self.container.find('canvas.display:eq(0)');

		if ($canvas.length === 0) {
			$canvas = $('<canvas class="display"/>');
			self.container.append($canvas);
		}

		self.canvas = $canvas;
		self.canvas.attr('width', self.container.width());
		self.canvas.attr('height', self.container.height());

		self.context = $canvas[0].getContext('2d');

		$(self)
			.on('videoCaptured', function (event, video) {
				self.updateCanvas(video);
			})
			.on('shutdown', function () {
				self.shutDownControl();
			});
	};

	/**
	 * Add an overlay over the display canvas to have a target frame with
	 * horizontal line
	 *
	 * @return void
	 */
	BarcodeScanner.prototype.getOverlay = function () {
		var $overlay = this.container.find('canvas.overlay:eq(0)');

		if ($overlay.length === 0) {
			$overlay = $('<canvas class="overlay"/>');
			this.container.append($overlay);
		}

		$overlay.attr('width', this.container.width());
		$overlay.attr('height', this.container.height());

		var context = $overlay[0].getContext('2d'),
			halfHeight = Math.floor(this.container.height() / 2);
		context.beginPath();
		context.moveTo(0, halfHeight);
		context.lineTo(this.container.width(), halfHeight);
		context.stroke();
	};


	/**
	 * Add debugging output container
	 *
	 * @return void
	 */
	BarcodeScanner.prototype.enableDebugMode = function () {
		var self = this;

		if (self.container.data('debug') === 1) {
			self.debugContainer = $('<div class="debug">debug on</div>');

			self.container.before(self.debugContainer);

			$(self).on('debug', function (event, message) {
				self.debug(message);
			});
		}
	};

	/**
	 * Debug the message in an container
	 *
	 * @param {string} message
	 * @return void
	 */
	BarcodeScanner.prototype.debug = function (message) {
		if (this.debugContainer !== false) {
			this.debugContainer.html(message);
		}
	};

	/**
	 * Removes elements and deletes capture device
	 *
	 * @return void
	 */
	BarcodeScanner.prototype.shutDownControl = function () {
		var message = 'No webcam available to capture from.';

		if (this.debugContainer) {
			this.debug(message);
			return;
		}

		delete this.captureDevice;
		this.container.find('canvas').remove();
		this.container.parent().find('.startStop').remove();
		this.container.addClass('disabled').append(message);
	};


	/**
	 * Add start stop toggle button after container and attach click event
	 *
	 * @return void
	 */
	BarcodeScanner.prototype.addStartStopButton = function () {
		var self = this,
			$startStop = $('<button class="startStop">Toggle video</button>').on('click', function () {
			if (!self.captureDevice.isCapturing()) {
				self.captureDevice.start();
			} else {
				self.captureDevice.stop();

				self.context.clearRect(0, 0, self.container.width(), self.container.height());
			}
		});

		self.container.after($startStop);
	};

	/**
	 * Update content of canvas with video content
	 *
	 * @return void
	 */
	BarcodeScanner.prototype.updateCanvas = function (video) {
		this.context.drawImage(
			video,
			0,
			0,
			this.canvas.width(),
			this.canvas.height()
		);
	};

	function initialize() {
		return new BarcodeScanner();
	}
	initialize();

	return BarcodeScanner;
});
