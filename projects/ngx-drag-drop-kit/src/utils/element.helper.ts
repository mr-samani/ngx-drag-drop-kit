export abstract class ElementHelper {
  private static collectionHas(a: NodeListOf<Element>, b: ParentNode) {
    //helper function (see below)
    for (var i = 0, len = a.length; i < len; i++) {
      if (a[i] == b) return true;
    }
    return false;
  }
  public static findParentBySelector(elm: HTMLElement, selector: string): HTMLElement | null {
    var all = document.querySelectorAll(selector);
    var cur = elm.parentNode as HTMLElement;
    while (cur && !ElementHelper.collectionHas(all, cur)) {
      //keep going up until you find a match
      cur = cur.parentNode as HTMLElement; //go up
    }
    return cur; //will return null if not found
  }
}
