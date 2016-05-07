define(['jquery', 'window'], function ($, root) {
	function CaptureDevice(barcodeScanner) {
		this.barcodeScanner = barcodeScanner;
		this.container = null;

		this.video = null;
		// variable will contain stream object once its captured
		this.stream = null;
		this.streamRunning = null;

		this.captureInterval = 0;
		this.captureIntervalLength = 40;

		this.getVideo();
	}

	/**
	 * Create video element that is not attached to the dom to only be able to
	 * captcha the stream for usage in canvas
	 *
	 * @return void
	 */
	CaptureDevice.prototype.getVideo = function () {
		var $video = $('<video/>')
			.attr('width', this.barcodeScanner.container.width())
			.attr('height', this.barcodeScanner.container.height());
		this.video = $video[0];
	};

	/**
	 * Returns the video element to be drawn on canvas
	 *
	 * @return HTMLElement
	 */
	CaptureDevice.prototype.getImage = function () {
		return this.video;
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
		var self = this;

		navigator.getUserMedia(
			{
				'video': true,
				'audio': false
			},
			function (localStream) {
				self.stream = localStream;

				// detect if createObjectURL is available and use it else the stream directly
				self.video.src = root.URL.createObjectURL ?
					root.URL.createObjectURL(self.stream) :
					self.stream;
				self.video.play();

				self.streamRunning = true;

				self.startCanvasUpdateInterval();
			},
			function (error) {
				self.barcodeScanner.debug('Video capture error: %d', error.code);
				self.barcodeScanner.shutDownControl();
			}
		);
	};

	/**
	 * Stop canvas update interval, video play and stream capture. Clears the
	 * canvas and the stream running flag
	 */
	CaptureDevice.prototype.stop = function () {
		this.stopCanvasUpdateInterval();

		this.video.pause();

		this.stream.getTracks()[0].stop();

		this.streamRunning = false;
	};

	/**
	 * Starts an interval which calls the update canvas method
	 *
	 * @return void
	 */
	CaptureDevice.prototype.startCanvasUpdateInterval = function () {
		this.captureInterval = setInterval(
			this.triggerCaptureEvent,
			this.captureIntervalLength
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

	CaptureDevice.prototype.triggerCaptureEvent = function () {
		console.log('test');
	};

	return CaptureDevice;
});