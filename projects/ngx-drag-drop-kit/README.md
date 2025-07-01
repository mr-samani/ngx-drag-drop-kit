<div align="center">

<h2 style="color:#fff;background:#d32f2f;padding:24px 12px;border-radius:12px;max-width:700px;margin:32px auto 24px auto;font-size:1.3em;">
🚨 <span style="color:#fff;">This library is currently in <b>BETA</b>.<br>
<strong>Do NOT use in production</strong> until the final release is published.</span> 🚨
</h2>

</div>

# 🚀 ngx-drag-drop-kit

[🇮🇷 مشاهده به فارسی](./README.fa.md) | [🇬🇧 English Version](./README.md)

A powerful and modular Angular library for advanced Drag & Drop, Grid Layout, horizontal/vertical lists, sorting, resizing, and more.

---

## 🗂️ Table of Contents
- [✨ Features](#-features)
- [🔧 Installation](#-installation)
- [⚡ Quick Start](#-quick-start)
- [📚 Usage Guide](#-usage-guide)
  - [🎯 Simple Drag & Drop](#simple-drag--drop)
  - [🧩 Grid Layout](#grid-layout)
  - [📏 Resizable](#resizable)
  - [🔄 Sortable List](#sortable-list)
  - [🌳 Nested Tree Sort](#nested-tree-sort)
- [📝 Inputs/Outputs Table](#-inputsoutputs-table)
- [🔬 Code Samples](#-code-samples)
- [🤝 Contributing](#-contributing)
- [📄 License](#-license)

---

## ✨ Features

- 🖱️ **Advanced Drag & Drop** with multi-list and cross-list support
- 🧩 **Configurable & Responsive Grid Layout**
- 📏 **Resizable**: Resize items with mouse
- 🔄 **Sortable List**: Reorder items via Drag & Drop
- ➡️ **Horizontal List**: Horizontal drag & drop
- 🌳 **Nested Tree Sort**: Tree structure sorting
- 🗃️ **Copy to Zone**: Copy items to another zone
- 🧲 **Snap to Grid**
- 🛡️ **Boundary**: Set boundaries for drag/resize
- 🖼️ **Custom Placeholder**
- ⚡ **Performance Optimized**
- 🧑‍💻 **Fully modular, Angular 18+ ready**

---

## 🔧 Installation

```bash
npm install ngx-drag-drop-kit
```
Or with yarn:
```bash
yarn add ngx-drag-drop-kit
```

---

## ⚡ Quick Start

```typescript
import { NgxDragDropKitModule } from 'ngx-drag-drop-kit';

@NgModule({
  imports: [NgxDragDropKitModule, ...]
})
export class AppModule {}
```

---

## 📚 Usage Guide

### 🎯 Simple Drag & Drop

```html
<div ngxDropList (drop)="drop($event)" [data]="todoList">
  <div ngxDraggable *ngFor="let item of todoList">{{ item }}</div>
</div>
```

```typescript
import { IDropEvent, moveItemInArray, transferArrayItem } from 'ngx-drag-drop-kit';

drop(event: IDropEvent) {
  if (event.previousContainer === event.container) {
    moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
  } else {
    transferArrayItem(event.previousContainer.data, event.container.data, event.previousIndex, event.currentIndex);
  }
}
```

---

### 🧩 Grid Layout

```html
<grid-layout [options]="options">
  <grid-item *ngFor="let item of layouts" [config]="item.config">
    {{ item.title }}
  </grid-item>
</grid-layout>
```

```typescript
import { IGridLayoutOptions, GridItemConfig } from 'ngx-drag-drop-kit';

options: IGridLayoutOptions = { cols: 12, gap: 10 };
layouts = [
  { config: new GridItemConfig(0, 0, 2, 2), title: 'Item 1' },
  ...
];
```

---

### 📏 Resizable

```html
<div ngxResizable [minWidth]="50" [minHeight]="50" (resize)="onResize($event)">
  Resizable!
</div>
```

---

### 🔄 Sortable List

```html
<div ngxDropList [data]="items" (drop)="drop($event)">
  <div ngxDraggable *ngFor="let item of items">{{ item }}</div>
</div>
```

---

### 🌳 Nested Tree Sort

```html
<nested-tree-sort [data]="treeData" (drop)="onTreeDrop($event)"></nested-tree-sort>
```

---

## 📝 Inputs/Outputs Table

| Name           | Type/Directive              | Description                                 | Input/Output |
|----------------|----------------------------|---------------------------------------------|--------------|
| `ngxDraggable` | Directive                   | Makes an item draggable                     | Input        |
| `boundary`     | Input (HTMLElement)         | Drag boundary                               | Input        |
| `dragStart`    | Output (EventEmitter)       | Drag start event                            | Output       |
| `dragMove`     | Output (EventEmitter)       | Drag move event                             | Output       |
| `dragEnd`      | Output (EventEmitter)       | Drag end event                              | Output       |
| `ngxResizable` | Directive                   | Makes an item resizable                     | Input        |
| `minWidth`     | Input (number)              | Minimum width                               | Input        |
| `minHeight`    | Input (number)              | Minimum height                              | Input        |
| `resize`       | Output (EventEmitter)       | Resize event                                | Output       |
| `ngxDropList`  | Directive                   | Drop list directive                         | Input        |
| `data`         | Input (any[])               | List data                                   | Input        |
| `drop`         | Output (EventEmitter)       | Drop event                                  | Output       |
| `GridLayoutComponent` | Component              | Grid layout component                       | Input        |
| `options`      | Input (IGridLayoutOptions)  | Grid options                                | Input        |
| `GridItemComponent`   | Component              | Grid item component                         | Input        |
| `config`       | Input (GridItemConfig)      | Grid item config                            | Input        |

---

## 🔬 Code Samples

See more demos and examples in the `projects/demo` folder.

---

## 🤝 Contributing

Fork the repo and send a Pull Request!

For local development:
```bash
npm install
npm run start
```

---

## 📄 License

MIT

---

> Made with ❤️ by the open-source community
