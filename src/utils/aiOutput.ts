import { escape } from './textUtils';

// Process AI output content, converting references to clickable links
export const processAIOutput = (rawContent: string) => {
  let refCounter = 1;
  const refIdToNumber: Record<string, number> = {};
  const allRefIds: string[] = [];

  const processSingleRef = (refId: string) => {
    const sanitizedRefId = refId.replace(/[^0-9]/g, '');
    if (!sanitizedRefId || sanitizedRefId !== refId) {
      return '';
    }
    if (refIdToNumber[sanitizedRefId] === undefined) {
      refIdToNumber[sanitizedRefId] = refCounter++;
    }
    const refNumber = refIdToNumber[sanitizedRefId];
    return `<a href="#" class="summary-link" data-ref-id="${escape(sanitizedRefId, true)}"><sup>[${refNumber}]</sup></a>`;
  };

  let content = rawContent.replace(/`\[(.*?)\]`/g, '[$1]');

  const collectRefIds = (text: string) => {
    const separateRangePattern = /\[(REF(\d+))\]-\[(REF(\d+))\]/g;
    let match;
    while ((match = separateRangePattern.exec(text)) !== null) {
      const start = parseInt(match[2]);
      const end = parseInt(match[4]);
      if (!isNaN(start) && !isNaN(end)) {
        for (let i = start; i <= end; i++) {
          const refId = i.toString();
          if (!allRefIds.includes(refId)) {
            allRefIds.push(refId);
          }
        }
      }
    }

    const refPattern = /\[(REF[\d,REF\s-]+)\]/g;
    while ((match = refPattern.exec(text)) !== null) {
      const refsStr = match[1];
      const parts = refsStr.split(',');
      parts.forEach(part => {
        part = part.trim();
        if (part.includes('-')) {
          const rangeParts = part.split('-');
          if (rangeParts.length === 2) {
            const start = parseInt(rangeParts[0].replace('REF', ''));
            const end = parseInt(rangeParts[1].replace('REF', ''));
            if (!isNaN(start) && !isNaN(end)) {
              for (let j = start; j <= end; j++) {
                const refId = j.toString();
                if (!allRefIds.includes(refId)) {
                  allRefIds.push(refId);
                }
              }
              return;
            }
          }
        }
        const refId = part.replace('REF', '');
        if (!allRefIds.includes(refId)) {
          allRefIds.push(refId);
        }
      });
    }
  };

  collectRefIds(content);

  allRefIds.forEach(refId => {
    if (refIdToNumber[refId] === undefined) {
      refIdToNumber[refId] = refCounter++;
    }
  });

  const separateRangePattern = /\[(REF(\d+))\]-\[(REF(\d+))\]/g;
  content = content.replace(separateRangePattern, (match, startRef, startId, endRef, endId) => {
    let processedRefs = '';
    const start = parseInt(startId);
    const end = parseInt(endId);
    if (!isNaN(start) && !isNaN(end)) {
      for (let i = start; i <= end; i++) {
        processedRefs += processSingleRef(i.toString());
      }
      return processedRefs;
    }
    return match;
  });

  const refPattern = /\[(REF[\d,REF\s-]+)\]/g;
  let match;
  const matches: Array<{ fullMatch: string; refsStr: string; index: number }> = [];

  while ((match = refPattern.exec(content)) !== null) {
    matches.push({
      fullMatch: match[0],
      refsStr: match[1],
      index: match.index
    });
  }

  for (let i = matches.length - 1; i >= 0; i--) {
    const { fullMatch, refsStr } = matches[i];
    let processedRefs = '';
    const parts = refsStr.split(',');

    parts.forEach(part => {
      part = part.trim();
      if (part.includes('-')) {
        const rangeParts = part.split('-');
        if (rangeParts.length === 2) {
          const start = parseInt(rangeParts[0].replace('REF', ''));
          const end = parseInt(rangeParts[1].replace('REF', ''));
          if (!isNaN(start) && !isNaN(end)) {
            for (let j = start; j <= end; j++) {
              processedRefs += processSingleRef(j.toString());
            }
            return;
          }
        }
      }
      const refId = part.replace('REF', '');
      processedRefs += processSingleRef(refId);
    });

    content = content.replace(fullMatch, processedRefs);
  }

  return content;
};
