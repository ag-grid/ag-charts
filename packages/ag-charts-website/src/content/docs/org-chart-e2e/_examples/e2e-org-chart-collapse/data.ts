export function getData() {
    return [
        { name: 'Henry VII', years: '1457 - 1509', reign: 'King 1485 - 1509', parentId: null },
        { name: 'Arthur Tudor', years: '1486 - 1502', reign: 'Prince of Wales', parent: 'Henry VII' },
        { name: 'Henry VIII', years: '1491 - 1547', reign: 'King 1509 - 1547', parent: 'Henry VII' },
        { name: 'Margaret Tudor', years: '1489 - 1541', reign: 'Queen of Scots', parent: 'Henry VII' },
        { name: 'Mary Tudor', years: '1496 - 1533', reign: 'Queen of France', parent: 'Henry VII' },
        { name: 'Mary I', years: '1516 - 1558', reign: 'Queen 1553-1558', parent: 'Henry VIII' },
        { name: 'Elizabeth I', years: '1533 - 1603', reign: 'Queen 1558 - 1603', parent: 'Henry VIII' },
        { name: 'Edward VI', years: '1537 - 1553', reign: 'King 1547 - 1553', parent: 'Henry VIII' },
        { name: 'James V', years: '1512 - 1542', reign: 'King of Scotland 1513 - 1542', parent: 'Margaret Tudor' },
        { name: 'Mary Stuart', years: '1542 - 1587', reign: 'Queen of Scots', parent: 'James V' },
        { name: 'James VI & I', years: '1566 - 1625', reign: 'King 1603 - 1625', parent: 'Mary Stuart' },
        { name: 'Frances Brandon', years: '1517 - 1559', parent: 'Mary Tudor' },
        { name: 'Lady Jane Grey', years: '1537 - 1554', parent: 'Frances Brandon' },
    ];
}
