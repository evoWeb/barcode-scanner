requirejs.config({
	baseUrl: 'Resources/JavaScipt',
	paths: {
		jquery: '../../node_modules/jquery/dist/jquery.min',
		Evoweb: '.'
	}
});
requirejs(['Evoweb/Barcode']);