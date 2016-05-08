define(['jquery'], function ($) {
	function CaptureDevice(barcodeScanner, width, height) {
		this.barcodeScanner = barcodeScanner;

		// variable will contain stream object once its captured
		this.stream = null;
		this.streamRunning = false;

		// capture interval related values
		this.captureInterval = 0;
		this.captureIntervalLength = 40 * 10000;

		// HTMLElement to capture stream with
		this.fixture = this.initializeFixture(width, height, this.barcodeScanner.data['test']);
	}

	/**
	 * Create video element that is not attached to the dom to only be able to
	 * captcha the stream for usage in canvas
	 *
	 * @return HTMLElement
	 */
	CaptureDevice.prototype.initializeFixture = function (width, height, imageUrl) {
		var $img = $('<img/>')
				.css({
					opacity: 0,
					position: 'absolute',
					top: 0,
					left: 0
				})
				.attr('src', imageUrl),
			$fixture = $('<canvas/>')
				.attr('width', width)
				.attr('height', height);
		this.barcodeScanner.container.after($img);

		// get the smallest multiplier to reduce the image equal in height and
		// width to fit into the detection area
		var heightMultiplier = width / $img.width(),
			widthMultiplier = height / $img.height(),
			multiplier = heightMultiplier < widthMultiplier ? heightMultiplier : widthMultiplier;

		var paddingImageX = width * 0.15,
			paddingImageY = height * 0.15,
			canvasImageWidth = (($img.width() * multiplier) - (paddingImageX * 2)),
			canvasImageHeight = (($img.height() * multiplier) - (paddingImageY * 2)),
			canvasImageX = (width - canvasImageWidth) / 2,
			canvasImageY = (height - canvasImageHeight) / 2;

		$fixture[0].getContext('2d').drawImage(
			$img[0],
			canvasImageX,
			canvasImageY,
			canvasImageWidth,
			canvasImageHeight
		);

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
	};

	/**
	 * Stop canvas update interval, video play and stream capture. Clears the
	 * canvas and the stream running flag
	 */
	CaptureDevice.prototype.stop = function () {
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
	 * Triggers custom event on barcodeScanner with video as argument
	 *
	 * @return void
	 */
	CaptureDevice.prototype.triggerCaptureEvent = function () {
		$(this.barcodeScanner).trigger('videoCaptured', [ this.fixture ]);
	};

	return CaptureDevice;
});