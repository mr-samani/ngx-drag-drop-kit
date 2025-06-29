<div align="center">

<h2 style="color:#fff;background:#d32f2f;padding:24px 12px;border-radius:12px;max-width:700px;margin:32px auto 24px auto;font-size:1.3em;">
🚨 <span style="color:#fff;">این کتابخانه فعلاً در <b>نسخه آزمایشی</b> قرار دارد.<br>
<strong>تا انتشار نسخه نهایی، در پروژه‌های اصلی استفاده نکنید.</strong></span> 🚨
</h2>

</div>

# 🚀 ngx-drag-drop-kit

[🇮🇷 مشاهده به فارسی](./README.md) | [🇬🇧 English Version](./README.en.md)

کتابخانه‌ای قدرتمند و ماژولار برای افزودن قابلیت‌های پیشرفته Drag & Drop، Grid Layout، لیست‌های افقی و عمودی، مرتب‌سازی، تغییر اندازه و ... به پروژه‌های Angular.

---

## 🗂️ فهرست مطالب
- [✨ ویژگی‌ها](#-ویژگیها)
- [🔧 نصب](#-نصب)
- [⚡ شروع سریع](#-شروع-سریع)
- [📚 آموزش استفاده](#-آموزش-استفاده)
  - [🎯 Drag & Drop ساده](#drag--drop-ساده)
  - [🧩 Grid Layout](#grid-layout)
  - [📏 تغییر اندازه (Resizable)](#تغییر-اندازه-resizable)
  - [🔄 مرتب‌سازی لیست](#مرتبسازی-لیست)
  - [🌳 درخت تو در تو (Nested Tree Sort)](#درخت-تو-در-تو-nested-tree-sort)
- [📝 جدول ورودی/خروجی‌ها](#-جدول-ورودیخروجیها)
- [🔬 نمونه کد](#-نمونه-کد)
- [🤝 توسعه و مشارکت](#-توسعه-و-مشارکت)
- [📄 لایسنس](#-لایسنس)

---

## ✨ ویژگی‌ها

- 🖱️ **Drag & Drop** پیشرفته با پشتیبانی از چند لیست و جابجایی بین آن‌ها
- 🧩 **Grid Layout** قابل تنظیم و واکنش‌گرا (Responsive)
- 📏 **Resizable**: تغییر اندازه آیتم‌ها با ماوس
- 🔄 **Sortable List**: مرتب‌سازی آیتم‌ها با Drag & Drop
- ➡️ **Horizontal List**: لیست افقی با قابلیت جابجایی
- 🌳 **Nested Tree Sort**: مرتب‌سازی درختی تو در تو
- 🗃️ **Copy to Zone**: کپی آیتم‌ها به ناحیه دیگر
- 🧲 **Snap to Grid**: چسبندگی به شبکه
- 🛡️ **Boundary**: تعیین مرز برای جابجایی و تغییر اندازه
- 🖼️ **Custom Placeholder**: نمایش Placeholder سفارشی هنگام Drag
- ⚡ **Performance Optimized**
- 🧑‍💻 **کاملاً ماژولار و قابل استفاده در پروژه‌های Angular 18+**

---

## 🔧 نصب

```bash
npm install ngx-drag-drop-kit
```
یا با yarn:
```bash
yarn add ngx-drag-drop-kit
```

---

## ⚡ شروع سریع

```typescript
import { NgxDragDropKitModule } from 'ngx-drag-drop-kit';

@NgModule({
  imports: [NgxDragDropKitModule, ...]
})
export class AppModule {}
```

---

## 📚 آموزش استفاده

### 🎯 Drag & Drop ساده

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

### 📏 تغییر اندازه (Resizable)

```html
<div ngxResizable [minWidth]="50" [minHeight]="50" (resize)="onResize($event)">
  قابل تغییر اندازه!
</div>
```

---

### 🔄 مرتب‌سازی لیست

```html
<div ngxDropList [data]="items" (drop)="drop($event)">
  <div ngxDraggable *ngFor="let item of items">{{ item }}</div>
</div>
```

---

### 🌳 درخت تو در تو (Nested Tree Sort)

```html
<nested-tree-sort [data]="treeData" (drop)="onTreeDrop($event)"></nested-tree-sort>
```

---

## 📝 جدول ورودی/خروجی‌ها

| نام           | نوع/دستور              | توضیح مختصر                                 | نوع ورودی/خروجی |
|---------------|------------------------|---------------------------------------------|-----------------|
| `ngxDraggable`| Directive              | دایرکتیو برای Drag آیتم                     | ورودی           |
| `boundary`    | Input (HTMLElement)    | مرز جابجایی                                 | ورودی           |
| `dragStart`   | Output (EventEmitter)  | رویداد شروع Drag                            | خروجی           |
| `dragMove`    | Output (EventEmitter)  | رویداد حرکت آیتم                            | خروجی           |
| `dragEnd`     | Output (EventEmitter)  | رویداد پایان Drag                           | خروجی           |
| `ngxResizable`| Directive              | دایرکتیو برای تغییر اندازه                  | ورودی           |
| `minWidth`    | Input (number)         | حداقل عرض                                    | ورودی           |
| `minHeight`   | Input (number)         | حداقل ارتفاع                                 | ورودی           |
| `resize`      | Output (EventEmitter)  | رویداد تغییر اندازه                         | خروجی           |
| `ngxDropList` | Directive              | دایرکتیو لیست مقصد/مبدا Drag                | ورودی           |
| `data`        | Input (any[])          | داده‌های لیست                                | ورودی           |
| `drop`        | Output (EventEmitter)  | رویداد انداختن آیتم                         | خروجی           |
| `GridLayoutComponent` | Component        | کامپوننت گرید                              | ورودی           |
| `options`     | Input (IGridLayoutOptions) | تنظیمات گرید                            | ورودی           |
| `GridItemComponent`   | Component        | آیتم گرید                                   | ورودی           |
| `config`      | Input (GridItemConfig) | پیکربندی موقعیت و اندازه آیتم                | ورودی           |

---

## 🔬 نمونه کد

دموها و مثال‌های بیشتر را در پوشه `projects/demo` مشاهده کنید.

---

## 🤝 توسعه و مشارکت

پروژه را Fork کنید و Pull Request ارسال نمایید.

برای توسعه محلی:
```bash
npm install
npm run start
```

---

## 📄 لایسنس

MIT

---

> ساخته شده با ❤️ توسط جامعه متن‌باز
