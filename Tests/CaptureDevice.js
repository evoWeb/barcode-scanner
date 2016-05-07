define(['jquery', 'window'], function ($, root) {
	function CaptureDevice(barcodeScanner, width, height) {
		this.barcodeScanner = barcodeScanner;

		// variable will contain stream object once its captured
		this.stream = null;
		this.streamRunning = false;

		// capture interval related values
		this.captureInterval = 0;
		this.captureIntervalLength = 40 * 10000;

		// HTMLElement to capture stream with
		this.fixture = this.initializeFixture(width, height, this.barcodeScanner.container.data('test'));
	}

	/**
	 * Create video element that is not attached to the dom to only be able to
	 * captcha the stream for usage in canvas
	 *
	 * @return HTMLElement
	 */
	CaptureDevice.prototype.initializeFixture = function (width, height, imageUrl) {
		var $fixture = $('<img/>')
			.attr('src', imageUrl)
			.attr('width', width)
			.attr('height', height);
		return $fixture[0];
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
	CaptureDevice.prototype.start = function () {
		this.streamRunning = true;

		this.triggerCaptureEvent();
		this.startCanvasUpdateInterval();
	};

	/**
	 * Stop canvas update interval, video play and stream capture. Clears the
	 * canvas and the stream running flag
	 */
	CaptureDevice.prototype.stop = function () {
		this.stopCanvasUpdateInterval();

		this.streamRunning = false;
	};

	/**
	 * Returns if the stream running flag is set or not
	 *
	 * @returns boolean
	 */
	CaptureDevice.prototype.isCapturing = function () {
		return this.streamRunning;
	};

	/**
	 * Starts an interval which calls the update canvas method
	 *
	 * @return void
	 */
	CaptureDevice.prototype.startCanvasUpdateInterval = function () {
		var self = this;

		self.captureInterval = setInterval(
			function () { self.triggerCaptureEvent(); },
			self.captureIntervalLength
		);
	};

	/**
	 * Clears interval that calls the update canvas method
	 *
	 * @return void
	 */
	CaptureDevice.prototype.stopCanvasUpdateInterval = function () {
		clearInterval(this.captureInterval);
	};

	/**
	 * Triggers custom event on barcodeScanner with video as argument
	 *
	 * @return void
	 */
	CaptureDevice.prototype.triggerCaptureEvent = function () {
		$(this.barcodeScanner).trigger('videoCaptured', [ this.fixture ]);
	};

	return CaptureDevice;
});