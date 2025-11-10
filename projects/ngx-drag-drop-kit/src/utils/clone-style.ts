export function copyEssentialStyles(source: HTMLElement, target: HTMLElement) {
	const styles = window.getComputedStyle(source);
	const keysToCopy = [
		'font',
		'font-size',
		'line-height',
		'font-weight',
		'color',
		'background-color',
		'border',
		'border-radius',
		//'box-shadow',
		'padding',
		// 'margin',
		'text-align',
		'vertical-align',
		'display',
		'align-items',
		'justify-content',
		'gap',
		'width',
		'height',
		'max-width',
		'max-height',
		'min-width',
		'min-height',
		'outline',
		'outline-offset',
		'outline-color',
	];

	keysToCopy.forEach(key => {
		const value = styles.getPropertyValue(key);
		if (value) {
			target.style.setProperty(key, value, styles.getPropertyPriority(key));
		}
	});
}
