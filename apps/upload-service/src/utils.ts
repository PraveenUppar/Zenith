// apps/upload-service/src/utils.ts
export function generateRandomId(): string {
  const subset = "123456789qwertyuiopasdfghjklzxcvbnm";
  const length = 5;
  let id = "";
  for (let i = 0; i < length; i++) {
    id += subset[Math.floor(Math.random() * subset.length)];
  }
  return id;
}
