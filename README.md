# 🚀 ngx-drag-drop-kit

> **Advanced & blazing-fast Angular Drag & Drop Toolkit** — Grid, Sort, Resize, Nesting, and more!

[![npm version](https://img.shields.io/npm/v/ngx-drag-drop-kit?style=flat-square)](https://www.npmjs.com/package/ngx-drag-drop-kit)
[![GitHub stars](https://img.shields.io/github/stars/mr-samani/ngx-drag-drop-kit?style=flat-square)](https://github.com/mr-samani/ngx-drag-drop-kit/stargazers)
[![Sponsor](https://img.shields.io/badge/Sponsor-%E2%9D%A4-red?style=flat-square)](#-support--sponsor)

## [Live Demo](https://mr-samani.github.io/ngx-drag-drop-kit/)

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
- ⚡ **Performance Optimized** and Ultra **lightweight**
- 🧑‍💻 **Fully modular, Angular 18+ ready**
- 🧩 **Modular**: Drag & Drop, Grid, Sortable, Resizable
- ➡️ **AutoDirection**: Auto detect horizontal or vertical or mixed direction

---

## 🔧 Installation

```bash
npm install ngx-drag-drop-kit
```

Or:

```bash
yarn add ngx-drag-drop-kit
```

---

## ⚡ Quick Start

```ts
import { NgxDragDropKitModule } from 'ngx-drag-drop-kit';

@NgModule({
  imports: [NgxDragDropKitModule],
})
export class AppModule {}
```

## Add Style

add ngx-drag-drop-kit style to your style.scss files

```
@use '@node_modules/ngx-drag-drop-kit/assets/styles.css';
```

- or add to styles section in angular.json

---

## 📚 Usage Highlights

### ✅ Basic Drag & Drop

```html
<div ngxDropList [data]="list" (drop)="drop($event)">
  <div ngxDraggable *ngFor="let item of list">{{ item }}</div>
</div>
```

```ts
import { IDropEvent, moveItemInArray, transferArrayItem } from 'ngx-drag-drop-kit';

drop(event: IDropEvent) {
  if (event.previousContainer === event.container) {
    moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
  } else {
    transferArrayItem(event.previousContainer.data, event.container.data, event.previousIndex, event.currentIndex);
  }
}
```

### 🧩 Grid Layout

```ts
import { NgxGridLayoutModule } from 'ngx-drag-drop-kit';

@NgModule({
  imports: [NgxGridLayoutModule],
})
export class AppModule {}
```

```html
<ngx-grid-layout [options]="options">
  <ngx-grid-item *ngFor="let item of layouts" [config]="item.config">{{ item.title }}</grid-item>
</grid-layout>
```

```ts
import { IGridLayoutOptions, GridItemConfig } from 'ngx-drag-drop-kit';

options: IGridLayoutOptions = { cols: 12, gap: 10 };
layouts = [
  { config: new GridItemConfig(0, 0, 2, 2), title: 'Item 1' },
  ...
];
```

### 📏 Resizable

```html
<div ngxResizable [minWidth]="50" [minHeight]="50" (resize)="onResize($event)">Resizable!</div>
```

---

## 🌳 Nested Drag & Drop Tree

Supports multi-level tree-like structures with drag & drop:

```html
<ng-template #tree let-items>
  <div ngxDropList [data]="items" (drop)="drop($event)">
    <div ngxDraggable *ngFor="let item of items">
      {{ item.name }}
      <ng-container *ngIf="item.children">
        <ng-container [ngTemplateOutlet]="tree" [ngTemplateOutletContext]="{ $implicit: item.children }"></ng-container>
      </ng-container>
    </div>
  </div>
</ng-template>
```

---

## 📄 API Summary

| Directive/Component   | Input/Output                | Description             |
| --------------------- | --------------------------- | ----------------------- |
| `ngxDraggable`        | Input                       | Makes element draggable |
|                       | `dragStart`, `dragEnd`      | Drag events             |
| `ngxDropList`         | Input: `[data]`             | Drop zone array         |
|                       | Output: `(drop)`            | Drop event              |
| `ngxResizable`        | `[minWidth]`, `[minHeight]` | Resizing constraints    |
|                       | Output: `(resize)`          | Emits size changes      |
| `NgxGridLayoutComponent` | `options`                   | Grid options            |
| `NgxGridItemComponent`   | `config`                    | Grid item configuration |

---

## 📦 Demos & Examples

See working examples in the [`projects/demo`](./projects/demo) folder.

---

## 💖 Support / Sponsor

Maintaining open-source libraries takes time and energy. If you find this project useful, please consider **supporting me**:

### ☕ One-time Donation

[![BuyMeACoffee](https://img.shields.io/badge/buymeacoffee-donate-yellow?style=flat-square)](https://buymeacoffee.com/mrsamani)

### 🧡 Monthly Sponsorship

[![GitHub Sponsors](https://img.shields.io/badge/GitHub%20Sponsors-Become%20a%20Sponsor-red?logo=github-sponsors&style=flat-square)](https://github.com/sponsors/mr-samani)

### 💸 Crypto Support

You can also support via **Tether (USDT)** or **Bitcoin (BTC)**:

- `BTC: bc1qnhnpn9dtk3det08hkpduv8x9u8rnesujplg0p2`
- `Ethereum: 0x3891395BB3f6c4642f6C7001FDD9113F22065680`
- `TRON: TRJ7a8npXFzkfDLfwsRz2CCH1GWHuuthaJ`
- `TON: UQAejnuN0MUM8zxsbUsLYtCB79gl88NDSGbv6OYzly4h4yfT`

> Message me or create an issue if you want to be listed as a sponsor.

---

## 🤝 Contributing

Pull requests welcome 🙌

```bash
git clone https://github.com/mr-samani/ngx-drag-drop-kit.git
cd ngx-drag-drop-kit
npm install
npm run start
```

---

## 📜 License

MIT — feel free to use & modify.

---

> Built with ❤️ in Iran – by [@mr-samani](https://github.com/mr-samani)
