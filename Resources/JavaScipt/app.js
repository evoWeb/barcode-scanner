requirejs.config({
	baseUrl: 'Resources/JavaScipt',
	urlArgs: 'now=' + Date.now(),
	paths: {
		jquery: '../../node_modules/jquery/dist/jquery.min',
		'Evoweb\/Test': '../../Tests',
		'Evoweb': '.'
	}
});
requirejs(['Evoweb/BarcodeScanner']);