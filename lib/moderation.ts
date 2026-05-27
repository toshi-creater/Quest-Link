export const MAX_CHAT_LENGTH = 1000;

export function validateLength(content: string): boolean {
  return content.length <= MAX_CHAT_LENGTH;
}
