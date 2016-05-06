# Install like

Either as RequireJS AMD module
```html
<script src="node_modules/requirejs/require.js" type="text/javascript"></script>
<script type="text/javascript">
	requirejs.config({
		baseUrl: 'Resources/JavaScipt',
		paths: {
			jquery: '../../node_modules/jquery/dist/jquery.min',
			evoweb: '.'
		}
	});
	requirejs(['evoweb/barcode']);
</script>
```

Or just as plain javascript version
```html
<script src="node_modules/jquery/dist/jquery.min.js" type="text/javascript"></script>
<script src="Resources/JavaScipt/barcode.js" type="text/javascript"></script>
```
