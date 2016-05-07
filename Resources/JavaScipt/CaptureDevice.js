define(['jquery', 'window'], function ($, root) {
	function CaptureDevice(barcodeScanner, width, height) {
		this.barcodeScanner = barcodeScanner;

		// variable will contain stream object once its captured
		this.stream = null;
		this.streamRunning = false;

		// capture interval related values
		this.captureInterval = 0;
		this.captureIntervalLength = 40;

		// HTMLElement to capture stream with
		this.video = this.initializeVideo(width, height);
	}

	/**
	 * Create video element that is not attached to the dom to only be able to
	 * captcha the stream for usage in canvas
	 *
	 * @return HTMLElement
	 */
	CaptureDevice.prototype.initializeVideo = function (width, height) {
		var $video = $('<video/>')
			.attr('width', width)
			.attr('height', height);
		return $video[0];
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
				$(self.barcodeScanner).trigger('debug', [ 'Video capture error: ' + error.name ]);
				$(self.barcodeScanner).trigger('shutdown');
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

		this.stream.getTracks().forEach(function (track) {
			track.stop();
		});

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
		$(this.barcodeScanner).trigger('videoCaptured', [ this.video ]);
	};

	return CaptureDevice;
});