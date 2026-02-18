import * as fs from "fs";
import * as toml from "toml";

export function safeJsonParse(output: string): any {
    // Some CLI outputs include warnings before the JSON. Try to find the first JSON start.
    const firstBrace = output.indexOf('{');
    const firstBracket = output.indexOf('[');
    let start = -1;
    if (firstBrace !== -1 && firstBracket !== -1) {
        start = Math.min(firstBrace, firstBracket);
    } else {
        start = Math.max(firstBrace, firstBracket);
    }
    const candidate = start > -1 ? output.slice(start) : output;
    try {
        return JSON.parse(candidate);
    } catch {
        // As a fallback, try to strip lines that don't look like JSON
        const lines = output.split('\n').filter(l => l.trim().startsWith('{') || l.trim().startsWith('[') || l.trim().startsWith(']') || l.trim().startsWith('}'));
        const joined = lines.join('\n');
        return JSON.parse(joined);
    }
}

// Helper to update TOML specifically without ruining comments/structure
// "Surgical Force Add" logic from extension.ts
export function surgicalUpdateToml(content: string, section: string, key: string, value: string, quoteValue: boolean): { content: string, changed: boolean } {
    const lines = content.split('\n');
    let sectionIndex = -1;
    let nextSectionIndex = -1;
    let keyIndex = -1;

    // Find section
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line === `[${section}]`) {
            sectionIndex = i;
        } else if (sectionIndex !== -1 && line.startsWith('[') && line.endsWith(']')) {
            nextSectionIndex = i;
            break;
        }
    }

    const formattedValue = quoteValue ? `"${value}"` : value;

    // If section doesn't exist, add it at the end
    if (sectionIndex === -1) {
        lines.push('');
        lines.push(`[${section}]`);
        lines.push(`${key} = ${formattedValue}`);
        return { content: lines.join('\n'), changed: true };
    }

    // Look for key in section
    const endSearch = nextSectionIndex !== -1 ? nextSectionIndex : lines.length;
    for (let i = sectionIndex + 1; i < endSearch; i++) {
        const line = lines[i].trim();
        if (line.startsWith(`${key} =`) || line.startsWith(`${key}=`)) {
            keyIndex = i;
            break;
        }
    }

    if (keyIndex !== -1) {
        // Key exists, update it
        const currentLine = lines[keyIndex];
        // Check if value is different to avoid unnecessary writes
        if (!currentLine.includes(formattedValue)) {
            lines[keyIndex] = `${key} = ${formattedValue}`;
            return { content: lines.join('\n'), changed: true };
        }
        return { content: lines.join('\n'), changed: false };
    } else {
        // Key doesn't exist in section, add it
        lines.splice(sectionIndex + 1, 0, `${key} = ${formattedValue}`);
        return { content: lines.join('\n'), changed: true };
    }
}
