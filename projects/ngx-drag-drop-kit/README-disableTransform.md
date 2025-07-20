# NgxDraggable Directive - disableTransform Feature

## Overview

The `disableTransform` feature in the `NgxDraggableDirective` allows you to choose between two different positioning methods for draggable elements:

1. **Transform-based positioning** (default) - Uses CSS `transform: translate()` for positioning
2. **Left/Top positioning** - Uses CSS `left` and `top` properties for positioning

## Usage

### Basic Usage

```html
<!-- Default behavior (uses transform) -->
<div ngxDraggable>Drag me with transform</div>

<!-- With disableTransform enabled (uses left/top) -->
<div ngxDraggable [disableTransform]="true">Drag me with left/top</div>
```

### With Boundary Constraints

```html
<div class="boundary-container" #boundaryContainer>
  <div 
    ngxDraggable 
    [disableTransform]="true"
    [boundary]="boundaryContainer">
    Constrained draggable with left/top positioning
  </div>
</div>
```

## API Reference

### Input Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `disableTransform` | `boolean` | `false` | When `true`, uses `left`/`top` positioning instead of `transform` |
| `boundary` | `HTMLElement` | `undefined` | Optional boundary element to constrain dragging |

### Output Events

| Event | Type | Description |
|-------|------|-------------|
| `dragStart` | `IPosition` | Emitted when dragging starts |
| `dragMove` | `IPosition` | Emitted during dragging |
| `dragEnd` | `IPosition` | Emitted when dragging ends |
| `entered` | `IPosition` | Emitted when entering a drop zone |
| `exited` | `IPosition` | Emitted when exiting a drop zone |

### Public Methods

| Method | Parameters | Description |
|--------|------------|-------------|
| `resetPosition()` | None | Resets the element to its original position |
| `setPosition(x, y)` | `number, number` | Sets the element to a specific position |

## Technical Details

### Transform-based Positioning (Default)

When `disableTransform` is `false` (default):

- Uses `transform: translate(x, y)` for positioning
- Element maintains its original `left`/`top` values
- Better performance for animations
- Works well with CSS transitions

```css
.element {
  transform: translate(100px, 50px);
}
```

### Left/Top Positioning

When `disableTransform` is `true`:

- Uses `left: x` and `top: y` for positioning
- Element must have `position: absolute`
- Automatically sets `position: absolute` if not already set
- Clears any existing `transform` to avoid conflicts

```css
.element {
  position: absolute;
  left: 100px;
  top: 50px;
  transform: none;
}
```

## Use Cases

### When to Use Transform (Default)

- Better performance for smooth animations
- Works well with CSS transitions and animations
- Preferred for most drag-and-drop scenarios
- Maintains original element positioning

### When to Use Left/Top Positioning

- When you need precise pixel positioning
- When working with layout systems that rely on `left`/`top`
- When you need to integrate with other positioning libraries
- When you want to avoid transform conflicts

## Examples

### Basic Example

```typescript
import { Component } from '@angular/core';
import { IPosition } from 'ngx-drag-drop-kit';

@Component({
  selector: 'app-drag-demo',
  template: `
    <div class="container">
      <!-- Transform-based dragging -->
      <div 
        class="draggable transform-item"
        ngxDraggable
        (dragStart)="onDragStart($event)"
        (dragMove)="onDragMove($event)"
        (dragEnd)="onDragEnd($event)">
        Transform Item
      </div>

      <!-- Left/Top-based dragging -->
      <div 
        class="draggable left-top-item"
        ngxDraggable
        [disableTransform]="true"
        (dragStart)="onDragStart($event)"
        (dragMove)="onDragMove($event)"
        (dragEnd)="onDragEnd($event)">
        Left/Top Item
      </div>
    </div>
  `,
  styles: [`
    .container {
      position: relative;
      height: 400px;
      border: 1px solid #ccc;
    }
    
    .draggable {
      position: absolute;
      width: 100px;
      height: 60px;
      background: #007bff;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: grab;
      border-radius: 4px;
    }
    
    .transform-item {
      top: 50px;
      left: 50px;
    }
    
    .left-top-item {
      top: 150px;
      left: 50px;
    }
  `]
})
export class DragDemoComponent {
  onDragStart(position: IPosition) {
    console.log('Drag started at:', position);
  }

  onDragMove(position: IPosition) {
    console.log('Dragging to:', position);
  }

  onDragEnd(position: IPosition) {
    console.log('Drag ended at:', position);
  }
}
```

### With Boundary Constraints

```typescript
import { Component, ViewChild, ElementRef } from '@angular/core';

@Component({
  selector: 'app-bounded-drag',
  template: `
    <div class="boundary" #boundaryContainer>
      <div 
        class="draggable"
        ngxDraggable
        [disableTransform]="true"
        [boundary]="boundaryContainer">
        Bounded Draggable
      </div>
    </div>
  `,
  styles: [`
    .boundary {
      position: relative;
      width: 300px;
      height: 200px;
      border: 2px solid #333;
      overflow: hidden;
    }
    
    .draggable {
      position: absolute;
      width: 80px;
      height: 50px;
      background: #28a745;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: grab;
      border-radius: 4px;
      top: 50px;
      left: 50px;
    }
  `]
})
export class BoundedDragComponent {
  @ViewChild('boundaryContainer', { static: true }) boundaryContainer!: ElementRef;
}
```

## Migration Guide

### From Transform to Left/Top

If you need to switch from transform-based to left/top positioning:

1. Add `[disableTransform]="true"` to your draggable element
2. Ensure the element has `position: absolute` (automatically set by the directive)
3. The directive will automatically handle the positioning method switch

### From Left/Top to Transform

If you want to switch back to transform-based positioning:

1. Remove `[disableTransform]="true"` or set it to `false`
2. The directive will automatically use transform positioning
3. Any existing `left`/`top` styles will be cleared

## Browser Compatibility

Both positioning methods work in all modern browsers:

- **Transform**: IE9+, Chrome, Firefox, Safari, Edge
- **Left/Top**: All browsers (CSS positioning is well-supported)

## Performance Considerations

- **Transform**: Generally better performance for animations and GPU acceleration
- **Left/Top**: May cause more layout recalculations but provides more precise positioning

## Troubleshooting

### Common Issues

1. **Element not moving**: Ensure the element has proper positioning (`position: absolute` for left/top)
2. **Conflicting styles**: The directive automatically clears conflicting styles
3. **Boundary not working**: Make sure the boundary element is properly referenced

### Debug Tips

- Check the browser console for position logging
- Use browser dev tools to inspect computed styles
- Verify that the boundary element is correctly set

## Changelog

- **v1.0.0**: Initial implementation of `disableTransform` feature
- Added support for both transform and left/top positioning
- Added automatic position detection and style management
- Added boundary constraint support for both positioning methods 