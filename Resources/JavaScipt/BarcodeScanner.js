define(['jquery', 'window', 'Evoweb/CaptureDevice', 'Evoweb/Display'], function ($, root, CaptureDevice, Display) {
	function BarcodeScanner() {
		this.namespace = '.evoweb-barcode-scanner';
		this.container = $(this.namespace);
		this.data = this.container.data();

		this.debugContainer = false;

		this.initializeDebug();

		this.display = new Display(
			this,
			this.container.width(),
			this.container.height(),
			this.startStopAction
		);
		this.captureDevice = new CaptureDevice(
			this,
			this.container.width(),
			this.container.height()
		);

		if (this.data['autostart'] === 1) {
			this.captureDevice.start();
		}
	}


	/**
	 * Add debugging output container
	 *
	 * @return void
	 */
	BarcodeScanner.prototype.initializeDebug = function () {
		var self = this;

		if (self.data['debug'] === 1) {
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
		this.display.shutDown(message);
	};

	/**
	 * Handles behavior triggered by clicks of the start stop button
	 *
	 * @param {BarcodeScanner} controller
	 */
	BarcodeScanner.prototype.startStopAction = function (controller) {
		if (!controller.captureDevice.isCapturing()) {
			controller.captureDevice.start();
		} else {
			controller.captureDevice.stop();
		}
	};


	function initialize() {
		return new BarcodeScanner();
	}
	initialize();

	return BarcodeScanner;
});
