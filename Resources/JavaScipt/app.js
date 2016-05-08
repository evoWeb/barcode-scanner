requirejs.config({
	baseUrl: 'Resources/JavaScipt',
	urlArgs: 'now=' + Date.now(),
	paths: {
		jquery: '../../node_modules/jquery/dist/jquery.min',
		'Evoweb\/Tests': '../../Tests',
		'Evoweb': '.'
	},
	mao: {
		'Evoweb/BarcodeScanner': {
			'Evoweb/CaptureDevice': 'Evoweb/Test/CaptureDevice'
		}
	}
});
requirejs(['Evoweb/BarcodeScanner']);