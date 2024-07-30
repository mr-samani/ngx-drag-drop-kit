export function deepMerge(obj1: any, obj2: any) {
  for (let key in obj2) {
    if (obj2.hasOwnProperty(key)) {
      if (obj2[key] instanceof Object && obj1[key] instanceof Object) {
        obj1[key] = deepMerge(obj1[key], obj2[key]);
      } else {
        obj1[key] = obj2[key];
      }
    }
  }
  return obj1;
}
