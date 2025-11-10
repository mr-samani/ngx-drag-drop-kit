export interface IGridOverlayOutput {
	id: string;
	remove: () => void;
}
export interface IGridOverlayOptions {
	id?: string;
	stroke?: string;
	strokeWidth?: number;
	highlight?: string;
	label?: boolean;
}
/**
 * createGridOverlay(rects, options)
 * rects: Array of objects with left, top, right, bottom (page coordinates: include scroll offsets)
 * options: { id?: string, stroke?: string, strokeWidth?: number, highlight?: string }
 * Returns overlayId string (use removeGridOverlay(id) to remove)
 */
export function createGridOverlay(rects: DOMRect[] = [], options: IGridOverlayOptions = {}) {
	const {
		id = `ngx-drag-drop-kit-grid-overlay`,
		stroke = 'rgba(0,0,0,0.12)',
		strokeWidth = 1,
		highlight = 'rgba(0,120,215,0.35)',
		label = false, // set true if you want coordinate labels
	} = options;

	// remove if exists
	const existing = document.getElementById(id);
	if (existing) existing.remove();

	// compute page dims (cover whole document)
	const doc = document.documentElement;
	const width = Math.max(doc.scrollWidth, doc.clientWidth, window.innerWidth || 0);
	const height = Math.max(doc.scrollHeight, doc.clientHeight, window.innerHeight || 0);

	// normalize rects to contain: left, top, right, bottom
	const normalized = rects.map(r => ({
		left: Number(r.left || 0),
		top: Number(r.top || 0),
		right: Number(r.right ?? r.left + (r.width || 0)),
		bottom: Number(r.bottom ?? r.top + (r.height || 0)),
	}));

	// gather unique x and y positions
	const xs = new Set<number>();
	const ys = new Set<number>();
	normalized.forEach(r => {
		xs.add(Math.round(r.left));
		xs.add(Math.round(r.right));
		ys.add(Math.round(r.top));
		ys.add(Math.round(r.bottom));
	});

	// sort numeric
	const xArr = Array.from(xs).sort((a, b) => a - b);
	const yArr = Array.from(ys).sort((a, b) => a - b);

	// create overlay container
	const container = document.createElement('div');
	container.id = id;
	Object.assign(container.style, {
		position: 'absolute',
		left: window.scrollX + 'px',
		top: window.scrollY + 'px',
		width: width + 'px',
		height: height + 'px',
		pointerEvents: 'none', // let clicks pass through
		zIndex: '2147483646', // very high but below browser chrome
		overflow: 'visible',
	});

	// create SVG
	const svgNS = 'http://www.w3.org/2000/svg';
	const svg = document.createElementNS(svgNS, 'svg');
	svg.setAttribute('width', width.toString());
	svg.setAttribute('height', height.toString());
	svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
	svg.setAttribute('preserveAspectRatio', 'none');
	svg.style.display = 'block';

	// background layer (transparent)
	const bg = document.createElementNS(svgNS, 'rect');
	bg.setAttribute('x', '0');
	bg.setAttribute('y', '0');
	bg.setAttribute('width', String(width));
	bg.setAttribute('height', String(height));
	bg.setAttribute('fill', 'transparent');
	svg.appendChild(bg);

	// helper to draw line
	function makeLine(x1: number, y1: number, x2: number, y2: number, opts: any = {}) {
		const ln = document.createElementNS(svgNS, 'line');
		ln.setAttribute('x1', String(x1));
		ln.setAttribute('y1', String(y1));
		ln.setAttribute('x2', String(x2));
		ln.setAttribute('y2', String(y2));
		ln.setAttribute('stroke', opts.stroke || stroke);
		ln.setAttribute('stroke-width', String(opts.strokeWidth ?? strokeWidth));
		if (opts.opacity) ln.setAttribute('opacity', String(opts.opacity));
		if (opts.class) ln.setAttribute('class', opts.class);
		// crisp edges
		ln.setAttribute('shape-rendering', 'crispEdges');
		return ln;
	}

	// draw vertical grid lines (full height)
	xArr.forEach(x => {
		const line = makeLine(x + 0.5, 0, x + 0.5, height, { stroke, strokeWidth });
		svg.appendChild(line);
	});

	// draw horizontal grid lines (full width)
	yArr.forEach(y => {
		const line = makeLine(0, y + 0.5, width, y + 0.5, { stroke, strokeWidth });
		svg.appendChild(line);
	});

	// highlight rect edges with stronger color
	normalized.forEach(r => {
		// top
		svg.appendChild(
			makeLine(r.left + 0.5, r.top + 0.5, r.right + 0.5, r.top + 0.5, { stroke: highlight, strokeWidth: 2 })
		);
		// bottom
		svg.appendChild(
			makeLine(r.left + 0.5, r.bottom + 0.5, r.right + 0.5, r.bottom + 0.5, { stroke: highlight, strokeWidth: 2 })
		);
		// left
		svg.appendChild(
			makeLine(r.left + 0.5, r.top + 0.5, r.left + 0.5, r.bottom + 0.5, { stroke: highlight, strokeWidth: 2 })
		);
		// right
		svg.appendChild(
			makeLine(r.right + 0.5, r.top + 0.5, r.right + 0.5, r.bottom + 0.5, { stroke: highlight, strokeWidth: 2 })
		);
	});

	// optional labels (coordinates) — disabled by default (label=false)
	if (label) {
		normalized.forEach(r => {
			const tx = document.createElementNS(svgNS, 'text');
			tx.setAttribute('x', String(r.left + 4));
			tx.setAttribute('y', String(r.top + 14));
			tx.setAttribute('font-size', '12');
			tx.setAttribute('fill', '#0078d4');
			tx.textContent = `L:${r.left} T:${r.top}`;
			svg.appendChild(tx);
		});
	}

	container.appendChild(svg);
	document.body.appendChild(container);

	// keep overlay size in sync on resize/scroll (useful if user resizes/scrolls)
	function sync() {
		const doc = document.documentElement;
		const w = Math.max(doc.scrollWidth, doc.clientWidth, window.innerWidth || 0);
		const h = Math.max(doc.scrollHeight, doc.clientHeight, window.innerHeight || 0);
		container.style.width = w + 'px';
		container.style.height = h + 'px';
		svg.setAttribute('width', String(w));
		svg.setAttribute('height', String(h));
		svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
	}
	// window.addEventListener('resize', sync);
	// window.addEventListener('scroll', sync);

	// return id and cleanup handle
	return {
		id,
		remove: () => {
			window.removeEventListener('resize', sync);
			window.removeEventListener('scroll', sync);
			const el = document.getElementById(id);
			if (el) el.remove();
		},
	};
}

/**
 * removeGridOverlay(handleOrId)
 * Accepts either the returned handle from createGridOverlay or an id string
 */
function removeGridOverlay(handleOrId: string | Element) {
	if (!handleOrId) return;
	if (typeof handleOrId === 'string') {
		const el = document.getElementById(handleOrId);
		if (el) el.remove();
		return;
	}
	if (handleOrId && typeof handleOrId.remove === 'function') {
		handleOrId.remove();
	}
}
