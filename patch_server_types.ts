import fs from 'fs';

const content = fs.readFileSync('server.ts', 'utf-8');
const target = `    const formattedMessages = messages.map((msg: any) => {
      return {
        role: msg.role === "assistant" || msg.role === "model" ? "model" : "user",
        parts: [{ text: msg.text }],
      };
    });`;

const addition = `    const formattedMessages: any[] = messages.map((msg: any) => {
      return {
        role: msg.role === "assistant" || msg.role === "model" ? "model" : "user",
        parts: [{ text: msg.text }],
      };
    });`;

if (content.includes(target)) {
  fs.writeFileSync('server.ts', content.replace(target, addition));
  console.log('Patched server.ts types successfully');
} else {
  console.log('Target not found in server.ts types patch');
}
