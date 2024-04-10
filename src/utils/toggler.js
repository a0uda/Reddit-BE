export async function toggler(item, propertyToToggle) {
  item[propertyToToggle] = !item[propertyToToggle];
  await item.save();
}
