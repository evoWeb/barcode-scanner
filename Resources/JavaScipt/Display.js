define(['jquery', 'window'], function ($, root) {
	function Display(barcodeScanner, width, height, startStopCallback) {
		this.barcodeScanner = barcodeScanner;
		this.container = this.barcodeScanner.container;
		this.startStopCallback = startStopCallback;

		this.canvas = null;
		this.context = null;

		this.getCanvas(width, height);
		this.getOverlay(width, height);
		this.addStartStopButton();
	}

	/**
	 * Add a canvas to display the stream content and acts as base for barcode
	 * detection and decoding
	 *
	 * @return void
	 */
	Display.prototype.getCanvas = function (width, height) {
		var self = this,
			$canvas = self.container.find('canvas.display:eq(0)');

		if ($canvas.length === 0) {
			$canvas = $('<canvas class="display"/>');
			self.container.append($canvas);
		}

		self.canvas = $canvas;
		self.canvas.attr('width', width);
		self.canvas.attr('height', height);

		self.context = $canvas[0].getContext('2d');

		$(this.barcodeScanner)
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
	Display.prototype.getOverlay = function (width, height) {
		var $overlay = this.container.find('canvas.overlay:eq(0)');

		if ($overlay.length === 0) {
			$overlay = $('<canvas class="overlay"/>');
			this.container.append($overlay);
		}

		$overlay.attr('width', width);
		$overlay.attr('height', height);

		var context = $overlay[0].getContext('2d'),
			halfHeight = Math.floor(height / 2);
		context.beginPath();
		context.moveTo(0, halfHeight);
		context.lineTo(width, halfHeight);
		context.stroke();
	};

	/**
	 * Add start stop toggle button after container and attach click event
	 *
	 * @return void
	 */
	Display.prototype.addStartStopButton = function () {
		var self = this,
			$startStop = $('<button class="startStop">Toggle video</button>').on(
				'click',
				function (event) {
					self.startStopCallback(self.barcodeScanner, this, event);
					self.context.clearRect(0, 0, self.canvas.width(), self.canvas.height());
				}
			);

		self.container.after($startStop);
	};

	/**
	 * Update content of canvas with video content
	 *
	 * @return void
	 */
	Display.prototype.updateCanvas = function (video) {
		this.context.drawImage(
			video,
			0,
			0,
			this.canvas.width(),
			this.canvas.height()
		);
	};

	/**
	 * Removes all canvases and add message to element
	 *
	 * @return void
	 */
	Display.prototype.shutDown = function (message) {
		this.container.find('canvas').remove();
		this.container.addClass('disabled').append(message);
		this.container.parent().find('.startStop').remove();
	};

	return Display;
});